// Run with: npx playwright test tests/e2e/dashboard.spec.js
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { test, expect } from 'playwright/test';

const DASHBOARD_URL = 'http://127.0.0.1:4173';
let devServerProcess;

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) return;
    } catch (_) {
      // ignore until server is up
    }
    await delay(500);
  }
  throw new Error(`Dashboard server did not start within ${timeoutMs}ms`);
}

test.describe('Dashboard E2E Smoke', () => {
  test.beforeAll(async () => {
    devServerProcess = spawn(
      'npm',
      ['run', 'dev', '-w', 'apps/dashboard', '--', '--host', '127.0.0.1', '--port', '4173'],
      {
        stdio: 'ignore',
      }
    );

    await waitForServer(DASHBOARD_URL);
  });

  test.afterAll(async () => {
    if (devServerProcess && !devServerProcess.killed) {
      devServerProcess.kill('SIGTERM');
      await delay(300);
      if (!devServerProcess.killed) {
        devServerProcess.kill('SIGKILL');
      }
    }
  });

  test('loads dashboard shell', async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Ultra-Dex')).toBeVisible();
  });

  test('navigates to memory page', async ({ page }) => {
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    const skipTour = page.getByRole('button', { name: /skip tour/i });
    if (await skipTour.isVisible()) {
      await skipTour.click();
    }
    await page.getByRole('link', { name: /memory/i }).click();
    await expect(page).toHaveURL(/\/memory/);
  });
});
