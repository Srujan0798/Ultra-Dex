# Contributing to Ultra-Dex

Thank you for your interest in contributing to Ultra-Dex! This document outlines the process for contributing to the project.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Pull Request Process](#pull-request-process)
5. [Style Guides](#style-guides)
6. [Plugin Development](#plugin-development)
7. [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by the Ultra-Dex Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs
- Ensure the bug was not already reported by searching on GitHub under Issues
- If you're unable to find an open issue addressing the problem, open a new one
- Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring

### Suggesting Enhancements
- Open a new issue with a clear title and detailed description of the suggested enhancement
- Explain why this enhancement would be useful to most Ultra-Dex users

### Pull Requests
- Fill in the provided PR template
- Follow the style guides outlined below
- Include appropriate test coverage
- End all files with a newline
- Update the documentation with changes to any public APIs

### Plugin Development
- Create plugins that extend Ultra-Dex functionality
- Follow the plugin development guidelines
- Share your plugins with the community

## Development Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git

### Setting Up Your Local Development Environment

1. Fork the Ultra-Dex repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Ultra-Dex.git
   cd Ultra-Dex
   ```
3. Install dependencies:
   ```bash
   cd cli
   npm install
   ```
4. Create a branch for local development:
   ```bash
   git checkout -b name-of-your-bugfix-or-feature
   ```
5. Make your changes
6. Test your changes:
   ```bash
   npm test
   ```
7. Commit your changes using a descriptive commit message
8. Push your branch to GitHub:
   ```bash
   git push origin name-of-your-bugfix-or-feature
   ```
9. Submit a pull request through the GitHub website

## Pull Request Process

1. Update the README.md with details of changes to the interface, including new environment variables, exposed ports, useful file locations, and container parameters
2. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent
3. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you

## Style Guides

### Git Commit Messages
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript Style Guide
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings except to avoid escaping
- Use arrow functions where appropriate
- Follow ES2020+ standards
- Use descriptive variable and function names
- Comment complex logic appropriately

### Documentation Style Guide
- Use Markdown for documentation
- Use sentence case for headings
- Use double spaces at the end of a line to force a line break

## Plugin Development

Ultra-Dex supports a plugin architecture for extending functionality. To develop a plugin:

### Creating a Plugin
1. Create a JavaScript file with the following structure:
   ```javascript
   // Plugin metadata
   export const name = 'my-plugin';
   export const version = '1.0.0';
   export const description = 'My awesome Ultra-Dex plugin';
   export const author = 'Your Name';

   /**
    * Activation function - called when the plugin is activated
    * @param {PluginManager} pluginManager - The plugin manager instance
    * @param {Command} cliProgram - The main CLI program instance
    */
   export async function activate(pluginManager, cliProgram) {
     // Register new commands or modify existing functionality
     cliProgram
       .command('my-command')
       .description('My plugin command')
       .action(() => {
         console.log('Hello from my plugin!');
       });

     // Register hooks to modify Ultra-Dex behavior
     pluginManager.registerHook('project-init', 'Called when initializing a new project');
   }

   // Export as default for ES module compatibility
   export default {
     name,
     version,
     description,
     author,
     activate
   };
   ```

2. Install your plugin:
   ```bash
   ultra-dex plugin install ./path-to-your-plugin.js
   ```

### Plugin Best Practices
- Use descriptive names for your plugin
- Include version information
- Handle errors gracefully
- Don't modify core Ultra-Dex functionality unless absolutely necessary
- Use hooks to extend functionality rather than overriding existing behavior
- Include clear documentation for your plugin's functionality

### Plugin Distribution
- Consider publishing your plugin to npm for easy distribution
- Include a clear README for your plugin
- Use semantic versioning for your plugin releases

## Community

- Join our Discord server for real-time discussions
- Follow us on Twitter for updates
- Subscribe to our newsletter for monthly updates
- Attend our virtual meetups

## Questions?

If you have any questions about contributing, feel free to open an issue with the "question" tag or contact the maintainers directly.