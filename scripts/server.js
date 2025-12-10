#!/usr/bin/env node
// File: scripts/server.js

/**
 * Custom Next.js server wrapper
 * Provides centralized logging and startup configuration with chalk
 */

import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// ENVIRONMENT LOADING
// ============================================
// Load .env first (base config)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ============================================
// CONFIGURATION
// ============================================
const nodeEnv = process.env.NODE_ENV || 'production';
const isDev = nodeEnv === 'development';

// In development mode, load .env.development (overrides .env)
if (isDev) {
  dotenv.config({ path: path.resolve(__dirname, '../.env.development') });
}

// PORT is required - use PORT from env (set by PM2 or loaded from .env/.env.development)
const port = process.env.PORT;
if (!port) {
  console.error('Error: PORT environment variable is required. Please set it in .env file (production) or .env.development file (development) or via PM2.');
  process.exit(1);
}
// In dev mode, bind to all interfaces (0.0.0.0) to allow network access
// In production, use localhost or HOSTNAME from env
const hostname = process.env.HOSTNAME || (isDev ? '0.0.0.0' : 'localhost');

// ============================================
// CENTRALIZED LOGGING WITH CHALK
// ============================================
const logger = {
  /** @param {string} message */
  info: (message) => {
    const timestamp = chalk.gray(`[${new Date().toISOString()}]`);
    console.log(`${timestamp} ${chalk.cyan('ℹ')} ${message}`);
  },

  /** @param {string} message */
  success: (message) => {
    const timestamp = chalk.gray(`[${new Date().toISOString()}]`);
    console.log(`${timestamp} ${chalk.green('✓')} ${message}`);
  },

  /** @param {string} message */
  warn: (message) => {
    const timestamp = chalk.gray(`[${new Date().toISOString()}]`);
    console.log(`${timestamp} ${chalk.yellow('⚠')} ${message}`);
  },

  /** @param {string} message */
  error: (message) => {
    const timestamp = chalk.gray(`[${new Date().toISOString()}]`);
    console.error(`${timestamp} ${chalk.red('✗')} ${message}`);
  },

  /** @param {string} message */
  debug: (message) => {
    const timestamp = chalk.gray(`[${new Date().toISOString()}]`);
    console.log(`${timestamp} ${chalk.magenta('⚙')} ${chalk.dim(message)}`);
  },

  /**
   * @param {string} title
   * @param {string} icon
   */
  section: (title, icon = '🎵') => {
    const line = chalk.cyan.bold('═'.repeat(70));
    console.log(`\n${line}`);
    console.log(chalk.cyan.bold(`  ${icon} ${title}`));
    console.log(`${line}\n`);
  },
};

// ============================================
// SYSTEM INFO
// ============================================
function getSystemInfo() {
  const cpus = os.cpus();
  const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

  return {
    platform: os.platform(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuCores: cpus.length,
    totalMemory: `${totalMemory} GB`,
    freeMemory: `${freeMemory} GB`,
    nodeVersion: process.version,
  };
}

// ============================================
// STARTUP BANNER
// ============================================
function printStartupBanner() {
  console.clear();

  logger.section('Starchild Music Frontend Server', '🎵');

  // Environment Configuration
  console.log(chalk.bold('  Environment Configuration:'));
  console.log(`    ${chalk.gray('•')} Environment:     ${chalk.bold.cyan(nodeEnv.toUpperCase())}`);
  console.log(`    ${chalk.gray('•')} Port:            ${chalk.bold.green(port)}`);
  console.log(`    ${chalk.gray('•')} Hostname:        ${chalk.bold.blue(hostname)}`);
  console.log(`    ${chalk.gray('•')} Mode:            ${chalk.bold.yellow(isDev ? 'Development (Turbo)' : 'Production')}`);
  console.log(`    ${chalk.gray('•')} Process ID:      ${chalk.bold.magenta(process.pid)}\n`);

  // System Information
  const sysInfo = getSystemInfo();
  console.log(chalk.bold('  System Information:'));
  console.log(`    ${chalk.gray('•')} Platform:        ${chalk.white(sysInfo.platform)} (${sysInfo.arch})`);
  console.log(`    ${chalk.gray('•')} Node Version:    ${chalk.white(sysInfo.nodeVersion)}`);
  console.log(`    ${chalk.gray('•')} CPU:             ${chalk.white(sysInfo.cpuCores + 'x ' + sysInfo.cpuModel)}`);
  console.log(`    ${chalk.gray('•')} Memory:          ${chalk.white(sysInfo.freeMemory)} free of ${chalk.white(sysInfo.totalMemory)}\n`);

  // Database Configuration
  if (process.env.DB_HOST) {
    console.log(chalk.bold('  Database Configuration:'));
    console.log(`    ${chalk.gray('•')} Host:            ${chalk.white(process.env.DB_HOST)}`);
    console.log(`    ${chalk.gray('•')} Port:            ${chalk.white(process.env.DB_PORT)}`);
    console.log(`    ${chalk.gray('•')} Database:        ${chalk.white(process.env.DB_NAME)}`);
    console.log(`    ${chalk.gray('•')} User:            ${chalk.white(process.env.DB_ADMIN_USER)}\n`);
  }

  // API Configuration
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log(chalk.bold('  API Configuration:'));
    console.log(`    ${chalk.gray('•')} API URL:         ${chalk.white(process.env.NEXT_PUBLIC_API_URL)}`);
    if (process.env.SONGBIRD_PUBLIC_API_URL) {
      console.log(`    ${chalk.gray('•')} Songbird API:    ${chalk.white(process.env.SONGBIRD_PUBLIC_API_URL)}`);
    }
    console.log('');
  }

  if (isDev) {
    logger.warn('Running in development mode with hot reload enabled');
  } else {
    logger.info('Running in production mode');
  }

  console.log('');
}

// ============================================
// BUILD VALIDATION & AUTO-RECOVERY
// ============================================
/**
 * Ensures production build exists, building automatically if missing
 * @returns {boolean} True if build is valid or was built successfully, false otherwise
 */
function ensureProductionBuild() {
  if (isDev) {
    return true; // No validation needed in development
  }

  const buildIdPath = path.resolve(__dirname, '../.next/BUILD_ID');
  const nextDirPath = path.resolve(__dirname, '../.next');
  const serverDirPath = path.resolve(__dirname, '../.next/server');

  // Check if build exists and is complete
  const buildExists = existsSync(buildIdPath) && existsSync(nextDirPath) && existsSync(serverDirPath);

  if (!buildExists) {
    logger.warn('Production build not found or incomplete');
    
    // Try to build automatically
    logger.info('Attempting to build automatically...');
    try {
      execSync('npm run build', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' },
      });
      
      // Verify build was successful
      if (existsSync(buildIdPath) && existsSync(serverDirPath)) {
        logger.success('Production build created successfully');
        return true;
      } else {
        logger.error('Build completed but BUILD_ID or server directory still missing');
        return false;
      }
    } catch (error) {
      logger.error('Automatic build failed');
      logger.error('Please run "npm run build" manually to create a production build');
      return false;
    }
  }

  logger.success('Production build validated successfully');
  return true;
}

// ============================================
// START SERVER
// ============================================
function startServer() {
  // Ensure production build exists (builds automatically if missing)
  if (!ensureProductionBuild()) {
    logger.error('Cannot start production server without a valid build');
    logger.error('Exiting to prevent crash loop. Please build the application first.');
    process.exit(1);
  }

  printStartupBanner();

  const nextBin = path.resolve(__dirname, '../node_modules/next/dist/bin/next');
  const command = isDev ? 'dev' : 'start';
  const args = [
    nextBin,
    command,
    '--port', port.toString(),
    '--hostname', hostname,
  ];

  // Add turbo flag only in development
  if (isDev) {
    args.push('--turbo');
  }

  logger.info(`Starting Next.js ${isDev ? 'development' : 'production'} server...`);
  logger.debug(`Command: node ${args.join(' ')}`);
  console.log('');

  const serverProcess = spawn('node', args, {
    env: {
      ...process.env,
      NODE_ENV: nodeEnv,
      PORT: port.toString(),
      HOSTNAME: hostname,
      NEXT_TELEMETRY_DISABLED: '1', // Disable telemetry for cleaner logs
    },
    stdio: 'inherit',
  });

  serverProcess.on('error', (error) => {
    logger.error(`Server Error: ${error.message}`);
    process.exit(1);
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      logger.error(`Server exited with code ${code}${signal ? ` (Signal: ${signal})` : ''}`);
      process.exit(code || 1);
    } else {
      logger.success('Server stopped gracefully');
      process.exit(0);
    }
  });

  // Handle graceful shutdown
  /** @type {NodeJS.Signals[]} */
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      logger.warn(`Received ${signal}, shutting down gracefully...`);
      serverProcess.kill(signal);
    });
  });

  // Log when server is ready
  setTimeout(() => {
    logger.section('Server Ready', '🚀');

    const localUrl = `http://${hostname}:${port}`;
    console.log(`    ${chalk.bold('Local:')}     ${chalk.green.bold.underline(localUrl)}`);

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Try to get network interfaces
      const interfaces = os.networkInterfaces();
      const networkAddresses = [];

      for (const name of Object.keys(interfaces)) {
        const interfaceList = interfaces[name];
        if (interfaceList) {
          for (const iface of interfaceList) {
            if (iface.family === 'IPv4' && !iface.internal) {
              networkAddresses.push(iface.address);
            }
          }
        }
      }

      if (networkAddresses.length > 0) {
        console.log(`    ${chalk.bold('Network:')}   ${chalk.cyan(`http://${networkAddresses[0]}:${port}`)}`);
      } else {
        console.log(`    ${chalk.bold('Network:')}   ${chalk.dim('Use --hostname 0.0.0.0 to expose')}`);
      }
    }

    console.log('');

    if (isDev) {
      logger.info(chalk.cyan('Ready for changes. Press Ctrl+C to stop.'));
    } else {
      logger.info(chalk.green('Production server is running'));
    }

    console.log('');
  }, 2000);
}

// ============================================
// ERROR HANDLING
// ============================================
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}`);
  if (reason instanceof Error) {
    logger.error(`Reason: ${reason.message}`);
    if (reason.stack) {
      logger.error(reason.stack);
    }
  } else {
    logger.error(`Reason: ${String(reason)}`);
  }
  // Don't exit - let PM2 handle restarts based on error patterns
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  if (error.stack) {
    logger.error(error.stack);
  }
  // Exit gracefully - PM2 will restart
  process.exit(1);
});

// ============================================
// PERFORMANCE MONITORING
// ============================================
// Monitor memory usage in both dev and production
// More frequent in dev, less frequent in production
const memoryCheckInterval = isDev ? 60000 : 300000; // 1 min dev, 5 min prod
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const rss = (memUsage.rss / 1024 / 1024).toFixed(2);

  // Log in dev always, or in prod if memory is high (>1GB heap or >1.5GB RSS)
  if (isDev || memUsage.heapUsed > 1024 * 1024 * 1024 || memUsage.rss > 1536 * 1024 * 1024) {
    logger.warn(`Memory: ${heapUsed}MB heap / ${heapTotal}MB total / ${rss}MB RSS`);
  }
}, memoryCheckInterval);

// ============================================
// RUN
// ============================================
try {
  startServer();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Failed to start server: ${errorMessage}`);
  console.error(error);
  process.exit(1);
}
