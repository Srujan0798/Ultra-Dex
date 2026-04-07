// Copyright (c) 2026 Ultra-Dex

// Ultra-Dex CLI — Professional Rendering Engine
// Handles streaming, markdown, and high-fidelity UI output

import chalk from 'chalk';
import boxen from '../utils/boxen.js';
import ora from '../utils/ora.js';
import { theme, ultraGradient } from './theme.js';

// Configuration
const CONFIG = {
  typingSpeed: 15, // ms per char
  lineDelay: 100, // ms between lines
};

const IS_TEST = process.env.NODE_ENV === 'test' || process.env.ULTRA_DEX_TEST === '1';

/**
 * The Renderer Class
 * Replaces console.log with a professional UI manager
 */
class Renderer {
  constructor() {
    this.spinner = null;
  }

  /**
   * Clear the screen and show the professional header
   */
  clearScreen() {
    // Only clear screen in interactive TTY mode
    if (process.stdout && process.stdout.isTTY && !IS_TEST) {
      console.clear();
    }
    this.header();
  }

  /**
   * Render the Top Banner
   */
  header() {
    const logo = `
  ██╗   ██╗██╗  ████████╗██████╗  █████╗ 
  ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗
  ██║   ██║██║     ██║   ██████╔╝███████║
  ██║   ██║██║     ██║   ██╔══██╗██╔══██║
  ╚██████╔╝███████╗██║   ██║  ██║██║  ██║
   ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝`;

    console.log(ultraGradient(logo));
    console.log('');
    this.divider();
  }

  /**
   * Render a section divider
   */
  divider() {
    console.log(
      theme.dim(
        '  ' + '─'.repeat(process.stdout.columns ? Math.min(60, process.stdout.columns - 4) : 60)
      )
    );
    console.log('');
  }

  /**
   * Render a Markdown-like block with typing effect
   * @param {string} text - The text to render
   * @param {boolean} stream - Whether to use typing effect (default: true)
   */
  async text(text, stream = true) {
    if (IS_TEST || (process.stdout && !process.stdout.isTTY)) stream = false;
    if (!stream) {
      console.log('  ' + this.formatMarkdown(text));
      return;
    }

    const lines = text.split('\n');
    for (const line of lines) {
      const formatted = this.formatMarkdown(line);
      await this.typeLine('  ' + formatted);
    }
    console.log('');
  }

  /**
   * Internal: Type a single line character by character (Simulates AI)
   */
  async typeLine(line) {
    // If line contains ANSI codes, typing it char-by-char is hard.
    // For simple text, we type. For formatted, we dump the line with a small delay.
    if ((process.stdout && !process.stdout.isTTY) || line.includes('\x1b')) {
      console.log(line);
      if (process.stdout && process.stdout.isTTY) {
        await this.sleep(CONFIG.typingSpeed * 5);
      }
    } else {
      for (const char of line) {
        process.stdout.write(char);
        await this.sleep(CONFIG.typingSpeed);
      }
      process.stdout.write('\n');
    }
  }

  /**
   * Start a "Thinking" spinner
   * @param {string} message
   */
  startSpinner(message) {
    if (IS_TEST) {
      console.log(theme.dim(message));
      return;
    }
    if (this.spinner) this.spinner.stop();
    this.spinner = ora({
      text: theme.dim(message),
      color: 'magenta', // Closest to purple supported by ora
      spinner: 'dots',
    }).start();
  }

  /**
   * Stop the spinner with success
   * @param {string} message
   */
  succeed(message) {
    if (this.spinner) {
      this.spinner.succeed(theme.success(message));
      this.spinner = null;
    } else {
      console.log(theme.success('  ✓ ' + message));
    }
  }

  /**
   * Stop the spinner with failure
   * @param {string} message
   */
  fail(message) {
    if (this.spinner) {
      this.spinner.fail(theme.error(message));
      this.spinner = null;
    } else {
      console.log(theme.error('  ✖ ' + message));
    }
  }

  /**
   * Render a box (Code block or Alert)
   * @param {string} content
   * @param {string} title
   * @param {string} style - 'info' | 'error' | 'success' | 'code'
   */
  box(content, title = '', style = 'info') {
    let borderColor = '#7c3aed'; // Default Purple
    if (style === 'error') borderColor = '#dc2626'; // Red
    if (style === 'success') borderColor = '#22c55e'; // Green

    console.log(
      boxen(content, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: borderColor,
        title: title ? chalk.bold(title) : undefined,
        titleAlignment: 'left',
      })
    );
  }

  /**
   * Render a "Thinking" Process Block (Gemini/Claude Style)
   * Shows a sequence of steps, then collapses them.
   * @param {string} header - The main task (e.g. "Analyzing Codebase")
   * @param {string[]} steps - Array of steps to show sequentially
   */
  async thinking(header, steps) {
    if (IS_TEST || (process.stdout && !process.stdout.isTTY) || process.env.CI) {
      console.log(theme.dim(header));
      for (const step of steps) {
        console.log(theme.dim(`  ✓ ${step}`));
      }
      return;
    }
    console.log(theme.dim('╭─ ') + theme.accent('⚡ ' + header));

    for (const step of steps) {
      const spinner = ora({
        text: theme.dim(step),
        spinner: 'dots',
        color: 'magenta',
        indent: 2,
      }).start();

      await this.sleep(CONFIG.typingSpeed * 20 + Math.random() * 500); // Varied "thinking" time

      // Mark as done
      spinner.stopAndPersist({
        symbol: theme.success('│  ✓'),
        text: theme.dim(step),
      });
    }

    console.log(theme.dim('╰─ ') + theme.success('Done'));
    console.log('');
  }

  /**
   * Simple Markdown Formatter
   * Converts **bold**, `code`, > blockquote
   */
  formatMarkdown(text) {
    return (
      text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, (_, p1) => theme.title(p1))
        // Code
        .replace(/`(.*?)`/g, (_, p1) => theme.code(p1))
        // Link
        .replace(/`(.*?)`/g, (_, p1) => theme.link(p1))
        // Arrow/Bullet
        .replace(/^- /g, theme.accent('  › '))
        // Key/Value
        .replace(/^([a-zA-Z0-9\s]+):/g, (_, p1) => theme.dim(p1) + ':')
    );
  }

  sleep(ms) {
    if (IS_TEST) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const renderer = new Renderer();

/**
 * Safe execution wrapper with error handling for renderer
 * @param {Function} fn - Async function to execute
 * @param {string} [context='renderer'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'renderer') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
