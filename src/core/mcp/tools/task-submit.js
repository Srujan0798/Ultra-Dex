function normalizePriority(priority = 'medium') {
  return ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
}

export function createTaskSubmitTool({ manager }) {
  return {
    name: 'task-submit',
    description: 'Submit a task to the Ultra-Dex orchestrator queue.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['task'],
      properties: {
        task: {
          type: 'string',
          description: 'Task description to enqueue.',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Optional task priority.',
        },
        agentPreference: {
          type: 'string',
          description: 'Optional preferred agent id.',
        },
      },
    },
    async handler({ task, priority = 'medium', agentPreference } = {}) {
      if (!task || typeof task !== 'string') {
        throw new Error('task is required');
      }

      const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const queuedTask = {
        id: taskId,
        task,
        priority: normalizePriority(priority),
        agentPreference: agentPreference || null,
        createdAt: new Date().toISOString(),
      };

      manager.taskQueue.push(queuedTask);
      manager.emit?.('task:queued', queuedTask);

      return {
        taskId,
        status: 'queued',
        estimatedStart: new Date(Date.now() + (manager.taskQueue.length - 1) * 30000).toISOString(),
      };
    },
  };
}

export default createTaskSubmitTool;
