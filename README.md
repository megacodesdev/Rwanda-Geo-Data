# Rwanda Geo Data

Rwanda's administrative divisions for JavaScript/TypeScript and Python:
**5 provinces → 30 districts → 416 sectors → 2,149 cells → 14,837 villages**.

Zero dependencies. Lookups are case-insensitive. District names are unique, so you only pass the district (no province) when looking up sectors, cells and villages.

## JavaScript / TypeScript

```bash
npm install rwanda-geo-data
```

Works in Node, and in any bundler-based framework (React, Next.js, Vue, Nuxt, Angular, Svelte/SvelteKit, Astro, Remix, React Native, Vite, webpack) via ESM, CommonJS and bundled TypeScript types.

```js
import { getProvinces, getDistricts, getSectors, getCells, getVillages, search } from 'rwanda-geo-data';

getProvinces();                                  // ['East', 'Kigali', 'North', 'South', 'West']
getDistricts('East');                            // ['Bugesera', 'Gatsibo', ...]
getSectors('Bugesera');                          // ['Gashora', 'Juru', ...]
getCells('Bugesera', 'Gashora');                 // ['Biryogo', 'Kabuye', ...]
getVillages('Bugesera', 'Gashora', 'Biryogo');   // ['Bidudu', 'Biryogo', ...]
```

### React: cascading dropdowns

```jsx
import { useState } from 'react';
import { getProvinces, getDistricts, getSectors, getCells, getVillages } from 'rwanda-geo-data';

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
    district: a.province ? getDistricts(a.province) : [],
    sector: a.district ? getSectors(a.district) : [],
    cell: a.sector ? getCells(a.district, a.sector) : [],
    village: a.cell ? getVillages(a.district, a.sector, a.cell) : [],
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
import { getProvinces, getDistricts } from 'rwanda-geo-data';
const province = ref('');
const districts = computed(() => getDistricts(province.value));
</script>
<template>
  <select v-model="province"><option v-for="p in getProvinces()" :key="p">{{ p }}</option></select>
  <select><option v-for="d in districts" :key="d">{{ d }}</option></select>
</template>
```

### Angular, Svelte, Next.js, Nuxt

Same import everywhere: `import { getDistricts } from 'rwanda-geo-data'`. In Next.js/Nuxt it also works in server code (API routes, server components).

The whole dataset is about 190 kB in the bundle (roughly 40 kB gzipped). To keep it out of the initial bundle, load it lazily:

```js
const geo = await import('rwanda-geo-data');
```

### API

| Function | Returns |
|---|---|
| `getProvinces()` | `string[]` |
| `getDistricts(province?)` | districts of a province, or all 30 |
| `getProvinceOf(district)` | province name or `undefined` |
| `getSectors(district)` | `string[]` |
| `getCells(district, sector)` | `string[]` |
| `getVillages(district, sector, cell)` | `string[]` |
| `isValidAddress({province, district, sector?, cell?, village?})` | `boolean` |
| `search(query, {levels?, limit?})` | `[{level, name, province, district?, ...}]` |
| `getStats()` | counts per level |
| `data` | the raw nested object |

## Python

```bash
pip install rwanda-geo-data
```

Python 3.8+, standard library only.

```python
import rwanda_geo_data as geo

geo.get_provinces()                                  # ['East', 'Kigali', 'North', 'South', 'West']
geo.get_districts("East")                            # ['Bugesera', 'Gatsibo', ...]
geo.get_sectors("Bugesera")                          # ['Gashora', 'Juru', ...]
geo.get_cells("Bugesera", "Gashora")                 # ['Biryogo', 'Kabuye', ...]
geo.get_villages("Bugesera", "Gashora", "Biryogo")   # ['Bidudu', 'Biryogo', ...]
geo.is_valid_address("East", "Bugesera", "Gashora")  # True
geo.search("gashora", levels=["sector"])
geo.DATA                                             # raw nested dict
```

### FastAPI

```python
from fastapi import FastAPI
import rwanda_geo_data as geo

app = FastAPI()

@app.get("/districts/{province}")
def districts(province: str):
    return geo.get_districts(province)

@app.get("/sectors/{district}")
def sectors(district: str):
    return geo.get_sectors(district)
```

### Django / Flask

Call the same functions inside any view, serializer or form validator, for example `geo.is_valid_address(...)` in a form's `clean()`.

## Development

```bash
npm test            # builds dist/, syncs data to python/, runs JS tests
cd python && python -m unittest discover -s tests
```

`data/rwanda-geo-data.json` is the single source of truth. Edit it, then run `npm run build`: this regenerates `dist/` and copies the data into the Python package.

## Publishing

```bash
# npm
npm login
npm publish            # use `npm publish --access public` for a scoped name

# PyPI
cd python
pip install build twine
python -m build
twine upload dist/*
```

Bump the version in both `package.json` and `python/pyproject.toml` for each release.

## Author

Developed by **LinkFy Connect** ([github.com/megacodesdev](https://github.com/megacodesdev)).

Issues and contributions: https://github.com/megacodesdev/Rwanda-Geo-Data/issues

## License

MIT © LinkFy Connect
