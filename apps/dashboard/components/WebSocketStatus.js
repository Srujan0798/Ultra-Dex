// apps/dashboard/components/WebSocketStatus.js
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 as Loader, Clock } from 'lucide-react';

export function WebSocketStatus() {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [connectionTime, setConnectionTime] = useState(new Date());

  useEffect(() => {
    // Simulate WebSocket connection status
    const timer = setInterval(() => {
      // In a real implementation, this would connect to actual WebSocket
      const statuses = ['connected', 'connected', 'connected', 'connecting'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setConnectionStatus(randomStatus);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getConnectionClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'connecting':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'disconnected':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div className="px-6 py-2 bg-slate-800/50 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getConnectionIcon()}
          <span className={`text-sm font-medium ${getConnectionClass()} px-2 py-1 rounded`}>
            {getConnectionText()}
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Last updated: {connectionTime.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
