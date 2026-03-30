/**
 * ultra-dex onboard command
 * Interactive onboarding system for new users
 */

import chalk from 'chalk';

export function registerOnboardCommand(program) {
  program
    .command('onboard')
    .description('Interactive onboarding system for new users')
    .option('--reconfigure', 'Reconfigure existing setup')
    .option('--skip-profile', 'Skip profile setup')
    .option('--quick', 'Quick setup with defaults')
    .action(async (options) => {
      try {
        // Import and run the onboarding system
        const { default: OnboardingSystem } = await import('../onboarding/system.js');
        const onboarding = new OnboardingSystem();
        await onboarding.start();
      } catch (error) {
        logger.error(chalk.red('❌ Onboarding failed:'), error.message);
        process.exit(1);
      }
    });
}

// Also export the onboarding system for direct use
export { default as OnboardingSystem } from '../onboarding/system.js';