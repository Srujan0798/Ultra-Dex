# Logging Migration - Detailed Plan

## File: `/Users/srujansai/Desktop/Ultra-Dex/apps/cli/commands/commit.js`

### Current console usage:

- Line 92: `console.log(colors.info('Nothing to commit. Working directory clean.'))` → `logger.info('Nothing to commit. Working directory clean.')`
- Line 96: `console.log(colors.info(`Found ${status.files.length} changed files:`))` → `logger.info(`Found ${status.files.length} changed files:`)`
- Line 102: `console.log(` ${colors.subtle(file.index)} ${file.path} (${statusSymbol})`)` → `logger.info(`File: ${file.path} (${statusSymbol})`, file.index)`
- Line 117: `console.log(colors.warning('No commit message provided. Exiting.'))` → `logger.warn('No commit message provided. Exiting.')`
- Line 123: `console.log(colors.info(`Commit message: ${colors.highlight(commitMessage)}`))` → `logger.info(`Commit message: ${commitMessage}`)`
- Line 129: `console.log(colors.info('Commit cancelled.'))` → `logger.info('Commit cancelled.')`
- Line 136: `console.log(colors.info('Staging all changes...'))` → `logger.info('Staging all changes...')`
- Line 149: `console.log(colors.success(`✓ Successfully committed ${status.files.length} files`))` → `logger.success(`Successfully committed ${status.files.length} files`)`
- Line 150: `console.log(colors.subtle(`Commit: ${result.commit}`))` → `logger.info(`Commit: ${result.commit}`)`
- Line 154: `console.log(colors.info('Pushing changes...'))` → `logger.info('Pushing changes...')`
- Line 156: `console.log(colors.success('✓ Changes pushed successfully'))` → `logger.success('Changes pushed successfully')`
- Line 163: `console.error(colors.error(`Commit failed: ${error.message}`))` → `logger.error(`Commit failed: ${error.message}`, error)`

## File: `/Users/srujansai/Desktop/Ultra-Dex/apps/cli/commands/learn.js`

### Current console usage:

- Line 9: `console.error(`\x1b[31mError running tutorial: ${error.message}\x1b[0m`)` → `logger.error(`Error running tutorial: ${error.message}`, error)`

## File: `/Users/srujansai/Desktop/Ultra-Dex/apps/cli/src/wasm/index.js`

### Current console usage:

- Line 46: `console.error('[index]', error instanceof Error ? error.message : String(error))` → `logger.error('WASM index error', error)`

## File: `/Users/srujansai/Desktop/Ultra-Dex/apps/cli/src/wasm/runtime.js`

### Current console usage:

- Line 88: `console.error('[runtime]', error instanceof Error ? error.message : String(error))` → `logger.error('WASM runtime error', error)`

## Import Pattern

All files should import the logger:

```javascript
import { logger } from '../lib/ui/logger.js';
// or use convenience functions:
import { printSuccess, printInfo, printError, printWarning } from '../lib/ui/logger.js';
```

## Migration Benefits

- Consistent logging format across CLI
- Color and styling handled by logger
- Redaction of sensitive information
- Persona-based messaging support
- Quiet mode support
- Debug mode filtering

## Testing

After migration, verify:

1. Log messages appear correctly in normal mode
2. Quiet mode suppresses all output
3. Error messages include proper error details
4. Debug messages only appear when DEBUG env var is set
