// Copyright (c) 2026 Ultra-Dex

import { SSOClient } from '../sso.js';

export async function configureSaml(options = {}) {
  const client = new SSOClient({ ...options, mode: 'saml' });
  return client.configure({ mode: 'saml' });
}

export async function loginSaml(options = {}) {
  const client = new SSOClient({ ...options, mode: 'saml' });
  return client.login();
}

export default {
  configureSaml,
  loginSaml,
};
