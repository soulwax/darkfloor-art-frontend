#!/usr/bin/env node
/**
 * Custom Next.js server wrapper
 * Provides centralized logging and startup configuration with chalk
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chalk from 'chalk';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// ENVIRONMENT LOADING
// ============================================
// Load .env first (base config)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load environment-specific file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.development') });
} else if (nodeEnv === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
}

// Load .env.local last (overrides everything, never commit this file)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================
// CONFIGURATION
// ============================================
const isDev = nodeEnv === 'development';
const port = process.env.PORT || (isDev ? 3412 : 3222);
const hostname = process.env.HOSTNAME || 'localhost';

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
// START SERVER
// ============================================
function startServer() {
  printStartupBanner();

  const nextBin = path.resolve(__dirname, '../node_modules/next/dist/bin/next');
  const command = isDev ? 'dev' : 'start';
  const args = [
    nextBin,
    command,
    '--port', port.toString(),
    '--hostname', hostname,
  ];

  // Add turbo flag only in development and expose to all interfaces
  if (isDev) {
    args.push('--turbo', '--hostname', '0.0.0.0');
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
// PERFORMANCE MONITORING
// ============================================
if (isDev) {
  // Monitor memory usage in development
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

    // Only log if memory usage is high (>1GB)
    if (memUsage.heapUsed > 1024 * 1024 * 1024) {
      logger.warn(`Memory usage: ${heapUsed} MB / ${heapTotal} MB`);
    }
  }, 60000); // Check every minute
}

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
