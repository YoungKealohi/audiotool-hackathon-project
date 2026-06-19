"""Tests for deterministic update-project-config intent parsing."""

import pytest

from agents.project_config_intent import parse_update_project_config_args


def test_parse_tempo_only():
    assert parse_update_project_config_args("change the bpm to 140") == {"tempoBpm": 140}
    assert parse_update_project_config_args("set tempo to 90") == {"tempoBpm": 90}
    assert parse_update_project_config_args("BPM: 120") == {"tempoBpm": 120}


def test_parse_time_signature_only():
    r = parse_update_project_config_args("set time signature to 1/4")
    assert r == {
        "timeSignatureNumerator": 1,
        "timeSignatureDenominator": 4,
    }
    r2 = parse_update_project_config_args("change the signature to 3/4")
    assert r2 == {
        "timeSignatureNumerator": 3,
        "timeSignatureDenominator": 4,
    }


def test_parse_combined():
    q = "can you change the bpm to 140 and the signature to 1/4"
    r = parse_update_project_config_args(q)
    assert r == {
        "tempoBpm": 140,
        "timeSignatureNumerator": 1,
        "timeSignatureDenominator": 4,
    }


def test_parse_no_match():
    assert parse_update_project_config_args("add a heisenberg") is None
    assert parse_update_project_config_args("") is None
    assert parse_update_project_config_args("   ") is None


def test_parse_meter_alias():
    r = parse_update_project_config_args("meter to 6/8")
    assert r == {
        "timeSignatureNumerator": 6,
        "timeSignatureDenominator": 8,
    }


def test_parse_time_signature_in_phrase():
    r = parse_update_project_config_args("write a groove in 6/8 at 120 bpm")
    assert r == {
        "tempoBpm": 120,
        "timeSignatureNumerator": 6,
        "timeSignatureDenominator": 8,
    }


def test_parse_six_eight_time_wording():
    assert parse_update_project_config_args("3/4 time") == {
        "timeSignatureNumerator": 3,
        "timeSignatureDenominator": 4,
    }
