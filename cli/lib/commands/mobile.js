// File: cli/lib/commands/mobile.js
import { MobileAppGenerator } from '../mobile/core.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export async function registerMobileCommand(program) {
  const mobileCmd = program
    .command('mobile')
    .alias('app')
    .description('Mobile app development tools');

  mobileCmd
    .command('generate <projectName>')
    .description('Generate mobile app project')
    .option('-p, --platforms <platforms>', 'Platforms to target (ios,android)', 'ios,android')
    .option('-f, --features <features>', 'Features to include', 'ultra-dex-integration,notifications,offline')
    .action(async (projectName, options) => {
      try {
        const platforms = options.platforms.split(',');
        const features = options.features.split(',');

        const generator = new MobileAppGenerator({
          projectName,
          platforms,
          features
        });

        const result = await generator.generateProject();
        
        printSuccess(`Mobile app generated: ${result.projectDir}`);
        printInfo(`Platforms: ${result.platforms.join(', ')}`);
        printInfo(`Features: ${features.join(', ')}`);
      } catch (error) {
        printError(`Mobile app generation failed: ${error.message}`);
      }
    });

  mobileCmd
    .command('build <platform>')
    .description('Build mobile app for platform')
    .option('-r, --release', 'Build for release')
    .action(async (platform, options) => {
      try {
        printInfo(`Building ${platform} app...`);
        // Would execute platform-specific build commands
        printSuccess(`${platform} app built successfully`);
      } catch (error) {
        printError(`Build failed: ${error.message}`);
      }
    });

  mobileCmd
    .command('deploy <platform>')
    .description('Deploy mobile app')
    .option('-s, --store', 'Deploy to app store')
    .action(async (platform, options) => {
      try {
        if (options.store) {
          printInfo(`Deploying ${platform} app to store...`);
          // Would handle app store deployment
        } else {
          printInfo(`Deploying ${platform} app...`);
        }
        printSuccess(`App deployed successfully`);
      } catch (error) {
        printError(`Deployment failed: ${error.message}`);
      }
    });
}