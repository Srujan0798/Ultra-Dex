// Copyright (c) 2026 Ultra-Dex

// cli/lib/utils/agents.js
export const agents = {
  // Leadership Tier
  cto: { name: 'Chief Architect', emoji: '📐', tagline: 'Defining system architecture' },
  planner: { name: 'Product Planner', emoji: '📋', tagline: 'breaking down requirements' },
  research: { name: 'Research Analyst', emoji: '🔍', tagline: 'Analyzing patterns' },

  // Development Tier
  backend: { name: 'Backend Engineer', emoji: '⚙️', tagline: 'Building API services' },
  frontend: { name: 'Frontend Engineer', emoji: '🎨', tagline: 'Crafting user interfaces' },
  database: { name: 'Data Architect', emoji: '💾', tagline: 'Optimizing schema' },

  // Security Tier
  auth: { name: 'Security Engineer', emoji: '🔒', tagline: 'Securing access' },
  security: { name: 'Security Auditor', emoji: '🛡️', tagline: 'Auditing vulnerabilities' },

  // DevOps Tier
  devops: { name: 'DevOps Engineer', emoji: '🚀', tagline: 'Managing deployment' },

  // Quality Tier
  testing: { name: 'QA Engineer', emoji: '🧪', tagline: 'Ensuring quality' },
  documentation: { name: 'Tech Writer', emoji: '📝', tagline: 'Documenting systems' },
  reviewer: { name: 'Code Reviewer', emoji: '👀', tagline: 'Reviewing code quality' },
  debugger: { name: 'Debug Specialist', emoji: '🐛', tagline: 'Resolving issues' },

  // Specialist Tier
  performance: { name: 'Performance Engineer', emoji: '⚡', tagline: 'Optimizing speed' },
  refactoring: { name: 'Refactoring Specialist', emoji: '♻️', tagline: 'Improving code structure' },
};

// For compatibility if swarm.js imports avengersAgents
export const avengersAgents = agents;
