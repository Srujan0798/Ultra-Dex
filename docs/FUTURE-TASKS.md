# Ultra-Dex Future Tasks & Recommendations

> Generated: 2026-01-30
> Current Version: v3.3.0 "Survival Mode"

---

## Completed in v3.3.0

- [x] Docker sandbox code execution (`exec` command)
- [x] GitHub integration (`github` command)
- [x] Semantic search with embeddings (`search` command)
- [x] Cloud collaboration server (`cloud` command)
- [x] Monitoring system (metrics, health, debug)
- [x] sync --brain for autonomous CONTEXT.md updates
- [x] 26 cursor rules (exceeded 25 target)
- [x] MCP server version fix (3.3.0)
- [x] Ollama documentation in README
- [x] State file locking for parallel swarm
- [x] VS Code extension packaging

---

## Pending Tasks (Priority Order)

### High Priority

1. **LangChain Adapter**
   - File: `cli/lib/providers/langchain.js`
   - Purpose: Allow any LangChain agent to plug into Ultra-Dex
   - Benefit: Ecosystem reach, 2026 compatibility
   ```javascript
   // Skeleton
   export class LangChainAdapter {
     constructor(chain) { this.chain = chain; }
     async run(prompt) { return this.chain.invoke(prompt); }
   }
   ```

2. **OpenAI Assistants Sync**
   - File: `cli/lib/providers/openai-assistants.js`
   - Purpose: Sync Ultra-Dex state with OpenAI Assistants threads
   - Benefit: Persistent context across OpenAI sessions

3. **Test Fixes (commands.test.js)**
   - `diff --json` test fails due to extra output in JSON
   - `export to JSON format` test fails (exit code issue)
   - Fix: Ensure LOG_LEVEL=silent is passed in all test helpers

### Medium Priority

4. **Streaming AI Responses**
   - Add `--stream` flag to generate, review, swarm commands
   - Use SSE or WebSocket for real-time output
   - Better UX for long-running AI tasks

5. **Voice Mode**
   - `ultra-dex voice` command
   - Use Whisper API for speech-to-text
   - Execute commands via voice

6. **LangGraph Native Integration**
   - Create LangGraph-compatible workflow definitions
   - Export Ultra-Dex swarm pipelines as LangGraph graphs

### Low Priority (Future Versions)

7. **3-Minute Demo Video**
   - Script: init → swarm → serve → dashboard
   - Host on YouTube, embed in README

8. **Partner Case Studies**
   - Find 2-3 Cursor/Claude power users
   - Document their workflows with Ultra-Dex

9. **More Cursor Rules (stretch goal)**
   - internationalization (i18n)
   - accessibility (a11y)
   - analytics/tracking
   - SEO optimization

---

## Architecture Recommendations

### Make Ultra-Dex the "Kubernetes of AI Coding"

1. **Persistence Layer**: Ultra-Dex should be the memory for tools with amnesia
   - `sync --brain` is step 1 (done)
   - Next: Auto-sync on file save (watch mode enhancement)

2. **Plugin System**: Allow third-party agent plugins
   ```
   ultra-dex plugin install @company/custom-agent
   ```

3. **Team Features**: Enterprise-ready collaboration
   - Role-based access control
   - Audit logging
   - SSO integration

4. **Self-Healing**: CI/CD integration that auto-fixes
   - `ci-monitor` exists but needs production hardening
   - Add Slack/Discord webhook notifications

---

## Technical Debt

1. **Test Environment Variables**
   - Some tests don't pass LOG_LEVEL=silent
   - Files: `cli/test/commands.test.js` (diff --json, export JSON tests fail)
   - Fix: Add LOG_LEVEL=silent to all test helper functions

2. **Version Consistency**
   - Multiple places define version (package.json, serve.js, tests)
   - Fix: Single source of truth, import from package.json everywhere

3. **Error Messages**
   - Some commands have inconsistent error output
   - Fix: Standardize error format across all commands

4. **WebSocket Memory Leaks**
   - File: `cli/lib/mcp/websocket.js`
   - Check: Connection cleanup on disconnect
   - Verify: No hanging connections after client disconnect

5. **Provider Error Handling**
   - Files: `cli/lib/providers/*.js`
   - Check: All providers handle API errors gracefully
   - Add: Retry logic with exponential backoff

6. **Large Codebase Performance**
   - File: `cli/lib/mcp/graph.js`
   - Issue: May be slow on 10k+ file projects
   - Fix: Add pagination or streaming for large graphs

---

## Next Release (v3.4.0) Suggested Scope

1. LangChain adapter
2. Streaming AI responses
3. Test suite fixes (100% pass rate)
4. Plugin system foundation

---

## Commands Reference (44+)

| Category | Commands |
|----------|----------|
| Core | init, generate, build, review, align |
| Agents | agents, agent, run, swarm, auto-implement |
| Server | serve, dashboard, watch, ci-monitor |
| State | status, state, sync, memory |
| Tools | validate, check, doctor, verify, fix |
| Export | export, diff, pack |
| Config | config, hooks, upgrade |
| v3.3.0 | exec, search, github, cloud, metrics, health, debug |

---

## Verification Commands

After any changes, run these to verify:

```bash
# 1. Run tests (target: 82/82 pass)
cd cli && npm test

# 2. Check CLI version
npx ultra-dex --version  # Should show 3.3.0

# 3. Verify core commands work
npx ultra-dex agents
npx ultra-dex align
npx ultra-dex swarm "test" --dry-run
npx ultra-dex scaffold --help
npx ultra-dex sync --brain

# 4. Check TypeScript (VS Code extension)
cd vscode-extension && npm run compile

# 5. Lint
cd cli && npm run lint
```

---

## Review Status (from previous audits)

| Item | Status | Notes |
|------|--------|-------|
| Version consistency | ✅ Fixed | All files say 3.3.0 |
| Race condition in swarm | ✅ Fixed | withStateLock implemented |
| MCP server version | ✅ Fixed | 3.3.0 |
| 25+ cursor rules | ✅ Done | 26 rules |
| sync --brain | ✅ Done | Eliminates human middleware |
| Provider null check | ✅ OK | swarm.js handles this |
| Test failures | ⚠️ 3 failing | diff --json, export JSON |
| ESLint | ✅ Passes | cd cli && npm run lint |

---

*"From Idea to Full-Scale, Production-Ready Application"*
