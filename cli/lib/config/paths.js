// Copyright (c) 2026 Ultra-Dex

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ASSETS_ROOT = path.resolve(__dirname, '../../assets');
export const ROOT_FALLBACK = path.resolve(__dirname, '../../../');
export const LIVE_TEMPLATES_ROOT = path.join(ASSETS_ROOT, 'live-templates');
