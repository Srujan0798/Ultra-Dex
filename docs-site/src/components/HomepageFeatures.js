import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'AI Orchestration',
    Svg: require('@site/static/img/ai-orchestration.svg').default,
    description: (
      <>
        Coordinate 18 specialized AI agents in 6 tiers to build complex applications
        with consistent architecture and quality standards.
      </>
    ),
  },
  {
    title: 'MCP Integration',
    Svg: require('@site/static/img/mcp-integration.svg').default,
    description: (
      <>
        Native support for Cursor, Claude Desktop, and other MCP-compatible tools
        for seamless AI-assisted development workflows.
      </>
    ),
  },
  {
    title: 'Verification Framework',
    Svg: require('@site/static/img/verification-framework.svg').default,
    description: (
      <>
        21-step verification process ensures production-ready quality with every
        AI-generated code change.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}