const jwt = require('jsonwebtoken');

// Apple Sign In credentials
const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgFtwBAyg94qDM8rlb
aPOSg+I6ziGTT/wlMBayR/dZ2HigCgYIKoZIzj0DAQehRANCAATZlW477nm1jxaS
xmXHuobvjQzAoZFpNmlKGS5+1xxPmBlBOulrQ/DErMwjLnx52E9C9wG/YQ0DMSi5
SIcsY5j8
-----END PRIVATE KEY-----`;

const teamId = 'NHT4RV54Z7';
const keyId = '233XPPV56C';
const clientId = 'com.spendtrak.app.auth';

// Generate timestamps
const now = Math.floor(Date.now() / 1000);
const expiry = now + (86400 * 180); // 180 days from now

// JWT payload per Apple's requirements
const payload = {
  iss: teamId,      // Your Apple Team ID
  iat: now,         // Issued at time
  exp: expiry,      // Expiration time (max 6 months)
  aud: 'https://appleid.apple.com',  // Apple's audience
  sub: clientId     // Your Service ID (Client ID)
};

// JWT header options
const options = {
  algorithm: 'ES256',
  header: {
    alg: 'ES256',
    kid: keyId      // Your Key ID from Apple
  }
};

// Generate the client secret
const clientSecret = jwt.sign(payload, privateKey, options);

console.log('='.repeat(60));
console.log('APPLE SIGN IN CLIENT SECRET');
console.log('='.repeat(60));
console.log('\nGenerated at:', new Date().toISOString());
console.log('Expires at:', new Date(expiry * 1000).toISOString());
console.log('Valid for: 180 days\n');
console.log('Client Secret (copy this to Supabase):\n');
console.log(clientSecret);
console.log('\n' + '='.repeat(60));
console.log('\nTo use in Supabase:');
console.log('1. Go to Authentication > Providers > Apple');
console.log('2. Paste this secret in the "Secret Key" field');
console.log('3. Set Service ID to:', clientId);
console.log('='.repeat(60));
