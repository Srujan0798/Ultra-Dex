export async function checkPerformance(diffText = '') {
  const issues = [];
  if (diffText.includes('for (') && diffText.includes('await')) {
    issues.push({ severity: 'medium', message: 'Potential sequential awaits inside loop.' });
  }
  if (diffText.includes('SELECT *')) {
    issues.push({ severity: 'low', message: 'Avoid SELECT * in queries.' });
  }
  return { ok: issues.length === 0, issues };
}
