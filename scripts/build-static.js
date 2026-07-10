const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appDir = path.join(__dirname, '..', 'app');
const apiDir = path.join(appDir, 'api');
const backupDir = path.join(__dirname, '..', 'api-backup');

console.log('[build-static] Starting static export build pipeline...');

let apiMoved = false;

try {
  // 1. Temporarily move app/api folder to the project root
  if (fs.existsSync(apiDir)) {
    console.log('[build-static] Temporarily moving app/api to api-backup...');
    fs.renameSync(apiDir, backupDir);
    apiMoved = true;
  }

  // Clear stale compilation cache/types to avoid dev types checking moved API folders
  const nextCacheDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextCacheDir)) {
    console.log('[build-static] Cleaning stale .next compilation cache...');
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
  }

  // 2. Run next build with CAPACITOR_BUILD=true
  console.log('[build-static] Compiling static Next.js assets...');
  execSync('npx next build', { stdio: 'inherit', env: { ...process.env, CAPACITOR_BUILD: 'true' } });

  console.log('[build-static] Static compile successful.');
} catch (err) {
  console.error('[build-static] Build failed:', err);
  process.exitCode = 1;
} finally {
  // 3. Restore the app/api folder regardless of success or failure
  if (apiMoved && fs.existsSync(backupDir)) {
    console.log('[build-static] Restoring app/api from api-backup...');
    fs.renameSync(backupDir, apiDir);
  }
}

// 4. Run Capacitor Sync if build succeeded
if (process.exitCode !== 1) {
  try {
    // Delete any packaged uncanny-debug.apk inside the static out folder to prevent recursive packaging
    const staleApkPath = path.join(__dirname, '..', 'out', 'uncanny-debug.apk');
    if (fs.existsSync(staleApkPath)) {
      console.log('[build-static] Deleting stale uncanny-debug.apk from static output to prevent build recursion...');
      fs.unlinkSync(staleApkPath);
    }

    console.log('[build-static] Running Capacitor Sync...');
    execSync('npx cap sync', { stdio: 'inherit' });
    console.log('[build-static] Synchronization complete!');
  } catch (syncErr) {
    console.error('[build-static] Capacitor sync failed:', syncErr);
    process.exitCode = 1;
  }
}
