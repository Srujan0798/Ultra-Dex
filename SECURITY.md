# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security concerns to the maintainer
3. Include detailed steps to reproduce
4. Allow up to 48 hours for initial response

## Security Best Practices

When using Ultra-Dex:

- **API Keys**: Never commit API keys. Use environment variables.
- **Generated Plans**: Review AI-generated content before implementation.
- **Dependencies**: Keep dependencies updated with `npm audit fix`.

## Known Considerations

- The `generate` command sends your idea to external AI APIs (Claude, OpenAI, Gemini)
- The `serve` command exposes project context over HTTP - use only in trusted networks
- Generated code should be reviewed before production use
