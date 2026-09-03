const fs = require('fs');
const path = require('path');
const file = process.argv[2];
const b64 = process.argv[3];
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, Buffer.from(b64, 'base64').toString('utf8'));
console.log('Saved:', file);
