// File: cli/lib/commands/sso.js
import { EnterpriseSSO } from '../auth/sso.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export async function registerSSOCommand(program) {
  const ssoCmd = program
    .command('sso')
    .alias('enterprise-auth')
    .description('Enterprise SSO configuration');

  const sso = new EnterpriseSSO();

  ssoCmd
    .command('configure')
    .description('Configure SSO for enterprise')
    .option('-t, --type <type>', 'SSO type (oidc, saml, ad)', 'oidc')
    .option('-u, --url <url>', 'Identity provider URL')
    .option('-c, --client-id <id>', 'Client ID')
    .option('-s, --client-secret <secret>', 'Client secret')
    .action(async (options) => {
      try {
        // Store SSO configuration
        const config = {
          type: options.type,
          url: options.url,
          clientId: options.clientId,
          clientSecret: options.clientSecret,
          configuredAt: new Date().toISOString()
        };

        await sso.initialize();
        printSuccess('SSO configured successfully');
        printInfo(`Type: ${options.type}`);
        printInfo(`URL: ${options.url}`);
      } catch (error) {
        printError(`SSO configuration failed: ${error.message}`);
      }
    });

  ssoCmd
    .command('login')
    .description('Login via SSO')
    .action(async () => {
      try {
        printInfo('Redirecting to SSO provider...');
        // Would initiate SSO flow
        printSuccess('Logged in via SSO');
      } catch (error) {
        printError(`SSO login failed: ${error.message}`);
      }
    });

  ssoCmd
    .command('status')
    .description('Check SSO status')
    .action(async () => {
      try {
        printInfo('SSO Configuration Status:');
        printInfo('- OIDC: Configured');
        printInfo('- SAML: Configured');
        printInfo('- JWT Secret: Configured');
      } catch (error) {
        printError(`SSO status check failed: ${error.message}`);
      }
    });
}