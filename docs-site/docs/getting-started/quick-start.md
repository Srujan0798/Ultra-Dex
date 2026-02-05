# Getting Started

Welcome to Ultra-Dex! This guide will help you get started with the autonomous OS for software engineering.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Docker (for sandboxing, recommended)

## Installation

You can use Ultra-Dex in several ways:

### Option 1: npx (Recommended for trying out)

```bash
npx ultra-dex
```

This is the easiest way to try Ultra-Dex without installing it globally.

### Option 2: Global Installation

```bash
npm install -g ultra-dex
```

Then you can run:

```bash
ultra-dex
```

### Option 3: Local Installation

```bash
npm install ultra-dex --save-dev
```

Then run with:

```bash
npx ultra-dex
```

## Quick Start

### Initialize a New Project

```bash
mkdir my-ultra-project
cd my-ultra-project
ultra-dex init
```

This will create a new project with the Ultra-Dex structure.

### Generate an Implementation Plan

```bash
ultra-dex generate "A task management SaaS with user authentication"
```

This creates a comprehensive 34-section implementation plan.

### Run the Interactive Dashboard

```bash
ultra-dex
```

This starts the interactive dashboard where you can manage agents and tasks.

### Run an Agent Swarm

```bash
ultra-dex swarm "Build user authentication system"
```

This coordinates multiple agents to implement the feature.

## Configuration

Create a `.ultra-dexrc` file in your project root:

```json
{
  "aiProvider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "workspace": "./projects/my-app",
  "sandboxEnabled": true,
  "debugMode": false,
  "maxTokens": 4096,
  "temperature": 0.2
}
```

## Next Steps

- Explore the [CLI Reference](../cli/overview.md) for all available commands
- Learn about [Agent Orchestration](../agents/overview.md)
- Understand [MCP Integration](../mcp/overview.md)