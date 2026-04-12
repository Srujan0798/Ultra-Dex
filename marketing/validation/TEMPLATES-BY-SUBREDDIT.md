# Post Templates by Subreddit

> Custom-written for each community's rules and audience

---

## TIER 1: HIGH PRIORITY

---

### r/LocalLLaMA (Post First)

**Title:** My approach to managing multiple local LLMs - what's yours?

**Body:**

```
I've been running local LLMs for a few months and wanted to share my setup + get feedback on how others handle this.

**My current approach:**

I have multiple models (Llama 3 8B/70B, Mistral, Qwen) downloaded. When I need to switch:
- Stop current model
- Start another one
- Hope I have enough VRAM
- If it crashes, manually restart

I track which model works best for which task by keeping notes, but it's not systematic.

**What I'm considering:**

I started building a lightweight manager that would:
- Keep track of available VRAM
- Route simple tasks to smaller models
- Route complex tasks to larger models
- Restart crashed models automatically

But before I spend more time on this: **Is this overkill?**

Most people I've talked to just run one model at a time and it's fine. Curious if anyone else has felt this friction.

What's your workflow? Do you:
- Just run one model and stick with it?
- Use scripts to automate switching?
- Not worry about optimization?
- Something else entirely?

Not promoting anything - just trying to understand if I'm solving a real problem or inventing one.
```

**Why this works:**

✅ **"My approach" format** - r/LocalLLaMA prefers experience-sharing over questions
✅ **Rule 1 - Search before asking:** Shares personal experience first
✅ **Rule 2 - On-topic:** ONLY about local LLM management
✅ **Rule 3 - Low effort:** Detailed context, genuine request for feedback
✅ **Rule 4 - Self-promotion:** "Not promoting anything" + asks honest question
✅ **Rule 5 - Content policy:** Clean, no violations

**Key compliance:**

- Shares YOUR experience first (not asking for theirs directly)
- No product names mentioned
- No links
- Asks "am I solving a real problem or inventing one" = honest self-doubt
- Community culture: humble, seeking feedback, not help
- Frames as "my approach" not "question"

---

### r/SaaS

**Template:**

```
2 months building AI infra tool - continue or validate first?

Built Ultra-Dex:
- Multi-provider AI routing
- Cost optimization
- Health monitoring
- Working code, some paying users

But: 2 months building without real validation

I can:
1. Keep building features
2. Stop and talk to users first
3. Get job, build nights/weekends

Those who've done SaaS validation: What's the smart move?

Looking for honest advice, not "keep grinding" motivation.
```

**Why this works:**

- Business decision framing
- Acknowledges classic mistake (build without validation)
- Asks what THEY would do
- Fits r/SaaS culture

---

### r/Entrepreneur

**Template:**

```
Solo dev, 2 months building - am I doing this wrong?

Spent 2 months building AI orchestration (routing, monitoring, plugins).

Just realized: I might be making a classic mistake: building without validation.

Current:
- Code works
- Features exist
- Zero customer conversations

What should I do THIS WEEK?

- Keep coding?
- Talk to users first?
- Something else?

Need actionable advice, not motivation.
```

**Why this works:**

- Founder journey angle
- Acknowledges mistake
- Asks for specific actions
- Fits r/Entrepreneur style

---

## TIER 2: MEDIUM PRIORITY

---

### r/startup

**Template:**

```
Would you use AI routing if it saved 40% on API costs?

Building Ultra-Dex - routes tasks to cheapest adequate AI model automatically.

Example: Simple tasks → GPT-3.5 ($0.002/k)
Complex tasks → GPT-4 ($0.06/k)
System picks based on your requirements

Also monitors provider health and auto-fails over.

Question: Do you actually have cost problems with AI APIs? Or is this a solution looking for a problem?

Those with AI bills: What's your monthly spend? Would 40% savings matter?
```

**Why this works:**

- Specific numbers (40% savings)
- Concrete example
- Asks about real bills
- Not promotional

---

### r/SideProject

**Template:**

```
Showoff Saturday: AI orchestration layer I built

Ultra-Dex: Multi-provider AI routing

What it does:
- Route between OpenAI/Anthropic/Gemini
- Auto-pick cheapest model that works
- Monitor health, fail over automatically
- VSCode extension for devs

Status: 2 months coding, now need users

Built with: TypeScript, Redis, Next.js

Question: Useful or should I kill it?

Feedback welcome!
```

**Why this works:**

- "Showoff Saturday" format
- Technical stack included
- Direct question
- Community loves showoff posts

---

### r/ExperiencedDevs

**Template:**

```
How do you handle AI provider rate limits and costs?

Context: Built an internal tool that routes between AI providers (OpenAI, Anthropic, etc.) based on:
- Cost per token
- Current latency
- Rate limit status
- Task complexity

Question for experienced devs: Do you actually need this? Or are rate limits/costs not a real problem at scale?

Those managing AI at scale: What's your actual pain point?

This is research, not promotion. Building for real needs only.
```

**Why this works:**

- "Experienced devs" appeals to ego
- Technical details
- Research angle
- Asks about scale

---

### r/programming

**Template:**

```
Built an AI routing system - worth open sourcing?

Spent 2 months building Ultra-Dex:
- Multi-provider AI routing
- Automatic cost optimization
- Health monitoring
- Plugin system

Debating:
1. Open source it
2. Keep as product
3. Kill it

Question: Would you contribute to/use an open source AI router? Or is this already solved by existing tools?

Looking for honest feedback before deciding.
```

**Why this works:**

- Open source angle
- Community loves FOSS
- Honest decision framing
- Not promotional

---

### r/webdev

**Template:**

```
Webdev using AI APIs - do you use multiple providers?

Question for web developers:

Do you stick with one AI provider (OpenAI, Anthropic) or use multiple?

If multiple:
- How do you decide which to use?
- How do you track costs across them?
- What happens when one goes down?

Context: Built a tool that handles this, but not sure if webdevs actually need it or just use one provider.

Thanks!
```

**Why this works:**

- Direct question
- No promotion
- Developer-to-developer
- Specific use case

---

## TIER 3: NICHE

---

### r/ChatGPT

**Template:**

```
Using ChatGPT API - do you ever wish you could switch providers automatically?

Quick question for ChatGPT API users:

Have you ever hit rate limits and wished you could automatically switch to Claude or Gemini mid-conversation?

Or do you just wait it out?

Context: Built a tool that auto-switches, but not sure if this is a real pain point or edge case.

Thanks!
```

**Why this works:**

- Specific to ChatGPT users
- Relatable problem (rate limits)
- No promotion
- Quick question format

---

### r/ChatGPTPro

**Template:**

```
Power users: Do you use multiple AI providers in production?

For those using AI APIs heavily:

Do you:
A) Use one provider exclusively
B) Use multiple with manual switching
C) Use multiple with automated routing

If B or C:
- What drives provider selection?
- How do you optimize costs?
- What monitoring do you use?

Building infrastructure for this, want to understand real-world needs.
```

**Why this works:**

- "Power users" appeals to ego
- Multiple choice format
- Asks about production
- Professional tone

---

### r/OpenAI

**Template:**

```
OpenAI API users: Do you use backup providers?

Question for those using OpenAI API in production:

Do you have backup providers (Claude, Gemini) for:
- Rate limit backup?
- Cost optimization?
- Feature comparison?
- Reliability?

Or do you rely solely on OpenAI?

Context: Built multi-provider tooling, curious about real-world setups.

Thanks!
```

**Why this works:**

- Specific to OpenAI users
- Professional question
- Multiple valid reasons
- Non-promotional

---

### r/ClaudeAI

**Template:**

```
Claude API users: Do you also use OpenAI/Gemini?

Question for Claude API users:

Do you use Claude exclusively, or do you:
- Switch between Claude and OpenAI based on task?
- Use different providers for different models?
- Have backup providers for reliability?

What's your multi-provider strategy, if any?

Curious about real-world usage patterns.
```

**Why this works:**

- Specific to Claude users
- Assumes multi-provider
- Asks about strategy
- Research angle

---

### r/AI_Agents

**Template:**

```
Agent builders: How do you handle model switching?

For those building AI agents:

When your agent needs to switch between models (e.g., GPT-4 for reasoning, GPT-3.5 for simple tasks), how do you:
- Decide which model?
- Track costs per task?
- Handle rate limits?

Building infrastructure for this, want to understand agent-specific needs.

Thanks!
```

**Why this works:**

- Specific to agent builders
- Technical question
- Infrastructure focus
- Community fits perfectly

---

### r/artificial

**Template:**

```
AI developers: Cost optimization worth it?

For those building AI-powered products:

Do you actively optimize AI costs (routing to cheaper models, etc.)? Or is it "use best model, don't worry about cost"?

If you optimize:
- What % savings do you see?
- What tools/methods?
- Is it worth the complexity?

Context: 2 months building optimization layer, debating if anyone cares.
```

**Why this works:**

- General AI audience
- Cost vs performance
- Specific numbers
- Honest dilemma

---

### r/machinelearning

**Template:**

```
ML engineers: Multi-model deployment patterns?

For ML engineers deploying multiple LLMs:

What patterns do you use for:
- Model selection (A/B, routing, etc.)?
- Cost optimization across providers?
- Fallback when one is down?

Building infrastructure layer, want to understand production patterns.

Not promotional - genuine research question.
```

**Why this works:**

- Appeals to ML engineers
- Technical patterns
- Infrastructure focus
- Research framing

---

## POSTING RULES BY SUBREDDIT

### Always Check Before Posting:

| Subreddit         | Check                            |
| ----------------- | -------------------------------- |
| r/LocalLLaMA      | Account age > 7 days             |
| r/SaaS            | Search for similar posts         |
| r/Entrepreneur    | Karma > 10                       |
| r/startup         | Not "Showoff Saturday" exclusive |
| r/SideProject     | Must be Saturday for Showoff     |
| r/ExperiencedDevs | Technical depth required         |
| r/programming     | Not a beginner question          |
| r/webdev          | Related to web development       |
| r/ChatGPT         | Not spammy                       |
| r/ChatGPTPro      | Professional tone                |
| r/OpenAI          | Respectful of OpenAI             |
| r/ClaudeAI        | On-topic only                    |
| r/AI_Agents       | Technical content                |
| r/artificial      | Discussion-worthy                |
| r/machinelearning | Not beginner-level               |

---

## TRACKING TEMPLATE

Update after posting:

```
## r/SUBREDDIT_NAME
- Posted: [DATE] [TIME]
- Upvotes: X
- Comments: X
- Positive: X
- Negative: X
- DMs received: X
- Interviews scheduled: X
- Result: [Useful/Not useful/Ignore]
- Notes: [Any issues]
```

---

**Next:** Copy r/LocalLLaMA template, post now
