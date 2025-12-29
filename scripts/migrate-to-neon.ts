#!/usr/bin/env tsx
/**
 * Migration script to transfer all data from source database to NEON Postgres
 * 
 * Usage:
 *   SOURCE_DATABASE_URL="postgresql://..." TARGET_DATABASE_URL="postgresql://..." npm run migrate:neon
 * 
 * Or set TARGET_DATABASE_URL in .env.local
 */

import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message: string) {
  console.error(`${colors.red}${message}${colors.reset}`);
}

function success(message: string) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function info(message: string) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function warn(message: string) {
  console.warn(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

// Get SSL config for a connection string
function getSslConfig(connectionString: string) {
  const isCloudDb = 
    connectionString.includes("aivencloud.com") || 
    connectionString.includes("rds.amazonaws.com") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("sslmode=");

  if (!isCloudDb && connectionString.includes("localhost")) {
    return undefined;
  }

  // Try to find CA certificate
  const possibleCertPaths = [
    path.join(process.cwd(), "certs/ca.pem"),
    path.join(__dirname, "../certs/ca.pem"),
  ];

  for (const certPath of possibleCertPaths) {
    if (existsSync(certPath)) {
      return {
        rejectUnauthorized: process.env.NODE_ENV === "production",
        ca: readFileSync(certPath).toString(),
      };
    }
  }

  // For NEON, we can use lenient SSL
  if (connectionString.includes("neon.tech")) {
    return {
      rejectUnauthorized: false,
    };
  }

  // Fallback: use DB_SSL_CA env var
  if (process.env.DB_SSL_CA) {
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: process.env.DB_SSL_CA,
    };
  }

  // Default: lenient SSL for cloud databases
  return {
    rejectUnauthorized: false,
  };
}

// Get all tables in dependency order (respecting foreign keys)
async function getTablesInOrder(sourcePool: Pool): Promise<string[]> {
  const result = await sourcePool.query(`
    SELECT 
      schemaname,
      tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  const tables = result.rows.map((row: any) => row.tablename);

  // Get foreign key dependencies to determine order
  const fkResult = await sourcePool.query(`
    SELECT
      tc.table_name AS child_table,
      ccu.table_name AS parent_table
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_schema = 'public';
  `);

  const dependencies = new Map<string, Set<string>>();
  for (const row of fkResult.rows) {
    if (!dependencies.has(row.child_table)) {
      dependencies.set(row.child_table, new Set());
    }
    dependencies.get(row.child_table)!.add(row.parent_table);
  }

  // Topological sort
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(table: string) {
    if (visiting.has(table)) {
      // Circular dependency - just add it
      if (!visited.has(table)) {
        sorted.push(table);
        visited.add(table);
      }
      return;
    }
    if (visited.has(table)) return;

    visiting.add(table);
    const deps = dependencies.get(table);
    if (deps) {
      for (const dep of deps) {
        if (tables.includes(dep)) {
          visit(dep);
        }
      }
    }
    visiting.delete(table);
    if (!visited.has(table)) {
      sorted.push(table);
      visited.add(table);
    }
  }

  for (const table of tables) {
    visit(table);
  }

  // Add any tables that weren't included (shouldn't happen, but just in case)
  for (const table of tables) {
    if (!visited.has(table)) {
      sorted.push(table);
    }
  }

  return sorted;
}

// Get table row count
async function getTableCount(pool: Pool, tableName: string): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
  return parseInt(result.rows[0].count, 10);
}

// Copy data from source to target table
async function copyTable(
  sourcePool: Pool,
  targetPool: Pool,
  tableName: string
): Promise<number> {
  // Get column names and types
  const columnsResult = await sourcePool.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);

  const columns = columnsResult.rows.map((row: any) => row.column_name);
  const columnTypes = new Map<string, string>();
  columnsResult.rows.forEach((row: any) => {
    columnTypes.set(row.column_name, row.data_type);
  });
  const columnList = columns.map((col) => `"${col}"`).join(", ");

  // Check if table has sequences (for auto-increment columns)
  const sequenceResult = await sourcePool.query(`
    SELECT column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_default LIKE 'nextval%';
  `, [tableName]);

  const hasSequences = sequenceResult.rows.length > 0;

  // Check if table exists on target
  const tableExists = await targetPool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);

  if (!tableExists.rows[0]?.exists) {
    throw new Error(`Table "${tableName}" does not exist on target database. Please run migrations first.`);
  }

  // Disable user-defined triggers only (not system triggers like RI constraints)
  // NEON and some managed databases don't allow disabling system triggers
  try {
    await targetPool.query(`
      ALTER TABLE "${tableName}" DISABLE TRIGGER USER;
    `);
  } catch (err: any) {
    // If USER triggers can't be disabled, try to disable specific user triggers
    // If that fails too, continue without disabling triggers
    if (!err.message.includes("permission denied") && !err.message.includes("system trigger")) {
      throw err;
    }
    // Continue without disabling triggers - PostgreSQL will handle constraints
  }

  try {
    // Get all data from source
    const sourceData = await sourcePool.query(`SELECT ${columnList} FROM "${tableName}"`);

    if (sourceData.rows.length === 0) {
      return 0;
    }

    // Build insert query
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const insertQuery = `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    // Insert in batches for better performance
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < sourceData.rows.length; i += batchSize) {
      const batch = sourceData.rows.slice(i, i + batchSize);
      
      await targetPool.query("BEGIN");
      try {
        for (const row of batch) {
          const values = columns.map((col) => {
            const value = row[col];
            const dataType = columnTypes.get(col);
            
            // Handle JSONB columns - ensure they're properly serialized
            if (dataType === 'jsonb' || dataType === 'json') {
              if (value === null || value === undefined) {
                return null;
              }
              // If it's already a string, validate it's valid JSON
              if (typeof value === 'string') {
                try {
                  // Validate it's valid JSON by parsing
                  JSON.parse(value);
                  return value;
                } catch (e) {
                  // Invalid JSON string - log and skip this value
                  warn(`⚠️  Skipping row in ${tableName}: Invalid JSON in column "${col}": ${value.substring(0, 100)}`);
                  throw new Error(`Invalid JSON in ${tableName}.${col}`);
                }
              }
              // If it's an object/array, stringify it
              if (typeof value === 'object') {
                try {
                  return JSON.stringify(value);
                } catch (e) {
                  warn(`⚠️  Skipping row in ${tableName}: Could not stringify JSON in column "${col}"`);
                  throw new Error(`Could not stringify JSON in ${tableName}.${col}`);
                }
              }
              return value;
            }
            return value;
          });
          try {
            await targetPool.query(insertQuery, values);
            inserted++;
          } catch (insertErr: any) {
            // If it's a JSON error, log the problematic row and continue
            if (insertErr.code === '22P02' && insertErr.message.includes('json')) {
              warn(`⚠️  Skipping row in ${tableName} due to JSON error: ${insertErr.message.substring(0, 100)}`);
              // Continue to next row instead of failing the whole batch
              continue;
            }
            throw insertErr;
          }
        }
        await targetPool.query("COMMIT");
      } catch (err) {
        await targetPool.query("ROLLBACK");
        throw err;
      }
    }

    // Reset sequences if needed
    if (hasSequences) {
      for (const seqRow of sequenceResult.rows) {
        const maxResult = await targetPool.query(
          `SELECT COALESCE(MAX("${seqRow.column_name}"), 0) as max_val FROM "${tableName}"`
        );
        const maxVal = parseInt(maxResult.rows[0].max_val, 10) || 0;
        
        // Get sequence name from column_default
        const seqMatch = seqRow.column_default.match(/nextval\('([^']+)'/);
        if (seqMatch && seqMatch[1]) {
          const seqName = seqMatch[1].replace(/^public\./, "");
          await targetPool.query(`SELECT setval('${seqName}', $1, true)`, [maxVal]);
        }
      }
    }

    return inserted;
  } finally {
    // Re-enable user-defined triggers
    try {
      await targetPool.query(`ALTER TABLE "${tableName}" ENABLE TRIGGER USER;`);
    } catch (err: any) {
      // Ignore errors when re-enabling triggers (they may not have been disabled)
      if (!err.message.includes("permission denied") && !err.message.includes("system trigger")) {
        console.warn(`Warning: Could not re-enable triggers for ${tableName}: ${err.message}`);
      }
    }
  }
}

async function main() {
  log("\n🚀 Starting database migration to NEON Postgres\n", "bright");

  // Get connection strings
  const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  const targetUrl = 
    process.env.TARGET_DATABASE_URL || 
    "postgresql://neondb_owner:npg_wGoei3E1pZdX@ep-wandering-night-agpfwl6e-pooler.c-2.eu-central-1.aws.neon.tech/starchild?sslmode=require&channel_binding=require";

  if (!sourceUrl) {
    error("❌ SOURCE_DATABASE_URL or DATABASE_URL environment variable is required");
    process.exit(1);
  }

  if (!targetUrl) {
    error("❌ TARGET_DATABASE_URL environment variable is required");
    process.exit(1);
  }

  info(`Source: ${sourceUrl.replace(/:[^:@]+@/, ":****@")}`);
  info(`Target: ${targetUrl.replace(/:[^:@]+@/, ":****@")}\n`);

  const sourceSsl = getSslConfig(sourceUrl);
  const targetSsl = getSslConfig(targetUrl);

  // Create connection pools
  const sourcePool = new Pool({
    connectionString: sourceUrl,
    ssl: sourceSsl,
    max: 5,
  });

  const targetPool = new Pool({
    connectionString: targetUrl,
    ssl: targetSsl,
    max: 5,
  });

  try {
    // Test connections
    log("Testing database connections...", "cyan");
    await sourcePool.query("SELECT 1");
    success("Source database connection successful");
    
    await targetPool.query("SELECT 1");
    success("Target database connection successful\n");

    // Get all tables
    log("Discovering tables...", "cyan");
    const tables = await getTablesInOrder(sourcePool);
    success(`Found ${tables.length} tables: ${tables.join(", ")}\n`);

    // Check if schema exists on target
    log("Checking if schema exists on target database...", "cyan");
    const schemaCheck = await targetPool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'hexmusic-stream_%';
    `);
    
    const tableCount = parseInt(schemaCheck.rows[0]?.count || "0", 10);
    
    if (tableCount === 0) {
      error("\n❌ Schema not found on target database!");
      error("   The target database appears to be empty.");
      error("\n   Please run the following command first to create the schema:\n");
      log(`   DATABASE_URL="${targetUrl}" npm run db:push\n`, "bright");
      error("   Or if you prefer migrations:\n");
      log(`   DATABASE_URL="${targetUrl}" npm run db:migrate\n`, "bright");
      process.exit(1);
    } else if (tableCount < tables.length) {
      warn(`⚠️  Found ${tableCount} tables on target, but source has ${tables.length} tables.`);
      warn("   Some tables may be missing. Continuing anyway...\n");
    } else {
      success(`Schema exists on target database (${tableCount} tables found)\n`);
    }

    // Get row counts from source
    log("Counting rows in source database...", "cyan");
    const sourceCounts = new Map<string, number>();
    for (const table of tables) {
      const count = await getTableCount(sourcePool, table);
      sourceCounts.set(table, count);
      if (count > 0) {
        info(`${table}: ${count.toLocaleString()} rows`);
      }
    }

    const totalRows = Array.from(sourceCounts.values()).reduce((a, b) => a + b, 0);
    log(`\nTotal rows to migrate: ${totalRows.toLocaleString()}\n`, "bright");

    // Ask for confirmation
    if (process.env.SKIP_CONFIRM !== "true") {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(
          "⚠️  This will copy all data to the target database. Continue? (yes/no): ",
          resolve
        );
      });
      rl.close();

      if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
        log("Migration cancelled.", "yellow");
        process.exit(0);
      }
    }

    // Migrate each table
    log("\n🔄 Starting data migration...\n", "bright");
    const startTime = Date.now();
    let totalMigrated = 0;

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      if (!table) continue;
      const sourceCount = sourceCounts.get(table) ?? 0;

      if (sourceCount === 0) {
        log(`[${i + 1}/${tables.length}] ${table}: skipping (empty)`, "yellow");
        continue;
      }

      log(`[${i + 1}/${tables.length}] ${table}: migrating ${sourceCount.toLocaleString()} rows...`, "cyan");
      
      try {
        const migrated = await copyTable(sourcePool, targetPool, table);
        totalMigrated += migrated;
        success(`${table}: migrated ${migrated.toLocaleString()} rows`);
      } catch (err: any) {
        error(`${table}: failed - ${err.message}`);
        throw err;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n✅ Migration completed successfully!`, "green");
    log(`   Total rows migrated: ${totalMigrated.toLocaleString()}`, "green");
    log(`   Duration: ${duration}s\n`, "green");

    // Verify migration
    log("Verifying migration...", "cyan");
    let verified = true;
    for (const table of tables) {
      const sourceCount = sourceCounts.get(table) ?? 0;
      if (sourceCount === 0) continue;

      const targetCount = await getTableCount(targetPool, table);
      if (sourceCount !== targetCount) {
        error(`${table}: count mismatch (source: ${sourceCount}, target: ${targetCount})`);
        verified = false;
      } else {
        success(`${table}: verified (${targetCount.toLocaleString()} rows)`);
      }
    }

    if (verified) {
      log("\n✅ All tables verified successfully!\n", "green");
    } else {
      warn("\n⚠️  Some tables have count mismatches. Please review.\n");
    }

  } catch (err: any) {
    error(`\n❌ Migration failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});

