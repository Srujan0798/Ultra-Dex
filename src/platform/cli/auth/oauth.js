// Copyright (c) 2026 Ultra-Dex

/**
 * Lightweight OAuth helper utilities.
 * Supports authorization URL generation and code exchange.
 */

export function buildAuthUrl({
  authorizeUrl,
  clientId,
  redirectUri,
  scope,
  state,
  responseType = 'code',
  extraParams = {},
}) {
  if (!authorizeUrl || !clientId || !redirectUri) {
    throw new Error('authorizeUrl, clientId, and redirectUri are required');
  }

  const url = new URL(authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', responseType);
  if (scope) url.searchParams.set('scope', scope);
  if (state) url.searchParams.set('state', state);

  for (const [key, value] of Object.entries(extraParams)) {
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export async function exchangeCode({
  tokenUrl,
  clientId,
  clientSecret,
  code,
  redirectUri,
  extraParams = {},
}) {
  if (!tokenUrl || !clientId || !clientSecret || !code || !redirectUri) {
    throw new Error('tokenUrl, clientId, clientSecret, code, redirectUri are required');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    ...Object.fromEntries(Object.entries(extraParams).map(([k, v]) => [k, String(v)])),
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.status} ${text}`);
  }

  return response.json();
}
