# Ultra-Dex WASM Runtime (Scaffold)

This module provides a capability-guarded WASM loading path for future plugin support.

## Exports

- `createWasmRuntime(options)`
- `runWasmModule(modulePath, options)`

## Capability Model

- `filesystem` (default: false)
- `network` (default: false)
- `env` (default: false)

The current implementation uses a minimal WASI stub and blocks privileged
operations unless explicitly enabled.
