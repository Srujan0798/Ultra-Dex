# Ultra-Dex Comprehensive Style Guide

## 1. Code Formatting

### 1.1 Indentation and Spacing
- Use 2 spaces for indentation (no tabs)
- Add a single space inside curly braces: `{ foo: bar }`
- Add a single space around operators: `if (count > 0)`
- No spaces after function names: `function myFunction()`
- Use trailing commas in multiline objects/arrays

### 1.2 Line Length
- Maximum line length: 100 characters
- Break long lines at logical points
- Use parentheses to wrap multi-line expressions

### 1.3 File Organization
- Use Unix line endings (`\n`)
- End files with a newline character
- Use UTF-8 encoding
- Organize imports in groups: Node built-ins, third-party, own modules

## 2. Naming Conventions

### 2.1 Variables and Functions
- Use camelCase for variables and functions: `userName`, `calculateTotal`
- Use descriptive names that clearly indicate purpose
- Use verbs for functions: `getUser`, `validateEmail`
- Use nouns for variables: `userList`, `configOptions`

### 2.2 Constants
- Use UPPER_SNAKE_CASE for constants: `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`
- Use const for all constants
- Group related constants together

### 2.3 Classes and Constructors
- Use PascalCase for classes and constructors: `UserManager`, `ApiClient`
- Use descriptive names that indicate the class's purpose

### 2.4 Files and Directories
- Use kebab-case for filenames: `user-service.js`, `auth-middleware.js`
- Use descriptive names that indicate the file's purpose
- Match filename to primary export when possible

## 3. JavaScript/TypeScript Standards

### 3.1 Modern Syntax
- Use ES2024 features where available
- Use top-level await in modules
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use destructuring for object/array access
- Use template literals over string concatenation

### 3.2 Variables
- Use `const` by default, `let` when reassignment is needed
- Avoid `var` entirely
- Declare variables at the beginning of their scope
- Use single `const`/`let` declaration per variable

### 3.3 Functions
- Use arrow functions for callbacks and simple functions
- Use function declarations for named functions
- Use default parameters instead of conditional assignment
- Use rest parameters (`...args`) instead of `arguments`
- Keep functions small and focused (ideally < 20 lines)

### 3.4 Objects and Arrays
- Use object shorthand properties: `{ name }` instead of `{ name: name }`
- Use computed property names when needed: `[key]: value`
- Use object spread instead of `Object.assign()`
- Use array spread instead of `Array.from()` or slice

### 3.5 Async/Await
- Always use `async/await` instead of `.then()/.catch()`
- Handle errors with try/catch blocks
- Use Promise.all() for parallel operations when appropriate
- Avoid nested async functions

## 4. Type Safety (TypeScript)

### 4.1 Type Definitions
- Use interfaces for object shapes
- Use types for unions and primitives
- Avoid `any` - use specific types or `unknown`
- Use generics for reusable components

### 4.2 Strict Mode
- Enable strict mode in tsconfig
- Use strict null checks
- Explicitly define return types for exported functions
- Use discriminated unions for complex types

## 5. Error Handling

### 5.1 Error Types
- Create custom error classes for domain-specific errors
- Use SmartError from `lib/utils/smart-error.js` for enhanced error handling
- Include relevant context in error messages
- Avoid exposing internal details in user-facing errors

### 5.2 Try/Catch
- Wrap all external calls (API, DB, FS) in try/catch blocks
- Handle errors at the appropriate level
- Implement retry logic for transient failures
- Log errors with appropriate context

## 6. Comments and Documentation

### 6.1 Inline Comments
- Use `//` for single-line comments
- Use `/* */` for multi-line comments
- Write comments that explain "why" not "what"
- Keep comments up-to-date with code changes

### 6.2 JSDoc
- Document all exported functions and classes
- Include `@param`, `@returns`, and `@throws` where appropriate
- Use `@example` for usage examples
- Document complex algorithms and business logic

### 6.3 File Headers
- Include license information
- Brief description of file purpose
- Author information (optional)

## 7. Performance Optimization

### 7.1 Lazy Loading
- Use `await import()` for heavy modules rarely used
- Implement code splitting for large bundles
- Use dynamic imports for optional features

### 7.2 Memoization
- Memoize expensive calculations
- Use React.memo() for functional components
- Implement custom memoization when appropriate

### 7.3 Streams
- Use streams for large file operations
- Implement backpressure handling
- Use async iterators for processing large datasets

## 8. Testing Standards

### 8.1 Test Structure
- Follow AAA pattern: Arrange, Act, Assert
- Use descriptive test names
- Test one thing per test
- Use test fixtures for common setup

### 8.2 Naming Tests
- Use "should" in test descriptions: `should return user data`
- Describe expected behavior, not implementation
- Group related tests with describe blocks

## 9. React Component Standards

### 9.1 Component Structure
- Use functional components with hooks
- Keep components small and focused
- Use PascalCase for component names
- Export components as default exports

### 9.2 Props
- Define PropTypes or TypeScript interfaces
- Use destructuring for props
- Set default props when appropriate
- Validate required props

### 9.3 Hooks
- Follow the Rules of Hooks
- Create custom hooks for reusable logic
- Use ESLint plugin-react-hooks
- Keep hooks at the top level

## 10. Security Practices

### 10.1 Input Validation
- Validate all user inputs
- Use Zod or similar for schema validation
- Sanitize inputs before processing
- Implement proper output encoding

### 10.2 Secrets Management
- Never commit secrets to version control
- Use environment variables for credentials
- Use secure vaults for production secrets
- Implement secret rotation

## 11. Git and Commit Standards

### 11.1 Commit Messages
- Use conventional commits format
- Start with imperative mood: "Add feature" not "Added feature"
- Keep subject line under 50 characters
- Use body for detailed explanation when needed

### 11.2 Branching
- Use feature branches for new work
- Keep branches small and focused
- Rebase on main before merging
- Delete branches after merging

## 12. Documentation

### 12.1 Code Documentation
- Document complex algorithms
- Explain business logic decisions
- Keep documentation synchronized with code
- Use examples for complex functionality

### 12.2 Architecture Documentation
- Maintain system diagrams
- Document API endpoints
- Record architectural decisions (ADRs)
- Keep integration guides current

## 13. Linting and Formatting

### 13.1 ESLint Configuration
- Use recommended configurations as base
- Extend with project-specific rules
- Run linting in CI/CD pipeline
- Fix linting errors before committing

### 13.2 Prettier Configuration
- Use consistent formatting rules
- Integrate with editor for automatic formatting
- Format code before committing
- Use editorconfig for cross-editor consistency

Following these style guidelines ensures consistent, maintainable, and high-quality code across all Ultra-Dex projects.