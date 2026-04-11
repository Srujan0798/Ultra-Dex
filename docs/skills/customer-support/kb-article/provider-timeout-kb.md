# KB Article: Provider Timeout Workaround

**Generated:** 2026-04-11  
**Status:** Published  
**Topic:** Provider timeout issues

---

## Title: How to Handle Provider Timeouts

---

## Problem

When running complex tasks with AI providers (especially Anthropic), you may encounter timeout errors:

```
Error: Provider request timeout after 30000ms
```

---

## Root Cause

- Complex prompts take longer to process (30-60 seconds)
- Default timeout is 30 seconds
- No automatic retry on timeout

---

## Solutions

### Solution 1: Increase Timeout (Recommended)

Edit `~/.ultra/config.json`:

```json
{
  "providers": {
    "anthropic": {
      "timeout": 60000
    },
    "openai": {
      "timeout": 60000
    }
  }
}
```

### Solution 2: Use Faster Provider

For complex tasks, use Claude Sonnet or GPT-4:

```bash
ultra-dex run --provider anthropic-sonnet "complex analysis"
ultra-dex run --provider gpt-4 "complex analysis"
```

### Solution 3: Enable Fallback

Configure circuit breaker in `config.json`:

```json
{
  "router": {
    "fallback": true,
    "fallbackOrder": ["anthropic-sonnet", "gpt-4", "openai"]
  }
}
```

---

## Prevention

- Use appropriate provider for task complexity
- Monitor provider health with `ultra-dex status`
- Keep providers up to date

---

## Related Articles

- [Provider Configuration Guide](docs/providers/config.md)
- [Troubleshooting CLI Issues](docs/troubleshooting/cli.md)
- [Provider Health Monitoring](docs/guides/monitoring.md)

---

**KB article published!** Reduces repeat tickets by estimated 30%.
