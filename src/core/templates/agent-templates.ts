var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
function validateTemplate(template) {
  const errors = [];
  if (!template.id)
    errors.push("Missing id");
  if (!template.name)
    errors.push("Missing name");
  if (!template.role)
    errors.push("Missing role");
  if (!template.model)
    errors.push("Missing model");
  if (!template.systemPrompt)
    errors.push("Missing systemPrompt");
  if (!template.capabilities || !Array.isArray(template.capabilities)) {
    errors.push("Missing or invalid capabilities array");
  }
  if (template.tools && !Array.isArray(template.tools)) {
    errors.push("tools must be an array");
  }
  return { valid: errors.length === 0, errors };
}
const builtInTemplates = [
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    category: "development",
    description: "Reviews pull requests for bugs, style, and security issues",
    role: "code-review",
    model: "gpt-4o",
    systemPrompt: "You are a senior code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and style consistency. Provide actionable feedback with specific line references. Be thorough but constructive.",
    capabilities: ["code-analysis", "security-scanning", "style-checking"],
    tools: ["filesystem/read_file", "github/get_file", "github/list_issues"],
    constraints: ["read-only", "no-deployments"],
    config: { maxTokensPerReview: 4e3, confidenceThreshold: 0.7 },
    tags: ["code", "review", "security", "quality"]
  },
  {
    id: "documentation-writer",
    name: "Documentation Writer",
    category: "development",
    description: "Generates and maintains technical documentation from code",
    role: "documentation",
    model: "gemini-2.0-flash",
    systemPrompt: "You are a technical writer. Generate clear, comprehensive documentation from source code. Include usage examples, API references, and architecture explanations. Use markdown formatting.",
    capabilities: ["code-analysis", "writing", "markdown-generation"],
    tools: ["filesystem/read_file", "filesystem/write_file", "filesystem/list_dir"],
    constraints: ["no-code-modification", "docs-directory-only"],
    config: { outputFormat: "markdown", includeExamples: true },
    tags: ["docs", "writing", "markdown"]
  },
  {
    id: "test-generator",
    name: "Test Generator",
    category: "development",
    description: "Automatically generates unit and integration tests",
    role: "testing",
    model: "gpt-4o",
    systemPrompt: "You are a test engineering specialist. Generate comprehensive test suites including edge cases, error paths, and integration scenarios. Use the testing framework already present in the project. Aim for high coverage.",
    capabilities: ["code-analysis", "test-generation", "edge-case-detection"],
    tools: ["filesystem/read_file", "filesystem/write_file", "code-exec/execute"],
    constraints: ["test-files-only"],
    config: { framework: "auto-detect", minCoverage: 80 },
    tags: ["testing", "automation", "quality"]
  },
  {
    id: "research-analyst",
    name: "Research Analyst",
    category: "data",
    description: "Researches topics using web search and synthesizes findings",
    role: "research",
    model: "gemini-2.0-flash",
    systemPrompt: "You are a research analyst. Search for information, cross-reference sources, and synthesize findings into clear, well-cited reports. Always verify claims from multiple sources. Flag uncertainty levels.",
    capabilities: ["web-search", "synthesis", "fact-checking"],
    tools: ["web-search/search", "web-search/fetch_url", "memory/store"],
    constraints: ["no-code-execution", "cite-sources"],
    config: { maxSources: 10, requireCitations: true },
    tags: ["research", "analysis", "web"]
  },
  {
    id: "data-pipeline",
    name: "Data Pipeline Agent",
    category: "data",
    description: "Transforms, validates, and routes data between systems",
    role: "data-processing",
    model: "gemini-2.0-flash",
    systemPrompt: "You are a data engineering agent. Process, validate, and transform data according to defined schemas. Report data quality issues. Handle errors gracefully with retry logic.",
    capabilities: ["data-transformation", "validation", "error-handling"],
    tools: ["code-exec/execute", "memory/store", "memory/retrieve"],
    constraints: ["no-external-writes-without-approval"],
    config: { batchSize: 100, retryAttempts: 3 },
    tags: ["data", "etl", "pipeline"]
  },
  {
    id: "customer-support",
    name: "Customer Support Agent",
    category: "business",
    description: "Handles customer inquiries using knowledge base and context",
    role: "support",
    model: "gpt-4o-mini",
    systemPrompt: "You are a helpful customer support specialist. Answer questions accurately using the knowledge base. If unsure, escalate to a human. Be empathetic, concise, and professional. Never make up information.",
    capabilities: ["knowledge-retrieval", "conversation", "escalation"],
    tools: ["memory/retrieve", "memory/query_graph"],
    constraints: ["no-refunds-without-approval", "pii-safe"],
    config: { escalationThreshold: 0.4, maxConversationLength: 20 },
    tags: ["support", "customer", "knowledge-base"]
  },
  {
    id: "deployment-operator",
    name: "Deployment Operator",
    category: "devops",
    description: "Manages deployments with approval workflows and rollback",
    role: "devops",
    model: "gpt-4o",
    systemPrompt: "You are a deployment operations agent. Execute deployments following strict procedures. Always verify pre-conditions, run health checks post-deployment, and be ready to rollback. Never bypass approval for production.",
    capabilities: ["deployment", "monitoring", "rollback"],
    tools: ["code-exec/execute", "filesystem/read_file"],
    constraints: ["require-approval-for-production", "no-force-push"],
    config: { requireApproval: true, rollbackOnFailure: true, healthCheckTimeout: 3e4 },
    tags: ["devops", "deployment", "ci-cd"]
  },
  {
    id: "security-auditor",
    name: "Security Auditor",
    category: "security",
    description: "Scans code and configs for security vulnerabilities",
    role: "security",
    model: "gpt-4o",
    systemPrompt: "You are a security auditor. Scan code for OWASP Top 10 vulnerabilities, check dependency versions, review configurations for security misconfigurations. Classify findings by severity (critical/high/medium/low). Provide remediation steps.",
    capabilities: ["security-scanning", "vulnerability-detection", "compliance-checking"],
    tools: ["filesystem/read_file", "filesystem/search_files", "github/list_issues"],
    constraints: ["read-only", "no-code-modification"],
    config: { scanDepth: "deep", owaspChecks: true },
    tags: ["security", "audit", "vulnerability"]
  },
  {
    id: "multi-agent-coordinator",
    name: "Multi-Agent Coordinator",
    category: "orchestration",
    description: "Coordinates multiple agents to complete complex tasks",
    role: "coordinator",
    model: "gpt-4o",
    systemPrompt: "You are a multi-agent coordinator. Break complex tasks into subtasks, assign them to appropriate specialized agents, monitor progress, and synthesize results. Handle conflicts between agent outputs using consensus.",
    capabilities: ["task-decomposition", "agent-coordination", "consensus-building"],
    tools: ["memory/store", "memory/retrieve", "memory/query_graph"],
    constraints: ["no-direct-execution", "coordinator-only"],
    config: { maxSubAgents: 5, consensusThreshold: 0.66 },
    tags: ["orchestration", "multi-agent", "coordination"]
  },
  {
    id: "knowledge-curator",
    name: "Knowledge Curator",
    category: "knowledge",
    description: "Organizes, indexes, and maintains knowledge bases",
    role: "curation",
    model: "gemini-2.0-flash",
    systemPrompt: "You are a knowledge curator. Organize information into structured, searchable knowledge bases. Create taxonomies, detect duplicates, maintain quality, and surface related knowledge. Build semantic links between concepts.",
    capabilities: ["knowledge-management", "taxonomy", "deduplication"],
    tools: ["memory/store", "memory/retrieve", "memory/query_graph", "memory/stats"],
    constraints: ["no-deletion-without-backup"],
    config: { deduplicationThreshold: 0.85, autoLinkRelated: true },
    tags: ["knowledge", "curation", "organization"]
  }
];
let TemplateRegistry = class extends EventEmitter {
  templates;
  versions;
  constructor() {
    super();
    this.templates = /* @__PURE__ */ new Map();
    this.versions = /* @__PURE__ */ new Map();
  }
  /**
   * Load all built-in templates
   */
  loadBuiltIns() {
    for (const t of builtInTemplates) {
      this.register(t);
    }
  }
  /**
   * Register a template
   */
  register(template) {
    const validation = validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
    }
    const existing = this.templates.get(template.id);
    if (existing) {
      if (!this.versions.has(template.id))
        this.versions.set(template.id, []);
      this.versions.get(template.id).push({ ...existing, archivedAt: Date.now() });
    }
    this.templates.set(template.id, { ...template, registeredAt: Date.now() });
    this.emit("template:registered", template.id);
  }
  /**
   * Get a template by ID
   */
  get(id) {
    return this.templates.get(id) || null;
  }
  /**
   * Search templates by category, tag, or capability
   */
  search({ category, tag, capability, query } = {}) {
    let results = [...this.templates.values()];
    if (category)
      results = results.filter((t) => t.category === category);
    if (tag)
      results = results.filter((t) => t.tags?.includes(tag));
    if (capability)
      results = results.filter((t) => t.capabilities?.includes(capability));
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags?.some((tag2) => tag2.includes(q))
      );
    }
    return results;
  }
  /**
   * List all categories
   */
  getCategories() {
    const cats = /* @__PURE__ */ new Set();
    for (const t of this.templates.values()) {
      if (t.category)
        cats.add(t.category);
    }
    return [...cats];
  }
  /**
   * Get version history for a template
   */
  getVersions(id) {
    return this.versions.get(id) || [];
  }
  /**
   * Instantiate a template — create a ready-to-use agent config
   */
  instantiate(id, overrides = {}) {
    const template = this.templates.get(id);
    if (!template)
      throw new Error(`Template "${id}" not found`);
    return {
      ...template,
      ...overrides,
      instanceId: `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      instantiatedFrom: id,
      instantiatedAt: Date.now(),
      config: { ...template.config, ...overrides.config }
    };
  }
  /**
   * Get catalog for dashboard display
   */
  getCatalog() {
    const categories = {};
    for (const t of this.templates.values()) {
      const cat = t.category || "uncategorized";
      if (!categories[cat])
        categories[cat] = [];
      categories[cat].push({
        id: t.id,
        name: t.name,
        description: t.description,
        model: t.model,
        toolCount: t.tools?.length || 0,
        tags: t.tags || []
      });
    }
    return { categories, totalTemplates: this.templates.size };
  }
  getStats() {
    return {
      totalTemplates: this.templates.size,
      categories: this.getCategories(),
      byCategory: Object.fromEntries(
        this.getCategories().map((c) => [c, this.search({ category: c }).length])
      )
    };
  }
};
TemplateRegistry = __decorateClass([
  singleton()
], TemplateRegistry);
let TemplateBuilder = class {
  constructor() {
    this._template = {
      capabilities: [],
      tools: [],
      constraints: [],
      tags: [],
      config: {}
    };
  }
  id(id) {
    this._template.id = id;
    return this;
  }
  name(name) {
    this._template.name = name;
    return this;
  }
  description(desc) {
    this._template.description = desc;
    return this;
  }
  category(cat) {
    this._template.category = cat;
    return this;
  }
  role(role) {
    this._template.role = role;
    return this;
  }
  model(model) {
    this._template.model = model;
    return this;
  }
  systemPrompt(prompt) {
    this._template.systemPrompt = prompt;
    return this;
  }
  addCapability(cap) {
    this._template.capabilities.push(cap);
    return this;
  }
  addTool(tool) {
    this._template.tools.push(tool);
    return this;
  }
  addConstraint(c) {
    this._template.constraints.push(c);
    return this;
  }
  addTag(tag) {
    this._template.tags.push(tag);
    return this;
  }
  setConfig(key, value) {
    this._template.config[key] = value;
    return this;
  }
  /**
   * Extend an existing template
   */
  extend(template) {
    this._template = {
      ...template,
      capabilities: [...template.capabilities || []],
      tools: [...template.tools || []],
      constraints: [...template.constraints || []],
      tags: [...template.tags || []],
      config: { ...template.config }
    };
    return this;
  }
  build() {
    const validation = validateTemplate(this._template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
    }
    return { ...this._template };
  }
};
TemplateBuilder = __decorateClass([
  singleton()
], TemplateBuilder);
var agent_templates_default = { TemplateRegistry, TemplateBuilder, validateTemplate, builtInTemplates };
export {
  TemplateBuilder,
  TemplateRegistry,
  builtInTemplates,
  agent_templates_default as default,
  validateTemplate
};
