# Ultra-Dex: AI Orchestration Platform

## Overview

Ultra-Dex is an AI orchestration platform that enables teams to leverage multiple AI agents for software development tasks. The platform provides a command-line interface for managing AI-assisted development workflows with safety, governance, and verification controls.

## Current Functionality

### ✅ Working Features

#### 1. Multi-Agent System
- **18+ Specialized Agents**: Each with defined roles and responsibilities
  - @Planner: Task breakdown and planning
  - @CTO: Architecture and technical decisions
  - @Backend: API and business logic development
  - @Frontend: UI/UX development
  - @Database: Schema design and queries
  - @Testing: QA and test automation
  - @Reviewer: Code review and quality assurance
  - @Debugger: Bug fixing and troubleshooting
  - And more specialized agents...

#### 2. Enhanced AI Provider Support
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-4o, GPT-4o Mini with tool calling
- **Anthropic**: Claude models with function calling
- **Google**: Gemini models
- **Ollama**: Local AI models
- **Router**: Semantic routing between providers
- **Mock Provider**: For testing and development with simulated tool calls

#### 3. Advanced Tool Execution System
- **Legacy Commands**: `>> READ_CODE`, `>> WRITE_CODE`, `>> SEARCH_CODE`, `>> RUN_SHELL`, `>> DELEGATE`
- **Modern Tool Calling**: Structured function calls with parameters and validation
- **Security Controls**: Path validation, permission checking, sensitive file protection
- **Verification Hooks**: Code quality checks after operations

#### 4. Safety & Governance
- Permission system for agent operations
- Verification gates (linting, type safety, security)
- Error recovery mechanisms
- Token usage tracking
- Advanced approval workflows

#### 5. Project Management
- Automatic project scaffolding
- Implementation planning
- State management and persistence
- Context awareness
- Codebase analysis and graphing

### 6. Command Line Interface
- `ultra-dex init`: Initialize new projects
- `ultra-dex generate`: Create implementation plans
- `ultra-dex run <agent>`: Execute agent tasks
- `ultra-dex swarm <feature>`: Run multi-agent workflows
- `ultra-dex agents list`: View available agents
- `ultra-dex agents show <name>`: View agent prompts

## Enhanced Features

### Tool Calling Capabilities
Ultra-Dex now supports advanced tool calling that allows AI agents to interact with external systems:

```bash
# Agents can now use structured tool calls
The AI can call tools like:
{
  "name": "read_file",
  "arguments": {"filePath": "src/config.js"}
}

# While maintaining legacy command support
>> READ_CODE: "src/config.js"
>> WRITE_CODE: "src/new-feature.js" "// New feature implementation"
```

### Modern AI Integration
- **Function Calling**: Native support for OpenAI-style function calling
- **Streaming Tool Detection**: Real-time tool call detection during streaming responses
- **Multi-Modal Ready**: Architecture prepared for vision and audio capabilities
- **Provider Abstraction**: Consistent interface across all AI providers

### Enhanced Security
- **Path Validation**: Advanced directory traversal protection
- **Permission System**: Granular access controls for all operations
- **Verification Gates**: Automated code quality and security checks
- **Audit Trail**: Comprehensive logging of all agent actions

## Getting Started

### Prerequisites
- Node.js 18+
- API keys for your preferred AI provider (OpenAI, Anthropic, Google, etc.)

### Installation
```bash
npm install -g ultra-dex
```

### Quick Start
```bash
# Initialize a new project
ultra-dex init

# Generate an implementation plan
ultra-dex generate "TODO app with authentication"

# Run an agent task
ultra-dex run planner -t "Break down the authentication requirements"

# Run a multi-agent swarm
ultra-dex swarm "Implement user registration"
```

### Testing Without API Keys
You can test the platform functionality using the mock provider:

```bash
MOCK_AI_PROVIDERS=true ultra-dex agents list
```

## Architecture

### Enhanced Provider Abstraction Layer
The platform uses a unified provider interface supporting multiple AI services with consistent APIs, cost estimation, error handling, and advanced tool calling capabilities.

### Agent Orchestration Engine
The core engine coordinates between specialized agents, manages context, executes both legacy commands and modern tool calls safely, and maintains governance controls.

### Security Model
Advanced role-based access control, file system protections, command execution safeguards, and comprehensive audit logging.

## Development

### Running Tests
```bash
npm test
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Roadmap

### Near Term
- Enhanced agent communication protocols
- Improved project graph analysis
- Better error recovery mechanisms

### Medium Term
- Plugin ecosystem for custom agents
- Integration with popular IDEs
- Advanced project visualization

### Long Term
- Enterprise governance features
- Team collaboration tools
- Advanced AI model fine-tuning capabilities

## License

MIT License - see LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.

---

**Note**: This project is actively under development. Features and APIs may change as we work towards a stable release.