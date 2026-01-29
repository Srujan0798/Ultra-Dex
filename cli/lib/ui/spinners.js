// Ultra-Dex CLI — Spinner & Loading Animations
// Professional loading states like Gemini CLI

import chalk from 'chalk';
import ora from 'ora';
import { theme } from './theme.js';

// ═══════════════════════════════════════════════════════════════
// CUSTOM SPINNER (Matrix-style green)
// ═══════════════════════════════════════════════════════════════

const doomsdaySpinner = {
    interval: 80,
    frames: [
        '▰▱▱▱▱▱▱',
        '▰▰▱▱▱▱▱',
        '▰▰▰▱▱▱▱',
        '▰▰▰▰▱▱▱',
        '▰▰▰▰▰▱▱',
        '▰▰▰▰▰▰▱',
        '▰▰▰▰▰▰▰',
        '▱▰▰▰▰▰▰',
        '▱▱▰▰▰▰▰',
        '▱▱▱▰▰▰▰',
        '▱▱▱▱▰▰▰',
        '▱▱▱▱▱▰▰',
        '▱▱▱▱▱▱▰'
    ]
};

const dotSpinner = {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
};

const pulseSpinner = {
    interval: 100,
    frames: ['●', '◉', '○', '◉']
};

// ═══════════════════════════════════════════════════════════════
// SPINNER FACTORY
// ═══════════════════════════════════════════════════════════════

export function createSpinner(text, type = 'default') {
    const spinnerType = type === 'progress' ? doomsdaySpinner :
        type === 'pulse' ? pulseSpinner : dotSpinner;

    return ora({
        text: theme.dim(text),
        spinner: spinnerType,
        color: 'green'
    });
}

export function startLoading(text) {
    const spinner = createSpinner(text);
    spinner.start();
    return spinner;
}

export function succeed(spinner, text) {
    spinner.succeed(theme.success(text));
}

export function fail(spinner, text) {
    spinner.fail(theme.error(text));
}

// ═══════════════════════════════════════════════════════════════
// TASK LIST (Like Gemini's multi-step tasks)
// ═══════════════════════════════════════════════════════════════

export async function runTaskList(tasks) {
    console.log('');

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const spinner = createSpinner(task.title, 'progress');
        spinner.start();

        try {
            await task.fn();
            spinner.succeed(theme.success(task.title));
        } catch (error) {
            spinner.fail(theme.error(`${task.title}: ${error.message}`));
            throw error;
        }
    }

    console.log('');
}

// ═══════════════════════════════════════════════════════════════
// TYPING EFFECT (Like AI typing response)
// ═══════════════════════════════════════════════════════════════

export async function typeText(text, speed = 20) {
    for (const char of text) {
        process.stdout.write(theme.primary(char));
        await new Promise(r => setTimeout(r, speed));
    }
    console.log('');
}

// ═══════════════════════════════════════════════════════════════
// COUNTDOWN
// ═══════════════════════════════════════════════════════════════

export async function countdown(seconds, message) {
    for (let i = seconds; i > 0; i--) {
        process.stdout.write(`\r  ${theme.accent(i)} ${theme.dim(message)}`);
        await new Promise(r => setTimeout(r, 1000));
    }
    process.stdout.write('\r' + ' '.repeat(60) + '\r');
}
