/**
 * build.js
 * Copies the Freighter API browser bundle from node_modules into the project
 * so index.html can load it as a local file — no CDN needed.
 */
const fs   = require('fs');
const path = require('path');

const src = path.join(
    __dirname,
    'node_modules',
    '@stellar',
    'freighter-api',
    'dist',
    'index.min.js'
);

const dest = path.join(__dirname, 'freighter-api.js');

if (!fs.existsSync(src)) {
    console.error('ERROR: node_modules not found. Run: npm install');
    process.exit(1);
}

fs.copyFileSync(src, dest);
console.log('✓ freighter-api.js copied from node_modules');
