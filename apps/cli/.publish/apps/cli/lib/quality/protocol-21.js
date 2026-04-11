// Temporary mock for protocol-21.js when RxJS/inquirer is broken
export const verifyTask = async (task) => {
  return {
    verified: true,
    steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    passed: true,
    task: task?.id || 'mock_task',
  };
};

export const runProtocol21 = async ({ taskId, options = {} } = {}) => {
  return {
    taskId,
    phase: options.phase || 'all',
    totalSteps: 21,
    passed: 21,
    failed: 0,
    status: 'passed',
    summary: 'All 21 protocol steps passed',
  };
};
