const keys = [
  { label: 'Production', key: 'udx_live_••••••••••••', status: 'Active' },
  { label: 'Staging', key: 'udx_test_••••••••••••', status: 'Rotating' },
];

export default function ApiKeysPage() {
  return (
    <section>
      <h2>API Key Management</h2>
      <p>Issue, rotate, and revoke access tokens.</p>
      <div className="actions" style={{ margin: '16px 0' }}>
        <button className="button">Generate Key</button>
        <button className="button secondary">Rotate All</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Key</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((entry) => (
            <tr key={entry.label}>
              <td>{entry.label}</td>
              <td>{entry.key}</td>
              <td>{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
