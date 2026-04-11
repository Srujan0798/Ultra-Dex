# Ultra-Dex Release Checklist

> Use this checklist for every release. Do not skip any step.

## Pre-Release

- [ ] All tests pass: `npm test`
- [ ] Typecheck passes: `npm run typecheck`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No critical npm audit issues: `npm audit --audit-level=critical`
- [ ] CHANGELOG.md updated with new changes
- [ ] Version bumped in `package.json` and `apps/cli/package.json`
- [ ] Version bumped in `packages/sdk/package.json`
- [ ] `ultra-dex --version` matches package.json version
- [ ] `ultra-dex doctor` runs without errors
- [ ] `ultra-dex run planner -t "hello" --provider mock` works
- [ ] `ultra-dex replay --list` works
- [ ] `docker compose config` validates (if Docker available)
- [ ] `docker compose up` starts all services healthy (if Docker available)

## Package Validation

- [ ] `cd apps/cli && npm pack` creates tarball
- [ ] `cd packages/sdk && npm pack` creates tarball
- [ ] Tarball contents inspected: no test files, no .env files, no node_modules
- [ ] `npm install -g ./tarball` works on clean machine
- [ ] `ultra-dex --help` works after global install

## Documentation

- [ ] README.md reflects current features (no aspirational claims)
- [ ] CONTRIBUTING.md is up to date
- [ ] docs/DEVELOPMENT.md is accurate
- [ ] docs/DEPLOYMENT.md covers Docker setup
- [ ] .env.example has all new variables

## Security

- [ ] No secrets committed (check `.git status` for .env files)
- [ ] API keys not in code (only in .env.example as placeholders)
- [ ] Dependencies reviewed for new critical vulnerabilities

## Post-Release

- [ ] Git tag created: `git tag v3.x.x && git push origin v3.x.x`
- [ ] GitHub release created with changelog
- [ ] npm publish (if ready): `cd apps/cli && npm publish --access public`
- [ ] SDK npm publish (if ready): `cd packages/sdk && npm publish --access public`
- [ ] Docker image built and pushed (if applicable)
- [ ] CI/CD pipeline triggered and passed

## Rollback Plan

If release fails:
1. `npm unpublish @ultra-dex/cli@3.x.x --force` (within 72 hours)
2. Revert git tag: `git tag -d v3.x.x && git push origin :refs/tags/v3.x.x`
3. Fix issues and re-release
