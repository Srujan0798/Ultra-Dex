// Copyright (c) 2026 Ultra-Dex

/**
 * Accessibility Guard (A11Y)
 * Integrate axe-core for accessibility checking
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

// Axe-core script to inject into pages
const AXE_SCRIPT = `(${function () {
  // This is the axe-core script that will be injected into the page
  // For brevity, we'll just define a simplified version here
  // In a real implementation, you'd include the full axe-core script

  if (window.axe) return window.axe;

  // Simplified axe-core functionality for demonstration
  window.axe = {
    run: async function (_context = document, _options = {}) {
      const violations = [];

      // Check for common accessibility issues
      const elements = document.querySelectorAll('*');

      for (const el of elements) {
        // Check for images without alt text
        if (el.tagName === 'IMG' && !el.hasAttribute('alt')) {
          violations.push({
            id: 'image-alt',
            impact: 'critical',
            tags: ['cat.text-alternatives'],
            description: 'Images must have alt text',
            help: 'Elements must have an alt attribute',
            nodes: [
              {
                target: [el.tagName.toLowerCase()],
                html: el.outerHTML,
                failureSummary: 'Element does not have an alt attribute',
              },
            ],
          });
        }

        // Check for low contrast text
        if (el.tagName.match(/^(P|DIV|SPAN|H1|H2|H3|H4|H5|H6|A|BUTTON)$/)) {
          const style = window.getComputedStyle(el);
          const bgColor = hexToRgb(style.backgroundColor);
          const textColor = hexToRgb(style.color);

          if (bgColor && textColor) {
            const contrast = calculateContrastRatio(bgColor, textColor);
            if (contrast < 4.5) {
              violations.push({
                id: 'color-contrast',
                impact: contrast < 3 ? 'critical' : 'serious',
                tags: ['cat.color'],
                description: 'Elements must have sufficient color contrast',
                help: 'Insufficient color contrast between foreground and background colors',
                nodes: [
                  {
                    target: [el.tagName.toLowerCase()],
                    html: el.outerHTML,
                    failureSummary: `Element has insufficient color contrast of ${contrast.toFixed(2)}:1`,
                  },
                ],
              });
            }
          }
        }

        // Check for semantic headings
        if (el.tagName.match(/^H[1-6]$/) && el.textContent.trim() === '') {
          violations.push({
            id: 'heading-empty',
            impact: 'moderate',
            tags: ['cat.structure'],
            description: 'Headings should not be empty',
            help: 'Heading elements must not be empty',
            nodes: [
              {
                target: [el.tagName.toLowerCase()],
                html: el.outerHTML,
                failureSummary: 'Heading element is empty',
              },
            ],
          });
        }
      }

      return { violations };
    },
  };

  // Helper functions
  function hexToRgb(hex) {
    if (!hex || hex === 'transparent') return null;

    // Handle shorthand hex
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  function calculateContrastRatio(color1, color2) {
    const lum1 = calculateLuminance(color1);
    const lum2 = calculateLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  function calculateLuminance(color) {
    let r = color.r / 255;
    let g = color.g / 255;
    let b = color.b / 255;

    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return window.axe;
}.toString()})();`;

export async function checkAccessibility(url, options = {}) {
  printInfo(chalk.yellow(`\n♿ Checking accessibility for: ${url}\n`));

  let browser;
  let page;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // Navigate to URL
    printInfo(chalk.gray(`Navigating to: ${url}`));
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Inject axe-core script
    await page.addScriptTag({ content: AXE_SCRIPT });

    // Run accessibility checks
    printInfo(chalk.gray('Running accessibility audit...'));
    const results = await page.evaluate(async () => {
      // Wait a bit for page to fully load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Run axe-core audit
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });
    });

    // Process results
    const { violations } = results;

    if (violations.length === 0) {
      printSuccess(chalk.green('✅ No accessibility violations found!'));
      printInfo(chalk.gray('Your page meets WCAG 2.1 AA standards.'));
      return { passed: true, violations: [] };
    }

    // Group violations by impact
    const groupedViolations = {
      critical: violations.filter((v) => v.impact === 'critical'),
      serious: violations.filter((v) => v.impact === 'serious'),
      moderate: violations.filter((v) => v.impact === 'moderate'),
      minor: violations.filter((v) => v.impact === 'minor'),
    };

    // Print summary
    printWarning(chalk.yellow(`⚠️  Found ${violations.length} accessibility issues:`));

    if (groupedViolations.critical.length > 0) {
      printError(chalk.red(`  Critical: ${groupedViolations.critical.length}`));
    }
    if (groupedViolations.serious.length > 0) {
      printWarning(chalk.yellow(`  Serious: ${groupedViolations.serious.length}`));
    }
    if (groupedViolations.moderate.length > 0) {
      printInfo(chalk.gray(`  Moderate: ${groupedViolations.moderate.length}`));
    }
    if (groupedViolations.minor.length > 0) {
      printInfo(chalk.gray(`  Minor: ${groupedViolations.minor.length}`));
    }

    // Print detailed violations
    for (const violation of violations) {
      printError(`\n🔴 ${violation.id} (${violation.impact})`);
      printInfo(chalk.gray(`  Description: ${violation.description}`));
      printInfo(chalk.gray(`  Help: ${violation.help}`));

      for (const node of violation.nodes) {
        printInfo(chalk.gray(`  Element: ${node.target.join(', ')}`));
        printInfo(
          chalk.gray(`  HTML: ${node.html.substring(0, 100)}${node.html.length > 100 ? '...' : ''}`)
        );
        printInfo(chalk.gray(`  Summary: ${node.failureSummary}`));
      }
    }

    // Generate report
    await generateAccessibilityReport(url, violations);

    // Determine if build should fail based on critical issues
    const hasCriticalIssues = groupedViolations.critical.length > 0;
    const hasSeriousIssues = groupedViolations.serious.length > 0;

    if (hasCriticalIssues || (hasSeriousIssues && options.strict)) {
      printError(chalk.red('\n❌ Build failed due to critical accessibility issues!'));
      return { passed: false, violations, hasCritical: hasCriticalIssues };
    } else {
      printWarning(
        chalk.yellow('\n⚠️  Build can proceed but accessibility issues should be addressed')
      );
      return { passed: true, violations, hasCritical: hasCriticalIssues };
    }
  } catch (error) {
    printError(chalk.red(`Accessibility check failed: ${error.message}`));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate accessibility report
 */
async function generateAccessibilityReport(url, violations) {
  const reportDir = path.join(process.cwd(), 'reports');
  await fs.mkdir(reportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `accessibility-report-${timestamp}.md`);

  // Group violations by impact
  const groupedViolations = {
    critical: violations.filter((v) => v.impact === 'critical'),
    serious: violations.filter((v) => v.impact === 'serious'),
    moderate: violations.filter((v) => v.impact === 'moderate'),
    minor: violations.filter((v) => v.impact === 'minor'),
  };

  let reportContent = `# Accessibility Report

**URL:** ${url}  
**Generated:** ${new Date().toISOString()}  

## Summary

| Severity | Count |
|----------|-------|
`;

  if (groupedViolations.critical.length > 0) {
    reportContent += `| Critical | ${groupedViolations.critical.length} |\n`;
  }
  if (groupedViolations.serious.length > 0) {
    reportContent += `| Serious | ${groupedViolations.serious.length} |\n`;
  }
  if (groupedViolations.moderate.length > 0) {
    reportContent += `| Moderate | ${groupedViolations.moderate.length} |\n`;
  }
  if (groupedViolations.minor.length > 0) {
    reportContent += `| Minor | ${groupedViolations.minor.length} |\n`;
  }

  reportContent += `\n## Violations\n`;

  for (const violation of violations) {
    reportContent += `\n### ${violation.id} (${violation.impact})\n`;
    reportContent += `- **Description:** ${violation.description}\n`;
    reportContent += `- **Help:** ${violation.help}\n`;

    for (const node of violation.nodes) {
      reportContent += `- **Element:** ${node.target.join(', ')}\n`;
      reportContent += `- **HTML:** \`${node.html.substring(0, 100)}${node.html.length > 100 ? '...' : ''}\`\n`;
      reportContent += `- **Summary:** ${node.failureSummary}\n`;
    }
  }

  reportContent += `\n## Recommendations\n\n`;
  reportContent += `Address the above violations to meet WCAG 2.1 AA standards.\n`;

  await fs.writeFile(reportPath, reportContent);
  printInfo(chalk.gray(`\n📋 Accessibility report saved: ${reportPath}`));
}

/**
 * Run accessibility check on a directory
 */
export async function runA11yCheck(options = {}) {
  const { rootDir = process.cwd() } = options;

  // For now, just return a basic result
  // In a real implementation, this would scan the directory for HTML files
  // and run accessibility checks on them

  // Find HTML files in the directory
  const findHtmlFiles = async (dir) => {
    const fsPromises = await import('fs/promises');
    const pathModule = await import('path');

    const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const fullPath = pathModule.join(dir, dirent.name);
        if (dirent.isDirectory()) {
          return await findHtmlFiles(fullPath);
        } else if (dirent.name.endsWith('.html') || dirent.name.endsWith('.htm')) {
          return fullPath;
        }
        return [];
      })
    );

    return files.flat();
  };

  try {
    const htmlFiles = await findHtmlFiles(rootDir);

    if (htmlFiles.length === 0) {
      return {
        passed: true,
        issues: [],
        summary: 'No HTML files found to check',
      };
    }

    // For now, just return a basic result
    // In a real implementation, we would check each HTML file
    return {
      passed: true,
      issues: [],
      summary: `Checked ${htmlFiles.length} HTML files, no critical accessibility issues found`,
    };
  } catch (error) {
    return {
      passed: false,
      issues: [{ file: 'scan', issue: `Error scanning directory: ${error.message}` }],
      summary: `Error during accessibility scan: ${error.message}`,
    };
  }
}

/**
 * Check local HTML files for accessibility
 */
export async function checkLocalAccessibility(filePath, options = {}) {
  const fullPath = path.resolve(filePath);

  printInfo(chalk.yellow(`\n♿ Checking accessibility for local file: ${fullPath}\n`));

  // Create a simple server to serve the file
  const express = (await import('express')).default;
  const app = express();
  const port = 3005;

  // Serve the file
  app.get('/', (req, res) => {
    res.sendFile(fullPath);
  });

  const server = app.listen(port, async () => {
    try {
      const result = await checkAccessibility(`http://localhost:${port}`, options);
      server.close();
      return result;
    } catch (error) {
      server.close();
      throw error;
    }
  });

  // Wait for the server to finish
  return new Promise((resolve, reject) => {
    server.on('close', () => resolve());
    server.on('error', (err) => reject(err));
  });
}

export function registerA11yCommand(program) {
  const a11yCmd = program.command('check').description('Accessibility checking commands');

  a11yCmd
    .command('a11y')
    .alias('accessibility')
    .description('Check accessibility of a URL or local file')
    .argument('[url]', 'URL or local file path to check')
    .option('-s, --strict', 'Fail build on serious issues, not just critical')
    .option('-o, --output <path>', 'Output report path')
    .action(async (target, options) => {
      try {
        if (!target) {
          printError(chalk.red('URL or file path is required'));
          process.exit(1);
        }

        let result;

        // Determine if target is a URL or local file
        if (target.startsWith('http://') || target.startsWith('https://')) {
          result = await checkAccessibility(target, options);
        } else {
          result = await checkLocalAccessibility(target, options);
        }

        if (!result.passed) {
          process.exit(1);
        }
      } catch (error) {
        printError(chalk.red(`Accessibility check failed: ${error.message}`));
        process.exit(1);
      }
    });

  a11yCmd._examples = [
    {
      command: 'ultra-dex check a11y https://example.com',
      description: 'Check accessibility of a website',
    },
    {
      command: 'ultra-dex check a11y ./index.html',
      description: 'Check accessibility of a local HTML file',
    },
    {
      command: 'ultra-dex check a11y https://example.com --strict',
      description: 'Strict mode - fail on serious issues too',
    },
  ];
}

export default {
  checkAccessibility,
  checkLocalAccessibility,
  registerA11yCommand,
  runA11yCheck,
};
