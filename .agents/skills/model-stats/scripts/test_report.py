"""Tests for report.py. Run with: uvx pytest <skill-dir>/scripts"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

import pytest

import report
from report import Usage

UTC = timezone.utc
NOW = datetime(2026, 9, 24, 15, 30, tzinfo=UTC)


def write_jsonl(path: Path, records: list[object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [r if isinstance(r, str) else json.dumps(r) for r in records]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def usage(**overrides: object) -> Usage:
    fields: dict[str, object] = {
        "harness": "pi",
        "session": "s1",
        "project": "proj",
        "model": "claude-opus-5-5",
        "effort": "high",
        "at": NOW,
        "input": 100,
        "output": 10,
        "cache_read": 1000,
        "cache_write": 50,
    }
    fields.update(overrides)
    return Usage(**fields)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("global.anthropic.claude-haiku-4-5-20251001-v1:0", "claude-haiku-4-5"),
        ("us.anthropic.claude-opus-4-6-v1", "claude-opus-4-6"),
        ("claude-opus-4.6", "claude-opus-4-6"),
        ("claude-opus-4-6-v1[1m]", "claude-opus-4-6"),
        ("[pi] gpt-5.6-luna", "gpt-5.6-luna"),
        ("openai.gpt-5.5", "gpt-5.5"),
        ("moonshotai.kimi-k2.5", "kimi-k2.5"),
        ("openrouter/google/gemini-3-pro-preview", "gemini-3-pro-preview"),
        ("gemini-3.1-pro-preview", "gemini-3.1-pro-preview"),
        ("  ", "unknown"),
    ],
)
def test_normalize_model(raw: str, expected: str) -> None:
    assert report.normalize_model(raw) == expected


@pytest.mark.parametrize(
    ("model", "provider"),
    [
        ("claude-sonnet-5", "Anthropic"),
        ("gpt-6-astra", "OpenAI"),
        ("o3", "OpenAI"),
        ("gemini-3.8-flash", "Google"),
        ("gemma-4-26b-a4b", "Google"),
        ("kimi-k2.7-code", "Moonshot"),
        ("qwen3.5-9b", "Alibaba"),
        ("mystery-1", "Other"),
    ],
)
def test_provider_of(model: str, provider: str) -> None:
    assert report.provider_of(model) == provider


def test_load_claude_dedupes_streamed_replies_and_keeps_1h_cache(tmp_path: Path) -> None:
    reply = {
        "type": "assistant",
        "timestamp": "2026-09-24T09:00:00Z",
        "sessionId": "sess",
        "cwd": "/work/alpha",
        "effort": "xhigh",
        "requestId": "req1",
        "message": {
            "id": "msg1",
            "model": "claude-opus-5-5",
            "usage": {
                "input_tokens": 2,
                "output_tokens": 40,
                "cache_read_input_tokens": 500,
                "cache_creation_input_tokens": 80,
                "cache_creation": {"ephemeral_1h_input_tokens": 60},
            },
        },
    }
    synthetic = {**reply, "requestId": "req2", "message": {**reply["message"], "id": "m2", "model": "<synthetic>"}}
    write_jsonl(tmp_path / ".claude/projects/p/sess.jsonl", [reply, reply, "not json", synthetic, {"type": "user"}])

    [got] = report.load_claude(tmp_path)

    assert (got.harness, got.session, got.project, got.effort) == ("Claude Code", "sess", "alpha", "xhigh")
    assert (got.input, got.output, got.cache_read, got.cache_write, got.cache_write_1h) == (2, 40, 500, 80, 60)
    assert got.cost is None


def test_load_codex_uses_turn_deltas_and_skips_repeated_totals(tmp_path: Path) -> None:
    def tokens(ts: str, total: int, inp: int, cached: int) -> dict[str, object]:
        return {
            "type": "event_msg",
            "timestamp": ts,
            "payload": {
                "type": "token_count",
                "info": {
                    "total_token_usage": {"total_tokens": total},
                    "last_token_usage": {"input_tokens": inp, "cached_input_tokens": cached, "output_tokens": 7},
                },
            },
        }

    write_jsonl(
        tmp_path / ".codex/sessions/2026/09/24/rollout-x.jsonl",
        [
            {"type": "session_meta", "payload": {"id": "cx", "cwd": "/work/beta"}},
            {"type": "turn_context", "payload": {"model": "gpt-5.5", "effort": "medium"}},
            tokens("2026-09-24T10:00:00Z", 100, 90, 60),
            tokens("2026-09-24T10:00:01Z", 100, 90, 60),
            {"type": "turn_context", "payload": {"model": "gpt-5.5", "effort": "high"}},
            tokens("2026-09-24T10:01:00Z", 200, 95, 90),
        ],
    )

    first, second = report.load_codex(tmp_path)

    assert (first.session, first.project, first.effort) == ("cx", "beta", "medium")
    assert (first.input, first.cache_read, first.output) == (30, 60, 7)
    assert (second.effort, second.input) == ("high", 5)


def test_load_pi_carries_thinking_level_forward_and_keeps_logged_cost(tmp_path: Path) -> None:
    def reply(ts: str, role: str = "assistant") -> dict[str, object]:
        return {
            "type": "message",
            "timestamp": ts,
            "message": {
                "role": role,
                "model": "gpt-6-luna",
                "usage": {"input": 3, "output": 125, "cacheRead": 10, "cacheWrite": 11, "cost": {"total": 0.25}},
            },
        }

    write_jsonl(
        tmp_path / ".pi/agent/sessions/--work--/2026_x.jsonl",
        [
            {"type": "session", "id": "pi1", "cwd": "/work/gamma"},
            reply("2026-09-24T09:00:00Z"),
            {"type": "thinking_level_change", "thinkingLevel": "Max"},
            reply("2026-09-24T09:05:00Z"),
            reply("2026-09-24T09:06:00Z", role="user"),
        ],
    )

    first, second = report.load_pi(tmp_path)

    assert (first.effort, second.effort) == ("unknown", "max")
    assert (second.session, second.project, second.cost) == ("pi1", "gamma", 0.25)
    assert (second.input, second.output, second.cache_read, second.cache_write) == (3, 125, 10, 11)


def make_db(path: Path, script: str, rows: list[tuple[object, ...]], insert: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(path)) as conn:
        conn.executescript(script)
        conn.executemany(insert, rows)
        conn.commit()


def test_load_opencode_adds_reasoning_to_output(tmp_path: Path) -> None:
    msg = {
        "role": "assistant",
        "modelID": "gpt-5.5",
        "variant": "high",
        "cost": 0.024,
        "path": {"cwd": "/work/delta"},
        "time": {"created": 1790242285046},
        "tokens": {"input": 2084, "output": 183, "reasoning": 74, "cache": {"read": 11776, "write": 0}},
    }
    make_db(
        tmp_path / ".local/share/opencode/opencode.db",
        "CREATE TABLE message (id TEXT, session_id TEXT, data TEXT);",
        [("1", "oc1", json.dumps(msg)), ("2", "oc1", json.dumps({"role": "user"})), ("3", "oc1", "{bad")],
        "INSERT INTO message VALUES (?, ?, ?)",
    )

    [got] = report.load_opencode(tmp_path)

    assert (got.session, got.project, got.effort, got.cost) == ("oc1", "delta", "high", 0.024)
    assert (got.input, got.output, got.cache_read) == (2084, 257, 11776)


def test_load_gemini_reads_both_formats_and_dedupes_by_id(tmp_path: Path) -> None:
    turn = {
        "id": "g1",
        "type": "gemini",
        "timestamp": "2026-09-24T08:00:00Z",
        "model": "gemini-3.8-flash",
        "tokens": {"input": 12000, "output": 63, "cached": 2000, "thoughts": 37},
    }
    chats = tmp_path / ".gemini/tmp"
    (chats / "epsilon/chats").mkdir(parents=True)
    (chats / "epsilon/chats/session-a.json").write_text(
        json.dumps({"sessionId": "gs1", "messages": [turn, {"type": "user", "id": "u"}]}), encoding="utf-8"
    )
    write_jsonl(
        chats / f"{'a' * 64}/chats/session-b.jsonl",
        [
            {"kind": "main", "sessionId": "gs2"},
            {"$set": {"messages": [{**turn, "id": "g2"}]}},
            {**turn, "id": "g2"},
            {**turn, "id": "g2"},
        ],
    )

    got = sorted(report.load_gemini(tmp_path), key=lambda u: u.session)

    assert [(u.session, u.project) for u in got] == [("gs1", "epsilon"), ("gs2", "unknown")]
    assert (got[0].input, got[0].output, got[0].cache_read, got[0].effort) == (10000, 100, 2000, "unknown")


def test_load_copilot_strips_cache_from_input(tmp_path: Path) -> None:
    make_db(
        tmp_path / ".copilot/session-store.db",
        "CREATE TABLE sessions (id TEXT, cwd TEXT);"
        "INSERT INTO sessions VALUES ('cp1', '/work/zeta');"
        "CREATE TABLE assistant_usage_events (session_id TEXT, model TEXT, input_tokens INT,"
        " output_tokens INT, cache_read_tokens INT, cache_write_tokens INT, reasoning_effort TEXT,"
        " created_at TEXT);",
        [("cp1", "claude-opus-4.6", 30750, 171, 30461, 286, "high", "2026-07-08T09:01:15.901Z")],
        "INSERT INTO assistant_usage_events VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )

    [got] = report.load_copilot(tmp_path)

    assert (got.model, got.project, got.effort) == ("claude-opus-4-6", "zeta", "high")
    assert (got.input, got.cache_read, got.cache_write, got.output) == (3, 30461, 286, 171)


def test_load_all_is_empty_without_logs(tmp_path: Path) -> None:
    assert report.load_all(tmp_path) == []


def test_load_prices_offline_reads_cache_without_fetching(tmp_path: Path) -> None:
    (tmp_path / "litellm-prices.json").write_text('{"m": {"input_cost_per_token": 1}}', encoding="utf-8")
    old = (NOW - timedelta(days=3)).timestamp()
    os.utime(tmp_path / "litellm-prices.json", (old, old))

    with mock.patch("urllib.request.urlopen") as urlopen:
        assert report.load_prices(tmp_path, offline=True) == {"m": {"input_cost_per_token": 1}}
    urlopen.assert_not_called()


def test_load_prices_falls_back_to_cache_when_fetch_fails(tmp_path: Path) -> None:
    (tmp_path / "litellm-prices.json").write_text('{"m": {}}', encoding="utf-8")
    old = (NOW - timedelta(days=3)).timestamp()
    os.utime(tmp_path / "litellm-prices.json", (old, old))

    with mock.patch("urllib.request.urlopen", side_effect=OSError("offline")):
        assert report.load_prices(tmp_path) == {"m": {}}


def test_load_prices_refreshes_stale_cache(tmp_path: Path) -> None:
    response = mock.MagicMock()
    response.__enter__.return_value.read.return_value = b'{"fresh": {}}'
    with mock.patch("urllib.request.urlopen", return_value=response):
        assert report.load_prices(tmp_path / "new") == {"fresh": {}}
    assert (tmp_path / "new/litellm-prices.json").is_file()


def test_load_prices_rejects_oversized_download(tmp_path: Path) -> None:
    response = mock.MagicMock()
    response.__enter__.return_value.read.side_effect = lambda n=-1: b'{"big": "' + b"x" * 100 + b'"}'
    with mock.patch("urllib.request.urlopen", return_value=response), mock.patch.object(report, "PRICES_MAX_BYTES", 50):
        assert report.load_prices(tmp_path) == {}
    assert not (tmp_path / "litellm-prices.json").exists()


def test_load_prices_is_empty_without_cache_or_network(tmp_path: Path) -> None:
    assert report.load_prices(tmp_path, offline=True) == {}


def test_build_price_index_prefers_unprefixed_key_and_skips_unpriced() -> None:
    index = report.build_price_index(
        {
            "azure/gpt-5.5": {"input_cost_per_token": 9},
            "gpt-5.5": {"input_cost_per_token": 1},
            "sample_spec": {"note": "no price"},
        }
    )
    assert index == {"gpt-5.5": {"input_cost_per_token": 1}}


def test_cost_of_prefers_logged_cost() -> None:
    assert report.cost_of(usage(cost=1.5), {}) == (1.5, "logged")


def test_cost_of_marks_missing_models_unpriced() -> None:
    assert report.cost_of(usage(), {}) == (0.0, "unpriced")


def test_cost_of_prices_each_token_class_including_1h_cache_writes() -> None:
    index = {
        "claude-opus-5-5": {
            "input_cost_per_token": 1.0,
            "output_cost_per_token": 10.0,
            "cache_read_input_token_cost": 0.1,
            "cache_creation_input_token_cost": 2.0,
            "cache_creation_input_token_cost_above_1hr": 3.0,
        }
    }
    cost, basis = report.cost_of(usage(cache_write=50, cache_write_1h=20), index)
    assert basis == "list"
    assert cost == pytest.approx(100 * 1 + 10 * 10 + 1000 * 0.1 + 30 * 2 + 20 * 3)


@pytest.mark.parametrize(
    ("period", "start"),
    [
        ("day", datetime(2026, 9, 24, tzinfo=UTC)),
        ("week", datetime(2026, 9, 18, tzinfo=UTC)),
        ("month", datetime(2026, 8, 26, tzinfo=UTC)),
        ("all", None),
    ],
)
def test_period_start(period: str, start: datetime | None) -> None:
    assert report.period_start(period, NOW) == start


def test_period_start_rejects_unknown_period() -> None:
    with pytest.raises(ValueError, match="period must be one of"):
        report.period_start("year", NOW)


def test_build_report_filters_period_and_aggregates_per_hour() -> None:
    rows = [
        usage(at=NOW, cost=1.0),
        usage(at=NOW + timedelta(minutes=10), cost=2.0),
        usage(at=NOW - timedelta(days=2), cost=4.0),
        usage(at=NOW, input=0, output=0, cache_read=0, cache_write=0, cost=8.0),
    ]

    got = report.build_report(rows, {}, "day", NOW)

    assert got["since"] == "2026-09-24"
    [row] = got["rows"]
    record = dict(zip(got["columns"], row, strict=True))
    assert record["hour"] == "2026-09-24T15"
    assert (record["provider"], record["basis"], record["requests"], record["cost"]) == ("Anthropic", "logged", 2, 3.0)
    assert record["input"] == 200


def test_render_html_embeds_report_and_escapes_script_close() -> None:
    html = report.render_html({"project": "</script>"}, f"<script>const R = {report.PLACEHOLDER};</script>")
    assert '{"project":"<\\/script>"}' in html
    assert html.count("</script>") == 1


def test_render_html_requires_placeholder() -> None:
    with pytest.raises(ValueError, match="placeholder"):
        report.render_html({}, "<html></html>")


def test_main_writes_page_to_tmp_and_prints_path(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    write_jsonl(
        tmp_path / ".pi/agent/sessions/--w--/s.jsonl",
        [
            {
                "type": "message",
                "timestamp": datetime.now(UTC).isoformat(),
                "message": {"role": "assistant", "model": "gpt-5.5", "usage": {"input": 5, "output": 5}},
            }
        ],
    )

    with mock.patch("subprocess.run") as run:
        assert report.main(["week", "--home", str(tmp_path), "--offline", "--no-open"]) == 0
    run.assert_not_called()

    page = Path(capsys.readouterr().out.strip())
    try:
        assert page.parent == Path("/tmp")  # noqa: S108 # the documented output dir
        assert page.name.startswith("model-stats-") and page.suffix == ".html"
        assert '"period":"week"' in page.read_text(encoding="utf-8")
    finally:
        page.unlink()


def test_main_opens_the_page(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    with mock.patch("subprocess.run") as run:
        report.main(["day", "--home", str(tmp_path), "--offline"])
    page = capsys.readouterr().out.strip()
    try:
        assert run.call_args.args[0][1] == page
    finally:
        Path(page).unlink()
