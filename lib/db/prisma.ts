import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return process.env.DATABASE_URL;
  }
  // 當環境中未注入 DATABASE_URL 時 (如靜態分析或建置打包過程)，提供預設隔離路徑，
  // 避免 Prisma 初始化時拋出 Environment variable not found: DATABASE_URL 錯誤，
  // 且絕不觸碰使用者於 Electron APPDATA 中的正式生產資料庫。
  return 'file:./dev.db';
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

// 採用 Proxy 實現懶加載 (Lazy Initialization)
// 確保模組被載入時不會提前初始化連線，僅在真正發起資料庫呼叫時才建立實例
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Repository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" INTEGER UNIQUE,
    "fullName" TEXT NOT NULL UNIQUE,
    "ownerLogin" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "homepage" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "language" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "pushedAt" DATETIME NOT NULL,
    "licenseSpdxId" TEXT,
    "topics" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT 0,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "RepositorySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stars" INTEGER NOT NULL,
    "forks" INTEGER NOT NULL,
    "openIssues" INTEGER NOT NULL,
    "trendSource" TEXT,
    "trendRank" INTEGER,
    FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "DemoLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "DemoResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "demoType" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT 1,
    "evidenceSource" TEXT NOT NULL,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkError" TEXT,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ProjectEnrichment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "aiCategory" TEXT,
    "freeType" TEXT,
    "windowsCompatibility" TEXT,
    "hardwareSummary" TEXT,
    "installDifficulty" TEXT,
    "zhExplanation" TEXT,
    "explanationMode" TEXT,
    "sourceEvidence" TEXT,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'want-to-try',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_repositoryId_key" ON "Favorite"("repositoryId")`,
  `CREATE TABLE IF NOT EXISTS "SearchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "filters" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportDate" TEXT NOT NULL UNIQUE,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentJson" TEXT NOT NULL,
    "contentMd" TEXT,
    "dataSource" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMsg" TEXT,
    "executionId" TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS "ResearchReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userQuery" TEXT NOT NULL,
    "searchFilter" TEXT,
    "candidateIds" TEXT NOT NULL,
    "resultsJson" TEXT NOT NULL,
    "analysisMode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "UserHardwareProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "os" TEXT NOT NULL DEFAULT 'Windows 11',
    "cpuArch" TEXT NOT NULL DEFAULT 'x64',
    "ramGb" INTEGER NOT NULL DEFAULT 16,
    "gpuType" TEXT NOT NULL DEFAULT 'NVIDIA',
    "vramGb" INTEGER NOT NULL DEFAULT 8,
    "hasWsl2" BOOLEAN NOT NULL DEFAULT 1,
    "hasDocker" BOOLEAN NOT NULL DEFAULT 1,
    "hasPython" BOOLEAN NOT NULL DEFAULT 1,
    "hasNode" BOOLEAN NOT NULL DEFAULT 1,
    "freeDiskGb" INTEGER NOT NULL DEFAULT 50,
    "targetIntent" TEXT NOT NULL DEFAULT 'play',
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "githubToken" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`
];

let schemaEnsured = false;

async function ensureSchemaIfMissing(client: PrismaClient) {
  if (schemaEnsured) return;
  try {
    for (const sql of DDL_STATEMENTS) {
      await client.$executeRawUnsafe(sql);
    }
    schemaEnsured = true;
    console.log('[Database] SQLite 結構校驗/初始建立完成');
  } catch (err) {
    console.warn('[Database] 結構校驗警示 (非致命):', (err as Error).message);
  }
}

/**
 * 安全執行資料庫操作輔助工具
 * 若 SQLite 資料庫檔案剛建立且尚無資料表，自動執行 IF NOT EXISTS 建表並重試，絕不破壞既有資料
 */
export async function safeDbOperation<T>(
  operation: (db: PrismaClient) => Promise<T>,
  fallbackValue: T
): Promise<T> {
  const client = getPrismaClient();
  try {
    return await operation(client);
  } catch (error: any) {
    const errorMsg = String(error?.message || '');
    // 偵測是否為 SQLite 尚未建表錯誤 (如: no such table)
    if (errorMsg.includes('no such table') || errorMsg.includes('The table') || errorMsg.includes('does not exist')) {
      console.log('[Database] 偵測到資料庫表格尚未建立，正在執行結構初始化...');
      await ensureSchemaIfMissing(client);
      try {
        return await operation(client);
      } catch (retryError) {
        console.warn('[Database] 重試操作失敗，採用降級方案:', (retryError as Error).message);
        return fallbackValue;
      }
    }

    console.warn('[Database] 操作未完成或發生錯誤，採用降級方案:', errorMsg);
    return fallbackValue;
  }
}


