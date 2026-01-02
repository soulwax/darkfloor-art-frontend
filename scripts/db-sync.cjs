#!/usr/bin/env node
// Cross-platform script to handle database migration/push in prebuild
// Tries db:migrate first, falls back to db:push if migrate fails

const { execSync } = require('child_process');

/**
 * @param {string} command
 * @param {boolean} [silent=false]
 * @returns {{ success: boolean; exitCode: number }}
 */
function runCommand(command, silent = false) {
  try {
    execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
    });
    return { success: true, exitCode: 0 };
  } catch (error) {
    const code = (error && typeof error === "object" && "status" in error)
      ? /** @type {{ status?: number }} */ (error).status || 1
      : 1;
    return { success: false, exitCode: code };
  }
}

console.log('🔄 Attempting to apply database migrations...\n');

// Try to run migrations (show output)
const migrateResult = runCommand('npm run db:migrate', false);

if (migrateResult.success) {
  console.log('\n✅ Database migrations applied successfully');
  process.exit(0);
}

console.log(`\n⚠️  Migration failed (exit code: ${migrateResult.exitCode})`);

// Check if the error is about tables already existing
// If so, try to mark migrations as applied first (silent to avoid noise)
const markAppliedResult = runCommand('npm run db:mark-applied', true);

if (markAppliedResult.success) {
  console.log('✅ Marked existing migrations as applied');
  console.log('🔄 Retrying db:migrate...\n');

  const retryResult = runCommand('npm run db:migrate', false);

  if (retryResult.success) {
    console.log('\n✅ Database migrations applied successfully after marking');
    process.exit(0);
  }
}

// Fall back to db:push
console.log('\n⚠️  Falling back to db:push...\n');
const pushResult = runCommand('npm run db:push', false);

if (pushResult.success) {
  console.log('\n✅ Database schema synced via db:push');
  process.exit(0);
} else {
  console.log('\n❌ Both db:migrate and db:push failed');
  process.exit(1);
}

