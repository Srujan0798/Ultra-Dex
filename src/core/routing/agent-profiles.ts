const AGENT_PROFILES = Object.freeze([
  {
    agentId: "frontend",
    capabilities: [
      "react",
      "vue",
      "css",
      "ui",
      "component",
      "animation",
      "accessibility",
      "html",
      "dom",
      "styling"
    ],
    examples: [
      "Create a responsive navigation bar",
      "Build a login form with validation",
      "Style this button with hover effects",
      "Make the modal dialog accessible",
      "Make the button bounce with a spring animation",
      "Polish the visual interaction on a dashboard card"
    ]
  },
  {
    agentId: "backend",
    capabilities: [
      "api",
      "database",
      "prisma",
      "auth",
      "server",
      "graphql",
      "rest",
      "jwt",
      "query-optimization",
      "performance"
    ],
    examples: [
      "Create a REST API endpoint",
      "Set up database schema with Prisma",
      "Implement JWT authentication",
      "Build a GraphQL resolver",
      "Optimize database queries for a slow endpoint",
      "Reduce API latency caused by N plus one database calls"
    ]
  },
  {
    agentId: "database",
    capabilities: [
      "sql",
      "schema",
      "migration",
      "query",
      "table",
      "index",
      "normalization",
      "data-modeling"
    ],
    examples: [
      "Create a SQL schema for customer subscriptions",
      "Write a migration for the orders table",
      "Add indexes for faster analytical reporting",
      "Normalize a relational data model"
    ]
  },
  {
    agentId: "testing",
    capabilities: ["jest", "vitest", "test", "spec", "coverage", "mock", "integration", "qa"],
    examples: [
      "Write Jest unit tests for authentication middleware",
      "Add integration coverage for the payments flow",
      "Create mocks for provider failures",
      "Increase branch coverage for the router module"
    ]
  },
  {
    agentId: "devops",
    capabilities: [
      "docker",
      "kubernetes",
      "deploy",
      "ci",
      "cd",
      "pipeline",
      "infra",
      "monitoring"
    ],
    examples: [
      "Create a Dockerfile for the API service",
      "Set up a CI pipeline for tests and deploys",
      "Tune Kubernetes health checks",
      "Add observability for production deployments"
    ]
  },
  {
    agentId: "security",
    capabilities: [
      "auth",
      "encrypt",
      "hash",
      "jwt",
      "permission",
      "governance",
      "audit",
      "compliance"
    ],
    examples: [
      "Audit permission checks for sensitive endpoints",
      "Harden JWT token validation",
      "Add encryption for stored secrets",
      "Review governance controls for a dangerous tool"
    ]
  },
  {
    agentId: "orchestrator",
    capabilities: ["coordination", "planning", "workflow", "general", "multi-agent"],
    examples: [
      "Coordinate a cross-functional implementation plan",
      "Break a project into agent-sized tasks",
      "Route a complex task to the right specialists"
    ]
  }
]);
function getAgentProfile(agentId) {
  return AGENT_PROFILES.find((profile) => profile.agentId === agentId) || null;
}
function buildProfileText(profile) {
  return [
    profile.agentId,
    ...profile.capabilities || [],
    ...profile.examples || [],
    ...profile.capabilities || []
  ].filter(Boolean).join(" ");
}
export {
  AGENT_PROFILES,
  buildProfileText,
  getAgentProfile
};
