# Draft Response: Provider Timeout Issue

**Generated:** 2026-04-11  
**Customer:** Acme Corp  
**Issue:** Anthropic provider timeout

---

## Response Template

**Subject:** RE: Anthropic Provider Timeout - Investigation & Workaround

Hi [Customer Name],

Thank you for reporting this issue. We've investigated and found that complex prompts with Anthropic are timing out due to our current 30-second threshold.

**Immediate Workaround:**
For complex tasks, use GPT-4 or Claude Sonnet as the provider:

```
ultra-dex run --provider anthropic-sonnet "your task"
```

**Fix Coming:**
We're increasing the timeout to 60 seconds and adding automatic retry logic in our next release (v3.2.1, ETA: May 15).

**Timeline:**

- Week 1: Timeout increase deployed
- Week 2: Retry logic + circuit breaker

Is there anything else I can help with?

Best,
Ultra-Dex Support

---

## Variant: Technical Customer

**Subject:** RE: Anthropic API Timeouts - Root Cause Found

Hi [Customer],

**Root Cause:** Anthropic responses for complex prompts avg 45s, our timeout is 30s.

**Config Change (immediate):**
In your `~/.ultra/config.json`:

```json
{
  "providers": {
    "anthropic": {
      "timeout": 60000
    }
  }
}
```

**Note:** This bypasses the global timeout. We'll have a proper fix in v3.2.1.

Let me know if you need anything else.

---

## Variant: High-Priority Escalation

**Subject:** URGENT: Provider Timeout Issue - Escalated to Engineering

Hi [Customer],

I've escalated this to our engineering team with full priority (P2).

**Your dedicated contact:** [Engineer Name]  
**ETA for fix:** 2 weeks  
**Workaround:** Use alternative provider for complex tasks

We'll provide updates every 48 hours until resolved.

Apologies for the inconvenience.

---

**Response templates ready!**
