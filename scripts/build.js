// Builds dist/index.mjs (ESM), dist/index.cjs (CJS) and syncs data into the Python package.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const json = JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, 'data/rwanda-geo-data.json'), 'utf8')));
const core = fs.readFileSync(path.join(root, 'src/core.js'), 'utf8');
const names = ['data', 'getProvinces', 'getDistricts', 'getProvinceOf', 'getSectors',
  'getCells', 'getVillages', 'isValidAddress', 'search', 'getStats'];

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

fs.writeFileSync(path.join(root, 'dist/index.mjs'),
  `const data = ${json};\n${core}\nexport { ${names.join(', ')} };\n` +
  `export default { ${names.join(', ')} };\n`);

fs.writeFileSync(path.join(root, 'dist/index.cjs'),
  `'use strict';\nconst data = ${json};\n${core}\nmodule.exports = { ${names.join(', ')} };\n`);

const dts = fs.readFileSync(path.join(root, 'src/index.d.ts'), 'utf8');
fs.writeFileSync(path.join(root, 'dist/index.d.ts'), dts);
fs.writeFileSync(path.join(root, 'dist/index.d.cts'), dts.replace(/export default _default;/, 'export = _default;'));

fs.copyFileSync(path.join(root, 'data/rwanda-geo-data.json'),
  path.join(root, 'python/src/rwanda_geo_data/data.json'));

console.log('Built dist/ and synced Python data.');
