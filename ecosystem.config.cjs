// File: ecosystem.config.cjs

/* File: ecosystem.config.cjs */
/* * */

const dotenv = require("dotenv");
const path = require("path");

// Load .env for production
dotenv.config({ path: path.resolve(__dirname, ".env") });
const PORT = process.env.PORT || "3222";

// Load .env.development for dev server configuration
// Parse it separately without modifying process.env
const fs = require("fs");
const devEnvPath = path.resolve(__dirname, ".env.development");
let DEV_PORT = "3412";
if (fs.existsSync(devEnvPath)) {
  const devEnvResult = dotenv.parse(fs.readFileSync(devEnvPath, "utf8"));
  DEV_PORT = devEnvResult.PORT || "3412";
}

module.exports = {
  apps: [
    {
      // ============================================
      // PRODUCTION CONFIGURATION
      // ============================================
      name: "starchild-music-frontend-prod",
      script: "scripts/server.js",
      args: "",
      interpreter: "node",
      instances: 1, // Single instance (Next.js is already optimized, doesn't work well with PM2 cluster mode)
      exec_mode: "fork", // Fork mode (Next.js binds to port directly, incompatible with PM2 cluster mode)

      // ============================================
      // MEMORY MANAGEMENT
      // ============================================
      max_memory_restart: "2G", // Restart if memory exceeds 2GB per instance
      min_uptime: "30s", // Minimum uptime before considered stable (increased from 10s for Next.js)

      // ============================================
      // AUTO-RESTART & ERROR HANDLING
      // ============================================
      autorestart: true, // Auto-restart on crash
      max_restarts: 10, // Max restarts within restart_delay window
      restart_delay: 5000, // Wait 5s before restart (increased from 4s for graceful shutdown)
      kill_timeout: 5000, // Grace period before force kill (5s)
      listen_timeout: 10000, // Wait 10s for app to be ready (increased from 3s for Next.js startup)
      wait_ready: true, // Wait for Next.js ready signal

      // Exponential backoff for restarts (prevents crash loops)
      exp_backoff_restart_delay: 100,

      // Pre-start hook: Ensure build exists before starting
      // This automatically builds if BUILD_ID is missing, preventing crash loops
      pre_start: "node scripts/ensure-build.js",

      // ============================================
      // ENVIRONMENT & VARIABLES
      // ============================================
      env: {
        NODE_ENV: "production",
        PORT: PORT,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORT,
      },

      // ============================================
      // LOGGING
      // ============================================
      // Combine logs for easier debugging
      combine_logs: true,
      merge_logs: true,

      // Log file paths
      error_file: "./logs/pm2/error.log",
      out_file: "./logs/pm2/out.log",
      log_file: "./logs/pm2/combined.log",

      // Log formatting
      time: true, // Prefix logs with timestamp
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // ============================================
      // PROCESS MONITORING
      // ============================================
      // Disable watch in production (use pm2 reload instead)
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next"],

      // ============================================
      // ADVANCED OPTIONS
      // ============================================
      // Graceful shutdown
      shutdown_with_message: true,

      // Source map support for better error traces
      source_map_support: true,

      // Instance variables (useful for debugging which instance handled request)
      instance_var: "INSTANCE_ID",

      // ============================================
      // HEALTH CHECKS & MONITORING
      // ============================================
      // PM2 will send SIGINT for graceful shutdown
      // Next.js handles this automatically
      
      // Health check configuration - PM2 will check if the app is actually responding
      health_check_grace_period: 5000, // Grace period after startup before health checks start
      health_check_fatal_exceptions: true, // Treat health check failures as fatal (restart the app)
      health_check_url: `http://localhost:${PORT}/api/health`, // Health check endpoint - uses PORT from .env
    },
    {
      // ============================================
      // DEVELOPMENT CONFIGURATION
      // ============================================
      name: "starchild-music-frontend-dev",
      script: "scripts/server.js",
      args: "",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",

      // ============================================
      // MEMORY MANAGEMENT
      // ============================================
      max_memory_restart: "2G",
      min_uptime: "30s",

      // ============================================
      // AUTO-RESTART & ERROR HANDLING
      // ============================================
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,

      // Exponential backoff for restarts
      exp_backoff_restart_delay: 100,

      // No pre-start hook for dev (no build needed)

      // ============================================
      // ENVIRONMENT & VARIABLES
      // ============================================
      env: {
        NODE_ENV: "development",
        PORT: DEV_PORT,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: DEV_PORT,
      },

      // ============================================
      // LOGGING
      // ============================================
      combine_logs: true,
      merge_logs: true,

      // Separate log files for dev
      error_file: "./logs/pm2/dev-error.log",
      out_file: "./logs/pm2/dev-out.log",
      log_file: "./logs/pm2/dev-combined.log",

      // Log formatting
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // ============================================
      // PROCESS MONITORING
      // ============================================
      // Watch mode enabled for development
      watch: true,
      ignore_watch: ["node_modules", "logs", ".next", "dist", "drizzle"],

      // ============================================
      // ADVANCED OPTIONS
      // ============================================
      shutdown_with_message: true,
      source_map_support: true,
      instance_var: "INSTANCE_ID",

      // ============================================
      // HEALTH CHECKS & MONITORING
      // ============================================
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: true,
      health_check_url: `http://localhost:${DEV_PORT}/api/health`, // Health check endpoint - uses DEV_PORT from .env
    },
  ],

  // ============================================
  // PM2 DEPLOY CONFIGURATION (Optional)
  // ============================================
  deploy: {
    production: {
      user: "node",
      host: ["soulwax.dev"],
      ref: "origin/main",
      repo: "git@github.com:soulwax/starchild-music-frontend.git",
      path: "/home/soulwax/workspace/Web/Frontends/starchild-music-frontend",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.cjs --env production --update-env",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },
  },
};
 