import { test, expect } from '@playwright/test';

test.describe('開源專案雷達 E2E 功能驗收測試', () => {
  test('首頁載入且展示開源雷達標題與導覽頻道', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/開源專案雷達/);
    
    // 檢查主要導覽區塊
    const navHeading = page.locator('header');
    await expect(navHeading).toContainText('開源專案雷達');
    
    // 檢查 API 配額徽章
    const rateLimitBadge = page.locator('text=API 配額');
    await expect(rateLimitBadge).toBeVisible();
  });

  test('全域搜尋功能：輸入自然語言或關鍵字並執行搜尋', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.locator('input[placeholder*="搜尋專案"]');
    await searchInput.fill('threejs');
    await page.keyboard.press('Enter');

    // 驗證 URL 更新且搜尋條件生效
    await expect(page).toHaveURL(/\/\?q=threejs/);
  });

  test('頻道切換：可切換至 Demo 尋寶與免費開源頻道', async ({ page }) => {
    await page.goto('/');
    const demoTab = page.locator('text=Demo 尋寶').first();
    await demoTab.click();
    await expect(page).toHaveURL(/\/\?tab=demos/);
  });

  test('收藏清單頁面可正常瀏覽與導航', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page.locator('h1')).toContainText('個人開源專案雷達庫');
  });

  test('手機版側邊欄漢堡按鈕操作', async ({ page, isMobile }) => {
    test.skip(!isMobile, '僅在手機端環境執行');
    await page.goto('/');
    const menuBtn = page.locator('button[title*="切換分類導覽"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    
    // 側邊欄展開
    const sidebarChannel = page.locator('text=今日雷達');
    await expect(sidebarChannel).toBeVisible();
  });
});
