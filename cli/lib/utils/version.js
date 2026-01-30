/**
 * Version utility - Single source of truth
 * All files should import VERSION from here
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export const VERSION = pkg.version;
export const PACKAGE_NAME = pkg.name;

export default VERSION;
