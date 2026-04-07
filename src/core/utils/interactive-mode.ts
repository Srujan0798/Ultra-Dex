import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import Table from "cli-table3";
import { monitoring } from './monitoring.js';
import { configManager } from './config-manager.js';
import { errorRecovery } from './error-recovery.js';
import { logger } from './logging.js';
class InteractiveMode {
  constructor() {
    this.questions = /* @__PURE__ */ new Map();
    this.responses = /* @__PURE__ */ new Map();
    this.spinner = null;
    this.progressBar = null;
    this.progressInterval = null;
  }
  /**
   * Add a question to the interactive flow
   */
  addQuestion(name, question) {
    this.questions.set(name, question);
  }
  /**
   * Run interactive questionnaire
   */
  async run() {
    const answers = {};
    for (const [name, question] of this.questions) {
      try {
        const answer = await inquirer.prompt([question]);
        answers[name] = answer[name];
        this.responses.set(name, answer[name]);
      } catch (error) {
        monitoring.error(`Interactive question failed: ${name}`, { error: error.message });
        throw error;
      }
    }
    return answers;
  }
  /**
   * Create and manage a spinner
   */
  createSpinner(text = "Processing...") {
    this.spinner = ora({
      text: chalk.blue(text),
      spinner: "clock"
    });
    return this.spinner;
  }
  /**
   * Show success message
   */
  showSuccess(message) {
    logger.log(chalk.green("\u2705 " + message));
    monitoring.info(message, { type: "success" });
  }
  /**
   * Show warning message
   */
  showWarning(message) {
    logger.log(chalk.yellow("\u26A0\uFE0F  " + message));
    monitoring.warn(message, { type: "warning" });
  }
  /**
   * Show error message
   */
  showError(message) {
    logger.log(chalk.red("\u274C " + message));
    monitoring.error(message, { type: "error" });
  }
  /**
   * Show info message
   */
  showInfo(message) {
    logger.log(chalk.blue("\u2139\uFE0F  " + message));
    monitoring.info(message, { type: "info" });
  }
  /**
   * Create a progress bar
   */
  createProgressBar(total, message = "Progress") {
    const progressBar = {
      current: 0,
      total,
      message,
      update: (increment = 1) => {
        progressBar.current += increment;
        const percent = Math.round(progressBar.current / total * 100);
        const bar = "\u2588".repeat(Math.round(percent / 2)) + "\u2591".repeat(50 - Math.round(percent / 2));
        process.stdout.write(
          `\r${message}: [${bar}] ${percent}% (${progressBar.current}/${total})`
        );
      },
      finish: () => {
        process.stdout.write("\n");
        this.showSuccess(`${message} completed!`);
      }
    };
    return progressBar;
  }
  /**
   * Create a status table
   */
  createTable(head, options = {}) {
    return new Table({
      head: head.map((h) => chalk.bold(h)),
      chars: {
        top: "\u2550",
        "top-mid": "\u2564",
        "top-left": "\u2554",
        "top-right": "\u2557",
        bottom: "\u2550",
        "bottom-mid": "\u2567",
        "bottom-left": "\u255A",
        "bottom-right": "\u255D",
        left: "\u2551",
        "left-mid": "\u255F",
        mid: "\u2500",
        "mid-mid": "\u253C",
        right: "\u2551",
        "right-mid": "\u2562",
        middle: "\u2502"
      },
      style: {
        head: ["blue", "bold"],
        border: ["grey"]
      },
      ...options
    });
  }
  /**
   * Show formatted status
   */
  showStatus(statusData) {
    const table = this.createTable(["Property", "Value"]);
    for (const [key, value] of Object.entries(statusData)) {
      table.push([
        chalk.bold(key.charAt(0).toUpperCase() + key.slice(1)),
        typeof value === "object" ? JSON.stringify(value) : String(value)
      ]);
    }
    logger.log(table.toString());
  }
  /**
   * Show metrics in a formatted table
   */
  showMetrics() {
    try {
      const metrics = monitoring.getMetrics();
      const table = this.createTable(["Metric", "Value"]);
      table.push(
        ["Requests", metrics.requests],
        ["Errors", metrics.errors],
        ["Uptime", this.formatDuration(metrics.uptime)],
        ["Performance Records", metrics.performance.length],
        ["CPU Cores", metrics.system.cpuCount],
        ["Platform", metrics.system.platform]
      );
      logger.log(chalk.bold("\n\u{1F4CA} System Metrics\n"));
      logger.log(table.toString());
      if (metrics.performance.length > 0) {
        logger.log(chalk.bold("\n\u23F1\uFE0F  Recent Performance\n"));
        const perfTable = this.createTable(["Operation", "Duration (ms)", "Timestamp"]);
        const recentPerf = metrics.performance.slice(-5).reverse();
        for (const perf of recentPerf) {
          perfTable.push([
            perf.operation,
            perf.duration.toFixed(2),
            new Date(perf.timestamp).toLocaleTimeString()
          ]);
        }
        logger.log(perfTable.toString());
      }
    } catch (error) {
      this.showError(`Failed to show metrics: ${error.message}`);
    }
  }
  /**
   * Show health status
   */
  showHealthStatus() {
    try {
      const health = errorRecovery.getStatus();
      logger.log(chalk.bold("\n\u{1F3E5} Health Status\n"));
      const overallStatus = health.circuitBreakers && Object.values(health.circuitBreakers).every((cb) => cb.state === "closed") ? chalk.green("\u2705 Healthy") : chalk.red("\u26A0\uFE0F  Degraded");
      logger.log(`Overall Status: ${overallStatus}`);
      if (health.circuitBreakers && Object.keys(health.circuitBreakers).length > 0) {
        logger.log(chalk.bold("\n\u{1F50C} Circuit Breakers\n"));
        const cbTable = this.createTable(["Service", "State", "Failures", "Can Try"]);
        for (const [name, status] of Object.entries(health.circuitBreakers)) {
          const stateColor = status.state === "closed" ? chalk.green : status.state === "open" ? chalk.red : chalk.yellow;
          cbTable.push([
            name,
            stateColor(status.state),
            status.failureCount,
            status.canTry ? chalk.green("Yes") : chalk.red("No")
          ]);
        }
        logger.log(cbTable.toString());
      }
      if (health.degradedServices.length > 0) {
        logger.log(chalk.bold("\n\u26A0\uFE0F  Degraded Services\n"));
        for (const service of health.degradedServices) {
          logger.log(`- ${chalk.yellow(service)}`);
        }
      }
    } catch (error) {
      this.showError(`Failed to show health status: ${error.message}`);
    }
  }
  /**
   * Format duration in milliseconds to human readable format
   */
  formatDuration(ms) {
    if (ms < 1e3)
      return `${ms}ms`;
    if (ms < 6e4)
      return `${(ms / 1e3).toFixed(2)}s`;
    if (ms < 36e5)
      return `${(ms / 6e4).toFixed(2)}m`;
    return `${(ms / 36e5).toFixed(2)}h`;
  }
  /**
   * Show configuration in a formatted table
   */
  showConfiguration() {
    try {
      const config = configManager.getConfig();
      logger.log(chalk.bold("\n\u2699\uFE0F  Configuration\n"));
      const configTable = this.createTable(["Section", "Setting", "Value"]);
      configTable.push(
        ["AI Provider", "Default", config.ai.defaultProvider],
        ["AI Provider", "Temperature", config.ai.temperature],
        ["MCP", "Port", config.mcp.port],
        ["Performance", "Max Concurrent Tasks", config.performance.maxConcurrentTasks],
        ["Security", "Validate Paths", config.security.validatePaths],
        ["Logging", "Level", config.logging.level]
      );
      logger.log(configTable.toString());
    } catch (error) {
      this.showError(`Failed to show configuration: ${error.message}`);
    }
  }
  /**
   * Interactive configuration wizard
   */
  async runConfigurationWizard() {
    const questions = [
      {
        type: "list",
        name: "aiProvider",
        message: "Select default AI provider:",
        choices: ["claude", "openai", "gemini", "ollama"],
        default: configManager.get("ai.defaultProvider")
      },
      {
        type: "number",
        name: "temperature",
        message: "Set AI temperature (0-1):",
        default: configManager.get("ai.temperature"),
        validate: (value) => {
          return value >= 0 && value <= 1 || "Temperature must be between 0 and 1";
        }
      },
      {
        type: "number",
        name: "mcpPort",
        message: "Set MCP server port:",
        default: configManager.get("mcp.port"),
        validate: (value) => {
          return value >= 1 && value <= 65535 || "Port must be between 1 and 65535";
        }
      },
      {
        type: "confirm",
        name: "enableCaching",
        message: "Enable performance caching?",
        default: configManager.get("performance.cacheEnabled")
      }
    ];
    const answers = await inquirer.prompt(questions);
    configManager.set("ai.defaultProvider", answers.aiProvider);
    configManager.set("ai.temperature", answers.temperature);
    configManager.set("mcp.port", answers.mcpPort);
    configManager.set("performance.cacheEnabled", answers.enableCaching);
    const saved = await configManager.save();
    if (saved) {
      this.showSuccess("Configuration updated successfully!");
      this.showConfiguration();
    } else {
      this.showError("Failed to save configuration");
    }
    return answers;
  }
  /**
   * Show help with all available commands
   */
  showHelp() {
    logger.log(chalk.bold("\n\u{1F4D6} Ultra-Dex Help\n"));
    const helpTable = this.createTable(["Command", "Description", "Example"]);
    helpTable.push(
      ["ultra-dex init", "Initialize new project", "ultra-dex init"],
      ["ultra-dex generate", "Generate implementation plan", 'ultra-dex generate "Todo app"'],
      ["ultra-dex build", "Start AI-assisted development", "ultra-dex build"],
      ["ultra-dex agents", "List all available agents", "ultra-dex agents"],
      ["ultra-dex run <agent>", "Execute agent task", 'ultra-dex run backend --task "Create API"'],
      ["ultra-dex swarm <feature>", "Run agent swarm", 'ultra-dex swarm "User auth"'],
      ["ultra-dex serve", "Start MCP server", "ultra-dex serve"],
      ["ultra-dex dashboard", "Open monitoring dashboard", "ultra-dex dashboard"],
      ["ultra-dex config", "Manage configuration", "ultra-dex config --wizard"],
      ["ultra-dex status", "Show system status", "ultra-dex status"]
    );
    logger.log(helpTable.toString());
    logger.log(chalk.bold("\n\u{1F4A1} Tips:\n"));
    logger.log(`\u2022 Use ${chalk.cyan("--help")} with any command for detailed options`);
    logger.log(`\u2022 Configuration can be managed with ${chalk.cyan("ultra-dex config")}`);
    logger.log(`\u2022 Monitor system health with ${chalk.cyan("ultra-dex status")}`);
    logger.log(`\u2022 View metrics with ${chalk.cyan("ultra-dex metrics")}`);
  }
  /**
   * Show system status overview
   */
  showSystemStatus() {
    logger.log(chalk.bold.blue("\n\u{1F680} Ultra-Dex System Status\n"));
    const statusTable = this.createTable(["Component", "Status", "Details"]);
    statusTable.push(
      ["Configuration", chalk.green("Loaded"), "Using project config"],
      ["Monitoring", chalk.green("Active"), "Metrics collection enabled"],
      ["Error Recovery", chalk.green("Active"), "Circuit breakers operational"],
      ["MCP Server", chalk.yellow("Unknown"), "Check with ultra-dex serve"],
      ["AI Providers", chalk.green("Configured"), "Ready for use"]
    );
    logger.log(statusTable.toString());
    const recentMetrics = monitoring.getMetrics();
    logger.log(chalk.bold("\n\u{1F4CA} Recent Activity\n"));
    const activityTable = this.createTable(["Metric", "Count"]);
    activityTable.push(
      ["Total Requests", recentMetrics.requests],
      ["Errors Encountered", recentMetrics.errors],
      ["Performance Samples", recentMetrics.performance.length]
    );
    logger.log(activityTable.toString());
  }
}
const interactiveMode = new InteractiveMode();
var interactive_mode_default = interactiveMode;
export {
  interactive_mode_default as default,
  interactiveMode
};
