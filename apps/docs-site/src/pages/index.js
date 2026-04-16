import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          v2.1 LIVE
        </div>

        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>
          The AI orchestration meta-layer. Route tasks across 13+ providers,
          coordinate multi-agent swarms, and build with persistent memory.
        </p>

        <div className={styles.buttons}>
          <Link className={styles.btnPrimary} to="/docs/intro">
            Get Started
          </Link>
          <Link
            className={styles.btnSecondary}
            href="https://github.com/Srujan0798/Ultra-Dex"
          >
            View on GitHub
          </Link>
        </div>

        <div className={styles.codeSnippet}>
          <code>npm install @ultra-dex/sdk</code>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Docs"
      description="Ultra-Dex — AI orchestration meta-layer. Route tasks across 13+ providers, coordinate multi-agent swarms, persistent memory."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
