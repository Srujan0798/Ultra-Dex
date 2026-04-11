var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logging.js';
const BROWSER_CONFIG = {
  headless: true,
  timeout: 3e4,
  viewport: { width: 1280, height: 720 },
  screenshotDir: '.ultra-dex/screenshots',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Ultra-Dex/3.2.0 Research Agent',
  blockedResources: ['image', 'stylesheet', 'font', 'media'],
};
let BrowserAutomation = class {
  options;
  browser;
  context;
  page;
  playwright;
  constructor(options = {}) {
    this.options = { ...BROWSER_CONFIG, ...options };
    this.browser = null;
    this.context = null;
    this.page = null;
    this.playwright = null;
  }
  async launch() {
    try {
      const { chromium } = await import('playwright');
      this.playwright = { chromium };
      this.browser = await chromium.launch({
        headless: this.options.headless,
      });
      this.context = await this.browser.newContext({
        userAgent: this.options.userAgent,
        viewport: this.options.viewport,
      });
      if (this.options.blockedResources.length > 0) {
        await this.context.route('**/*', (route) => {
          const routeObj = route;
          if (this.options.blockedResources.includes(routeObj.request().resourceType())) {
            routeObj.abort();
          } else {
            routeObj.continue();
          }
        });
      }
      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.options.timeout);
      return true;
    } catch (err) {
      logger.log(
        chalk.yellow(`Browser launch failed: ${err instanceof Error ? err.message : String(err)}`)
      );
      logger.log(chalk.gray('Install Playwright: npm install playwright'));
      return false;
    }
  }
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
  async navigate(url) {
    if (!this.page) {
      await this.launch();
    }
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
    });
    return {
      url: this.page.url(),
      title: await this.page.title(),
    };
  }
  async getPageContent(url) {
    await this.navigate(url);
    const content = await this.page.evaluate(() => {
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach((el) => el.remove());
      const mainContent = document.querySelector('main, article, .content, #content, .main');
      const target = mainContent || document.body;
      const text = target.innerText || target.textContent || '';
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()
        .substring(0, 5e4);
    });
    const links = await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .slice(0, 50)
        .map((a) => ({
          text: a.innerText?.trim().substring(0, 100) || '',
          href: a.href,
        }))
        .filter((l) => l.text && l.href.startsWith('http'));
    });
    const headings = await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1, h2, h3'))
        .slice(0, 20)
        .map((h) => ({
          level: h.tagName.toLowerCase(),
          text: h.innerText?.trim().substring(0, 200) || '',
        }))
        .filter((h) => h.text);
    });
    return {
      url: this.page.url(),
      title: await this.page.title(),
      content: content.substring(0, 2e4),
      headings,
      links: links.slice(0, 20),
      wordCount: content.split(/\s+/).length,
    };
  }
  async screenshot(url, options = {}) {
    await this.navigate(url);
    const { fullPage = false, path: customPath } = options;
    await fs.mkdir(this.options.screenshotDir, { recursive: true });
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
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    };
  }
  async click(selector) {
    await this.page.click(selector);
    await this.page.waitForLoadState('domcontentloaded');
    return {
      clicked: selector,
      url: this.page.url(),
      title: await this.page.title(),
    };
  }
  async fill(selector, value) {
    await this.page.fill(selector, value);
    return {
      filled: selector,
      value: value.substring(0, 50),
    };
  }
  async waitFor(selector, options = {}) {
    const { timeout = 1e4, state = 'visible' } = options;
    try {
      await this.page.waitForSelector(selector, {
        timeout,
        state,
      });
      return { success: true, selector };
    } catch {
      return { success: false, selector, error: 'Timeout waiting for element' };
    }
  }
  async evaluate(script) {
    const result = await this.page.evaluate(script);
    return { result };
  }
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
  async searchGoogle(query) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await this.navigate(searchUrl);
    await this.page
      .waitForSelector('#search', {
        timeout: 1e4,
      })
      .catch(() => {});
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
      return this.searchGoogle(`${library} ${topic} documentation`);
    }
    const url = topic ? `${baseUrl}/${topic}` : baseUrl;
    return this.getPageContent(url);
  }
};
BrowserAutomation = __decorateClass([singleton()], BrowserAutomation);
async function simpleFetch(url) {
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
  if (contentType.includes('text/html')) {
    const cleaned = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { type: 'html', data: cleaned.substring(0, 5e4) };
  }
  return { type: 'text', data: text.substring(0, 5e4) };
}
var browser_default = {
  BrowserAutomation,
  simpleFetch,
  BROWSER_CONFIG,
};
export { BrowserAutomation, browser_default as default, simpleFetch };
