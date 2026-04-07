import Table from "cli-table3";
import chalk from "chalk";
import gradient from "gradient-string";
import { logger } from './logging.js';
const TABLE_STYLES = {
  DEFAULT: {
    head: ["magenta"],
    border: ["dim"]
  },
  HIGHLIGHT: {
    head: ["bold", "bgMagenta", "white"],
    border: ["dim"],
    "padding-left": 1,
    "padding-right": 1
  },
  MINIMAL: {
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: " ",
      "left-mid": " ",
      mid: "",
      "mid-mid": "",
      right: " ",
      "right-mid": " ",
      middle: " "
    },
    style: {
      head: ["bold", "cyan"],
      border: ["dim"]
    }
  },
  BORDERED: {
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
      head: ["bold", "bgBlue", "white"],
      border: ["dim"]
    }
  }
};
function createTable(headers, rows, style = "DEFAULT") {
  const styleOptions = TABLE_STYLES[style] || TABLE_STYLES.DEFAULT;
  const table = new Table({
    head: headers.map((h) => gradient(["#6366f1", "#8b5cf6"])(h)),
    ...styleOptions.chars ? { chars: styleOptions.chars } : {},
    style: styleOptions
  });
  rows.forEach((row) => {
    const styledRow = row.map((cell) => {
      if (typeof cell === "string") {
        if (cell.match(/^(?:success|ready|active|online|✓|✔|●)$/i)) {
          return chalk.greenBright(cell);
        } else if (cell.match(/^(?:error|failed|inactive|offline|✗|✘|○)$/i)) {
          return chalk.redBright(cell);
        } else if (cell.match(/^\d+$/)) {
          return chalk.yellowBright(cell);
        } else if (cell.startsWith("https://") || cell.startsWith("http://")) {
          return chalk.blue.underline(cell);
        }
      }
      return cell;
    });
    table.push(styledRow);
  });
  return table.toString();
}
function createStyledTable(headers, rows, options = {}) {
  const { style = "DEFAULT", colWidths = null, wordWrap = true, truncate = false } = options;
  const styleOptions = TABLE_STYLES[style] || TABLE_STYLES.DEFAULT;
  const tableOptions = {
    head: headers.map((h) => gradient(["#6366f1", "#8b5cf6"])(h)),
    ...colWidths ? { colWidths } : {},
    ...wordWrap ? {} : { wordWrap: false },
    ...truncate ? { truncate } : {},
    ...styleOptions.chars ? { chars: styleOptions.chars } : {},
    style: styleOptions
  };
  const table = new Table(tableOptions);
  rows.forEach((row) => {
    const styledRow = row.map((cell) => {
      if (typeof cell === "string") {
        if (cell.match(/^(?:success|ready|active|online|✓|✔|●)$/i)) {
          return chalk.greenBright(cell);
        } else if (cell.match(/^(?:error|failed|inactive|offline|✗|✘|○)$/i)) {
          return chalk.redBright(cell);
        } else if (cell.match(/^\d+$/)) {
          return chalk.yellowBright(cell);
        } else if (cell.startsWith("https://") || cell.startsWith("http://")) {
          return chalk.blue.underline(cell);
        }
      }
      return cell;
    });
    table.push(styledRow);
  });
  return table.toString();
}
function showAgentsTable(agents) {
  const headers = ["Tier", "Agent", "Status", "Capabilities"];
  const rows = agents.map((a) => [
    chalk.dim(a.tier || "N/A"),
    chalk.cyan.bold(a.name),
    a.status === "ready" ? chalk.greenBright("\u25CF READY") : chalk.yellowBright("\u25CB PENDING"),
    chalk.gray(Array.isArray(a.capabilities) ? a.capabilities.slice(0, 2).join(", ") : "N/A")
  ]);
  logger.log(createStyledTable(headers, rows, { style: "HIGHLIGHT" }));
}
function showCommandsTable(commands) {
  const headers = ["Command", "Description", "Category"];
  const rows = commands.map((c) => [
    chalk.cyan.bold(c.name),
    chalk.dim(c.description),
    chalk.magenta(c.category || "General")
  ]);
  logger.log(createStyledTable(headers, rows, { style: "MINIMAL" }));
}
function showStatusTable(statusData) {
  const headers = ["Component", "Status", "Details"];
  const rows = Object.entries(statusData).map(([component, data]) => [
    chalk.bold(component),
    data.status === "healthy" ? chalk.greenBright("\u25CF HEALTHY") : chalk.redBright("\u25A0 ERROR"),
    chalk.dim(data.details || "N/A")
  ]);
  logger.log(createStyledTable(headers, rows, { style: "BORDERED" }));
}
function showDataTable(data, title = "Data Table") {
  if (!data || data.length === 0) {
    logger.log(chalk.yellow("No data to display"));
    return;
  }
  const headers = Object.keys(data[0]).map(
    (header) => gradient(["#ec4899", "#8b5cf6"])(header.toUpperCase())
  );
  const rows = data.map((item) => Object.values(item).map((value) => String(value)));
  logger.log(chalk.bold.magenta(`
\u{1F4CA} ${title}
`));
  logger.log(
    createStyledTable(headers, rows, {
      style: "BORDERED",
      colWidths: headers.map(() => 20)
      // Adjust column widths as needed
    })
  );
}
function _handleModuleError(error, context = "tables") {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
  }
}
export {
  createStyledTable,
  createTable,
  showAgentsTable,
  showCommandsTable,
  showDataTable,
  showStatusTable
};
