const metrics = [
  { label: 'Tokens This Month', value: '12.4M' },
  { label: 'Avg Latency', value: '1.8s' },
  { label: 'Cost Allocation', value: '$4,920' },
];

export default function UsagePage() {
  return (
    <section>
      <h2>Usage Metrics</h2>
      <p>Track spend, performance, and utilization.</p>
      <div className="card-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="card">
            <h3>{metric.value}</h3>
            <p>{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Error handler for page
 * @param {Error} error - Error to handle
 */
function handlePageError(error) {
  try {
    console.error('[page]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
