/**
 * MCP Apps Renderer
 * Renders UI components for MCP-compatible tools (Cursor, Claude Desktop, etc.)
 */

import { renderComponent, validateComponentProps } from './components.js';
import { printInfo, printSuccess, printWarning, printError } from '../../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../../utils/errors.js';

/**
 * MCP App Renderer Class
 * Handles rendering of interactive UI components in MCP-compatible environments
 */
export class MCPAppRenderer {
  constructor() {
    this.components = new Map();
    this.apps = new Map();
    this.state = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Register a component type
   */
  registerComponent(type, renderer) {
    this.components.set(type, renderer);
  }

  /**
   * Register an app with its configuration
   */
  registerApp(id, config) {
    this.apps.set(id, config);
    this.state.set(id, { ...config.initialState });
  }

  /**
   * Render a component
   */
  renderComponent(type, props) {
    // Validate props
    const validation = validateComponentProps(type, props);
    if (!validation.valid) {
      throw new AppError(`Invalid props for component ${type}: ${validation.errors.join(', ')}`, { 
        code: 'INVALID_COMPONENT_PROPS' 
      });
    }

    // Use the component renderer
    return renderComponent(type, props);
  }

  /**
   * Render an app
   */
  renderApp(appId, params = {}) {
    const app = this.apps.get(appId);
    if (!app) {
      throw new AppError(`App not found: ${appId}`, { code: 'APP_NOT_FOUND' });
    }

    // Get current state
    const currentState = this.state.get(appId);
    
    // Update state if needed
    if (params.stateUpdate) {
      const newState = { ...currentState, ...params.stateUpdate };
      this.state.set(appId, newState);
    }

    // Render the app with current state
    const appState = this.state.get(appId);
    return app.renderer(appState, params);
  }

  /**
   * Handle app interaction
   */
  async handleInteraction(appId, interactionType, data) {
    const app = this.apps.get(appId);
    if (!app || !app.handlers || !app.handlers[interactionType]) {
      throw new AppError(`No handler for ${interactionType} in app ${appId}`, { code: 'NO_HANDLER' });
    }

    // Execute the handler
    const result = await app.handlers[interactionType](data);
    
    // Update state if handler returns state changes
    if (result && result.stateUpdate) {
      const currentState = this.state.get(appId);
      this.state.set(appId, { ...currentState, ...result.stateUpdate });
    }

    return result;
  }

  /**
   * Create a dashboard component
   */
  createDashboard(props) {
    return this.renderComponent('dashboard', props);
  }

  /**
   * Create a progress component
   */
  createProgress(props) {
    return this.renderComponent('progress', props);
  }

  /**
   * Create a form component
   */
  createForm(props) {
    return this.renderComponent('form', props);
  }

  /**
   * Create a table component
   */
  createTable(props) {
    return this.renderComponent('table', props);
  }

  /**
   * Create a chart component
   */
  createChart(props) {
    return this.renderComponent('chart', props);
  }

  /**
   * Create a button component
   */
  createButton(props) {
    return this.renderComponent('button', props);
  }

  /**
   * Get app state
   */
  getAppState(appId) {
    return this.state.get(appId);
  }

  /**
   * Update app state
   */
  updateAppState(appId, newState) {
    const currentState = this.state.get(appId);
    this.state.set(appId, { ...currentState, ...newState });
  }

  /**
   * Get all registered apps
   */
  getApps() {
    return Array.from(this.apps.keys());
  }

  /**
   * Get component HTML for MCP tools
   */
  getComponentHTML(componentType, props) {
    const component = this.renderComponent(componentType, props);
    
    // Return MCP-compatible format
    return {
      type: 'mcp/app/render',
      params: {
        component: componentType,
        props,
        html: component.html,
        interactive: component.interactive || false,
        handlers: component.handlers || {}
      }
    };
  }

  /**
   * Render for terminal (fallback)
   */
  renderTerminal(componentType, props) {
    const component = this.renderComponent(componentType, props);
    
    // For terminal, just return a text representation
    switch (componentType) {
      case 'dashboard':
        return this.renderDashboardTerminal(props);
      case 'progress':
        return this.renderProgressTerminal(props);
      case 'table':
        return this.renderTableTerminal(props);
      default:
        return `Component: ${componentType}\nProps: ${JSON.stringify(props, null, 2)}`;
    }
  }

  /**
   * Render dashboard for terminal
   */
  renderDashboardTerminal(props) {
    const { project, status, score, agents = [], tasks = [] } = props;
    
    let output = chalk.bold.blue(`📊 ${props.title || 'Project Dashboard'}\n`);
    output += chalk.bold(`Project: ${project}\n`);
    output += chalk.bold(`Status: ${status}\n`);
    output += chalk.bold(`Score: ${score}%\n\n`);
    
    if (agents.length > 0) {
      output += chalk.bold('👥 Active Agents:\n');
      for (const agent of agents) {
        output += `  ${agent.name}: ${agent.status}\n`;
      }
      output += '\n';
    }
    
    if (tasks.length > 0) {
      output += chalk.bold('📋 Tasks:\n');
      const pendingTasks = tasks.filter(t => !t.completed);
      const completedTasks = tasks.filter(t => t.completed);
      
      output += `  Pending: ${pendingTasks.length}\n`;
      output += `  Completed: ${completedTasks.length}\n`;
    }
    
    return output;
  }

  /**
   * Render progress for terminal
   */
  renderProgressTerminal(props) {
    const { title, current, total, description } = props;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    let output = chalk.bold.blue(`⏳ ${title}\n`);
    if (description) {
      output += `${description}\n\n`;
    }
    
    // Create a simple progress bar
    const barLength = 30;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    output += `[${bar}] ${percentage}% (${current}/${total})\n`;
    
    return output;
  }

  /**
   * Render table for terminal
   */
  renderTableTerminal(props) {
    const { title, headers, rows } = props;
    
    let output = chalk.bold.blue(`📋 ${title}\n`);
    
    // Create header row
    output += '| ';
    for (const header of headers) {
      output += `${header.padEnd(15)} | `;
    }
    output += '\n';
    
    // Create separator
    output += '|';
    for (let i = 0; i < headers.length; i++) {
      output += ' ' + '-'.repeat(15) + ' |';
    }
    output += '\n';
    
    // Create data rows
    for (const row of rows) {
      output += '| ';
      for (const cell of row) {
        output += `${String(cell).padEnd(15)} | `;
      }
      output += '\n';
    }
    
    return output;
  }
}

/**
 * Create an instance of the MCP App Renderer
 */
export const mcpAppRenderer = new MCPAppRenderer();

// Register default components
mcpAppRenderer.registerComponent('dashboard', (props) => renderComponent('dashboard', props));
mcpAppRenderer.registerComponent('progress', (props) => renderComponent('progress', props));
mcpAppRenderer.registerComponent('form', (props) => renderComponent('form', props));
mcpAppRenderer.registerComponent('table', (props) => renderComponent('table', props));
mcpAppRenderer.registerComponent('chart', (props) => renderComponent('chart', props));
mcpAppRenderer.registerComponent('button', (props) => renderComponent('button', props));

/**
 * MCP App Integration Functions
 */

/**
 * Send app render command to MCP tools
 */
export async function sendAppRender(appData) {
  // This would send the app data to MCP-compatible tools
  // In a real implementation, this would use MCP protocol
  
  printInfo(chalk.blue('📱 Rendering MCP App...'));
  
  // Simulate sending to MCP tools
  const mcpResponse = {
    success: true,
    appId: appData.id,
    rendered: true,
    timestamp: new Date().toISOString()
  };
  
  return mcpResponse;
}

/**
 * Handle MCP app events
 */
export async function handleMCPAppEvent(event) {
  const { appId, eventType, eventData } = event;
  
  printInfo(chalk.blue(`📡 MCP App Event: ${eventType} for ${appId}`));
  
  try {
    const result = await mcpAppRenderer.handleInteraction(appId, eventType, eventData);
    
    printSuccess(chalk.green(`✅ MCP App event handled successfully`));
    return result;
  } catch (error) {
    printError(chalk.red(`❌ MCP App event failed: ${error.message}`));
    throw error;
  }
}

/**
 * Initialize MCP Apps system
 */
export async function initializeMCPApps() {
  printInfo(chalk.cyan('🚀 Initializing MCP Apps System...'));
  
  // Register default apps
  mcpAppRenderer.registerApp('project-dashboard', {
    initialState: {
      project: 'New Project',
      status: 'active',
      score: 0,
      agents: [],
      tasks: []
    },
    renderer: (state) => mcpAppRenderer.createDashboard({
      title: 'Project Dashboard',
      project: state.project,
      status: state.status,
      score: state.score,
      agents: state.agents,
      tasks: state.tasks
    }),
    handlers: {
      update: (data) => {
        return { stateUpdate: data };
      }
    }
  });
  
  printSuccess(chalk.green('✅ MCP Apps System Initialized'));
  
  return mcpAppRenderer;
}

export default {
  MCPAppRenderer,
  mcpAppRenderer,
  sendAppRender,
  handleMCPAppEvent,
  initializeMCPApps,
  renderComponent,
  validateComponentProps
};