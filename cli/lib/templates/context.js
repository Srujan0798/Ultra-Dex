import { githubBlobUrl, githubWebUrl } from '../config/urls.js';

export const CONTEXT_TEMPLATE = `# {{PROJECT_NAME}} - Context

## Project Overview
**Name:** {{PROJECT_NAME}}
**Started:** {{DATE}}
**Status:** Planning

## Quick Summary
{{IDEA_WHAT}} for {{IDEA_FOR}}.

## Key Decisions
- Frontend: {{FRONTEND}}
- Database: {{DATABASE}}
- Auth: {{AUTH}}
- Payments: {{PAYMENTS}}
- Hosting: {{HOSTING}}

## Current Focus
Setting up the implementation plan.

## Resources
- [Ultra-Dex Template](${githubWebUrl()})
- [TaskFlow Example](${githubBlobUrl('@%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md')})
`;
