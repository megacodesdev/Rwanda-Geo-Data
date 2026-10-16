"""Rwanda administrative divisions: province > district > sector > cell > villages.

All lookups are case-insensitive and diacritic-insensitive. District names are
unique nationwide, so the province argument is optional below district level.
"""
import json
import random
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

__all__ = [
    "DATA", "get_country", "get_provinces", "get_districts", "get_districts_by_province",
    "get_province_of", "get_sectors", "get_sectors_by_district", "get_cells",
    "get_cells_by_sector", "get_villages", "get_villages_by_cell", "is_valid_address",
    "search", "get_random_location", "count_locations", "get_stats",
]

with open(Path(__file__).with_name("data.json"), encoding="utf-8") as _f:
    DATA: Dict[str, Dict[str, Dict[str, Dict[str, List[str]]]]] = json.load(_f)

LEVELS = ["province", "district", "sector", "cell", "village"]


def _norm(s: Any) -> str:
    if s is None:
        return ""
    s = unicodedata.normalize("NFD", str(s))
    return "".join(c for c in s if unicodedata.category(c) != "Mn").strip().lower()


def _find_key(obj: Optional[Dict[str, Any]], name: Any) -> Optional[str]:
    if not obj:
        return None
    n = _norm(name)
    for k in obj:
        if _norm(k) == n:
            return k
    return None


def _unique_sorted(items: List[str]) -> List[str]:
    return sorted(set(items), key=lambda x: (x.lower(), x))


_DISTRICT_INDEX: Dict[str, str] = {
    _norm(d): p for p, ds in DATA.items() for d in ds
}


def _given(v: Any) -> bool:
    return v is not None and v != ""


def _locate(province, district, sector=None, cell=None, depth=2) -> Optional[Tuple[str, ...]]:
    """Resolve a path to its real keys, or None if any part is wrong."""
    p = _DISTRICT_INDEX.get(_norm(district))
    if not p:
        return None
    if _given(province) and _norm(province) != _norm(p):
        return None
    d = _find_key(DATA[p], district)
    if depth == 2:
        return (p, d)
    s = _find_key(DATA[p][d], sector)
    if not s:
        return None
    if depth == 3:
        return (p, d, s)
    c = _find_key(DATA[p][d][s], cell)
    return (p, d, s, c) if c else None


def _parse(args: tuple, depth: int):
    """Accept (province, district, ...) or just (district, ...)."""
    if len(args) >= depth:
        return args[0], list(args[1:depth])
    return None, list(args[: depth - 1])


# ---------- country & provinces ----------

def get_country() -> str:
    return "Rwanda"


def get_provinces() -> List[str]:
    return list(DATA)


# ---------- districts ----------

def get_districts(province: Optional[str] = None) -> List[str]:
    """All districts, or only those of a province."""
    if province is None:
        return [d for ds in DATA.values() for d in ds]
    p = _find_key(DATA, province)
    return list(DATA[p]) if p else []


def get_districts_by_province(province: str) -> List[str]:
    return get_districts(province) if _given(province) else []


def get_province_of(district: str) -> Optional[str]:
    return _DISTRICT_INDEX.get(_norm(district))


# ---------- sectors ----------

def get_sectors_by_district(*args: str) -> List[str]:
    province, (district,) = _parse(args, 2)
    loc = _locate(province, district)
    return list(DATA[loc[0]][loc[1]]) if loc else []


def get_sectors(*args: str) -> List[str]:
    """No arguments: every sector name in Rwanda. Otherwise the sectors of one district."""
    if not args:
        return _unique_sorted([s for ds in DATA.values() for ss in ds.values() for s in ss])
    return get_sectors_by_district(*args)


# ---------- cells ----------

def get_cells_by_sector(*args: str) -> List[str]:
    province, (district, sector) = _parse(args, 3)
    loc = _locate(province, district, sector, depth=3)
    return list(DATA[loc[0]][loc[1]][loc[2]]) if loc else []


def get_cells(*args: str) -> List[str]:
    """No arguments: every cell name in Rwanda. Otherwise the cells of one sector."""
    if not args:
        return _unique_sorted(
            [c for ds in DATA.values() for ss in ds.values() for cs in ss.values() for c in cs]
        )
    return get_cells_by_sector(*args)


# ---------- villages ----------

def get_villages_by_cell(*args: str) -> List[str]:
    province, (district, sector, cell) = _parse(args, 4)
    loc = _locate(province, district, sector, cell, depth=4)
    return list(DATA[loc[0]][loc[1]][loc[2]][loc[3]]) if loc else []


def get_villages(*args: str) -> List[str]:
    """No arguments: every village name in Rwanda. Otherwise the villages of one cell."""
    if not args:
        return _unique_sorted(
            [v for ds in DATA.values() for ss in ds.values() for cs in ss.values()
             for vs in cs.values() for v in vs]
        )
    return get_villages_by_cell(*args)


# ---------- validation ----------

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


# ---------- search ----------

_INDEX: Optional[List[Tuple[str, str, str, Dict[str, str]]]] = None


def _build_index():
    rows = []

    def add(level: str, path: Dict[str, str]) -> None:
        names = [path[l] for l in LEVELS[: LEVELS.index(level) + 1]]
        result = {"level": level, "name": path[level], **path}
        rows.append((level, _norm(path[level]), " ".join(_norm(n) for n in names), result))

    for province, districts in DATA.items():
        add("province", {"province": province})
        for district, sectors in districts.items():
            add("district", {"province": province, "district": district})
            for sector, cells in sectors.items():
                add("sector", {"province": province, "district": district, "sector": sector})
                for cell, villages in cells.items():
                    add("cell", {"province": province, "district": district,
                                 "sector": sector, "cell": cell})
                    for village in villages:
                        add("village", {"province": province, "district": district,
                                        "sector": sector, "cell": cell, "village": village})
    return rows


def search(query: str, levels: Optional[List[str]] = None, limit: int = 50) -> List[Dict[str, str]]:
    """Multi-word, case- and diacritic-insensitive search across all levels.

    Every word must appear in the item's name or in the names above it, so
    "gashora bugesera" finds Gashora sector and everything inside it. Exact name
    matches come first, then closer matches, then shallower levels first.
    """
    global _INDEX
    q = _norm(query)
    tokens = [t for t in q.replace(",", " ").split() if t]
    if not tokens:
        return []
    want = set(levels or LEVELS)
    if _INDEX is None:
        _INDEX = _build_index()

    hits = []
    for level, name_n, hay, result in _INDEX:
        if level not in want:
            continue
        if not all(t in hay for t in tokens):
            continue
        in_name = all(t in name_n for t in tokens)
        if name_n == q:
            score = 0
        elif in_name and name_n.startswith(tokens[0]):
            score = 1
        elif in_name:
            score = 2
        else:
            score = 3
        hits.append((score, LEVELS.index(level), result))
    hits.sort(key=lambda h: (h[0], h[1]))
    return [dict(h[2]) for h in hits[:limit]]


# ---------- random & counts ----------

def get_random_location() -> Dict[str, str]:
    """A random village with its full path."""
    global _INDEX
    if _INDEX is None:
        _INDEX = _build_index()
    villages = [r for r in _INDEX if r[0] == "village"]
    result = dict(random.choice(villages)[3])
    result.pop("level")
    result.pop("name")
    return result


def count_locations() -> Dict[str, int]:
    """Number of divisions at each level."""
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


get_stats = count_locations
