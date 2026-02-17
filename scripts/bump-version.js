#!/usr/bin/env node

/**
 * Version bump script for SpendTrak
 * Usage: node scripts/bump-version.js [major|minor|patch]
 *
 * Increments:
 * - package.json version
 * - version.json (buildNumber, versionCode)
 */

const fs = require('fs');
const path = require('path');

const bumpType = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Usage: node scripts/bump-version.js [major|minor|patch]');
  process.exit(1);
}

// Read package.json
const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

// Parse current version
const [major, minor, patch] = pkg.version.split('.').map(Number);
let newVersion;
switch (bumpType) {
  case 'major': newVersion = `${major + 1}.0.0`; break;
  case 'minor': newVersion = `${major}.${minor + 1}.0`; break;
  case 'patch': newVersion = `${major}.${minor}.${patch + 1}`; break;
}

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// Read or create version.json for buildNumber/versionCode
const versionFilePath = path.resolve(__dirname, '..', 'version.json');
let versionData = { buildNumber: 1, versionCode: 1 };
if (fs.existsSync(versionFilePath)) {
  versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
}
versionData.buildNumber++;
versionData.versionCode++;
versionData.version = newVersion;
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n');

console.log(`✅ Version bumped to ${newVersion}`);
console.log(`   buildNumber: ${versionData.buildNumber}`);
console.log(`   versionCode: ${versionData.versionCode}`);
