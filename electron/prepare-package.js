// File: electron/prepare-package.js
// Prepare Next.js standalone package for Electron
// This script copies static files and public folder into the standalone directory
// as required by Next.js standalone output
// @ts-check

const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} PathConfig
 * @property {string} rootDir - Root directory of the project
 * @property {string} standaloneDir - Standalone output directory
 * @property {string} staticSource - Source directory for static files
 * @property {string} staticDest - Destination directory for static files
 * @property {string} publicSource - Source directory for public files
 * @property {string} publicDest - Destination directory for public files
 */

console.log("[Prepare] Preparing standalone package for Electron...\n");

const rootDir = path.join(__dirname, "..");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const staticSource = path.join(rootDir, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSource = path.join(rootDir, "public");
const publicDest = path.join(standaloneDir, "public");
const certsSource = path.join(rootDir, "certs");
const certsDest = path.join(standaloneDir, "certs");

/**
 * Helper function to copy directory recursively
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 * @returns {void}
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[Prepare] Warning: Source directory not found: ${src}`);
    return;
  }

  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Copy .next/static to standalone/.next/static
  console.log("[Prepare] Copying .next/static...");
  copyDir(staticSource, staticDest);
  console.log("[Prepare] ✓ Static files copied");

  // Copy public to standalone/public
  console.log("[Prepare] Copying public...");
  copyDir(publicSource, publicDest);
  console.log("[Prepare] ✓ Public files copied");

  // Copy certs to standalone/certs (if exists)
  console.log("[Prepare] Copying certs...");
  copyDir(certsSource, certsDest);
  console.log("[Prepare] ✓ Certificate files copied");

  // Copy .env.local to standalone directory for packaged builds
  const envLocalSource = path.join(rootDir, ".env.local");
  const envLocalDest = path.join(standaloneDir, ".env.local");

  if (fs.existsSync(envLocalSource)) {
    console.log("[Prepare] Copying .env.local...");
    fs.copyFileSync(envLocalSource, envLocalDest);
    console.log("[Prepare] ✓ Environment configuration copied");
  } else {
    console.warn("[Prepare] ⚠️  Warning: .env.local not found - packaged app will use system environment variables");
  }

  // CRITICAL: Ensure ELECTRON_BUILD=true is set in packaged apps
  // This prevents NextAuth from using secure cookies (__Secure-*, __Host-*)
  // which don't work on localhost HTTP in Electron
  console.log("[Prepare] Ensuring ELECTRON_BUILD=true in .env.local...");
  if (fs.existsSync(envLocalDest)) {
    const envContent = fs.readFileSync(envLocalDest, "utf8");
    if (!envContent.includes("ELECTRON_BUILD=true")) {
      fs.appendFileSync(envLocalDest, "\n# CRITICAL: Required for NextAuth cookie compatibility in Electron\nELECTRON_BUILD=true\n");
      console.log("[Prepare] ✓ Added ELECTRON_BUILD=true");
    } else {
      console.log("[Prepare] ✓ ELECTRON_BUILD already present");
    }
  } else {
    fs.writeFileSync(envLocalDest, "# CRITICAL: Required for NextAuth cookie compatibility in Electron\nELECTRON_BUILD=true\n");
    console.log("[Prepare] ✓ Created .env.local with ELECTRON_BUILD=true");
  }

  // Add dev tools flag if requested (append to .env.local in standalone)
  if (process.env.ELECTRON_DEV_TOOLS === "true") {
    console.log("[Prepare] Adding dev tools flag to .env.local...");
    const envContent = fs.readFileSync(envLocalDest, "utf8");
    if (!envContent.includes("ELECTRON_DEV_TOOLS=true")) {
      fs.appendFileSync(envLocalDest, "ELECTRON_DEV_TOOLS=true\n");
      console.log("[Prepare] ✓ Added ELECTRON_DEV_TOOLS=true");
    } else {
      console.log("[Prepare] ✓ ELECTRON_DEV_TOOLS already present");
    }
  }

  console.log("\n[Prepare] Package preparation complete!\n");
} catch (error) {
  console.error("[Prepare] Error preparing package:", error);
  process.exit(1);
}
