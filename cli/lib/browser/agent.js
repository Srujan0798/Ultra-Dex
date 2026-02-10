// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Agent module
 * @module browser/agent
 */

import fs from 'fs/promises';
import path from 'path';
import {
  launchBrowser,
  navigate,
  clickSelector,
  typeSelector,
  scrollBy,
  extractDom,
  screenshotPage,
} from './playwright.js';
import { analyzeScreenshot } from './vision.js';

const DEFAULT_TIMEOUT = 30000;

export class BrowserAgent {
  constructor(options = {}) {
    this.options = options;
    this.history = [];
    this.allowedHosts = options.allowlist || [];
    this.blockedHosts = options.blocklist || [];
  }

  isUrlAllowed(url) {
    try {
      const parsed = new URL(url);
      if (this.blockedHosts.length && this.blockedHosts.includes(parsed.hostname)) {
        return false;
      }
      if (this.allowedHosts.length && !this.allowedHosts.includes(parsed.hostname)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async runScript(script = [], options = {}) {
    const { browser, page } = await launchBrowser(options);
    const timeout = options.timeout || DEFAULT_TIMEOUT;

    for (const step of script) {
      const { action, value } = step;
      if (action === 'goto') {
        if (!this.isUrlAllowed(value)) {
          throw new Error(`URL not allowed: ${value}`);
        }
        await navigate(page, value);
      }
      if (action === 'click') await clickSelector(page, value);
      if (action === 'type') await typeSelector(page, step.selector, value);
      if (action === 'scroll') await scrollBy(page, value || 600);
      if (action === 'wait') await page.waitForTimeout(value || 1000);
      if (action === 'screenshot') {
        const shot = await screenshotPage(page, value);
        step.result = { screenshot: shot };
      }
      if (action === 'dom') {
        step.result = { dom: await extractDom(page) };
      }
      this.history.push(step);
    }

    await browser.close();
    return this.history;
  }

  async quickScreenshot(url, options = {}) {
    const { browser, page } = await launchBrowser(options);
    await navigate(page, url);
    const shot = await screenshotPage(page, options.output);
    await browser.close();
    return shot;
  }

  async analyzePage(url, options = {}) {
    const shot = await this.quickScreenshot(url, options);
    const analysis = await analyzeScreenshot(shot, options);
    return { screenshot: shot, analysis };
  }

  async recordSession(steps, outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(
      outputPath,
      JSON.stringify({ steps, createdAt: new Date().toISOString() }, null, 2)
    );
    return outputPath;
  }

  async replaySession(filePath, options = {}) {
    const content = await fs.readFile(filePath, 'utf8');
    const payload = JSON.parse(content);
    return this.runScript(payload.steps || [], options);
  }
}

export default BrowserAgent;
