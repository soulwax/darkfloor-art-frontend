// File: scripts/set-profile-public.ts

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

async function setProfilePublic() {
  try {
    console.log("Connecting to database...");

    // Update the soulwax user to have profilePublic = true
    const result = await pool.query(`
      UPDATE "hexmusic-stream_user"
      SET "profilePublic" = true
      WHERE email = 'dabox.mailer@gmail.com'
      RETURNING id, name, email, "userHash", "profilePublic"
    `);

    if (result.rowCount === 0) {
      console.log("❌ User not found");
    } else {
      const user = result.rows[0];
      console.log("\n✅ Successfully updated user profile:");
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   userHash: ${user.userHash}`);
      console.log(`   profilePublic: ${user.profilePublic}`);
      console.log(`\n🎉 Your profile is now accessible at: /${user.userHash}`);
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
    process.exit(1);
  }
}

setProfilePublic();
