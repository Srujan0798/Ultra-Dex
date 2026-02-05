import fs from 'fs/promises';
import path from 'path';

export async function launchBrowser(options = {}) {
  try {
    const playwright = await import('playwright');
    const browserType = options.browser || 'chromium';
    const launcher = playwright[browserType] || playwright.chromium;
    const browser = await launcher.launch({ headless: options.headless !== false });
    const page = await browser.newPage();
    return { browser, page };
  } catch (error) {
    throw new Error(`Playwright not available: ${error.message}`);
  }
}

export async function screenshotPage(page, outputPath = null) {
  const filePath = outputPath || path.resolve(process.cwd(), '.ultra-dex', 'browser', `shot-${Date.now()}.png`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

export async function extractDom(page) {
  return page.content();
}

export async function clickSelector(page, selector) {
  await page.click(selector);
}

export async function typeSelector(page, selector, text) {
  await page.fill(selector, text);
}

export async function scrollBy(page, deltaY = 600) {
  await page.evaluate((y) => window.scrollBy(0, y), deltaY);
}

export async function navigate(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}
