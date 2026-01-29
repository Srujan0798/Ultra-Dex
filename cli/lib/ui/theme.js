// Ultra-Dex CLI — Doomsday Theme Interface
// This file provides the visual styling for the CLI

import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════
// DOOMSDAY COLOR PALETTE (Like Gemini's green, but Doomsday style)
// ═══════════════════════════════════════════════════════════════

export const theme = {
    // Primary brand colors
    primary: chalk.hex('#22c55e'),      // Doomsday green (like matrix/gemini)
    secondary: chalk.hex('#10b981'),    // Emerald
    accent: chalk.hex('#4ade80'),       // Bright green

    // Status colors
    success: chalk.hex('#22c55e'),      // Green
    error: chalk.hex('#ef4444'),        // Red
    warning: chalk.hex('#f59e0b'),      // Amber
    info: chalk.hex('#3b82f6'),         // Blue

    // Text styles
    title: chalk.hex('#22c55e').bold,   // Green bold
    subtitle: chalk.hex('#6ee7b7'),     // Light green
    dim: chalk.hex('#6b7280'),          // Gray
    muted: chalk.hex('#4b5563'),        // Darker gray

    // Special
    highlight: chalk.hex('#22c55e').inverse,
    link: chalk.hex('#60a5fa').underline,
    code: chalk.hex('#a5f3fc'),         // Cyan for code
};

// ═══════════════════════════════════════════════════════════════
// STYLED COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function box(content, title = '') {
    const width = 60;
    const border = theme.primary;

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
// STATUS INDICATORS (Like Claude Code's checkmarks)
// ═══════════════════════════════════════════════════════════════

export const status = {
    success: theme.success('✓'),
    error: theme.error('✗'),
    warning: theme.warning('⚠'),
    info: theme.info('●'),
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
// TABLE STYLING (Like CLI tables with borders)
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
// KEYBOARD HINTS (Like at bottom of Gemini CLI)
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
