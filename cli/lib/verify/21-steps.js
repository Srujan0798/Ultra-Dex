export const VERIFICATION_STEPS = [
  { id: 1, phase: 'Planning', name: 'Atomic Scope Defined' },
  { id: 2, phase: 'Planning', name: 'Context Loaded' },
  { id: 3, phase: 'Planning', name: 'Architecture Alignment' },
  { id: 4, phase: 'Planning', name: 'Security Patterns Applied' },
  { id: 5, phase: 'Implementation', name: 'Type Safety Check' },
  { id: 6, phase: 'Implementation', name: 'Error Handling Strategy' },
  { id: 7, phase: 'Implementation', name: 'API Documentation Updated' },
  { id: 8, phase: 'Implementation', name: 'Database Schema Verified' },
  { id: 9, phase: 'Implementation', name: 'Environment Variables Set' },
  { id: 10, phase: 'Quality', name: 'Implementation Complete' },
  { id: 11, phase: 'Quality', name: 'Console Logs Removed' },
  { id: 12, phase: 'Quality', name: 'Edge Cases Handled' },
  { id: 13, phase: 'Quality', name: 'Performance Check' },
  { id: 14, phase: 'Quality', name: 'Accessibility Check' },
  { id: 15, phase: 'Security', name: 'Cross-browser Check' },
  { id: 16, phase: 'Security', name: 'Unit Tests Passed' },
  { id: 17, phase: 'Security', name: 'Integration Tests Passed' },
  { id: 18, phase: 'Documentation', name: 'Linting & Formatting' },
  { id: 19, phase: 'Documentation', name: 'Code Review Approved' },
  { id: 20, phase: 'Documentation', name: 'Migration Scripts Ready' },
  { id: 21, phase: 'Final', name: 'Deployment Readiness' }
];

export function summarizeSteps() {
  const phases = {};
  VERIFICATION_STEPS.forEach(step => {
    phases[step.phase] = phases[step.phase] || [];
    phases[step.phase].push(step);
  });
  return phases;
}
