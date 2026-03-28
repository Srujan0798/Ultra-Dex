// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Standard Layout Components
 * @module ui/layout
 * @description Unified header/footer layouts for consistent CLI experience
 */

import { theme, ultraGradient, divider } from './theme.js';
import { VERSION } from '../utils/version.js';
import { banner } from '../commands/banner.js';

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

const LAYOUT_WIDTHS = {
  headerDivider: 56,
  footerDivider: 56,
  contentPadding: 2,
};

const LAYOUT_STYLES = {
  header: {
    showBanner: true,
    showTitle: true,
    clearScreen: true,
  },
  footer: {
    showDivider: true,
    showVersion: true,
    showTagline: true,
  },
};

// ============================================================================
// HEADER COMPONENTS
// ============================================================================

/**
 * Show standard CLI header with gradient banner
 * @param {Object} options - Header options
 * @param {string} [options.title] - Optional title to display
 * @param {boolean} [options.clearScreen=true] - Whether to clear screen
 * @param {boolean} [options.showBanner=true] - Whether to show banner
 */
export function showHeader(options = {}) {
  const {
    title = '',
    clearScreen = LAYOUT_STYLES.header.clearScreen,
    showBanner = LAYOUT_STYLES.header.showBanner,
  } = options;

  if (clearScreen) {
    console.clear();
  }

  if (showBanner) {
    const gradientBanner = ultraGradient(banner);
    console.log(gradientBanner);
    console.log('');
  }

  if (title) {
    const padding = Math.max(0, 30 - Math.floor(title.length / 2));
    console.log(' '.repeat(padding) + theme.title(title.toUpperCase()));
    console.log(' '.repeat(padding) + theme.primary('─'.repeat(title.length)));
    console.log('');
  }
}

/**
 * Show minimal header without banner
 * @param {string} title - Section title
 */
export function showMinimalHeader(title) {
  console.log('');
  console.log(theme.title(`  ${title.toUpperCase()}`));
  console.log(theme.primary('  ' + '─'.repeat(LAYOUT_WIDTHS.headerDivider)));
  console.log('');
}

/**
 * Show section header for content grouping
 * @param {string} section - Section name
 */
export function showSectionHeader(section) {
  console.log('');
  console.log(theme.subtitle(`  ${section.toUpperCase()}`));
  console.log('');
}

// ============================================================================
// FOOTER COMPONENTS
// ============================================================================

/**
 * Show standard CLI footer
 * @param {Object} options - Footer options
 */
export function showFooter(options = {}) {
  const {
    showDivider = LAYOUT_STYLES.footer.showDivider,
    showVersion = LAYOUT_STYLES.footer.showVersion,
    showTagline = LAYOUT_STYLES.footer.showTagline,
  } = options;

  console.log('');

  if (showDivider) {
    console.log(divider('─', LAYOUT_WIDTHS.footerDivider));
  }

  const versionText = showVersion ? `Ultra-Dex v${VERSION}` : '';
  const taglineText = showTagline ? 'Professional AI Orchestration' : '';

  const parts = [];
  if (versionText) parts.push(theme.dim(versionText));
  if (taglineText) parts.push(theme.dim('•'));
  if (taglineText) parts.push(theme.subtitle(taglineText));

  console.log(`  ${parts.join(' ')}`);
  console.log('');
}

/**
 * Show compact footer for help screens
 */
export function showHelpFooter() {
  console.log('');
  console.log(divider('─', LAYOUT_WIDTHS.footerDivider));
  console.log(theme.dim('  Type "h" for help, "q" to quit.'));
  console.log('');
}

/**
 * Show action footer with available commands
 * @param {string[]} actions - List of available actions
 */
export function showActionFooter(actions) {
  console.log('');
  console.log(divider('─', LAYOUT_WIDTHS.footerDivider));
  console.log(theme.dim('  Available actions:'));
  console.log(theme.dim(`    ${actions.join('  •  ')}`));
  console.log('');
}

// ============================================================================
// PAGE LAYOUT
// ============================================================================

/**
 * Render a complete page with header, content, and footer
 * @param {Object} options - Page options
 * @param {string} [options.title] - Page title
 * @param {Function} options.renderContent - Function to render content
 * @param {boolean} [options.showFooter=true] - Whether to show footer
 */
export function renderPage(options) {
  const { title = '', renderContent, showFooter: showFooterOpt = true } = options;

  showHeader({ title });
  renderContent();
  if (showFooterOpt) {
    showFooter();
  }
}

/**
 * Render a content section with proper spacing
 * @param {string} content - Content to render
 */
export function renderSection(content) {
  console.log(content);
  console.log('');
}

// ============================================================================
// CARD LAYOUT
// ============================================================================

/**
 * Render a content card with border
 * @param {string} title - Card title
 * @param {string} content - Card content
 */
export function renderCard(title, content) {
  const width = 60;
  const border = theme.primary;

  console.log(border('╭' + '─'.repeat(width - 2) + '╮'));
  console.log(border('│') + ' '.repeat(2) + theme.title(title) + ' '.repeat(width - 4 - title.length) + border('│'));
  console.log(border('├' + '─'.repeat(width - 2) + '┤'));

  const lines = content.split('\n');
  lines.forEach((line) => {
    const padding = width - 4 - line.replace(/\x1b\[[0-9;]*m/g, '').length;
    console.log(border('│') + ' ' + line + ' '.repeat(Math.max(0, padding)) + ' ' + border('│'));
  });

  console.log(border('╰' + '─'.repeat(width - 2) + '╯'));
  console.log('');
}

// ============================================================================
// ERROR LAYOUT
// ============================================================================

/**
 * Show error layout
 * @param {string} message - Error message
 * @param {string[]} [suggestions] - Optional suggestions
 */
export function showErrorLayout(message, suggestions = []) {
  console.log('');
  console.log(theme.error('  ╭' + '─'.repeat(56) + '╮'));
  console.log(theme.error('  │') + ' ' + theme.error.bold('ERROR') + ' '.repeat(50) + theme.error('│'));
  console.log(theme.error('  ├' + '─'.repeat(56) + '┤'));
  console.log(theme.error('  │') + ' ' + message.padEnd(54) + theme.error('│'));

  if (suggestions.length > 0) {
    console.log(theme.error('  │') + ' '.repeat(56) + theme.error('│'));
    console.log(theme.error('  │') + ' ' + theme.error.bold('Suggestions:').padEnd(54) + theme.error('│'));
    suggestions.forEach((suggestion) => {
      console.log(theme.error('  │') + ('  • ' + suggestion).padEnd(54) + theme.error('│'));
    });
  }

  console.log(theme.error('  ╰' + '─'.repeat(56) + '╯'));
  console.log('');
}

// ============================================================================
// SUCCESS LAYOUT
// ============================================================================

/**
 * Show success layout
 * @param {string} message - Success message
 */
export function showSuccessLayout(message) {
  console.log('');
  console.log(theme.success('  ✓ ' + message));
  console.log('');
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

export default {
  showHeader,
  showMinimalHeader,
  showSectionHeader,
  showFooter,
  showHelpFooter,
  showActionFooter,
  renderPage,
  renderSection,
  renderCard,
  showErrorLayout,
  showSuccessLayout,
};

// ============================================================================
// MODULE ERROR HANDLING
// ============================================================================

/**
 * Handle errors in layout module
 * @param {Error} error - The error to handle
 * @param {string} [context='layout'] - Error context
 */
function handleModuleError(error, context = 'layout') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
