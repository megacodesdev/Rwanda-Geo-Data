# Rwanda Geo Data

Rwanda's administrative divisions for JavaScript/TypeScript and Python:
**5 provinces → 30 districts → 416 sectors → 2,149 cells → 14,837 villages**.

Zero dependencies. Lookups are case-insensitive and diacritic-insensitive. District names are unique, so the province argument is optional below district level.

## Install

```bash
npm install @linkfy-connect/rwanda-geo-data      # JavaScript / TypeScript
pip install rwanda-geo-data                      # Python
```

Works in Node and in every bundler-based framework (React, Next.js, Vue, Nuxt, Angular, Svelte, Astro, React Native, Vite, webpack), with ESM, CommonJS and TypeScript types included.

## Functions

| JavaScript | Python | Returns |
|---|---|---|
| `getCountry()` | `get_country()` | `"Rwanda"` |
| `getProvinces()` | `get_provinces()` | all provinces |
| `getDistricts()` | `get_districts()` | all districts |
| `getDistrictsByProvince(province)` | `get_districts_by_province(province)` | districts of a province |
| `getSectors()` | `get_sectors()` | all sectors (unique names) |
| `getSectorsByDistrict(province, district)` | `get_sectors_by_district(province, district)` | sectors of a district |
| `getCells()` | `get_cells()` | all cells (unique names) |
| `getCellsBySector(province, district, sector)` | `get_cells_by_sector(province, district, sector)` | cells of a sector |
| `getVillages()` | `get_villages()` | all villages (unique names) |
| `getVillagesByCell(province, district, sector, cell)` | `get_villages_by_cell(province, district, sector, cell)` | villages of a cell |
| `search(query, { levels, limit })` | `search(query, levels=None, limit=50)` | matches at any level |
| `getRandomLocation()` | `get_random_location()` | a random full address |
| `countLocations()` | `count_locations()` | number of divisions per level |
| `getProvinceOf(district)` | `get_province_of(district)` | province name |
| `isValidAddress({...})` | `is_valid_address(...)` | `true` / `false` |

Shorter calls also work: leave out the province, for example `getSectorsByDistrict('Bugesera')` or `getCellsBySector('Bugesera', 'Gashora')`. A wrong province for a district returns an empty list.

## JavaScript

```js
import {
  getCountry, getProvinces, getDistrictsByProvince, getSectorsByDistrict,
  getCellsBySector, getVillagesByCell, search, getRandomLocation, countLocations,
} from '@linkfy-connect/rwanda-geo-data';

getCountry();                                                   // 'Rwanda'
getProvinces();                                                 // ['East', 'Kigali', 'North', 'South', 'West']
getDistrictsByProvince('East');                                 // ['Bugesera', 'Gatsibo', ...]
getSectorsByDistrict('East', 'Bugesera');                       // ['Gashora', 'Juru', ...]
getCellsBySector('East', 'Bugesera', 'Gashora');                // ['Biryogo', 'Kabuye', ...]
getVillagesByCell('East', 'Bugesera', 'Gashora', 'Biryogo');    // ['Bidudu', 'Biryogo', ...]

countLocations();   // { provinces: 5, districts: 30, sectors: 416, cells: 2149, villages: 14837 }
getRandomLocation();
// { province: 'East', district: 'Bugesera', sector: 'Gashora', cell: 'Biryogo', village: 'Bidudu' }
```

### Search

Multi-word, case-insensitive and diacritic-insensitive. Every word must appear in the item's name or in the names above it, so `"gashora bugesera"` finds the Gashora sector and everything inside it. Exact name matches come first, then closer matches, then shallower levels.

```js
search('gashora');
search('gashora bugesera', { limit: 10 });
search('kigali', { levels: ['district', 'sector'] });
// [{ level: 'sector', name: 'Gashora', province: 'East', district: 'Bugesera', sector: 'Gashora' }, ...]
```

### React: cascading dropdowns

```jsx
import { useState } from 'react';
import {
  getProvinces, getDistrictsByProvince, getSectorsByDistrict, getCellsBySector, getVillagesByCell,
} from '@linkfy-connect/rwanda-geo-data';

const LEVELS = ['province', 'district', 'sector', 'cell', 'village'];

export default function AddressPicker() {
  const [a, setA] = useState({});

  // Changing a level clears every level below it.
  const choose = (level, value) => {
    const keep = LEVELS.slice(0, LEVELS.indexOf(level));
    setA({ ...Object.fromEntries(keep.map((k) => [k, a[k]])), [level]: value });
  };

  const options = {
    province: getProvinces(),
    district: a.province ? getDistrictsByProvince(a.province) : [],
    sector: a.district ? getSectorsByDistrict(a.province, a.district) : [],
    cell: a.sector ? getCellsBySector(a.province, a.district, a.sector) : [],
    village: a.cell ? getVillagesByCell(a.province, a.district, a.sector, a.cell) : [],
  };

  return LEVELS.map((level) => (
    <select key={level} value={a[level] || ''} disabled={!options[level].length}
            onChange={(e) => choose(level, e.target.value)}>
      <option value="">Select {level}</option>
      {options[level].map((o) => <option key={o}>{o}</option>)}
    </select>
  ));
}
```

### Vue 3

```vue
<script setup>
import { ref, computed } from 'vue';
import { getProvinces, getDistrictsByProvince } from '@linkfy-connect/rwanda-geo-data';
const province = ref('');
const districts = computed(() => getDistrictsByProvince(province.value));
</script>
<template>
  <select v-model="province"><option v-for="p in getProvinces()" :key="p">{{ p }}</option></select>
  <select><option v-for="d in districts" :key="d">{{ d }}</option></select>
</template>
```

Angular, Svelte, Next.js, Nuxt and React Native use the same import. In Next.js and Nuxt it also works in server code.

The dataset is about 190 kB in the bundle (roughly 40 kB gzipped). To keep it out of the first load, import it lazily: `const geo = await import('@linkfy-connect/rwanda-geo-data')`.

## Python

```python
import rwanda_geo_data as geo

geo.get_country()                                              # 'Rwanda'
geo.get_districts_by_province("East")                          # ['Bugesera', 'Gatsibo', ...]
geo.get_sectors_by_district("East", "Bugesera")                # ['Gashora', 'Juru', ...]
geo.get_cells_by_sector("East", "Bugesera", "Gashora")         # ['Biryogo', 'Kabuye', ...]
geo.get_villages_by_cell("East", "Bugesera", "Gashora", "Biryogo")

geo.search("gashora bugesera", limit=10)
geo.get_random_location()
geo.count_locations()
geo.DATA                                                       # raw nested dict
```

### FastAPI

```python
from fastapi import FastAPI
import rwanda_geo_data as geo

app = FastAPI()

@app.get("/districts/{province}")
def districts(province: str):
    return geo.get_districts_by_province(province)

@app.get("/search")
def search(q: str):
    return geo.search(q, limit=20)
```

Django and Flask work the same way: call these functions in any view, serializer or form validator.

## Development

```bash
npm test            # builds dist/, syncs data to python/, runs JS tests
cd python && python -m unittest discover -s tests
```

`data/rwanda-geo-data.json` is the single source of truth. Edit it, then run `npm run build`: this regenerates `dist/` and copies the data into the Python package.

## Author

Developed by **LinkFy Connect** ([github.com/megacodesdev](https://github.com/megacodesdev)).

Issues and contributions: https://github.com/megacodesdev/Rwanda-Geo-Data/issues

## License

MIT © LinkFy Connect
