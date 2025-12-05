#!/usr/bin/env node
// Script to load .env.local and run a command with those environment variables

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load dotenv
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Get the command from arguments
const command = process.argv.slice(2).join(' ');

if (!command) {
  console.error('❌ No command provided');
  console.log('Usage: node load-env-build.js <command>');
  process.exit(1);
}

console.log(`🔧 Loading environment from .env.local`);
console.log(`📦 Running: ${command}`);

try {
  execSync(command, {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ Command completed successfully');
} catch (error) {
  console.error('❌ Command failed');
  let exitCode = 1;
  if (error && typeof error === 'object' && 'status' in error) {
    exitCode = typeof error.status === 'number' ? error.status : 1;
  }
  process.exit(exitCode);
}
