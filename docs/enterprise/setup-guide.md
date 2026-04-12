# Ultra-Dex Enterprise Setup Guide

> Deploy and configure Ultra-Dex for enterprise environments.

---

## Table of Contents

- [Enterprise Initialization](#enterprise-initialization)
- [License Key Activation](#license-key-activation)
- [Team Workspace Setup](#team-workspace-setup)
- [Migration from Free/Pro to Enterprise](#migration-from-freepro-to-enterprise)

---

## Enterprise Initialization

### Prerequisites

- Ultra-Dex Enterprise license key
- Node.js 20+ on all target machines
- PostgreSQL 16+ (managed or self-hosted)
- Redis 7+ (managed or self-hosted)
- Docker or Kubernetes for containerized deployment

### Initial Setup

```bash
# Install Ultra-Dex CLI
npm install -g @ultra-dex/cli

# Verify enterprise features are available
ultra-dex enterprise --status

# Initialize enterprise configuration
ultra-dex init --enterprise my-org
cd my-org
```

### Enterprise Configuration File

`.ultra-dex/enterprise.json`:

```json
{
  "edition": "enterprise",
  "licenseKey": "${ULTRA_DEX_LICENSE}",
  "organization": "My Organization",
  "maxUsers": 500,
  "maxWorkspaces": 50,
  "features": {
    "sso": true,
    "rbac": true,
    "auditExport": true,
    "dataRetention": true,
    "slaMonitoring": true,
    "customProviders": true
  }
}
```

---

## License Key Activation

### Activate License

```bash
ultra-dex enterprise activate --key YOUR-LICENSE-KEY
```

### Verify Activation

```bash
ultra-dex enterprise --status
# Output:
# Edition: Enterprise
# License: Active
# Organization: My Organization
# Users: 12/500
# Expires: 2027-04-12
```

### Renew License

```bash
ultra-dex enterprise renew --key NEW-LICENSE-KEY
```

### Offline Activation

For air-gapped environments:

```bash
# Generate activation request
ultra-dex enterprise offline-request > activation-request.json

# Submit to Ultra-Dex licensing portal
# Receive activation-response.json

# Apply response
ultra-dex enterprise offline-activate --file activation-response.json
```

---

## Team Workspace Setup

### Create Workspace

```bash
ultra-dex team create --name engineering --plan enterprise
```

### Add Members

```bash
# Add individual members
ultra-dex team add-member --workspace engineering --email alice@company.com --role admin
ultra-dex team add-member --workspace engineering --email bob@company.com --role member

# Bulk import from CSV
ultra-dex team bulk-import --workspace engineering --file members.csv
```

**CSV format:**

```csv
email,role,workspace
alice@company.com,admin,engineering
bob@company.com,member,engineering
carol@company.com,viewer,engineering
```

### Configure RBAC

```bash
# Define roles and permissions
ultra-dex team set-permission --role member --can-run-tasks true
ultra-dex team set-permission --role member --can-change-config false
ultra-dex team set-permission --role member --can-export-audit false
ultra-dex team set-permission --role member --can-manage-users false
```

### Default Role Permissions

| Permission | Admin | Member | Viewer |
|---|---|---|---|
| Run tasks | ✅ | ✅ | ❌ |
| View results | ✅ | ✅ | ✅ |
| Change config | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Export audit | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |

---

## Migration from Free/Pro to Enterprise

### Pre-Migration Checklist

- [ ] Back up existing data (`.ultra-dex/` directory)
- [ ] Export current configuration: `ultra-dex config --export > config-backup.json`
- [ ] Document current provider keys and settings
- [ ] Notify team members of planned migration window

### Migration Steps

```bash
# 1. Install enterprise edition
npm install -g @ultra-dex/cli@enterprise

# 2. Activate license
ultra-dex enterprise activate --key YOUR-LICENSE-KEY

# 3. Migrate data
ultra-dex enterprise migrate --from free --to enterprise

# 4. Verify migration
ultra-dex enterprise verify

# 5. Update team members
ultra-dex team notify --message "Ultra-Dex has been upgraded to Enterprise"
```

### Post-Migration Verification

```bash
# Verify all data migrated
ultra-dex enterprise verify --full

# Check team workspace
ultra-dex team list

# Verify audit trail continuity
ultra-dex audit stats --since 2026-01-01
```

### Rollback Plan

If migration fails:

```bash
# Restore from backup
ultra-dex enterprise rollback --backup config-backup.json

# Revert to previous version
npm install -g @ultra-dex/cli@3.1.0
```
