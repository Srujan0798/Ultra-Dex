// Copyright (c) 2026 Ultra-Dex

export default {
  id: 'azure-ad',
  name: 'Azure AD',
  discoveryPath: 'v2.0/.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email', 'offline_access', 'User.Read'],
};
