# 📘 Ultra-Dex Operational Runbook

> **On-call operations guide for Ultra-Dex**

---

## 📞 Emergency Contacts

| Role                 | Contact                | When to Use                 |
| -------------------- | ---------------------- | --------------------------- |
| **On-Call Engineer** | PagerDuty              | Production incidents        |
| **Team Lead**        | Slack: @lead           | Escalation, major incidents |
| **Security Team**    | security@ultra-dex.dev | Security incidents          |
| **Platform Team**    | platform@ultra-dex.dev | Infrastructure issues       |

---

## 🚨 Incident Response

### Severity Levels

| Level             | Definition      | Examples             | Response Time     |
| ----------------- | --------------- | -------------------- | ----------------- |
| **P0 - Critical** | Complete outage | API down, data loss  | 15 min            |
| **P1 - High**     | Major impact    | Degraded performance | 1 hour            |
| **P2 - Medium**   | Minor impact    | Feature broken       | 4 hours           |
| **P3 - Low**      | Cosmetic        | UI glitch            | Next business day |

### Triage Checklist

```
□ Identify symptoms
□ Check error rates
□ Check logs
□ Determine scope
□ Assess severity
□ Create incident channel
□ Notify stakeholders
```

### Common Incidents

#### 1. API Down

**Symptoms:** 500 errors, health check failing

```bash
# Check health
curl https://api.ultra-dex.dev/health

# Check logs
kubectl logs -f deployment/api --tail=100

# Check status page
curl https://status.ultra-dex.dev
```

**Resolution:**

1. Check database connectivity
2. Check Redis connection
3. Restart pods if needed
4. Escalate if persists

---

## 📊 Monitoring

### Key Metrics Dashboard

**URL:** https://grafana.ultra-dex.dev

| Metric            | Healthy | Warning   | Critical |
| ----------------- | ------- | --------- | -------- |
| API Response Time | < 200ms | 200-500ms | > 500ms  |
| Error Rate        | < 0.1%  | 0.1-1%    | > 1%     |
| CPU Usage         | < 70%   | 70-85%    | > 85%    |
| Memory Usage      | < 80%   | 80-95%    | > 95%    |
| DB Connections    | < 80%   | 80-95%    | > 95%    |

### Alerting

**Slack:** #alerts
**PagerDuty:** Critical alerts
**Email:** oncall@ultra-dex.dev

---

## 🔧 Common Procedures

### 1. Restart Services

```bash
# Restart API
kubectl rollout restart deployment/api

# Restart workers
kubectl rollout restart deployment/workers

# Verify
kubectl get pods
```

### 2. Clear Cache

```bash
# Clear Redis
redis-cli FLUSHDB

# Clear memory tier
ultra-dex memory clear --tier instant
```

### 3. Database Queries

```bash
# Connect to database
psql $DATABASE_URL

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill long-running queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '5 minutes';
```

### 4. Scale Services

```bash
# Scale API
kubectl scale deployment api --replicas=5

# Scale workers
kubectl scale deployment workers --replicas=10

# Autoscale
kubectl autoscale deployment api --min=3 --max=10 --cpu-percent=70
```

---

## 📝 Maintenance Windows

### Scheduled Maintenance

1. **Announce** in #announcements (24h before)
2. **Verify** backups complete
3. **Execute** during low-traffic window
4. **Monitor** for issues
5. **Communicate** completion

### Database Maintenance

```bash
# Pre-maintenance
ultra-dex backup create --type=full

# During maintenance
ultra-dex maintenance enable
# ... perform maintenance ...
ultra-dex maintenance disable

# Verify
ultra-dex health check
```

---

## 🔄 Deployment Procedures

See [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md) for full deployment process.

Quick deploy:

```bash
# 1. Verify tests
npm test

# 2. Build
npm run build

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify
ultra-dex health check
```

---

## 🔐 Security Response

### Security Incident

1. **Contain** - Isolate affected systems
2. **Assess** - Determine scope
3. **Notify** - Security team + stakeholders
4. **Investigate** - Preserve evidence
5. **Remediate** - Fix vulnerability
6. **Document** - Post-incident review

### Credential Rotation

```bash
# Rotate API keys
ultra-dex secrets rotate --service=openai
ultra-dex secrets rotate --service=anthropic

# Restart services
kubectl rollout restart deployment/api
```

---

## 📚 Resources

- [Architecture Docs](./docs/architecture/)
- [API Reference](./docs/api/)
- [Troubleshooting Guide](./docs/operations/TROUBLESHOOTING.md)
- [Disaster Recovery](./docs/operations/DISASTER-RECOVERY.md)

---

**Last Updated:** 2026-04-10
