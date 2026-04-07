import fs from "fs";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import { getPrivacyConfig, sanitizePayload, encryptData } from './privacy.js';
const TELEMETRY_DIR = path.join(os.homedir(), ".ultra-dex");
const CONFIG_PATH = path.join(TELEMETRY_DIR, "telemetry.json");
const LOG_PATH = path.join(TELEMETRY_DIR, "telemetry.jsonl");
function parseEnvOverride() {
  const raw = process.env.ULTRA_DEX_TELEMETRY;
  if (!raw)
    return null;
  const normalized = String(raw).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized))
    return true;
  if (["0", "false", "no", "off"].includes(normalized))
    return false;
  return null;
}
function loadTelemetryConfigSync() {
  try {
    if (!fs.existsSync(CONFIG_PATH))
      return null;
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function loadTelemetryConfig() {
  try {
    const raw = await fsPromises.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function isTelemetryEnabledSync() {
  const override = parseEnvOverride();
  if (override !== null)
    return override;
  const config = loadTelemetryConfigSync();
  return config?.enabled === true;
}
async function ensureTelemetryConsent({ prompt = true, source = "init" } = {}) {
  const override = parseEnvOverride();
  if (override !== null) {
    await saveTelemetryConfig({ enabled: override, source, overriddenByEnv: true });
    return override;
  }
  const existing = await loadTelemetryConfig();
  if (existing)
    return existing.enabled === true;
  if (!prompt || !process.stdout.isTTY) {
    await saveTelemetryConfig({ enabled: false, source, auto: true });
    return false;
  }
  const { default: inquirer } = await import("inquirer");
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "enabled",
      message: "Help improve Ultra-Dex by sharing anonymous CLI usage? (local only)",
      default: false
    }
  ]);
  await saveTelemetryConfig({ enabled: answers.enabled, source, auto: false });
  return answers.enabled;
}
async function saveTelemetryConfig(config) {
  await fsPromises.mkdir(TELEMETRY_DIR, { recursive: true });
  const payload = {
    enabled: !!config.enabled,
    source: config.source || "unknown",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ...config
  };
  await fsPromises.writeFile(CONFIG_PATH, JSON.stringify(payload, null, 2));
}
function recordTelemetryEventSync(event = {}) {
  if (!isTelemetryEnabledSync())
    return false;
  try {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
    const payload = sanitizePayload({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...event
    });
    const config = getPrivacyConfig();
    const encoded = config.encryption ? encryptData(JSON.stringify(payload)) : JSON.stringify(payload);
    fs.appendFileSync(LOG_PATH, encoded + "\n", "utf8");
    return true;
  } catch {
    return false;
  }
}
async function recordTelemetryEvent(event = {}) {
  if (!isTelemetryEnabledSync())
    return false;
  try {
    await fsPromises.mkdir(TELEMETRY_DIR, { recursive: true });
    const payload = sanitizePayload({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...event
    });
    const config = getPrivacyConfig();
    const encoded = config.encryption ? encryptData(JSON.stringify(payload)) : JSON.stringify(payload);
    await fsPromises.appendFile(LOG_PATH, encoded + "\n", "utf8");
    return true;
  } catch {
    return false;
  }
}
const telemetryLogPath = LOG_PATH;
const telemetryConfigPath = CONFIG_PATH;
export {
  ensureTelemetryConsent,
  isTelemetryEnabledSync,
  loadTelemetryConfig,
  loadTelemetryConfigSync,
  recordTelemetryEvent,
  recordTelemetryEventSync,
  saveTelemetryConfig,
  telemetryConfigPath,
  telemetryLogPath
};
