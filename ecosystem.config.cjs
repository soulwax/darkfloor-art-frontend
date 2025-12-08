/* File: ecosystem.config.cjs */
/* * */

const dotenv = require('dotenv');
const path = require('path');

// load dotenv variables conditionally based on NODE_ENV
const envPath = (() => {
  const basePath = path.resolve(__dirname, '.env');
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'development') {
    return `${basePath}.development`;
  } else if (nodeEnv === 'production') {
    return `${basePath}.production`;
  }
  return basePath;
})();

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
// Load environment-specific file
dotenv.config({ path: envPath });
// Load .env.local last (overrides everything)
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

module.exports = {
  apps: [
    {
      // ============================================
      // PRODUCTION CONFIGURATION
      // ============================================
      name: 'starchild-music-frontend-prod',
      script: 'scripts/server.js',
      args: '',
      interpreter: 'node',

      // ============================================
      // CLUSTER & PERFORMANCE
      // ============================================
      instances: 2, // 2 instances (leaving 2 cores for system/DB)
      exec_mode: 'cluster', // Enable load balancing

      // ============================================
      // MEMORY MANAGEMENT
      // ============================================
      max_memory_restart: '2G', // Restart if memory exceeds 2GB per instance
      min_uptime: '10s', // Minimum uptime before considered stable

      // ============================================
      // AUTO-RESTART & ERROR HANDLING
      // ============================================
      autorestart: true, // Auto-restart on crash
      max_restarts: 10, // Max restarts within restart_delay window
      restart_delay: 4000, // Wait 4s before restart
      kill_timeout: 5000, // Grace period before force kill (5s)
      listen_timeout: 3000, // Wait 3s for app to be ready

      // Exponential backoff for restarts (prevents crash loops)
      exp_backoff_restart_delay: 100,

      // ============================================
      // ENVIRONMENT & VARIABLES
      // ============================================
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3222,
      },

      // ============================================
      // LOGGING
      // ============================================
      // Combine logs for easier debugging
      combine_logs: true,
      merge_logs: true,

      // Log file paths
      error_file: './logs/pm2/error.log',
      out_file: './logs/pm2/out.log',
      log_file: './logs/pm2/combined.log',

      // Log formatting
      time: true, // Prefix logs with timestamp
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ============================================
      // PROCESS MONITORING
      // ============================================
      // Disable watch in production (use pm2 reload instead)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],

      // ============================================
      // ADVANCED OPTIONS
      // ============================================
      // Graceful shutdown
      shutdown_with_message: true,

      // Source map support for better error traces
      source_map_support: true,

      // Instance variables (useful for debugging which instance handled request)
      instance_var: 'INSTANCE_ID',

      // ============================================
      // HEALTH CHECKS & MONITORING
      // ============================================
      // PM2 will send SIGINT for graceful shutdown
      // Next.js handles this automatically
    },
    {
      // ============================================
      // DEVELOPMENT CONFIGURATION
      // ============================================
      name: 'starchild-music-frontend-dev',
      script: 'scripts/server.js',
      args: '',
      interpreter: 'node',

      // ============================================
      // CLUSTER & PERFORMANCE
      // ============================================
      instances: 1, // Single instance for development
      exec_mode: 'fork', // Fork mode for development

      // ============================================
      // MEMORY MANAGEMENT
      // ============================================
      max_memory_restart: '2G', // Restart if memory exceeds 2GB
      min_uptime: '5s', // Minimum uptime before considered stable

      // ============================================
      // AUTO-RESTART & ERROR HANDLING
      // ============================================
      autorestart: true, // Auto-restart on crash
      max_restarts: 10, // Max restarts within restart_delay window
      restart_delay: 2000, // Wait 2s before restart
      kill_timeout: 5000, // Grace period before force kill (5s)
      listen_timeout: 3000, // Wait 3s for app to be ready

      // Exponential backoff for restarts (prevents crash loops)
      exp_backoff_restart_delay: 100,

      // ============================================
      // ENVIRONMENT & VARIABLES
      // ============================================
      env: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 3412,
      },

      // ============================================
      // LOGGING
      // ============================================
      // Combine logs for easier debugging
      combine_logs: true,
      merge_logs: true,

      // Log file paths
      error_file: './logs/pm2/dev-error.log',
      out_file: './logs/pm2/dev-out.log',
      log_file: './logs/pm2/dev-combined.log',

      // Log formatting
      time: true, // Prefix logs with timestamp
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ============================================
      // PROCESS MONITORING
      // ============================================
      // Enable watch in development for hot reload
      watch: true,
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'logs', '.next', '.git', 'dist'],

      // ============================================
      // ADVANCED OPTIONS
      // ============================================
      // Graceful shutdown
      shutdown_with_message: true,

      // Source map support for better error traces
      source_map_support: true,

      // Instance variables (useful for debugging which instance handled request)
      instance_var: 'INSTANCE_ID',
    },
  ],

  // ============================================
  // PM2 DEPLOY CONFIGURATION (Optional)
  // ============================================
  deploy: {
    production: {
      user: 'node',
      host: ['soulwax.dev'],
      ref: 'origin/main',
      repo: 'git@github.com:soulwax/starchild-music-frontend.git',
      path: '/home/soulwax/workspace/Web/Frontends/starchild-music-frontend',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
