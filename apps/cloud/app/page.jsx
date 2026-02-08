export default function HomePage() {
  return (
    <section>
      <h2>Enterprise Command Center</h2>
      <p>Unified control plane for Ultra-Dex teams, billing, and compliance.</p>
      <div className="card-grid">
        <div className="card">
          <h3>SSO + SCIM</h3>
          <p>Manage identity providers and automate user provisioning.</p>
          <div className="badge">Connected: Okta</div>
        </div>
        <div className="card">
          <h3>Usage Analytics</h3>
          <p>Live agent consumption, token spend, and success rates.</p>
          <div className="badge">Last updated: just now</div>
        </div>
        <div className="card">
          <h3>Compliance Reports</h3>
          <p>Export audit logs and policy attestations in one click.</p>
          <div className="badge">SOC 2 Ready</div>
        </div>
      </div>
    </section>
  );
}
