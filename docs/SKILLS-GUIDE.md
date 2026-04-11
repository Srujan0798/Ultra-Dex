# Ultra-Dex Skills Guide

Ultra-Dex provides a comprehensive skills system with **104 skills** across **15 categories** that work with any AI provider.

## 🚀 Quick Start

### 1. Installation

```bash
npm install @ultra-dex/cli
```

### 2. Configure AI Providers

Set environment variables:

```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export GOOGLE_API_KEY="your-google-key"
```

### 3. Run Your First Skill

```bash
ultra-dex skills execute /code-review \
  --code "function test() { return 'hello'; }" \
  --language javascript \
  --focus security,performance
```

## 📋 Skills Categories

### Engineering (15 skills)

- `/code-review` - Code review with security, performance, correctness analysis
- `/architecture` - Architecture decision records (ADRs)
- `/debug` - Structured debugging session
- `/deploy-checklist` - Pre-deployment verification
- `/documentation` - Technical documentation generation
- `/incident-response` - Incident management workflow
- `/standup` - Daily standup updates
- `/system-design` - System architecture design
- `/tech-debt` - Technical debt identification
- `/testing-strategy` - Test plan creation
- `/document-search` - Enterprise document search
- `/code-search` - Code pattern search
- `/knowledge-base-search` - Internal knowledge base search
- `/people-search` - Organizational expertise search
- `/semantic-search` - AI-powered semantic search

### Data (10 skills)

- `/sql-queries` - SQL query generation
- `/explore-data` - Data exploration and analysis
- `/build-dashboard` - Dashboard creation
- `/analyze` - Data analysis with insights
- `/create-viz` - Data visualization generation
- `/statistical-analysis` - Statistical analysis
- `/validate-data` - Data validation
- `/write-query` - Query writing assistance
- `/data-context-extractor` - Context extraction
- `/data-visualization` - Visualization design

### Sales (9 skills)

- `/account-research` - Account intelligence
- `/call-prep` - Sales call preparation
- `/call-summary` - Call summary generation
- `/competitive-intelligence` - Competitive analysis
- `/create-an-asset` - Sales asset creation
- `/daily-briefing` - Daily sales briefing
- `/draft-outreach` - Outreach message drafting
- `/forecast` - Sales forecasting
- `/pipeline-review` - Pipeline analysis

### Product Management (9 skills)

- `/competitive-brief` - Competitive brief creation
- `/metrics-review` - Product metrics analysis
- `/product-brainstorming` - Brainstorming sessions
- `/roadmap-update` - Roadmap updates
- `/sprint-planning` - Sprint planning
- `/stakeholder-update` - Stakeholder communications
- `/synthesize-research` - Research synthesis
- `/write-spec` - Product specification writing
- `/brainstorm` - General brainstorming

### Customer Support (5 skills)

- `/customer-escalation` - Escalation handling
- `/customer-research` - Customer research
- `/draft-response` - Response drafting
- `/kb-article` - Knowledge base article creation
- `/ticket-triage` - Ticket triage

### Finance (8 skills)

- `/audit-support` - Audit preparation
- `/close-management` - Month-end close
- `/financial-statements` - Statement generation
- `/journal-entry-prep` - Journal entry preparation
- `/journal-entry` - Journal entry creation
- `/reconciliation` - Account reconciliation
- `/sox-testing` - SOX compliance testing
- `/variance-analysis` - Variance analysis

### Productivity (9 skills)

- `/memory-management` - Memory optimization
- `/start` - Task initiation
- `/task-management` - Task organization
- `/update` - Progress updates
- `/pdf-extract-text` - PDF text extraction
- `/pdf-analyze-structure` - PDF structure analysis
- `/pdf-search-content` - PDF content search
- `/pdf-convert-markdown` - PDF to markdown conversion
- `/pdf-summarize` - PDF summarization

### Operations (9 skills)

- `/capacity-plan` - Capacity planning
- `/change-request` - Change management
- `/compliance-tracking` - Compliance tracking
- `/process-doc` - Process documentation
- `/process-optimization` - Process optimization
- `/risk-assessment` - Risk assessment
- `/runbook` - Runbook creation
- `/status-report` - Status reporting
- `/vendor-review` - Vendor evaluation

### Marketing (11 skills)

- `/brand-review` - Brand analysis
- `/campaign-plan` - Campaign planning
- `/content-gap-analysis` - Content gap analysis
- `/content-creation` - Content creation
- `/draft-content` - Content drafting
- `/email-sequence` - Email sequence creation
- `/performance-report` - Performance reporting
- `/seo-audit` - SEO audit
- `/brand-analysis` - Brand analysis
- `/tone-adjustment` - Tone adjustment
- `/brand-guidelines` - Brand guidelines

### Design (7 skills)

- `/accessibility-review` - Accessibility review
- `/design-critique` - Design critique
- `/design-handoff` - Design handoff
- `/design-system` - Design system creation
- `/research-synthesis` - Research synthesis
- `/user-research` - User research
- `/ux-copy` - UX copywriting

### Legal (5 skills)

- `/contract-review` - Contract review
- `/compliance-check` - Compliance checking
- `/legal-research` - Legal research
- `/nda-review` - NDA review
- `/regulatory-update` - Regulatory updates

### HR (5 skills)

- `/recruitment-plan` - Recruitment planning
- `/performance-review` - Performance reviews
- `/compensation-analysis` - Compensation analysis
- `/employee-onboarding` - Onboarding process
- `/hr-policy-review` - HR policy review

### Brand Voice (5 skills)

- `/brand-analysis` - Brand voice analysis
- `/tone-adjustment` - Tone adjustment
- `/brand-guidelines` - Brand guidelines
- `/content-alignment` - Content alignment
- `/voice-training` - Voice training

## 🔌 Connector Integration

Skills can integrate with external tools:

### GitHub Integration

```javascript
const result = await skills.execute(
  '/code-review',
  {
    code: 'function test() { return "hello"; }',
    prUrl: 'https://github.com/owner/repo/pull/123',
  },
  {
    connectors: { github: { token: 'your-token' } },
  }
);
```

### Snowflake Integration

```javascript
const result = await skills.execute(
  '/sql-queries',
  {
    prompt: 'Get active users',
    schema: { users: ['id', 'email', 'status'] },
  },
  {
    connectors: {
      snowflake: {
        account: 'your-account',
        database: 'your-db',
      },
    },
  }
);
```

### Available Connectors

- **GitHub**: PR reviews, repo context, commits
- **Snowflake**: Schema access, data sampling
- **Slack**: Incident notifications, team communication
- **Notion**: ADR storage, documentation
- **Datadog**: Metrics, logs for debugging
- **Linear**: Ticket integration for standups

## 🎯 Usage Examples

### Code Review

```javascript
const result = await skills.execute('/code-review', {
  code: `function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }`,
  language: 'javascript',
  focus: ['security', 'performance', 'correctness'],
});
```

### SQL Query Generation

```javascript
const result = await skills.execute('/sql-queries', {
  prompt: 'Get users who signed up in the last 30 days',
  dialect: 'postgresql',
  schema: {
    users: ['id', 'email', 'created_at'],
    orders: ['id', 'user_id', 'amount'],
  },
});
```

### Sales Call Preparation

```javascript
const result = await skills.execute('/call-prep', {
  prompt: 'Prepare for call with Acme Corp about enterprise pricing',
  context: {
    company: 'Acme Corp',
    industry: 'SaaS',
    previousInteractions: ['Discovery call 2 weeks ago'],
  },
});
```

## ⚙️ Configuration

### Provider Selection

Skills automatically route to the best AI provider based on:

- **Cost optimization** - Cheapest capable provider
- **Latency optimization** - Fastest response time
- **Quality optimization** - Highest quality output
- **Fallback chains** - Automatic provider switching

### Governance

Every skill execution passes through governance checks:

- **Policy enforcement** - Custom business rules
- **Audit trails** - Complete execution history
- **Security controls** - Data classification
- **Approval workflows** - Manual review gates

## 🚀 Advanced Usage

### Custom Skills

Create your own skills:

```javascript
import { defineSkill } from '@ultra-dex/skills';

const mySkill = defineSkill({
  id: '/my-custom-skill',
  name: 'My Custom Skill',
  description: 'Custom skill for specific use case',
  category: 'engineering',
  input: {
    type: 'object',
    properties: {
      /* schema */
    },
  },
  output: {
    type: 'object',
    properties: {
      /* schema */
    },
  },
  promptTemplate: 'Custom template {{variable}}',
});
```

### Batch Execution

Execute multiple skills in parallel:

```javascript
const results = await Promise.all([
  skills.execute('/code-review', {
    /* input */
  }),
  skills.execute('/documentation', {
    /* input */
  }),
  skills.execute('/testing-strategy', {
    /* input */
  }),
]);
```

## 📊 Monitoring & Analytics

Track skill usage:

- **Execution metrics** - Latency, cost, success rates
- **Provider performance** - Response times, error rates
- **Skill analytics** - Most used skills, success rates
- **Cost tracking** - Per-skill, per-provider costs

## 🔧 Troubleshooting

### Common Issues

**Skill not found**

```bash
# List all available skills
ultra-dex skills list

# Check if skill exists
ultra-dex skills has /code-review
```

**Provider connection issues**

```bash
# Test provider connectivity
ultra-dex providers test

# Check provider status
ultra-dex providers status
```

**Governance denial**

```bash
# Check governance policies
ultra-dex governance policies

# Review audit logs
ultra-dex governance audit
```

## 📞 Support

- **Documentation**: https://github.com/Srujan0798/Ultra-Dex
- **Issues**: https://github.com/Srujan0798/Ultra-Dex/issues
- **Community**: GitHub Discussions

---

**Ultra-Dex Skills System** - Model-agnostic AI orchestration with enterprise-grade capabilities.
