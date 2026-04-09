import React, { useEffect, useState } from 'react';

interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export const PricingTable: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState('free');

  useEffect(() => {
    fetch('/api/billing/pricing')
      .then((res) => res.json())
      .then((data) => {
        setTiers(data);
        setLoading(false);
      });

    // Get current user tier
    const token = localStorage.getItem('session_token');
    if (token) {
      fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCurrentTier(data.tier));
    }
  }, []);

  const handleSubscribe = async (tierId: string) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tierId }),
    });

    if (res.ok) {
      alert('Subscription updated!');
      window.location.reload();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="pricing-table">
      <h2>Choose Your Plan</h2>
      <div className="tiers">
        {tiers.map((tier) => (
          <div key={tier.id} className={`tier ${tier.id === currentTier ? 'current' : ''}`}>
            <h3>{tier.name}</h3>
            <div className="price">
              ${tier.price / 100}
              <span>/month</span>
            </div>
            <p>{tier.description}</p>
            <ul>
              {tier.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            {tier.id === currentTier ? (
              <button disabled>Current Plan</button>
            ) : (
              <button onClick={() => handleSubscribe(tier.id)}>
                {tier.price === 0 ? 'Get Started' : 'Upgrade'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
