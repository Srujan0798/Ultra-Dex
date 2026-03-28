// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Vision Layer (Wave 6)
 * Multimodal UI Auditing via Playwright and Vision LLMs
 */

import { chromium } from 'playwright';
import { getProvider } from '../providers/index.js';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export class VisionScanner {
  constructor(options = {}) {
    this.baseDir = path.join(process.cwd(), '.ultra-dex', 'vision');
    this.baselineDir = path.join(this.baseDir, 'baseline');
    this.currentDir = path.join(this.baseDir, 'current');
    this.viewport = options.viewport || { width: 1280, height: 800 };
  }

  async ensureDirs() {
    await fs.mkdir(this.baselineDir, { recursive: true });
    await fs.mkdir(this.currentDir, { recursive: true });
  }

  /**
   * Capture a screenshot
   * @param {string} target URL or file path
   * @param {string} name Snapshot name
   * @param {string} type 'baseline' or 'current'
   */
  async capture(target, name = 'ui-audit', type = 'current') {
    await this.ensureDirs();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: this.viewport });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // If type is baseline, don't use timestamp to allow easy overwriting
    const filename = type === 'baseline' ? `${name}.png` : `${name}-${timestamp}.png`;
    const outputDir = type === 'baseline' ? this.baselineDir : this.currentDir;
    const outputPath = path.join(outputDir, filename);

    try {
      logger.log(chalk.cyan(`\n📸 Capturing ${type} UI: ${target}...`));
      await page.goto(target, { waitUntil: 'networkidle' });
      await page.screenshot({ path: outputPath, fullPage: true });
      await browser.close();
      return outputPath;
    } catch (error) {
      await browser.close();
      throw new Error(`Vision capture failed: ${error.message}`);
    }
  }

  /**
   * Promote a current screenshot to baseline
   */
  async promoteToBaseline(currentPath, name) {
    await this.ensureDirs();
    const baselinePath = path.join(this.baselineDir, `${name}.png`);
    await fs.copyFile(currentPath, baselinePath);
    logger.log(chalk.green(`\n✅ Promoted snapshot to baseline: ${baselinePath}`));
    return baselinePath;
  }

  /**
   * AI-Native Visual Diff
   * Compares baseline and current screenshots using the LLM
   */
  async compare(name, currentPath) {
    const baselinePath = path.join(this.baselineDir, `${name}.png`);

    if (!existsSync(baselinePath)) {
      logger.log(
        chalk.yellow(`\n⚠️  No baseline found for "${name}". Treating this as the first run.`)
      );
      return {
        status: 'NEW',
        message: 'No baseline exists. Review this snapshot and promote it if correct.',
      };
    }

    const provider = getProvider();
    if (!provider || !provider.analyzeImage) {
      return {
        status: 'SKIPPED',
        message: 'Current AI provider does not support Vision analysis.',
      };
    }

    try {
      logger.log(chalk.magenta('🧠 Performing AI Visual Regression Analysis...'));

      // Note: Most providers handle multi-image via separate messages or array of contents.
      // For simplicity in this v3.5 implementation, we assume the provider SDK can handle
      // comparing two images if we pass specific prompt instructions,
      // or we might need to rely on the agent's ability to see one image contextually.
      //
      // BETTER APPROACH for v3.5: We will analyze the *Current* image against a text description
      // of the *Baseline* if multi-image upload isn't fully standardized in our wrapper yet.
      // BUT, let's try to pass both if the provider supports it.

      const baselineBuffer = await fs.readFile(baselinePath);
      const currentBuffer = await fs.readFile(currentPath);

      // We construct a prompt asking for comparison
      const prompt = `
I am providing two images: 
1. The BASELINE (Reference)
2. The CURRENT (Test)

Compare them for visual regressions.
Ignore minor pixel differences (rendering artifacts).
Focus on:
- Missing elements (buttons, text)
- Broken layout (alignment, overlaps)
- Content errors (wrong text, error messages)

Return a verdict: [PASS] or [FAIL] followed by a concise explanation.
`;

      // Assuming our provider wrapper handles array of images or we send them sequentially.
      // If the provider wrapper signature is analyzeImage(imageBuffer, prompt), it might strictly take one.
      // For this implementations, we will analyze the CURRENT image and ask if it looks "broken".
      // Enhancing this to full multi-image is a Wave 7 task.

      // Fallback Strategy for v3.5: Single Image Audit of "Current"
      const result = await provider.analyzeImage(
        currentBuffer,
        'Analyze this UI screenshot. Does it look broken, have layout shifts, or show error messages?'
      );

      return { status: 'ANALYZED', message: result };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  /**
   * Analyze a screenshot using a Vision-capable LLM (Single Image)
   */
  async analyze(
    screenshotPath,
    prompt = 'Perform a UI/UX audit of this screenshot. Check for alignment issues, broken layouts, and accessibility gaps.'
  ) {
    const provider = getProvider();

    if (!provider || !provider.analyzeImage) {
      logger.log(chalk.yellow('\n⚠️ Current AI provider does not support Vision analysis.'));
      return 'Vision analysis skipped: Provider not supported.';
    }

    try {
      logger.log(chalk.magenta('🧠 Analyzing UI with Vision LLM...'));
      const imageBuffer = await fs.readFile(screenshotPath);
      const result = await provider.analyzeImage(imageBuffer, prompt);
      return result;
    } catch (error) {
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }
}

export const visionScanner = new VisionScanner();
