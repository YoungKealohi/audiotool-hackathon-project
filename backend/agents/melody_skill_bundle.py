"""
Select which agent skill markdown files the melody subagent receives.

The main agent loads every top-level skills/*.md file. The melody subagent runs
in a separate scoped LLM loop and only sees skills we attach here — keeping the
core bundle small while adding optional packs based on the user query.
"""

from __future__ import annotations

import os
import re
from typing import Sequence

# Always included when composing MIDI (Strudel + instruments + genre palette).
MELODY_SKILL_CORE: tuple[str, ...] = (
    "09_strudel.md",
    "02_adding_sounds.md",
    "00_music_theory.md",
)

# Artist / theme / "sounds like" requests.
MELODY_SKILL_REFERENCE: tuple[str, ...] = (
    "10_reference_styles.md",
    "references/style_cards.md",
)

# Chord spelling, progressions, key detection (large — load only when needed).
MELODY_SKILL_HARMONY: tuple[str, ...] = (
    "08_tonaljs.md",
)

# Pasted ABC / leadsheet workflows.
MELODY_SKILL_ABC: tuple[str, ...] = (
    "references/notation/abc-notation.md",
)

REFERENCE_COMPOSE_PATTERNS = re.compile(
    r"(?i)"
    r"(?:\bin\s+the\s+spirit\s+of\b)"
    r"|(?:\bmake\s+(?:\w+\s+){0,6}(?:sound\s+)?(?:more\s+)?like\b)"
    r"|(?:\bcloser\s+to\s+(?:the\s+)?)"
    r"|(?:\bevoke\s+)"
    r"|(?:\bsounds?\s+like\s+(?:the\s+)?[\w\s'-]{0,40}"
    r"(?:theme|soundtrack|score|song|riff|intro|outro)\b)"
    r"|(?:\blike\s+(?:the\s+)?[\w\s'-]{0,30}"
    r"(?:theme|soundtrack|riff)\b)"
    r"|(?:\b(?:rewrite|rework|fix|adjust)\s+[\w\s]{0,24}(?:like|to\s+match)\b)"
    r"|(?:\bsounds?\s+like\s+(?:iron\s+man|black\s+sabbath|daft\s+punk|hans\s+zimmer|"
    r"john\s+williams|avengers)\b)"
)

STYLE_IN_COMPOSE_PATTERNS = re.compile(
    r"\b(sounds?\s+like|style\s+of|genre|vibe|inspired\s+by)\b",
    re.IGNORECASE,
)

HARMONY_COMPOSE_PATTERNS = re.compile(
    r"\b("
    r"chord\s+progression|chord\s+changes|chords?|harmon(?:y|ic|ize)|"
    r"roman\s+numeral|ii[\s-]?v|cadence|diatonic|modulat(?:e|ion)|"
    r"transpose|key\s+of|what\s+key|scale\s+degree"
    r")\b",
    re.IGNORECASE,
)

ABC_COMPOSE_PATTERNS = re.compile(
    r"\b(abc\s+notation|leadsheet|staff\s+notation)\b|X:\s*\d",
    re.IGNORECASE,
)


def resolve_melody_skill_paths(query: str) -> list[str]:
    """Return ordered skill paths for the melody subagent (no duplicates)."""
    paths: list[str] = list(MELODY_SKILL_CORE)
    q = query or ""

    if REFERENCE_COMPOSE_PATTERNS.search(q) or STYLE_IN_COMPOSE_PATTERNS.search(q):
        paths.extend(MELODY_SKILL_REFERENCE)

    if HARMONY_COMPOSE_PATTERNS.search(q):
        paths.extend(MELODY_SKILL_HARMONY)

    if ABC_COMPOSE_PATTERNS.search(q):
        paths.extend(MELODY_SKILL_ABC)

    seen: set[str] = set()
    ordered: list[str] = []
    for path in paths:
        if path not in seen:
            seen.add(path)
            ordered.append(path)
    return ordered


def load_melody_skill_file(skills_root: str, relative_path: str) -> str:
    """Load one skill file under backend/agents/skills/."""
    path = os.path.join(skills_root, relative_path.replace("/", os.sep))
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except OSError as exc:
        print(f"[melody_skill_bundle] Failed to load {relative_path}: {exc}")
        return ""


def build_melody_skills_block(query: str, skills_root: str | None = None) -> str:
    """Concatenate selected skill files for injection into the melody subagent prompt."""
    if skills_root is None:
        skills_root = os.path.join(os.path.dirname(__file__), "skills")

    paths = resolve_melody_skill_paths(query)
    sections: list[str] = []
    for relative_path in paths:
        body = load_melody_skill_file(skills_root, relative_path)
        if body:
            label = os.path.basename(relative_path)
            sections.append(f"--- {label} ---\n{body}")

    if not sections:
        return ""
    return "SKILLS AND KNOWLEDGE:\n" + "\n\n".join(sections)
