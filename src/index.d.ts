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

export interface Stats {
  provinces: number;
  districts: number;
  sectors: number;
  cells: number;
  villages: number;
}

export const data: RwandaGeoData;
export function getProvinces(): string[];
/** All districts, or only those in a province. */
export function getDistricts(province?: string): string[];
export function getProvinceOf(district: string): string | undefined;
export function getSectors(district: string): string[];
export function getCells(district: string, sector: string): string[];
export function getVillages(district: string, sector: string, cell: string): string[];
export function isValidAddress(address: Partial<Address>): boolean;
export function search(query: string, options?: SearchOptions): SearchResult[];
export function getStats(): Stats;

declare const _default: {
  data: RwandaGeoData;
  getProvinces: typeof getProvinces;
  getDistricts: typeof getDistricts;
  getProvinceOf: typeof getProvinceOf;
  getSectors: typeof getSectors;
  getCells: typeof getCells;
  getVillages: typeof getVillages;
  isValidAddress: typeof isValidAddress;
  search: typeof search;
  getStats: typeof getStats;
};
export default _default;
