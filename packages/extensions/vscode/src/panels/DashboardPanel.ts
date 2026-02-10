/**
 * @fileoverview DashboardPanel module
 * @module panels/DashboardPanel
 */

export { DashboardPanel } from '../dashboard/DashboardPanel';

/**
 * Error handler for DashboardPanel
 * @param {Error} error - Error to handle
 */
function handleDashboardPanelError(error) {
  try {
    console.error('[DashboardPanel]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
