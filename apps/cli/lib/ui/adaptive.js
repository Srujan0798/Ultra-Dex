// Copyright (c) 2026 Ultra-Dex

/**
 * Mobile-Desktop Convergence (Samsung DeX paradigm)
 * Adaptive UI and field-to-station mode transitions
 */

export class AdaptiveUI {
  constructor(options = {}) {
    this.mode = options.mode || 'desktop'; // 'mobile', 'tablet', 'desktop'
    this.fieldMode = options.fieldMode || false;
    this.accessibility = options.accessibility || {};
  }

  /**
   * Detect current device mode
   */
  detectMode(userAgent, screenWidth) {
    if (screenWidth < 640) return 'mobile';
    if (screenWidth < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get UI configuration for current mode
   */
  getUIConfig() {
    const configs = {
      mobile: {
        layout: 'single-column',
        sidebarCollapsed: true,
        touchTargetSize: 48, // Minimum touch target
        fontSize: 'lg',
        quickActions: true,
        voiceInput: true,
        gestureNav: true,
      },
      tablet: {
        layout: 'two-column',
        sidebarCollapsed: false,
        touchTargetSize: 44,
        fontSize: 'base',
        quickActions: true,
        voiceInput: true,
        gestureNav: true,
      },
      desktop: {
        layout: 'three-column',
        sidebarCollapsed: false,
        touchTargetSize: 32,
        fontSize: 'sm',
        quickActions: false,
        voiceInput: false,
        gestureNav: false,
      },
    };

    return configs[this.mode] || configs.desktop;
  }

  /**
   * Field Mode - High visibility for outdoor/mobile use
   */
  getFieldModeConfig() {
    return {
      contrast: 'high',
      fontSize: 'xl',
      iconSize: 'large',
      touchTargetSize: 56,
      voiceCommands: true,
      offlineMode: true,
      quickCapture: true,
      syncOnReconnect: true,
    };
  }

  /**
   * Station Mode - Full desktop experience
   */
  getStationModeConfig() {
    return {
      layout: 'full-dashboard',
      multiPanel: true,
      keyboardShortcuts: true,
      commandPalette: true,
      splitView: true,
      fullEditor: true,
      livePreview: true,
    };
  }

  /**
   * Transition between modes
   */
  transitionMode(newMode) {
    const previousMode = this.mode;
    this.mode = newMode;

    return {
      from: previousMode,
      to: newMode,
      statePreserved: true,
      config: this.getUIConfig(),
    };
  }

  /**
   * Generate responsive CSS variables
   */
  generateCSSVariables() {
    const config = this.getUIConfig();

    return `
:root {
  --layout-columns: ${config.layout === 'three-column' ? 3 : config.layout === 'two-column' ? 2 : 1};
  --touch-target-size: ${config.touchTargetSize}px;
  --font-size-base: var(--text-${config.fontSize});
  --sidebar-width: ${config.sidebarCollapsed ? '0px' : '280px'};
  --content-padding: ${this.mode === 'mobile' ? '1rem' : '2rem'};
}

/* High visibility mode */
.field-mode {
  --contrast-ratio: 7:1;
  --font-weight: 600;
  --border-width: 2px;
}

/* Touch-friendly interactions */
@media (pointer: coarse) {
  button, a, input {
    min-height: var(--touch-target-size);
    min-width: var(--touch-target-size);
  }
}
`;
  }

  /**
   * Accessibility enhancements
   */
  getAccessibilityConfig() {
    return {
      focusIndicators: true,
      screenReaderSupport: true,
      keyboardNavigation: true,
      reducedMotion: this.accessibility.reduceMotion || false,
      highContrast: this.accessibility.highContrast || false,
      largeText: this.accessibility.largeText || false,
      colorBlindMode: this.accessibility.colorBlindMode || null,
    };
  }
}

/**
 * Offline-First Sync
 */
export class OfflineSync {
  constructor(options = {}) {
    this.queue = [];
    this.isOnline = options.isOnline !== false;
  }

  /**
   * Queue action for sync when online
   */
  queueAction(action) {
    this.queue.push({
      ...action,
      timestamp: new Date().toISOString(),
      synced: false,
    });

    this.persistQueue();
  }

  /**
   * Process sync queue when online
   */
  async processQueue() {
    if (!this.isOnline) return { processed: 0 };

    const toProcess = this.queue.filter((a) => !a.synced);
    let processed = 0;

    for (const action of toProcess) {
      try {
        // Process the action
        action.synced = true;
        processed++;
      } catch (error) {
        action.error = error.message;
      }
    }

    this.persistQueue();
    return { processed, remaining: toProcess.length - processed };
  }

  /**
   * Persist queue to storage
   */
  persistQueue() {
    // Would use localStorage or IndexedDB in browser
    return { queued: this.queue.length };
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    if (isOnline && wasOffline) {
      return this.processQueue();
    }

    return { status: isOnline ? 'online' : 'offline' };
  }
}

export default {
  AdaptiveUI,
  OfflineSync,
};
