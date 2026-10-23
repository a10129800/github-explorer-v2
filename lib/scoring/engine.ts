import { 
  TrendScoreBreakdown, 
  TrendProfile, 
  RepositorySnapshotData 
} from '@/lib/types';

interface ScorerInput {
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  pushedAt: string;
  hasDemo: boolean;
  isDemoVerified: boolean;
  isOpenSourceApproved: boolean;
  hasLicense: boolean;
  snapshots?: RepositorySnapshotData[];
}

interface ScorerOutput {
  scores: TrendScoreBreakdown;
  profile: TrendProfile;
  reasons: string[];
  recentGrowth: number | null;
  growthStr: string;
}

/**
 * 趨勢與探索價值評分計算引擎
 * 特點：嚴格禁止偽造成長數值，有真實多快照才計算 growthScore，否則顯示資料不足
 */
export function calculateTrendScores(input: ScorerInput): ScorerOutput {
  const reasons: string[] = [];
  const now = Date.now();
  const createdDate = new Date(input.createdAt).getTime();
  const pushedDate = new Date(input.pushedAt).getTime();

  const daysSinceCreation = Math.max(1, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)));
  const daysSincePush = Math.max(0, Math.floor((now - pushedDate) / (1000 * 60 * 60 * 24)));

  // 1. Popularity Score (0-100)
  let popularityScore = 0;
  if (input.stars > 0) {
    // 依對數等級：10 stars ~ 20分, 100 stars ~ 40分, 1000 stars ~ 60分, 10000+ stars ~ 80-100分
    const starBase = Math.min(85, Math.log10(input.stars) * 20);
    const forkFactor = Math.min(15, (input.forks / (input.stars || 1)) * 30);
    popularityScore = Math.min(100, Math.round(starBase + forkFactor));
  }

  // 2. Growth Score (0-100) 與真實增量計算
  let growthScore: number | null = null;
  let recentGrowth: number | null = null;
  let growthStr = '尚無歷史快照資料';

  if (input.snapshots && input.snapshots.length >= 2) {
    // 排序快照 (舊 -> 新)
    const sorted = [...input.snapshots].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    );
    const oldest = sorted[0];
    const latest = sorted[sorted.length - 1];
    const starDelta = latest.stars - oldest.stars;
    const timeDeltaHours = Math.max(1, (new Date(latest.capturedAt).getTime() - new Date(oldest.capturedAt).getTime()) / (1000 * 3600));

    recentGrowth = starDelta;
    if (starDelta > 0) {
      growthStr = `+${starDelta} (於過去 ${Math.round(timeDeltaHours)} 小時觀測)`;
      // 根據增量與基數評估成長速度
      const velocity = (starDelta / timeDeltaHours) * 24; // 換算日增長
      growthScore = Math.min(100, Math.round(Math.min(95, Math.log10(Math.max(1, velocity)) * 30 + 20)));
      reasons.push(`快照實測：近期間觀測到 +${starDelta} Stars 實質增長`);
    } else {
      growthStr = `穩定持平 (${starDelta})`;
      growthScore = 30;
      reasons.push('快照記錄：Star 數保持穩定無顯著波動');
    }
  } else {
    // 資料不足，嚴格不偽造
    reasons.push('歷史快照資料積累中：目前僅有單一觀測點，不標記確定增長速度');
  }

  // 3. Freshness Score (0-100) - 專案新鮮度
  let freshnessScore = 0;
  if (daysSinceCreation <= 30) {
    freshnessScore = 100;
    reasons.push('萌芽期新星：誕生未滿 30 天');
  } else if (daysSinceCreation <= 90) {
    freshnessScore = 80;
    reasons.push('新興專案：近 3 個月內創立');
  } else if (daysSinceCreation <= 365) {
    freshnessScore = 55;
  } else {
    freshnessScore = 30;
  }

  // 4. Maintenance Score (0-100) - 維護活躍度
  let maintenanceScore = 0;
  if (daysSincePush <= 7) {
    maintenanceScore = 95;
    reasons.push('極度活躍：本週內持續有程式碼 Push 提交');
  } else if (daysSincePush <= 30) {
    maintenanceScore = 80;
    reasons.push('近期維護：30 天內有開發動態');
  } else if (daysSincePush <= 90) {
    maintenanceScore = 55;
  } else if (daysSincePush <= 365) {
    maintenanceScore = 30;
    reasons.push('維護頻率一般：一年內有更新');
  } else {
    maintenanceScore = 10;
    reasons.push('警示：專案已超過一年未更新，可能已處於維護停滯狀態');
  }

  // 5. Demo Score (0-100) - 體驗便利性
  let demoScore = 0;
  if (input.isDemoVerified) {
    demoScore = 95;
    reasons.push('線上試玩就緒：已確認官方可直接操作體驗的 Demo');
  } else if (input.hasDemo) {
    demoScore = 70;
    reasons.push('具備線上展示連結（未全量自動驗證，但有可用入口）');
  } else {
    demoScore = 20;
  }

  // 6. Open Source Score (0-100) - 授權與社群規範完整度
  let openSourceScore = 0;
  if (input.isOpenSourceApproved) {
    openSourceScore = 95;
    reasons.push('正規開源：具備標準 OSI 認證授權條款');
  } else if (input.hasLicense) {
    openSourceScore = 65;
    reasons.push('具備宣告授權，非 OSI 標準');
  } else {
    openSourceScore = 25;
    reasons.push('未宣告開源授權（使用或改寫需謹慎）');
  }

  // 7. Discovery Score (0-100) - 綜合探索價值
  // 鼓勵「冷門但是活躍、可玩、有潛力」的作品
  const isNiche = input.stars >= 30 && input.stars <= 3500;
  let discoveryBonus = 0;
  if (isNiche) {
    discoveryBonus = 20;
    reasons.push('冷門潛力加分：Stars 數適中，具備高挖掘驚喜感');
  }

  const rawDiscovery = 
    (freshnessScore * 0.2) +
    (maintenanceScore * 0.25) +
    (demoScore * 0.25) +
    (openSourceScore * 0.15) +
    discoveryBonus +
    ((growthScore ?? 40) * 0.15);
  
  const discoveryScore = Math.min(100, Math.round(rawDiscovery));

  // 8. 判定專案輪廓標籤 (TrendProfile)
  let profile: TrendProfile = 'hot-stable';
  if (growthScore !== null && growthScore >= 75) {
    profile = 'fast-rising';
  } else if (daysSinceCreation <= 90 && input.stars >= 50) {
    profile = 'emerging-potential';
  } else if (input.hasDemo && demoScore >= 70) {
    profile = 'playable-demo';
  } else if (isNiche && discoveryScore >= 70) {
    profile = 'hidden-gem';
  } else if (maintenanceScore >= 80) {
    profile = 'active-maintenance';
  } else {
    profile = 'hot-stable';
  }

  return {
    scores: {
      popularityScore,
      growthScore,
      freshnessScore,
      maintenanceScore,
      demoScore,
      openSourceScore,
      discoveryScore,
    },
    profile,
    reasons,
    recentGrowth,
    growthStr,
  };
}
