// Copyright (c) 2026 Ultra-Dex

export default {
  id: 'auth0',
  name: 'Auth0',
  discoveryPath: '.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};
