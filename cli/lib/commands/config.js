import chalk from 'chalk';

export function configCommand(options) {
  if (options.mcp) {
    console.log(chalk.bold('\n🤖 Claude Desktop Configuration\n'));
    console.log(chalk.gray('Add this to your claude_desktop_config.json:\n'));

    const config = {
      mcpServers: {
        "ultra-dex": {
          command: "npx",
          args: [
            "ultra-dex",
            "serve",
            "--stdio"
          ]
        }
      }
    };

    console.log(JSON.stringify(config, null, 2));
    
    console.log(chalk.yellow('\n\nNote: You may need to use the absolute path to your project if running npx globally.'));
    console.log(chalk.gray(`Project Path: ${process.cwd()}`));
  } else {
    console.log(chalk.red('Please specify a configuration type (e.g., --mcp)'));
  }
}