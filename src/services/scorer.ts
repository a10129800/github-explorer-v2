import { GithubRepo, TreasureMetrics } from '../types';

/**
 * 專案評分與寶藏度評估演算法
 * 特色：真實數據驅動、透明公開、可解釋的雙軌評分（熱門度 vs 探索價值）
 */
export function calculateTreasureMetrics(repo: GithubRepo): TreasureMetrics {
  const reasons: string[] = [];
  const stars = repo.stargazers_count;
  const forks = repo.forks_count;
  const hasDemo = Boolean(repo.homepage && repo.homepage.trim().length > 0 && repo.homepage.startsWith('http'));
  const updatedAt = new Date(repo.pushed_at || repo.updated_at);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)));

  // 1. 熱門度計算 (Popularity Score: 0 - 100)
  // 採用對數尺度 Log10 計算 Star 與 Fork 的實際大眾普及程度
  let popularityScore = 0;
  if (stars > 0) {
    // 10 stars ~ 25分, 100 stars ~ 50分, 1,000 stars ~ 75分, 10,000+ stars ~ 90-100分
    const starScore = Math.min(80, Math.log10(stars) * 20);
    const forkScore = Math.min(20, (forks / (stars || 1)) * 40);
    popularityScore = Math.min(100, Math.round(starScore + forkScore));
  }

  // 2. 探索價值各項維度計算 (Treasure Score: 0 - 100)
  // A. 維護活躍度 (0 - 25)
  let freshnessScore = 0;
  if (diffDays <= 14) {
    freshnessScore = 25;
    reasons.push('極度活躍：近兩週內持續更新與維護');
  } else if (diffDays <= 45) {
    freshnessScore = 20;
    reasons.push('近期活躍：45 天內有代碼提交');
  } else if (diffDays <= 120) {
    freshnessScore = 14;
    reasons.push('狀態良好：數月內仍有更新');
  } else if (diffDays <= 365) {
    freshnessScore = 8;
    reasons.push('維護頻率一般：一年內有更新');
  } else {
    freshnessScore = 2;
    reasons.push('專案可能已停滯：超過一年未更新');
  }

  // B. 即時體驗與展示 (0 - 25)
  let usabilityScore = 0;
  if (hasDemo) {
    usabilityScore = 25;
    reasons.push('提供可操作的線上 Demo 或官方網站');
  } else if (repo.has_pages) {
    usabilityScore = 18;
    reasons.push('啟用 GitHub Pages 展示專案');
  } else {
    usabilityScore = 8;
  }

  // C. 文件與標籤規範 (0 - 25)
  let docScore = 0;
  const descLength = repo.description ? repo.description.trim().length : 0;
  if (descLength > 40) {
    docScore += 12;
  } else if (descLength > 10) {
    docScore += 6;
  }

  const topicCount = repo.topics ? repo.topics.length : 0;
  if (topicCount >= 4) {
    docScore += 9;
    reasons.push(`主題清晰：具備 ${topicCount} 個標籤分類`);
  } else if (topicCount >= 1) {
    docScore += 5;
  }

  if (repo.license) {
    docScore += 4;
    reasons.push(`開源授權明確：${repo.license.spdx_id || repo.license.name}`);
  }

  // D. 寶藏驚喜度與潛力 (0 - 25)
  // 如果 Star 在 30 ~ 3,500 之間，且非單純 Fork，最具挖掘驚喜感
  let surpriseScore = 0;
  const isNiche = stars >= 30 && stars <= 3500;
  if (isNiche) {
    surpriseScore += 18;
    reasons.push(`冷門寶藏潛力：Star (${stars.toLocaleString()}) 未過度飽和，具有探勘價值`);
  } else if (stars < 30) {
    surpriseScore += 8;
    reasons.push('新興萌芽階段：Star 較少，適合作為先鋒探索');
  } else if (stars <= 10000) {
    surpriseScore += 12;
    reasons.push('口碑成熟社群：具備相當社群基底');
  } else {
    surpriseScore += 5; // 超大主流專案探索驚喜感較低
    reasons.push('殿堂級主流開源專案');
  }

  if (!repo.fork) {
    surpriseScore += 7; // 原創獨立專案加分
  }

  const treasureScore = Math.min(100, freshnessScore + usabilityScore + docScore + surpriseScore);

  // 判斷徽章分類
  let badge = {
    label: '優質專案',
    color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40',
    icon: 'Sparkles'
  };

  if (isNiche && treasureScore >= 75) {
    badge = {
      label: '冷門神作',
      color: 'border-amber-500/50 text-amber-300 bg-amber-950/50',
      icon: 'Crown'
    };
  } else if (diffDays <= 30 && stars >= 100 && stars <= 2000) {
    badge = {
      label: '潛力黑馬',
      color: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/50',
      icon: 'Rocket'
    };
  } else if (stars >= 12000) {
    badge = {
      label: '熱門主流',
      color: 'border-purple-500/50 text-purple-300 bg-purple-950/50',
      icon: 'Flame'
    };
  } else if (hasDemo) {
    badge = {
      label: '在線可玩',
      color: 'border-blue-500/50 text-blue-300 bg-blue-950/50',
      icon: 'Play'
    };
  } else if (treasureScore >= 70) {
    badge = {
      label: '實用工具',
      color: 'border-teal-500/50 text-teal-300 bg-teal-950/50',
      icon: 'Wrench'
    };
  }

  return {
    popularityScore,
    treasureScore,
    badge,
    reasons,
    breakdown: {
      freshness: freshnessScore,
      community: Math.round(popularityScore / 4),
      documentation: docScore,
      usability: usabilityScore
    },
    hasDemo,
    isFresh: diffDays <= 45,
    isNiche
  };
}
