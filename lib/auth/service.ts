import crypto from 'crypto';
import { safeDbOperation } from '@/lib/db/prisma';

const AUTH_SECRET = process.env.AUTH_SECRET || 'github-explorer-v2-super-secret-key-2026';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  hasGithubToken: boolean;
  role: string;
}

/**
 * 使用 Node 內建 PBKDF2 安全雜湊密碼 (無任何 C++ 編譯套件依賴)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, originalHash] = combinedHash.split(':');
    if (!salt || !originalHash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * 簽署簡單安全 Session Token
 */
export function generateSessionToken(payload: { id: string; username: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { id: string; username: string } | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return { id: payload.id, username: payload.username };
  } catch {
    return null;
  }
}

/**
 * 記憶體會話快取 (防止在尚未完成 db push 時資料庫不可用)
 */
const inMemoryUsers: Map<string, any> = new Map();

/**
 * 註冊新帳號
 */
export async function registerUser(username: string, password: string, email?: string): Promise<{ user: AuthUser; token: string }> {
  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) throw new Error('使用者名稱長度至少需 3 個字元');
  if (password.length < 6) throw new Error('密碼長度至少需 6 個字元');

  const passwordHash = hashPassword(password);

  const createdUser = await safeDbOperation(async (db) => {
    // 檢查是否已存在
    const existing = await db.user.findFirst({
      where: { OR: [{ username: cleanUsername }, ...(email ? [{ email }] : [])] },
    });
    if (existing) {
      throw new Error('此使用者名稱或電子信箱已被註冊');
    }

    const u = await db.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        email: email?.trim() || null,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanUsername)}`,
      },
    });

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      avatarUrl: u.avatarUrl,
      hasGithubToken: Boolean(u.githubToken),
      role: u.role,
    };
  }, null);

  // 降級防護 (若 SQLite 還未遷移)
  let user: AuthUser;
  if (!createdUser) {
    if (inMemoryUsers.has(cleanUsername)) {
      throw new Error('此使用者名稱已被註冊');
    }
    const memUser = {
      id: `mem-${Date.now()}`,
      username: cleanUsername,
      email: email || null,
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanUsername)}`,
      hasGithubToken: false,
      role: 'user',
    };
    inMemoryUsers.set(cleanUsername, memUser);
    user = {
      id: memUser.id,
      username: memUser.username,
      email: memUser.email,
      avatarUrl: memUser.avatarUrl,
      hasGithubToken: false,
      role: 'user',
    };
  } else {
    user = createdUser;
  }

  const token = generateSessionToken({ id: user.id, username: user.username });
  return { user, token };
}

/**
 * 一般帳號密碼登入 (若首次使用自動無縫註冊並登入)
 */
export async function loginUser(username: string, password: string): Promise<{ user: AuthUser; token: string; isNewAccount?: boolean }> {
  const cleanUsername = username.trim();
  if (!cleanUsername) throw new Error('請輸入帳號或電子信箱');
  if (!password) throw new Error('請輸入密碼 (至少 6 個字元)');

  const dbUser = await safeDbOperation(async (db) => {
    return await db.user.findFirst({
      where: { OR: [{ username: cleanUsername }, { email: cleanUsername }] },
    });
  }, null);

  let targetUser = dbUser;
  if (!targetUser) {
    targetUser = inMemoryUsers.get(cleanUsername) || null;
    if (!targetUser) {
      for (const u of Array.from(inMemoryUsers.values())) {
        if (u.email === cleanUsername || u.username === cleanUsername) {
          targetUser = u;
          break;
        }
      }
    }
  }

  // 若帳號不存在，自動為使用者完成首次帳號建立並登入！
  if (!targetUser) {
    const isEmail = cleanUsername.includes('@');
    const uName = isEmail ? cleanUsername.split('@')[0] : cleanUsername;
    const uEmail = isEmail ? cleanUsername : undefined;
    const registered = await registerUser(uName, password, uEmail);
    return { ...registered, isNewAccount: true };
  }

  const isValid = verifyPassword(password, targetUser.passwordHash);
  if (!isValid) {
    throw new Error('密碼錯誤，請重新輸入');
  }

  const user: AuthUser = {
    id: targetUser.id,
    username: targetUser.username,
    email: targetUser.email,
    avatarUrl: targetUser.avatarUrl,
    hasGithubToken: Boolean(targetUser.githubToken),
    role: targetUser.role,
  };

  const token = generateSessionToken({ id: user.id, username: user.username });
  return { user, token, isNewAccount: false };
}

/**
 * 透過 GitHub Personal Access Token 快速驗證並登入
 * 自動向 GitHub 請求獲取使用者暱稱與頭像，並儲存 Token
 */
export async function loginWithGitHubToken(githubToken: string): Promise<{ user: AuthUser; token: string }> {
  const cleanToken = githubToken.trim();
  if (!cleanToken.startsWith('ghp_') && !cleanToken.startsWith('github_pat_')) {
    throw new Error('請提供標準格式的 GitHub Token (通常以 ghp_ 開頭)');
  }

  // 1. 向 GitHub 官方驗證 Token 並獲取使用者資料
  const ghRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Explorer-V2-Auth',
    },
  });

  if (!ghRes.ok) {
    throw new Error('GitHub Token 驗證失敗，請確認 Token 是否有效且尚未過期');
  }

  const ghProfile = await ghRes.json();
  const username = ghProfile.login || `gh_user_${Date.now()}`;
  const avatarUrl = ghProfile.avatar_url || null;
  const email = ghProfile.email || null;

  // 2. 存入資料庫或記憶體
  const userRecord = await safeDbOperation(async (db) => {
    return await db.user.upsert({
      where: { username },
      create: {
        username,
        email,
        avatarUrl,
        passwordHash: hashPassword(cleanToken.slice(0, 10)),
        githubToken: cleanToken,
        role: 'user',
      },
      update: {
        avatarUrl,
        githubToken: cleanToken,
      },
    });
  }, null);

  const user: AuthUser = {
    id: userRecord ? userRecord.id : `gh-${username}`,
    username,
    email,
    avatarUrl,
    hasGithubToken: true,
    role: 'user',
  };

  // 寫入 process.env 提升目前進程的配額
  process.env.GITHUB_TOKEN = cleanToken;

  const token = generateSessionToken({ id: user.id, username: user.username });
  return { user, token };
}

/**
 * 取得當前已登入使用者資料
 */
export async function getCurrentUserFromToken(tokenString: string): Promise<AuthUser | null> {
  const verified = verifySessionToken(tokenString);
  if (!verified) return null;

  const dbUser = await safeDbOperation(async (db) => {
    return await db.user.findUnique({
      where: { id: verified.id },
    });
  }, null);

  if (dbUser) {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      avatarUrl: dbUser.avatarUrl,
      hasGithubToken: Boolean(dbUser.githubToken),
      role: dbUser.role,
    };
  }

  const memUser = inMemoryUsers.get(verified.username);
  if (memUser) {
    return {
      id: memUser.id,
      username: memUser.username,
      email: memUser.email,
      avatarUrl: memUser.avatarUrl,
      hasGithubToken: Boolean(memUser.githubToken),
      role: memUser.role,
    };
  }

  return null;
}
