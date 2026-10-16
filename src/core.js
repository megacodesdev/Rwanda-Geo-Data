// Normalise for matching: case-insensitive and diacritic-insensitive.
const strip = (s) =>
  String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const LEVELS = ['province', 'district', 'sector', 'cell', 'village'];

function findKey(obj, name) {
  if (!obj) return undefined;
  const n = strip(name);
  return Object.keys(obj).find((k) => strip(k) === n);
}

const uniqueSorted = (arr) => Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));

// district -> province index (district names are unique nationwide)
const districtIndex = {};
for (const province of Object.keys(data)) {
  for (const district of Object.keys(data[province])) {
    districtIndex[strip(district)] = province;
  }
}

const given = (v) => v !== undefined && v !== null && v !== '';

// Accepts (province, district, ...) or, for convenience, just (district, ...).
function parsePath(args, depth) {
  if (args.length >= depth) return { province: args[0], rest: args.slice(1, depth) };
  return { province: undefined, rest: args.slice(0, depth - 1) };
}

// Resolve a path to its real keys, or null if any part is wrong.
function locate(province, district, sector, cell) {
  const p = districtIndex[strip(district)];
  if (!p) return null;
  if (given(province) && strip(province) !== strip(p)) return null;
  const out = { p, d: findKey(data[p], district) };
  if (sector === undefined) return out;
  out.s = findKey(data[p][out.d], sector);
  if (!out.s) return null;
  if (cell === undefined) return out;
  out.c = findKey(data[p][out.d][out.s], cell);
  return out.c ? out : null;
}

/* ---------- country & provinces ---------- */

function getCountry() {
  return 'Rwanda';
}

function getProvinces() {
  return Object.keys(data);
}

/* ---------- districts ---------- */

/** All districts, or only those of a province. */
function getDistricts(province) {
  if (province === undefined) {
    return Object.keys(data).flatMap((p) => Object.keys(data[p]));
  }
  const p = findKey(data, province);
  return p ? Object.keys(data[p]) : [];
}

function getDistrictsByProvince(province) {
  return given(province) ? getDistricts(province) : [];
}

function getProvinceOf(district) {
  return districtIndex[strip(district)];
}

/* ---------- sectors ---------- */

function getSectorsByDistrict(...args) {
  const { province, rest: [district] } = parsePath(args, 2);
  const loc = locate(province, district);
  return loc ? Object.keys(data[loc.p][loc.d]) : [];
}

/** No arguments: every sector name in Rwanda. With a district: that district's sectors. */
function getSectors(...args) {
  if (args.length === 0) {
    const all = [];
    for (const p of Object.keys(data))
      for (const d of Object.keys(data[p])) all.push(...Object.keys(data[p][d]));
    return uniqueSorted(all);
  }
  return getSectorsByDistrict(...args);
}

/* ---------- cells ---------- */

function getCellsBySector(...args) {
  const { province, rest: [district, sector] } = parsePath(args, 3);
  const loc = locate(province, district, sector);
  return loc ? Object.keys(data[loc.p][loc.d][loc.s]) : [];
}

/** No arguments: every cell name in Rwanda. Otherwise the cells of one sector. */
function getCells(...args) {
  if (args.length === 0) {
    const all = [];
    for (const p of Object.keys(data))
      for (const d of Object.keys(data[p]))
        for (const s of Object.keys(data[p][d])) all.push(...Object.keys(data[p][d][s]));
    return uniqueSorted(all);
  }
  return getCellsBySector(...args);
}

/* ---------- villages ---------- */

function getVillagesByCell(...args) {
  const { province, rest: [district, sector, cell] } = parsePath(args, 4);
  const loc = locate(province, district, sector, cell);
  return loc ? data[loc.p][loc.d][loc.s][loc.c].slice() : [];
}

/** No arguments: every village name in Rwanda. Otherwise the villages of one cell. */
function getVillages(...args) {
  if (args.length === 0) {
    const all = [];
    for (const p of Object.keys(data))
      for (const d of Object.keys(data[p]))
        for (const s of Object.keys(data[p][d]))
          for (const c of Object.keys(data[p][d][s])) all.push(...data[p][d][s][c]);
    return uniqueSorted(all);
  }
  return getVillagesByCell(...args);
}

/* ---------- validation ---------- */

/** Check that an address path exists. Everything below district is optional. */
function isValidAddress({ province, district, sector, cell, village } = {}) {
  const p = findKey(data, province);
  if (!p) return false;
  const d = findKey(data[p], district);
  if (!d) return false;
  if (sector === undefined) return true;
  const s = findKey(data[p][d], sector);
  if (!s) return false;
  if (cell === undefined) return true;
  const c = findKey(data[p][d][s], cell);
  if (!c) return false;
  if (village === undefined) return true;
  return data[p][d][s][c].some((v) => strip(v) === strip(village));
}

/* ---------- search ---------- */

let searchIndex = null;

function buildIndex() {
  const rows = [];
  const add = (level, path) => {
    const names = LEVELS.slice(0, LEVELS.indexOf(level) + 1).map((l) => path[l]);
    rows.push({
      level,
      nameN: strip(path[level]),
      hay: names.map(strip).join(' '),
      result: { level, name: path[level], ...path },
    });
  };
  for (const province of Object.keys(data)) {
    add('province', { province });
    for (const district of Object.keys(data[province])) {
      add('district', { province, district });
      for (const sector of Object.keys(data[province][district])) {
        add('sector', { province, district, sector });
        for (const cell of Object.keys(data[province][district][sector])) {
          add('cell', { province, district, sector, cell });
          for (const village of data[province][district][sector][cell]) {
            add('village', { province, district, sector, cell, village });
          }
        }
      }
    }
  }
  return rows;
}

/**
 * Multi-word, case-insensitive, diacritic-insensitive search across all levels.
 * Every word must appear in the item's name or in the names above it, so
 * "gashora bugesera" finds Gashora sector and everything inside it.
 * Exact name matches come first, then closer matches, then shallower levels first.
 */
function search(query, options = {}) {
  const q = strip(query);
  const tokens = q.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return [];
  const want = new Set(options.levels || LEVELS);
  const limit = options.limit || 50;
  if (!searchIndex) searchIndex = buildIndex();

  const hits = [];
  for (const row of searchIndex) {
    if (!want.has(row.level)) continue;
    if (!tokens.every((t) => row.hay.includes(t))) continue;
    const inName = tokens.every((t) => row.nameN.includes(t));
    const score = row.nameN === q ? 0 : inName && row.nameN.startsWith(tokens[0]) ? 1 : inName ? 2 : 3;
    hits.push({ score, rank: LEVELS.indexOf(row.level), row });
  }
  hits.sort((a, b) => a.score - b.score || a.rank - b.rank);
  return hits.slice(0, limit).map((h) => ({ ...h.row.result }));
}

/* ---------- random & counts ---------- */

/** A random village with its full path: { province, district, sector, cell, village }. */
function getRandomLocation() {
  if (!searchIndex) searchIndex = buildIndex();
  const villages = searchIndex.filter((r) => r.level === 'village');
  const { level, name, ...path } = villages[Math.floor(Math.random() * villages.length)].result;
  return path;
}

/** Number of divisions at each level. */
function countLocations() {
  let districts = 0, sectors = 0, cells = 0, villages = 0;
  for (const p of Object.keys(data)) {
    for (const d of Object.keys(data[p])) {
      districts++;
      for (const s of Object.keys(data[p][d])) {
        sectors++;
        for (const c of Object.keys(data[p][d][s])) {
          cells++;
          villages += data[p][d][s][c].length;
        }
      }
    }
  }
  return { provinces: Object.keys(data).length, districts, sectors, cells, villages };
}

const getStats = countLocations;
