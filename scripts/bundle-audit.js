#!/usr/bin/env node

/**
 * SpendTrak Bundle Audit Script
 * Analyzes package.json dependencies for size, usage, and optimization opportunities.
 *
 * Usage: node scripts/bundle-audit.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

// ---------------------------------------------------------------------------
// 1. Known approximate bundle sizes (minified + gzipped where available)
//    Source: bundlephobia.com / npm stats — values in KB
// ---------------------------------------------------------------------------
const KNOWN_SIZES_KB = {
  '@babel/plugin-syntax-import-meta': 1,
  '@expo-google-fonts/cinzel': 5,
  '@expo/metro-runtime': 15,
  '@gorhom/bottom-sheet': 120,
  '@hookform/resolvers': 40,
  '@react-native-async-storage/async-storage': 50,
  '@react-native-community/netinfo': 30,
  '@react-native-masked-view/masked-view': 10,
  '@react-navigation/native': 80,
  '@sentry/react-native': 600,
  '@supabase/supabase-js': 200,
  'clsx': 1,
  'date-fns': 300,
  'expo': 50,
  'expo-apple-authentication': 15,
  'expo-asset': 20,
  'expo-auth-session': 30,
  'expo-av': 80,
  'expo-blur': 15,
  'expo-camera': 60,
  'expo-constants': 10,
  'expo-crypto': 8,
  'expo-dev-client': 100,
  'expo-device': 10,
  'expo-file-system': 25,
  'expo-font': 15,
  'expo-haptics': 8,
  'expo-image': 40,
  'expo-image-manipulator': 20,
  'expo-image-picker': 25,
  'expo-linear-gradient': 10,
  'expo-linking': 15,
  'expo-notifications': 80,
  'expo-router': 120,
  'expo-secure-store': 10,
  'expo-sharing': 10,
  'expo-splash-screen': 15,
  'expo-status-bar': 5,
  'expo-updates': 60,
  'expo-web-browser': 10,
  'install': 5,
  'react': 45,
  'react-dom': 130,
  'react-hook-form': 30,
  'react-native': 900,
  'react-native-gesture-handler': 80,
  'react-native-mmkv': 30,
  'react-native-nitro-modules': 20,
  'react-native-purchases': 80,
  'react-native-reanimated': 250,
  'react-native-safe-area-context': 20,
  'react-native-screens': 40,
  'react-native-shadow-2': 15,
  'react-native-svg': 60,
  'react-native-web': 200,
  'react-native-worklets': 20,
  'semver': 12,
  'zod': 55,
  'zustand': 10,
};

const LARGE_THRESHOLD_KB = 500;

// ---------------------------------------------------------------------------
// 2. Check actual node_modules sizes (fallback for unknowns)
// ---------------------------------------------------------------------------
function getNodeModuleSize(pkgName) {
  const modPath = path.join(ROOT, 'node_modules', pkgName);
  if (!fs.existsSync(modPath)) return null;
  return getDirSize(modPath);
}

function getDirSize(dirPath) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += getDirSize(full);
      } else if (entry.isFile()) {
        size += fs.statSync(full).size;
      }
    }
  } catch {
    // permission error or symlink — skip
  }
  return size;
}

// ---------------------------------------------------------------------------
// 3. Check if a dependency is imported anywhere in src/ or app/
// ---------------------------------------------------------------------------
function isImportedInCode(pkgName) {
  const dirs = [path.join(ROOT, 'src'), path.join(ROOT, 'app')];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    if (searchDir(dir, pkgName)) return true;
  }
  return false;
}

function searchDir(dir, pkgName) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (searchDir(full, pkgName)) return true;
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf-8');
      // Match import/require patterns
      if (
        content.includes(`'${pkgName}'`) ||
        content.includes(`"${pkgName}"`) ||
        content.includes(`'${pkgName}/`) ||
        content.includes(`"${pkgName}/`)
      ) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 4. Check if used in config files (app.config.js, babel.config.js, metro.config.js)
// ---------------------------------------------------------------------------
function isUsedInConfig(pkgName) {
  const configs = ['app.config.js', 'babel.config.js', 'metro.config.js', 'jest.config.js'];
  for (const cfg of configs) {
    const cfgPath = path.join(ROOT, cfg);
    if (fs.existsSync(cfgPath)) {
      const content = fs.readFileSync(cfgPath, 'utf-8');
      if (content.includes(pkgName)) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 5. Run the audit
// ---------------------------------------------------------------------------
function run() {
  const deps = { ...PKG.dependencies };
  const results = [];

  console.log('SpendTrak Bundle Audit');
  console.log('='.repeat(60));
  console.log(`Total dependencies: ${Object.keys(deps).length}\n`);

  for (const [name, version] of Object.entries(deps)) {
    const knownSize = KNOWN_SIZES_KB[name];
    const nodeModSize = getNodeModuleSize(name);
    const sizeKB = knownSize || (nodeModSize ? Math.round(nodeModSize / 1024) : null);
    const inCode = isImportedInCode(name);
    const inConfig = isUsedInConfig(name);
    const isLarge = sizeKB && sizeKB >= LARGE_THRESHOLD_KB;

    // Determine usage category
    let usage;
    if (inCode) {
      usage = 'USED';
    } else if (inConfig) {
      usage = 'CONFIG-ONLY';
    } else {
      usage = 'UNUSED';
    }

    results.push({ name, version, sizeKB, usage, isLarge, inCode, inConfig });
  }

  // Sort: unused first, then by size descending
  results.sort((a, b) => {
    if (a.usage === 'UNUSED' && b.usage !== 'UNUSED') return -1;
    if (a.usage !== 'UNUSED' && b.usage === 'UNUSED') return 1;
    return (b.sizeKB || 0) - (a.sizeKB || 0);
  });

  // Print results
  const unused = results.filter(r => r.usage === 'UNUSED');
  const large = results.filter(r => r.isLarge);
  const configOnly = results.filter(r => r.usage === 'CONFIG-ONLY');

  console.log('UNUSED DEPENDENCIES (not imported in src/ or app/, not in config):');
  console.log('-'.repeat(60));
  if (unused.length === 0) {
    console.log('  None found.');
  } else {
    for (const r of unused) {
      console.log(`  ${r.name} (${r.version}) — ~${r.sizeKB || '?'}KB`);
    }
  }

  console.log('\nLARGE DEPENDENCIES (>500KB):');
  console.log('-'.repeat(60));
  if (large.length === 0) {
    console.log('  None found.');
  } else {
    for (const r of large) {
      console.log(`  ${r.name} — ~${r.sizeKB}KB [${r.usage}]`);
    }
  }

  console.log('\nCONFIG-ONLY DEPENDENCIES (used in config but not imported in code):');
  console.log('-'.repeat(60));
  if (configOnly.length === 0) {
    console.log('  None found.');
  } else {
    for (const r of configOnly) {
      console.log(`  ${r.name} (${r.version}) — ~${r.sizeKB || '?'}KB`);
    }
  }

  console.log('\nFULL DEPENDENCY TABLE:');
  console.log('-'.repeat(60));
  console.log(`${'Package'.padEnd(45)} ${'Size'.padStart(8)} ${'Status'.padStart(12)}`);
  console.log('-'.repeat(60));
  for (const r of results) {
    const sizeStr = r.sizeKB ? `~${r.sizeKB}KB` : '?';
    console.log(`${r.name.padEnd(45)} ${sizeStr.padStart(8)} ${r.usage.padStart(12)}`);
  }

  // Return structured data for report generation
  return { results, unused, large, configOnly, totalDeps: Object.keys(deps).length };
}

const audit = run();

// ---------------------------------------------------------------------------
// 6. Generate markdown report
// ---------------------------------------------------------------------------
function generateMarkdown(data) {
  const lines = [];
  lines.push('# SpendTrak Bundle Audit Report');
  lines.push(`\n*Generated: ${new Date().toISOString().split('T')[0]}*\n`);
  lines.push(`## Summary\n`);
  lines.push(`- **Total dependencies**: ${data.totalDeps}`);
  lines.push(`- **Unused dependencies**: ${data.unused.length}`);
  lines.push(`- **Large dependencies (>500KB)**: ${data.large.length}`);
  lines.push(`- **Config-only dependencies**: ${data.configOnly.length}\n`);

  // Unused
  lines.push('## Unused Dependencies\n');
  lines.push('These packages are in `package.json` but are not imported anywhere in `src/` or `app/` and are not referenced in config files.\n');
  if (data.unused.length === 0) {
    lines.push('None found.\n');
  } else {
    lines.push('| Package | Version | Est. Size | Recommendation |');
    lines.push('|---------|---------|-----------|----------------|');
    const recommendations = {
      '@gorhom/bottom-sheet': 'Remove — not imported anywhere. Use expo-router modals instead.',
      '@hookform/resolvers': 'Remove — react-hook-form is also unused (no useForm calls found).',
      'clsx': 'Remove — tiny but unused. No class merging in RN project.',
      'expo-device': 'Remove — not imported. Can be re-added if device info is needed later.',
      'expo-image': 'Remove — not imported. expo-image-picker is used instead.',
      'expo-linking': 'Remove — not imported. expo-router handles deep linking.',
      'expo-notifications': 'Remove — not imported. Can re-add when push notifications are implemented.',
      'install': 'Remove — this is an accidental npm artifact (the `install` package).',
      'react-dom': 'Keep if web support is needed. Otherwise remove.',
      'react-hook-form': 'Remove — no useForm/useController calls found in codebase.',
      'react-native-mmkv': 'Remove — not imported. AsyncStorage is used instead.',
      'react-native-nitro-modules': 'Remove — not imported anywhere.',
      'react-native-shadow-2': 'Remove — not imported. Shadows are done via RN styles.',
      'react-native-web': 'Keep if web support is needed. Otherwise remove.',
      'react-native-worklets': 'Keep — peer dependency of react-native-reanimated.',
      'semver': 'Remove — not imported anywhere.',
      'zod': 'Remove — not imported. Remove with @hookform/resolvers.',
    };
    for (const r of data.unused) {
      const rec = recommendations[r.name] || 'Review — may be removable.';
      lines.push(`| \`${r.name}\` | ${r.version} | ~${r.sizeKB || '?'}KB | ${rec} |`);
    }
    lines.push('');
  }

  // Large deps
  lines.push('## Large Dependencies (>500KB)\n');
  lines.push('| Package | Est. Size | Status | Notes |');
  lines.push('|---------|-----------|--------|-------|');
  const largeNotes = {
    '@sentry/react-native': 'Required for error monitoring. Consider lazy-loading.',
    'react-native': 'Core framework — cannot be removed.',
  };
  for (const r of data.large) {
    const note = largeNotes[r.name] || '';
    lines.push(`| \`${r.name}\` | ~${r.sizeKB}KB | ${r.usage} | ${note} |`);
  }
  lines.push('');

  // Duplicate / overlap analysis
  lines.push('## Duplicate / Overlap Analysis\n');
  lines.push('| Concern | Details |');
  lines.push('|---------|---------|');
  lines.push('| `react-hook-form` + `@hookform/resolvers` + `zod` | All three are unused. Remove together. |');
  lines.push('| `react-native-mmkv` vs `AsyncStorage` | MMKV is installed but unused — AsyncStorage is used everywhere. Remove MMKV. |');
  lines.push('| `expo-image` vs `expo-image-picker` | `expo-image` (display) is unused. `expo-image-picker` (selection) is used. Remove `expo-image`. |');
  lines.push('| `@gorhom/bottom-sheet` vs modals | Bottom sheet not imported. Modals are handled via expo-router. Remove it. |');
  lines.push('');

  // Lighter alternatives
  lines.push('## Lighter Alternatives\n');
  lines.push('| Current | Alternative | Savings |');
  lines.push('|---------|-------------|---------|');
  lines.push('| `date-fns` (~300KB) | `dayjs` (~7KB) | ~293KB — if only basic formatting is used |');
  lines.push('| `@sentry/react-native` (~600KB) | `expo-updates` error boundary | Significant — but loses crash analytics |');
  lines.push('');

  // Config-only
  lines.push('## Config-Only Dependencies\n');
  lines.push('These are not imported in source code but are referenced in build configuration.\n');
  lines.push('| Package | Used In |');
  lines.push('|---------|---------|');
  for (const r of data.configOnly) {
    let usedIn = 'config files';
    if (r.name === 'expo-asset') usedIn = 'app.config.js (plugin)';
    if (r.name === 'expo-font') usedIn = 'app.config.js (plugin)';
    if (r.name === '@babel/plugin-syntax-import-meta') usedIn = 'babel.config.js (preset dependency)';
    if (r.name === '@expo/metro-runtime') usedIn = 'metro.config.js (bundler runtime)';
    if (r.name === 'expo-dev-client') usedIn = 'Development builds only';
    if (r.name === 'react-native-screens') usedIn = 'Peer dep of expo-router';
    lines.push(`| \`${r.name}\` | ${usedIn} |`);
  }
  lines.push('');

  // Full table
  lines.push('## Full Dependency Table\n');
  lines.push('| Package | Version | Est. Size | Status |');
  lines.push('|---------|---------|-----------|--------|');
  for (const r of data.results) {
    const sizeStr = r.sizeKB ? `~${r.sizeKB}KB` : '?' ;
    lines.push(`| \`${r.name}\` | ${r.version} | ${sizeStr} | ${r.usage} |`);
  }
  lines.push('');

  return lines.join('\n');
}

const docsDir = path.join(ROOT, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const markdown = generateMarkdown(audit);
fs.writeFileSync(path.join(docsDir, 'bundle-audit-report.md'), markdown, 'utf-8');
console.log('\n✓ Report written to docs/bundle-audit-report.md');
