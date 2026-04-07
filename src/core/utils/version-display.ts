import boxen from "boxen";
import gradient from "gradient-string";
import chalk from "chalk";
import { VERSION } from './version.js';
import { logger } from './logging.js';
function showVersionCard() {
  const ultraGradient = gradient(["#6366f1", "#8b5cf6", "#d946ef"]);
  const content = [
    ultraGradient.bold("ULTRA-DEX AI"),
    chalk.gray(`The Headless CTO Meta-Layer`),
    "",
    `${chalk.white("Version:")} ${chalk.cyan(VERSION)}`,
    `${chalk.white("Status:")} ${chalk.green("Stable/Production")}`,
    "",
    chalk.dim("Checking for intergalactic updates...")
  ].join("\n");
  const card = boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "#8b5cf6",
    title: "System Info",
    titleAlignment: "center"
  });
  logger.log(card);
}
var version_display_default = showVersionCard;
function _handleModuleError(error, context = "version-display") {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
  }
}
export {
  version_display_default as default,
  showVersionCard
};
