# GitHub Compliance Checklist

Last reviewed: February 12, 2026

This checklist helps keep contributions aligned with GitHub policy, project ethics,
and legal hygiene. It is operational guidance, not legal advice.

## Official Sources

- GitHub Status: https://www.githubstatus.com/
- Terms of Service:
  https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- Acceptable Use Policies:
  https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies
- General Privacy Statement:
  https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement
- Community Guidelines:
  https://docs.github.com/en/site-policy/github-terms/github-community-guidelines
- Trade Controls:
  https://docs.github.com/en/site-policy/other-site-policies/github-and-trade-controls
- DMCA Takedown Policy:
  https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy

## Before Every Commit

1. No secrets, keys, passwords, or private tokens in tracked files.
2. No personal data or confidential customer data without explicit authorization.
3. New dependencies and assets are license-compatible with MIT distribution.
4. Content does not violate GitHub acceptable-use restrictions.
5. Security-impacting changes include tests and safe defaults.
6. Changes are truthful, attributable, and not plagiarized.
7. If GitHub is degraded, avoid risky release operations until status is green.
8. Never add bulk/spam automation against GitHub users/issues/PRs.
9. Do not scrape GitHub domains unless explicitly approved and documented.

## Before Every Merge

1. CI checks are passing.
2. Reviewer confirms policy checklist items above.
3. Security-impacting changes are reviewed by a maintainer.
4. Release notes avoid exposing sensitive internal details.

## Enforced Commands

- Full local release gate:
  `npm run gate:local`
- Full push gate:
  `npm run gate:push`
- Manual guard run:
  `npm run guard:github`
- Manual local-only guard run (during suspension/local workflow):
  `npm run guard:github:local`
- Pre-push guard runs automatically via `.husky/pre-push`.
