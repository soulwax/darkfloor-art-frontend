// File: src/server/db/index.ts

import { env } from "@/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";
import * as schema from "./schema";

// Ensure DATABASE_URL is set (required for main app, optional only for drizzle-kit)
if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for the application. It is only optional for drizzle-kit which can fall back to legacy DB_* variables."
  );
}

// Determine SSL configuration based on DATABASE_URL and certificate availability
function getSslConfig() {
  // Check if it's a cloud database (Aiven, AWS RDS, etc.) that requires SSL
  const isCloudDb = env.DATABASE_URL!.includes("aivencloud.com") || 
                    env.DATABASE_URL!.includes("rds.amazonaws.com") ||
                    env.DATABASE_URL!.includes("sslmode=");

  if (!isCloudDb && env.DATABASE_URL!.includes("localhost")) {
    // Local database - SSL not needed
    console.log("[DB] Local database detected. SSL disabled.");
    return undefined;
  }

  // Cloud database or SSL requested - try to find CA certificate
  const possibleCertPaths = [
    path.join(process.cwd(), "certs/ca.pem"), // Development
    path.join(__dirname, "../../certs/ca.pem"), // Relative to build output
    path.join(__dirname, "../../../certs/ca.pem"), // Another build variant
  ];

  // Try to read certificate from file first
  for (const certPath of possibleCertPaths) {
    if (existsSync(certPath)) {
      console.log(`[DB] Cloud database detected. Using SSL certificate: ${certPath}`);
      return {
        // Use false in development to accept self-signed certificates
        // In production, this should be true for security
        rejectUnauthorized: process.env.NODE_ENV === "production",
        ca: readFileSync(certPath).toString(),
      };
    }
  }

  // Fallback: Use DB_SSL_CA environment variable if set
  if (process.env.DB_SSL_CA) {
    console.log("[DB] Cloud database detected. Using SSL certificate from DB_SSL_CA environment variable");
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

const sslConfig = getSslConfig();

// Optimize for Vercel serverless (smaller pool) vs traditional server (larger pool)
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...(sslConfig && { ssl: sslConfig }),
  // Connection pool configuration optimized for environment
  max: isVercel ? 2 : 10, // Smaller pool for serverless to prevent connection exhaustion
  min: 0, // Allow pool to scale down to 0 connections when idle
  idleTimeoutMillis: isVercel ? 10000 : 60000, // Faster cleanup in serverless (10s vs 60s)
  connectionTimeoutMillis: 10000, // Connection timeout
  // Statement timeout to prevent long-running queries from holding connections
  statement_timeout: 30000, // 30 seconds
  // Enable keep-alive for serverless
  ...(isVercel && {
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  }),
});

// Add error handler for pool errors
pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
  // Don't exit - log and continue, let PM2 handle restarts if needed
});

// Add connection monitoring (optional, can be disabled in production)
if (process.env.NODE_ENV === "development") {
  pool.on("connect", () => {
    console.log("[DB] New client connected to pool");
  });

  pool.on("remove", () => {
    console.log("[DB] Client removed from pool");
  });
}

// Graceful shutdown - close pool when process exits
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => {
    console.log("[DB] SIGTERM received, closing database pool...");
    void pool.end();
  });

  process.on("SIGINT", () => {
    console.log("[DB] SIGINT received, closing database pool...");
    void pool.end();
  });
}

export const db = drizzle(pool, { schema });
export { pool }; // Export pool for monitoring

// Test database connection on startup
if (process.env.NODE_ENV === "development") {
  pool
    .query("SELECT NOW()")
    .then(() => {
      console.log("[DB] ✓ Database connection successful");
    })
    .catch((error) => {
      console.error("[DB] ✗ Database connection FAILED:");
      console.error(error);
      console.error("[DB] Please check your DATABASE_URL in .env.local");
    });
}
