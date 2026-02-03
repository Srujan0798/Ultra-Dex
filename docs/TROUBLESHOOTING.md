# Ultra-Dex Troubleshooting Guide

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [API Key Problems](#api-key-problems)
3. [Command Issues](#command-issues)
4. [Performance Issues](#performance-issues)
5. [Security Concerns](#security-concerns)
6. [Advanced Troubleshooting](#advanced-troubleshooting)
7. [Common Solutions](#common-solutions)

## Installation Issues

### Problem: Command Not Found
**Symptoms**: Getting "command not found: ultra-dex" error
**Solutions**:
1. Verify installation:
   ```bash
   npm list -g ultra-dex
   ```
2. Reinstall globally:
   ```bash
   npm uninstall -g ultra-dex
   npm install -g ultra-dex
   ```
3. Check your PATH environment variable includes npm global packages directory
4. Try running with npx instead:
   ```bash
   npx ultra-dex --version
   ```

### Problem: Installation Fails
**Symptoms**: npm install fails with errors
**Solutions**:
1. Update npm:
   ```bash
   npm install -g npm@latest
   ```
2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
3. Try installing with different registry:
   ```bash
   npm install -g ultra-dex --registry https://registry.npmjs.org/
   ```
4. Check for permission issues:
   ```bash
   sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
   ```

## API Key Problems

### Problem: API Key Not Recognized
**Symptoms**: Getting errors about missing or invalid API keys
**Solutions**:
1. Verify environment variable is set correctly:
   ```bash
   echo $ANTHROPIC_API_KEY  # or OPENAI_API_KEY, etc.
   ```
2. Ensure no extra spaces or quotes:
   ```bash
   export ANTHROPIC_API_KEY=your-actual-key-without-spaces
   ```
3. Check for typos in the key
4. Verify the API key is still valid in your provider's dashboard
5. Try using the `--key` option directly:
   ```bash
   ultra-dex generate "idea" --key your-key-here
   ```

### Problem: Rate Limiting
**Symptoms**: Commands fail with rate limit exceeded errors
**Solutions**:
1. Check your provider's rate limits in their dashboard
2. Add delays between requests if running multiple commands
3. Upgrade your API plan if limits are too restrictive
4. Use different API keys if you have multiple accounts

## Command Issues

### Problem: `ultra-dex init` Fails
**Symptoms**: Initialization fails with various errors
**Solutions**:
1. Check current directory permissions:
   ```bash
   ls -la .
   ```
2. Ensure the directory is empty or you're OK with overwriting files
3. Verify you have write permissions to the target directory
4. Try initializing in a different directory:
   ```bash
   mkdir new-project && cd new-project
   ultra-dex init
   ```

### Problem: `ultra-dex generate` Hangs
**Symptoms**: Command runs indefinitely without completing
**Solutions**:
1. Check your internet connection
2. Verify API key is valid and has sufficient credits
3. Try with a simpler idea description
4. Use the `--no-stream` option:
   ```bash
   ultra-dex generate "simple idea" --no-stream
   ```
5. Check provider status pages for service outages

### Problem: `ultra-dex serve` Port Already in Use
**Symptoms**: Server fails to start with port binding error
**Solutions**:
1. Check what's using the port:
   ```bash
   lsof -i :3001  # or whatever port is in use
   ```
2. Kill the process using the port:
   ```bash
   kill -9 PID  # replace PID with actual process ID
   ```
3. Use a different port:
   ```bash
   ultra-dex serve --port 3002
   ```

### Problem: Commands Fail Due to Missing Files
**Symptoms**: Commands fail because required files don't exist
**Solutions**:
1. Ensure you're running commands from the correct project directory
2. Verify the project was initialized properly:
   ```bash
   ls -la IMPLEMENTATION-PLAN.md CONTEXT.md QUICK-START.md
   ```
3. Re-initialize if needed:
   ```bash
   ultra-dex init --preview  # to see what files are expected
   ```

## Performance Issues

### Problem: Slow Command Execution
**Symptoms**: Commands take much longer than expected
**Solutions**:
1. Check your internet connection speed
2. Verify API provider response times
3. Close other bandwidth-intensive applications
4. Check system resources (CPU, memory):
   ```bash
   top  # or htop if available
   ```
5. Increase Node.js memory limit if processing large files:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=8192"
   ultra-dex command
   ```

### Problem: High Memory Usage
**Symptoms**: System becomes sluggish or commands fail with memory errors
**Solutions**:
1. Monitor memory usage:
   ```bash
   ps aux | grep ultra-dex
   ```
2. Increase Node.js memory limit:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=8192"
   ```
3. Process smaller chunks of work at a time
4. Restart your terminal/shell to clear memory

### Problem: Graph Scanning Takes Too Long
**Symptoms**: Commands that involve graph analysis are slow
**Solutions**:
1. The system should now have better performance with the optimized graph.js
2. Exclude large directories from analysis:
   ```bash
   # The system automatically ignores node_modules, .git, dist, build, .next
   ```
3. Clear any cached data that might be corrupted

## Security Concerns

### Problem: Accidentally Committed API Keys
**Symptoms**: API keys visible in version control
**Solutions**:
1. Immediately revoke/regenerate the compromised API key
2. Remove from git history:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch PATH-TO-YOUR-FILE" \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. Add to .gitignore:
   ```bash
   echo ".env*" >> .gitignore
   echo "*.env*" >> .gitignore
   ```
4. Use environment variables instead of hardcoding

### Problem: File Access Security Issues
**Symptoms**: Errors about accessing files outside project directory
**Solutions**:
1. This is intentional security behavior - the system prevents path traversal
2. Ensure all file paths are relative to project root
3. Don't use `../` or absolute paths in your inputs

## Advanced Troubleshooting

### Debug Mode
Enable debug output for detailed information:
```bash
DEBUG=true ultra-dex command
```

### Log Files
Check the log file for detailed error information:
```bash
cat .ultra-dex/logs/ultra-dex.log
```

### Configuration Issues
Check current configuration:
```bash
ultra-dex config --show
```

### Network Issues
Test connectivity to AI providers:
```bash
curl -I https://api.anthropic.com/  # or appropriate API endpoint
```

### Clear All Caches
If experiencing persistent issues:
```bash
rm -rf .ultra-dex/  # Removes local cache
rm -rf .cache/      # If any cache directories exist
```

## Common Solutions

### Quick Fixes to Try First
1. Update Ultra-Dex:
   ```bash
   npm update -g ultra-dex
   ```
2. Verify installation:
   ```bash
   ultra-dex --version
   ```
3. Check API keys:
   ```bash
   echo $ANTHROPIC_API_KEY
   ```
4. Verify project initialization:
   ```bash
   ls -la IMPLEMENTATION-PLAN.md CONTEXT.md QUICK-START.md
   ```
5. Restart your terminal/shell

### Environment Setup Checklist
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] API keys set as environment variables
- [ ] Proper directory permissions
- [ ] Internet connectivity
- [ ] No corporate firewall blocking API access

### When Nothing Else Works
1. Create a minimal reproduction case
2. Check the GitHub issues for similar problems
3. Create a new issue with detailed information:
   - Ultra-Dex version
   - Node.js version (`node --version`)
   - Operating system
   - Exact command that failed
   - Full error message
   - Debug output if available