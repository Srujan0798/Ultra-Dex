# Code Reviewer Example

This example demonstrates how to create an AI-powered code review system using Ultra-Dex. The system can automatically review code for quality, security, and best practices.

## Features

- **Automated Quality Assessment**: Evaluates code complexity, maintainability, and readability
- **Security Vulnerability Detection**: Identifies potential security risks and vulnerabilities
- **Best Practice Enforcement**: Ensures code follows established patterns and principles
- **Style Guide Compliance**: Checks adherence to formatting and naming conventions
- **Performance Optimization**: Identifies bottlenecks and suggests improvements
- **Batch Review Capability**: Reviews multiple files at once
- **Issue Prioritization**: Categorizes issues by severity and impact
- **Integration Ready**: Outputs results in standard formats (SARIF, JSON)

## Prerequisites

- Node.js 18+
- Ultra-Dex API key
- Code files to review

## Setup

1. **Install Dependencies**:

   ```bash
   # This example uses the UltraDex library
   ```

2. **Environment Variables**:
   Create a `.env` file with the following:

   ```env
   ULTRA_DEX_API_KEY=your_ultra_dex_api_key
   ULTRA_DEX_ENDPOINT=https://api.ultra-dex.ai
   ```

3. **Run the Example**:
   ```bash
   node index.js
   ```

## Configuration

The code reviewer uses several specialized agents:

- `quality-assessor`: Assesses code quality, complexity, and maintainability
- `security-scanner`: Scans code for security vulnerabilities and risks
- `best-practice-enforcer`: Ensures code follows best practices and design patterns
- `style-checker`: Ensures code follows style guides and formatting standards
- `performance-optimizer`: Identifies performance bottlenecks and optimization opportunities

## Usage

The code reviewer can analyze various aspects of code:

```javascript
const codeReviewer = new CodeReviewer({
  ultraDex: {
    apiKey: process.env.ULTRA_DEX_API_KEY,
    endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai',
  },
  codeStandards: {
    quality: {
      maxComplexity: 10,
      maxFunctionLength: 50,
      maxParameters: 5,
    },
    practices: {
      allowConsoleLogs: false,
      requireJSDoc: true,
      maxNestedIfs: 3,
    },
    style: {
      indentSize: 2,
      useSemicolons: true,
      maxLineLength: 100,
    },
  },
  securityRules: {
    disableEval: true,
    validateInput: true,
    escapeOutput: true,
    useHTTPS: true,
  },
  performanceThresholds: {
    maxFunctionTime: 100, // ms
    maxMemoryUsage: 100, // MB
    minEfficiencyRating: 80,
  },
});

// Review a single file
const review = await codeReviewer.reviewCode('./path/to/code/file.js', {
  qualityThreshold: 85,
  securitySeverity: 'high',
  styleStrictness: 'strict',
});

// Review a diff/patch
const diffReview = await codeReviewer.reviewDiff(
  `
diff --git a/file.js b/file.js
index abc123..def456 100644
--- a/file.js
+++ b/file.js
@@ -1,5 +1,7 @@
 function greet(name) {
-  return "Hello " + name;
+  if (!name) {
+    return "Hello, Guest";
+  }
+  return "Hello " + name;
 }
`,
  {
    securitySeverity: 'critical',
  }
);

// Batch review multiple files
const batchResults = await codeReviewer.batchReview(
  ['./src/utils.js', './src/components/Button.js', './src/services/api.js'],
  {
    qualityThreshold: 80,
  }
);

// Get improvement recommendations
const recommendations = await codeReviewer.getImprovementRecommendations('./path/to/file.js');
```

## Supported Languages

The code reviewer supports multiple programming languages:

- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- C++
- C#
- PHP
- Ruby
- Swift
- Kotlin
- Scala
- SQL
- HTML/CSS
- Vue/Svelte components

## Review Categories

The system evaluates code across multiple dimensions:

- **Quality**: Complexity, maintainability, duplication, readability
- **Security**: Vulnerabilities, injection risks, authentication, data leakage
- **Best Practices**: Design patterns, architecture, anti-patterns
- **Style**: Formatting, naming conventions, documentation
- **Performance**: Bottlenecks, algorithm efficiency, memory usage

## Issue Severity Levels

Issues are categorized by severity:

- **Critical**: Security vulnerabilities, correctness issues
- **High**: Significant maintainability problems, performance issues
- **Medium**: Moderate concerns that should be addressed
- **Low**: Minor stylistic or minor maintainability issues

## Review Recommendations

The system provides actionable recommendations:

- **APPROVE**: Code meets all standards
- **APPROVE_CONDITIONALLY**: Minor issues but generally good
- **COMMENT**: Several issues need attention
- **REQUEST_CHANGES**: Significant issues need fixing
- **REJECT**: Critical issues found

## Standards Configuration

Customize review standards:

- Quality thresholds (complexity, function length, etc.)
- Security rules (disable eval, input validation, etc.)
- Style guidelines (indentation, naming, etc.)
- Performance thresholds (execution time, memory usage)

## Output Formats

Export results in various formats:

- **JSON**: Detailed results for programmatic use
- **SARIF**: Standard format for integration with development tools
- **HTML**: Human-readable reports with visualizations

## Customization

You can customize the code reviewer by modifying:

- Code quality thresholds
- Security rules and checks
- Style guide preferences
- Performance optimization targets
- Issue severity classifications
- Review recommendations criteria

## Security

- Store API keys securely using environment variables
- Ensure proper access controls for code repositories
- Validate all file paths to prevent directory traversal attacks
