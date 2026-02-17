// Run with: node scripts/generate-key.js
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('hex');
console.log('\n=== EMAIL_ENCRYPTION_KEY ===');
console.log(key);
console.log('\nRun this command to set it:');
console.log(`npx supabase secrets set EMAIL_ENCRYPTION_KEY=${key}`);
console.log('');
