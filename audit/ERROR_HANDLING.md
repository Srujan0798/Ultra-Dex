# AI Provider Error Handling Inconsistency Matrix

This matrix compares how different providers handle errors and timeouts.

## 1. Error Handling Strategy

| Provider | Strategy | Details |
|----------|----------|---------|
| `BaseProvider` | Throw | Throws an `Error` immediately upon receiving a non-200 status code from the API. The error message includes the status code and response body. |
| `Router` | Fallback | Implements retry logic and fallback to other providers (`fallbackEnabled: true`). Catches errors from `provider.chat()` and attempts to use the next provider in the chain. Only throws if all fallbacks fail. |
| All other adapters | Inherit | Most adapters rely on `BaseProvider._request()` or `BaseProvider._streamRequest()`, inheriting the standard behavior. |

## 2. Timeout Configuration

| Provider | Mechanism | Default Timeout | Configurable? |
|----------|-----------|-----------------|---------------|
| `BaseProvider` | `setTimeout` with `AbortController` | 30000ms (30s) | Yes (`config.timeout`) |
| `Router` | `setTimeout` wrapper (Promise race) | 30000ms (30s) | Yes (`options.timeout` per request or `config.timeout`) |

## 3. Specific Inconsistencies

### Gemini & Google Adapters
- **URL Construction**: Unlike other adapters that rely on `baseUrl` + `endpoint` in `_request`, these construct the full URL including the API key as a query parameter (`?key=...`). While they still call `_request`, this bypasses the standard `Authorization` header mechanism used by others. If `_request` were overridden without considering this, it could break.

### Router Implementation
- **Stream Error Handling**: The `Router`'s `streamChat` generator wraps the provider's stream in a `try/catch` block. If an error occurs mid-stream, it throws the error, terminating the generator. It does *not* attempt to fallback mid-stream (which is reasonable but worth noting).

## 4. Recommendations

1. **Standardize Auth**: Consider moving Gemini/Google auth into `_authHeaders` if possible, or accept the query param pattern as a necessary deviation.
2. **Unified Timeout**: Ensure `Router` uses the same timeout mechanism as `BaseProvider` to avoid race conditions or double-timeout logic. Currently, `Router` wraps the call in *another* timeout, which is redundant if `BaseProvider` already enforces one.
