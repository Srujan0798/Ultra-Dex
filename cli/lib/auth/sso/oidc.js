// Copyright (c) 2026 Ultra-Dex

import { SSOClient } from '../sso.js';

export async function configureOidc(options = {}) {
  const client = new SSOClient({ ...options, mode: 'oidc' });
  return client.configure({ mode: 'oidc' });
}

export async function loginOidc(options = {}) {
  const client = new SSOClient({ ...options, mode: 'oidc' });
  return client.login();
}

export default {
  configureOidc,
  loginOidc,
};
