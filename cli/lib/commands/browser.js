// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex browser command
 * Browser automation using Playwright
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { chromium, firefox, webkit } from 'playwright';
import { printError, printInfo, printSuccess } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

export function registerBrowserCommand(program) {
  const browserCmd = program
    .command('browser')
    .description('Browser automation and testing (Playwright + AI)');

  // Screenshot command
  browserCmd
    .command('snap')
    .alias('screenshot')
    .description('Take a screenshot of a URL')
    .option('-u, --url <url>', 'URL to take screenshot of', 'http://localhost:3000')
    .option('-o, --output <path>', 'Output file path', 'screenshot.png')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .option('--full-page', 'Take full page screenshot', false)
    .option('--width <width>', 'Viewport width', '1200')
    .option('--height <height>', 'Viewport height', '800')
    .action(async (options) => {
      try {
        await takeScreenshot(options);
      } catch (error) {
        await handleError(error, { command: 'browser-snap', options });
      }
    });

  // Scrape command
  browserCmd
    .command('scrape')
    .description('Scrape text or selectors from a page')
    .option('-u, --url <url>', 'URL to scrape', 'http://localhost:3000')
    .option('-q, --query <query>', 'Filter extracted text by query')
    .option('--selector <selector>', 'CSS selector to extract')
    .option('-o, --output <path>', 'Write output to file')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .action(async (options) => {
      try {
        await scrapePage(options);
      } catch (error) {
        await handleError(error, { command: 'browser-scrape', options });
      }
    });

  // Browser test command
  browserCmd
    .command('test')
    .description('Run simple browser assertions against a page')
    .option('-u, --url <url>', 'URL to test', 'http://localhost:3000')
    .option('-a, --assertions <assertions>', 'Comma-separated selectors or path to JSON assertions')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .action(async (options) => {
      try {
        await runBrowserTests(options);
      } catch (error) {
        await handleError(error, { command: 'browser-test', options });
      }
    });

  // Browser record command
  browserCmd
    .command('record')
    .description('Record a browser session to a JSON file')
    .option('-u, --url <url>', 'URL to record', 'http://localhost:3000')
    .option('-o, --output <path>', 'Output file path', 'browser-session.json')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .action(async (options) => {
      try {
        await recordSession(options);
      } catch (error) {
        await handleError(error, { command: 'browser-record', options });
      }
    });

  // Browser mockup command
  browserCmd
    .command('mockup')
    .description('Generate a quick HTML mockup from a prompt')
    .option('-p, --prompt <prompt>', 'Mockup prompt', 'Landing page')
    .option('-s, --stack <stack>', 'Target stack', 'html')
    .option('-o, --output <path>', 'Output file path', 'mockup.html')
    .action(async (options) => {
      try {
        await generateMockup(options);
      } catch (error) {
        await handleError(error, { command: 'browser-mockup', options });
      }
    });

  // Browser audit command
  browserCmd
    .command('audit')
    .description('Quick UX/SEO audit for a page')
    .option('-u, --url <url>', 'URL to audit', 'http://localhost:3000')
    .option('--promote', 'Print improvement recommendations', false)
    .option('-o, --output <path>', 'Write audit report to JSON file')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .action(async (options) => {
      try {
        await auditPage(options);
      } catch (error) {
        await handleError(error, { command: 'browser-audit', options });
      }
    });

  // Navigate and interact command
  browserCmd
    .command('navigate')
    .description('Navigate to URL and perform actions')
    .option('-u, --url <url>', 'URL to navigate to')
    .option('--click-selector <selector>', 'Selector to click')
    .option('--fill-selector <selector>', 'Selector to fill')
    .option('--fill-value <value>', 'Value to fill')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .action(async (options) => {
      try {
        await navigateAndInteract(options);
      } catch (error) {
        await handleError(error, { command: 'browser-navigate', options });
      }
    });

  // Page info command
  browserCmd
    .command('info')
    .description('Get information about a web page')
    .option('-u, --url <url>', 'URL to get information from')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .action(async (options) => {
      try {
        await getPageInfo(options);
      } catch (error) {
        await handleError(error, { command: 'browser-info', options });
      }
    });

  // Default browser command behavior
  browserCmd
    .option('-u, --url <url>', 'URL to open', 'http://localhost:3000')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .option('--headless', 'Run in headless mode', true)
    .option('--no-headless', 'Run in headed mode')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🌐 Ultra-Dex Browser Automation\n'));
        printInfo(chalk.gray(`Opening: ${options.url}`));
        printInfo(chalk.gray(`Browser: ${options.browser}`));
        printInfo(chalk.gray(`Headless: ${options.headless}\n`));

        // Default action - just open and take a screenshot
        await takeScreenshot({
          url: options.url,
          output: `screenshot-${Date.now()}.png`,
          browser: options.browser,
          headless: options.headless,
        });
      } catch (error) {
        await handleError(error, { command: 'browser', options });
      }
    });

  browserCmd._examples = [
    {
      command: 'ultra-dex browser snap --url http://localhost:3000',
      description: 'Take screenshot of localhost:3000',
    },
    { command: 'ultra-dex browser snap --full-page', description: 'Take full page screenshot' },
    {
      command:
        'ultra-dex browser navigate --url https://example.com --click-selector "button.submit"',
      description: 'Click element on page',
    },
    {
      command: 'ultra-dex browser info --url https://example.com',
      description: 'Get page information',
    },
  ];
}

/**
 * Take a screenshot of a URL
 */
async function takeScreenshot(options) {
  printInfo(chalk.yellow(`📸 Taking screenshot of ${options.url}...`));

  let browser;
  try {
    // Select browser
    let browserType;
    switch (options.browser.toLowerCase()) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    // Launch browser
    browser = await browserType.launch({
      headless: options.headless,
    });

    // Create page
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewportSize({
      width: parseInt(options.width),
      height: parseInt(options.height),
    });

    // Navigate to URL
    printInfo(chalk.gray(`Navigating to: ${options.url}`));
    await page.goto(options.url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait a bit for page to fully load
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotOptions = {
      path: options.output,
    };

    if (options.fullPage) {
      screenshotOptions.fullPage = true;
    }

    await page.screenshot(screenshotOptions);

    printSuccess(chalk.green(`✅ Screenshot saved to: ${options.output}`));
  } catch (error) {
    printError(chalk.red(`Screenshot failed: ${error.message}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Navigate to URL and perform actions
 */
async function navigateAndInteract(options) {
  if (!options.url) {
    throw new Error('URL is required for navigate command');
  }

  printInfo(chalk.yellow(`🌐 Navigating to ${options.url}...`));

  let browser;
  try {
    // Select browser
    let browserType;
    switch (options.browser.toLowerCase()) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    // Launch browser
    browser = await browserType.launch({
      headless: true, // Always headless for automation
    });

    // Create page
    const page = await browser.newPage();

    // Navigate to URL
    printInfo(chalk.gray(`Navigating to: ${options.url}`));
    await page.goto(options.url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Perform actions if specified
    if (options.clickSelector) {
      printInfo(chalk.gray(`Clicking selector: ${options.clickSelector}`));
      await page.click(options.clickSelector);
      await page.waitForTimeout(1000); // Wait for action to complete
    }

    if (options.fillSelector && options.fillValue) {
      printInfo(chalk.gray(`Filling selector: ${options.fillSelector} with: ${options.fillValue}`));
      await page.fill(options.fillSelector, options.fillValue);
      await page.waitForTimeout(500); // Wait for fill to complete
    }

    printSuccess(chalk.green('✅ Navigation and interaction completed'));
  } catch (error) {
    printError(chalk.red(`Navigation failed: ${error.message}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Get information about a web page
 */
async function getPageInfo(options) {
  if (!options.url) {
    throw new Error('URL is required for info command');
  }

  printInfo(chalk.yellow(`🔍 Getting information from ${options.url}...`));

  let browser;
  try {
    // Select browser
    let browserType;
    switch (options.browser.toLowerCase()) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    // Launch browser
    browser = await browserType.launch({
      headless: true, // Always headless for automation
    });

    // Create page
    const page = await browser.newPage();

    // Navigate to URL
    printInfo(chalk.gray(`Navigating to: ${options.url}`));
    await page.goto(options.url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Extract page information
    const title = await page.title();
    const url = page.url();
    const content = await page.textContent('body');
    const contentLength = content ? content.length : 0;

    // Get all links
    const links = await page.evaluate(() => {
      return Array.from(document.links).map((link) => link.href);
    });

    printSuccess(chalk.green('\n📄 Page Information:'));
    printInfo(chalk.gray(`Title: ${title}`));
    printInfo(chalk.gray(`URL: ${url}`));
    printInfo(chalk.gray(`Content Length: ${contentLength} characters`));
    printInfo(chalk.gray(`Links Found: ${links.length}`));

    if (links.length > 0) {
      printInfo(chalk.gray('\nFirst 5 links:'));
      links.slice(0, 5).forEach((link) => {
        printInfo(chalk.gray(`  - ${link}`));
      });
    }

    printSuccess(chalk.green('\n✅ Information extraction completed'));
  } catch (error) {
    printError(chalk.red(`Information extraction failed: ${error.message}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape page content
 */
async function scrapePage(options) {
  if (!options.url) {
    throw new Error('URL is required for scrape command');
  }

  printInfo(chalk.yellow(`🧹 Scraping ${options.url}...`));

  let browser;
  try {
    let browserType;
    switch (options.browser.toLowerCase()) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    browser = await browserType.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 });

    let output = '';
    if (options.selector) {
      const values = await page.$$eval(options.selector, (els) =>
        els.map((el) => (el.textContent || '').trim()).filter(Boolean)
      );
      output = values.join('\n');
    } else {
      output = await page.evaluate(() => document.body.innerText || '');
    }

    if (options.query) {
      const needle = options.query.toLowerCase();
      output = output
        .split('\n')
        .filter((line) => line.toLowerCase().includes(needle))
        .join('\n');
    }

    if (options.output) {
      await fs.writeFile(options.output, output, 'utf8');
      printSuccess(chalk.green(`✅ Scrape saved to: ${options.output}`));
    } else {
      printInfo(output || '(no content matched)');
    }
  } catch (error) {
    printError(chalk.red(`Scrape failed: ${error.message}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Run simple browser assertions
 */
async function runBrowserTests(options) {
  if (!options.url) {
    throw new Error('URL is required for test command');
  }
  if (!options.assertions) {
    throw new Error('Assertions are required (selectors or JSON file)');
  }

  printInfo(chalk.yellow(`🧪 Testing ${options.url}...`));

  let assertions = [];
  const assertionValue = options.assertions.trim();
  if (assertionValue.endsWith('.json')) {
    const raw = await fs.readFile(assertionValue, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      assertions = parsed;
    } else if (Array.isArray(parsed.selectors)) {
      assertions = parsed.selectors;
    }
  } else {
    assertions = assertionValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (assertions.length === 0) {
    throw new Error('No assertions provided');
  }

  let browser;
  try {
    let browserType;
    switch (options.browser.toLowerCase()) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    browser = await browserType.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 });

    const failures = [];
    for (const selector of assertions) {
      const exists = await page.$(selector);
      if (!exists) {
        failures.push(selector);
      }
    }

    if (failures.length > 0) {
      printError(`❌ Missing selectors: ${failures.join(', ')}`);
      throw new Error(`Missing selectors: ${failures.join(', ')}`);
    }

    printSuccess('✅ All assertions passed');
  } catch (error) {
    printError(chalk.red(`Test failed: ${error.message}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Record a browser session to JSON with a screenshot and DOM snapshot metadata
 */
async function recordSession(options) {
  if (!options.url) {
    throw new Error('URL is required to record a session');
  }

  printInfo(chalk.yellow(`🎥 Recording session for ${options.url}...`));

  let browser;
  try {
    let browserType;
    switch (options.browser.toLowerCase()) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    browser = await browserType.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

    await page.goto(options.url, { waitUntil: 'networkidle' });
    const title = await page.title();
    const dom = await page.content();

    const outputPath = options.output || 'browser-session.json';
    const screenshotPath =
      outputPath.replace(/\.json$/i, '') + `-${Date.now()}.png`;

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const record = {
      url: options.url,
      browser: options.browser,
      startedAt: new Date().toISOString(),
      title,
      domLength: dom.length,
      screenshot: path.basename(screenshotPath),
      actions: [
        { type: 'navigate', url: options.url, timestamp: new Date().toISOString() },
        { type: 'screenshot', path: screenshotPath, timestamp: new Date().toISOString() },
      ],
    };

    await fs.writeFile(outputPath, JSON.stringify(record, null, 2), 'utf8');
    printSuccess(chalk.green(`✅ Recorded session saved to: ${outputPath}`));
    printInfo(chalk.gray(`Screenshot captured: ${screenshotPath}`));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate a simple HTML mockup
 */
async function generateMockup(options) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${options.prompt}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f8fafc; color: #0f172a; }
      .card { max-width: 760px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1); }
      .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #e0e7ff; color: #3730a3; font-weight: 600; font-size: 12px; }
      h1 { font-size: 32px; margin: 16px 0 8px; }
      p { line-height: 1.6; color: #475569; }
      .cta { margin-top: 24px; display: inline-block; padding: 12px 20px; background: #4f46e5; color: white; border-radius: 10px; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">${options.stack}</span>
      <h1>${options.prompt}</h1>
      <p>Starter mockup generated by Ultra-Dex. Replace this content with your real copy and components.</p>
      <a class="cta" href="#">Get Started</a>
    </div>
  </body>
</html>`;

  await fs.writeFile(options.output, html, 'utf8');
  printSuccess(chalk.green(`✅ Mockup written to: ${options.output}`));
}

/**
 * Quick audit for UX/SEO signals
 */
async function auditPage(options) {
  if (!options.url) {
    throw new Error('URL is required for audit command');
  }

  printInfo(chalk.yellow(`🧭 Auditing ${options.url}...`));

  let browser;
  try {
    let browserType;
    switch (options.browser.toLowerCase()) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    browser = await browserType.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 });

    const report = await page.evaluate(() => {
      const title = document.title || '';
      const description =
        document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const h1Count = document.querySelectorAll('h1').length;
      const imagesMissingAlt = Array.from(document.querySelectorAll('img')).filter(
        (img) => !img.getAttribute('alt')
      ).length;
      return { title, description, h1Count, imagesMissingAlt };
    });

    if (options.output) {
      await fs.writeFile(options.output, JSON.stringify(report, null, 2), 'utf8');
      printSuccess(chalk.green(`✅ Audit report saved to: ${options.output}`));
    } else {
      printInfo(`Title: ${report.title || '(missing)'}`);
      printInfo(`Meta description: ${report.description ? 'present' : 'missing'}`);
      printInfo(`H1 count: ${report.h1Count}`);
      printInfo(`Images missing alt: ${report.imagesMissingAlt}`);
    }

    if (options.promote) {
      printInfo('\nRecommendations:');
      if (!report.title) printWarning('  • Add a descriptive <title>.');
      if (!report.description) printWarning('  • Add a meta description for SEO.');
      if (report.h1Count === 0) printWarning('  • Add a primary <h1> for the page.');
      if (report.imagesMissingAlt > 0) printWarning('  • Add alt text to all images.');
    }
  } catch (error) {
    printError(chalk.red(`Audit failed: ${error.message}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default {
  registerBrowserCommand,
};
