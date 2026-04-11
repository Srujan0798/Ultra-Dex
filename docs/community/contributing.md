# Community Contribution Guide

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Ultra-Dex.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feat/your-feature`

## Development Workflow

### Running Tests

```bash
npm test           # All tests
npm run test:unit  # Unit tests only
npm run test:cli   # CLI tests only
```

### Linting & Formatting

```bash
npm run lint       # Check linting
npm run lint:fix   # Auto-fix issues
npm run format     # Format code
```

### Building

```bash
npm run build      # Build all
npm run build:core # Build core only
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new agent type
fix: resolve memory leak in planner
docs: update API reference
test: add integration tests for swarm
chore: clean up unused dependencies
```

## Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Commit messages follow convention
- [ ] Documentation updated if needed

### PR Template

```markdown
## Description

What does this PR do?

## Testing

How was this tested?

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented if breaking)
```

## Code Style

- Use `camelCase` for variables/functions
- Use `PascalCase` for classes
- Use `UPPER_SNAKE_CASE` for constants
- Prefer `async/await` over promise chains
- Use `const` by default, `let` when reassignment needed
- No `any` type - use `unknown` for unknown types

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Include environment info (Node version, OS)
- Attach logs if applicable

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
