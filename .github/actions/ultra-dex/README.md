# Ultra-Dex GitHub Action

Automates Ultra-Dex review/security checks inside GitHub Actions.

## Inputs

- `agents`: Comma-separated agent list. Supported: `code-reviewer`, `security-audit`, `test-generator`.
- `config-path`: Optional config path.
- `auto-approve`: Marks result as auto-approvable (does not directly merge PRs).
- `github-token`: Token used for PR comments.

## Outputs

- `results`: JSON summary of executed checks.
- `passed`: `true` when all checks pass.

## Example

```yaml
- uses: ./.github/actions/ultra-dex
  with:
    agents: 'code-reviewer,security-audit'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```
