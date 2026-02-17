// Copyright (c) 2026 Ultra-Dex

import { EnterpriseSSO as SSOClient } from '../sso.js';

export const ssoClient = new SSOClient();

export async function configureSso(options = {}) {
  return ssoClient.configureWizard(options);
}

export async function loginSso() {
  return ssoClient.login();
}

export { SSOClient };

export default {
  ssoClient,
  configureSso,
  loginSso,
  SSOClient,
};
