#!/usr/bin/env python3
"""
MTEL Beta License Key Generator (Python version)
Generates 50 unique beta license keys for testing
"""

import hashlib
import random
import json
from datetime import datetime, timedelta

def generate_beta_key():
    """Generate a single beta license key"""
    # Characters excluding confusing ones (0/O, 1/I, L)
    chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    
    # Generate 3 segments of 4 characters each
    segments = []
    for i in range(3):
        segment = ''.join(random.choice(chars) for _ in range(4))
        segments.append(segment)
    
    # Generate checksum (4 chars)
    data_to_hash = f"MTEL-BETA-{'-'.join(segments)}-{datetime.now().timestamp()}"
    checksum = hashlib.sha256(data_to_hash.encode()).hexdigest()[:4].upper()
    
    # Format: MTEL-BETA-XXXX-XXXX-XXXX-XXXX
    return f"MTEL-BETA-{'-'.join(segments)}-{checksum}"

# Generate 50 unique keys
keys = set()
while len(keys) < 50:
    keys.add(generate_beta_key())

keys_array = sorted(list(keys))

# Output
print('=' * 60)
print('MTEL BETA LICENSE KEYS')
print(f'Generated: {datetime.now().isoformat()}')
print(f'Count: {len(keys_array)}')
print('Expires: 90 days from beta start')
print('=' * 60)
print()

# 1. Plain text list
print('PLAIN TEXT LIST:')
print('-' * 60)
for i, key in enumerate(keys_array, 1):
    print(f'{i:02d}. {key}')
print()

# 2. JavaScript array for code
print('JAVASCRIPT ARRAY (for frontend/license-validator.js):')
print('-' * 60)
print('const BETA_KEYS = [')
for i, key in enumerate(keys_array):
    comma = ',' if i < len(keys_array) - 1 else ''
    print(f"    '{key}'{comma}")
print('];')
print()

# 3. CSV for spreadsheet
csv_content = 'Number,License Key,Email,Sent Date,Activated,Notes\n'
csv_content += '\n'.join(f'{i},{key},,,No,' for i, key in enumerate(keys_array, 1))

# Save to files
with open('beta-keys.txt', 'w') as f:
    f.write('\n'.join(keys_array))

with open('beta-keys.csv', 'w') as f:
    f.write(csv_content)

with open('beta-keys.json', 'w') as f:
    json.dump({
        'generated': datetime.now().isoformat(),
        'betaStartDate': '2026-01-15',
        'betaEndDate': '2026-04-15',
        'keys': keys_array
    }, f, indent=2)

print('FILES SAVED:')
print('-' * 60)
print('✓ beta-keys.txt  - Plain text list')
print('✓ beta-keys.csv  - Import to Excel/Sheets')
print('✓ beta-keys.json - JSON format with metadata')
print()
print('Next steps:')
print('1. Copy BETA_KEYS array to frontend/license-validator.js')
print('2. Import beta-keys.csv to spreadsheet for tracking')
print('3. Email keys to approved beta testers')
