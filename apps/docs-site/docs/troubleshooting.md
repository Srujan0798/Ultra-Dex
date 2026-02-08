# Troubleshooting

This guide helps you diagnose and resolve common issues with Ultra-Dex.

## Common Issues

### Installation Problems

**Problem**: Cannot install Ultra-Dex globally
**Solution**: 
```bash
# Clear npm cache
npm cache clean --force

# Try installing with different flags
npm install -g ultra-dex --unsafe-perm

# Or use npx instead
npx ultra-dex --version
```

### API Key Issues

**Problem**: Getting authentication errors
**Solution**: Verify your API keys are set correctly:
```bash
# Check current configuration
ultra-dex config show

# Set API key
ultra-dex config set OPENAI_API_KEY your-key-here

# Or use environment variable
export OPENAI_API_KEY=your-key-here
```

### Plan Generation Issues

**Problem**: Plans are too generic or not detailed enough
**Solution**: Provide more specific requirements:
```bash
# Instead of this:
ultra-dex plan "Build a website"

# Try this:
ultra-dex plan "Build a React-based e-commerce website with product listings, shopping cart, and checkout using Stripe payments. Include user authentication and responsive design."
```

### Agent Execution Problems

**Problem**: Agents are not executing tasks properly
**Solution**: 
1. Check your AI provider configuration
2. Verify sufficient API quota
3. Review the generated plan for clarity
4. Use `--verbose` flag for more details: `ultra-dex run plan.md --verbose`

## Diagnostic Commands

### Health Check
```bash
# Check overall system health
ultra-dex health check

# Check specific components
ultra-dex health check --component ai
ultra-dex health check --component integrations
```

### Doctor Command
```bash
# Comprehensive diagnostic
ultra-dex doctor

# Verbose diagnostic
ultra-dex doctor --verbose
```

### Configuration Validation
```bash
# Validate configuration
ultra-dex config validate

# Show effective configuration
ultra-dex config show --effective
```

## Debugging Tips

### Enable Verbose Logging
```bash
# For any command
ultra-dex [command] --verbose

# Or set environment variable
export ULTRA_DEX_DEBUG=true
ultra-dex [command]
```

### Check Logs
```bash
# View recent logs
ultra-dex logs recent

# Follow logs in real-time
ultra-dex logs tail
```

### Dry Runs
Many commands support dry-run mode:
```bash
# See what would happen without executing
ultra-dex run plan.md --dry-run
ultra-dex github repo create --name test --dry-run
```

## Performance Issues

### Slow Response Times
1. Check your internet connection
2. Verify AI provider API status
3. Reduce the complexity of your requests
4. Consider using faster models for initial iterations

### High API Costs
1. Monitor token usage: `ultra-dex usage show`
2. Adjust model settings to use less expensive models
3. Use caching where appropriate
4. Review and optimize your prompts

## Integration-Specific Issues

### GitHub Integration
```bash
# Check GitHub connection
ultra-dex github health check

# Verify token permissions
ultra-dex github token validate
```

### Stripe Integration
```bash
# Check Stripe connection
ultra-dex stripe health check

# Verify API keys
ultra-dex config validate --service stripe
```

## Getting Help

### Community Support
- Check the [FAQ](./faq.md) for common questions
- Visit our GitHub Discussions
- Join our Discord community

### Issue Reporting
When reporting issues, include:
1. Ultra-Dex version: `ultra-dex --version`
2. Node.js version: `node --version`
3. Operating system
4. Command that failed
5. Error message
6. Relevant configuration (without sensitive data)

```bash
# Create a diagnostic report
ultra-dex doctor --report > diagnostic-report.txt
```

## Recovery Procedures

### Reset Configuration
```bash
# Backup current config
cp ~/.ultra-dex/config.json ~/ultra-dex-config-backup.json

# Reset to defaults
ultra-dex config reset
```

### Clear Cache
```bash
# Clear Ultra-Dex cache
ultra-dex cache clear

# Clear specific caches
ultra-dex cache clear --type context
ultra-dex cache clear --type memory
```

### Emergency Stop
If Ultra-Dex is stuck in a long-running operation:
```bash
# Send interrupt signal (Ctrl+C)
# If that doesn't work, kill the process
pkill -f ultra-dex
```