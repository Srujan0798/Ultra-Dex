# Operational Runbook: Deploy to Production

**Generated:** 2026-04-11  
**Task:** Production Deployment  
**Owner:** On-call Engineer

---

## Pre-Deployment Checklist

- [ ] All tests passing (100%)
- [ ] Code review approved (2+ approvals)
- [ ] Security scan clean
- [ ] Changelog updated
- [ ] Version tagged
- [ ] Rollback plan documented

---

## Deployment Steps

### 1. Prepare Environment

```bash
# Pull latest
git pull origin main

# Install dependencies
npm ci

# Run tests
npm test

# Build
npm run build
```

### 2. Deploy to Staging

```bash
# Deploy staging
npm run deploy:staging

# Verify
curl https://staging.ultra-dex.dev/health
# Expected: {"status":"ok","version":"3.2.0"}
```

### 3. Deploy to Production

```bash
# Deploy production
npm run deploy:production

# Verify
curl https://ultra-dex.dev/health
# Expected: {"status":"ok","version":"3.2.0"}
```

---

## Troubleshooting

### Issue: Health Check Fails

| Check           | Command                    | Fix                              |
| --------------- | -------------------------- | -------------------------------- |
| Service running | `ps aux \| grep ultra-dex` | Restart: `pm2 restart ultra-dex` |
| Memory usage    | `pm2 monit`                | Scale up or investigate          |
| Disk space      | `df -h`                    | Clean old logs                   |

### Issue: Database Connection Failed

```bash
# Check connection
pg_isready -h $DB_HOST

# If down, notify DBA
# Rollback: Restore from last backup
```

### Issue: API Errors in Logs

```bash
# View recent errors
pm2 logs ultra-dex --lines 50 --err

# Common fixes:
# - Rollback to previous version: git revert && redeploy
# - Disable feature flag
# - Scale up instances
```

---

## Rollback Procedure

```bash
# Quick rollback (within 10 min)
git checkout v3.1.0
npm run deploy:production

# Verify rollback
curl https://ultra-dex.dev/health
```

---

## Escalation Path

| Severity      | Contact           | Response Time |
| ------------- | ----------------- | ------------- |
| P1 (Critical) | Srujan (Lead)     | 15 minutes    |
| P2 (High)     | Team Slack        | 1 hour        |
| P3 (Medium)   | Next business day | 4 hours       |

---

## Post-Deployment

1. Monitor error rate for 30 minutes
2. Announce in #releases Slack channel
3. Update status page if needed

---

**Runbook complete!** Update when process changes.
