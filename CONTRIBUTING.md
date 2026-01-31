# Contributing to Ultra-Dex

Thank you for your interest in contributing to Ultra-Dex! This document provides guidelines for contributing to both the documentation/templates and the CLI tool.

---

## Ways to Contribute

### 1. Report Issues
- Found a bug in a template or the CLI?
- Section missing important content?
- Confusing instructions?

[Open an issue](../../issues/new/choose) with details.

### 2. Suggest Improvements
- New section ideas
- Better examples
- Clearer explanations

Use the Feature Request template.

### 3. Submit Examples
Built something with Ultra-Dex? Share your filled template as an example!

### 4. Fix Typos & Errors
Small fixes are welcome. Just submit a PR.

---

## Development Setup (CLI)

If you are contributing to the CLI tool (`cli/` directory):

1. **Clone and Install**
   ```bash
   git clone https://github.com/Srujan0798/Ultra-Dex.git
   cd Ultra-Dex/cli
   npm install
   ```

2. **Running Tests**
   We use Node.js built-in test runner.
   ```bash
   npm test              # Run all tests
   npm run test:coverage # Run with coverage report
   ```
   
   Coverage targets: 70%+ (currently ~31%)

3. **Local Testing**
   You can link the CLI locally to test your changes:
   ```bash
   npm link
   # Now you can run 'ultra-dex' from any directory using your local version
   ```

---

## Code Style

- **Linting:** We use ESLint. Run `npm run lint` before committing.
- **Formatting:** Code should be clean and readable.
- **Modern JS:** Use ES Modules (`import`/`export`) and modern Node.js features (v18+).

---

## Contribution Guidelines

### For Template Changes

1. **Don't remove content** - Ultra-Dex is comprehensive by design
2. **Add value** - New sections should solve real problems
3. **Be specific** - No vague placeholders
4. **Test your changes** - Ensure markdown renders correctly

### For Examples

Examples should:
- Fill ALL 34 sections (no placeholders)
- Use a real, buildable SaaS idea
- Include actual code snippets
- Have realistic cost/time estimates

### Commit Messages

Use conventional commits:

```
feat: Add new section for mobile app considerations
fix: Correct typo in database schema section
docs: Improve QUICK-START instructions
example: Add InvoiceFlow filled example
ci: Update github actions workflow
```

---

## Pull Request Process

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. **Run tests** (`npm test` if changing CLI)
5. **Lint code** (`npm run lint` if changing CLI)
6. Commit with clear message
7. Push and open a PR
8. Fill out the **[Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)** completely

---

## Code of Conduct

- Be respectful
- Be constructive
- Help others learn
- No spam or self-promotion

---

## Questions?

Open a Discussion or Issue. We're happy to help!

---

*Thank you for helping make Ultra-Dex better!*
