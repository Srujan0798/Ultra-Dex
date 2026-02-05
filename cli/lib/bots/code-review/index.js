import { analyzeDiff, formatMarkdownReport } from './analyzer.js';
import { fetchPullRequestDiff } from './github.js';
import { fetchMergeRequestDiff } from './gitlab.js';

export async function reviewGitHubPR({ owner, repo, prNumber, token }) {
  const { diff } = await fetchPullRequestDiff(owner, repo, prNumber, token);
  const issues = analyzeDiff(diff);
  return { issues, report: formatMarkdownReport(issues) };
}

export async function reviewGitLabMR({ projectId, mrIid, token }) {
  const mr = await fetchMergeRequestDiff(projectId, mrIid, token);
  const diff = (mr.changes || []).map(change => change.diff).join('\n');
  const issues = analyzeDiff(diff);
  return { issues, report: formatMarkdownReport(issues) };
}

export default {
  reviewGitHubPR,
  reviewGitLabMR
};
