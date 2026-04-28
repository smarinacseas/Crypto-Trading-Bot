"""Discover and read universe files (curated ticker lists).

A universe is a plain-text file in ``backend/app/data/`` with one ticker
per line. Lines starting with ``#`` are comments. Two specially-formatted
comments at the top are picked up as metadata:

    # label: Nasdaq-100
    # description: Approximation of the Nasdaq-100.
    AAPL
    MSFT
    ...

The universe ``name`` is the filename stem (``nasdaq100.txt`` -> ``nasdaq100``).
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

from ..core.config import settings

DATA_DIR = Path("backend/app/data")
_LABEL_RE = re.compile(r"^#\s*label\s*:\s*(.+?)\s*$", re.IGNORECASE)
_DESC_RE = re.compile(r"^#\s*description\s*:\s*(.+?)\s*$", re.IGNORECASE)


@dataclass
class Universe:
    name: str
    label: str
    description: Optional[str]
    path: str
    count: int

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "label": self.label,
            "description": self.description,
            "count": self.count,
        }


def _data_dir() -> Path:
    """Resolve the data dir from settings; fall back to repo-root path."""
    # ``DEFAULT_UNIVERSE_FILE`` lives in the same dir as the rest of them.
    p = Path(settings.DEFAULT_UNIVERSE_FILE).parent
    if p.exists():
        return p
    return DATA_DIR


def _parse_file(path: Path) -> Universe:
    label: Optional[str] = None
    description: Optional[str] = None
    tickers: List[str] = []

    with path.open("r") as f:
        for raw in f:
            line = raw.strip()
            if not line:
                continue
            if line.startswith("#"):
                m = _LABEL_RE.match(line)
                if m and label is None:
                    label = m.group(1)
                    continue
                m = _DESC_RE.match(line)
                if m and description is None:
                    description = m.group(1)
                    continue
                # other comments: ignored
                continue
            tickers.append(line.upper())

    name = path.stem
    return Universe(
        name=name,
        label=label or name.replace("_", " ").title(),
        description=description,
        path=str(path),
        count=len(tickers),
    )


def list_universes() -> List[Universe]:
    """Discover all .txt files in the data dir."""
    d = _data_dir()
    if not d.exists():
        return []
    out: List[Universe] = []
    for path in sorted(d.glob("*.txt")):
        try:
            out.append(_parse_file(path))
        except Exception:  # noqa: BLE001 — bad files should be skipped, not crash startup
            continue
    return out


def load_universe(name: str) -> List[str]:
    """Return the deduped ticker list for ``name``. Raises if not found."""
    d = _data_dir()
    path = d / f"{name}.txt"
    if not path.exists():
        raise FileNotFoundError(f"Universe '{name}' not found at {path}")
    universe = _parse_file(path)
    seen = set()
    out: List[str] = []
    with path.open("r") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            t = line.upper()
            if t in seen:
                continue
            seen.add(t)
            out.append(t)
    return out


def resolve_tickers(
    universes: Optional[List[str]] = None,
    tickers: Optional[List[str]] = None,
) -> List[str]:
    """Combine + dedupe tickers from named universes and an explicit list."""
    seen = set()
    out: List[str] = []
    for u in universes or []:
        try:
            for t in load_universe(u):
                if t not in seen:
                    seen.add(t)
                    out.append(t)
        except FileNotFoundError:
            continue
    for raw in tickers or []:
        t = raw.upper().strip()
        if not t or t in seen:
            continue
        seen.add(t)
        out.append(t)
    return out
