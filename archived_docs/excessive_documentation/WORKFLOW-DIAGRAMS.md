# Ultra-Dex Workflow Diagrams

Visual representations of agent workflows and production pipelines.

---

## 🎯 Standard Production Pipeline

```mermaid
graph TD
    Start([New Feature Request]) --> A[@Planner]
    A -->|Tasks Defined| B[@CTO]
    B -->|Architecture Approved| C{Needs Database?}

    C -->|Yes| D[@Database]
    C -->|No| E[@Backend]
    D -->|Schema Ready| E

    E -->|API Complete| F[@Frontend]
    F -->|UI Complete| G{Auth/Payments?}

    G -->|Yes| H[@Auth / @Security]
    G -->|No| I[@Testing]
    H -->|Audit Complete| I

    I -->|Tests Passing| J[@Reviewer]
    J -->|Code Approved| K[@DevOps]
    K --> End([Deployed to Production])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style A fill:#fff4e6
    style B fill:#fff4e6
    style D fill:#e3f2fd
    style E fill:#e3f2fd
    style F fill:#e3f2fd
    style H fill:#fce4ec
    style I fill:#f3e5f5
    style J fill:#f3e5f5
    style K fill:#e0f2f1
```

**Legend:**
- 🟡 Yellow: Leadership Tier
- 🔵 Blue: Development Tier
- 🔴 Pink: Security Tier
- 🟣 Purple: Quality Tier
- 🟢 Green: DevOps Tier

---

## 🚀 Authentication Feature Workflow

```mermaid
graph LR
    A[@Planner] -->|4 tasks| B[@CTO]
    B -->|JWT + httpOnly cookies| C[@Database]
    C -->|User table| D[@Backend]
    D -->|/signup, /login, /logout| E[@Frontend]
    E -->|Login/Signup pages| F[@Security]
    F -->|Audit passed| G[@Reviewer]
    G -->|Approved| H[@DevOps]

    style A fill:#fff4e6
    style B fill:#fff4e6
    style C fill:#e3f2fd
    style D fill:#e3f2fd
    style E fill:#e3f2fd
    style F fill:#fce4ec
    style G fill:#f3e5f5
    style H fill:#e0f2f1
```

**Time:** ~30 minutes with AI agents
**Agents used:** 7

---

## 💳 Payment Integration Workflow (Stripe)

```mermaid
graph TD
    A[@Research] -->|Stripe Checkout| B[@CTO]
    B -->|Webhook architecture| C[@Database]
    C -->|Subscription table| D[@Backend]
    D -->|Checkout + webhooks| E[@Frontend]
    E -->|Checkout button| F[@Testing]
    F -->|Test cards| G[@Security]
    G -->|Webhook signature| H[@DevOps]

    style A fill:#fff4e6
    style B fill:#fff4e6
    style C fill:#e3f2fd
    style D fill:#e3f2fd
    style E fill:#e3f2fd
    style F fill:#f3e5f5
    style G fill:#fce4ec
    style H fill:#e0f2f1
```

**Time:** ~45 minutes with AI agents
**Agents used:** 7

---

## 🐛 Bug Fix Workflow (Fast Track)

```mermaid
graph LR
    A[@Debugger] -->|Root cause found| B[@Backend/Frontend]
    B -->|Fix implemented| C[@Testing]
    C -->|Regression test| D[@Reviewer]
    D -->|Quick review| E[@DevOps]
    E -->|Hotfix deployed| End([Fixed])

    style A fill:#f3e5f5
    style B fill:#e3f2fd
    style C fill:#f3e5f5
    style D fill:#f3e5f5
    style E fill:#e0f2f1
    style End fill:#e1f5e1
```

**Time:** ~15-30 minutes
**Agents used:** 4-5

---

## ⚡ Performance Optimization Workflow

```mermaid
graph TD
    Start([Slow Page/API]) --> A[@Performance]
    A -->|Bottleneck identified| B{Issue Type?}

    B -->|Database| C[@Database]
    B -->|Backend| D[@Backend]
    B -->|Frontend| E[@Frontend]

    C -->|Query optimized| F[@Testing]
    D -->|Code optimized| F
    E -->|Bundle reduced| F

    F -->|Performance verified| G[@Reviewer]
    G -->|Approved| End([Deployed])

    style Start fill:#ffebee
    style A fill:#fff3e0
    style C fill:#e3f2fd
    style D fill:#e3f2fd
    style E fill:#e3f2fd
    style F fill:#f3e5f5
    style G fill:#f3e5f5
    style End fill:#e1f5e1
```

**Time:** ~30-60 minutes depending on complexity
**Agents used:** 4-6

---

## 🔄 Multi-Tool AI Coordination

```mermaid
graph TD
    Plan[User Request] --> A{Choose AI Tool}

    A -->|Free| ChatGPT[@Planner in ChatGPT]
    A -->|Best Reasoning| Claude[@CTO in Claude Opus]
    A -->|Fast Coding| Cursor[@Backend in Cursor]

    ChatGPT -->|Tasks to PLAN.md| B[IMPLEMENTATION-PLAN.md]
    Claude -->|Architecture to PLAN.md| B
    Cursor -->|Code to repo| B

    B --> C{Next Agent?}
    C -->|Yes| A
    C -->|No| Deploy[@DevOps in Claude Sonnet]

    Deploy --> End([Production])

    style Plan fill:#e1f5e1
    style ChatGPT fill:#fff4e6
    style Claude fill:#fff4e6
    style Cursor fill:#e3f2fd
    style B fill:#fff9c4
    style Deploy fill:#e0f2f1
    style End fill:#e1f5e1
```

**Key:** All tools read/write to shared IMPLEMENTATION-PLAN.md
**Cost Savings:** 3-5x cheaper than single tool

---

## 📊 Agent Tier Structure

```mermaid
graph TD
    subgraph Leadership[1. Leadership Tier]
        CTO[@CTO]
        Planner[@Planner]
        Research[@Research]
    end

    subgraph Development[2. Development Tier]
        Backend[@Backend]
        Frontend[@Frontend]
        Database[@Database]
    end

    subgraph Security[3. Security Tier]
        Auth[@Auth]
        SecurityAgent[@Security]
    end

    subgraph DevOps[4. DevOps Tier]
        DevOpsAgent[@DevOps]
    end

    subgraph Quality[5. Quality Tier]
        Testing[@Testing]
        Documentation[@Documentation]
        Reviewer[@Reviewer]
        Debugger[@Debugger]
    end

    subgraph Specialist[6. Specialist Tier]
        Performance[@Performance]
        Refactoring[@Refactoring]
    end

    Leadership --> Development
    Development --> Security
    Security --> Quality
    Quality --> DevOps
    Specialist -.Optional.-> Quality

    style Leadership fill:#fff4e6
    style Development fill:#e3f2fd
    style Security fill:#fce4ec
    style DevOps fill:#e0f2f1
    style Quality fill:#f3e5f5
    style Specialist fill:#fff3e0
```

**Flow:** Leadership → Development → Security → Quality → DevOps

---

## 🎯 Decision Tree: Database Selection

```mermaid
graph TD
    Start{Building SaaS?} -->|Yes| A{Need Transactions?}
    Start -->|No| Other[Use appropriate DB]

    A -->|Yes| PostgreSQL[PostgreSQL ⭐]
    A -->|No| B{Flexible Schema?}

    B -->|Yes| MongoDB[MongoDB]
    B -->|No| PostgreSQL2[PostgreSQL ⭐]

    PostgreSQL --> C{Hosting?}
    PostgreSQL2 --> C
    MongoDB --> D{Hosting?}

    C -->|MVP| Neon[Neon - Free Tier]
    C -->|Production| Railway[Railway/Supabase]

    D -->|Any| Atlas[MongoDB Atlas]

    style PostgreSQL fill:#4caf50,color:#fff
    style PostgreSQL2 fill:#4caf50,color:#fff
    style Neon fill:#81c784
    style Railway fill:#81c784
    style MongoDB fill:#66bb6a
    style Atlas fill:#81c784
```

**Recommendation:** PostgreSQL for 90% of SaaS projects

---

## 🏗️ Decision Tree: Architecture Pattern

```mermaid
graph TD
    Start{Team Size?} -->|1-3 people| NextJS[Full-Stack Next.js]
    Start -->|3-8 people| Split[Backend + Frontend Split]
    Start -->|5-15 people| Multi[Backend + Multiple Frontends]
    Start -->|10-30 people| SOA[Service-Oriented Architecture]
    Start -->|30+ people| Micro[Microservices]

    NextJS --> A{Complexity?}
    A -->|Simple| Good1[✅ Good Choice]
    A -->|Complex| Consider[Consider Split]

    Split --> Good2[✅ Good Choice]
    Multi --> Good3[✅ Good Choice]
    SOA --> Good4[✅ Good Choice]
    Micro --> Warning[⚠️ Only if needed]

    style NextJS fill:#4caf50,color:#fff
    style Split fill:#66bb6a,color:#fff
    style Multi fill:#81c784
    style SOA fill:#a5d6a7
    style Micro fill:#ffeb3b
    style Good1 fill:#c8e6c9
    style Good2 fill:#c8e6c9
    style Good3 fill:#c8e6c9
    style Good4 fill:#c8e6c9
    style Warning fill:#fff9c4
```

**Default:** Start with Next.js, scale when needed

---

## 🤖 Decision Tree: AI Model Selection

```mermaid
graph TD
    Start{Task Type?} -->|Complex Reasoning| Claude[Claude Opus 4.5]
    Start -->|Coding| GPT[GPT-5.2 / Claude Sonnet]
    Start -->|Quick Fixes| Fast[Claude Haiku / GPT-5 mini]
    Start -->|Research| ChatGPT[ChatGPT - Web Search]
    Start -->|Sensitive Data| Local[Self-host Llama 3.1]

    Claude --> Cost1[$30/MTok]
    GPT --> Cost2[$15-18/MTok]
    Fast --> Cost3[$2-6/MTok]
    ChatGPT --> Cost4[Free/Plus]
    Local --> Cost5[Hardware Cost]

    Cost1 --> Use1[Use for: Architecture, CTO decisions]
    Cost2 --> Use2[Use for: Backend, Frontend, Database]
    Cost3 --> Use3[Use for: Debugger, Quick fixes]
    Cost4 --> Use4[Use for: Planner, Research]
    Cost5 --> Use5[Use for: Enterprise/Privacy]

    style Claude fill:#674ea7,color:#fff
    style GPT fill:#3c78d8,color:#fff
    style Fast fill:#6aa84f,color:#fff
    style ChatGPT fill:#f1c232
    style Local fill:#e69138
```

**Hybrid Strategy:** Use best model for each task = 3-5x cost savings

---

## 📈 Development Lifecycle

```mermaid
graph TD
    Idea[💡 Idea] --> QuickStart[📋 QUICK-START.md]
    QuickStart --> Plan[📝 IMPLEMENTATION-PLAN.md]

    Plan --> Phase1[Phase 1: Planning]
    Phase1 --> Phase2[Phase 2: Development]
    Phase2 --> Phase3[Phase 3: Testing]
    Phase3 --> Phase4[Phase 4: Quality]
    Phase4 --> Phase5[Phase 5: Deployment]

    Phase5 --> Prod[🚀 Production]
    Prod --> Monitor[📊 Monitor]
    Monitor --> Improve[🔄 Iterate]
    Improve --> Phase1

    style Idea fill:#e1f5e1
    style QuickStart fill:#fff4e6
    style Plan fill:#e3f2fd
    style Prod fill:#c8e6c9,color:#000
    style Monitor fill:#fff3e0
    style Improve fill:#f3e5f5
```

**Duration:**
- MVP: 2-4 weeks with AI agents
- Full SaaS: 8-12 weeks with AI agents

---

## 🔗 Workflow Resources

**Detailed Workflows:**
- [Project Orchestration Guide](./guides/PROJECT-ORCHESTRATION.md) - Complete auth workflow
- [Advanced Workflows](./guides/ADVANCED-WORKFLOWS.md) - Stripe, emails, migrations
- [Multi-Tool Workflow](./guides/MULTI-TOOL-WORKFLOW.md) - Coordinate multiple AIs

**Agent Reference:**
- [Agent Index](./agents/00-AGENT_INDEX.md) - All 17 agents with "when to use"
- [Agents README](./agents/README.md) - Tier-based organization

**Decision Guides:**
- [Database Selection](./guides/DATABASE-DECISION-FRAMEWORK.md) - PostgreSQL vs MongoDB
- [Architecture Patterns](./guides/ARCHITECTURE-PATTERNS.md) - Team size to architecture
- [AI Model Selection](./guides/AI-MODEL-SELECTION.md) - Cost optimization

---

## 💡 Using These Diagrams

**In Documentation:**
- Embed Mermaid diagrams in markdown files
- GitHub/GitLab render Mermaid natively

**In Presentations:**
- Export diagrams as SVG/PNG
- Use in pitch decks, team meetings

**In Planning:**
- Map your feature to standard workflow
- Identify which agents you need
- Estimate time and cost

---

## 🎓 Diagram Legend

| Color | Tier | Agents |
|-------|------|--------|
| 🟡 Yellow | Leadership | CTO, Planner, Research |
| 🔵 Blue | Development | Backend, Frontend, Database |
| 🔴 Pink | Security | Auth, Security |
| 🟢 Teal | DevOps | DevOps |
| 🟣 Purple | Quality | Testing, Documentation, Reviewer, Debugger |
| 🟠 Orange | Specialist | Performance, Refactoring |

**Decision Nodes:** Diamond shape
**Processes:** Rectangle shape
**Start/End:** Rounded rectangle

---

## 📝 Creating Custom Diagrams

**Mermaid Syntax:**
```markdown
\`\`\`mermaid
graph TD
    A[@YourAgent] --> B[@NextAgent]
    B --> C{Decision?}
    C -->|Yes| D[@Agent3]
    C -->|No| E[@Agent4]
\`\`\`
```

**Tools:**
- [Mermaid Live Editor](https://mermaid.live/) - Online editor
- VSCode Mermaid extension - Edit in IDE
- GitHub Markdown - Renders automatically

**Learn More:**
- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid GitHub](https://github.com/mermaid-js/mermaid)

---

*Ultra-Dex v3.4.3 - Visual workflows for AI-driven development*

**These diagrams are living documentation - update them as your workflow evolves!**
