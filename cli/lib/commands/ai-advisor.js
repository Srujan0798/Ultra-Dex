import chalk from 'chalk';
import inquirer from 'inquirer';
import { MODEL_COSTS } from '../advisor/model-costs.js';
import { printInfo, printSuccess } from '../utils/output.js';

export function registerAiAdvisorCommand(program) {
  program
    .command('ai-advisor')
    .description('Interactive AI model advisor')
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'budget',
          message: 'What is your budget preference?',
          choices: ['highest quality', 'balanced', 'budget']
        }
      ]);

      let recommendation = MODEL_COSTS[0];
      if (answers.budget === 'balanced') recommendation = MODEL_COSTS[1];
      if (answers.budget === 'budget') recommendation = MODEL_COSTS[3];

      printSuccess(chalk.green(`\n✅ Recommendation: ${recommendation.name}`));
      printInfo(chalk.gray(`Best for: ${recommendation.bestFor}`));
      printInfo(chalk.cyan('\nCost comparison:'));
      MODEL_COSTS.forEach((model) => {
        printInfo(`- ${model.name}: $${model.input}/MTok in, $${model.output}/MTok out (${model.bestFor})`);
      });
    });
}
