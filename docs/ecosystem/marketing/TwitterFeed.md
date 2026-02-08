# 🐦 Ultra-Dex Twitter/X Feedback Log

---

## v3.4.3 Thread

### Capability Contracts - @Agimon_AI (VuongNg)

**Comment:**
> "Plugin architecture is the only way these orchestration layers stay sane.
>
> Ship a "capability contract" per plugin (inputs, side effects, rate limits). Makes routing and security enforceable in code."

**Reply:**
> "Agreed. Plugin-first architecture is deliberate to keep orchestration sane.
>
> Each plugin has explicit inputs/outputs and constrained side effects, and I'm moving toward formal capability contracts (inputs, side effects, rate limits) so routing and security are enforced in code.👾"

**Action:** Created `docs/rfc/001-capability-contracts.md`

---

### MCP Interoperability - @saen_dev (Saeed Anwar)

**Comment:**
> "MCP server for Claude Desktop providing real-time project context is a game-changer. Working with any AI tool you prefer means no vendor lock-in.
>
> The interoperability play is what makes MCP the standard. Build once, use everywhere."

**Reply:**
> "We treat the LLM as a commodity & the Context as the asset.
>
> By standardizing on MCP, you can swap Claude for deep-reasoning tasks, then switch to a local model for sensitive data, all while keeping the same Memory Graph & Orchestration rules.
>
> No vendor lock-in. Just portable."

**Action:** Created `docs/MCP-INTEGRATION.md`
