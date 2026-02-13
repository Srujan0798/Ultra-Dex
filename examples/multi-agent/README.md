# Ultra-Dex Multi-Agent Workflow Example

This example demonstrates how to coordinate multiple specialized agents to accomplish complex tasks.

## Overview

This example shows a complete software development workflow using multiple agents:

- **Project Planner**: Breaks down requirements into tasks
- **System Architect**: Designs the system architecture
- **Backend Developer**: Implements server-side logic
- **Frontend Developer**: Creates user interfaces
- **QA Engineer**: Writes and runs tests
- **DevOps Engineer**: Sets up deployment pipelines
- **Security Reviewer**: Reviews for security vulnerabilities

## Setup

1. Ensure Ultra-Dex is installed and configured:
   ```bash
   npm install -g ultra-dex
   ultra-dex config --wizard
   ```

2. Navigate to this directory:
   ```bash
   cd examples/multi-agent
   ```

## Usage

Run the multi-agent workflow:

```bash
ultra-dex run --task "Build a simple task management application with user authentication, CRUD operations, and responsive UI"
```

Or run with specific agents:

```bash
ultra-dex swarm --agents "planner,architect,backend,frontend,testing" --task "Create a blog platform"
```

## Architecture

The multi-agent workflow follows this pattern:

1. **Planning Phase**: Planner agent breaks down the task
2. **Architecture Phase**: Architect designs the system
3. **Implementation Phase**: Backend and Frontend agents work in parallel
4. **Testing Phase**: QA engineer creates and runs tests
5. **Review Phase**: Security reviewer checks for vulnerabilities
6. **Deployment Phase**: DevOps engineer sets up deployment

## Configuration

The workflow is configured in `workflow.json`:

```json
{
  "phases": [
    {
      "name": "Planning",
      "agents": ["planner"],
      "dependencies": []
    },
    {
      "name": "Architecture",
      "agents": ["architect"],
      "dependencies": ["Planning"]
    },
    {
      "name": "Implementation",
      "agents": ["backend", "frontend"],
      "dependencies": ["Architecture"],
      "parallel": true
    },
    {
      "name": "Testing",
      "agents": ["testing"],
      "dependencies": ["Implementation"]
    },
    {
      "name": "Review",
      "agents": ["reviewer"],
      "dependencies": ["Testing"]
    }
  ]
}
```

## Benefits

- **Parallel Execution**: Multiple agents work simultaneously when possible
- **Specialization**: Each agent focuses on its area of expertise
- **Quality Assurance**: Built-in review and testing phases
- **Scalability**: Easily add or remove agents based on project needs
- **Consistency**: Standardized processes across projects

## Customization

You can customize the workflow by:

- Adding new agent types in `agents/`
- Modifying the phase dependencies in `workflow.json`
- Adjusting agent prompts in `agents/agent-name.md`
- Changing parallelization settings

## Advanced Features

- **Dynamic Agent Assignment**: Assign agents based on task requirements
- **Resource Optimization**: Balance workload across agents
- **Error Recovery**: Automatically retry failed agent tasks
- **Progress Tracking**: Monitor each agent's progress independently
- **Collaborative Intelligence**: Agents share information and insights

## Real-World Applications

This pattern works well for:
- Software development projects
- Content creation workflows
- Research and analysis tasks
- Business process automation
- Creative endeavors