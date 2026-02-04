import { chromium } from 'playwright';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { createProvider as getProvider } from '../providers/index.js';
import { printError, printInfo, printSuccess } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

import { visionScanner } from '../vision/scanner.js';

export function registerBrowserCommand(program) {
  const browserCmd = program
    .command('browser')
    .description('Browser Automation & Testing (Playwright + AI)');

  // 1. Screenshot Command
  browserCmd
    .command('screenshot <url>')
    .description('Take a screenshot of a URL')
    .option('-o, --output <path>', 'Output file path')
    .option('--full-page', 'Capture full page', true)
    .option('--no-full-page', 'Capture viewport only')
    .action(async (url, options) => {
      try {
        await handleScreenshot(url, options);
      } catch (error) {
        await handleError(error, { command: 'browser screenshot', options });
      }
    });

  // 2. Scrape Command
  browserCmd
    .command('scrape <url>')
    .description('Extract content from a URL using AI')
    .option('-q, --query <query>', 'What to extract (e.g., "all pricing tiers")', 'Summarize the page content')
    .option('-o, --output <path>', 'Save output to file')
    .action(async (url, options) => {
      try {
        await handleScrape(url, options);
      } catch (error) {
        await handleError(error, { command: 'browser scrape', options });
      }
    });

  // 3. Test Command
  browserCmd
    .command('test <url>')
    .description('Run automated tests with AI assertions')
    .option('-a, --assertions <list>', 'Comma-separated assertions (e.g., "Login button exists, Title is Home")')
    .action(async (url, options) => {
      try {
        await handleTest(url, options);
      } catch (error) {
        await handleError(error, { command: 'browser test', options });
      }
    });

  // 4. Record Command
  browserCmd
    .command('record')
    .description('Record user actions to generate Playwright code')
    .option('-o, --output <path>', 'Output file path', 'tests/recorded.spec.ts')
    .action(async (options) => {
      try {
        await handleRecord(options);
      } catch (error) {
        await handleError(error, { command: 'browser record', options });
      }
    });

  // 5. Mockup Command
  browserCmd
    .command('mockup <image>')
    .description('Convert UI mockup to code using Vision AI')
    .option('-o, --output <path>', 'Output file path', 'component.tsx')
    .option('--stack <stack>', 'Tech stack (e.g., next15-tailwind)', 'next15-tailwind')
    .action(async (image, options) => {
      try {
        await handleMockup(image, options);
      } catch (error) {
        await handleError(error, { command: 'browser mockup', options });
      }
    });

  // 6. Audit (Visual Regression) Command
  browserCmd
    .command('audit <url>')
    .description('Perform AI Visual Regression Audit')
    .option('--name <name>', 'Snapshot name', 'ui-audit')
    .option('--promote', 'Promote current run to baseline')
    .action(async (url, options) => {
      try {
        await handleAudit(url, options);
      } catch (error) {
        await handleError(error, { command: 'browser audit', options });
      }
    });
}

// --- Implementation Handlers ---

async function handleAudit(url, options) {
  const spinner = ora(`Initializing Visual Audit for ${url}...`).start();
  
  try {
    const screenshotPath = await visionScanner.capture(url, options.name);
    
    if (options.promote) {
      await visionScanner.promoteToBaseline(screenshotPath, options.name);
      spinner.succeed(chalk.green('Current screenshot promoted to baseline.'));
      return;
    }

    spinner.text = 'Performing Visual Comparison...';
    const result = await visionScanner.compare(options.name, screenshotPath);
    
    if (result.status === 'ANALYZED') {
      spinner.succeed('Visual Audit Complete');
      console.log(chalk.magenta('\n🔍 AI Review Results:'));
      console.log(chalk.gray(result.message));
    } else {
      spinner.info(result.message);
    }
  } catch (error) {
    spinner.fail(chalk.red('Visual Audit failed'));
    throw error;
  }
}

async function handleScreenshot(url, options) {
  const spinner = ora(`Navigating to ${url}...`).start();
  let browser;

  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Validate URL
    if (!url.startsWith('http')) url = 'https://' + url;

    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Determine output path
    let outputPath = options.output;
    if (!outputPath) {
      const hostname = new URL(url).hostname;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = `${hostname}-${timestamp}.png`;
    }

    spinner.text = 'Capturing screenshot...';
    await page.screenshot({ 
      path: outputPath, 
      fullPage: options.fullPage 
    });

    spinner.succeed(chalk.green(`Screenshot saved to ${outputPath}`));
  } catch (error) {
    spinner.fail(chalk.red('Screenshot failed'));
    if (error.message.includes("Executable doesn't exist")) {
      printInfo('👉 Run `npx playwright install` to install browser binaries.');
    }
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

async function handleScrape(url, options) {
  const provider = getProvider();
  if (!provider) {
    printError('AI Provider not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    return;
  }

  const spinner = ora(`Scraping ${url}...`).start();
  let browser;

  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    if (!url.startsWith('http')) url = 'https://' + url;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Extract main text content
    const content = await page.evaluate(() => {
      return document.body.innerText;
    });

    spinner.text = 'Analyzing content with AI...';

    const prompt = `
You are a web scraper. Extract the following information from the text below:
"${options.query}"

Return the result in structured JSON format if possible, otherwise clear text.
Do not include markdown code blocks if returning JSON, just the raw JSON string.

Page Content:
${content.substring(0, 15000)} ... (truncated)
    `;

    const result = await provider.generate('You are a helpful data extraction assistant.', prompt);
    const outputText = result.content || result;

    spinner.succeed('Extraction complete');

    if (options.output) {
      await fs.writeFile(options.output, outputText);
      printSuccess(`Result saved to ${options.output}`);
    } else {
      console.log(chalk.cyan(`
--- Extraction Result ---`));
      console.log(outputText);
      console.log(chalk.cyan(`-------------------------
`));
    }

  } catch (error) {
    spinner.fail(chalk.red('Scraping failed'));
    if (error.message.includes("Executable doesn't exist")) {
      printInfo('👉 Run `npx playwright install` to install browser binaries.');
    }
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

async function handleTest(url, options) {
  const provider = getProvider();
  if (!provider) {
    printError('AI Provider not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    return;
  }

  const spinner = ora(`Running AI Test on ${url}...`).start();
  let browser;

  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    if (!url.startsWith('http')) url = 'https://' + url;

    await page.goto(url, { waitUntil: 'networkidle' });

    // Capture state for AI
    const screenshotBuffer = await page.screenshot();
    const pageContent = await page.evaluate(() => document.body.innerText);

    spinner.text = 'Verifying assertions...';

    const assertions = options.assertions || 'The page loaded correctly and has no visible errors.';
    
    // Construct prompt
    const prompt = `
I need you to verify the following assertions for a webpage:
"${assertions}"

Here is the text content of the page:
${pageContent.substring(0, 5000)}

Analyze the page status. 
Response Format:
[PASS] or [FAIL]
<Reasoning>
    `;

    // If provider supports image analysis, we could use that too.
    // For now, we assume text-based analysis unless specific provider capabilities are exposed.
    // But since we want "AI integration", let's try to use analyzeImage if available (VisionScanner pattern).
    
    let response;
    if (provider.analyzeImage) {
        response = await provider.analyzeImage(screenshotBuffer, prompt);
    } else {
        const result = await provider.generate('You are a QA automation engineer.', prompt);
        response = result.content || result;
    }

    if (response.includes('[PASS]')) {
      spinner.succeed(chalk.green('Tests Passed'));
    } else {
      spinner.fail(chalk.red('Tests Failed'));
    }
    
    console.log(chalk.gray(`
` + response));

  } catch (error) {
    spinner.fail(chalk.red('Test execution failed'));
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

async function handleRecord(options) {
  printInfo('🚀 Launching Playwright Recorder...');
  printInfo('👉 Perform actions in the browser window.');
  printInfo('👉 Close the browser to save the generated code.');

  // Playwright Codegen is usually run via CLI: npx playwright codegen
  // We can spawn it as a child process.
  const { spawn } = await import('child_process');
  
  const args = ['playwright', 'codegen'];
  if (options.output) {
    args.push('--output', options.output);
  }

  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    if (code === 0) {
      printSuccess(`
Recording saved${options.output ? ' to ' + options.output : ''}.`);
    } else {
      printError(`Recorder exited with code ${code}`);
    }
  });
}

async function handleMockup(imagePath, options) {
  const provider = getProvider();
  if (!provider) {
    printError('AI Provider not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    return;
  }
  
  if (!provider.analyzeImage) {
    printError(`Current provider (${provider.constructor.name}) does not support Vision. Please use OpenAI (GPT-4o) or Claude 3.5 Sonnet.`);
    return;
  }

  const spinner = ora(`Analyzing mockup ${imagePath}...`).start();

  try {
    const buffer = await fs.readFile(imagePath);
    
    const prompt = `
You are an expert Frontend Engineer.
Convert this UI mockup into clean, production-ready code.

Tech Stack: ${options.stack}
- Use functional components.
- Ensure responsiveness.
- Use best practices for the requested stack.
- Return ONLY the code, no markdown fencing if possible, or minimally wrapped.
    `;

    const response = await provider.analyzeImage(buffer, prompt);

    spinner.succeed('Code generation complete');

    if (options.output) {
      await fs.writeFile(options.output, response);
      printSuccess(`Component saved to ${options.output}`);
    } else {
      console.log(chalk.cyan(`
--- Generated Code ---`));
      console.log(response);
      console.log(chalk.cyan(`----------------------
`));
    }

  } catch (error) {
    spinner.fail(chalk.red('Mockup conversion failed'));
    throw error;
  }
}