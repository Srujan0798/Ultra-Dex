import chalk from 'chalk';
import { buildPlan } from '../planning/neuro-symbolic.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

export function registerNeuroPlanCommand(program) {
  program
    .command('neuro-plan <goal>')
    .description('Generate a neuro-symbolic plan with rules validation')
    .action(async (goal) => {
      const result = await buildPlan(goal);
      printInfo(chalk.cyan('\nNeuro-Symbolic Plan\n'));
      printInfo(result.planText);
      if (!result.approved) {
        printWarning(chalk.yellow('\nRule violations detected:'));
        result.violations.forEach(v => printWarning(`- ${v.id || v.if}`));
      } else {
        printSuccess(chalk.green('\n✅ Plan approved by rules engine.'));
      }
    });
}

