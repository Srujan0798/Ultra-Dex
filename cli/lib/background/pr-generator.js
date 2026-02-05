import { randomUUID } from 'node:crypto';

export function generatePullRequest(ticket) {
  const id = randomUUID();
  const title = ticket?.title || 'Automated update';
  const branch = `auto/${ticket?.key || id.slice(0, 8)}`;
  const body = `## Summary\n\n${ticket?.description || 'Automated changes'}\n\n## Checklist\n- [ ] Tests updated\n- [ ] Docs updated\n`;

  return {
    id,
    title,
    branch,
    body,
    reviewers: ticket?.reviewers || []
  };
}
