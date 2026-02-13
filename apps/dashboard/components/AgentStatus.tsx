import React from 'react';

const AgentStatus = ({ agents = [] }) => {
  // Sample agent data if none provided
  const agentList = agents.length > 0 ? agents : [
    { id: 'planner', name: 'Project Planner', status: 'active', tasks: 2, lastActive: '2 min ago' },
    { id: 'cto', name: 'System Architect', status: 'idle', tasks: 0, lastActive: '5 min ago' },
    { id: 'backend', name: 'Backend Developer', status: 'active', tasks: 1, lastActive: '1 min ago' },
    { id: 'frontend', name: 'Frontend Developer', status: 'error', tasks: 0, lastActive: '10 min ago' },
    { id: 'reviewer', name: 'Code Reviewer', status: 'active', tasks: 3, lastActive: '30 sec ago' },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {agentList.map((agent) => (
          <li key={agent.id} className="py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
              </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {agent.id}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <p className="text-sm text-gray-500">{agent.status}</p>
                  <span className="mx-2 text-gray-300">•</span>
                  <p className="text-sm text-gray-500">{agent.tasks} tasks</p>
                  <span className="mx-2 text-gray-300">•</span>
                  <p className="text-sm text-gray-500">Last: {agent.lastActive}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AgentStatus;