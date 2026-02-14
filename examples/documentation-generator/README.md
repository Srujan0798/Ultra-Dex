# Documentation Generator Example

This example demonstrates how to create an AI-powered documentation generation system using Ultra-Dex. The system can automatically generate documentation from code, comments, and specifications.

## Features

- **Code Analysis**: Analyzes code to extract functionality, parameters, and usage patterns
- **Multi-Format Generation**: Creates documentation in various formats (Markdown, HTML, etc.)
- **API Documentation**: Generates comprehensive API documentation with endpoints and examples
- **Architecture Documentation**: Creates system architecture and design documents
- **Tutorial Generation**: Builds step-by-step tutorials based on code functionality
- **Quality Assessment**: Evaluates documentation quality and suggests improvements
- **Bulk Processing**: Generates documentation for entire projects

## Prerequisites

- Node.js 18+
- Ultra-Dex API key
- Source code files to document

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

The documentation generator uses several specialized agents:

- `code-analyzer`: Analyzes code to extract functionality and patterns
- `doc-generator`: Generates clear, comprehensive documentation
- `api-doc-generator`: Creates API documentation with endpoints and examples
- `tutorial-creator`: Builds step-by-step tutorials from code
- `quality-assessor`: Evaluates documentation quality and suggests improvements

## Usage

The documentation generator can process various types of source code:

```javascript
const docGenerator = new DocumentationGenerator({
  ultraDex: {
    apiKey: process.env.ULTRA_DEX_API_KEY,
    endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
  }
});

// Generate documentation from code
const doc = await docGenerator.generateFromCode('./path/to/your/code.js', {
  format: 'markdown',
  includeExamples: true,
  audience: 'beginner-developers'
});

// Generate API documentation
const apiDoc = await docGenerator.generateApiDocs('./path/to/api-spec.json', {
  format: 'openapi',
  includeExamples: true
});

// Generate a tutorial
const tutorial = await docGenerator.generateTutorial('./path/to/module.js', 'Using the Module', {
  difficulty: 'intermediate',
  stepsCount: 7
});

// Generate architecture documentation
const archDoc = await docGenerator.generateArchitectureDocs('./path/to/project/root', {
  includeDiagrams: true,
  includeDecisions: true
});
```

## Supported Languages

The generator supports documentation for multiple programming languages:

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
- And more

## Documentation Types

The system can generate:

- **Code Documentation**: Function, class, and module documentation
- **API Documentation**: Endpoint specifications with request/response examples
- **Architecture Docs**: System design and component interaction documentation
- **Tutorials**: Step-by-step guides for using code
- **Reference Guides**: Comprehensive documentation for libraries and frameworks

## Quality Assessment

Evaluate documentation quality with:

- Completeness checking
- Clarity analysis
- Accuracy verification
- Style consistency
- Target audience appropriateness

## Bulk Generation

Process entire projects at once:

```javascript
const results = await docGenerator.bulkGenerate('./path/to/project', {
  format: 'markdown',
  includeExamples: true,
  audience: 'developers'
});
```

## Export Options

Export documentation in various formats:

- Markdown
- HTML
- PDF (with additional tools)
- Static site generators (Jekyll, Hugo, etc.)

## Customization

You can customize the documentation generator by modifying:

- Target audience settings
- Output format preferences
- Documentation depth
- Example inclusion
- Quality standards
- Naming conventions

## Security

- Store API keys securely using environment variables
- Ensure proper access controls for source code access
- Validate all file paths to prevent directory traversal attacks