import { searchRepositoriesApi } from '@/lib/github/client';
import { RadarRepoItem } from '@/lib/types';

export interface SimilarRepoRecommendation {
  repo: RadarRepoItem;
  similarityScore: number; // 0 ~ 100
  similarityLevel: '極高相似' | '高相似度' | '功能相近' | '同技術棧';
  similarityReasons: string[];
  keyDifferences: string[];
}

/**
 * 計算兩組 Topics 的 Jaccard 相似係數
 */
function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionSize = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersectionSize++;
  });
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * 提取文本關鍵字 Token
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * 依據專案特徵尋找並推薦相似的開源專案
 */
export async function findSimilarRepositories(
  currentRepo: RadarRepoItem,
  limit = 5
): Promise<SimilarRepoRecommendation[]> {
  const currentTopics = new Set(currentRepo.topics.map((t) => t.toLowerCase()));
  const currentTokens = tokenize(`${currentRepo.name} ${currentRepo.description || ''}`);

  // 1. 組合搜尋查詢詞 (依據 Topics 與核心語言)
  const topTopics = currentRepo.topics.slice(0, 3);
  let searchQuery = '';

  if (topTopics.length > 0) {
    searchQuery = topTopics.map((t) => `topic:${t}`).join(' ');
  } else if (currentRepo.language) {
    searchQuery = `language:${currentRepo.language} ${currentRepo.name.replace(/[-_]/g, ' ')}`;
  } else {
    searchQuery = currentRepo.name.replace(/[-_]/g, ' ');
  }

  // 2. 呼叫 GitHub Search API
  const searchResult = await searchRepositoriesApi(searchQuery, 'stars', 'desc', 1, 15);

  // 3. 過濾掉本專案自身
  const candidates = searchResult.items.filter((item) => item.fullName !== currentRepo.fullName);

  if (candidates.length === 0) {
    return [];
  }

  // 4. 計算多維相似度
  const results: SimilarRepoRecommendation[] = [];

  for (const candidate of candidates) {
    const candTopics = new Set(candidate.topics.map((t) => t.toLowerCase()));
    const candTokens = tokenize(`${candidate.name} ${candidate.description || ''}`);

    const topicSim = calculateJaccardSimilarity(currentTopics, candTopics);
    const textSim = calculateJaccardSimilarity(currentTokens, candTokens);
    const sameLanguage = currentRepo.language && candidate.language && currentRepo.language === candidate.language;

    // 加權相似度評分 (0 ~ 100)
    let score = Math.round(topicSim * 45 + textSim * 35 + (sameLanguage ? 20 : 0));
    if (score > 98) score = 98; // 不過度承諾 100%
    if (score < 25) score = 30; // 基本相關性底線

    const reasons: string[] = [];
    const diffs: string[] = [];

    // 相似原因
    if (topicSim > 0.3) reasons.push('共享多個核心技術標籤 (Topics)');
    if (sameLanguage) reasons.push(`同樣採用 ${currentRepo.language} 開發生態`);
    if (textSim > 0.2) reasons.push('專案目標與解決的問題領域高度重疊');
    if (candidate.demo.verificationStatus === 'verified' && currentRepo.demo.verificationStatus === 'verified') {
      reasons.push('兩者均提供免安裝線上 Demo');
    }
    if (reasons.length === 0) reasons.push('屬於相似架構或同領域之開源替代工具');

    // 主要差異
    const starDiff = candidate.stars - currentRepo.stars;
    if (Math.abs(starDiff) > 1000) {
      diffs.push(starDiff > 0 ? `星數多出 ${starDiff.toLocaleString()} Stars，社群規模更大` : `星數相對輕量，架構可能更簡潔`);
    }
    if (candidate.licenseSpdxId !== currentRepo.licenseSpdxId) {
      diffs.push(`授權條款不同 (本專案: ${currentRepo.licenseSpdxId || '未明確'}, 推薦專案: ${candidate.licenseSpdxId || '未明確'})`);
    }
    if (candidate.cost.requiresGpu !== currentRepo.cost.requiresGpu) {
      diffs.push(candidate.cost.requiresGpu ? '該專案需要獨立 GPU 運算' : '該專案對硬體算力門檻較低');
    }
    if (diffs.length === 0) diffs.push('實作細節與模組化拆分邏輯略有差異');

    let similarityLevel: '極高相似' | '高相似度' | '功能相近' | '同技術棧' = '功能相近';
    if (score >= 80) similarityLevel = '極高相似';
    else if (score >= 60) similarityLevel = '高相似度';
    else if (sameLanguage && score >= 40) similarityLevel = '同技術棧';

    results.push({
      repo: candidate,
      similarityScore: score,
      similarityLevel,
      similarityReasons: reasons,
      keyDifferences: diffs,
    });
  }

  // 排序並返回前 N 筆
  results.sort((a, b) => b.similarityScore - a.similarityScore);
  return results.slice(0, limit);
}
