export async function checkSecurity(diffText = '') {
  const issues = [];
  if (diffText.includes('eval(')) {
    issues.push({ severity: 'high', message: 'Avoid eval() usage.' });
  }
  if (diffText.includes('password') && diffText.includes('=')) {
    issues.push({ severity: 'medium', message: 'Potential hardcoded credential.' });
  }
  return { ok: issues.length === 0, issues };
}
