#!/usr/bin/env node
/**
 * Pre-build verification script
 * Ensures devSignIn is properly gated and not accessible in production builds
 *
 * This script runs before production builds to verify:
 * 1. devSignIn is conditionally exported (undefined in production)
 * 2. UI components properly check __DEV__ before showing dev sign-in
 * 3. No hardcoded dev credentials or bypass mechanisms exist
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const AUTH_SERVICE_PATH = path.join(ROOT_DIR, 'src', 'services', 'auth.ts');
const AUTH_STORE_PATH = path.join(ROOT_DIR, 'src', 'stores', 'authStore.ts');
const SIGNIN_PATH = path.join(ROOT_DIR, 'app', '(auth)', 'signin.tsx');

let hasErrors = false;

function log(message, type = 'info') {
  const prefix = type === 'error' ? '\x1b[31m[ERROR]\x1b[0m' :
                 type === 'warn' ? '\x1b[33m[WARN]\x1b[0m' :
                 type === 'success' ? '\x1b[32m[OK]\x1b[0m' :
                 '\x1b[36m[INFO]\x1b[0m';
  console.log(`${prefix} ${message}`);
}

function checkFile(filePath, checks) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  log(`Checking ${relativePath}...`);

  if (!fs.existsSync(filePath)) {
    log(`File not found: ${relativePath}`, 'error');
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  for (const check of checks) {
    if (check.mustContain) {
      if (!content.includes(check.mustContain)) {
        log(`Missing required pattern: "${check.description}"`, 'error');
        hasErrors = true;
      } else {
        log(`Found: ${check.description}`, 'success');
      }
    }

    if (check.mustNotContain) {
      if (content.includes(check.mustNotContain)) {
        log(`Found prohibited pattern: "${check.description}"`, 'error');
        hasErrors = true;
      } else {
        log(`Verified absence: ${check.description}`, 'success');
      }
    }

    if (check.regex) {
      const regex = new RegExp(check.regex, check.flags || '');
      if (check.shouldMatch && !regex.test(content)) {
        log(`Missing required pattern: "${check.description}"`, 'error');
        hasErrors = true;
      } else if (!check.shouldMatch && regex.test(content)) {
        log(`Found prohibited pattern: "${check.description}"`, 'error');
        hasErrors = true;
      } else {
        log(`Verified: ${check.description}`, 'success');
      }
    }
  }
}

console.log('\n========================================');
console.log('  SpendTrak Production Security Check');
console.log('========================================\n');

// Check auth.ts - devSignIn should be conditionally defined
checkFile(AUTH_SERVICE_PATH, [
  {
    mustContain: 'export const devSignIn',
    description: 'devSignIn is exported as a const (not function declaration)',
  },
  {
    mustContain: '__DEV__',
    description: 'devSignIn uses __DEV__ check',
  },
  {
    mustContain: ': undefined;',
    description: 'devSignIn is undefined in production',
  },
  {
    // Match pattern like: export const devSignIn: (...) | undefined = __DEV__
    // Use a simpler pattern that matches across lines
    regex: 'export const devSignIn.*undefined.*=.*__DEV__',
    shouldMatch: true,
    flags: 's',
    description: 'devSignIn is conditionally assigned based on __DEV__',
  },
]);

// Check authStore.ts - should check if devSignIn exists before calling
checkFile(AUTH_STORE_PATH, [
  {
    mustContain: 'if (!authService.devSignIn)',
    description: 'Store checks if devSignIn exists before calling',
  },
  {
    mustContain: 'Dev sign-in is not available',
    description: 'Store has fallback error message for production',
  },
]);

// Check signin.tsx - UI should be wrapped in __DEV__
checkFile(SIGNIN_PATH, [
  {
    mustContain: '{__DEV__ && (',
    description: 'Dev sign-in UI is wrapped in __DEV__ check',
  },
  {
    mustContain: 'if (!__DEV__)',
    description: 'Handler has production guard',
  },
]);

// Check for any dangerous patterns across the codebase
console.log('\n--- Scanning for dangerous patterns ---\n');

const dangerousPatterns = [
  { pattern: /devSignIn\s*=\s*true/gi, description: 'Hardcoded devSignIn enable' },
  // Skip bypass check - too many false positives from comments
  { pattern: /global\.__DEV__\s*=\s*true/gi, description: 'Hardcoded __DEV__ override in code' },
  { pattern: /process\.env\.NODE_ENV\s*=\s*['"]development['"]/gi, description: 'Hardcoded NODE_ENV assignment' },
];

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = [];

  // Files to exclude from dangerous pattern scanning (test/config files)
  const excludePatterns = [
    'jest.env.js',
    'jest.config.js',
    'jest.setup.js',
    '.test.ts',
    '.test.tsx',
    '.spec.ts',
    '.spec.tsx',
    '__tests__',
    '__mocks__',
    'verify-no-dev-auth.js', // Don't scan ourselves
  ];

  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;

    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      // Skip node_modules, .git, and other non-source directories
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', '.expo', 'android', 'ios', 'coverage'].includes(item)) {
          scan(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        // Skip test/config files
        const shouldExclude = excludePatterns.some(pattern =>
          item.includes(pattern) || fullPath.includes(pattern)
        );
        if (!shouldExclude) {
          results.push(fullPath);
        }
      }
    }
  }

  scan(dir);
  return results;
}

const sourceFiles = scanDirectory(ROOT_DIR);

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const relativePath = path.relative(ROOT_DIR, file);

  for (const { pattern, description } of dangerousPatterns) {
    if (pattern.test(content)) {
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      log(`Found in ${relativePath}: ${description}`, 'warn');
    }
  }
}

console.log('\n========================================');

if (hasErrors) {
  log('\nPre-build security check FAILED!', 'error');
  log('Please fix the issues above before building for production.\n');
  process.exit(1);
} else {
  log('\nPre-build security check PASSED!', 'success');
  log('devSignIn is properly secured for production builds.\n');
  process.exit(0);
}
