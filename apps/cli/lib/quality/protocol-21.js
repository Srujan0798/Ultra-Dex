// Temporary mock for protocol-21.js when RxJS/inquirer is broken
export const verifyTask = async (task) => {
  return { 
    verified: true, 
    steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], // Array of 21 steps
    passed: true, // Boolean instead of number
    task: task?.id || 'mock-task'
  };
};
