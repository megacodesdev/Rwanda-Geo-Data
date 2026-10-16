const test = require('node:test');
const assert = require('node:assert');
const geo = require('../dist/index.cjs');

const COUNTS = { provinces: 5, districts: 30, sectors: 416, cells: 2149, villages: 14837 };

test('country and provinces', () => {
  assert.strictEqual(geo.getCountry(), 'Rwanda');
  assert.deepStrictEqual(geo.getProvinces().sort(), ['East', 'Kigali', 'North', 'South', 'West']);
});

test('counts match source data', () => {
  assert.deepStrictEqual(geo.countLocations(), COUNTS);
  assert.deepStrictEqual(geo.getStats(), COUNTS);
});

test('districts', () => {
  assert.strictEqual(geo.getDistricts().length, 30);
  assert.ok(geo.getDistrictsByProvince('east').includes('Bugesera'));
  assert.deepStrictEqual(geo.getDistrictsByProvince('Nowhere'), []);
  assert.strictEqual(geo.getProvinceOf('bugesera'), 'East');
});

test('"all" lookups with no arguments', () => {
  assert.ok(geo.getSectors().includes('Gashora'));
  assert.ok(geo.getCells().includes('Biryogo'));
  assert.ok(geo.getVillages().includes('Bidudu'));
  assert.strictEqual(new Set(geo.getSectors()).size, geo.getSectors().length);
});

test('By-functions take full paths', () => {
  assert.ok(geo.getSectorsByDistrict('East', 'Bugesera').includes('Gashora'));
  assert.ok(geo.getCellsBySector('East', 'Bugesera', 'Gashora').includes('Biryogo'));
  assert.ok(geo.getVillagesByCell('East', 'Bugesera', 'Gashora', 'Biryogo').includes('Bidudu'));
});

test('wrong province gives an empty list', () => {
  assert.deepStrictEqual(geo.getSectorsByDistrict('West', 'Bugesera'), []);
  assert.deepStrictEqual(geo.getCellsBySector('West', 'Bugesera', 'Gashora'), []);
});

test('lookups are case-insensitive', () => {
  assert.ok(geo.getSectorsByDistrict('EAST', 'bugesera').includes('Gashora'));
  assert.ok(geo.getCellsBySector('east', 'BUGESERA', 'gashora').includes('Biryogo'));
});

test('old shorter calls still work', () => {
  assert.ok(geo.getSectors('Bugesera').includes('Gashora'));
  assert.ok(geo.getCells('Bugesera', 'Gashora').includes('Biryogo'));
  assert.ok(geo.getVillages('Bugesera', 'Gashora', 'Biryogo').includes('Bidudu'));
  assert.ok(geo.getSectorsByDistrict('Bugesera').includes('Gashora'));
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

test('search: single word, case-insensitive', () => {
  const r = geo.search('GASHORA', { levels: ['sector'] });
  assert.strictEqual(r[0].district, 'Bugesera');
});

test('search: multi-word matches path, exact name first', () => {
  const r = geo.search('gashora bugesera');
  assert.strictEqual(r[0].name, 'Gashora');
  assert.strictEqual(r[0].level, 'sector');
  assert.ok(r.every((x) => x.district === 'Bugesera'));
});

test('search: ignores diacritics and extra spaces', () => {
  assert.strictEqual(geo.search('  Gáshóra  ', { levels: ['sector'] })[0].name, 'Gashora');
  assert.deepStrictEqual(geo.search(''), []);
  assert.deepStrictEqual(geo.search('zzzzqqq'), []);
});

test('search: limit', () => {
  assert.strictEqual(geo.search('a', { limit: 5 }).length, 5);
});

test('getRandomLocation returns a real address', () => {
  for (let i = 0; i < 20; i++) {
    const loc = geo.getRandomLocation();
    assert.ok(geo.isValidAddress(loc), JSON.stringify(loc));
  }
});

test('ESM build matches CJS build', async () => {
  const esm = await import('../dist/index.mjs');
  assert.deepStrictEqual(esm.countLocations(), geo.countLocations());
  assert.deepStrictEqual(esm.default.getProvinces(), geo.getProvinces());
  assert.strictEqual(esm.getCountry(), 'Rwanda');
});
