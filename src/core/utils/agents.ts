import { logger } from './logging.js';
const agents = {
  // Leadership Tier
  cto: { name: "Chief Architect", emoji: "\u{1F4D0}", tagline: "Defining system architecture" },
  planner: { name: "Product Planner", emoji: "\u{1F4CB}", tagline: "breaking down requirements" },
  research: { name: "Research Analyst", emoji: "\u{1F50D}", tagline: "Analyzing patterns" },
  // Development Tier
  backend: { name: "Backend Engineer", emoji: "\u2699\uFE0F", tagline: "Building API services" },
  frontend: { name: "Frontend Engineer", emoji: "\u{1F3A8}", tagline: "Crafting user interfaces" },
  database: { name: "Data Architect", emoji: "\u{1F4BE}", tagline: "Optimizing schema" },
  // Security Tier
  auth: { name: "Security Engineer", emoji: "\u{1F512}", tagline: "Securing access" },
  security: { name: "Security Auditor", emoji: "\u{1F6E1}\uFE0F", tagline: "Auditing vulnerabilities" },
  // DevOps Tier
  devops: { name: "DevOps Engineer", emoji: "\u{1F680}", tagline: "Managing deployment" },
  // Quality Tier
  testing: { name: "QA Engineer", emoji: "\u{1F9EA}", tagline: "Ensuring quality" },
  documentation: { name: "Tech Writer", emoji: "\u{1F4DD}", tagline: "Documenting systems" },
  reviewer: { name: "Code Reviewer", emoji: "\u{1F440}", tagline: "Reviewing code quality" },
  debugger: { name: "Debug Specialist", emoji: "\u{1F41B}", tagline: "Resolving issues" },
  // Specialist Tier
  performance: { name: "Performance Engineer", emoji: "\u26A1", tagline: "Optimizing speed" },
  refactoring: { name: "Refactoring Specialist", emoji: "\u267B\uFE0F", tagline: "Improving code structure" }
};
const avengersAgents = agents;
function _handleError(error) {
  try {
    logger.error("[agents]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  agents,
  avengersAgents
};
