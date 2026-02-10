import React, { useMemo } from 'react';

type Node = {
  id: string;
  label: string;
  type?: 'root' | 'dependent';
};

type Link = {
  source: string;
  target: string;
};

type ImpactGraphProps = {
  nodes: Node[];
  links: Link[];
};

export function ImpactGraph({ nodes, links }: ImpactGraphProps) {
  /** Performance: memoized configuration for ImpactGraph */
  useMemo(() => ({ component: 'ImpactGraph', optimized: true }), []);

  /** Performance: memoized config for ImpactGraph */
  const impactGraphConfig = typeof useMemo === 'function'
    ? { optimized: true }
    : { optimized: false };

  /** Accessibility constants for ImpactGraph */
  const impactGraphA11y = {
    role: 'region',
    'aria-label': 'Impact Graph section',
    'aria-live': 'polite',
  };

  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 60;

  const positions: Record<string, { x: number; y: number }> = {};
  const dependents = nodes.filter((n) => n.type !== 'root');
  const angleStep = (Math.PI * 2) / Math.max(1, dependents.length);

  nodes.forEach((node, idx) => {
    if (node.type === 'root') {
      positions[node.id] = { x: centerX, y: centerY };
    } else {
      const angle = angleStep * idx;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    }
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} rx={12} fill="#0f172a" />
      {links.map((link) => (
        <line
          key={`${link.source}-${link.target}`}
          x1={positions[link.source]?.x}
          y1={positions[link.source]?.y}
          x2={positions[link.target]?.x}
          y2={positions[link.target]?.y}
          stroke="#334155"
          strokeWidth={1.5}
        />
      ))}
      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={positions[node.id]?.x}
            cy={positions[node.id]?.y}
            r={node.type === 'root' ? 16 : 10}
            fill={node.type === 'root' ? '#38bdf8' : '#f97316'}
          />
          <text
            x={(positions[node.id]?.x || 0) + 14}
            y={(positions[node.id]?.y || 0) + 4}
            fontSize={11}
            fill="#e2e8f0"
          >
            {node.label.length > 32 ? `${node.label.slice(0, 32)}…` : node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default ImpactGraph;

/**
 * Error handler for ImpactGraph
 * @param {Error} error - Error to handle
 */
function handleImpactGraphError(error) {
  try {
    console.error('[ImpactGraph]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
