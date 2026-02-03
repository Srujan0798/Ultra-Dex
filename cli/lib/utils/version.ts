/**
 * Version utility - Single source of truth
 * All files should import VERSION from here
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string; name: string };

export const VERSION: string = pkg.version;
export const PACKAGE_NAME: string = pkg.name;

export default VERSION;
