// File: scripts/check-users.ts

import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";

// Load environment variables
dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: true,
    ca: readFileSync(path.join(process.cwd(), "certs/ca.pem")).toString(),
  },
});

async function checkUsers() {
  try {
    console.log("Connecting to database...");

    // Get all users
    const result = await pool.query(`
      SELECT id, name, email, "userHash", "profilePublic"
      FROM "hexmusic-stream_user"
      ORDER BY "emailVerified" DESC NULLS LAST
      LIMIT 10
    `);

    console.log(`\nFound ${result.rowCount} user(s) in the database:\n`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} (${row.email})`);
      console.log(`   ID: ${row.id}`);
      console.log(`   userHash: ${row.userHash ?? "NULL"}`);
      console.log(`   profilePublic: ${row.profilePublic}`);
      console.log("");
    });

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
    process.exit(1);
  }
}

checkUsers();
