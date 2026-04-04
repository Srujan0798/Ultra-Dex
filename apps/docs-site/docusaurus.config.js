// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ultra-Dex',
  tagline: 'The AI Orchestration Meta-Layer — A Skeleton, Not a Cage',
  favicon: 'img/logo.svg',

  url: 'https://ultra-dex.dev',
  baseUrl: '/',

  organizationName: 'Srujan0798',
  projectName: 'Ultra-Dex',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

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
          { to: '/blog', label: 'Blog', position: 'left' },
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
              { label: 'Extension Guide', to: '/docs/extensions' },
              { label: 'Plugin System', to: '/docs/plugins' },
              { label: 'CLI Reference', to: '/docs/cli' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'Blog', to: '/blog' },
              { label: 'Changelog', to: '/docs/changelog' },
              { label: 'Roadmap', to: '/docs/roadmap' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ultra-Dex Core Team. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'yaml', 'docker'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

export default config;
