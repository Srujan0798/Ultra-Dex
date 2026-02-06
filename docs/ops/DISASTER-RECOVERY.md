# Disaster Recovery & Business Continuity

## Objectives

- **RTO:** 4 hours
- **RPO:** 1 hour
- **Goal:** Restore critical services within 4 hours of outage while limiting data loss to 1 hour.

## Scope

- API services
- Databases and storage
- Background workers
- Authentication and billing
- Observability stack

## Backup Strategy

- **Continuous replication:** Primary DB replicates to standby in a separate region.
- **Daily full backups:** Retained for 30 days.
- **Point-in-time recovery:** Enabled for the last 7 days.
- **Object storage:** Versioning enabled, retention policy set to 90 days.

## Incident Response Protocol

1. **Detection**
   - Alerts from monitoring (latency, error rate, availability)
   - On-call acknowledges within 5 minutes
2. **Assessment**
   - Determine blast radius and affected services
   - Decide if failover is required
3. **Containment**
   - Disable writes if data integrity is at risk
   - Freeze deployments
4. **Recovery**
   - Failover to standby region
   - Restore data from latest backup if needed
5. **Validation**
   - Run smoke tests
   - Verify critical user flows
6. **Post-Incident Review**
   - Root-cause analysis
   - Action items and timeline updates

## Automated Rollback Triggers

- Error rate > 5% for 5 minutes
- P95 latency > 2s for 10 minutes
- DB replication lag > 10 minutes
- Failed health checks across 3 regions

## Roles & Responsibilities

- **Incident Commander:** Owns decisions and communication
- **SRE/DevOps:** Executes recovery steps
- **Backend Lead:** Validates data integrity
- **Support:** Updates customers and status page

## Testing & Validation

- Quarterly failover drills
- Monthly backup restore tests
- Annual full BCP simulation

## Communications

- Status page updates within 15 minutes
- Internal updates every 30 minutes
- Post-mortem published within 5 business days
