"""Tests for melody subagent skill bundle selection."""

from agents.melody_skill_bundle import (
    MELODY_SKILL_ABC,
    MELODY_SKILL_CORE,
    MELODY_SKILL_HARMONY,
    MELODY_SKILL_REFERENCE,
    build_melody_skills_block,
    resolve_melody_skill_paths,
)


def test_core_bundle_always_present():
    paths = resolve_melody_skill_paths("write a simple bassline")
    assert list(MELODY_SKILL_CORE) == paths


def test_reference_bundle_for_theme_request():
    paths = resolve_melody_skill_paths("make it sound like the Iron Man theme")
    for skill in MELODY_SKILL_CORE:
        assert skill in paths
    for skill in MELODY_SKILL_REFERENCE:
        assert skill in paths
    assert MELODY_SKILL_HARMONY[0] not in paths


def test_reference_bundle_for_style_in_compose_request():
    paths = resolve_melody_skill_paths("make a drum beat in the style of Daft Punk")
    assert "references/style_cards.md" in paths
    assert "10_reference_styles.md" in paths


def test_harmony_bundle_for_chord_progression():
    paths = resolve_melody_skill_paths("write a chord progression in C minor")
    assert MELODY_SKILL_HARMONY[0] in paths
    assert MELODY_SKILL_REFERENCE[0] not in paths


def test_abc_bundle_for_pasted_abc():
    paths = resolve_melody_skill_paths("add this: X:1\\nK:C\\nCDEF|")
    assert MELODY_SKILL_ABC[0] in paths


def test_build_skills_block_includes_strudel_heading():
    block = build_melody_skills_block("add drums")
    assert "SKILLS AND KNOWLEDGE:" in block
    assert "--- 09_strudel.md ---" in block
    assert "--- 02_adding_sounds.md ---" in block
    assert "--- 00_music_theory.md ---" in block


def test_build_skills_block_includes_reference_for_iron_man():
    block = build_melody_skills_block("in the spirit of Black Sabbath")
    assert "--- 10_reference_styles.md ---" in block
    assert "--- style_cards.md ---" in block
