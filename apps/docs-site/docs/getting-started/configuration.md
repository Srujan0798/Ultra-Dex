# Configuration

Ultra-Dex uses a hierarchical configuration system that allows you to customize behavior at different levels.

## Configuration Files

Ultra-Dex looks for configuration in the following locations (in order of precedence):

1. **Project Level**: `.ultra-dex/config.json` (in your project directory)
2. **User Level**: `~/.ultra-dex/config.json` (applies to all projects for the current user)
3. **Global Level**: Built-in defaults

### Project Configuration

Create a project-specific configuration:

```bash
# Initialize project config
ultra-dex config init
```

Or manually create `.ultra-dex/config.json`:

```json
{
  "ai": {
    "provider": "openai",
    "model": "gpt-4-turbo",
    "temperature": 0.7
  },
  "project": {
    "name": "my-awesome-project",
    "type": "web-application",
    "language": "javascript"
  },
  "integrations": {
    "github": {
      "autoCommit": true,
      "branchPrefix": "feature/"
    }
  },
  "verification": {
    "strictMode": false,
    "requireTests": true
  }
}
```

### User Configuration

Set user-wide preferences in `~/.ultra-dex/config.json`:

```json
{
  "ai": {
    "provider": "anthropic",
    "model": "claude-3-opus-20240229",
    "apiKey": "env:ANTHROPIC_API_KEY"
  },
  "theme": "dark",
  "notifications": {
    "enabled": true,
    "email": "user@example.com"
  }
}
```

## Environment Variables

Ultra-Dex recognizes the following environment variables:

```env
# AI Provider Configuration
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...

# Ultra-Dex Specific
ULTRA_DEX_THEME=dark|light
ULTRA_DEX_PROVIDER=openai|anthropic|google
ULTRA_DEX_MODEL=gpt-4-turbo|claude-3-opus-20240229
ULTRA_DEX_DEBUG=true

# Integration Keys
GITHUB_TOKEN=ghp_...
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

## Command Line Configuration

View current configuration:

```bash
# Show effective configuration
ultra-dex config show

# Get specific value
ultra-dex config get ai.model

# Set configuration value
ultra-dex config set ai.temperature 0.5
```

## Configuration Schema

### AI Settings

```json
{
  "ai": {
    "provider": "openai|anthropic|google|azure-openai",
    "model": "gpt-4-turbo|claude-3-opus-20240229|...",
    "temperature": 0.0-1.0,
    "maxTokens": 4096,
    "topP": 1.0,
    "frequencyPenalty": 0.0,
    "presencePenalty": 0.0
  }
}
```

### Project Settings

```json
{
  "project": {
    "name": "string",
    "type": "web-application|mobile-app|api-service|library",
    "language": "javascript|python|go|rust|typescript",
    "framework": "react|vue|angular|express|fastapi|...",
    "architecture": "monolith|microservices|serverless"
  }
}
```

### Integration Settings

```json
{
  "integrations": {
    "github": {
      "autoCommit": true,
      "branchPrefix": "feature/",
      "prTemplate": ".github/PULL_REQUEST_TEMPLATE.md"
    },
    "slack": {
      "notifications": true,
      "channel": "#development"
    }
  }
}
```

## Best Practices

1. **Keep sensitive data out of config files** - Use environment variables for API keys
2. **Use project configs for project-specific settings** - Like framework choice or team preferences
3. **Use user configs for personal preferences** - Like theme or notification settings
4. **Document custom configurations** - Add comments to explain non-obvious settings
5. **Validate configurations** - Use `ultra-dex config validate` to check for errors