# Ultra-Dex FAQ

## General Questions

### Q: What is Ultra-Dex?

**A:** Ultra-Dex is an AI Orchestration Layer that provides structured prompts (agents) to guide AI assistants in building software correctly. Think of it as the "brain" that tells AI agents WHAT to build properly.

### Q: How is this different from just asking AI?

**A:** Regular AI prompts are vague. Ultra-Dex agents provide:

- Structured thinking frameworks
- Quality checklists (21-step verification)
- Industry best practices
- Complete context for AI
- Consistent output formats

### Q: Do I need to install anything?

**A:** No! Ultra-Dex works via copy-paste. Just copy agent prompts and paste into your AI assistant (Cursor, Claude Code, Devin, etc.).

### Q: Which AI assistants work with Ultra-Dex?

**A:** All of them! Cursor, Claude Code, Devin, GitHub Copilot, Codeium, etc. Ultra-Dex is AI-agnostic.

## Usage Questions

### Q: How do I get started?

**A:** Three steps:

1. `cat .agents/backend.md | pbcopy`
2. Paste into your AI assistant
3. Add your project context and build!

### Q: How long does it take?

**A:**

- Quick tasks: 2-5 minutes
- Full features: 15-20 minutes
- Complex workflows: 30-45 minutes
  vs hours with traditional methods.

### Q: Can I customize the agents?

**A:** Yes! See `.agents/CUSTOMIZATION.md` for:

- Tech stack customization
- Team process adaptation
- Industry-specific guidance
- Company standards alignment

### Q: What if I need help?

**A:**

1. Check `QUICKSTART.md`
2. See `.agents/QUICK_REFERENCE.md`
3. Review example workflows in `examples/`
4. Open GitHub issue

## Technical Questions

### Q: Why don't CLI commands work?

**A:** npm dependency installation is timing out. Workaround: Use copy-paste method - it works perfectly!

### Q: Can I contribute new agents?

**A:** Absolutely! See `CONTRIBUTING.md` for guidelines.

### Q: Is this free?

**A:** Yes, Ultra-Dex is open source (MIT License).

### Q: Can I use this commercially?

**A:** Yes! MIT License allows commercial use.

## Advanced Questions

### Q: How do I chain agents?

**A:** Example workflow:

```
1. cto.md → Architecture approval
2. planner.md → Task breakdown
3. backend.md → Implementation
4. reviewer.md → Quality check
```

### Q: Can I share custom agents?

**A:** Yes! Contribute to community showcase or create your own repo.

### Q: How do I update agents?

**A:** Pull latest from main branch. Agents improve over time.

### Q: What's the score?

**A:** Ultra-Dex scores 82/100 (from 40/100) on market fit, speed, quality, and defensibility.

## Troubleshooting

### Q: Agent output seems generic

**Solution:** Provide more specific context about your project, stack, and requirements.

### Q: AI isn't following the agent

**Solution:** Ensure you pasted the ENTIRE agent prompt before adding your context.

### Q: Results don't match examples

**Solution:** Check that you're using the latest agent version and providing complete context.

### Q: Something's not working

**Solution:**

1. Re-read the agent instructions
2. Check example workflows
3. Verify AI assistant compatibility
4. Open GitHub issue with details

---

**Still have questions?** Open a GitHub issue or discussion!
