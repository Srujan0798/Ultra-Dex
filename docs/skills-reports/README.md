# Skills Reports

> Generated outputs from running Claude plugin skills against the Ultra-Dex project.
> For skill definitions and descriptions, see `docs/skills/`.

## Contents

| Plugin | Reports | Status |
|--------|---------|--------|
| Engineering | 22 | Generated |
| Product Management | 14 | Generated |
| Data | 10 | Generated |
| Design | 10 | Generated |
| Marketing | 10 | Generated |
| Enterprise Search | 6 | Generated |
| Productivity | 5 | Generated |

**Total:** 77 report documents

## Structure

Each folder contains the actual output documents from running that plugin's skills:

```
skills-reports/
  engineering/        # ADRs, code reviews, debug analysis, deploy checklists
  product-management/ # Roadmap, sprint plans, specs, stakeholder updates
  data/               # Analysis reports, dashboards, queries, validation
  design/             # Accessibility audits, critiques, handoff specs
  marketing/          # Brand review, campaigns, SEO audit, content
  enterprise-search/  # Search queries, digests, knowledge synthesis
  productivity/       # Task management, memory system, sync updates
```

## Notes

- Reports are point-in-time outputs — they reflect the project state when generated
- Skill definitions live in `docs/skills/` (not here)
- To generate new reports, run the corresponding skill against the current project
