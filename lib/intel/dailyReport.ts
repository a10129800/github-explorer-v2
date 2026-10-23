import { searchRepositoriesApi } from '@/lib/github/client';
import { RadarRepoItem } from '@/lib/types';
import { safeDbOperation } from '@/lib/db/prisma';

export interface DailyReportSection {
  title: string;
  badge: string;
  description: string;
  items: RadarRepoItem[];
}

export interface GeneratedDailyReport {
  id: string;
  reportDate: string; // "YYYY-MM-DD"
  timezone: string;
  title: string;
  summary: string;
  sections: DailyReportSection[];
  exportMarkdown: string;
  exportJson: string;
  generatedAt: string;
  dataSource: string;
  status: 'completed' | 'generating' | 'failed';
  errorMsg?: string;
}

/**
 * 取得台北時區目前日期字串 (YYYY-MM-DD)
 */
export function getTaipeiDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // Output format: "YYYY-MM-DD"
}

/**
 * 生成 Markdown 格式情報報告
 */
export function formatReportToMarkdown(
  reportDate: string,
  sections: DailyReportSection[],
  generatedAt: string
): string {
  let md = `# 📡 GitHub 開源專案每日情報 (${reportDate})\n\n`;
  md += `> 產生時間：${new Date(generatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} (台北時間)\n`;
  md += `> 數據來源：GitHub REST API 即時採集與本機快照計算\n\n`;

  for (const section of sections) {
    md += `## 📌 ${section.title} (${section.items.length})\n`;
    md += `*${section.description}*\n\n`;

    if (section.items.length === 0) {
      md += `*今日此分類尚無新收錄項目*\n\n`;
      continue;
    }

    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      md += `### ${i + 1}. [${item.fullName}](${item.htmlUrl})\n`;
      md += `- **中文用途**：${item.zhSummary}\n`;
      md += `- **GitHub 數據**：⭐ ${item.stars.toLocaleString()} Stars | 🍴 ${item.forks.toLocaleString()} Forks\n`;
      md += `- **主要語言**：${item.language || '未知'} | **授權**：${item.licenseSpdxId || '未明確聲明'}\n`;
      md += `- **成長速率**：${item.growthRateStr}\n`;
      md += `- **Demo 狀態**：${item.demo.verificationStatus === 'verified' && item.demo.url ? `[官方 Demo 連結](${item.demo.url})` : '無線上 Demo'}\n`;
      md += `- **費用與硬體**：${item.cost.requiresGpu ? '需獨立 GPU' : '一般 CPU 可執行'} | ${item.cost.isOpenSourceApproved ? '開源可自架' : '需檢視授權'}\n\n`;
    }
    md += `---\n\n`;
  }

  md += `\n*本報告由 GitHub Explorer V2 自動彙整，數據嚴格遵循真實性原則，零捏造成長數值。*\n`;
  return md;
}

/**
 * 彙整或產生當日開源情報
 */
export async function generateDailyIntelReport(forceRegenerate = false): Promise<GeneratedDailyReport> {
  const reportDate = getTaipeiDateString();
  const executionId = `intel-${reportDate}-${forceRegenerate ? Date.now() : 'standard'}`;

  // 1. 若非強制重算，先嘗試自 SQLite 資料庫讀取當日已產生之報告
  if (!forceRegenerate) {
    const existing = await safeDbOperation<GeneratedDailyReport | null>(async (db) => {
      const record = await db.dailyReport.findUnique({
        where: { reportDate },
      });
      if (record && record.status === 'completed') {
        const parsedContent = JSON.parse(record.contentJson);
        return {
          id: record.id,
          reportDate: record.reportDate,
          timezone: record.timezone,
          title: record.title,
          summary: record.summary || '',
          sections: parsedContent.sections || [],
          exportMarkdown: record.contentMd || '',
          exportJson: record.contentJson,
          generatedAt: record.generatedAt.toISOString(),
          dataSource: record.dataSource,
          status: 'completed',
        };
      }
      return null;
    }, null);

    if (existing) {
      return existing;
    }
  }

  // 2. 透過 GitHub Search API 獲取今日熱門、新興與 AI 分類資料
  const now = new Date();
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // (A) 熱門專案 (近 7 天推播且 Stars > 200)
  const hotRes = await searchRepositoriesApi(`pushed:>${past7Days} stars:>200`, 'stars', 'desc', 1, 8);
  // (B) 新興專案 (近 30 天內剛建立但 Stars 快速爬升)
  const emergingRes = await searchRepositoriesApi(`created:>${past30Days} stars:>50`, 'stars', 'desc', 1, 8);
  // (C) AI 專區
  const aiRes = await searchRepositoriesApi(`pushed:>${past7Days} topic:ai OR topic:llm OR topic:diffusion`, 'stars', 'desc', 1, 8);
  // (D) 有 Demo 專區
  const demoCandidates = [...hotRes.items, ...emergingRes.items, ...aiRes.items].filter(
    (item) => Boolean(item.demo.url) && (item.demo.verificationStatus === 'verified' || item.demo.verificationStatus === 'found_unverified' || item.demo.verificationStatus === 'unverified')
  );
  // 去除重複
  const seenMap = new Set<string>();
  const uniqueDemos = demoCandidates.filter((d) => {
    if (seenMap.has(d.fullName)) return false;
    seenMap.add(d.fullName);
    return true;
  }).slice(0, 8);

  const sections: DailyReportSection[] = [
    {
      title: '今日值得注意的熱門專案',
      badge: 'HOT TREND',
      description: '近期活躍推播、社群討論度高之熱門開源專案',
      items: hotRes.items.slice(0, 6),
    },
    {
      title: '本月新興潛力星 (Rising Stars)',
      badge: 'EMERGING',
      description: '近期剛建立即迅速累積社群關注的創新專案',
      items: emergingRes.items.slice(0, 6),
    },
    {
      title: '開源 AI 工具專區',
      badge: 'AI TOOLS',
      description: '涵蓋語言模型、多模態生圖、影音合成之最新開源 AI 工具',
      items: aiRes.items.slice(0, 6),
    },
    {
      title: '具備線上 Demo 免安裝體驗專區',
      badge: 'PLAYABLE',
      description: '提供經官方認證或線上展示入口之專案，無須本機安裝環境即可試玩',
      items: uniqueDemos.slice(0, 6),
    },
  ];

  const totalProjects = sections.reduce((acc, s) => acc + s.items.length, 0);
  const summary = `今日共彙整 ${totalProjects} 個值得探索的高潛力與活躍開源專案，涵蓋熱門趨勢、新興潛力專案、AI 生成技術與可免安裝直接試玩之項目。`;
  const generatedAt = new Date().toISOString();
  const exportMarkdown = formatReportToMarkdown(reportDate, sections, generatedAt);
  const contentJson = JSON.stringify({ sections, summary, reportDate });

  // 3. 寫入 SQLite 快照防止重複執行
  await safeDbOperation(async (db) => {
    await db.dailyReport.upsert({
      where: { reportDate },
      create: {
        reportDate,
        timezone: 'Asia/Taipei',
        title: `GitHub 開源專案每日情報 (${reportDate})`,
        summary,
        contentJson,
        contentMd: exportMarkdown,
        dataSource: 'github-rest-api-velocity',
        generatedAt: new Date(),
        status: 'completed',
        executionId,
      },
      update: {
        summary,
        contentJson,
        contentMd: exportMarkdown,
        generatedAt: new Date(),
        status: 'completed',
        executionId,
      },
    });
  }, null);

  return {
    id: executionId,
    reportDate,
    timezone: 'Asia/Taipei',
    title: `GitHub 開源專案每日情報 (${reportDate})`,
    summary,
    sections,
    exportMarkdown,
    exportJson: contentJson,
    generatedAt,
    dataSource: 'github-rest-api-velocity',
    status: 'completed',
  };
}
