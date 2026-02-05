/**
 * Enterprise SSO/SAML Integration
 * Supports Okta, Auth0, and Azure AD
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { configManager } from '../utils/config-manager.js';

const PROVIDERS = {
  okta: {
    name: 'Okta',
    icon: '🔵',
    discovery: '.well-known/openid-configuration',
    defaultScopes: ['openid', 'profile', 'email', 'offline_access']
  },
  auth0: {
    name: 'Auth0',
    icon: '🟠',
    discovery: '.well-known/openid-configuration',
    defaultScopes: ['openid', 'profile', 'email', 'offline_access']
  },
  azure: {
    name: 'Azure AD',
    icon: '🟦',
    discovery: 'v2.0/.well-known/openid-configuration',
    defaultScopes: ['openid', 'profile', 'email', 'offline_access', 'User.Read']
  }
};

const SAML_PROVIDERS = [
  { name: 'Okta', value: 'okta' },
  { name: 'Azure AD', value: 'azure' },
  { name: 'Auth0', value: 'auth0' },
  { name: 'Google Workspace', value: 'google' },
  { name: 'Custom', value: 'custom' }
];

export class SSOClient {
  constructor(options = {}) {
    this.provider = options.provider || 'okta';
    this.domain = options.domain;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret; // Caution: Secrets in CLI usually require PKCE
    this.mode = options.mode || 'oidc';
  }

  /**
   * Initialize SSO configuration interactively
   */
  async configure(options = {}) {
    const mode = options.mode || 'oidc';
    if (mode === 'saml') {
      return this.configureSaml();
    }
    return this.configureOidc();
  }

  async configureWizard(options = {}) {
    if (options.mode === 'saml' || options.mode === 'oidc') {
      return this.configure({ mode: options.mode });
    }

    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Select SSO protocol:',
        choices: [
          { name: 'OIDC (Okta/Auth0/Azure)', value: 'oidc' },
          { name: 'SAML 2.0', value: 'saml' }
        ],
        default: 'oidc'
      }
    ]);

    return this.configure({ mode });
  }

  async configureOidc() {
    printInfo(chalk.bold(`\n🔐 Configure ${PROVIDERS[this.provider]?.name || 'SSO'} Provider\n`));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select Identity Provider:',
        choices: Object.entries(PROVIDERS).map(([key, val]) => ({
          name: `${val.icon} ${val.name}`,
          value: key
        })),
        default: this.provider
      },
      {
        type: 'input',
        name: 'domain',
        message: 'Domain (e.g., dev-12345.okta.com):',
        validate: input => input.length > 0 || 'Domain is required'
      },
      {
        type: 'input',
        name: 'clientId',
        message: 'Client ID:',
        validate: input => input.length > 0 || 'Client ID is required'
      }
    ]);

    this.provider = answers.provider;
    this.domain = answers.domain;
    this.clientId = answers.clientId;

    // Save to global config
    const config = await configManager.loadGlobal() || {};
    config.sso = {
      mode: 'oidc',
      provider: this.provider,
      domain: this.domain,
      clientId: this.clientId
    };
    await configManager.saveGlobal(config);

    printSuccess(`\n✅ SSO configuration saved for ${PROVIDERS[this.provider].name}`);
    return config.sso;
  }

  async configureSaml() {
    printInfo(chalk.bold('\n🔐 Configure SAML 2.0 Provider\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'idp',
        message: 'Select Identity Provider:',
        choices: SAML_PROVIDERS.map(p => ({ name: p.name, value: p.value })),
        default: 'okta'
      },
      {
        type: 'input',
        name: 'entryPoint',
        message: 'SSO URL / Entry Point:',
        validate: input => input.length > 0 || 'Entry point is required'
      },
      {
        type: 'input',
        name: 'issuer',
        message: 'Issuer / Entity ID:',
        validate: input => input.length > 0 || 'Issuer is required'
      },
      {
        type: 'input',
        name: 'cert',
        message: 'X509 Certificate (single line or PEM):',
        validate: input => input.length > 0 || 'Certificate is required'
      },
      {
        type: 'input',
        name: 'callbackUrl',
        message: 'Callback URL:',
        default: 'http://localhost:8080/saml/callback'
      }
    ]);

    const config = await configManager.loadGlobal() || {};
    config.sso = {
      mode: 'saml',
      provider: answers.idp,
      saml: {
        entryPoint: answers.entryPoint,
        issuer: answers.issuer,
        cert: answers.cert,
        callbackUrl: answers.callbackUrl
      }
    };
    await configManager.saveGlobal(config);

    printSuccess(`\n✅ SAML configuration saved (${answers.idp}).`);
    return config.sso;
  }

  /**
   * Simulate login flow
   * In a real implementation, this would start a local server, 
   * open a browser, and handle the OIDC callback.
   */
  async login() {
    const config = await configManager.loadGlobal();

    if (config?.sso && !config.sso.mode) {
      config.sso.mode = 'oidc';
      await configManager.saveGlobal(config);
    }

    if (!config?.sso?.mode) {
      printWarning('SSO not configured. Launching configuration...');
      await this.configureWizard();
    }

    if (config?.sso?.mode === 'saml') {
      const samlConfig = config.sso.saml || {};
      printInfo(`\n🔐 Initiating SAML login via ${config.sso.provider || 'IdP'}...`);
      printInfo(`   Entry Point: ${chalk.cyan(samlConfig.entryPoint || 'unknown')}`);
      printInfo(`   Issuer: ${chalk.cyan(samlConfig.issuer || 'unknown')}`);
      printInfo(`   Callback: ${chalk.cyan(samlConfig.callbackUrl || 'http://localhost:8080/saml/callback')}`);

      const { response } = await inquirer.prompt([
        {
          type: 'input',
          name: 'response',
          message: 'Paste SAMLResponse (simulated):'
        }
      ]);

      if (!response) {
        throw new Error('SAMLResponse is required to complete login.');
      }

      const user = {
        username: 'saml-user@enterprise.com',
        provider: `SAML:${config.sso.provider || 'IdP'}`,
        role: 'member',
        loginTime: new Date().toISOString()
      };

      config.user = user;
      await configManager.saveGlobal(config);

      printSuccess(`\n✅ Successfully logged in as ${chalk.bold(user.username)} via SAML`);
      return user;
    }

    const { provider, domain, clientId } = config.sso;
    const providerConfig = PROVIDERS[provider];

    printInfo(`\n🚀 Initiating ${providerConfig.name} SSO login...`);
    printInfo(`   Domain: ${chalk.cyan(domain)}`);
    printInfo(`   Client ID: ${chalk.cyan(clientId)}`);

    const authUrl = `https://${domain}/authorize?client_id=${clientId}&response_type=code&scope=${providerConfig.defaultScopes.join('+')}&redirect_uri=http://localhost:8080/callback`;

    console.log(chalk.gray('\nPlease open the following URL in your browser to authenticate:'));
    console.log(chalk.blue.underline(authUrl));
    console.log('');

    // Simulate waiting for callback
    const { code } = await inquirer.prompt([
      {
        type: 'input',
        name: 'code',
        message: 'Enter the authorization code (simulated):',
        // In real CLI, this is automated via localhost server
      }
    ]);

    // Simulate token exchange
    printInfo('\n🔄 Exchanging code for tokens...');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful login
    const user = {
      username: 'sso-user@enterprise.com',
      provider: providerConfig.name,
      role: 'member', // Default role
      loginTime: new Date().toISOString()
    };

    config.user = user;
    await configManager.saveGlobal(config);

    printSuccess(`\n✅ Successfully logged in as ${chalk.bold(user.username)} via ${user.provider}`);
    return user;
  }
}

export const ssoClient = new SSOClient();
