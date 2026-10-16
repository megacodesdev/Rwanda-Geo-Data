const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();

function findKey(obj, name) {
  if (!obj) return undefined;
  const n = norm(name);
  return Object.keys(obj).find((k) => norm(k) === n);
}

// district -> province index (district names are unique nationwide)
const districtIndex = {};
for (const province of Object.keys(data)) {
  for (const district of Object.keys(data[province])) {
    districtIndex[norm(district)] = province;
  }
}

function getProvinces() {
  return Object.keys(data);
}

function getDistricts(province) {
  if (province === undefined) {
    return Object.keys(data).flatMap((p) => Object.keys(data[p]));
  }
  const p = findKey(data, province);
  return p ? Object.keys(data[p]) : [];
}

function getProvinceOf(district) {
  return districtIndex[norm(district)];
}

function getSectors(district) {
  const p = getProvinceOf(district);
  if (!p) return [];
  const d = findKey(data[p], district);
  return Object.keys(data[p][d]);
}

function getCells(district, sector) {
  const p = getProvinceOf(district);
  if (!p) return [];
  const d = findKey(data[p], district);
  const s = findKey(data[p][d], sector);
  return s ? Object.keys(data[p][d][s]) : [];
}

function getVillages(district, sector, cell) {
  const p = getProvinceOf(district);
  if (!p) return [];
  const d = findKey(data[p], district);
  const s = findKey(data[p][d], sector);
  if (!s) return [];
  const c = findKey(data[p][d][s], cell);
  return c ? data[p][d][s][c].slice() : [];
}

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
  return data[p][d][s][c].some((v) => norm(v) === norm(village));
}

/** Case-insensitive substring search across levels. */
function search(query, options = {}) {
  const q = norm(query);
  if (!q) return [];
  const want = new Set(options.levels || ['province', 'district', 'sector', 'cell', 'village']);
  const limit = options.limit || 50;
  const out = [];
  const push = (r) => { if (out.length < limit) out.push(r); };

  for (const province of Object.keys(data)) {
    if (want.has('province') && norm(province).includes(q)) {
      push({ level: 'province', name: province, province });
    }
    for (const district of Object.keys(data[province])) {
      if (want.has('district') && norm(district).includes(q)) {
        push({ level: 'district', name: district, province, district });
      }
      for (const sector of Object.keys(data[province][district])) {
        if (want.has('sector') && norm(sector).includes(q)) {
          push({ level: 'sector', name: sector, province, district, sector });
        }
        for (const cell of Object.keys(data[province][district][sector])) {
          if (want.has('cell') && norm(cell).includes(q)) {
            push({ level: 'cell', name: cell, province, district, sector, cell });
          }
          if (want.has('village')) {
            for (const village of data[province][district][sector][cell]) {
              if (norm(village).includes(q)) {
                push({ level: 'village', name: village, province, district, sector, cell, village });
              }
            }
          }
        }
      }
    }
  }
  return out;
}

function getStats() {
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
