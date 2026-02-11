#!/usr/bin/env node

/**
 * Interactive Onboarding System for Ultra-Dex
 * Provides guided setup and introduction to the platform
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export default class OnboardingSystem {
  constructor() {
    this.userPreferences = {};
    this.projectConfig = {};
  }

  async start() {
    console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║                    ULTRA-DEX ONBOARDING                     ║'));
    console.log(chalk.cyan('╠══════════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║                                                              ║'));
    console.log(chalk.cyan('║    Welcome to the AI Orchestration Meta-Layer for SaaS     ║'));
    console.log(chalk.cyan('║                                                              ║'));
    console.log(chalk.cyan('║              v6.0.0 「 THE ENDGAME 」 🎮                    ║'));
    console.log(chalk.cyan('║                                                              ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝\n'));

    try {
      await this.welcomeSection();
      await this.userProfileSection();
      await this.aiProviderSection();
      await this.projectSetupSection();
      await this.agentIntroductionSection();
      await this.featureTourSection();
      await this.createQuickStartGuide();
      await this.completionSection();
    } catch (error) {
      console.error(chalk.red('\n❌ Onboarding failed:'), error.message);
      process.exit(1);
    }
  }

  async welcomeSection() {
    const welcomeQuestions = [
      {
        type: 'confirm',
        name: 'ready',
        message: chalk.green('Are you ready to begin your journey with Ultra-Dex?'),
        default: true
      }
    ];

    const answers = await inquirer.prompt(welcomeQuestions);
    if (!answers.ready) {
      console.log(chalk.yellow('\nNo worries! You can run this onboarding anytime with:'));
      console.log(chalk.cyan('ultra-dex onboard'));
      process.exit(0);
    }

    console.log(chalk.green('\n🚀 Excellent! Let\'s get you set up with Ultra-Dex...\n'));
  }

  async userProfileSection() {
    console.log(chalk.blue('\n👤 USER PROFILE SETUP\n'));
    console.log(chalk.gray('Let\'s learn a bit about you to customize your experience.\n'));

    const profileQuestions = [
      {
        type: 'input',
        name: 'name',
        message: chalk.cyan('What\'s your name?'),
        validate: (input) => input.trim().length > 0 || 'Name is required'
      },
      {
        type: 'list',
        name: 'role',
        message: chalk.cyan('What best describes your role?'),
        choices: [
          { name: 'Software Developer', value: 'developer' },
          { name: 'Engineering Manager', value: 'manager' },
          { name: 'CTO/Technical Leader', value: 'cto' },
          { name: 'Product Manager', value: 'product' },
          { name: 'Student/Learner', value: 'student' },
          { name: 'Other', value: 'other' }
        ]
      },
      {
        type: 'list',
        name: 'experience',
        message: chalk.cyan('What\'s your experience level with AI tools?'),
        choices: [
          { name: 'Beginner - Just getting started', value: 'beginner' },
          { name: 'Intermediate - Some experience', value: 'intermediate' },
          { name: 'Advanced - Extensive experience', value: 'advanced' },
          { name: 'Expert - Building AI tools', value: 'expert' }
        ]
      },
      {
        type: 'checkbox',
        name: 'interests',
        message: chalk.cyan('What interests you most about AI-assisted development? (select all that apply)'),
        choices: [
          { name: 'Code generation and completion', value: 'code_generation' },
          { name: 'Architecture and planning', value: 'architecture' },
          { name: 'Testing and quality assurance', value: 'testing' },
          { name: 'Security and governance', value: 'security' },
          { name: 'Multi-agent collaboration', value: 'collaboration' },
          { name: 'Automation and productivity', value: 'automation' }
        ]
      }
    ];

    this.userPreferences = await inquirer.prompt(profileQuestions);
    console.log(chalk.green('\n✅ Profile saved successfully!\n'));
  }

  async aiProviderSection() {
    console.log(chalk.blue('\n🤖 AI PROVIDER CONFIGURATION\n'));
    console.log(chalk.gray('Configure your preferred AI provider for the best experience.\n'));

    const providerQuestions = [
      {
        type: 'list',
        name: 'provider',
        message: chalk.cyan('Which AI provider would you like to use?'),
        choices: [
          { name: 'OpenAI (Recommended)', value: 'openai', short: 'OpenAI' },
          { name: 'Anthropic Claude', value: 'claude', short: 'Claude' },
          { name: 'Google Gemini', value: 'gemini', short: 'Gemini' },
          { name: 'Ollama (Local)', value: 'ollama', short: 'Ollama' },
          { name: 'Mock (Testing)', value: 'mock', short: 'Mock' }
        ]
      }
    ];

    const providerAnswer = await inquirer.prompt(providerQuestions);
    this.projectConfig.provider = providerAnswer.provider;

    if (this.projectConfig.provider !== 'mock' && this.projectConfig.provider !== 'ollama') {
      const keyQuestions = [
        {
          type: 'password',
          name: 'apiKey',
          message: chalk.cyan(`Enter your ${providerAnswer.provider.toUpperCase()} API key:`),
          validate: (input) => input.trim().length > 0 || 'API key is required'
        }
      ];

      const keyAnswer = await inquirer.prompt(keyQuestions);
      this.projectConfig.apiKey = keyAnswer.apiKey;
    }

    console.log(chalk.green('\n✅ AI provider configured!\n'));
  }

  async projectSetupSection() {
    console.log(chalk.blue('\n🏗️  PROJECT SETUP\n'));
    console.log(chalk.gray('Let\'s set up your first project with Ultra-Dex.\n'));

    const projectQuestions = [
      {
        type: 'input',
        name: 'projectName',
        message: chalk.cyan('What would you like to name your project?'),
        default: 'my-ultra-project',
        validate: (input) => {
          const regex = /^[a-zA-Z0-9-_]+$/;
          return regex.test(input) || 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
      },
      {
        type: 'list',
        name: 'projectType',
        message: chalk.cyan('What type of project are you building?'),
        choices: [
          { name: 'Web Application (Next.js, React)', value: 'web' },
          { name: 'API/Backend Service', value: 'api' },
          { name: 'Mobile Application', value: 'mobile' },
          { name: 'Full-Stack Application', value: 'fullstack' },
          { name: 'Library/Tool', value: 'library' },
          { name: 'Other', value: 'other' }
        ]
      },
      {
        type: 'confirm',
        name: 'useTemplate',
        message: chalk.cyan('Would you like to start with a template?'),
        default: true
      }
    ];

    const projectAnswers = await inquirer.prompt(projectQuestions);
    this.projectConfig.projectName = projectAnswers.projectName;
    this.projectConfig.projectType = projectAnswers.projectType;
    this.projectConfig.useTemplate = projectAnswers.useTemplate;

    if (this.projectConfig.useTemplate) {
      const templateQuestions = [
        {
          type: 'list',
          name: 'template',
          message: chalk.cyan('Which template would you like to use?'),
          choices: [
            { name: 'Next.js SaaS Template', value: 'nextjs-saas' },
            { name: 'Express.js API Template', value: 'express-api' },
            { name: 'React Component Library', value: 'react-lib' },
            { name: 'Node.js CLI Tool', value: 'node-cli' }
          ]
        }
      ];

      const templateAnswer = await inquirer.prompt(templateQuestions);
      this.projectConfig.template = templateAnswer.template;
    }

    console.log(chalk.green('\n✅ Project configuration complete!\n'));
  }

  async agentIntroductionSection() {
    console.log(chalk.blue('\n🤖 MEET YOUR AI AGENTS\n'));
    console.log(chalk.gray('Ultra-Dex has specialized agents for different tasks:\n'));

    const agents = [
      { name: '@Planner', role: 'Task breakdown and planning', icon: '📋' },
      { name: '@CTO', role: 'Architecture and technical decisions', icon: '🏢' },
      { name: '@Backend', role: 'API and business logic development', icon: '⚙️' },
      { name: '@Frontend', role: 'UI/UX development', icon: '🎨' },
      { name: '@Database', role: 'Schema design and queries', icon: '🗄️' },
      { name: '@Testing', role: 'QA and test automation', icon: '🧪' },
      { name: '@Reviewer', role: 'Code review and quality assurance', icon: '🔍' },
      { name: '@Debugger', role: 'Bug fixing and troubleshooting', icon: '🐛' }
    ];

    for (const agent of agents) {
      console.log(`${agent.icon} ${chalk.yellow(`@${agent.name}`)}: ${agent.role}`);
    }

    console.log(chalk.gray('\nThese agents work together to assist you with development tasks.'));
    console.log(chalk.gray('You can interact with them individually or as a team.\n'));

    await inquirer.prompt([
      {
        type: 'confirm',
        name: 'understandAgents',
        message: chalk.cyan('Do you understand how the agents work?'),
        default: true
      }
    ]);
  }

  async featureTourSection() {
    console.log(chalk.blue('\n🌟 PLATFORM FEATURES TOUR\n'));
    console.log(chalk.gray('Here are the key features you can use:\n'));

    const features = [
      { name: 'Project Generation', command: 'ultra-dex generate "idea"', desc: 'Create full implementation plans' },
      { name: 'Agent Tasks', command: 'ultra-dex run planner -t "task"', desc: 'Execute specific tasks with agents' },
      { name: 'Multi-Agent Swarm', command: 'ultra-dex swarm "feature"', desc: 'Run coordinated agent workflows' },
      { name: 'Code Assistance', command: 'ultra-dex run backend -t "implement API"', desc: 'Get specialized code help' },
      { name: 'Project Analysis', command: 'ultra-dex review', desc: 'Analyze and improve your codebase' }
    ];

    for (const feature of features) {
      console.log(`${chalk.yellow(feature.command)}`);
      console.log(`  ${chalk.gray(feature.desc)}\n`);
    }

    console.log(chalk.gray('You can explore these features as you become familiar with the platform.\n'));

    await inquirer.prompt([
      {
        type: 'confirm',
        name: 'readyToTry',
        message: chalk.cyan('Are you ready to try Ultra-Dex?'),
        default: true
      }
    ]);
  }

  async createQuickStartGuide() {
    const guideContent = `# Ultra-Dex Quick Start Guide

Welcome ${this.userPreferences.name}! Here's your personalized quick start guide.

## Your Configuration
- **Role**: ${this.userPreferences.role}
- **Experience**: ${this.userPreferences.experience}
- **AI Provider**: ${this.projectConfig.provider}
- **Project**: ${this.projectConfig.projectName} (${this.projectConfig.projectType})

## Getting Started

### 1. Initialize Your Project
\`\`\`bash
ultra-dex init --name "${this.projectConfig.projectName}"
\`\`\`

### 2. Generate an Implementation Plan
\`\`\`bash
ultra-dex generate "My ${this.projectConfig.projectType} project with key features"
\`\`\`

### 3. Start with an Agent
\`\`\`bash
ultra-dex run planner -t "Break down the project requirements"
\`\`\`

### 4. Run a Multi-Agent Swarm
\`\`\`bash
ultra-dex swarm "Implement user authentication"
\`\`\`

## Recommended Next Steps
${this.getRecommendations()}

## Useful Commands
- \`ultra-dex agents list\` - See all available agents
- \`ultra-dex run --help\` - Learn about agent commands
- \`ultra-dex --help\` - See all available commands

## Need Help?
- \`ultra-dex help\` - Interactive help system
- \`ultra-dex docs\` - Browse documentation
- \`ultra-dex chat\` - Talk to the AI assistant

Happy coding with Ultra-Dex! 🚀
`;

    await fs.writeFile('ULTRA-DEX-QUICK-START.md', guideContent);
    console.log(chalk.green('✅ Quick start guide created: ULTRA-DEX-QUICK-START.md\n'));
  }

  getRecommendations() {
    const recs = [];
    
    if (this.userPreferences.role === 'developer' || this.userPreferences.role === 'student') {
      recs.push('- Start with simple tasks using @planner and @backend agents');
      recs.push('- Try the generate command to create project plans');
    }
    
    if (this.userPreferences.role === 'manager' || this.userPreferences.role === 'cto') {
      recs.push('- Focus on architecture decisions with @cto agent');
      recs.push('- Use swarm commands for coordinated development');
    }
    
    if (this.userPreferences.experience === 'beginner') {
      recs.push('- Begin with mock provider to learn the system');
      recs.push('- Use the help command frequently');
    }
    
    if (this.userPreferences.interests.includes('automation')) {
      recs.push('- Explore the daemon and background agent features');
    }
    
    if (recs.length === 0) {
      recs.push('- Explore the generate and run commands');
      recs.push('- Try different agents to see their specialties');
    }
    
    return recs.map(rec => `• ${rec}`).join('\n');
  }

  async completionSection() {
    console.log(chalk.cyan('\n🎉 ONBOARDING COMPLETE!\n'));
    console.log(chalk.green('Congratulations! You\'re now ready to use Ultra-Dex.\n'));

    console.log(chalk.yellow('Your next steps:'));
    console.log(chalk.cyan(`1. Review your quick start guide: ULTRA-DEX-QUICK-START.md`));
    console.log(chalk.cyan(`2. Run: ultra-dex init --name "${this.projectConfig.projectName}"`));
    console.log(chalk.cyan(`3. Start building amazing things! 🚀\n`));

    console.log(chalk.blue('Need more help?'));
    console.log(chalk.gray('- Visit our documentation: ultra-dex docs'));
    console.log(chalk.gray('- Join our community: ultra-dex community'));
    console.log(chalk.gray('- Get support: ultra-dex support\n'));

    console.log(chalk.magenta('Welcome to the future of AI-assisted development!'));
    console.log(chalk.magenta('May your code be clean, your deployments be smooth, and your AI agents be helpful. 🤖💻'));
  }
}

// Run the onboarding system
const onboarding = new OnboardingSystem();
onboarding.start().catch(console.error);