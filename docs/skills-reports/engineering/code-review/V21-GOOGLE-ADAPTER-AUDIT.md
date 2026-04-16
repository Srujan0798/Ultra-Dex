# Google Gemini Adapter Security & Performance Audit

**Adapter File:** `adapters/googleAdapter.ts`  
**Audit Date:** 2026-04-14  
**Auditor:** Engineering Code Review Skill  
**Lines of Code:** 217

---

## Executive Summary

The Google Gemini adapter implements the `ExecutionAdapter` interface with basic functionality for executing tasks via Google's Gemini API. While the adapter follows the general structure of other adapters in the codebase, **it exhibits several critical security vulnerabilities, performance gaps, and reliability issues** that require immediate attention.

**Overall Risk Rating: HIGH**

| Category | Rating | Critical Issues |
|----------|--------|-----------------|
| Security | ⚠️ HIGH RISK | 2 Critical, 1 High |
| Performance | ⚠️ MEDIUM RISK | 2 Medium, 2 Low |
| Reliability | ⚠️ HIGH RISK | 3 High, 2 Medium |
| Code Quality | ✅ LOW RISK | 3 Low |

---

## 1. Security Findings

### 🔴 CRITICAL: API Key Exposure in URL

**Location:** Line 170

```typescript
const url = `${this.config.baseURL}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
```

**Issue:** The API key is passed as a query parameter in the URL. This is a **critical security vulnerability** because:

1. **URL Logging:** API keys in URLs are logged by proxies, CDNs, and server access logs
2. **Browser History:** If used in browser contexts, keys appear in browser history
3. **Referer Headers:** URLs may be sent in Referer headers to third parties
4. **Stack Traces:** Error messages may include the full URL with exposed key

**Comparison:** OpenAI and Anthropic adapters correctly pass API keys in headers:

```typescript
// OpenAI (correct)
'Authorization': `Bearer ${this.config.apiKey}`

// Anthropic (correct)
'x-api-key': this.config.apiKey
```

**Recommendation:** Use the `x-goog-api-key` header:

```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': this.config.apiKey,  // Secure header transmission
  },
  body: JSON.stringify(requestBody),
  signal,
});
```

---

### 🔴 CRITICAL: Missing Input Validation & Injection Risk

**Location:** Lines 93-99

```typescript
const contents: GeminiContent[] = [
  {
    role: 'user',
    parts: [{
      text: `You are an AI agent in an Ultra-Dex workflow. Task type: ${context.taskType}.\n\nExecute this task:\n${JSON.stringify(context.input, null, 2)}`,
    }],
  },
];
```

**Issue:** The `context.taskType` and `context.input` are directly interpolated into the prompt without validation. This could lead to:

1. **Prompt Injection:** Malicious input could manipulate the LLM behavior
2. **Unexpected Token Counts:** Large inputs could exceed model context limits
3. **JSON Parsing Issues:** Circular references or unserializable objects cause runtime errors

**Comparison:** All three adapters share this vulnerability, but Google adapter is particularly susceptible due to different content structure.

**Recommendation:**

```typescript
private validateInput(input: unknown): void {
  const maxSize = 100 * 1024; // 100KB limit
  const serialized = JSON.stringify(input);
  
  if (serialized.length > maxSize) {
    throw new Error(`Input exceeds maximum size of ${maxSize} bytes`);
  }
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = /[<>"'`]|javascript:|data:/gi;
  if (dangerousPatterns.test(serialized)) {
    throw new Error('Input contains potentially dangerous content');
  }
}
```

---

### 🟠 HIGH: Error Message Information Disclosure

**Location:** Lines 191-194, 140-148

```typescript
if (!response.ok) {
  const error = await response.text();
  throw new Error(`Google API error: ${response.status} ${error}`);
}

// In catch block:
return {
  status: 'FAILED',
  logs: [(error as Error).message],
  error: (error as Error).message,
  // ...
};
```

**Issue:** Raw API error responses are exposed to callers, potentially leaking:
- Internal API structure details
- Request IDs that could be used for attacks
- Stack traces or internal error details

**Comparison:** All adapters have similar patterns; none sanitize error messages.

**Recommendation:**

```typescript
private sanitizeError(error: unknown, statusCode?: number): string {
  // Map known errors to safe messages
  const errorMap: Record<number, string> = {
    400: 'Invalid request format',
    401: 'Authentication failed',
    403: 'Access denied',
    429: 'Rate limit exceeded',
    500: 'Service temporarily unavailable',
  };
  
  return errorMap[statusCode ?? 0] ?? 'Request failed';
}
```

---

### 🟡 MEDIUM: Missing API Key Validation

**Location:** Line 74-76

```typescript
if (!this.config.apiKey) {
  throw new Error('Google API key is required');
}
```

**Issue:** Only checks for presence, not validity format. Invalid keys cause delayed failures.

**Recommendation:** Add format validation:

```typescript
private validateApiKey(key: string): void {
  // Google API keys are typically 39 characters
  if (!/^[A-Za-z0-9_-]{39}$/.test(key)) {
    throw new Error('Invalid Google API key format');
  }
}
```

---

## 2. Performance Issues

### 🟠 MEDIUM: No Request Timeout on fetch()

**Location:** Line 182-189

**Issue:** The native `fetch()` timeout is controlled only via `AbortSignal`, but there's no explicit fetch timeout configuration. In Node.js environments without proper fetch polyfills, this can cause hanging requests.

**Comparison:** All adapters share this issue.

**Recommendation:** Add explicit fetch timeout with dual-timeout strategy:

```typescript
private async makeRequest(
  contents: GeminiContent[], 
  signal: AbortSignal,
  timeoutMs: number
): Promise<GeminiResponse> {
  // Create a specific timeout for this fetch operation
  const fetchTimeout = new AbortController();
  const timeoutId = setTimeout(() => fetchTimeout.abort(), timeoutMs);
  
  // Combine signals
  const combinedSignal = AbortSignal.any?.([signal, fetchTimeout.signal]) 
    ?? signal; // Fallback for older environments
  
  try {
    const response = await fetch(url, {
      // ... config
      signal: combinedSignal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

### 🟠 MEDIUM: Memory Leak Risk in activeRequests Map

**Location:** Line 61, 85, 150

```typescript
private activeRequests = new Map<string, AbortController>();
```

**Issue:** While `finally` block deletes entries, edge cases exist:

1. **Rapid Fire Requests:** Same `nodeId` could be overwritten before cleanup
2. **Uncaught Exceptions:** If an exception occurs before `try` block
3. **Process Crashes:** No cleanup on uncaught exceptions

**Evidence:** No safeguard against duplicate `nodeId` entries:

```typescript
// Line 85 - Overwrites without checking
this.activeRequests.set(context.nodeId, controller);
```

**Recommendation:**

```typescript
async run(context: ExecutionContext): Promise<ExecutionResult> {
  // Prevent duplicate executions
  if (this.activeRequests.has(context.nodeId)) {
    throw new Error(`Execution already in progress for node ${context.nodeId}`);
  }
  
  const controller = new AbortController();
  this.activeRequests.set(context.nodeId, controller);
  
  // WeakRef cleanup for long-running processes
  this.scheduleCleanup(context.nodeId);
  
  // ... rest of implementation
}

private scheduleCleanup(nodeId: string): void {
  // Auto-cleanup after max timeout + buffer
  setTimeout(() => {
    const controller = this.activeRequests.get(nodeId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(nodeId);
    }
  }, this.config.timeoutMs + 5000);
}
```

---

### 🟡 LOW: Missing Response Size Limits

**Location:** Line 196

```typescript
return response.json() as Promise<GeminiResponse>;
```

**Issue:** No limit on response body size. Malicious or erroneous API responses could cause memory exhaustion.

**Recommendation:** Add size checking:

```typescript
const contentLength = response.headers.get('content-length');
const maxSize = 10 * 1024 * 1024; // 10MB

if (contentLength && parseInt(contentLength) > maxSize) {
  throw new Error('Response exceeds maximum size limit');
}
```

---

### 🟡 LOW: Synchronous Cost Calculation Blocking Event Loop

**Location:** Lines 199-216

**Issue:** While currently minimal, cost calculation could become expensive with complex pricing tiers.

**Recommendation:** Consider moving to worker thread for high-throughput scenarios or memoizing results.

---

## 3. Reliability Concerns

### 🔴 HIGH: Missing Retry Logic

**Location:** `makeRequest()` method (Lines 169-197)

**Issue:** Despite `maxRetries` config option (line 49, 67), **no retry logic is implemented**. This is a major reliability gap.

```typescript
// Config defines maxRetries: 3
maxRetries: 3,

// But makeRequest has zero retry logic
private async makeRequest(...): Promise<GeminiResponse> {
  // Single attempt only - no retries!
  const response = await fetch(url, { ... });
}
```

**Comparison:** Same issue exists in OpenAI and Anthropic adapters.

**Recommendation:** Implement exponential backoff retry:

```typescript
private async makeRequestWithRetry(
  contents: GeminiContent[], 
  signal: AbortSignal
): Promise<GeminiResponse> {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
    try {
      return await this.makeRequest(contents, signal);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if explicitly cancelled
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
      
      // Check if error is retryable
      const statusCode = this.extractStatusCode(error);
      if (!statusCode || !retryableStatuses.includes(statusCode)) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < this.config.maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await this.delay(delay);
      }
    }
  }
  
  throw lastError ?? new Error('Max retries exceeded');
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

### 🔴 HIGH: Incomplete Error Status Mapping

**Location:** Lines 125-148

**Issue:** The adapter only distinguishes between `AbortError` (timeout) and generic failures. It doesn't properly map to the `ExecutionResult` status enum.

```typescript
export interface ExecutionResult {
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  // ...
}
```

**Current implementation only returns:**
- `'SUCCESS'` - on success
- `'FAILED'` - on all failures (including timeout!)

**Missing:**
- `'TIMEOUT'` - never returned despite being in type definition
- `'CANCELLED'` - never returned for explicit cancellations

**Recommendation:**

```typescript
try {
  // ... success case
  return { status: 'SUCCESS', ... };
} catch (error) {
  clearTimeout(timeoutId);
  
  const errorName = (error as Error).name;
  
  if (errorName === 'AbortError') {
    // Distinguish between timeout and explicit cancel
    const wasCancelled = this.wasExplicitlyCancelled(context.nodeId);
    
    if (wasCancelled) {
      return {
        status: 'CANCELLED',
        logs: ['Execution cancelled by user'],
        error: 'Cancelled',
        // ...
      };
    }
    
    return {
      status: 'TIMEOUT',  // Correct status!
      logs: ['Request timed out'],
      error: `Timeout after ${this.config.timeoutMs}ms`,
      // ...
    };
  }
  
  return {
    status: 'FAILED',
    // ...
  };
}
```

---

### 🔴 HIGH: No Circuit Breaker Pattern

**Issue:** No protection against cascading failures when the API is down.

**Recommendation:** Implement circuit breaker:

```typescript
interface CircuitBreaker {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

private circuitBreaker: CircuitBreaker = {
  failures: 0,
  lastFailureTime: 0,
  state: 'CLOSED',
};

private async checkCircuitBreaker(): Promise<void> {
  if (this.circuitBreaker.state === 'OPEN') {
    const resetTime = this.circuitBreaker.lastFailureTime + 30000; // 30s
    if (Date.now() < resetTime) {
      throw new Error('Circuit breaker is OPEN - too many failures');
    }
    this.circuitBreaker.state = 'HALF_OPEN';
  }
}
```

---

### 🟠 MEDIUM: Missing Response Validation

**Location:** Lines 104-109

```typescript
const candidate = response.candidates[0];
if (!candidate) {
  throw new Error('No response from Google Gemini');
}

const content = candidate.content.parts.map(p => p.text).join('');
```

**Issue:** No validation of response structure. `candidates` could be empty, `content.parts` could be malformed.

**Recommendation:**

```typescript
private validateResponse(response: unknown): GeminiResponse {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response: not an object');
  }
  
  const geminiResponse = response as GeminiResponse;
  
  if (!Array.isArray(geminiResponse.candidates) || geminiResponse.candidates.length === 0) {
    throw new Error('Invalid response: no candidates');
  }
  
  const candidate = geminiResponse.candidates[0];
  if (!candidate.content?.parts?.length) {
    throw new Error('Invalid response: missing content');
  }
  
  if (!geminiResponse.usageMetadata) {
    throw new Error('Invalid response: missing usage metadata');
  }
  
  return geminiResponse;
}
```

---

### 🟠 MEDIUM: No Fallback Model Support

**Issue:** No automatic fallback to alternative models if the primary fails.

**Recommendation:** Support fallback chain:

```typescript
export interface GoogleAdapterConfig {
  apiKey: string;
  model?: string;
  fallbackModels?: string[];  // e.g., ['gemini-1.5-pro', 'gemini-1.5-flash']
  // ...
}
```

---

## 4. Code Quality Issues

### 🟡 LOW: Inconsistent Confidence Scoring

**Location:** Line 121

```typescript
confidence: 0.92,  // Hardcoded
```

**Comparison:**
- OpenAI: `confidence: 0.95`
- Anthropic: `confidence: 0.95`
- Google: `confidence: 0.92`

**Issue:** Arbitrary hardcoded values without justification. Should derive from model capabilities or response metadata.

**Recommendation:**

```typescript
private calculateConfidence(response: GeminiResponse): number {
  // Use finish reason to determine confidence
  const finishReason = response.candidates[0]?.finishReason;
  
  const confidenceMap: Record<string, number> = {
    'STOP': 0.95,
    'MAX_TOKENS': 0.80,
    'SAFETY': 0.60,
    'RECITATION': 0.50,
    'OTHER': 0.70,
  };
  
  return confidenceMap[finishReason] ?? 0.70;
}
```

---

### 🟡 LOW: Missing Type Safety for API Errors

**Location:** Lines 191-194

```typescript
const error = await response.text();
throw new Error(`Google API error: ${response.status} ${error}`);
```

**Issue:** Using `response.text()` loses structured error information.

**Recommendation:** Parse structured errors:

```typescript
interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

private async parseError(response: Response): Promise<Error> {
  try {
    const errorData = await response.json() as GeminiErrorResponse;
    return new Error(`Gemini API ${errorData.error.status}: ${errorData.error.message}`);
  } catch {
    const text = await response.text();
    return new Error(`Gemini API ${response.status}: ${text}`);
  }
}
```

---

### 🟡 LOW: Pricing Data is Stale Comment

**Location:** Line 200

```typescript
// Pricing as of 2024 (may need updates)
```

**Issue:** Comment acknowledges staleness but no mechanism to update.

**Recommendation:** Fetch pricing dynamically or validate against external source.

---

### 🟡 LOW: Unused Configuration Options

**Location:** Lines 169-197

**Issue:** `topP` and `topK` are hardcoded in `makeRequest`:

```typescript
generationConfig: {
  temperature: this.config.temperature,
  maxOutputTokens: this.config.maxTokens,
  topP: 0.95,  // Hardcoded
  topK: 40,    // Hardcoded
},
```

Should be configurable via adapter config.

---

## 5. Adapter Comparison Matrix

| Feature | Google | OpenAI | Anthropic | Best Practice |
|---------|--------|--------|-----------|---------------|
| **API Key in Header** | ❌ URL param | ✅ Bearer | ✅ x-api-key | Header always |
| **Retry Logic** | ❌ None | ❌ None | ❌ None | Exponential backoff |
| **Input Validation** | ❌ None | ❌ None | ❌ None | Size + content check |
| **Error Sanitization** | ❌ None | ❌ None | ❌ None | Mapped errors |
| **Circuit Breaker** | ❌ None | ❌ None | ❌ None | Required for prod |
| **Response Validation** | ❌ Basic | ❌ Basic | ❌ Basic | Schema validation |
| **Timeout Config** | ✅ Configurable | ✅ Configurable | ✅ Configurable | Per-request override |
| **Cost Calculation** | ✅ Implemented | ✅ Implemented | ✅ Implemented | Dynamic pricing |
| **AbortController** | ✅ Implemented | ✅ Implemented | ✅ Implemented | Required |
| **Status Mapping** | ❌ Incomplete | ❌ Incomplete | ❌ Incomplete | All enum values |

---

## 6. Recommendations Summary

### Immediate Actions (Critical)

1. **Fix API Key Exposure** (CRITICAL)
   - Move API key from URL to `x-goog-api-key` header
   - Estimated effort: 30 minutes

2. **Add Input Validation** (CRITICAL)
   - Validate input size and content
   - Sanitize against prompt injection
   - Estimated effort: 2 hours

3. **Implement Retry Logic** (HIGH)
   - Add exponential backoff
   - Handle transient failures
   - Estimated effort: 3 hours

### Short-term (High Priority)

4. **Fix Status Mapping** (HIGH)
   - Return correct `TIMEOUT` and `CANCELLED` statuses
   - Estimated effort: 1 hour

5. **Add Circuit Breaker** (HIGH)
   - Prevent cascading failures
   - Estimated effort: 4 hours

6. **Sanitize Error Messages** (HIGH)
   - Don't expose internal details
   - Estimated effort: 2 hours

### Medium-term (Medium Priority)

7. **Add Response Validation** (MEDIUM)
   - Validate response structure
   - Handle edge cases
   - Estimated effort: 2 hours

8. **Fix Memory Leak Risk** (MEDIUM)
   - Prevent duplicate nodeId entries
   - Add auto-cleanup
   - Estimated effort: 2 hours

### Long-term (Low Priority)

9. **Dynamic Confidence Scoring** (LOW)
10. **Externalize Pricing** (LOW)
11. **Add Fallback Models** (LOW)
12. **Implement Structured Logging** (LOW)

---

## 7. Refactored Code Reference

Here's a partial implementation addressing critical issues:

```typescript
export class GoogleAdapter implements ExecutionAdapter {
  private config: Required<GoogleAdapterConfig>;
  private activeRequests = new Map<string, AbortController>();
  private readonly maxInputSize = 100 * 1024; // 100KB

  constructor(config: GoogleAdapterConfig) {
    this.config = {
      model: 'gemini-1.5-flash',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      maxRetries: 3,
      timeoutMs: 120_000,
      temperature: 0.7,
      maxTokens: 4096,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('Google API key is required');
    }
  }

  async run(context: ExecutionContext): Promise<ExecutionResult> {
    // Prevent duplicate executions
    if (this.activeRequests.has(context.nodeId)) {
      throw new Error(`Execution already in progress for node ${context.nodeId}`);
    }

    // Validate input
    this.validateInput(context.input);

    const controller = new AbortController();
    this.activeRequests.set(context.nodeId, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, context.timeout ?? this.config.timeoutMs);

    try {
      const contents = this.buildContents(context);
      const response = await this.makeRequestWithRetry(contents, controller.signal);
      clearTimeout(timeoutId);

      const result = this.processResponse(response);
      return {
        status: 'SUCCESS',
        ...result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return this.handleError(error, context.nodeId, startTime);
    } finally {
      this.activeRequests.delete(context.nodeId);
    }
  }

  private async makeRequestWithRetry(
    contents: GeminiContent[], 
    signal: AbortSignal
  ): Promise<GeminiResponse> {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await this.makeRequest(contents, signal);
      } catch (error) {
        if ((error as Error).name === 'AbortError') throw error;
        
        const status = this.extractStatusCode(error);
        const isLastAttempt = attempt === this.config.maxRetries - 1;
        
        if (!status || !retryableStatuses.includes(status) || isLastAttempt) {
          throw error;
        }
        
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  private async makeRequest(
    contents: GeminiContent[], 
    signal: AbortSignal
  ): Promise<GeminiResponse> {
    const url = `${this.config.baseURL}/models/${this.config.model}:generateContent`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.config.apiKey,  // SECURE: Header instead of URL
      },
      body: JSON.stringify({ contents }),
      signal,
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }

    return response.json() as Promise<GeminiResponse>;
  }

  private validateInput(input: unknown): void {
    const serialized = JSON.stringify(input);
    if (serialized.length > this.maxInputSize) {
      throw new Error(`Input exceeds maximum size of ${this.maxInputSize} bytes`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 8. Appendix

### Testing Recommendations

1. **Security Tests:**
   ```typescript
   test('API key not exposed in URL', () => {
     // Verify key is in headers only
   });
   
   test('Input size limits enforced', () => {
     // Verify large inputs are rejected
   });
   ```

2. **Reliability Tests:**
   ```typescript
   test('Retry logic with 503 response', async () => {
     // Mock 503 responses, verify retry
   });
   
   test('Circuit breaker opens after failures', async () => {
     // Verify circuit breaker pattern
   });
   ```

3. **Performance Tests:**
   ```typescript
   test('Concurrent request handling', async () => {
     // Verify no memory leaks with 1000+ requests
   });
   ```

---

**Report Generated:** 2026-04-14  
**Next Review Recommended:** After critical issues resolved
