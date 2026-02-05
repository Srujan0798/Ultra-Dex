export const AUTONOMOUS_GATES = [
  { id: 'architecture', description: 'Architecture approval required' },
  { id: 'security', description: 'Security review required' },
  { id: 'deploy', description: 'Deploy confirmation required' }
];

export function requireGateApproval(gateId, approvals = []) {
  return approvals.includes(gateId);
}
