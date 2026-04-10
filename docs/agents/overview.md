# Ultra-Dex Agent Guidelines

## Build Commands

- `npm run build`: Builds all core components, dashboard, and docs.
- `npm run build:core`: Builds the core modules.
- `npm run build:dashboard`: Builds the dashboard application.
- `npm run build:docs`: Builds documentation site (Docusaurus).

## Linting

- `npm run lint`: Runs ESLint on `apps/cli/lib` (JS/TS files).
- `npm run lint:fix`: Auto-fixes linting issues.
- Ensure all code passes linting before committing.

## Testing

- `npm run test`: Runs all tests (unit, integration, CLI).
- `npm run test:unit`: Runs unit tests from `tests/core/*.test.js`.
- `npm run test:integration`: Runs integration tests from `tests/integration/*.test.js`.
- `npm run test:cli`: Runs CLI-specific tests.
- To run a single test file: `npm run test -- tests/core/some.test.js`
- Use `npm run test:coverage` for coverage report.

## Code Style Guidelines

- **Formatting**: Use Prettier (`npm run format`). All files should be formatted consistently.
- **ESLint**: Follow ESLint rules; fix issues with `npm run lint:fix`.
- **TypeScript**:
  - Use strict mode (`strict: true` in tsconfig).
  - Prefer interfaces over types for object shapes.
  - Explicitly type function parameters and return values.
  - Use `unknown` for unknown types, avoid `any`.
- **Naming Conventions**:
  - Variables/Functions: camelCase (`getUserData`)
  - Classes/Components: PascalCase (`UserProfile`)
  - Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
  - Files: match class name (`UserProfile.ts`)
- **Imports**:
  - Use absolute paths via `src/` alias (configured in tsconfig).
  - Example: `import { Service } from 'src/services/service';`
  - Avoid relative paths like `../../utils`.
- **Error Handling**:
  - Use custom error classes extending `Error`.
  - Log errors using `winston` (e.g., `logger.error(error.message)`).
  - Handle errors at the appropriate layer; don't swallow errors.
- **Async/Await**:
  - Prefer async/await over promise chains.
  - Always handle rejections with try/catch.
- **Documentation**:
  - JSDoc for public functions, classes, and methods.
  - Use `@param`, `@returns`, `@throws` tags.

## Security Best Practices

- Validate all user inputs.
- Sanitize data before database operations.
- Use environment variables for secrets (via `dotenv`).
- Never hardcode credentials.

## Git & Commit Conventions

- Follow conventional commits (e.g., `feat: add new feature`, `fix: resolve bug`)
- Write clear commit messages that explain the "why" not just the "what".

## Agent-Specific Notes

- When using the AGENTS.md file, agents must:
  - Always run `npm run lint` and `npm run typecheck` before committing.
  - Verify tests pass with `npm run test` for relevant sections.
  - Ensure code formatting is applied via `npm run format`.
