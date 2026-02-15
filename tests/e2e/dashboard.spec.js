// Run with: npx playwright test tests/e2e/dashboard.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Dashboard E2E Smoke', () => {
  test('loads dashboard shell', async ({ page }) => {
    await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Ultra-Dex')).toBeVisible();
  });

  test('navigates to memory page', async ({ page }) => {
    await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /memory/i }).click();
    await expect(page).toHaveURL(/\/memory/);
  });
});
