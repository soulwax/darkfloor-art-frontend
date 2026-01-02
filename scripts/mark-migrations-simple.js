#!/usr/bin/env node
// Simple script to mark migrations as applied

import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env as fallback

// Determine SSL configuration based on database type
/**
 * @param {string} connectionString
 * @returns {import('pg').ClientConfig['ssl'] | undefined}
 */
function getSslConfig(connectionString) {
  // Neon handles SSL automatically via connection string
  if (connectionString.includes("neon.tech")) {
    return undefined;
  }

  // Check if it's a cloud database that requires SSL
  const isCloudDb = 
    connectionString.includes("aivencloud.com") || 
    connectionString.includes("rds.amazonaws.com") ||
    connectionString.includes("sslmode=");

  if (!isCloudDb && connectionString.includes("localhost")) {
    return undefined;
  }

  // Cloud database - try to find CA certificate
  const certPath = join(process.cwd(), "certs/ca.pem");
  
  if (existsSync(certPath)) {
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: readFileSync(certPath).toString(),
    };
  }

  // Fallback: Use DB_SSL_CA environment variable if set
  if (process.env.DB_SSL_CA) {
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: process.env.DB_SSL_CA,
    };
  }

  // Certificate not found - use lenient SSL
  return {
    rejectUnauthorized: false,
  };
}

// Debug: Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  console.error('   Make sure .env.local exists and contains DATABASE_URL');
  process.exit(1);
}

const migrations = [
  ['0000_eager_gideon', 1761660940932],
  ['0001_strange_warlock', 1762209104815],
  ['0002_stiff_the_phantom', 1762273361698],
  ['0003_chemical_mastermind', 1762304917316],
  ['0004_bizarre_violations', 1762311603879],
  ['0005_shocking_korath', 1762433511089],
  ['0006_good_zaran', 1762439527950],
  ['0007_thankful_purifiers', 1762439698829],
  ['0008_luxuriant_smasher', 1762439770023],
  ['0009_tidy_the_call', 1762523513765],
  ['0010_nostalgic_human_cannonball', 1762611491574],
  ['0011_useful_the_enforcers', 1762963675265],
  ['0012_remarkable_ronan', 1764822831151],
  ['0013_outgoing_sumo', 1764928015659],
  ['0014_petite_lady_ursula', 1767159995551]
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔧 Marking migrations as applied...\n');

  const sslConfig = getSslConfig(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    ...(sslConfig && { ssl: sslConfig }),
  });

  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at bigint
      );
    `);
    console.log('✓ Migration tracking table ready\n');

    let marked = 0;
    let skipped = 0;

    for (const [hash, createdAt] of migrations) {
      const result = await pool.query(
        'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2) ON CONFLICT (hash) DO NOTHING',
        [hash, createdAt]
      );
      
      if ((result.rowCount ?? 0) > 0) {
        console.log(`✓ ${hash} - marked as applied`);
        marked++;
      } else {
        console.log(`⊘ ${hash} - already marked`);
        skipped++;
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   Marked: ${marked} migrations`);
    console.log(`   Skipped: ${skipped} migrations (already applied)\n`);

    // Verify
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM "__drizzle_migrations"'
    );
    console.log(`📊 Total migrations in tracking table: ${verifyResult.rows[0].count}\n`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error('Fatal error:', errorMessage);
  console.error(err);
  process.exit(1);
});
