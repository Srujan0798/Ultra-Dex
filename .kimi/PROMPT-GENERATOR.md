# PROMPT GENERATOR SYSTEM

> Automatic prompt creation with rules, .protocol, and skills
> No manual repeating of instructions

---

## HOW IT WORKS

### OLD WAY (You hate this):

```
You: "Create feature X"
Me: "What rules?"
You: "Check subreddit rules"
Me: "Use .protocol?"
You: "YES use .protocol"
Me: "Reference skills?"
You: "YES reference skills"
(repeat every time)
```

### NEW WAY (Automatic):

```
You: "Create feature X"
System: [AUTO-GENERATES complete prompt with:
  - Rules checking
  - .protocol format
  - Skills references
  - Fallbacks
  - Validation]
```

---

## INSTRUCTIONS TEMPLATE (Stored)

```json
{
  "template": {
    "name": "Feature Request",
    "version": "1.0.0",
    "auto_include": {
      "protocol_header": true,
      "skills_section": true,
      "rules_check": true,
      "fallback_policy": true,
      "validation_criteria": true
    },
    "sections": [
      "PROTOCOL_COMPLIANCE",
      "ACTIVE_PLUGINS",
      "CONTEXT",
      "REQUIREMENTS",
      "DELIVERABLES",
      "FALLBACKS",
      "VALIDATION"
    ]
  }
}
```

---

## AUTO-PROMPT EXAMPLE

### You Say:

"Create Reddit posting feature"

### System Auto-Generates:

```
═══════════════════════════════════════════════════════════════
PROTOCOL COMPLIANCE
═══════════════════════════════════════════════════════════════

This prompt follows .protocol/ format.

MUST:
1. Read .protocol/orchestration.md
2. Use skills from docs/skills/
3. Create .protocol/state/v20-FEATURE-dispatches.md

═══════════════════════════════════════════════════════════════
ACTIVE PLUGINS & SKILLS
═══════════════════════════════════════════════════════════════

### Marketing Plugin (8 skills) ✅
Use: /content-creation + /campaign-plan
Reference: docs/skills/marketing/

### Engineering Plugin (10 skills) ✅
Use: /architecture + /system-design
Reference: docs/skills/engineering/

[RULES CHECK]
### Subreddit Rules (Auto-Check):
- r/LocalLLaMA: Search first, on-topic, no spam
- r/SaaS: Business relevant, not spam
- r/Entrepreneur: Actionable advice

═══════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════

Feature: Reddit Posting Automation
Purpose: Post to multiple subreddits
Current: Manual posting
Target: Automated posting

═══════════════════════════════════════════════════════════════
REQUIREMENTS
═══════════════════════════════════════════════════════════════

[MUST HAVE]
- Auto-draft posts
- Rate limiting
- Human approval
- Subreddit rules check

[SHOULD HAVE]
- A/B testing
- Best time posting
- Response tracking

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════

Create .protocol/state/v20-REDDIT-POSTING-dispatches.md:

1. SYSTEM ARCHITECTURE
2. AUTOMATION WINDOWS (8 windows)
3. INTEGRATION PLAN
4. FALLBACKS

═══════════════════════════════════════════════════════════════
FALLBACKS
═══════════════════════════════════════════════════════════════

1. API fails → Manual mode
2. Rate limited → Queue system
3. Account banned → Backup account

═══════════════════════════════════════════════════════════════
VALIDATION
═══════════════════════════════════════════════════════════════

- Can post to test subreddit
- Rate limits respected
- Human approval works
- No bans

═══════════════════════════════════════════════════════════════
END OF PROMPT
═══════════════════════════════════════════════════════════════
```

---

## USAGE

### For You:

```bash
# Just say what you want
"Create Reddit posting feature"
"Create email automation"
"Create analytics dashboard"

# System auto-generates complete prompt
# With rules, .protocol, skills, fallbacks
# No repeating instructions
```

### For COWRK:

```bash
# Receives auto-generated prompt
# Creates v20-FEATURE-dispatches.md
# Follows .protocol format
# References correct skills
```

---

## STORED INSTRUCTIONS

These are **ALWAYS** included automatically:

### 1. Protocol Format:

- Task ID: V20-W[X]-[NAME]
- Objective, Target Files, Why this lane
- Power Tier, Command, Validation
- Fallback #1, #2, #3
- Cost Class

### 2. Skills Reference:

- Engineering: /architecture, /system-design
- Marketing: /content-creation, /campaign-plan
- Operations: /runbook, /capacity-plan
- Data: /analysis, /dashboards

### 3. Rules Checking:

- Subreddit rules (LocalLLaMA, SaaS, etc.)
- Content policy
- Self-promotion limits
- Posting guidelines

### 4. Fallbacks:

- 3 fallbacks per window
- Alternative approaches
- Cost classes

### 5. Validation:

- Success criteria
- How to verify
- Test commands

---

## COMMAND SYSTEM

### Simple Commands You Use:

| You Say            | System Generates                   |
| ------------------ | ---------------------------------- |
| "Create X feature" | Full prompt with X specifics       |
| "Update X"         | Update prompt for existing X       |
| "Add subreddit Y"  | Y rules + template + posting guide |
| "Fix Z"            | Debug prompt for Z issue           |

### System Auto-Adds:

```json
{
  "auto_add": {
    "header": "═══════════════════════════════",
    "protocol": "MUST read .protocol/",
    "skills": "Use docs/skills/",
    "rules": "Check subreddit rules",
    "fallbacks": "3 fallbacks per window",
    "validation": "Test commands",
    "footer": "═══════════════════════════════"
  }
}
```

---

## EXAMPLES

### Example 1: "Create email automation"

**System auto-adds:**

- Protocol compliance header
- Marketing skills (/email-sequence, /content-creation)
- GDPR/privacy rules
- SendGrid/AWS SES fallbacks
- Deliverability validation

### Example 2: "Create analytics dashboard"

**System auto-adds:**

- Protocol compliance header
- Data skills (/dashboards, /visualization)
- Privacy rules
- Chart.js/D3.js fallbacks
- Metrics validation

### Example 3: "Add subreddit r/devops"

**System auto-adds:**

- r/devops rules
- Posting guidelines
- Template for devops audience
- Best time to post
- Ban avoidance

---

## NO MORE REPEATING

### Before:

```
You: Create feature X
Me: Use .protocol?
You: YES
Me: Check rules?
You: YES
Me: Reference skills?
You: YES
(repeat forever)
```

### After:

```
You: Create feature X
System: [AUTO generates complete prompt]
You: [Copy, give to COWRK]
Done.
```

---

## STORAGE

**This file:** `.kimi/PROMPT-GENERATOR.md`

**System remembers:**

- All instructions
- All rules
- All formats
- All skills

**You never repeat.**

---

## NEXT TIME

**You say:** "Create Discord bot"

**System generates:**

- Protocol header ✅
- Engineering skills ✅
- Discord ToS rules ✅
- Discord.js fallbacks ✅
- Bot token validation ✅

**All automatic.**

---

**Is this what you wanted?**
**Automatic prompt generation with everything included?**
