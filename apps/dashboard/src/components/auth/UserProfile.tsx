import React, { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  tier: string;
  apiKey: string;
  usage: {
    requestsThisMonth: number;
    tokensThisMonth: number;
  };
}

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/profile', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('session_token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div className="user-profile">
      <h2>Welcome, {user.name}</h2>
      <div className="profile-section">
        <h3>Account</h3>
        <p>Email: {user.email}</p>
        <p>Plan: {user.tier}</p>
      </div>
      <div className="profile-section">
        <h3>API Key</h3>
        <code>{user.apiKey}</code>
      </div>
      <div className="profile-section">
        <h3>Usage This Month</h3>
        <p>Requests: {user.usage.requestsThisMonth}</p>
        <p>Tokens: {user.usage.tokensThisMonth}</p>
      </div>
    </div>
  );
};
