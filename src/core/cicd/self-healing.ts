var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { runRalphLoop } from '../agents/ralph-loop.js';
import { execSync } from "child_process";
import chalk from "chalk";
let SelfHealingCI = class {
  async monitorAndFix() {
    try {
      console.log(chalk.blue("\u{1F50D} Monitoring CI Pipeline..."));
      execSync("npm test", { stdio: "inherit" });
      console.log(chalk.green("\u2705 CI Pipeline Healthy"));
    } catch (error) {
      console.log(chalk.red("\u274C Test Failure Detected! Initiating Self-Healing..."));
      await this.heal(error.message);
    }
  }
  async heal(failureLog) {
    const healPlan = async (ctx) => {
      ctx.log = failureLog;
      ctx.objective = "Fix failing tests and ensure Protocol 21 compliance";
      return ctx;
    };
    const healAct = async (ctx) => {
      console.log(chalk.yellow("\u{1F6E0}\uFE0F  Agent fixing code based on failure log..."));
      return ctx;
    };
    const healVerify = async (ctx) => {
      try {
        execSync("npm test", { stdio: "ignore" });
        return { ok: true };
      } catch {
        return { ok: false, error: "Tests still failing" };
      }
    };
    return await runRalphLoop({
      plan: healPlan,
      act: healAct,
      verify: healVerify,
      maxRetries: 5
    });
  }
};
SelfHealingCI = __decorateClass([
  singleton()
], SelfHealingCI);
const ciHealer = new SelfHealingCI();
export {
  SelfHealingCI,
  ciHealer
};
