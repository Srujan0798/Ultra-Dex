import React from 'react';
import styles from './styles.module.css';

const features = [
  {
    title: 'Multi-Provider Routing',
    icon: '\u2B21',
    accent: '#00d4ff',
    description:
      '13+ AI providers with intelligent routing. SmartRouter selects by cost, latency, or quality — with automatic fallback chains.',
  },
  {
    title: 'Agent Swarms',
    icon: '\u29BF',
    accent: '#10b981',
    description:
      '9 specialized agent roles coordinate via DAG-based task graphs. Planner, Backend, Frontend, CTO, Reviewer, and more.',
  },
  {
    title: 'DexGraph Engine',
    icon: '\u2B22',
    accent: '#ff9900',
    description:
      'DAG workflow orchestration with topological execution, cycle detection, conditional branching, and real-time progress tracking.',
  },
  {
    title: 'Persistent Memory',
    icon: '\u2BC1',
    accent: '#a78bfa',
    description:
      'Three-tier memory system — instant, session, persistent. Vector-based semantic search with automatic knowledge graph storage.',
  },
  {
    title: 'Governance Layer',
    icon: '\u2B23',
    accent: '#f43f5e',
    description:
      'Policy enforcement on every task and tool execution. Audit logging, cost controls, and DeniedException for violations.',
  },
  {
    title: 'MCP Protocol',
    icon: '\u2B2C',
    accent: '#06b6d4',
    description:
      'Native Model Context Protocol server with tool registry. Works with Cursor, Claude Desktop, and any MCP-compatible client.',
  },
];

function FeatureCard({ title, icon, accent, description }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardIcon} style={{ color: accent }}>
        {icon}
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
      <div className={styles.cardAccent} style={{ background: accent }} />
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>CAPABILITIES</span>
        <h2 className={styles.sectionTitle}>Built for production AI workloads</h2>
      </div>
      <div className={styles.grid}>
        {features.map((feature, idx) => (
          <FeatureCard key={idx} {...feature} />
        ))}
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>13+</span>
          <span className={styles.statLabel}>AI Providers</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>9</span>
          <span className={styles.statLabel}>Agent Roles</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>350+</span>
          <span className={styles.statLabel}>Tests Passing</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>3</span>
          <span className={styles.statLabel}>npm Packages</span>
        </div>
      </div>
    </section>
  );
}
