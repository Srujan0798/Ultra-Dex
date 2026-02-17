# Strategy Engine Dissection

## 1. Overview
The Ultra-Dex system contains two distinct strategy engines:
1.  **CLI Strategy Engine (`cli/lib/providers/router.js`)**: A rudimentary, rule-based router used by the CLI commands (e.g., `ultra-dex generate`).
2.  **SDK Strategy Engine (`packages/sdk/src/router.js`)**: A sophisticated, data-driven router with advanced strategies (latency, cost, circuit breaker) used for simulation and potentially other services, but **not** integrated into the main CLI workflow.

## 2. Deliverables Analysis

### 2.1 Routing Decision Tree Analysis

**CLI Engine (`cli/lib/providers/router.js`):**
- **Trigger**: `assessComplexity(systemPrompt, userPrompt)`
- **Logic**:
    - Checks for keywords: `refactor`, `architect`, `security`, `audit`, `design pattern`, `migration`, `performance`, `optimiz`, `complex`, `production`, `bug`.
    - Checks length: Combined prompt > 2000 characters.
- **Branching**:
    - **Complex**: Prefers `Cloud Provider` (defaults to Claude/OpenAI) -> Fallback to `Local Provider` (Ollama).
    - **Simple**: Prefers `Local Provider` (Ollama) -> Fallback to `Cloud Provider`.
- **Latency/Cost**: Ignored in decision making.

**SDK Engine (`packages/sdk/src/router.js`):**
- **Strategies**:
    - `fastest`: Selects provider with lowest `avgLatency`.
    - `cheapest`: Selects provider with lowest `costPerToken`.
    - `round-robin`: Rotates through available providers.
    - `fallback-chain`: Iterates through `fallbackOrder`.
- **Health Check**: Uses `CircuitBreaker` (failures threshold, reset timeout) to exclude unhealthy providers.

### 2.2 Cascade Failure Scenarios

**CLI Engine:**
- **Scenario**: Primary provider fails.
- **Behavior**:
    - `selectProvider` returns *one* provider instance (Primary or Secondary).
    - `generate` calls that instance.
    - **Failure**: If the selected provider throws an error, the operation fails immediately. There is **no automatic retry** with the alternative provider.
    - **Depth**: Shallow (Depth 1).

**SDK Engine:**
- **Scenario**: Primary provider fails.
- **Behavior**:
    - `route` iterates through the ordered list of candidates.
    - If Candidate A fails -> Records failure -> Tries Candidate B.
    - Continues until a success or all candidates fail.
    - **Depth**: Deep (N candidates).

### 2.3 Override Security Assessment

- **Environment Overrides**:
    - `ULTRA_DEX_DEFAULT_PROVIDER` env var overrides the default cloud provider selection.
    - **Risk**: Setting this to `router` causes an **infinite routing loop** (Stack Overflow) in `cli/lib/providers/index.js` because the router initializes itself as its own cloud provider.
- **CLI Options**:
    - Users can pass `--provider` or `--key` to override defaults.
    - Users can pass `--cloudProvider` (internal option) to specific router configuration.
- **Governance**:
    - `enforceAgentExecution` wraps providers to ensure agent-specific policies.
    - **Bypass**: If `agent` context is not passed (e.g., raw `ultra-dex generate` command), strict governance checks are skipped.
    - **Mitigation**: `memex` logging (`safeMemexIndex`) is applied to all providers regardless of agent context, ensuring audit trails.

### 2.4 Cost Estimation Verification

- **Status**: **Hardcoded**.
- **Evidence**: `cli/lib/providers/claude.js` contains `SONNET_5_PRICING` and logic like `if (model.includes('sonnet')) return { input: 3.0, output: 15.0 };`.
- **SDK**: Uses `config.costPerToken` passed during initialization, not dynamic real-time pricing.

### 2.5 Latency Routing Check

- **Status**: **Missing in CLI**.
- **Evidence**: `cli/lib/providers/router.js` has no latency tracking or cold-start logic.
- **SDK**: Implements `ProviderStats` tracking `p50`, `p95`, `p99`, and `avgLatency`. Cold-start is not explicitly handled but averaging over a window (default 100) eventually reflects it.

### 2.6 Quality Scoring Bias

- **Status**: **Biased towards Claude/Cloud**.
- **Evidence**:
    - `assessComplexity` treats "complex" tasks as Cloud-only (initially).
    - `getDefaultProvider` checks `ANTHROPIC_API_KEY` first, favoring Claude over OpenAI or Gemini.
    - The definition of "complex" (keywords like "refactor", "architect") inherently biases sophisticated work to the paid/cloud tier.

### 2.7 Routing Loops

- **Status**: **Confirmed Bug**.
- **Mechanism**:
    1. Set `ULTRA_DEX_DEFAULT_PROVIDER=router`.
    2. Call `createProvider('router')`.
    3. `router` initializes. It needs a `cloudProvider`.
    4. `cloudProvider` defaults to `getDefaultProvider()`, which returns `router`.
    5. Recursion: `createProvider('router')` called again.
- **Fix Required**: Add recursion detection in `cli/lib/providers/index.js`.
