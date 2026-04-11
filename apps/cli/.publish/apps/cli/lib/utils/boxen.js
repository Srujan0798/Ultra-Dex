// Copyright (c) 2026 Ultra-Dex

import stripAnsi from '../../../../src/utils/strip-ansi.js';

const BORDER_STYLES = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  bold: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
  classic: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
  none: null,
};

function normalizeSpacing(value = 0) {
  if (typeof value === 'number') {
    const size = Math.max(0, Math.floor(value));
    return { top: size, right: size, bottom: size, left: size };
  }

  if (value && typeof value === 'object') {
    return {
      top: Math.max(0, Math.floor(value.top ?? 0)),
      right: Math.max(0, Math.floor(value.right ?? 0)),
      bottom: Math.max(0, Math.floor(value.bottom ?? 0)),
      left: Math.max(0, Math.floor(value.left ?? 0)),
    };
  }

  return { top: 0, right: 0, bottom: 0, left: 0 };
}

function spaces(count) {
  return count > 0 ? ' '.repeat(count) : '';
}

function withTitle(topLine, border, innerWidth, options = {}) {
  const title = options.title == null ? '' : String(options.title);
  const visibleTitleWidth = stripAnsi(title).length;
  if (!title || visibleTitleWidth === 0 || visibleTitleWidth + 2 > innerWidth) {
    return topLine;
  }

  const alignment = options.titleAlignment || 'left';
  const remaining = innerWidth - (visibleTitleWidth + 2);
  let left = 0;

  if (alignment === 'center') {
    left = Math.floor(remaining / 2);
  } else if (alignment === 'right') {
    left = remaining;
  }

  const right = Math.max(0, remaining - left);
  return `${border.tl}${border.h.repeat(left)} ${title} ${border.h.repeat(right)}${border.tr}`;
}

export default function boxen(content, options = {}) {
  const padding = normalizeSpacing(options.padding ?? 0);
  const margin = normalizeSpacing(options.margin ?? 0);
  const border = BORDER_STYLES[options.borderStyle || 'single'] || BORDER_STYLES.single;

  const raw = content == null ? '' : String(content);
  const lines = raw.split('\n');
  const lineWidth = lines.reduce((max, line) => Math.max(max, stripAnsi(line).length), 0);
  const innerWidth = lineWidth + padding.left + padding.right;

  const paddedLines = [];
  for (let i = 0; i < padding.top; i += 1) {
    paddedLines.push(spaces(innerWidth));
  }

  for (const line of lines) {
    const visibleWidth = stripAnsi(line).length;
    const rightPadding = Math.max(0, lineWidth - visibleWidth);
    paddedLines.push(`${spaces(padding.left)}${line}${spaces(rightPadding + padding.right)}`);
  }

  for (let i = 0; i < padding.bottom; i += 1) {
    paddedLines.push(spaces(innerWidth));
  }

  let outputLines = [];
  if (!border) {
    outputLines = paddedLines;
  } else {
    const topBase = `${border.tl}${border.h.repeat(innerWidth)}${border.tr}`;
    const top = withTitle(topBase, border, innerWidth, options);
    outputLines = [
      top,
      ...paddedLines.map((line) => `${border.v}${line}${border.v}`),
      `${border.bl}${border.h.repeat(innerWidth)}${border.br}`,
    ];
  }

  const leftMargin = spaces(margin.left);
  const rightMargin = spaces(margin.right);
  outputLines = outputLines.map((line) => `${leftMargin}${line}${rightMargin}`);

  return `${'\n'.repeat(margin.top)}${outputLines.join('\n')}${'\n'.repeat(margin.bottom)}`;
}
