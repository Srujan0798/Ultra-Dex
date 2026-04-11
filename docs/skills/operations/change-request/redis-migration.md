# Change Request: Redis/Postgres Migration

**Generated:** 2026-04-11  
**Change ID:** CR-001  
**Status:** Pending Approval

---

## 1. Change Summary

| Field           | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| **Title**       | Migrate memory persistence from file-based to Redis + Postgres |
| **Requestor**   | Srujan (Lead Developer)                                        |
| **Priority**    | High                                                           |
| **Target Date** | April 25, 2026                                                 |
| **Type**        | Infrastructure                                                 |

---

## 2. Problem Statement

**Current State:**

- Memory stored in `.ultra/memory.json` (file-based)
- Audit logs in SQLite (`.ultra/governance-audit.db`)
- No persistence across server restarts
- Poor performance for large datasets

**Desired State:**

- L1/L2 memory in Redis (sub-millisecond)
- Audit logs in Postgres (production-grade)
- Survives restarts, supports clustering

---

## 3. Impact Analysis

### Positive Impacts

- **Performance:** 10x faster memory operations
- **Reliability:** Data survives restarts
- **Scalability:** Redis Cluster for horizontal scaling
- **Production-ready:** Postgres audit for compliance

### Negative Impacts

- **Downtime:** 2-4 hour migration window
- **Learning:** Team needs Redis/Postgres knowledge
- **Cost:** Redis + Postgres on Render (~$20/mo)

---

## 4. Risk Assessment

| Risk                       | Probability | Impact | Mitigation               |
| -------------------------- | ----------- | ------ | ------------------------ |
| Data loss during migration | Low         | High   | Backup before migration  |
| Performance regression     | Medium      | Medium | Benchmark before/after   |
| Team skill gap             | Medium      | Low    | Documentation + training |
| Integration failures       | Low         | High   | Rollback to file-based   |

---

## 5. Rollback Plan

1. Keep file-based memory as fallback
2. Feature flag for Redis (default: off initially)
3. Quick rollback: set flag to revert
4. Maximum downtime: 10 minutes

---

## 6. Stakeholder Communication

| Audience              | Message                      | Channel         | Timing |
| --------------------- | ---------------------------- | --------------- | ------ |
| Engineering           | Technical details + timeline | Slack           | Week 2 |
| Users (if applicable) | No user-facing changes       | -               | N/A    |
| Leadership            | Cost + timeline impact       | Executive brief | Week 2 |

---

## 7. Approval Required

| Role            | Approval | Status  |
| --------------- | -------- | ------- |
| Technical Lead  | ✅       | Pending |
| Product Manager | ✅       | Pending |
| Leadership      | ✅       | Pending |

---

**Change Request Ready for CAB Review!**
