import { memo, useEffect, useState } from 'react';
import { fetchTraces, fetchTrace, type Trace } from '../lib/api';

export const Traces = memo(function Traces() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraces();
  }, []);

  const loadTraces = async () => {
    try {
      const fetchedTraces = await fetchTraces(20);
      setTraces(fetchedTraces);
    } catch (error) {
      console.error('Failed to load traces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrace = async (traceId: string) => {
    try {
      const trace = await fetchTrace(traceId);
      setSelectedTrace(trace);
    } catch (error) {
      console.error('Failed to load trace:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading traces...</div>;
  }

  return (
    <main className="space-y-6" role="main" aria-label="Traces Dashboard">
      <h1 className="text-2xl font-semibold text-slate-100">Trace Visualization</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent Traces</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {traces.map((trace) => (
              <div
                key={trace.id}
                onClick={() => handleSelectTrace(trace.id)}
                className="p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-slate-100 font-medium">{trace.id}</div>
                    <div className="text-sm text-slate-400">Task: {trace.taskId}</div>
                    <div className="text-sm text-slate-400">Agent: {trace.agentId}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm px-2 py-1 rounded ${
                        trace.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : trace.status === 'running'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {trace.status}
                    </div>
                    {trace.duration && (
                      <div className="text-xs text-slate-500">{trace.duration}ms</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Trace Details</h2>
          {selectedTrace ? (
            <div className="space-y-4">
              <div>
                <div className="text-slate-100 font-medium">{selectedTrace.id}</div>
                <div className="text-sm text-slate-400">
                  Started: {new Date(selectedTrace.startTime).toLocaleString()}
                </div>
                {selectedTrace.endTime && (
                  <div className="text-sm text-slate-400">
                    Ended: {new Date(selectedTrace.endTime).toLocaleString()}
                  </div>
                )}
                <div className="text-sm text-slate-400">
                  Duration: {selectedTrace.duration || 'N/A'} ms
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Events</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedTrace.events.map((event, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-800/50 rounded border-l-2 border-emerald-500"
                    >
                      <div className="text-xs text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-slate-100">{event.event}</div>
                      <pre className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-8">Select a trace to view details</div>
          )}
        </section>
      </div>
    </main>
  );
});
