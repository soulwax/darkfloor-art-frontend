// File: drizzle.config.ts

import { config as dotenvConfig } from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";

// IMPORTANT: Load .env.local FIRST with override: true to ensure it takes precedence
// Then load .env as fallback. This ensures .env.local has priority.
dotenvConfig({ path: ".env.local", override: true });
dotenvConfig(); // Load .env as fallback

// Now import drizzle.env.ts after .env.local is loaded
import drizzleEnv from "./drizzle.env";

// Determine SSL configuration based on database type and certificate availability
function getSslConfig() {
  // Normalize DATABASE_URL to handle empty strings (empty strings should trigger fallback)
  const rawUrl = process.env.DATABASE_URL?.trim();
  const databaseUrl = rawUrl && rawUrl.length > 0 ? rawUrl : undefined;
  
  // For SSL detection, use DATABASE_URL if available, otherwise use host from legacy variables
  // We only need the host for detection (checking if it's localhost, neon, cloud, etc.)
  const connectionString = databaseUrl ?? (drizzleEnv.DB_HOST ?? "");

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
    console.log("[Drizzle] Local database detected. SSL disabled.");
    return undefined;
  }

  // Cloud database - try to find CA certificate
  const certPath = path.join(process.cwd(), "certs/ca.pem");
  
  if (existsSync(certPath)) {
    console.log(`[Drizzle] Using SSL certificate: ${certPath}`);
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: readFileSync(certPath).toString(),
    };
  }

  // Fallback: Use DB_SSL_CA environment variable if set
  if (process.env.DB_SSL_CA) {
    console.log("[Drizzle] Using SSL certificate from DB_SSL_CA environment variable");
    return {
      rejectUnauthorized: process.env.NODE_ENV === "production",
      ca: process.env.DB_SSL_CA,
    };
  }

  // Certificate not found - use lenient SSL with warning
  console.warn("[Drizzle] ⚠️  WARNING: Cloud database detected but no CA certificate found!");
  console.warn("[Drizzle] ⚠️  Using rejectUnauthorized: false - vulnerable to MITM attacks");
  console.warn("[Drizzle] ⚠️  Set DB_SSL_CA environment variable or place your CA certificate at: certs/ca.pem");
  return {
    rejectUnauthorized: false,
  };
}

// Use DATABASE_URL if available, otherwise fall back to individual credentials
// for backward compatibility with drizzle.env.ts
// Normalize empty strings to undefined to match src/env.js behavior
const rawUrl = process.env.DATABASE_URL?.trim();
const databaseUrl = rawUrl && rawUrl.length > 0 ? rawUrl : undefined;

if (!databaseUrl && !process.env.DB_HOST) {
  console.warn(
    "[Drizzle] Warning: Neither DATABASE_URL nor DB_HOST is set. Database operations may fail."
  );
}

const config = {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql" as const,
  ...(databaseUrl
    ? {
        // Use connection string (Neon or other PostgreSQL)
        dbCredentials: {
          url: databaseUrl,
        },
      }
    : {
        // Fallback to individual credentials if DATABASE_URL is not set or empty
        dbCredentials: {
          host: drizzleEnv.DB_HOST ?? "localhost",
          port: parseInt(drizzleEnv.DB_PORT ?? "5432", 10),
          user: drizzleEnv.DB_ADMIN_USER,
          password: drizzleEnv.DB_ADMIN_PASSWORD,
          database: drizzleEnv.DB_NAME ?? "postgres",
          ssl: getSslConfig(),
        },
      }),
};

export default config;