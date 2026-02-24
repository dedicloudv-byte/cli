import { test, expect } from '@playwright/test';

test('dashboard has hamburger menu and sidebar', async ({ page }) => {
  await page.goto('http://localhost:8787');

  // Check title
  await expect(page).toHaveTitle(/VPS AI Dashboard/);

  // Check hamburger menu button
  const hamburger = page.locator('#hamburger');
  await expect(hamburger).toBeVisible();

  // Sidebar should be hidden initially
  const sidebar = page.locator('#sidebar');
  await expect(sidebar).toHaveClass(/sidebar-hidden/);

  // Click hamburger and check sidebar
  await hamburger.click();
  await expect(sidebar).toHaveClass(/sidebar-visible/);

  // Check file list has loading text
  await expect(page.locator('#file-list')).toContainText('Menghubungkan ke VPS...');

  // Take screenshot
  await page.screenshot({ path: 'screenshots/dashboard_mobile.png', fullPage: true });
});
