# Contributing to Ultra-Dex

Thanks for helping improve Ultra-Dex. This guide keeps changes consistent and reviewable.

## Quick Start

1. Fork and clone the repo.
2. Install dependencies: `npm install` (or `pnpm install`).
3. Enable local Git hooks: `git config core.hooksPath .husky`.
4. Run CLI tests: `npm run test` (root) or `cd cli && npm test`.

## How To Add a New Agent

1. Create a markdown prompt in `agents/` under the correct tier.
2. Follow the agent formatting style: responsibilities, constraints, and output format.
3. Add the agent to the registry or index file if one exists.
4. Update docs that list agents.

## How To Add a New CLI Command

1. Create `cli/lib/commands/<command>.js`.
2. Export a `register<Command>Command(program)` function.
3. Register it in `cli/bin/ultra-dex.js`.
4. Add at least one test in `cli/test/`.

## Code Style

- JavaScript: 2-space indentation.
- Use ESM `import`/`export`.
- Prefer `async/await`.
- Avoid `console.log` in production paths (use `printInfo/printSuccess` helpers).

## Tests

- Unit tests: `cli/test/unit/`
- Integration tests: `cli/test/integration/`
- Full CLI suite: `cd cli && npm test`

## Pull Requests

- Keep PRs focused and atomic.
- Include test coverage for new commands.
- Update docs if behavior changes.
- Use clear commit messages.

## Security

If you find a security issue, please email the maintainer instead of opening a public issue.

## Legal and Ethical Rules

- Follow `CODE_OF_CONDUCT.md` in all project spaces.
- Read `SECURITY.md` before reporting vulnerabilities.
- Complete `gitFail/compliance/GITHUB_COMPLIANCE_CHECKLIST.md` before every commit/PR.
- Run `npm run guard:github` before push/release operations.
- If account is suspended but local work continues, run `npm run guard:github:local`.
- Do not commit secrets, private keys, tokens, or sensitive personal data.
- Do not submit code/content that violates GitHub Terms or Acceptable Use Policies.
