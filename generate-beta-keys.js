/**
 * MTEL Beta License Key Generator
 * Generates 50 unique beta license keys for testing
 * 
 * Usage: node generate-beta-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');

function generateBetaKey() {
    // Characters excluding confusing ones (0/O, 1/I, L)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let segments = [];

    // Generate 3 segments of 4 characters each
    for (let i = 0; i < 3; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
    }

    // Generate checksum (4 chars)
    const dataToHash = `MTEL-BETA-${segments.join('-')}`;
    const checksum = crypto
        .createHash('sha256')
        .update(dataToHash + Date.now())
        .digest('hex')
        .substring(0, 4)
        .toUpperCase();

    // Format: MTEL-BETA-XXXX-XXXX-XXXX-XXXX
    return `MTEL-BETA-${segments.join('-')}-${checksum}`;
}

// Generate 50 unique keys
const keys = new Set();
while (keys.size < 50) {
    keys.add(generateBetaKey());
}

const keysArray = Array.from(keys);

// Output formats
console.log('='.repeat(60));
console.log('MTEL BETA LICENSE KEYS');
console.log('Generated:', new Date().toISOString());
console.log('Count:', keysArray.length);
console.log('Expires: 90 days from beta start');
console.log('='.repeat(60));
console.log();

// 1. Plain text list
console.log('PLAIN TEXT LIST:');
console.log('-'.repeat(60));
keysArray.forEach((key, i) => {
    console.log(`${(i + 1).toString().padStart(2, '0')}. ${key}`);
});
console.log();

// 2. JavaScript array for code
console.log('JAVASCRIPT ARRAY (for frontend/license-validator.js):');
console.log('-'.repeat(60));
console.log('const BETA_KEYS = [');
keysArray.forEach((key, i) => {
    const comma = i < keysArray.length - 1 ? ',' : '';
    console.log(`    '${key}'${comma}`);
});
console.log('];');
console.log();

// 3. CSV for spreadsheet
const csv = 'Number,License Key,Email,Sent Date,Activated,Notes\n' +
    keysArray.map((key, i) => `${i + 1},${key},,,No,`).join('\n');

// Save to files
fs.writeFileSync('beta-keys.txt', keysArray.join('\n'));
fs.writeFileSync('beta-keys.csv', csv);
fs.writeFileSync('beta-keys.json', JSON.stringify({
    generated: new Date().toISOString(),
    betaStartDate: '2026-01-15',
    betaEndDate: '2026-04-15',
    keys: keysArray
}, null, 2));

console.log('FILES SAVED:');
console.log('-'.repeat(60));
console.log('✓ beta-keys.txt  - Plain text list');
console.log('✓ beta-keys.csv  - Import to Excel/Sheets');
console.log('✓ beta-keys.json - JSON format with metadata');
console.log();
console.log('Next steps:');
console.log('1. Copy BETA_KEYS array to frontend/license-validator.js');
console.log('2. Import beta-keys.csv to spreadsheet for tracking');
console.log('3. Email keys to approved beta testers');
