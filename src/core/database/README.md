# Ultra-Dex Database Layer

This module provides PostgreSQL integration for Ultra-Dex with graceful fallback to memory mode when PostgreSQL is unavailable.

## Components

### PostgresClient (`postgres-client.ts`)
Main database client class providing:
- Connection pooling via `pg.Pool`
- Lazy initialization
- Query execution with type safety
- Transaction support
- Migration runner
- Health checks
- Graceful fallback to memory mode

**Features:**
- Configurable connection pooling (default: 10 connections)
- Automatic fallback to memory mode if connection fails
- Connection timeout handling (2s default)
- Idle timeout management (30s default)
- Pool statistics tracking

### Schema Files
- `schema.sql` - Core module schema (users, audit_events, usage_events, execution_traces, subscriptions)
- `migrations/001-enterprise-schema.sql` - Enterprise features (organizations, teams, RBAC, approval workflows)
- `migrations/002_module_schema.sql` - Extended schema (billing, logs, tool tracking, policy violations)

### Migration Runner (`migrate.ts`)
Automatically applies all `.sql` and `.ts` migration files in lexicographic order.

**Supports:**
- SQL migrations (parsed and executed statement-by-statement)
- TypeScript migrations (with `up()` function export)
- Error handling and rollback
- Migration status reporting

## Configuration

### Environment Variables
```bash
DATABASE_URL=postgres://user:password@localhost:5432/ultra_dex
# OR individual variables:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ultra_dex
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_SIZE=10

# Optional
SKIP_POSTGRES=true          # Disable PostgreSQL entirely
```

## Usage

### Basic Setup
```typescript
import { getPostgresClient, runMigrations } from 'src/core/database';

// Initialize client (lazy - only connects when first query runs)
const client = getPostgresClient();

// Run migrations
await runMigrations();

// Check health
const isHealthy = await client.healthCheck();
```

### Query Execution
```typescript
// Simple query
const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);

// Query with type safety
interface User {
  id: string;
  email: string;
  role: string;
}
const { rows } = await client.query<User>('SELECT * FROM users');

// Query config
const result = await client.queryConfig<User>({
  text: 'SELECT * FROM users WHERE email = $1',
  values: [email],
});
```

### Transactions
```typescript
const result = await client.transaction(async (txClient) => {
  // Both queries run in same transaction
  await txClient.query('INSERT INTO users (...) VALUES (...)');
  await txClient.query('UPDATE subscriptions SET ...');
  return { success: true };
  // Automatically commits on success, rolls back on error
});
```

### Pool Statistics
```typescript
const stats = client.getPoolStats();
console.log(`Total: ${stats.total}, Idle: ${stats.idle}, Waiting: ${stats.waiting}`);
```

### Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  await client.close();
  process.exit(0);
});
```

## Fallback Mode

When PostgreSQL is unavailable:
- Client operates in "fallback mode"
- All queries return empty results with no errors
- Health checks return `false`
- Warnings are logged
- Application continues to function

This ensures the system remains responsive even if the database is temporarily unavailable.

## Database Schema

### Core Tables
- **users** - User profiles synced from Clerk
- **audit_events** - Governance audit trail (replaces SQLite)
- **usage_events** - API token and cost tracking (replaces in-memory)
- **execution_traces** - Task execution debugging
- **subscriptions** - Billing subscription metadata

### Extended Tables (Enterprise)
- **organizations** - Multi-tenant support
- **teams** - Team management
- **team_members** - Team membership with roles
- **roles** - RBAC roles
- **projects** - Team projects
- **approval_requests** - Approval workflow
- **audit_events** (extended) - Comprehensive audit trail
- **webhooks** - Event webhooks
- **api_keys** - API key management

### Module Extensions
- **clerk_syncs** - Clerk ID mapping
- **billing_transactions** - Billing history
- **cost_tracking** - Per-agent/model costs
- **agent_logs** - Execution logs
- **tool_executions** - Tool execution history
- **policy_violations** - Governance violations
- **approval_history** - Approval audit trail

## Migration System

### Running Migrations
```bash
# Automatic on startup
await client.migrate();

# Manual execution
npx tsx src/core/database/migrate.ts

# Custom path
npx tsx src/core/database/migrate.ts /path/to/migrations
```

### Creating New Migrations
1. Create a `.sql` file in `migrations/` directory
2. Use lexicographic naming: `003_feature_name.sql`
3. Write idempotent SQL (use `IF NOT EXISTS`, etc.)

Example migration:
```sql
-- migrations/003_new_feature.sql
CREATE TABLE IF NOT EXISTS new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_new_feature_created ON new_feature(created_at);
```

### TypeScript Migrations
For data transformations or seeding:

```typescript
// migrations/003_seed_data.ts
export async function up(client: PoolClient): Promise<void> {
  await client.query('INSERT INTO roles (name) VALUES ($1)', ['custom_role']);
}
```

## Performance Optimization

### Indexes
All frequently-queried columns have indexes for O(log n) lookups:
- Timestamp columns for range queries
- User IDs for filtering
- Status fields for filtering
- Agent names for aggregation

### Connection Pooling
- Default pool size: 10 connections
- Configurable via `DB_POOL_SIZE`
- Automatic connection reuse
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

### Query Optimization
- Use parameterized queries (prevents SQL injection)
- Batch operations in transactions when possible
- Use `EXPLAIN ANALYZE` for slow queries

## Monitoring

### Health Checks
```typescript
const isHealthy = await client.healthCheck();
if (!isHealthy) {
  console.error('Database connection failed');
}
```

### Pool Monitoring
```typescript
const { total, idle, waiting } = client.getPoolStats();
if (waiting > 5) {
  console.warn('Database connection pool overloaded');
}
```

### Audit Trail
Query results automatically include timing and execution information.

## Disaster Recovery

### Backup
```bash
# Backup database
pg_dump postgres://user:password@localhost:5432/ultra_dex > backup.sql

# Restore database
psql postgres://user:password@localhost:5432/ultra_dex < backup.sql
```

### Point-in-Time Recovery
Enable WAL archiving in PostgreSQL for PITR support.

## Testing

```bash
# Run database tests
npm test

# With coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check DATABASE_URL or DB_HOST
- Verify firewall rules

### Authentication Failed
```
Error: password authentication failed for user
```
- Verify DB_USER and DB_PASSWORD
- Check PostgreSQL user permissions

### Pool Exhaustion
```
Error: timeout exceeded while waiting for a connection
```
- Increase DB_POOL_SIZE
- Check for connection leaks
- Reduce query duration

### Fallback Mode Active
```
[postgres-client] No DATABASE_URL or DB_HOST set, using fallback mode
```
- This is normal for development without Postgres
- Set DATABASE_URL to use real database
- Check logs for actual connection errors

## License

MIT
