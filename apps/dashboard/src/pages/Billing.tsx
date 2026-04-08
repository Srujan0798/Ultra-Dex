import { memo, useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

interface UsageMetric {
  label: string;
  used: number;
  limit: number;
  suffix?: string;
}

interface Invoice {
  date: string;
  amount: number;
  status: string;
  pdfUrl?: string;
}

interface UsageResponse {
  requests?: number;
  tokens?: number;
  agents?: number;
  tier?: {
    id?: string;
    name?: string;
    price?: number;
    limits?: {
      requestsPerMonth?: number;
      tokensPerMonth?: number;
      agents?: number;
    };
  };
  subscription?: {
    currentPeriodEnd?: string;
    status?: string;
  };
}

function usageColor(percent: number): string {
  if (percent < 50) return 'bg-emerald-500';
  if (percent < 80) return 'bg-yellow-500';
  return 'bg-red-500';
}

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export const Billing = memo(function Billing() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'checkout' | 'portal' | null>(null);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('session_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [usageRes, invoiceRes] = await Promise.all([
          fetch(`${API_BASE}/api/billing/usage`, { headers }),
          fetch(`${API_BASE}/api/billing/invoices`, { headers }),
        ]);

        const usageData = usageRes.ok ? ((await usageRes.json()) as UsageResponse) : null;
        const invoiceData = invoiceRes.ok ? ((await invoiceRes.json()) as Invoice[] | { invoices?: Invoice[] }) : [];

        if (!mounted) return;

        setUsage(usageData || {});
        setInvoices(Array.isArray(invoiceData) ? invoiceData : invoiceData.invoices || []);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : String(loadError));
        setUsage({});
        setInvoices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const planName = usage?.tier?.name || 'Free';
  const planPrice = usage?.tier?.price ? `$${Math.floor(usage.tier.price / 100)}/mo` : '$0/mo';
  const renewalDate = usage?.subscription?.currentPeriodEnd
    ? new Date(usage.subscription.currentPeriodEnd).toLocaleDateString()
    : 'N/A';
  const status = usage?.subscription?.status || 'active';

  const metrics = useMemo<UsageMetric[]>(() => {
    const requestLimit = usage?.tier?.limits?.requestsPerMonth ?? 100;
    const tokenLimit = usage?.tier?.limits?.tokensPerMonth ?? 10000;
    const agentLimit = usage?.tier?.limits?.agents ?? 3;

    return [
      { label: 'Requests', used: usage?.requests ?? 0, limit: requestLimit },
      { label: 'Tokens', used: usage?.tokens ?? 0, limit: tokenLimit },
      { label: 'Agents', used: usage?.agents ?? 0, limit: agentLimit },
    ];
  }, [usage]);

  const startCheckout = async () => {
    setBusyAction('checkout');
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tierId: 'pro' }),
      });

      if (!response.ok) throw new Error('Checkout request failed');
      const data = (await response.json()) as { url?: string; checkoutUrl?: string };
      const target = data.url || data.checkoutUrl;
      if (!target) throw new Error('Checkout URL missing');
      window.location.href = target;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : String(checkoutError));
    } finally {
      setBusyAction(null);
    }
  };

  const openPortal = async () => {
    setBusyAction('portal');
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE}/api/billing/portal`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error('Portal request failed');
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error('Portal URL missing');
      window.location.href = data.url;
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : String(portalError));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <p className="mt-2 text-3xl font-bold">{planName}</p>
            <p className="text-slate-300">{planPrice}</p>
            <p className="mt-1 text-sm text-slate-400">Renewal date: {renewalDate}</p>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            {status}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={busyAction !== null}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {busyAction === 'checkout' ? 'Opening...' : 'Upgrade'}
          </button>
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={busyAction !== null}
            className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:border-slate-500 disabled:opacity-50"
          >
            {busyAction === 'portal' ? 'Opening...' : 'Manage subscription'}
          </button>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold">Usage</h2>
        <div className="mt-4 space-y-4">
          {metrics.map((metric) => {
            const percent = usagePercent(metric.used, metric.limit);
            const barColor = usageColor(percent);
            const limitLabel = metric.limit <= 0 ? 'Unlimited' : metric.limit.toLocaleString();
            return (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{metric.label}</span>
                  <span className="text-slate-300">
                    {metric.used.toLocaleString()} / {limitLabel}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold">Invoices</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Loading invoices...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">PDF</th>
                </tr>
              </thead>
              <tbody className="text-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-slate-400">
                      No invoices yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice, index) => (
                    <tr key={`${invoice.date}-${index}`} className="border-t border-slate-800">
                      <td className="py-3">{new Date(invoice.date).toLocaleDateString()}</td>
                      <td className="py-3">${(invoice.amount / 100).toFixed(2)}</td>
                      <td className="py-3 capitalize">{invoice.status}</td>
                      <td className="py-3">
                        {invoice.pdfUrl ? (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-300 hover:text-emerald-200"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
});
