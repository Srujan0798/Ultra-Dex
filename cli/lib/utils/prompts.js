import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';

export async function selectAgent() {
  const agents = [
    { name: '🏛️  CTO - Architecture decisions', value: 'cto' },
    { name: '📋  Planner - Task breakdown', value: 'planner' },
    { name: '🔧  Backend - API & server', value: 'backend' },
    { name: '🎨  Frontend - UI components', value: 'frontend' },
    { name: '💾  Database - Schema & queries', value: 'database' },
    { name: '🔐  Auth - Authentication', value: 'auth' },
    { name: '🛡️  Security - Security review', value: 'security' },
    { name: '📝  Testing - Write tests', value: 'testing' },
    { name: '📖  Docs - Documentation', value: 'documentation' },
    { name: '👀  Reviewer - Code review', value: 'reviewer' }
  ];
  const { agent } = await inquirer.prompt([{
    type: 'list',
    name: 'agent',
    message: gradient(['#6366f1', '#8b5cf6'])('Select an agent:'),
    choices: agents,
    pageSize: 12
  }]);
  
  return agent;
}

export async function confirmAction(message) {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: chalk.yellow(message),
    default: false
  }]);
  return confirm;
}

export async function inputText(message, defaultValue = '') {
  const { value } = await inquirer.prompt([{
    type: 'input',
    name: 'value',
    message: chalk.cyan(message),
    default: defaultValue
  }]);
  return value;
}
