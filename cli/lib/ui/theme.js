// Ultra-Dex CLI — Professional Purple Theme
// This file provides the visual styling for the CLI

import chalk from 'chalk';
import gradient from 'gradient-string';

// ═══════════════════════════════════════════════════════════════
// PROFESSIONAL PURPLE COLOR PALETTE
// ═══════════════════════════════════════════════════════════════

export const themeColors = {
  primary: '#6366f1',     // Indigo
  secondary: '#8b5cf6',   // Purple
  accent: '#d946ef',      // Pink
  success: '#22c55e',     // Green
  warning: '#f59e0b',     // Amber
  error: '#ef4444',       // Red
  dim: '#6b7280',         // Gray
  muted: '#4b5563'        // Darker Gray
};

export const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);

export const theme = {
    // Primary brand colors
    primary: chalk.hex(themeColors.primary),
    secondary: chalk.hex(themeColors.secondary),
    accent: chalk.hex(themeColors.accent),

    // Status colors
    success: chalk.hex(themeColors.success),
    error: chalk.hex(themeColors.error),
    warning: chalk.hex(themeColors.warning),
    info: chalk.hex(themeColors.primary),

    // Text styles
    title: chalk.hex(themeColors.secondary).bold,
    subtitle: chalk.hex(themeColors.primary),
    dim: chalk.hex(themeColors.dim),
    muted: chalk.hex(themeColors.muted),

    // Special
    highlight: chalk.hex(themeColors.secondary).inverse,
    link: chalk.hex(themeColors.primary).underline,
    code: chalk.hex(themeColors.accent),
};

// ═══════════════════════════════════════════════════════════════
// STYLED COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function box(content, title = '') {
    const width = 60;
    const border = theme.secondary;

    const top = border('╭' + '─'.repeat(width - 2) + '╮');
    const bottom = border('╰' + '─'.repeat(width - 2) + '╯');
    const side = border('│');

    const lines = content.split('\n');
    const paddedLines = lines.map(line => {
        const padding = width - 4 - stripAnsi(line).length;
        return `${side} ${line}${' '.repeat(Math.max(0, padding))} ${side}`;
    });

    let titleBar = '';
    if (title) {
        const titlePadding = Math.floor((width - 4 - title.length) / 2);
        titleBar = border('│') + ' '.repeat(titlePadding) + theme.title(title) + ' '.repeat(width - 4 - titlePadding - title.length) + border('│') + '\n';
        titleBar += border('├' + '─'.repeat(width - 2) + '┤') + '\n';
    }

    return top + '\n' + titleBar + paddedLines.join('\n') + '\n' + bottom;
}

export function divider(char = '─', width = 60) {
    return theme.dim(char.repeat(width));
}

export function header(text) {
    console.log('');
    console.log(theme.title(`  ${text}`));
    console.log(theme.dim('  ' + '─'.repeat(56)));
}

export function subheader(text) {
    console.log(theme.subtitle(`  ${text}`));
}

// ═══════════════════════════════════════════════════════════════
// STATUS INDICATORS
// ═══════════════════════════════════════════════════════════════

export const status = {
    success: theme.success('✓'),
    error: theme.error('✗'),
    warning: theme.warning('⚠'),
    info: theme.info('ℹ'),
    pending: theme.dim('○'),
    running: theme.accent('◉'),
    arrow: theme.primary('→'),
    bullet: theme.dim('•'),
};

export function statusLine(icon, text, detail = '') {
    const detailText = detail ? theme.dim(` · ${detail}`) : '';
    console.log(`  ${icon} ${text}${detailText}`);
}

// ═══════════════════════════════════════════════════════════════
// TABLE STYLING
// ═══════════════════════════════════════════════════════════════

export function table(headers, rows) {
    const colWidths = headers.map((h, i) => {
        const maxRow = Math.max(...rows.map(r => String(r[i] || '').length));
        return Math.max(h.length, maxRow) + 2;
    });

    const border = theme.dim;

    // Top border
    console.log(border('  ┌' + colWidths.map(w => '─'.repeat(w)).join('┬') + '┐'));

    // Header row
    const headerRow = headers.map((h, i) => theme.title(h.padEnd(colWidths[i] - 2))).join(border(' │ '));
    console.log(border('  │ ') + headerRow + border(' │'));

    // Header separator
    console.log(border('  ├' + colWidths.map(w => '─'.repeat(w)).join('┼') + '┤'));

    // Data rows
    rows.forEach(row => {
        const rowText = row.map((cell, i) => String(cell || '').padEnd(colWidths[i] - 2)).join(border(' │ '));
        console.log(border('  │ ') + rowText + border(' │'));
    });

    // Bottom border
    console.log(border('  └' + colWidths.map(w => '─'.repeat(w)).join('┴') + '┘'));
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS & LOADING
// ═══════════════════════════════════════════════════════════════

export function progressBar(current, total, width = 40) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = theme.primary('█'.repeat(filled)) + theme.dim('░'.repeat(empty));
    return `${bar} ${theme.accent(percentage + '%')}`;
}

export function loadingDots() {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    return setInterval(() => {
        process.stdout.write(`\r  ${theme.accent(frames[i])} `);
        i = (i + 1) % frames.length;
    }, 80);
}

// ═══════════════════════════════════════════════════════════════
// KEYBOARD HINTS
// ═══════════════════════════════════════════════════════════════

export function keyHints(hints) {
    const formattedHints = hints.map(([key, action]) =>
        `${theme.highlight(` ${key} `)} ${theme.dim(action)}`
    ).join('  ');

    console.log('');
    console.log(`  ${formattedHints}`);
}

// ═══════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════

function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}