export function summarizeFindings({ metadata, security, performance }) {
  const issues = [...security.issues, ...performance.issues];
  return {
    ...metadata,
    ok: issues.length === 0,
    issues,
    summary: issues.length === 0
      ? '✅ No critical findings.'
      : `⚠️ ${issues.length} issues detected.`
  };
}
