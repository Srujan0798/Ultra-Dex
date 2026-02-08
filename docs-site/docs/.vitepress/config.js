import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ultra-Dex Documentation',
  description: 'AI-powered development platform with persistent memory and governance',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/guide/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Tutorials', link: '/tutorials/' },
      { text: 'Marketplace', link: '/marketplace/' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Ultra-Dex?', link: '/introduction/' },
          { text: 'Quick Start', link: '/introduction/quick-start' },
          { text: 'Architecture', link: '/introduction/architecture' }
        ]
      },
      {
        text: 'Core Features',
        items: [
          { text: 'Memory System', link: '/core/memory' },
          { text: 'AI Orchestration', link: '/core/ai-orchestration' },
          { text: 'MCP Integration', link: '/core/mcp' },
          { text: 'Governance', link: '/core/governance' }
        ]
      },
      {
        text: 'Advanced Features',
        items: [
          { text: 'Voice-to-Code', link: '/advanced/voice' },
          { text: 'Vision Agent', link: '/advanced/vision' },
          { text: 'Autonomous Mode', link: '/advanced/autonomous' },
          { text: 'Self-Healing CI/CD', link: '/advanced/cicd' }
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'VS Code', link: '/integrations/vscode' },
          { text: 'JetBrains', link: '/integrations/jetbrains' },
          { text: 'Neovim', link: '/integrations/neovim' },
          { text: 'Claude Desktop', link: '/integrations/claude' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Srujan0798/Ultra-Dex' },
      { icon: 'twitter', link: 'https://twitter.com/ultra_dex' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Srujan Sai Karna'
    }
  }
})