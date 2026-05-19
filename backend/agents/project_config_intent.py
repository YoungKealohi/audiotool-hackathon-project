"""
Parse user text for explicit tempo / time-signature changes.

Used to deterministically invoke the MCP tool ``update-project-config`` when the
user's wording clearly requests a config change, without relying on the LLM to
emit a tool call.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

# Reasonable musical tempo range (BPM)
_MIN_BPM = 20
_MAX_BPM = 400


def parse_update_project_config_args(query: str) -> Optional[Dict[str, Any]]:
    """
    If the query clearly asks to set tempo and/or time signature, return kwargs
    for ``update-project-config``. Otherwise return None.

    Returns dicts with:
    - ``tempoBpm`` (int), and/or
    - ``timeSignatureNumerator`` and ``timeSignatureDenominator`` (ints)

    Both may be present in one query.
    """
    text = (query or "").strip()
    if not text:
        return None

    tempo_bpm: Optional[int] = None
    sig_num: Optional[int] = None
    sig_den: Optional[int] = None

    # --- Tempo: require bpm/tempo context to avoid matching stray numbers ---
    tempo_patterns = [
        r"(?i)(?:set|change|put|update|switch)\s+(?:the\s+)?(?:bpm|tempo)\s+(?:to|at|as)\s*(\d{2,4})\b",
        r"(?i)(?:set|change|put|update)\s+(?:the\s+)?(?:bpm|tempo)\s+of\s*(\d{2,4})\b",
        r"(?i)(?:bpm|tempo)\s*(?:to|at|is|=|:)\s*(\d{2,4})\b",
        r"(?i)(?:bpm|tempo)\s+of\s*(\d{2,4})\b",
        r"(?i)(\d{2,4})\s*bpm\b",
        r"(?i)beats?\s+per\s+minute\s*(?:to|at|is|=|:)?\s*(\d{2,4})\b",
    ]
    for pat in tempo_patterns:
        m = re.search(pat, text)
        if m:
            v = int(m.group(1))
            if _MIN_BPM <= v <= _MAX_BPM:
                tempo_bpm = v
                break

    # --- Time signature: require signature/meter wording or explicit fraction near it ---
    sig_patterns = [
        r"(?i)(?:time\s*)?signature\s*(?:to|at|is|=|:)?\s*(\d+)\s*/\s*(\d+)",
        r"(?i)(?:time\s*)?signature\s+(?:of|as)\s+(\d+)\s*/\s*(\d+)",
        r"(?i)\bmeter\s*(?:to|at|is|=|:)?\s*(\d+)\s*/\s*(\d+)",
        r"(?i)(?:change|set|put)\s+(?:the\s+)?(?:time\s*)?signature\s+(?:to|at|as)\s+(\d+)\s*/\s*(\d+)",
    ]
    for pat in sig_patterns:
        m = re.search(pat, text)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            if a > 0 and b > 0:
                sig_num, sig_den = a, b
                break

    if tempo_bpm is None and sig_num is None:
        return None

    out: Dict[str, Any] = {}
    if tempo_bpm is not None:
        out["tempoBpm"] = tempo_bpm
    if sig_num is not None and sig_den is not None:
        out["timeSignatureNumerator"] = sig_num
        out["timeSignatureDenominator"] = sig_den
    return out if out else None
