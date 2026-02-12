/* global document */
// Copyright (c) 2026 Ultra-Dex

/**
 * Browser Automation Module (Playwright-based)
 * Enables Research agent to browse the web, take screenshots, and interact with pages
 * This is what makes Ultra-Dex truly intelligent - it can LEARN from the web
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// BROWSER CONFIGURATION
// ============================================================================

const BROWSER_CONFIG = {
  // Default browser settings
  headless: true,
  timeout: 30000,
  viewport: { width: 1280, height: 720 },

  // Screenshot settings
  screenshotDir: '.ultra-dex/screenshots',

  // User agent
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Ultra-Dex/3.2.0 Research Agent',

  // Blocked resources (for faster loading)
  blockedResources: ['image', 'stylesheet', 'font', 'media'],
};

// ============================================================================
// BROWSER AUTOMATION CLASS
// ============================================================================

/**
 * Browser automation for Research agent
 * Uses Playwright for reliable cross-browser automation
 */
export class BrowserAutomation {
  constructor(options = {}) {
    this.options = { ...BROWSER_CONFIG, ...options };
    this.browser = null;
    this.context = null;
    this.page = null;
    this.playwright = null;
  }

  /**
   * Launch browser
   */
  async launch() {
    try {
      // Dynamic import of playwright
      const { chromium } = await import('playwright');
      this.playwright = { chromium };

      this.browser = await chromium.launch({
        headless: this.options.headless,
      });

      this.context = await this.browser.newContext({
        userAgent: this.options.userAgent,
        viewport: this.options.viewport,
      });

      // Block unnecessary resources for faster loading
      if (this.options.blockedResources.length > 0) {
        await this.context.route('**/*', (route) => {
          if (this.options.blockedResources.includes(route.request().resourceType())) {
            route.abort();
          } else {
            route.continue();
          }
        });
      }

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.options.timeout);

      return true;
    } catch (err) {
      console.log(chalk.yellow(`Browser launch failed: ${err.message}`));
      console.log(chalk.gray('Install Playwright: npm install playwright'));
      return false;
    }
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Navigate to URL
   */
  async navigate(url) {
    if (!this.page) {
      await this.launch();
    }

    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    return { url: this.page.url(), title: await this.page.title() };
  }

  /**
   * Get page content (text extraction)
   */
  async getPageContent(url) {
    await this.navigate(url);

    // Extract text content
    const content = await this.page.evaluate(() => {
      // Remove scripts and styles
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach((el) => el.remove());

      // Get main content areas
      const mainContent = document.querySelector('main, article, .content, #content, .main');
      const target = mainContent || document.body;

      // Extract text
      const text = target.innerText || target.textContent || '';

      // Clean up whitespace
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()
        .substring(0, 50000); // Limit content size
    });

    // Extract links
    const links = await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .slice(0, 50)
        .map((a) => ({
          text: a.innerText?.trim().substring(0, 100),
          href: a.href,
        }))
        .filter((l) => l.text && l.href.startsWith('http'));
    });

    // Extract headings
    const headings = await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1, h2, h3'))
        .slice(0, 20)
        .map((h) => ({
          level: h.tagName.toLowerCase(),
          text: h.innerText?.trim().substring(0, 200),
        }))
        .filter((h) => h.text);
    });

    return {
      url: this.page.url(),
      title: await this.page.title(),
      content: content.substring(0, 20000), // Limit for context window
      headings,
      links: links.slice(0, 20),
      wordCount: content.split(/\s+/).length,
    };
  }

  /**
   * Take screenshot
   */
  async screenshot(url, options = {}) {
    await this.navigate(url);

    const { fullPage = false, path: customPath } = options;

    // Ensure screenshot directory exists
    await fs.mkdir(this.options.screenshotDir, { recursive: true });

    // Generate filename
    const timestamp = Date.now();
    const filename =
      customPath || path.join(this.options.screenshotDir, `screenshot-${timestamp}.png`);

    await this.page.screenshot({
      path: filename,
      fullPage,
    });

    return {
      path: filename,
      url: this.page.url(),
      title: await this.page.title(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Click an element
   */
  async click(selector) {
    await this.page.click(selector);
    await this.page.waitForLoadState('domcontentloaded');

    return {
      clicked: selector,
      url: this.page.url(),
      title: await this.page.title(),
    };
  }

  /**
   * Fill a form field
   */
  async fill(selector, value) {
    await this.page.fill(selector, value);

    return {
      filled: selector,
      value: value.substring(0, 50), // Don't expose full value
    };
  }

  /**
   * Wait for selector
   */
  async waitFor(selector, options = {}) {
    const { timeout = 10000, state = 'visible' } = options;

    try {
      await this.page.waitForSelector(selector, { timeout, state });
      return { success: true, selector };
    } catch {
      return { success: false, selector, error: 'Timeout waiting for element' };
    }
  }

  /**
   * Execute JavaScript on page
   */
  async evaluate(script) {
    const result = await this.page.evaluate(script);
    return { result };
  }

  /**
   * Get page metadata
   */
  async getMetadata(url) {
    await this.navigate(url);

    const metadata = await this.page.evaluate(() => {
      const getMeta = (name) => {
        const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return el?.getAttribute('content') || null;
      };

      return {
        title: document.title,
        description: getMeta('description') || getMeta('og:description'),
        keywords: getMeta('keywords'),
        author: getMeta('author'),
        ogImage: getMeta('og:image'),
        ogTitle: getMeta('og:title'),
        canonical: document.querySelector('link[rel="canonical"]')?.href,
      };
    });

    return { url: this.page.url(), ...metadata };
  }

  /**
   * Search Google and get results
   */
  async searchGoogle(query) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await this.navigate(searchUrl);

    // Wait for results
    await this.page.waitForSelector('#search', { timeout: 10000 }).catch(() => { });

    const results = await this.page.evaluate(() => {
      const items = document.querySelectorAll('#search .g');
      return Array.from(items)
        .slice(0, 10)
        .map((item) => {
          const linkEl = item.querySelector('a');
          const titleEl = item.querySelector('h3');
          const snippetEl = item.querySelector('.VwiC3b');

          return {
            title: titleEl?.innerText || '',
            url: linkEl?.href || '',
            snippet: snippetEl?.innerText || '',
          };
        })
        .filter((r) => r.url && r.title);
    });

    return { query, results };
  }

  /**
   * Fetch documentation from common sources
   */
  async fetchDocs(library, topic = '') {
    const docSources = {
      react: 'https://react.dev/reference',
      nextjs: 'https://nextjs.org/docs',
      prisma: 'https://www.prisma.io/docs',
      typescript: 'https://www.typescriptlang.org/docs',
      tailwind: 'https://tailwindcss.com/docs',
      node: 'https://nodejs.org/docs/latest/api',
    };

    const baseUrl = docSources[library.toLowerCase()];
    if (!baseUrl) {
      // Fall back to Google search
      return this.searchGoogle(`${library} ${topic} documentation`);
    }

    const url = topic ? `${baseUrl}/${topic}` : baseUrl;
    return this.getPageContent(url);
  }
}

// ============================================================================
// LIGHTWEIGHT FETCH (No Browser)
// ============================================================================

/**
 * Simple HTTP fetch for when browser is overkill
 */
export async function simpleFetch(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_CONFIG.userAgent,
    },
  });

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return { type: 'json', data: await response.json() };
  }

  const text = await response.text();

  // Simple HTML to text conversion
  if (contentType.includes('text/html')) {
    const cleaned = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return { type: 'html', data: cleaned.substring(0, 50000) };
  }

  return { type: 'text', data: text.substring(0, 50000) };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  BrowserAutomation,
  simpleFetch,
  BROWSER_CONFIG,
};
