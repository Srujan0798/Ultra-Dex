# Installation

This guide will walk you through installing Ultra-Dex on your system.

## Prerequisites

Before installing Ultra-Dex, ensure you have:

- Node.js version 18 or higher
- npm or yarn package manager
- Git version control system
- At least 4GB of free disk space

## Quick Install

Install Ultra-Dex globally using npm:

```bash
npm install -g ultra-dex
```

Or using yarn:

```bash
yarn global add ultra-dex
```

## Verify Installation

Check that Ultra-Dex is properly installed:

```bash
ultra-dex --version
```

You should see the version number printed to your terminal.

## Docker Installation (Alternative)

If you prefer using Docker, you can run Ultra-Dex without installing it globally:

```bash
docker run -it --rm srujan0798/ultra-dex:latest ultra-dex --version
```

## Configuration

After installation, run the setup wizard to configure Ultra-Dex:

```bash
ultra-dex setup
```

This will guide you through setting up:

- AI provider preferences (OpenAI, Anthropic, Google)
- API keys for various services
- Default project templates
- Integration settings

## Next Steps

Once installed, proceed to the [Quick Start Guide](./quick-start.md) to create your first project with Ultra-Dex.