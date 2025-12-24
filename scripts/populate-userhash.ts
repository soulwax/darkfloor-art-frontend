// File: scripts/populate-userhash.ts

import dotenv from "dotenv";
import { Pool } from "pg";

// Load environment variables
dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
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
