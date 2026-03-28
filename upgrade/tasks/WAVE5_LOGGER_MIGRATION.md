# WAVE5_LOGGER_MIGRATION - Migrate console.log to Logger
## Objective
Replace 5191 console.log/console.error/console.warn calls with Logger class across src/, apps/cli/, and platform/ directories.
## Files to Process
- apps/cli/lib/commands/*.js (core commands)
- src/core/**/*.js (core modules)
- src/platform/**/*.js (platform code)
## Migration Pattern
**Before:**
```javascript
console.log(chalk.green(message));
console.error(chalk.red(error));
```

**After:**
```javascript
import { logger } from '../utils/logger.js';
logger.info(message);
logger.error(error);
```

## Verification
- All functionality preserved
- No console.* calls remain except in logger.js itself
- Tests pass
- No breaking changes

## Output
Create /Users/srujansai/Desktop/Ultra-Dex/upgrade/reports/logging-migration-complete.md with before/after stats.