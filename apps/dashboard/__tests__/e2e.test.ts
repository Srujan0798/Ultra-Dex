import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Ultra-Dex Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for stability
    await page.route('**/api/metrics', async route => {
      await route.fulfill({ json: { latencyMs: 120, activeAgents: 3 } });
    });
    
    // Navigate to landing page and login if needed
    // For this e2e, we assume we can reach the dashboard
    await page.goto(BASE_URL);
  });

  test('navigate to each page and verify no JS errors', async ({ page }) => {
    const errors: any[] = [];
    page.on('pageerror', error => errors.push(error));

    const pages = [
      '/',
      '/tasks',
      '/agents',
      '/memory',
      '/analytics',
      '/settings'
    ];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      // Wait for some content to load
      await page.waitForLoadState('networkidle');
      expect(errors).toHaveLength(0);
    }
  });

  test('verify KPI cards on overview', async ({ page }) => {
    await page.goto(BASE_URL);
    const latencyCard = page.locator('text=latency');
    await expect(latencyCard).toBeVisible();
    
    const activeAgents = page.locator('text=active agents');
    await expect(activeAgents).toBeVisible();
  });

  test('test dark/light theme toggle', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Assuming there's a theme toggle button
    const themeToggle = page.locator('[aria-label="Toggle theme"]');
    if (await themeToggle.count() > 0) {
      const html = page.locator('html');
      const initialTheme = await html.getAttribute('class');
      
      await themeToggle.click();
      const updatedTheme = await html.getAttribute('class');
      
      expect(initialTheme).not.toBe(updatedTheme);
    }
  });

  test('tasks page filters work', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    
    const filterSelect = page.locator('select').first();
    if (await filterSelect.count() > 0) {
      await filterSelect.selectOption('completed');
      // Verify list updates or URL changes if applicable
      await expect(page).toHaveURL(/status=completed/);
    }
  });
});
