// Copyright (c) 2026 Ultra-Dex

/**
 * MCP Apps - Interactive UI Components for AI Tools
 * Provides UI components that can be rendered in MCP-compatible tools like Cursor, Claude Desktop
 */

import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

// Supported component types
const SUPPORTED_COMPONENTS = [
  'dashboard',
  'progress',
  'form',
  'table',
  'chart',
  'button',
  'status-indicator',
  'task-list',
  'code-editor',
  'terminal',
];

// Component registry
const COMPONENT_REGISTRY = new Map();

/**
 * Dashboard Component
 * Shows project status and metrics
 */
class DashboardComponent {
  constructor(props = {}) {
    this.props = {
      title: props.title || 'Project Dashboard',
      project: props.project || 'Unknown Project',
      status: props.status || 'active',
      score: props.score || 0,
      agents: props.agents || [],
      tasks: props.tasks || [],
      metrics: props.metrics || {},
      ...props,
    };
  }

  render() {
    return {
      type: 'dashboard',
      props: this.props,
      html: this.renderHTML(),
      interactive: true,
    };
  }

  renderHTML() {
    const { project, status, score, agents, tasks, metrics } = this.props;

    let html = `<div class="dashboard">
      <h2>${this.props.title}</h2>
      <div class="project-info">
        <h3>${project}</h3>
        <div class="status ${status}">${status.toUpperCase()}</div>
        <div class="score">Alignment: ${score}%</div>
      </div>`;

    if (agents.length > 0) {
      html += `<div class="agents">
        <h4>Active Agents (${agents.length})</h4>
        <ul>${agents.map((agent) => `<li>${agent.name} - ${agent.status}</li>`).join('')}</ul>
      </div>`;
    }

    if (tasks.length > 0) {
      html += `<div class="tasks">
        <h4>Tasks (${tasks.filter((t) => !t.completed).length}/${tasks.length})</h4>
        <ul>${tasks
          .map(
            (task) =>
              `<li class="${task.completed ? 'completed' : 'pending'}">
            ${task.completed ? '✅' : '⏳'} ${task.name}
          </li>`
          )
          .join('')}</ul>
      </div>`;
    }

    html += '</div>';

    return html;
  }
}

/**
 * Progress Component
 * Shows task progress and completion
 */
class ProgressComponent {
  constructor(props = {}) {
    this.props = {
      title: props.title || 'Task Progress',
      current: props.current || 0,
      total: props.total || 100,
      status: props.status || 'in-progress',
      description: props.description || '',
      ...props,
    };
  }

  render() {
    const percentage = Math.round((this.props.current / this.props.total) * 100);

    return {
      type: 'progress',
      props: this.props,
      html: this.renderHTML(),
      interactive: false,
      data: {
        percentage,
        current: this.props.current,
        total: this.props.total,
      },
    };
  }

  renderHTML() {
    const { title, description, current, total } = this.props;
    const percentage = Math.round((current / total) * 100);

    return `<div class="progress-component">
      <h3>${title}</h3>
      ${description ? `<p>${description}</p>` : ''}
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-text">${current}/${total} (${percentage}%)</div>
    </div>`;
  }
}

/**
 * Form Component
 * Interactive form for user input
 */
class FormComponent {
  constructor(props = {}) {
    this.props = {
      title: props.title || 'Form',
      fields: props.fields || [],
      onSubmit: props.onSubmit || (() => {}),
      ...props,
    };
  }

  render() {
    return {
      type: 'form',
      props: this.props,
      html: this.renderHTML(),
      interactive: true,
      handlers: {
        submit: this.props.onSubmit,
      },
    };
  }

  renderHTML() {
    const { title, fields } = this.props;

    let html = `<div class="form-component">
      <h3>${title}</h3>
      <form class="mcp-form">`;

    for (const field of fields) {
      html += `<div class="form-field">
        <label>${field.label}</label>
        <input 
          type="${field.type || 'text'}" 
          name="${field.name}"
          placeholder="${field.placeholder || ''}"
          ${field.required ? 'required' : ''}
        >
      </div>`;
    }

    html += `<button type="submit">Submit</button>
      </form>
    </div>`;

    return html;
  }
}

/**
 * Table Component
 * Displays tabular data
 */
class TableComponent {
  constructor(props = {}) {
    this.props = {
      title: props.title || 'Data Table',
      headers: props.headers || [],
      rows: props.rows || [],
      ...props,
    };
  }

  render() {
    return {
      type: 'table',
      props: this.props,
      html: this.renderHTML(),
      interactive: false,
    };
  }

  renderHTML() {
    const { title, headers, rows } = this.props;

    let html = `<div class="table-component">
      <h3>${title}</h3>
      <table class="mcp-table">
        <thead><tr>`;

    for (const header of headers) {
      html += `<th>${header}</th>`;
    }

    html += `</tr></thead><tbody>`;

    for (const row of rows) {
      html += '<tr>';
      for (const cell of row) {
        html += `<td>${cell}</td>`;
      }
      html += '</tr>';
    }

    html += `</tbody></table></div>`;

    return html;
  }
}

/**
 * Chart Component
 * Visualizes data as charts
 */
class ChartComponent {
  constructor(props = {}) {
    this.props = {
      title: props.title || 'Chart',
      type: props.type || 'bar', // bar, line, pie
      data: props.data || [],
      labels: props.labels || [],
      ...props,
    };
  }

  render() {
    return {
      type: 'chart',
      props: this.props,
      html: this.renderHTML(),
      interactive: false,
      data: this.props.data,
    };
  }

  renderHTML() {
    const { title, type, data, labels } = this.props;

    // For now, return a simple representation - in a real implementation
    // this would render actual chart elements
    return `<div class="chart-component">
      <h3>${title}</h3>
      <div class="chart-placeholder">
        <p>Chart Type: ${type}</p>
        <p>Data Points: ${data.length}</p>
      </div>
    </div>`;
  }
}

/**
 * Button Component
 * Interactive button for triggering actions
 */
class ButtonComponent {
  constructor(props = {}) {
    this.props = {
      label: props.label || 'Button',
      onClick: props.onClick || (() => {}),
      variant: props.variant || 'primary',
      disabled: props.disabled || false,
      ...props,
    };
  }

  render() {
    return {
      type: 'button',
      props: this.props,
      html: this.renderHTML(),
      interactive: true,
      handlers: {
        click: this.props.onClick,
      },
    };
  }

  renderHTML() {
    const { label, variant, disabled } = this.props;

    return `<button 
      class="mcp-button ${variant} ${disabled ? 'disabled' : ''}"
      ${disabled ? 'disabled' : ''}
    >
      ${label}
    </button>`;
  }
}

// Register components
COMPONENT_REGISTRY.set('dashboard', DashboardComponent);
COMPONENT_REGISTRY.set('progress', ProgressComponent);
COMPONENT_REGISTRY.set('form', FormComponent);
COMPONENT_REGISTRY.set('table', TableComponent);
COMPONENT_REGISTRY.set('chart', ChartComponent);
COMPONENT_REGISTRY.set('button', ButtonComponent);

/**
 * Render a component by type
 */
export function renderComponent(type, props) {
  if (!SUPPORTED_COMPONENTS.includes(type)) {
    throw new AppError(`Unsupported component type: ${type}`, { code: 'UNSUPPORTED_COMPONENT' });
  }

  const ComponentClass = COMPONENT_REGISTRY.get(type);
  if (!ComponentClass) {
    throw new AppError(`Component not registered: ${type}`, { code: 'COMPONENT_NOT_REGISTERED' });
  }

  const component = new ComponentClass(props);
  return component.render();
}

/**
 * Register a custom component
 */
export function registerComponent(name, ComponentClass) {
  if (SUPPORTED_COMPONENTS.includes(name)) {
    throw new AppError(`Component name already reserved: ${name}`, {
      code: 'COMPONENT_NAME_RESERVED',
    });
  }

  COMPONENT_REGISTRY.set(name, ComponentClass);
  SUPPORTED_COMPONENTS.push(name);
}

/**
 * Get list of supported components
 */
export function getSupportedComponents() {
  return [...SUPPORTED_COMPONENTS];
}

/**
 * Validate component props
 */
export function validateComponentProps(type, props) {
  const validations = {
    dashboard: {
      title: 'string',
      project: 'string',
      score: 'number',
      agents: 'array',
      tasks: 'array',
    },
    progress: {
      title: 'string',
      current: 'number',
      total: 'number',
      status: 'string',
    },
    form: {
      title: 'string',
      fields: 'array',
    },
    table: {
      headers: 'array',
      rows: 'array',
    },
    chart: {
      type: 'string',
      data: 'array',
      labels: 'array',
    },
    button: {
      label: 'string',
      variant: 'string',
    },
  };

  const requiredValidations = validations[type];
  if (!requiredValidations) {
    return { valid: true, errors: [] };
  }

  const errors = [];
  for (const [propName, expectedType] of Object.entries(requiredValidations)) {
    if (props[propName] !== undefined) {
      const actualType = Array.isArray(props[propName]) ? 'array' : typeof props[propName];
      if (actualType !== expectedType) {
        errors.push(`Property ${propName} should be of type ${expectedType}, got ${actualType}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * MCP App Renderer
 * Handles rendering of apps in MCP-compatible tools
 */
export class MCPAppRenderer {
  constructor() {
    this.apps = new Map();
    this.appStates = new Map();
  }

  /**
   * Register an app
   */
  registerApp(id, appDefinition) {
    this.apps.set(id, appDefinition);
    this.appStates.set(id, { ...appDefinition.initialState });
  }

  /**
   * Render an app
   */
  renderApp(appId, params = {}) {
    const app = this.apps.get(appId);
    if (!app) {
      throw new AppError(`App not found: ${appId}`, { code: 'APP_NOT_FOUND' });
    }

    // Update app state if needed
    if (params.stateUpdate) {
      const currentState = this.appStates.get(appId);
      this.appStates.set(appId, { ...currentState, ...params.stateUpdate });
    }

    const state = this.appStates.get(appId);
    return app.renderer(state, params);
  }

  /**
   * Handle app interaction
   */
  async handleInteraction(appId, interactionType, data) {
    const app = this.apps.get(appId);
    if (!app || !app.handlers || !app.handlers[interactionType]) {
      throw new AppError(`No handler for ${interactionType} in app ${appId}`, {
        code: 'NO_HANDLER',
      });
    }

    return await app.handlers[interactionType](data);
  }

  /**
   * Get all registered apps
   */
  getApps() {
    return Array.from(this.apps.keys());
  }
}

// Singleton renderer instance
export const mcpAppRenderer = new MCPAppRenderer();

export default {
  renderComponent,
  registerComponent,
  getSupportedComponents,
  validateComponentProps,
  MCPAppRenderer,
  mcpAppRenderer,
};
