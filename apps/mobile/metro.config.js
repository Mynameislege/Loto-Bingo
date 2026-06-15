// metro.config.js — pnpm monorepo support for Expo SDK 54
//
// Two Firebase problems fixed here:
//
//  A) Dual-instance @firebase/app (pnpm virtual store):
//     pnpm symlinks can cause Metro to load @firebase/app twice under different
//     module IDs → two _components Maps → "Component auth has not been
//     registered yet". Fix: pin core packages to one real file path.
//
//  B) whatwg-fetch / "Network request failed":
//     NOTE — whatwg-fetch IS the normal RN fetch implementation
//     (react-native/Libraries/Network/fetch.js requires it). The real bug was
//     a missing error callback in onAuthStateChanged, causing Firebase's
//     internal token-refresh failures to become unhandled rejections.
//     That is now fixed in authStore.ts.
//     We still pin @firebase/auth to its RN build to get getReactNativePersistence.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so Metro sees workspace package changes
config.watchFolders = [monorepoRoot];

// 2. Resolution order: app-local first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Follow pnpm symlinks (required for workspace packages)
config.resolver.unstable_enableSymlinks = true;

// ── Firebase package pinning ────────────────────────────────────────────────
//
// Strategy: find packages using TWO methods, in order:
//   1. Via symlink path (works on Windows pnpm junctions)
//   2. Via direct .pnpm store search (fallback, works everywhere)

const pnpmStore = path.resolve(monorepoRoot, 'node_modules', '.pnpm');

/**
 * Resolve a package's main entry point using both symlink and pnpm-store paths.
 * Returns the absolute path to the entry file, or null if not found.
 */
function findPkgEntry(pkgName, preferredField = null) {
  // Method A: via workspace symlink / junction (preferred on Windows)
  const symCandidates = [
    path.resolve(projectRoot, 'node_modules', ...pkgName.split('/')),
    path.resolve(monorepoRoot, 'node_modules', ...pkgName.split('/')),
  ];
  for (const pkgDir of symCandidates) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
      const entry = (preferredField && pkgJson[preferredField])
        || pkgJson['react-native']
        || pkgJson['browser']
        || pkgJson['main'];
      if (!entry) continue;
      const resolved = path.resolve(pkgDir, entry);
      if (fs.existsSync(resolved)) return resolved;
    } catch { /* symlink not accessible */ }
  }

  // Method B: search .pnpm store directly (works on Linux / CI / WSL)
  try {
    const storeName = pkgName.replace('/', '+'); // "@firebase/auth" → "@firebase+auth"
    const entries = fs.readdirSync(pnpmStore);
    // Pick the first matching package (ignores -compat variants)
    const match = entries.find(e =>
      e.startsWith(storeName + '@') && !e.includes('compat')
    );
    if (!match) return null;
    const pkgDir = path.join(pnpmStore, match, 'node_modules', ...pkgName.split('/'));
    const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    const entry = (preferredField && pkgJson[preferredField])
      || pkgJson['react-native']
      || pkgJson['browser']
      || pkgJson['main'];
    if (!entry) return null;
    const resolved = path.resolve(pkgDir, entry);
    return fs.existsSync(resolved) ? resolved : null;
  } catch { return null; }
}

// ── Build pinning table ─────────────────────────────────────────────────────

const FIREBASE_PINNED = {};

// Core packages: single instance prevents "Component not registered" error
for (const pkg of ['@firebase/app', '@firebase/component', '@firebase/util', '@firebase/logger']) {
  const resolved = findPkgEntry(pkg);
  if (resolved) {
    FIREBASE_PINNED[pkg] = resolved;
    console.log(`[metro] pinned ${pkg} → ...${resolved.slice(-50)}`);
  } else {
    console.warn(`[metro] WARNING: could not pin ${pkg}`);
  }
}

// Auth: pin both umbrella and direct import to the same RN build
const authRnPath = findPkgEntry('@firebase/auth', 'react-native');
if (authRnPath) {
  FIREBASE_PINNED['@firebase/auth'] = authRnPath;
  FIREBASE_PINNED['firebase/auth']  = authRnPath;
  console.log(`[metro] pinned @firebase/auth (RN build) → ...${authRnPath.slice(-50)}`);
} else {
  console.warn('[metro] WARNING: could not pin @firebase/auth to RN build');
}

// ── resolveRequest ──────────────────────────────────────────────────────────

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pinned = FIREBASE_PINNED[moduleName];
  if (pinned) {
    return { filePath: pinned, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
