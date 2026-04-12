# Ultra-Dex Enterprise Compliance Guide

> SOC 2, GDPR, data retention, audit export, and SLA configuration for enterprise deployments.

---

## Table of Contents

- [SOC 2 Compliance Features](#soc-2-compliance-features)
- [Audit Trail Configuration](#audit-trail-configuration)
- [Data Retention Policies](#data-retention-policies)
- [GDPR Considerations](#gdpr-considerations)
- [Export Formats for Auditors](#export-formats-for-auditors)
- [SLA Tiers and Metrics](#sla-tiers-and-metrics)

---

## SOC 2 Compliance Features

Ultra-Dex Enterprise includes built-in features to support SOC 2 Type II compliance:

### Trust Service Criteria Coverage

| TSC Category | Ultra-Dex Feature | Evidence Location |
|---|---|---|
| **CC6.1** — Logical Access | RBAC, SSO, session management | `ultra-dex audit access-logs` |
| **CC6.2** — Authentication | SAML/OIDC SSO, MFA | `ultra-dex auth status` |
| **CC6.3** — Authorization | Role-based permissions | `ultra-dex team permissions` |
| **CC6.6** — Security Boundaries | Tenant isolation, workspace scoping | `ultra-dex team list` |
| **CC7.1** — Detection | Monitoring, alerting, health checks | `ultra-dex monitoring status` |
| **CC7.2** — Incident Response | Audit trail, replay, rollback | `ultra-dex audit export` |
| **CC8.1** — Change Management | Version control, deployment audit | `ultra-dex audit deployments` |

### Generating SOC 2 Evidence

```bash
# Export all audit events for the audit period
ultra-dex audit export \
  --since 2026-01-01 \
  --until 2026-12-31 \
  --format csv \
  --output soc2-evidence.csv

# Export access logs
ultra-dex audit export \
  --type access \
  --since 2026-01-01 \
  --format json \
  --output access-logs.json

# Export configuration changes
ultra-dex audit export \
  --type config-change \
  --since 2026-01-01 \
  --format csv \
  --output config-changes.csv
```

---

## Audit Trail Configuration

### Enable Full Audit Logging

```bash
ultra-dex config set audit.level full
ultra-dex config set audit.includeRequestBody true
ultra-dex config set audit.includeResponseBody false
```

### Audit Event Types

| Event Type | Description | Logged Fields |
|---|---|---|
| `auth.login` | User authentication | user_id, method, ip, result |
| `auth.logout` | User session end | user_id, session_duration |
| `task.execute` | Task execution | user_id, agent, provider, run_id |
| `task.complete` | Task completion | user_id, run_id, status, duration |
| `config.change` | Configuration change | user_id, key, old_value, new_value |
| `team.member.add` | Member added | user_id, added_user, role |
| `team.member.remove` | Member removed | user_id, removed_user |
| `plugin.install` | Plugin installed | user_id, plugin_id, version |
| `plugin.uninstall` | Plugin removed | user_id, plugin_id |
| `data.export` | Data export requested | user_id, format, record_count |

### Audit Storage

Audit events are stored in PostgreSQL with the following schema:

```sql
CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_type_date ON audit_events(event_type, created_at);
CREATE INDEX idx_audit_user ON audit_events(user_id);
```

---

## Data Retention Policies

### Configure Retention Periods

```bash
# Audit logs: retain for 7 years (SOC 2 requirement)
ultra-dex config set retention.audit 2555  # days (7 years)

# Task execution data: retain for 2 years
ultra-dex config set retention.tasks 730

# Memory/context data: retain for 1 year
ultra-dex config set retention.memory 365

# Temporary files: retain for 30 days
ultra-dex config set retention.temp 30
```

### Automated Cleanup

Ultra-Dex automatically purges expired data based on retention policies:

```bash
# Run cleanup manually
ultra-dex retention cleanup --dry-run  # Preview what will be deleted
ultra-dex retention cleanup --execute   # Actually delete

# Schedule automatic cleanup (cron)
0 2 * * 0 ultra-dex retention cleanup --execute  # Every Sunday at 2 AM
```

### Legal Hold

Place data on legal hold to prevent automatic deletion:

```bash
# Place hold on specific user's data
ultra-dex retention hold --user user-id-123 --reason "Litigation hold #2026-001"

# List active holds
ultra-dex retention hold list

# Release hold
ultra-dex retention hold release --id hold-001
```

---

## GDPR Considerations

### Data Subject Rights

Ultra-Dex supports all GDPR data subject rights:

| Right | Ultra-Dex Command | Description |
|---|---|---|
| **Right to Access** | `ultra-dex gdpr export --user <id>` | Export all personal data |
| **Right to Rectification** | `ultra-dex gdpr update --user <id>` | Correct inaccurate data |
| **Right to Erasure** | `ultra-dex gdpr delete --user <id>` | Delete all personal data |
| **Right to Portability** | `ultra-dex gdpr export --user <id> --format json` | Machine-readable export |
| **Right to Object** | `ultra-dex gdpr object --user <id>` | Flag processing objection |

### Data Processing Agreement

Ultra-Dex acts as a **data processor** under GDPR. The data controller is your organization.

**Data categories processed:**
- User identifiers (email, name)
- Task content and results
- Execution metadata (timestamps, providers used)
- Audit log entries

**Data residency:**
- Data is stored in the region you configure (EU, US, etc.)
- No cross-border data transfer without explicit configuration

### Data Protection Impact Assessment

```bash
# Generate DPIA report
ultra-dex gdpr dpia --output dpia-report.pdf
```

---

## Export Formats for Auditors

### Supported Export Formats

| Format | Use Case | Command |
|---|---|---|
| **CSV** | Spreadsheet analysis, auditor review | `--format csv` |
| **JSON** | Programmatic processing, API integration | `--format json` |
| **PDF** | Formal audit submission, legal evidence | `--format pdf` |
| **XML** | Regulatory filing, government submission | `--format xml` |

### Complete Audit Export

```bash
ultra-dex audit export \
  --since 2026-01-01 \
  --until 2026-12-31 \
  --format pdf \
  --include-metadata \
  --sign \
  --output audit-report-2026.pdf
```

### Signed Exports

For tamper-evident exports:

```bash
ultra-dex audit export \
  --format json \
  --sign \
  --output audit-signed.json

# Verify signature
ultra-dex audit verify --file audit-signed.json
```

---

## SLA Tiers and Metrics

### SLA Tier Definitions

| Tier | Uptime | Response Time | Support | Price |
|---|---|---|---|---|
| **Standard** | 99.5% | <500ms | Business hours | Included |
| **Professional** | 99.9% | <200ms | 24/7 chat | $99/mo |
| **Enterprise** | 99.99% | <100ms | 24/7 phone + dedicated TAM | Custom |

### SLA Monitoring

```bash
# View current SLA metrics
ultra-dex sla status

# Output:
# Tier: Enterprise
# Uptime (30d): 99.992%
# Avg Response: 87ms
# P95 Response: 142ms
# Incidents (30d): 0
```

### SLA Breach Alerts

```bash
# Configure SLA breach notifications
ultra-dex config set sla.alertEmail ops@company.com
ultra-dex config set sla.alertSlack https://hooks.slack.com/services/...
ultra-dex config set sla.breachThreshold 99.9  # percentage
```

### SLA Credit Calculation

If SLA is breached, credits are automatically calculated:

| Uptime | Credit |
|---|---|
| 99.9% – 99.99% | 10% of monthly fee |
| 99.0% – 99.9% | 25% of monthly fee |
| < 99.0% | 100% of monthly fee |

```bash
# View SLA credit eligibility
ultra-dex sla credits
```
