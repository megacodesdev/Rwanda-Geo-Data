const test = require('node:test');
const assert = require('node:assert');
const geo = require('../dist/index.cjs');

test('provinces', () => {
  assert.deepStrictEqual(geo.getProvinces().sort(), ['East', 'Kigali', 'North', 'South', 'West']);
});

test('stats match source data', () => {
  assert.deepStrictEqual(geo.getStats(), {
    provinces: 5, districts: 30, sectors: 416, cells: 2149, villages: 14837,
  });
});

test('hierarchy lookups are case-insensitive', () => {
  assert.ok(geo.getDistricts('east').includes('Bugesera'));
  assert.strictEqual(geo.getProvinceOf('bugesera'), 'East');
  assert.ok(geo.getSectors('BUGESERA').includes('Gashora'));
  assert.ok(geo.getCells('Bugesera', 'gashora').includes('Biryogo'));
  assert.ok(geo.getVillages('Bugesera', 'Gashora', 'Biryogo').includes('Bidudu'));
});

test('unknown names return empty arrays', () => {
  assert.deepStrictEqual(geo.getSectors('Nowhere'), []);
  assert.deepStrictEqual(geo.getCells('Bugesera', 'Nowhere'), []);
  assert.deepStrictEqual(geo.getVillages('Bugesera', 'Gashora', 'Nowhere'), []);
});

test('isValidAddress', () => {
  assert.ok(geo.isValidAddress({ province: 'East', district: 'Bugesera', sector: 'Gashora', cell: 'Biryogo', village: 'Bidudu' }));
  assert.ok(!geo.isValidAddress({ province: 'West', district: 'Bugesera' }));
});

test('search', () => {
  const r = geo.search('gashora', { levels: ['sector'] });
  assert.strictEqual(r[0].district, 'Bugesera');
});

test('ESM build matches CJS build', async () => {
  const esm = await import('../dist/index.mjs');
  assert.deepStrictEqual(esm.getStats(), geo.getStats());
  assert.deepStrictEqual(esm.default.getProvinces(), geo.getProvinces());
});
