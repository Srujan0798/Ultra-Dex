# Installation

This guide covers how to install and set up Ultra-Dex for your development environment.

## System Requirements

- **Operating System**: macOS, Linux, or Windows (with WSL2)
- **Node.js**: v18.0 or higher
- **npm**: v8.0 or higher (or yarn)
- **Docker**: Recommended for sandboxing (optional but recommended)
- **Git**: Required for certain operations

## Installing Node.js

Ultra-Dex requires Node.js v18 or higher. If you don't have it installed:

### Using Node Version Manager (Recommended)

```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.bashrc

# Install and use Node.js v18+
nvm install 18
nvm use 18
```

### Using Package Managers

On macOS with Homebrew:
```bash
brew install node
```

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install nodejs npm
```

## Installing Ultra-Dex

You have three options for installing Ultra-Dex:

### Option 1: npx (No Installation Required)

The easiest way to try Ultra-Dex is using npx without installation:

```bash
npx ultra-dex
```

This downloads and runs Ultra-Dex without installing it permanently.

### Option 2: Global Installation

To install Ultra-Dex globally on your system:

```bash
npm install -g ultra-dex
```

After installation, you can run Ultra-Dex from anywhere:

```bash
ultra-dex
```

### Option 3: Project-Specific Installation

To install Ultra-Dex in a specific project:

```bash
# Navigate to your project directory
cd your-project-directory

# Install as a development dependency
npm install ultra-dex --save-dev

# Run using npx within the project
npx ultra-dex
```

## Docker Setup (Recommended)

For enhanced security and isolation, install Docker:

### On macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download from: https://desktop.docker.com/mac/main/arm64/Docker.dmg
```

### On Ubuntu
```bash
sudo apt update
sudo apt install docker.io
sudo usermod -aG docker $USER
```

After installing Docker, restart your terminal to apply group changes.

## Verification

Verify your installation by running:

```bash
ultra-dex --version
```

You should see the version number of Ultra-Dex.

## Configuration

After installation, you may want to configure Ultra-Dex. Create a `.ultra-dexrc` file in your home directory or project root:

```json
{
  "aiProvider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "sandboxEnabled": true,
  "debugMode": false
}
```

## Troubleshooting

### Permission Errors on Linux/macOS

If you get permission errors when installing globally, you may need to change npm's default directory:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
```

Then add this line to your `~/.profile` or `~/.bashrc`:
```bash
export PATH=~/.npm-global/bin:$PATH
```

### Docker Permission Issues

On Linux, if Docker commands fail with permission errors, add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

Log out and log back in for changes to take effect.

## Next Steps

Once installed, proceed to the [Quick Start](./quick-start.md) guide to begin using Ultra-Dex.