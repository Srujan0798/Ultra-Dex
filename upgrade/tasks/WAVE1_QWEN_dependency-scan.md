# TASK 11: Full Dependency Graph & Dead Code Scan

**Assigned to:** Qwen CLI  
**Priority:** Wave 1  
**Estimated time:** 20–30 minutes

---

## Objective

Scan the entire `src/` and `apps/` tree to produce:
1. A full import dependency graph
2. List of files never imported by anything (dead files)
3. List of npm packages listed in package.json but never imported (dead dependencies)

## Instructions

### Part A: Dead Files

1. Get list of all `.js`, `.ts`, `.cjs` files in `src/` and `apps/`
2. For each file, search if it's imported by ANY other file
3. Files that are never imported AND are not entry points (like `index.js`, CLI bins) are DEAD

```bash
# Get all source files
find src/ apps/ -name "*.js" -o -name "*.ts" -o -name "*.cjs" | sort > /tmp/all-files.txt

# For each file, check for imports
# Entry points to exclude: apps/cli/bin/ultra-dex.js, src/index.js, src/core/index.js
```

### Part B: Dead npm Dependencies

1. Read all `dependencies` from root `package.json` (83 packages)
2. For each package, search entire codebase for any import/require of that package
3. Packages never imported are dead weight

```bash
# For each dependency in package.json
grep -r "from 'PACKAGE_NAME'" src/ apps/ --include="*.js" --include="*.ts" --include="*.cjs"
grep -r "require('PACKAGE_NAME')" src/ apps/ --include="*.js" --include="*.ts" --include="*.cjs"
grep -r "import.*PACKAGE_NAME" src/ apps/ --include="*.js" --include="*.ts" --include="*.cjs"
```

### Part C: Dependency Graph Summary

For the core modules (`src/core/*/index.js`), map what imports what to show the high-level architecture relationships.

## Expected Output

Create the file: `upgrade/reports/dependency-scan.md`

The report must contain:

1. **Dead Files Table**
   - File path
   - Line count
   - What it claims to do
   - Recommendation (delete / archive / promote to active)

2. **Dead npm Dependencies Table**
   - Package name
   - Version in package.json
   - Recommendation (remove / keep for future use)

3. **Core Module Dependency Graph**
   - Which core modules import which (high-level)

4. **Size Analysis**
   - Total lines of active code
   - Total lines of dead code
   - Percentage of dead code

## Validation

- All source files checked
- All npm dependencies checked
- Dead code percentage calculated
