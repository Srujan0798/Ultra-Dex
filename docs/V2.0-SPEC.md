# Ultra-Dex v2.0 Product Specification

**Document Status:** Draft for planning
**Version:** v2.0
**Date:** 2026-04-09
**Scope:** Product and technical specification for the first true autonomous Ultra-Dex release after v3.1.0

## 1. Problem Statement

Ultra-Dex v3.1.0 proves the platform can build, test, route, govern, monitor, and package a broad AI-assisted developer workflow. What it does not yet fully solve is the gap between "feature-complete pre-v2.0 platform" and "production-grade autonomous execution system."

v2.0 exists to close five hard gaps:

1. v3.1.0 still behaves like an advanced orchestration framework more than a trusted autonomous execution platform. Agent loops, routing, and recovery paths exist, but they are not yet fully hardened for always-on production workloads.
2. Core persistence is still too local and process-bound in key paths. Durable, multi-tenant memory and execution state need Redis/Postgres-grade guarantees rather than mixed local stores and partial in-memory behavior.
3. Provider routing is feature-rich but not yet sufficiently real-time, health-aware, cost-aware, and SLA-oriented to operate as a production multi-provider control plane.
4. Collaboration and distribution are still limited. Teams need shared workspaces, shared memory, shared audit trails, and role-aware execution across users and environments.
5. Ultra-Dex does not yet fully express the product vision of an AI-native engineering operating system: autonomous agents, multimodal intelligence, ecosystem extensibility, edge deployment, and learning from execution history.

In short, v2.0 solves the transition from "powerful AI dev toolchain" to "reliable autonomous software execution platform."

## 2. Goals And Non-Goals

### Goals

1. Make autonomous agent execution safe, observable, and reliable enough for production use.
2. Replace fragmented persistence with durable, scalable memory and execution storage.
3. Turn provider routing into a true multi-provider runtime with smart fallback and measurable uptime.
4. Expand the product from text-first coding workflows to multimodal software workflows.
5. Introduce ecosystem and collaboration primitives that support teams, enterprises, and external contributors.
6. Improve operational quality so that uptime, routing latency, auditability, and recovery behavior are first-class product features.

### Non-Goals

1. Rewriting the entire platform from scratch.
2. Shipping a general-purpose consumer chatbot.
3. Supporting every IDE, runtime, and cloud edge target in the first v2.0 release.
4. Replacing human engineering review for high-risk production changes.
5. Shipping fully autonomous self-modifying agents without governance controls.

## 3. Target Users

### Solo Developers

Solo builders want one system that can plan, execute, monitor, and recover work across coding, testing, deployment prep, and debugging without requiring a full team or an ops stack.

Needs:

- Fast setup
- Cost-aware model routing
- Strong defaults
- Personal memory and history
- IDE-centric workflows

### Teams

Small and mid-sized product teams want Ultra-Dex to act like a shared AI execution layer rather than a single-user assistant.

Needs:

- Shared workspaces
- Execution visibility
- Agent permissions
- Shared prompts, agents, and memory
- Team-level analytics and usage controls

### Enterprises

Enterprise customers want autonomy with policy, traceability, and reliability guarantees.

Needs:

- SSO and RBAC
- Durable audit logs
- Model governance
- Tenant isolation
- SLA-driven routing and failover
- Controlled deployment surfaces

## 4. Features By Priority

### P0: Autonomous Agent Execution

**Outcome:** Ralph Loop becomes production-ready, not just conceptually available.

Capabilities:

- Multi-step autonomous execution with bounded goals, checkpoints, retries, rollback hooks, and recovery policies
- Explicit execution states: queued, running, blocked, waiting, failed, recovered, completed
- Governance-aware autonomy with approval gates for risky actions
- Durable execution traces, replay, and postmortem analysis
- Human handoff and pause/resume flows

Acceptance criteria:

- Agent runs can survive process restarts
- Every run has replayable trace data
- Governance blocks are explainable and resumable
- Recovery behavior is deterministic and test-covered

### P0: Real Multi-Provider Routing With Smart Fallback

**Outcome:** Provider routing becomes a resilient control plane.

Capabilities:

- Health-aware routing based on availability, latency, cost, capability, and recent failure rate
- Real-time fallback chains across OpenAI, Anthropic, Gemini, NVIDIA, Ollama, and future adapters
- Per-task routing strategy: speed, quality, cost, privacy, multimodal capability
- Circuit breakers, load shedding, and provider-level policy rules
- Routing analytics and uptime dashboards

Acceptance criteria:

- Provider outages trigger automatic fallback without user intervention
- Routing decisions are logged with reason codes
- p95 routing latency stays below target
- Provider uptime and error budgets are measurable per tenant

### P0: Production Memory System

**Outcome:** Memory becomes durable, shared, queryable, and operationally safe.

Capabilities:

- Redis for hot execution state and queues
- Postgres for durable run history, team state, audit records, and structured memory
- Vector storage for semantic retrieval
- Tenant-aware memory partitioning
- Shared and personal memory scopes
- Memory retention, compaction, and redaction policies

Acceptance criteria:

- Runs can restore state from durable storage
- Team memory can be shared with role boundaries
- Retrieval latency is predictable under load
- Memory policy violations are auditable

### P1: Multi-Modal Support

**Outcome:** Ultra-Dex supports software workflows that involve images, audio, documents, and mixed context.

Capabilities:

- Image understanding for UI, screenshots, diagrams, and design reviews
- Audio ingestion for voice tasks, meeting notes, and incident narration
- Document parsing for PRDs, PDFs, specs, and compliance materials
- Multimodal routing to capable providers
- Unified trace format for non-text inputs

Acceptance criteria:

- Users can submit text + file inputs in one run
- Multimodal runs preserve artifacts and trace context
- Provider selection respects modality support

### P1: Agent Marketplace

**Outcome:** Ultra-Dex becomes an extensible agent platform.

Capabilities:

- Publish/install/update agents
- Agent metadata, versioning, trust level, and dependency declarations
- Marketplace search and verification
- Org-private and public marketplaces
- Usage metrics and ratings

Acceptance criteria:

- Agents can be installed without manual repo surgery
- Marketplace entries support signatures or trust labels
- Broken agents can be safely disabled and rolled back

### P1: Team Collaboration

**Outcome:** Teams share work, memory, and agent operations safely.

Capabilities:

- Shared workspaces and projects
- Collaborative execution views
- Role-aware task delegation
- Shared execution history, approvals, and comments
- Team usage analytics and budget controls

Acceptance criteria:

- Multiple users can inspect and manage the same workspace state
- Team permissions apply consistently to runs, memory, and marketplace actions
- Workspace audit trails are durable

### P2: Edge Deployment

**Outcome:** Core orchestration surfaces can run close to users and systems.

Capabilities:

- Cloudflare Workers adapter for edge-safe control-plane workloads
- Split architecture for edge routing plus core execution backplane
- Low-latency auth, routing, and telemetry endpoints at edge
- Edge-safe configuration and secret management

Acceptance criteria:

- Control-plane APIs can run in a supported edge mode
- Routing and auth latency improves in distributed deployments
- Unsupported workloads gracefully offload to core services

### P2: AI-Native IDE Plugin

**Outcome:** Ultra-Dex becomes a native workflow inside developer environments.

Capabilities:

- VS Code extension first, JetBrains second
- Inline plan/run/explain/review actions
- Shared trace, memory, and marketplace access from IDE
- Session-aware context sync
- Workspace policy and provider visibility

Acceptance criteria:

- Users can initiate and monitor runs from the IDE
- Plugin sessions sync with server-side execution history
- IDE actions respect org governance

### P3: Self-Improving Agents

**Outcome:** Agents improve from observed execution history without unsafe self-modification.

Capabilities:

- Outcome scoring by task type
- Prompt and routing feedback loops
- Retrieval tuning from prior successful runs
- Failure clustering and recovery recommendation updates
- Human-approved learning policies

Acceptance criteria:

- Improvement logic is measurable, reversible, and auditable
- Prompt/routing updates are gated behind governance
- Learning improves at least one measurable execution KPI

## 5. Success Metrics

### Product Metrics

- Monthly active users
  - Solo: 5,000+
  - Team seats: 2,000+
  - Enterprise seats: 500+
- Weekly active workspaces
- Agent marketplace installs per month

### Execution Metrics

- Agent executions per day
- Autonomous completion rate for bounded tasks
- Human intervention rate
- Recovery success rate after execution failure
- Median time to completed run

### Routing And Reliability Metrics

- Provider uptime by adapter
- Fallback success rate
- p95 provider routing latency
- Failed run rate attributable to provider selection
- Cost per successful execution

### Platform Metrics

- Memory retrieval p95 latency
- Dashboard and API availability
- Workspace sync consistency
- Support tickets per 1,000 executions

## 6. Technical Requirements

### Core Platform

- Redis for queues, locks, ephemeral run state, and hot memory
- Postgres for durable execution, audit, billing, collaboration, and structured memory
- Vector search capability for semantic memory and marketplace discovery
- Durable job orchestration with retry semantics
- Backward-compatible CLI and API migration path from v3.1.0

### Runtime And Orchestration

- State machine for autonomous execution
- Checkpoint persistence and replay
- Policy-driven tool execution
- Structured trace schema for every run and every step
- Deterministic recovery hooks

### Provider Layer

- Standard provider capability contract
- Health probes, circuit breakers, and telemetry
- Capability matrix by model/provider
- Cost model registry and routing policy engine

### Multi-Tenancy And Security

- Tenant-scoped storage and routing
- SSO-ready auth model
- Workspace RBAC
- Full audit logging
- Secret isolation and secure provider credential handling

### Observability

- Prometheus-compatible metrics
- Structured logs
- Trace artifacts per execution
- Alerting for provider degradation, queue lag, and execution failures

### Developer Experience

- Stable CLI entrypoints
- Versioned APIs and schemas
- Extension/plugin SDK for agents and marketplace packages
- Test coverage for core execution, routing, and persistence flows

## 7. Timeline

v2.0 should be executed as four monthly sprints across a four-month delivery window, with the first three months focused on product capability and the fourth month focused on enterprise hardening and commercial readiness.

### Sprint 1: Foundation

Focus:

- Production memory foundation
- Production-grade Ralph Loop
- Real provider health monitoring and smart routing
- Test and observability hardening

### Sprint 2: Intelligence

Focus:

- Multimodal execution
- Marketplace v1
- Execution history and learning primitives
- Monitoring dashboard expansion

### Sprint 3: Scale

Focus:

- Edge adapter
- Team workspaces
- IDE plugin v1
- Routing performance optimization

### Sprint 4: Enterprise

Focus:

- SSO/SAML
- Audit and compliance hardening
- Custom model deployment controls
- SLA and reliability packaging

## 8. Risks And Mitigations

### Risk: Autonomy Is Powerful But Untrusted

If autonomy is perceived as unsafe, adoption will stall.

Mitigation:

- Make governance and replay mandatory for high-risk actions
- Ship pause/resume/manual override from day one
- Expose confidence and reason codes in execution UI

### Risk: Routing Complexity Creates Operational Instability

Provider routing can become fragile if capability, latency, and cost rules conflict.

Mitigation:

- Use explicit routing policy layers
- Log reason codes for every route
- Maintain conservative fallback defaults

### Risk: Persistent Memory Introduces Compliance And Privacy Burden

Shared durable memory can create retention, leakage, and tenant-boundary risks.

Mitigation:

- Add memory scopes, retention windows, and redaction policies
- Build tenant partitioning into the schema, not as an afterthought
- Require auditability for sensitive retrieval paths

### Risk: Too Many Surface Areas Dilute Delivery

Marketplace, multimodal, edge, IDE, and collaboration could fragment execution focus.

Mitigation:

- Keep P0 narrow and operational
- Treat P1/P2/P3 as staged layers on top of hardened core execution
- Use strict release gates by sprint

### Risk: Enterprise Features Slow Core Product Velocity

Compliance and SSO can consume disproportionate engineering time.

Mitigation:

- Schedule enterprise packaging after foundation and scale capabilities
- Reuse core audit/governance primitives instead of building parallel systems

## Release Gate For v2.0

Ultra-Dex v2.0 is ready only when all of the following are true:

1. Autonomous runs are durable, replayable, and governable.
2. Multi-provider routing survives real provider degradation in production tests.
3. Production memory is no longer dependent on local-only storage for critical paths.
4. Team workspaces and audit trails are reliable enough for shared usage.
5. Observability is strong enough to support uptime and SLA commitments.
6. The product experience clearly exceeds v3.1.0 in trust, autonomy, and scale.
