"""Tests for ElevenLabs music_generation helpers."""

import pytest

from services.music_generation import (
    MAX_MUSIC_PROMPT_LENGTH,
    clamp_music_prompt,
    format_elevenlabs_exception,
)


def test_clamp_music_prompt_short_unchanged():
    assert clamp_music_prompt("hello") == "hello"


def test_clamp_music_prompt_long_adds_suffix():
    raw = "x" * (MAX_MUSIC_PROMPT_LENGTH + 50)
    out = clamp_music_prompt(raw)
    assert len(out) == MAX_MUSIC_PROMPT_LENGTH
    assert out.endswith(" [truncated]")


def test_format_elevenlabs_exception_generic():
    assert format_elevenlabs_exception(ValueError("plain")) == "plain"


def test_format_elevenlabs_exception_sdk_api_error():
    from elevenlabs.core.api_error import ApiError

    err = ApiError(
        status_code=422,
        headers={"date": "Mon"},
        body={"detail": {"message": "invalid thing", "request_id": "rid-1"}},
    )
    s = format_elevenlabs_exception(err)
    assert "HTTP 422" in s
    assert "invalid thing" in s
    assert "request_id=rid-1" in s
    assert "Mon" not in s


def test_format_elevenlabs_exception_body_string_json():
    from elevenlabs.core.api_error import ApiError

    err = ApiError(
        status_code=400,
        headers={},
        body='{"detail": "nope"}',
    )
    s = format_elevenlabs_exception(err)
    assert "HTTP 400" in s
    assert "nope" in s
