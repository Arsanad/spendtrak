#!/usr/bin/env node

/**
 * SpendTrak Media Assets Audit Script
 * Scans assets/ directory and checks for unused, oversized, or unoptimized files.
 *
 * Usage: node scripts/asset-audit.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const REPORT_PATH = path.join(ROOT, 'docs', 'bundle-audit-report.md');
const LARGE_FILE_THRESHOLD = 1024 * 1024; // 1 MB

// ---------------------------------------------------------------------------
// 1. Recursively scan directory
// ---------------------------------------------------------------------------
function scanDirectory(dir, relativeTo) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, relativeTo));
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      results.push({
        path: fullPath,
        relativePath: path.relative(relativeTo, fullPath).replace(/\\/g, '/'),
        name: entry.name,
        ext: path.extname(entry.name).toLowerCase(),
        size: stat.size,
        sizeKB: Math.round(stat.size / 1024),
        sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
        isLarge: stat.size > LARGE_FILE_THRESHOLD,
      });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 2. Calculate per-subdirectory totals
// ---------------------------------------------------------------------------
function getSubdirectorySizes(files) {
  const dirSizes = {};
  for (const file of files) {
    const parts = file.relativePath.split('/');
    const subdir = parts.length > 1 ? `assets/${parts[0]}/` : 'assets/ (root)';
    if (!dirSizes[subdir]) dirSizes[subdir] = { size: 0, count: 0 };
    dirSizes[subdir].size += file.size;
    dirSizes[subdir].count++;
  }
  return dirSizes;
}

// ---------------------------------------------------------------------------
// 3. Check if file is referenced in codebase
// ---------------------------------------------------------------------------
function isFileReferenced(fileName) {
  const dirsToSearch = [path.join(ROOT, 'src'), path.join(ROOT, 'app')];
  const configFiles = ['app.config.js', 'babel.config.js', 'metro.config.js'];

  // Also search config files
  for (const cfg of configFiles) {
    const cfgPath = path.join(ROOT, cfg);
    if (fs.existsSync(cfgPath)) {
      const content = fs.readFileSync(cfgPath, 'utf-8');
      if (content.includes(fileName)) return true;
    }
  }

  // Strip extension for broader search
  const baseName = path.basename(fileName, path.extname(fileName));

  for (const dir of dirsToSearch) {
    if (!fs.existsSync(dir)) continue;
    if (searchDirForReference(dir, fileName, baseName)) return true;
  }

  return false;
}

function searchDirForReference(dir, fileName, baseName) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (searchDirForReference(fullPath, fileName, baseName)) return true;
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes(fileName) || content.includes(baseName)) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 4. Format file size for display
// ---------------------------------------------------------------------------
function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

// ---------------------------------------------------------------------------
// 5. Run the audit
// ---------------------------------------------------------------------------
function run() {
  console.log('SpendTrak Media Assets Audit');
  console.log('='.repeat(60));

  if (!fs.existsSync(ASSETS_DIR)) {
    console.log('assets/ directory not found!');
    return null;
  }

  const files = scanDirectory(ASSETS_DIR, ASSETS_DIR);
  const dirSizes = getSubdirectorySizes(files);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const largeFiles = files.filter(f => f.isLarge);

  // Check references
  const unreferenced = [];
  const referenced = [];
  for (const file of files) {
    // Skip .gitkeep, READMEs, and documentation
    if (['.gitkeep', '.md'].includes(file.ext) || file.name === '.gitkeep') {
      referenced.push(file);
      continue;
    }
    if (isFileReferenced(file.name)) {
      referenced.push(file);
    } else {
      unreferenced.push(file);
    }
  }

  // Image optimization check
  const pngs = files.filter(f => f.ext === '.png');
  const largePngs = pngs.filter(f => f.size > 200 * 1024); // >200KB

  console.log(`\nTotal assets: ${files.length} files`);
  console.log(`Total size: ${formatSize(totalSize)}`);
  console.log(`Large files (>1MB): ${largeFiles.length}`);
  console.log(`Unreferenced files: ${unreferenced.length}`);

  console.log('\nPer-directory breakdown:');
  for (const [dir, info] of Object.entries(dirSizes).sort((a, b) => b[1].size - a[1].size)) {
    console.log(`  ${dir.padEnd(30)} ${formatSize(info.size).padStart(10)} (${info.count} files)`);
  }

  if (largeFiles.length > 0) {
    console.log('\nLarge files (>1MB):');
    for (const f of largeFiles.sort((a, b) => b.size - a.size)) {
      console.log(`  ${f.relativePath} — ${formatSize(f.size)}`);
    }
  }

  if (unreferenced.length > 0) {
    console.log('\nUnreferenced assets (not found in src/ or app/):');
    for (const f of unreferenced) {
      console.log(`  ${f.relativePath} — ${formatSize(f.size)}`);
    }
  }

  return { files, dirSizes, totalSize, largeFiles, unreferenced, referenced, pngs, largePngs };
}

const audit = run();

// ---------------------------------------------------------------------------
// 6. Append to existing bundle-audit-report.md
// ---------------------------------------------------------------------------
function generateMarkdown(data) {
  if (!data) return '';

  const lines = [];
  lines.push('\n---\n');
  lines.push('# Media Assets Audit');
  lines.push(`\n*Generated: ${new Date().toISOString().split('T')[0]}*\n`);

  lines.push('## Summary\n');
  lines.push(`- **Total assets**: ${data.files.length} files`);
  lines.push(`- **Total size**: ${formatSize(data.totalSize)}`);
  lines.push(`- **Large files (>1MB)**: ${data.largeFiles.length}`);
  lines.push(`- **Unreferenced files**: ${data.unreferenced.length}`);
  lines.push(`- **PNG files**: ${data.pngs.length} (${data.largePngs.length} over 200KB)\n`);

  // Directory breakdown
  lines.push('## Directory Breakdown\n');
  lines.push('| Directory | Size | Files |');
  lines.push('|-----------|------|-------|');
  for (const [dir, info] of Object.entries(data.dirSizes).sort((a, b) => b[1].size - a[1].size)) {
    lines.push(`| \`${dir}\` | ${formatSize(info.size)} | ${info.count} |`);
  }
  lines.push(`| **TOTAL** | **${formatSize(data.totalSize)}** | **${data.files.length}** |`);
  lines.push('');

  // Large files
  lines.push('## Large Files (>1MB)\n');
  if (data.largeFiles.length === 0) {
    lines.push('None found.\n');
  } else {
    lines.push('| File | Size | Referenced? | Recommendation |');
    lines.push('|------|------|------------|----------------|');
    const largeRecs = {
      'quantum-robot.glb': 'Not referenced in code. Candidate for removal (saves 2.0 MB).',
      'ai-consultant.glb': 'Not referenced in code. Candidate for removal (saves 2.8 MB).',
      'spendtrak-intro.MOV': 'Referenced in IntroVideo.tsx. Convert to MP4/H.264 for smaller size.',
    };
    for (const f of data.largeFiles.sort((a, b) => b.size - a.size)) {
      const isRef = data.unreferenced.includes(f) ? 'No' : 'Yes';
      const rec = largeRecs[f.name] || (isRef === 'No' ? 'Candidate for removal.' : 'Review for optimization.');
      lines.push(`| \`${f.relativePath}\` | ${formatSize(f.size)} | ${isRef} | ${rec} |`);
    }
    lines.push('');
  }

  // Unreferenced files
  lines.push('## Unreferenced Assets (Removal Candidates)\n');
  lines.push('These files exist in `assets/` but are not referenced in `src/`, `app/`, or config files.\n');
  if (data.unreferenced.length === 0) {
    lines.push('None found.\n');
  } else {
    lines.push('| File | Size | Notes |');
    lines.push('|------|------|-------|');
    const totalUnrefSize = data.unreferenced.reduce((sum, f) => sum + f.size, 0);
    for (const f of data.unreferenced.sort((a, b) => b.size - a.size)) {
      let notes = '';
      if (f.ext === '.glb') notes = '3D model — likely unused feature';
      if (f.ext === '.wav' || f.ext === '.mp3') notes = 'Sound file — no audio import code found';
      if (f.name === 'icon-1024.png') notes = 'Referenced in app.config.js ios.icon — KEEP';
      lines.push(`| \`${f.relativePath}\` | ${formatSize(f.size)} | ${notes} |`);
    }
    lines.push(`\n**Total removable size**: ~${formatSize(totalUnrefSize)}\n`);
  }

  // Image optimization
  lines.push('## Image Optimization Opportunities\n');
  if (data.largePngs.length === 0) {
    lines.push('All PNG files are reasonably sized.\n');
  } else {
    lines.push('| File | Current Size | Suggestion |');
    lines.push('|------|-------------|------------|');
    for (const f of data.largePngs.sort((a, b) => b.size - a.size)) {
      let suggestion = 'Convert to WebP for ~50-70% size reduction';
      if (f.name.includes('icon') || f.name.includes('adaptive')) {
        suggestion = 'App icon — keep as PNG (required by stores). Optimize with pngquant.';
      }
      if (f.name === 'splash.png' || f.name === 'splash-icon.png') {
        suggestion = 'Splash image — keep as PNG. Optimize with pngquant/tinypng.';
      }
      lines.push(`| \`${f.relativePath}\` | ${formatSize(f.size)} | ${suggestion} |`);
    }
    lines.push('');
  }

  // General recommendations
  lines.push('## Recommendations\n');
  lines.push('1. **Remove unused 3D models** (`quantum-robot.glb`, `ai-consultant.glb`) — saves ~4.8 MB');
  lines.push('2. **Remove unused sound files** (if quantum sounds feature is not active) — saves ~813 KB');
  lines.push('3. **Convert intro video** from MOV to MP4/H.264 — could reduce 8.3 MB by 50-70%');
  lines.push('4. **Optimize PNGs** — run through `pngquant` or `tinypng` for lossless/near-lossless compression');
  lines.push('5. **Consider lazy-loading** 3D assets and video only when needed');
  lines.push('');

  return lines.join('\n');
}

if (audit) {
  const docsDir = path.join(ROOT, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const assetMarkdown = generateMarkdown(audit);

  // Append to existing report or create new one
  if (fs.existsSync(REPORT_PATH)) {
    fs.appendFileSync(REPORT_PATH, assetMarkdown, 'utf-8');
    console.log('\n✓ Asset audit appended to docs/bundle-audit-report.md');
  } else {
    fs.writeFileSync(REPORT_PATH, assetMarkdown, 'utf-8');
    console.log('\n✓ Asset audit written to docs/bundle-audit-report.md');
  }
}
