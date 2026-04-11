// Copyright (c) 2026 Ultra-Dex

/**
 * MCP Apps - Main Entry Point
 * Provides interactive UI components for MCP-compatible tools
 */

import { mcpAppRenderer, initializeMCPApps } from './renderer.js';
import {
  _renderComponent,
  registerComponent,
  getSupportedComponents,
  validateComponentProps,
} from './components.js';
import { printInfo, printSuccess, printError } from '../../utils/output.js';
import chalk from 'chalk';

/**
 * MCP Apps Integration Module
 * Enables interactive UI components in MCP-compatible tools like Cursor and Claude Desktop
 */

// Initialize MCP Apps system
let mcpAppsInitialized = false;

/**
 * Initialize MCP Apps system
 */
export async function initMCPApps() {
  if (mcpAppsInitialized) {
    return mcpAppRenderer;
  }

  printInfo(chalk.cyan('🔌 Initializing MCP Apps System...'));

  try {
    await initializeMCPApps();
    mcpAppsInitialized = true;
    printSuccess(chalk.green('✅ MCP Apps System Initialized'));
    return mcpAppRenderer;
  } catch (error) {
    printError(chalk.red(`❌ Failed to initialize MCP Apps: ${error.message}`));
    throw error;
  }
}

/**
 * Render an interactive dashboard component
 */
export async function renderDashboard(props) {
  if (!mcpAppsInitialized) {
    await initMCPApps();
  }

  return mcpAppRenderer.createDashboard(props);
}

/**
 * Render a progress component
 */
export async function renderProgress(props) {
  if (!mcpAppsInitialized) {
    await initMCPApps();
  }

  return mcpAppRenderer.createProgress(props);
}

/**
 * Render a form component
 */
export async function renderForm(props) {
  if (!mcpAppsInitialized) {
    await initMCPApps();
  }

  return mcpAppRenderer.createForm(props);
}

/**
 * Render a table component
 */
export async function renderTable(props) {
  if (!mcpAppsInitialized) {
    await initMCPApps();
  }

  return mcpAppRenderer.createTable(props);
}

/**
 * Render a chart component
 */
export async function renderChart(props) {
  if (!mcpAppsInitialized) {
    await initMCPApps();
  }

  return mcpAppRenderer.createChart(props);
}

/**
 * Render a button component
 */
export async function renderButton(props) {
  if (!mcpAppsInitialized) {
    await initMCPApps();
  }

  return mcpAppRenderer.createButton(props);
}

/**
 * Register a custom component
 */
export function registerCustomComponent(type, renderer) {
  return registerComponent(type, renderer);
}

/**
 * Get supported component types
 */
export function getMCPAppComponentTypes() {
  return getSupportedComponents();
}

/**
 * Validate component properties
 */
export function validateMCPComponentProps(type, props) {
  return validateComponentProps(type, props);
}

/**
 * MCP App Protocol Handler
 * Handles MCP app-related messages
 */
export class MCPAppProtocolHandler {
  constructor() {
    this.apps = new Map();
    this.sessions = new Map();
  }

  /**
   * Handle MCP app render request
   */
  async handleAppRender(params) {
    const { component, data } = params;

    printInfo(chalk.blue(`🎨 Rendering MCP App: ${component}`));

    try {
      let componentResult;

      switch (component) {
        case 'dashboard':
          componentResult = await renderDashboard(data);
          break;
        case 'progress':
          componentResult = await renderProgress(data);
          break;
        case 'form':
          componentResult = await renderForm(data);
          break;
        case 'table':
          componentResult = await renderTable(data);
          break;
        case 'chart':
          componentResult = await renderChart(data);
          break;
        case 'button':
          componentResult = await renderButton(data);
          break;
        default:
          throw new Error(`Unsupported component type: ${component}`);
      }

      return {
        success: true,
        component: componentResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      printError(chalk.red(`❌ Failed to render component ${component}: ${error.message}`));
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Handle MCP app update request
   */
  async handleAppUpdate(params) {
    const { appId, _updates } = params;

    printInfo(chalk.blue(`🔄 Updating MCP App: ${appId}`));

    // In a real implementation, this would update the app state
    return {
      success: true,
      appId,
      updated: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle MCP app interaction
   */
  async handleAppInteract(params) {
    const { appId, interaction, _data } = params;

    printInfo(chalk.blue(`🖱️  MCP App Interaction: ${interaction} in ${appId}`));

    // In a real implementation, this would handle the interaction
    return {
      success: true,
      appId,
      interaction,
      result: 'processed',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Register an app
   */
  registerApp(appId, appDefinition) {
    this.apps.set(appId, appDefinition);
    printSuccess(chalk.green(`✅ Registered MCP App: ${appId}`));
  }

  /**
   * Get app
   */
  getApp(appId) {
    return this.apps.get(appId);
  }

  /**
   * Get all apps
   */
  getApps() {
    return Array.from(this.apps.keys());
  }
}

// Create a global MCP App Protocol Handler instance
export const mcpAppProtocolHandler = new MCPAppProtocolHandler();

/**
 * Example usage of MCP Apps
 */
export function showMCPAppsExample() {
  printInfo(chalk.bold.cyan('\n🎨 MCP Apps Example Usage:\n'));

  printInfo(chalk.blue('1. Dashboard Component:'));
  printInfo(chalk.gray('   renderDashboard({ project: "MyApp", status: "active", score: 85 })\n'));

  printInfo(chalk.blue('2. Progress Component:'));
  printInfo(chalk.gray('   renderProgress({ title: "Building API", current: 7, total: 10 })\n'));

  printInfo(chalk.blue('3. Form Component:'));
  printInfo(
    chalk.gray(
      '   renderForm({ title: "Create Task", fields: [{ name: "title", label: "Task Title" }] })\n'
    )
  );

  printInfo(chalk.blue('4. Table Component:'));
  printInfo(
    chalk.gray('   renderTable({ headers: ["Name", "Status"], rows: [["API", "Complete"]] })\n')
  );
}

export default {
  initMCPApps,
  renderDashboard,
  renderProgress,
  renderForm,
  renderTable,
  renderChart,
  renderButton,
  registerCustomComponent,
  getMCPAppComponentTypes,
  validateMCPComponentProps,
  MCPAppProtocolHandler,
  mcpAppProtocolHandler,
  showMCPAppsExample,
};
