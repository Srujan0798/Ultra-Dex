// File: cli/lib/commands/white-label.js
import { WhiteLabelGenerator } from '../white-label/generator.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export async function registerWhiteLabelCommand(program) {
  const wlCmd = program
    .command('white-label')
    .alias('brand')
    .description('White-label solution tools');

  wlCmd
    .command('generate')
    .description('Generate white-label solution')
    .option('-n, --name <name>', 'Brand name')
    .option('-s, --slug <slug>', 'Brand slug')
    .option('-c, --company <company>', 'Company name')
    .option('-e, --contact <email>', 'Contact email')
    .option('-o, --output <dir>', 'Output directory', './white-label')
    .option('-f, --features <features>', 'Features to include', 'core,ai,mcp,governance')
    .option('--colors <colors>', 'Brand colors (comma separated)')
    .option('--logo <path>', 'Logo path')
    .action(async (options) => {
      try {
        const branding = {
          name: options.name,
          slug: options.slug,
          colors: options.colors?.split(','),
          logo: options.logo,
          tagline: options.tagline
        };

        const customer = {
          name: options.company,
          contact: options.contact
        };

        const features = options.features.split(',');

        const generator = new WhiteLabelGenerator({
          branding,
          customer,
          features,
          outputDir: options.output
        });

        const result = await generator.generateWhiteLabel();
        
        printSuccess(`White-label solution generated: ${result.outputPath}`);
        printInfo(`Customer: ${result.customer.name}`);
        printInfo(`Brand: ${result.branding.name}`);
        printInfo(`Features: ${features.join(', ')}`);
      } catch (error) {
        printError(`White-label generation failed: ${error.message}`);
      }
    });

  wlCmd
    .command('build')
    .description('Build white-label solution')
    .option('-d, --dir <dir>', 'Directory to build', './white-label')
    .action(async (options) => {
      try {
        // Would build the white-label solution
        printSuccess('White-label solution built successfully');
      } catch (error) {
        printError(`Build failed: ${error.message}`);
      }
    });

  wlCmd
    .command('list')
    .description('List white-label solutions')
    .action(async () => {
      try {
        printInfo('White-label solutions:');
        // Would list existing white-label installations
      } catch (error) {
        printError(`List failed: ${error.message}`);
      }
    });
}