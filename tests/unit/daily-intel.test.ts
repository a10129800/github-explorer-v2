import { describe, it, expect } from 'vitest';
import { getTaipeiDateString, formatReportToMarkdown } from '@/lib/intel/dailyReport';

describe('Daily Intel Engine & Asia/Taipei Timezone', () => {
  it('formats dates in YYYY-MM-DD pattern in Asia/Taipei timezone', () => {
    const testDate = new Date('2026-10-22T04:00:00Z'); // 12:00 PM in Taipei
    const dateStr = getTaipeiDateString(testDate);
    expect(dateStr).toBe('2026-10-22');
  });

  it('formats Markdown export cleanly with section headers', () => {
    const md = formatReportToMarkdown(
      '2026-10-22',
      [
        {
          title: '熱門專案',
          badge: 'HOT',
          description: '熱門開源專案',
          items: [],
        },
      ],
      '2026-10-22T08:00:00.000Z'
    );

    expect(md).toContain('# 📡 GitHub 開源專案每日情報 (2026-10-22)');
    expect(md).toContain('熱門專案');
    expect(md).toContain('今日此分類尚無新收錄項目');
  });
});
