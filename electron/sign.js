const { execSync } = require('child_process');
const path = require('path');

/**
 * Custom signing function for electron-builder using signtool.exe
 * @param {Object} configuration - Signing configuration
 * @param {string} configuration.path - Path to the file to sign
 * @param {string} configuration.hash - Hash algorithm (sha1 or sha256)
 * @param {boolean} configuration.isNest - Whether this is a nested signing
 */
module.exports = async function (configuration) {
  const { path: filePath, hash } = configuration;

  // Get certificate details from environment variables
  const certificateFile = process.env.WINDOWS_CERTIFICATE_FILE;
  const certificatePassword = process.env.WINDOWS_CERTIFICATE_PASSWORD;
  const timestampUrl = process.env.WINDOWS_TIMESTAMP_URL || 'http://timestamp.digicert.com';

  // If no certificate is configured, skip signing
  if (!certificateFile) {
    console.log('⚠️  No certificate file specified. Skipping code signing.');
    console.log('   Set WINDOWS_CERTIFICATE_FILE environment variable to enable signing.');
    return;
  }

  console.log(`🔐 Signing: ${path.basename(filePath)}`);

  // Build signtool command
  const signtoolArgs = [
    'sign',
    '/f', `"${certificateFile}"`,
    certificatePassword ? `/p "${certificatePassword}"` : '',
    '/fd', hash || 'sha256',
    '/tr', timestampUrl,
    '/td', 'sha256',
    '/v', // Verbose
    `"${filePath}"`
  ].filter(Boolean); // Remove empty strings

  const command = `signtool ${signtoolArgs.join(' ')}`;

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      windowsHide: true
    });
    console.log('✅ Signing successful');
    if (output) {
      console.log(output);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Signing failed:', err.message);
    if ('stdout' in err && err.stdout) {
      console.error('stdout:', err.stdout);
    }
    if ('stderr' in err && err.stderr) {
      console.error('stderr:', err.stderr);
    }
    throw err;
  }
};
