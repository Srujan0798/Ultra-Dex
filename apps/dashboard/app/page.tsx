import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Clock3,
  DollarSign,
  ShieldCheck,
  Signal,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { Bebas_Neue, IBM_Plex_Mono } from 'next/font/google';
import styles from './dashboard-home.module.css';

const displayFont = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dashboard-display',
});

const bodyFont = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-dashboard-body',
});

interface StatCard {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  note: string;
  icon: LucideIcon;
}

const KPI_STATS: StatCard[] = [
  {
    label: 'Active agents',
    value: '24',
    trend: '+3',
    trendDirection: 'up',
    note: 'vs previous shift',
    icon: Bot,
  },
  {
    label: 'Latency p95',
    value: '42ms',
    trend: '-6ms',
    trendDirection: 'up',
    note: 'routing optimization',
    icon: Clock3,
  },
  {
    label: 'Task success',
    value: '98.4%',
    trend: '+0.7%',
    trendDirection: 'up',
    note: 'stability window',
    icon: ShieldCheck,
  },
  {
    label: 'Burn rate',
    value: '$124.5',
    trend: '+4.1%',
    trendDirection: 'down',
    note: 'daily provider spend',
    icon: DollarSign,
  },
];

const THROUGHPUT = [
  { hour: '00', ingress: 42, completion: 40 },
  { hour: '03', ingress: 56, completion: 52 },
  { hour: '06', ingress: 64, completion: 62 },
  { hour: '09', ingress: 83, completion: 79 },
  { hour: '12', ingress: 88, completion: 82 },
  { hour: '15', ingress: 73, completion: 71 },
  { hour: '18', ingress: 61, completion: 58 },
  { hour: '21', ingress: 49, completion: 45 },
];

const PROVIDER_LOAD = [
  { name: 'Anthropic Sonnet', load: 78, quality: 'high', route: 'architecture + critique' },
  { name: 'GPT-5.3 Codex', load: 69, quality: 'high', route: 'implementation + refactor' },
  { name: 'Gemini 2.5 Pro', load: 41, quality: 'balanced', route: 'parallel analysis' },
  { name: 'Groq Llama', load: 33, quality: 'latency', route: 'quick transforms' },
];

const INCIDENT_TAPE = [
  {
    time: '09:42:17',
    title: 'Provider fallback engaged',
    detail: 'OpenAI latency spike detected; switched to Anthropic chain in 120ms.',
    severity: 'warning',
  },
  {
    time: '09:38:02',
    title: 'Memory write checkpoint',
    detail: 'Session graph persisted with 100% consistency.',
    severity: 'info',
  },
  {
    time: '09:31:44',
    title: 'CI gate passed',
    detail: 'Governance and unit tests completed for deployment candidate.',
    severity: 'success',
  },
];

export default function DashboardPage() {
  return (
    <section className={`${styles.dashboardShell} ${displayFont.variable} ${bodyFont.variable}`}>
      <div className={styles.atmosphere} aria-hidden="true" />

      <header className={styles.hero}>
        <div>
          <p className={styles.heroEyebrow}>NODE MAIN · LIVE ORCHESTRATION GRID</p>
          <h1 className={styles.heroTitle}>MISSION CONTROL</h1>
          <p className={styles.heroLead}>
            Ultra-Dex is routing multi-agent execution across providers in real time with deterministic
            governance and memory-backed recovery paths.
          </p>
        </div>

        <aside className={styles.heroMeta} aria-label="System snapshot">
          <div className={styles.signalPill}>
            <Signal size={14} />
            <span>Core Link Stable</span>
          </div>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Region</dt>
              <dd>us-east-1</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>Autonomous</dd>
            </div>
            <div>
              <dt>Queue</dt>
              <dd>187 tasks</dd>
            </div>
            <div>
              <dt>Uptime</dt>
              <dd>14d 09h</dd>
            </div>
          </dl>
        </aside>
      </header>

      <section className={styles.statGrid} aria-label="Key performance indicators">
        {KPI_STATS.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <div className={styles.statTop}>
              <p>{stat.label}</p>
              <stat.icon size={16} />
            </div>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statBottom}>
              <span
                className={
                  stat.trendDirection === 'up' ? styles.trendUp : styles.trendDown
                }
              >
                {stat.trendDirection === 'up' ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {stat.trend}
              </span>
              {stat.note}
            </p>
          </article>
        ))}
      </section>

      <section className={styles.deck}>
        <article className={styles.flowPanel}>
          <header className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                <Activity size={16} />
                Throughput Spectrum
              </h2>
              <p className={styles.panelSubtle}>Ingress vs completion · 24 hour scan</p>
            </div>
            <span className={styles.panelBadge}>Window: rolling 24h</span>
          </header>

          <div className={styles.legend}>
            <span>
              <i className={styles.legendIngress} aria-hidden="true" />
              ingress
            </span>
            <span>
              <i className={styles.legendCompletion} aria-hidden="true" />
              completion
            </span>
          </div>

          <div className={styles.bars} role="img" aria-label="Ingress and completion volume by hour">
            {THROUGHPUT.map((point, index) => (
              <div className={styles.barGroup} key={point.hour}>
                <div className={styles.barTrack}>
                  <span
                    className={styles.barIngress}
                    style={{ height: `${point.ingress}%`, animationDelay: `${index * 70}ms` }}
                  />
                  <span
                    className={styles.barCompletion}
                    style={{ height: `${point.completion}%`, animationDelay: `${index * 90}ms` }}
                  />
                </div>
                <span className={styles.barLabel}>{point.hour}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.providerPanel}>
          <header className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                <Workflow size={16} />
                Provider Load Routing
              </h2>
              <p className={styles.panelSubtle}>Cost-quality balancing in live traffic</p>
            </div>
          </header>

          <ul className={styles.providerList}>
            {PROVIDER_LOAD.map((provider) => (
              <li className={styles.providerItem} key={provider.name}>
                <div className={styles.providerTop}>
                  <p>{provider.name}</p>
                  <span>{provider.load}%</span>
                </div>
                <div className={styles.providerMeter} aria-hidden="true">
                  <span style={{ width: `${provider.load}%` }} />
                </div>
                <p className={styles.providerMeta}>
                  {provider.quality} priority · {provider.route}
                </p>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.eventsPanel}>
          <header className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                <AlertTriangle size={16} />
                Event Tape
              </h2>
              <p className={styles.panelSubtle}>Critical runtime updates and automated decisions</p>
            </div>
            <span className={styles.panelBadge}>
              <Sparkles size={12} />
              auto triage on
            </span>
          </header>

          <ul className={styles.eventList}>
            {INCIDENT_TAPE.map((event) => (
              <li className={styles.eventRow} key={`${event.time}-${event.title}`}>
                <time className={styles.eventTime}>{event.time}</time>
                <div>
                  <p className={styles.eventTitle}>{event.title}</p>
                  <p className={styles.eventDetail}>{event.detail}</p>
                </div>
                <span
                  className={`${styles.eventState} ${
                    event.severity === 'success'
                      ? styles.success
                      : event.severity === 'warning'
                        ? styles.warning
                        : styles.info
                  }`}
                >
                  {event.severity}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}
