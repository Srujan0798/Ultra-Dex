# TODO: Fix persistAndPrintRunArtifacts ENOENT copyfile timing issue

## Problem

Error in run command: ENOENT: no such file or directory, copyfile trace.jsonl

## Scope

- Affects both V2 ON and V2 OFF paths (shared layer, non-V2-specific)
- Location: apps/cli/lib/commands/run.js -> persistAndPrintRunArtifacts()

## Impact

- V2 execution completes successfully (status: success)
- Only artifact persistence fails (trace.jsonl copy)

## Fix approach

1. Ensure trace file is flushed/written before copyfile
2. Add directory existence check before copyfile
3. Consider using fs.rename instead of copyfile
4. Add retry logic for transient ENOENT

## Priority

- Non-blocking - V2 routing works correctly without artifact persistence
- Should be fixed before 100% production rollout
