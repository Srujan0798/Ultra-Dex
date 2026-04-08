// @ts-check
// Copyright (c) 2026 Ultra-Dex

import ansiRegex from 'ansi-regex';

const ANSI_PATTERN = ansiRegex();

export default function stripAnsi(value) {
  return String(value ?? '').replace(ANSI_PATTERN, '');
}
