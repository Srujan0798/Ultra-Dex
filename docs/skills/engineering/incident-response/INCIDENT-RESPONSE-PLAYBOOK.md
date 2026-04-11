# 🚨 Incident Response Playbook

> **Ultra-Dex incident response procedures**

---

## 1. Incident Declaration

### When to Declare an Incident

- 🔴 **P0 - Critical:** Complete outage, data loss, security breach
- 🟠 **P1 - High:** Major feature broken, significant performance degradation
- 🟡 **P2 - Medium:** Minor feature issues
- 🟢 **P3 - Low:** Cosmetic issues

### Declaration Steps

1. **Assess severity** (use severity levels above)
2. **Create incident channel** `#incident-YYYY-MM-DD-description`
3. **Page on-call** if P0/P1
4. **Post in #incidents** with template:

```markdown
🚨 INCIDENT DECLARED

**Severity:** P0/P1/P2/P3
**Time:** HH:MM UTC
**Reporter:** @name
**Status:** INVESTIGATING

**Symptoms:**

- Brief description

**Impact:**

- Who/what is affected

**Slack Channel:** #incident-YYYY-MM-DD-description

cc: @on-call @team-lead
```

---

## 2. Incident Response Timeline

### First 5 Minutes

- [ ] Acknowledge incident
- [ ] Join incident channel
- [ ] Assess severity
- [ ] Check monitoring dashboards
- [ ] Post initial update

### First 15 Minutes

- [ ] Identify scope
- [ ] Check recent changes/deployments
- [ ] Review error logs
- [ ] Identify potential cause
- [ ] Communicate findings

### First 30 Minutes

- [ ] Determine if rollback needed
- [ ] Attempt mitigation
- [ ] Update status page (if P0/P1)
- [ ] Notify stakeholders

---

## 3. Communication Templates

### Status Update

```markdown
**[HH:MM UTC] Status Update**

**Status:** INVESTIGATING / MITIGATING / MONITORING / RESOLVED

**What we know:**

- Current understanding

**What we're doing:**

- Actions being taken

**Next update:** HH:MM UTC (or "ASAP")

**ETA:** X minutes / TBD
```

### Resolution

```markdown
**✅ RESOLVED - [HH:MM UTC]**

**Summary:**
Brief description of what happened

**Impact:**

- Duration: X minutes
- Affected users: Y
- Data loss: None / X records

**Root Cause:**
Brief explanation

**Resolution:**
How it was fixed

**Follow-up:**

- Postmortem: [date]
- Action items: [link]
```

---

## 4. Severity Matrix

| Severity | Response Time | Communication  | Escalation          |
| -------- | ------------- | -------------- | ------------------- |
| **P0**   | 15 min        | Company-wide   | Exec team           |
| **P1**   | 1 hour        | Affected teams | VP Engineering      |
| **P2**   | 4 hours       | Team           | Engineering manager |
| **P3**   | 24 hours      | Ticket only    | None                |

---

## 5. Runbook Links

- [API Down](./runbooks/api-down.md)
- [Database Issues](./runbooks/database.md)
- [Memory/Cache Problems](./runbooks/memory.md)
- [Provider Failures](./runbooks/providers.md)
- [Security Incident](./runbooks/security.md)

---

## 6. Post-Incident Process

### Within 24 Hours

1. **Write postmortem** (blameless)
2. **Schedule review meeting**
3. **Create action items**

### Postmortem Template

See [POSTMORTEM-TEMPLATE.md](./POSTMORTEM-TEMPLATE.md)

---

**Last Updated:** 2026-04-10
