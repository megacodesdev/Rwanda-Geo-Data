"""Rwanda administrative divisions: province > district > sector > cell > villages.

All lookups are case-insensitive. District names are unique nationwide, so
lookups below province only need the district.
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

__all__ = [
    "DATA", "get_provinces", "get_districts", "get_province_of", "get_sectors",
    "get_cells", "get_villages", "is_valid_address", "search", "get_stats",
]

with open(Path(__file__).with_name("data.json"), encoding="utf-8") as _f:
    DATA: Dict[str, Dict[str, Dict[str, Dict[str, List[str]]]]] = json.load(_f)


def _norm(s: Any) -> str:
    return "" if s is None else str(s).strip().lower()


def _find_key(obj: Optional[Dict[str, Any]], name: Any) -> Optional[str]:
    if not obj:
        return None
    n = _norm(name)
    for k in obj:
        if _norm(k) == n:
            return k
    return None


_DISTRICT_INDEX: Dict[str, str] = {
    _norm(d): p for p, ds in DATA.items() for d in ds
}


def get_provinces() -> List[str]:
    return list(DATA)


def get_districts(province: Optional[str] = None) -> List[str]:
    if province is None:
        return [d for ds in DATA.values() for d in ds]
    p = _find_key(DATA, province)
    return list(DATA[p]) if p else []


def get_province_of(district: str) -> Optional[str]:
    return _DISTRICT_INDEX.get(_norm(district))


def get_sectors(district: str) -> List[str]:
    p = get_province_of(district)
    if not p:
        return []
    d = _find_key(DATA[p], district)
    return list(DATA[p][d])


def get_cells(district: str, sector: str) -> List[str]:
    p = get_province_of(district)
    if not p:
        return []
    d = _find_key(DATA[p], district)
    s = _find_key(DATA[p][d], sector)
    return list(DATA[p][d][s]) if s else []


def get_villages(district: str, sector: str, cell: str) -> List[str]:
    p = get_province_of(district)
    if not p:
        return []
    d = _find_key(DATA[p], district)
    s = _find_key(DATA[p][d], sector)
    if not s:
        return []
    c = _find_key(DATA[p][d][s], cell)
    return list(DATA[p][d][s][c]) if c else []


def is_valid_address(
    province: str,
    district: str,
    sector: Optional[str] = None,
    cell: Optional[str] = None,
    village: Optional[str] = None,
) -> bool:
    p = _find_key(DATA, province)
    if not p:
        return False
    d = _find_key(DATA[p], district)
    if not d:
        return False
    if sector is None:
        return True
    s = _find_key(DATA[p][d], sector)
    if not s:
        return False
    if cell is None:
        return True
    c = _find_key(DATA[p][d][s], cell)
    if not c:
        return False
    if village is None:
        return True
    return any(_norm(v) == _norm(village) for v in DATA[p][d][s][c])


def search(
    query: str,
    levels: Optional[List[str]] = None,
    limit: int = 50,
) -> List[Dict[str, str]]:
    """Case-insensitive substring search. Levels: province, district, sector, cell, village."""
    q = _norm(query)
    if not q:
        return []
    want = set(levels or ["province", "district", "sector", "cell", "village"])
    out: List[Dict[str, str]] = []

    def push(r: Dict[str, str]) -> bool:
        out.append(r)
        return len(out) >= limit

    for province, districts in DATA.items():
        if "province" in want and q in _norm(province):
            if push({"level": "province", "name": province, "province": province}):
                return out
        for district, sectors in districts.items():
            if "district" in want and q in _norm(district):
                if push({"level": "district", "name": district, "province": province, "district": district}):
                    return out
            for sector, cells in sectors.items():
                if "sector" in want and q in _norm(sector):
                    if push({"level": "sector", "name": sector, "province": province,
                             "district": district, "sector": sector}):
                        return out
                for cell, villages in cells.items():
                    if "cell" in want and q in _norm(cell):
                        if push({"level": "cell", "name": cell, "province": province,
                                 "district": district, "sector": sector, "cell": cell}):
                            return out
                    if "village" in want:
                        for village in villages:
                            if q in _norm(village):
                                if push({"level": "village", "name": village, "province": province,
                                         "district": district, "sector": sector,
                                         "cell": cell, "village": village}):
                                    return out
    return out


def get_stats() -> Dict[str, int]:
    districts = sectors = cells = villages = 0
    for ds in DATA.values():
        for ss in ds.values():
            districts += 1
            for cs in ss.values():
                sectors += 1
                for vs in cs.values():
                    cells += 1
                    villages += len(vs)
    return {"provinces": len(DATA), "districts": districts, "sectors": sectors,
            "cells": cells, "villages": villages}
