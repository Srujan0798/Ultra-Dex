// Copyright (c) 2026 Ultra-Dex

import { printError, printInfo, printSuccess } from '../utils/output.js';
import { EnterpriseInit } from '../../../../src/core/enterprise/init.ts';

const enterpriseInit = new EnterpriseInit();

export function registerEnterpriseCommand(program) {
  const enterprise = program
    .command('enterprise')
    .description('Enterprise features: initialization, SSO, SLA, compliance');

  enterprise
    .command('init')
    .description('Initialize enterprise workspace settings')
    .requiredOption('--license <key>', 'Enterprise license key')
    .option('--sso <provider>', 'SSO provider: okta|azuread|auth0|oidc', 'oidc')
    .option('--issuer <url>', 'SSO issuer URL', 'https://example.com')
    .option('--client-id <id>', 'SSO client id', 'ultra-dex')
    .option('--compliance <level>', 'Compliance level: soc2|gdpr|hipaa|iso27001', 'soc2')
    .option('--support <channel>', 'Support channel: email|slack|pagerduty', 'email')
    .option('--tier <tier>', 'Tier: free|pro|enterprise', 'enterprise')
    .action(async (options) => {
      try {
        const status = await enterpriseInit.initialize({
          licenseKey: options.license,
          sso: {
            type: options.sso,
            issuer: options.issuer,
            clientId: options.clientId,
          },
          complianceLevel: options.compliance,
          supportChannel: options.support,
          tier: options.tier,
        });
        printSuccess('Enterprise initialized');
        printInfo(JSON.stringify(status, null, 2));
      } catch (error) {
        printError(`Enterprise init failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });

  enterprise
    .command('status')
    .description('Show current enterprise status')
    .action(() => {
      printInfo(JSON.stringify(enterpriseInit.getStatus(), null, 2));
    });

  enterprise
    .command('upgrade <tier>')
    .description('Upgrade tier: free -> pro -> enterprise')
    .action((tier) => {
      try {
        const status = enterpriseInit.upgrade(tier);
        printSuccess(`Tier upgraded to ${tier}`);
        printInfo(JSON.stringify(status, null, 2));
      } catch (error) {
        printError(`Enterprise upgrade failed: ${error.message}`, error);
        process.exitCode = 1;
      }
    });
}

export default registerEnterpriseCommand;

