import chalk from 'chalk';
import boxen from 'boxen';

export function registerHelpCommand(program) {
  program
    .command('help')
    .description('Show themed help overview')
    .action(() => {
      const content = [
        chalk.bold('⚡ ASSEMBLE THE CODE'),
        `  ${chalk.cyan('init')}       Initialize a new project`,
        `  ${chalk.cyan('generate')}   Generate plans and code`,
        `  ${chalk.cyan('scaffold')}   Create template-based scaffolds`,
        '',
        chalk.bold('🛡️ DEFEND THE REALM'),
        `  ${chalk.cyan('review')}     Review code vs plan`,
        `  ${chalk.cyan('check')}      Plan completeness check`,
        `  ${chalk.cyan('verify')}     21-step verification`,
        '',
        chalk.bold('💎 HARNESS INFINITY'),
        `  ${chalk.cyan('serve')}      Start MCP server`,
        `  ${chalk.cyan('deploy')}     Deploy via provider wrappers`,
        `  ${chalk.cyan('monitor')}    Monitoring stack`,
        '',
        chalk.gray('Tip: use --help for full command list')
      ].join('\n');

      console.log(
        boxen(content, {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'magenta'
        })
      );
    });
}

export default {
  registerHelpCommand
};
