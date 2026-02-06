const plans = [
  { name: 'Starter', price: '$29/mo', status: 'Active' },
  { name: 'Enterprise', price: 'Custom', status: 'Upgrade' },
];

export default function BillingPage() {
  return (
    <section>
      <h2>Stripe Billing</h2>
      <p>Manage subscriptions and invoices.</p>
      <div className="card-grid">
        {plans.map((plan) => (
          <div key={plan.name} className="card">
            <h3>{plan.name}</h3>
            <p>{plan.price}</p>
            <button className="button">{plan.status}</button>
          </div>
        ))}
      </div>
    </section>
  );
}
