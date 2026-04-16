// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ultra-Dex',
  tagline: 'AI Orchestration Documentation',
  favicon: 'img/logo.svg',

  url: 'https://ultradex-docs.vercel.app',
  baseUrl: '/',

  organizationName: 'Srujan0798',
  projectName: 'Ultra-Dex',

  onBrokenLinks: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/logo.svg',
      navbar: {
        title: 'Ultra-Dex',
        logo: {
          alt: 'Ultra-Dex Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          { to: '/docs/providers', label: 'Providers', position: 'left' },
          { to: '/docs/sdk', label: 'SDK', position: 'left' },
          {
            href: 'https://ultradex.vercel.app',
            label: 'Website',
            position: 'right',
          },
          {
            href: 'https://github.com/Srujan0798/Ultra-Dex',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              { label: 'Getting Started', to: '/docs/intro' },
              { label: 'Architecture', to: '/docs/architecture' },
              { label: 'Provider Guide', to: '/docs/providers' },
              { label: 'SDK Reference', to: '/docs/sdk' },
            ],
          },
          {
            title: 'Develop',
            items: [
              { label: 'Extensions', to: '/docs/extensions' },
              { label: 'CLI Reference', to: '/docs/cli/overview' },
              { label: 'API Reference', to: '/docs/api-reference' },
              { label: 'Troubleshooting', to: '/docs/troubleshooting' },
            ],
          },
          {
            title: 'Links',
            items: [
              { label: 'Website', href: 'https://ultradex.vercel.app' },
              { label: 'Dashboard', href: 'https://ultradex-dashboard.vercel.app' },
              { label: 'GitHub', href: 'https://github.com/Srujan0798/Ultra-Dex' },
              { label: 'npm', href: 'https://www.npmjs.com/package/@ultra-dex/sdk' },
            ],
          },
        ],
        copyright: `Copyright \u00A9 ${new Date().getFullYear()} Ultra-Dex. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'yaml', 'docker', 'typescript'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
    }),
};

export default config;
