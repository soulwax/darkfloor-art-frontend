// File: scripts/populate-userhash.ts

import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Determine SSL configuration based on database type and certificate availability
function getSslConfig(connectionString: string) {
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
    // Local database - SSL not needed
    return undefined;
  }

  // Cloud database - try to find CA certificate
  const certPath = path.join(process.cwd(), "certs/ca.pem");
  
  if (existsSync(certPath)) {
    console.log(`[DB] Using SSL certificate: ${certPath}`);
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: readFileSync(certPath).toString(),
    };
  }

  // Fallback: Use DB_SSL_CA environment variable if set
  if (process.env.DB_SSL_CA) {
    console.log("[DB] Using SSL certificate from DB_SSL_CA environment variable");
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: process.env.DB_SSL_CA,
    };
  }

  // Certificate not found - use lenient SSL with warning
  console.warn("[DB] ⚠️  WARNING: Cloud database detected but no CA certificate found!");
  console.warn("[DB] ⚠️  Using rejectUnauthorized: false - vulnerable to MITM attacks");
  console.warn("[DB] ⚠️  Set DB_SSL_CA environment variable or place your CA certificate at: certs/ca.pem");
  return {
    rejectUnauthorized: false,
  };
}

if (!process.env.DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

const sslConfig = getSslConfig(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(sslConfig && { ssl: sslConfig }),
});

async function populateUserHash() {
  try {
    console.log("Connecting to database...");

    // Check how many users have null userHash
    const checkResult = await pool.query(
      'SELECT COUNT(*) as count FROM "hexmusic-stream_user" WHERE "userHash" IS NULL',
    );
    console.log(
      `Found ${checkResult.rows[0]?.count ?? 0} users without userHash`,
    );

    if (parseInt(checkResult.rows[0]?.count ?? "0") === 0) {
      console.log("No users need userHash population. Exiting.");
      await pool.end();
      return;
    }

    // Populate userHash for users who don't have one
    console.log("Populating userHash for existing users...");
    const result = await pool.query(`
      UPDATE "hexmusic-stream_user"
      SET "userHash" = SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 16)
      WHERE "userHash" IS NULL
      RETURNING id, name, "userHash"
    `);

    console.log(`✅ Successfully updated ${result.rowCount} user(s):`);
    result.rows.forEach((row) => {
      console.log(`  - ${row.name} (${row.id}): ${row.userHash}`);
    });

    await pool.end();
    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error running migration:", error);
    await pool.end();
    process.exit(1);
  }
}

populateUserHash();
