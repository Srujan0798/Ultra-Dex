# Ultra-Dex Operations Guide

This guide covers the operational aspects of running Ultra-Dex in production, including monitoring, scaling, maintenance, and incident response procedures.

## Health Monitoring

Ultra-Dex provides comprehensive health check endpoints to monitor system status and component health. Understanding these endpoints is crucial for effective monitoring and alerting.

**Primary Health Check:**
The main health endpoint at `/health` performs a comprehensive system check including database connectivity, Redis availability, AI provider status, and memory system health. This endpoint returns a JSON response with overall status and component-specific details:

```bash
curl http://localhost:3000/health
```

A healthy system returns HTTP 200 with all components reporting "ok" status. Monitor this endpoint with your preferred monitoring system (Prometheus, DataDog, New Relic) with alerts configured for non-200 responses or component failures.

**Component-Specific Endpoints:**
Individual component health can be checked at `/health/ai`, `/health/memory`, `/health/governance`, and `/health/mesh`. These endpoints are useful for isolating issues during incidents and understanding which specific subsystem is experiencing problems.

**Memory and Performance Metrics:**
The `/metrics` endpoint exposes detailed performance metrics including memory usage, request latency percentiles, AI provider response times, and governance policy execution counts. Configure your monitoring system to scrape these metrics every 30 seconds for production visibility.

## Scaling Strategies

Ultra-Dex supports both horizontal and vertical scaling approaches depending on your workload characteristics and infrastructure preferences.

**Horizontal Scaling:**
For high-availability deployments, run multiple Ultra-Dex instances behind a load balancer with Redis as the communication mesh. Each instance should connect to the same Redis instance using the `BUS_TYPE=redis` configuration. Session state and memory are shared across instances through the distributed mesh, enabling seamless request routing.

Configure your load balancer with health checks pointing to the `/health` endpoint and use sticky sessions if your application requires session affinity. Deploy instances across multiple availability zones for fault tolerance, with at least 3 instances to handle zone failures gracefully.

**Vertical Scaling:**
For single-instance deployments or when horizontal scaling isn't feasible, optimize memory and CPU allocation through environment variables. Increase `NODE_OPTIONS="--max-old-space-size=2048"` for memory-intensive workloads. Adjust `MEMORY_TIER_PROMOTION_THRESHOLD` and `MEMORY_TIER_DEMOTION_THRESHOLD` to optimize memory usage patterns for your specific use case.

Monitor CPU and memory utilization patterns to identify optimal instance sizing. Ultra-Dex performs well on 2-4 vCPU instances with 2-4 GB RAM for typical workloads, scaling up to 8 vCPU and 8 GB RAM for high-throughput scenarios.

## Backup and Recovery

Ultra-Dex stores critical data in multiple locations that require different backup strategies to ensure complete disaster recovery capability.

**Audit Database Backup:**
The governance audit database contains compliance-critical information about all AI operations, policy decisions, and user actions. Configure automated daily backups of your PostgreSQL database with point-in-time recovery capability:

```bash
pg_dump -h localhost -U ultra_dex -d ultra_dex_audit > audit_backup_$(date +%Y%m%d).sql
```

Store backups in geographically distributed locations with encryption at rest. Test restore procedures monthly to ensure backup integrity and recovery time objectives are met.

**Memory Store Backup:**
The distributed memory system maintains conversation context, learned patterns, and semantic embeddings. Back up the Redis instance using Redis persistence features (RDB snapshots + AOF logs) or by exporting memory data through the administrative API:

```bash
curl -X POST http://localhost:3000/admin/memory/export > memory_backup_$(date +%Y%m%d).json
```

**Configuration and Secrets Backup:**
Maintain version-controlled backups of configuration files, environment variables (excluding secrets), and deployment scripts. Store API keys and secrets in a secure secret management system with backup and rotation capabilities.

## Log Management

Ultra-Dex generates structured logs across multiple categories that require different retention and analysis strategies for effective operations.

**Application Logs:**
Core application logs include request processing, AI provider interactions, and error conditions. Configure log rotation to prevent disk space issues and set appropriate retention policies based on compliance requirements. Typical production setups retain application logs for 30-90 days with daily rotation.

**Audit Logs:**
Governance and security audit logs have longer retention requirements and must be tamper-evident. These logs capture all policy evaluations, access decisions, and administrative actions. Configure immutable storage with at least 7-year retention for compliance scenarios.

**Performance Logs:**
Request timing, resource utilization, and performance metrics logs help with capacity planning and performance optimization. Aggregate these logs into time-series databases for trending and alerting. Monitor response time percentiles, error rates, and resource utilization patterns.

Configure centralized logging with structured JSON output for easier parsing and analysis. Use log levels appropriately: ERROR for actionable issues requiring immediate attention, WARN for degraded conditions, INFO for normal operational events, and DEBUG for troubleshooting information.

## Incident Response

When Ultra-Dex experiences issues, follow this systematic approach to diagnosis and resolution while maintaining system availability.

**Initial Assessment:**
Start with the primary health endpoint to understand overall system status. Check recent application logs for error patterns and examine external dependencies including AI provider status pages, Redis connectivity, and database availability. Verify that network connectivity and DNS resolution are functioning correctly.

**Common Issue Patterns:**
AI provider rate limiting manifests as increased response times and 429 HTTP status codes in logs. Temporarily reduce concurrent requests or failover to alternative providers using the provider routing configuration. Memory system issues typically present as degraded response quality or conversation context loss, indicating Redis connectivity problems or memory tier threshold misconfigurations.

Database connectivity issues cause governance policy failures and audit log gaps. Check database connection pool status and verify network connectivity between application instances and the database server. Performance degradation often correlates with memory pressure, requiring instance restart or scaling adjustments.

**Escalation Procedures:**
Establish clear escalation paths with defined response time targets. Level 1 issues include individual AI provider failures with automatic failover handling. Level 2 issues involve partial system degradation requiring configuration changes or manual intervention. Level 3 issues require emergency response for complete system outages or security incidents.

Document runbooks for common scenarios including provider failover, memory system recovery, database failover, and emergency scaling procedures. Maintain contact information for key personnel and external vendors including cloud providers and AI service vendors.

## Maintenance Procedures

Regular maintenance ensures system security, performance, and reliability while minimizing operational risk through careful change management.

**Dependency Updates:**
Review and apply security patches monthly for Node.js, npm packages, and system dependencies. Use `npm audit` to identify known vulnerabilities and `npm update` to apply safe updates. Test updates thoroughly in staging environments before production deployment.

Monitor AI provider API changes and SDK updates that might affect functionality or performance. Subscribe to provider status pages and developer communication channels for advance notice of breaking changes or deprecations.

**Security Patches:**
Apply operating system security patches during scheduled maintenance windows. Coordinate with security teams to prioritize critical vulnerabilities requiring immediate patching. Maintain an emergency patching process for zero-day vulnerabilities affecting production systems.

**Database Maintenance:**
Perform regular database maintenance including index optimization, statistics updates, and connection pool tuning. Monitor query performance and identify slow queries requiring optimization. Schedule regular maintenance windows for database upgrades and major configuration changes.

**Configuration Updates:**
Implement configuration changes through version-controlled deployment processes with rollback capabilities. Test configuration changes in staging environments that mirror production topology and load patterns. Maintain configuration documentation and change logs for audit purposes.

## Performance Tuning

Optimize Ultra-Dex performance through systematic measurement and tuning of key system parameters based on your specific workload characteristics.

**Memory Optimization:**
Adjust memory tier thresholds based on conversation patterns and memory access frequency. Increase `MEMORY_TIER_PROMOTION_THRESHOLD` for workloads with highly repetitive queries to keep frequently accessed data in fast tiers. Decrease thresholds for diverse workloads to prevent memory pressure from infrequently accessed data.

Monitor memory tier distribution using the `/metrics` endpoint and adjust promotion/demotion rates to maintain optimal balance between response speed and memory utilization. Configure appropriate Redis memory policies and eviction strategies for your usage patterns.

**AI Provider Optimization:**
Tune provider selection algorithms by analyzing response times, success rates, and cost metrics. Configure failover chains based on provider reliability and performance characteristics for your specific use cases. Adjust timeout values and retry policies to balance responsiveness with error recovery.

**Concurrency Tuning:**
Adjust Node.js event loop and libuv thread pool settings for I/O intensive workloads. Configure appropriate connection pool sizes for database and Redis connections based on concurrent user patterns. Monitor event loop lag and adjust worker pool sizes accordingly.

**Network Optimization:**
Configure appropriate timeout values for external API calls based on provider SLA characteristics. Implement connection pooling and keep-alive settings for high-throughput scenarios. Optimize payload sizes and compression settings for bandwidth-constrained environments.

Monitor key performance indicators including response time percentiles, error rates, resource utilization, and user satisfaction metrics. Establish performance baselines and alerting thresholds to proactively identify degradation before it affects user experience.