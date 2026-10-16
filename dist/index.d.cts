export type Level = 'province' | 'district' | 'sector' | 'cell' | 'village';

/** Province -> District -> Sector -> Cell -> Villages */
export type RwandaGeoData = {
  [province: string]: {
    [district: string]: {
      [sector: string]: {
        [cell: string]: string[];
      };
    };
  };
};

export interface SearchResult {
  level: Level;
  name: string;
  province: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}

export interface SearchOptions {
  levels?: Level[];
  limit?: number;
}

export interface Address {
  province: string;
  district: string;
  sector?: string;
  cell?: string;
  village?: string;
}

/** A full path down to one village. */
export interface Location {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

export interface Stats {
  provinces: number;
  districts: number;
  sectors: number;
  cells: number;
  villages: number;
}

export const data: RwandaGeoData;

/** Always "Rwanda". */
export function getCountry(): 'Rwanda';
export function getProvinces(): string[];

/** All districts, or only those in a province. */
export function getDistricts(province?: string): string[];
export function getDistrictsByProvince(province: string): string[];
export function getProvinceOf(district: string): string | undefined;

/** No arguments: every sector name in Rwanda (unique, sorted). Otherwise the sectors of a district. */
export function getSectors(): string[];
export function getSectors(district: string): string[];
export function getSectors(province: string, district: string): string[];
export function getSectorsByDistrict(province: string, district: string): string[];
export function getSectorsByDistrict(district: string): string[];

/** No arguments: every cell name in Rwanda (unique, sorted). Otherwise the cells of a sector. */
export function getCells(): string[];
export function getCells(district: string, sector: string): string[];
export function getCells(province: string, district: string, sector: string): string[];
export function getCellsBySector(province: string, district: string, sector: string): string[];
export function getCellsBySector(district: string, sector: string): string[];

/** No arguments: every village name in Rwanda (unique, sorted). Otherwise the villages of a cell. */
export function getVillages(): string[];
export function getVillages(district: string, sector: string, cell: string): string[];
export function getVillages(province: string, district: string, sector: string, cell: string): string[];
export function getVillagesByCell(province: string, district: string, sector: string, cell: string): string[];
export function getVillagesByCell(district: string, sector: string, cell: string): string[];

export function isValidAddress(address: Partial<Address>): boolean;

/** Multi-word, case- and diacritic-insensitive search across all levels. */
export function search(query: string, options?: SearchOptions): SearchResult[];

/** A random village with its full path. */
export function getRandomLocation(): Location;
/** Number of divisions at each level. */
export function countLocations(): Stats;
/** Alias of countLocations(). */
export function getStats(): Stats;

declare const _default: {
  data: RwandaGeoData;
  getCountry: typeof getCountry;
  getProvinces: typeof getProvinces;
  getDistricts: typeof getDistricts;
  getDistrictsByProvince: typeof getDistrictsByProvince;
  getProvinceOf: typeof getProvinceOf;
  getSectors: typeof getSectors;
  getSectorsByDistrict: typeof getSectorsByDistrict;
  getCells: typeof getCells;
  getCellsBySector: typeof getCellsBySector;
  getVillages: typeof getVillages;
  getVillagesByCell: typeof getVillagesByCell;
  isValidAddress: typeof isValidAddress;
  search: typeof search;
  getRandomLocation: typeof getRandomLocation;
  countLocations: typeof countLocations;
  getStats: typeof getStats;
};
export = _default;
