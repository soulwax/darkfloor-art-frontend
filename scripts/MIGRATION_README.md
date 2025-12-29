# Database Migration to NEON Postgres

This guide explains how to migrate your database from your current PostgreSQL instance to NEON Postgres.

## Prerequisites

1. **Ensure schema exists on target database**: Before migrating data, you need to create the schema on the NEON database. Run:

```bash
# Set your NEON database URL temporarily
export DATABASE_URL="postgresql://neondb_owner:npg_wGoei3E1pZdX@ep-wandering-night-agpfwl6e-pooler.c-2.eu-central-1.aws.neon.tech/starchild?sslmode=require&channel_binding=require"

# Push schema to NEON
npm run db:push
```

2. **Backup your current database**: Always backup before migration!

```bash
# Using pg_dump (recommended)
pg_dump $SOURCE_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Migration Steps

### Option 1: Using the TypeScript Migration Script (Recommended)

The migration script (`migrate-to-neon.ts`) provides:
- ✅ Automatic table discovery
- ✅ Foreign key dependency handling
- ✅ Progress tracking
- ✅ Data verification
- ✅ Error handling

**Usage:**

```bash
# Set your source database (if different from DATABASE_URL)
export SOURCE_DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Set your target NEON database
export TARGET_DATABASE_URL="postgresql://neondb_owner:npg_wGoei3E1pZdX@ep-wandering-night-agpfwl6e-pooler.c-2.eu-central-1.aws.neon.tech/starchild?sslmode=require&channel_binding=require"

# Run migration
npm run migrate:neon
```

Or if your current `DATABASE_URL` is the source:

```bash
export TARGET_DATABASE_URL="postgresql://neondb_owner:npg_wGoei3E1pZdX@ep-wandering-night-agpfwl6e-pooler.c-2.eu-central-1.aws.neon.tech/starchild?sslmode=require&channel_binding=require"
npm run migrate:neon
```

**Skip confirmation prompt:**
```bash
SKIP_CONFIRM=true npm run migrate:neon
```

### Option 2: Using pg_dump and pg_restore (Alternative)

For very large databases, `pg_dump`/`pg_restore` might be faster:

```bash
# 1. Dump schema only (if not already done)
pg_dump $SOURCE_DATABASE_URL --schema-only > schema.sql

# 2. Apply schema to NEON
psql $TARGET_DATABASE_URL < schema.sql

# 3. Dump data only
pg_dump $SOURCE_DATABASE_URL --data-only --disable-triggers > data.sql

# 4. Restore data to NEON
psql $TARGET_DATABASE_URL < data.sql
```

Or in one command:

```bash
pg_dump $SOURCE_DATABASE_URL | psql $TARGET_DATABASE_URL
```

## Post-Migration

1. **Update your environment variables** to point to NEON:

```bash
# Update .env.local
DATABASE_URL="postgresql://neondb_owner:npg_wGoei3E1pZdX@ep-wandering-night-agpfwl6e-pooler.c-2.eu-central-1.aws.neon.tech/starchild?sslmode=require&channel_binding=require"
```

2. **Test the connection:**

```bash
npm run db:studio
```

3. **Verify data integrity:**

The migration script automatically verifies row counts. You can also manually check:

```sql
-- Compare row counts
SELECT 
  'users' as table_name,
  (SELECT COUNT(*) FROM "hexmusic-stream_user") as row_count
UNION ALL
SELECT 'playlists', (SELECT COUNT(*) FROM "hexmusic-stream_playlist")
-- ... etc
```

## Troubleshooting

### SSL Certificate Issues

If you encounter SSL errors, the script will automatically use lenient SSL for NEON. For other databases, you may need to:

1. Set `DB_SSL_CA` environment variable with your CA certificate
2. Or place your CA certificate at `certs/ca.pem`

### Connection Timeouts

For large databases, you may need to increase connection timeouts. Edit the script to adjust:

```typescript
const sourcePool = new Pool({
  connectionString: sourceUrl,
  ssl: sourceSsl,
  max: 5,
  connectionTimeoutMillis: 60000, // Increase if needed
});
```

### Foreign Key Violations

If you see foreign key violations, the script handles table ordering automatically. If issues persist:

1. Temporarily disable foreign key checks (not recommended for production)
2. Or migrate in smaller batches

### Sequence Issues

The script automatically resets sequences after migration. If you see ID conflicts:

```sql
-- Manually reset sequences
SELECT setval('hexmusic-stream_playlist_id_seq', (SELECT MAX(id) FROM "hexmusic-stream_playlist"));
```

## Notes

- The migration script preserves all data including indexes and constraints
- Sequences are automatically reset to prevent ID conflicts
- The script uses transactions for data integrity
- Large tables are migrated in batches of 1000 rows for better performance

