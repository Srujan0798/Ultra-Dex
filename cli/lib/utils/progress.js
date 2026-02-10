// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Progress module
 * @module utils/progress
 */

import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';
import cliProgress from 'cli-progress';

// MultiBar progress tracker
let multiBar = null;

export function showProgress(tasks) {
  // eslint-disable-next-line no-unused-vars
  const _total = tasks.length;
  console.log('');
  console.log(gradient(['#6366f1', '#8b5cf6']).bold('  ⚡ EXECUTING TASKS...'));
  console.log('');

  tasks.forEach((task) => {
    // Simple vertical list for now
    console.log(`  ${chalk.hex('#d946ef')('►')} ${task}`);
  });
  console.log('');
}

export function progressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const bar = chalk.hex('#6366f1')('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
  return `${bar} ${chalk.hex('#d946ef')(percentage + '%')}`;
}

// Enhanced progress bar with cli-progress
export class ProgressBar {
  constructor(options = {}) {
    this.spinner = null;
    this.progressBar = null;
    this.multiProgressBar = null;
    this.startTime = null;

    this.options = {
      format:
        options.format || ' {bar} {percentage}% | {value}/{total} | {task} | ETA: {eta_formatted}',
      barCompleteChar: '\u25A0', // ■
      barIncompleteChar: '\u25A1', // □
      hideCursor: true,
      clearOnComplete: true,
      showEta: options.showEta !== false,
      ...options,
    };
  }

  // Single progress bar
  start(total, initial = 0, task = 'Processing...') {
    this.startTime = Date.now();
    this.progressBar = new cliProgress.SingleBar(
      {
        format: this.options.format,
        barCompleteChar: this.options.barCompleteChar,
        barIncompleteChar: this.options.barIncompleteChar,
        hideCursor: this.options.hideCursor,
        clearOnComplete: this.options.clearOnComplete,
      },
      cliProgress.Presets.shades_grey
    );

    this.progressBar.start(total, initial, { task, eta_formatted: '--' });
    return this.progressBar;
  }

  update(current, task = null) {
    if (this.progressBar) {
      const payload = { task: task || this.progressBar.options.task };
      if (this.options.showEta) {
        payload.eta_formatted = this.calculateEta(current, this.progressBar.getTotal());
      }
      this.progressBar.update(current, payload);
    }
  }

  increment(task = null) {
    if (this.progressBar) {
      const current = this.progressBar.getCurrent();
      this.update(current + 1, task || this.progressBar.options.task);
    }
  }

  stop() {
    if (this.progressBar) {
      this.progressBar.stop();
      this.progressBar = null;
    }
  }

  // Multi-progress bar
  startMulti(tasks) {
    this.startTime = Date.now();
    this.multiProgressBar = new cliProgress.MultiBar(
      {
        format: this.options.format,
        barCompleteChar: this.options.barCompleteChar,
        barIncompleteChar: this.options.barIncompleteChar,
        hideCursor: this.options.hideCursor,
        clearOnComplete: false,
      },
      cliProgress.Presets.rect
    );

    const bars = {};
    tasks.forEach((task, index) => {
      bars[task.id || `task-${index}`] = this.multiProgressBar.create(task.total || 100, 0, {
        task: task.name,
      });
    });

    return bars;
  }

  updateMulti(bars, id, current, task = null) {
    if (bars[id]) {
      const payload = { task: task || bars[id].options.task };
      if (this.options.showEta) {
        payload.eta_formatted = this.calculateEta(current, bars[id].getTotal());
      }
      bars[id].update(current, payload);
    }
  }

  stopMulti() {
    if (this.multiProgressBar) {
      this.multiProgressBar.stop();
      this.multiProgressBar = null;
    }
  }

  // Animated spinner with ora
  startSpinner(text = 'Processing...', spinnerType = 'clock') {
    this.spinner = ora({
      text: gradient(['#6366f1', '#8b5cf6'])(text),
      spinner: spinnerType,
    });
    this.spinner.start();
    return this.spinner;
  }

  updateSpinner(text) {
    if (this.spinner) {
      this.spinner.text = gradient(['#6366f1', '#8b5cf6'])(text);
    }
  }

  succeedSpinner(text = 'Done!') {
    if (this.spinner) {
      this.spinner.succeed(gradient(['#10b981', '#34d399'])(text));
      this.spinner = null;
    }
  }

  failSpinner(text = 'Failed!') {
    if (this.spinner) {
      this.spinner.fail(chalk.red(text));
      this.spinner = null;
    }
  }

  warnSpinner(text = 'Warning!') {
    if (this.spinner) {
      this.spinner.warn(chalk.yellow(text));
      this.spinner = null;
    }
  }

  stopSpinner() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  calculateEta(current, total) {
    if (!this.startTime || current <= 0 || total <= 0) return '--';
    const elapsed = Date.now() - this.startTime;
    const rate = elapsed / current;
    const remaining = Math.max(total - current, 0);
    const etaMs = Math.round(rate * remaining);
    return this.formatTime(etaMs);
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
}

// Convenience functions
export function createAnimatedProgress(total, task = 'Processing...') {
  const progress = new ProgressBar();
  progress.start(total, 0, task);
  return progress;
}

export function createMultiProgress(tasks) {
  const progress = new ProgressBar();
  return progress.startMulti(tasks);
}

export function createSpinner(text = 'Loading...', spinnerType = 'clock') {
  const progress = new ProgressBar();
  return progress.startSpinner(text, spinnerType);
}

// Beautiful animated progress with gradient colors
export function showAnimatedProgress(current, total, message = 'Progress') {
  const percentage = Math.round((current / total) * 100);
  const width = 50;
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  // Create gradient effect for the progress bar
  const filledChars = '█'.repeat(filled);
  const emptyChars = '░'.repeat(empty);

  // Apply gradient to the filled portion
  let gradientBar = '';
  if (filled > 0) {
    const gradientColors = ['#6366f1', '#8b5cf6', '#d946ef']; // Blue to purple to pink
    const gradientText = filledChars
      .split('')
      .map((char, idx) => {
        const colorIndex = Math.floor((idx / filled) * gradientColors.length);
        return chalk.hex(gradientColors[colorIndex] || gradientColors[gradientColors.length - 1])(
          char
        );
      })
      .join('');
    gradientBar = gradientText;
  }

  const emptyBar = chalk.dim(emptyChars);
  const progressBar = gradientBar + emptyBar;

  // Clear line and show progress
  process.stdout.write(
    `\r${progressBar} ${chalk.bold(`${percentage}%`)} ${message} (${current}/${total})`
  );

  if (current >= total) {
    console.log(''); // New line when complete
  }
}

// Fancy progress visualization
export function showFancyProgress(current, total, options = {}) {
  const {
    message = 'Processing',
    symbol = '⚡',
    showPercentage = true,
    showCount = true,
  } = options;

  const percentage = Math.round((current / total) * 100);
  const width = 40;
  const filled = Math.round((current / total) * width);

  // Create a more artistic progress bar
  const leftSide = `[${gradient(['#6366f1', '#8b5cf6'])('|'.repeat(filled))}`;
  const rightSide = chalk.dim('·'.repeat(width - filled)) + ']';
  const progressBar = leftSide + rightSide;

  let output = `${symbol} ${message} `;
  if (showPercentage)
    output += `${chalk.bold(gradient(['#10b981', '#34d399'])(`${percentage}%`))} `;
  if (showCount) output += chalk.dim(`(${current}/${total})`);
  output += ` ${progressBar}`;

  process.stdout.write(`\r${output}`);

  if (current >= total) {
    console.log(''); // New line when complete
  }
}

// MultiStepProgress class for multi-step operations
export class MultiStepProgress {
  constructor(steps) {
    this.steps = steps;
    this.currentStep = 0;
    this.progressBars = [];
    this.completedSteps = new Set();
  }

  async run() {
    const multiBar = new cliProgress.MultiBar(
      {
        format: ' {bar} | {percentage}% | {step} | {status}',
        barCompleteChar: '\u25A0',
        barIncompleteChar: '\u25A1',
        hideCursor: true,
      },
      cliProgress.Presets.shades_grey
    );

    // Create progress bars for each step
    this.progressBars = this.steps.map((step, index) => {
      return multiBar.create(100, 0, {
        step: step.name,
        status: 'Pending',
      });
    });

    // Execute each step
    for (let i = 0; i < this.steps.length; i++) {
      this.currentStep = i;
      const step = this.steps[i];
      const bar = this.progressBars[i];

      try {
        // Update status to running
        bar.update(0, { step: step.name, status: chalk.yellow('Running') });

        // Execute the step function
        await step.execute(bar, this);

        // Mark as completed
        bar.update(100, { step: step.name, status: chalk.green('Completed') });
        this.completedSteps.add(i);
      } catch (error) {
        // Mark as failed
        bar.update(100, { step: step.name, status: chalk.red('Failed') });
        throw error;
      }
    }

    multiBar.stop();
  }

  updateStep(stepIndex, percentage, status = null) {
    if (this.progressBars[stepIndex]) {
      const step = this.steps[stepIndex];
      const statusText = status || this.progressBars[stepIndex].options.status;
      this.progressBars[stepIndex].update(percentage, {
        step: step.name,
        status: statusText,
      });
    }
  }

  getCurrentStep() {
    return this.currentStep;
  }

  getCompletedSteps() {
    return Array.from(this.completedSteps);
  }
}

// Async wrapper with progress
export async function withProgress(taskFn, options = {}) {
  const { message = 'Processing...', total = 100, onProgress = null } = options;

  const progress = new ProgressBar();
  const bar = progress.start(total, 0, message);

  try {
    // Call the task function with progress update capability
    const result = await taskFn((current, msg) => {
      progress.update(current, msg || message);
      if (onProgress) onProgress(current, total);
    });

    progress.succeedSpinner('Completed!');
    return result;
  } catch (error) {
    progress.failSpinner('Failed!');
    throw error;
  } finally {
    progress.stop();
  }
}

// Enhanced ProgressBar class with ETA
export class ProgressBarWithETA extends ProgressBar {}

// Color-coded status indicators
export const statusIndicators = {
  success: (text) => chalk.bgGreen.black(' SUCCESS '),
  warning: (text) => chalk.bgYellow.black(' WARNING '),
  error: (text) => chalk.bgRed.white(' ERROR '),
  info: (text) => chalk.bgBlue.white(' INFO '),
  processing: (text) => chalk.bgMagenta.white(' PROCESSING '),
};

// Completion animation
export function animateCompletion(callback) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;

  const spinner = setInterval(() => {
    process.stdout.write(`\r${chalk.yellow(frames[i++ % frames.length])} Finishing up...`);
  }, 100);

  setTimeout(() => {
    clearInterval(spinner);
    console.log(`\r${chalk.green('✓')} Completed!`);
    if (callback) callback();
  }, 1000);
}
