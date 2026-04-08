import React, { useEffect, useState } from 'react';

interface Usage {
  requests: number;
  tokens: number;
  tier: {
    name: string;
    limits: {
      requestsPerMonth: number;
      tokensPerMonth: number;
    };
  };
  withinLimits: boolean;
}

export const UsageDashboard: React.FC = () => {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    fetch('/api/billing/usage', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsage(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading usage...</div>;
  if (!usage) return <div>No usage data</div>;

  const requestLimit = usage.tier.limits.requestsPerMonth;
  const tokenLimit = usage.tier.limits.tokensPerMonth;
  
  const requestPercent = requestLimit > 0 ? (usage.requests / requestLimit) * 100 : 0;
  const tokenPercent = tokenLimit > 0 ? (usage.tokens / tokenLimit) * 100 : 0;

  return (
    <div className="usage-dashboard">
      <h2>Usage This Month</h2>
      <div className="tier-badge">{usage.tier.name} Plan</div>
      
      <div className="usage-item">
        <label>Requests</label>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${Math.min(requestPercent, 100)}%` }}></div>
        </div>
        <span>{usage.requests.toLocaleString()} / {requestLimit > 0 ? requestLimit.toLocaleString() : 'Unlimited'}</span>
      </div>
      
      <div className="usage-item">
        <label>Tokens</label>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${Math.min(tokenPercent, 100)}%` }}></div>
        </div>
        <span>{usage.tokens.toLocaleString()} / {tokenLimit > 0 ? tokenLimit.toLocaleString() : 'Unlimited'}</span>
      </div>
      
      {!usage.withinLimits && (
        <div className="warning">
          ⚠️ You've exceeded your plan limits. Please upgrade.
        </div>
      )}
    </div>
  );
};
