#!/usr/bin/env python3
"""Render AI model usage from local coding-CLI logs as a single HTML page.

Each loader reads one harness's own log files. Token fields are normalised so
that `input` is uncached input and `output` includes reasoning/thinking tokens:

| Harness     | Source                                         | Effort field                    | Cost logged |
| ----------- | ---------------------------------------------- | ------------------------------- | ----------- |
| Claude Code | ~/.claude/projects/**/*.jsonl                  | `effort` on assistant records   | no          |
| Codex       | ~/.codex/sessions/**/*.jsonl                   | `turn_context.payload.effort`   | no          |
| pi          | ~/.pi/agent/sessions/**/*.jsonl                | `thinking_level_change` events  | yes         |
| OpenCode    | ~/.local/share/opencode/opencode.db (message)  | `variant` in message JSON       | yes         |
| Gemini CLI  | ~/.gemini/tmp/*/chats/session-*.json[l]        | not recorded                    | no          |
| Copilot CLI | ~/.copilot/session-store.db                    | `assistant_usage_events.reasoning_effort` | no |

Unlogged costs are estimated from LiteLLM's public price list, cached for a day.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.request
from collections.abc import Callable, Iterator, Mapping
from contextlib import closing
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

logger = logging.getLogger("model-stats")

PRICES_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
PRICES_MAX_AGE = timedelta(days=1)
PRICES_MAX_BYTES = 20 * 1024 * 1024  # the list is ~1 MB; refuse runaway responses
PERIODS = ("day", "week", "month", "all")
UNKNOWN = "unknown"
TEMPLATE = Path(__file__).with_name("template.html")
PLACEHOLDER = "/*__REPORT__*/null"
COLUMNS = (
    "hour",
    "harness",
    "provider",
    "model",
    "effort",
    "project",
    "session",
    "basis",
    "requests",
    "input",
    "output",
    "cacheRead",
    "cacheWrite",
    "cost",
)

Prices = Mapping[str, Mapping[str, object]]


@dataclass(frozen=True, slots=True)
class Usage:
    """One model request, with token fields normalised across harnesses."""

    harness: str
    session: str
    project: str
    model: str
    effort: str
    at: datetime
    input: int
    output: int
    cache_read: int
    cache_write: int
    cache_write_1h: int = 0
    cost: float | None = None

    @property
    def tokens(self) -> int:
        return self.input + self.output + self.cache_read + self.cache_write


# --- shared parsing helpers -------------------------------------------------


def _int(value: object) -> int:
    return int(value) if isinstance(value, (int, float)) else 0


def _effort(value: object) -> str:
    return value.strip().lower() if isinstance(value, str) and value.strip() else UNKNOWN


def _project(cwd: object) -> str:
    if not isinstance(cwd, str) or not cwd:
        return UNKNOWN
    return Path(cwd).name or UNKNOWN


def _parse_ts(value: object) -> datetime | None:
    """Parse ISO strings, SQLite UTC datetimes, and epoch milliseconds."""
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _jsonl(path: Path) -> Iterator[dict[str, object]]:
    try:
        with path.open(encoding="utf-8", errors="replace") as handle:
            for line in handle:
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(record, dict):
                    yield record
    except OSError as err:
        logger.warning("skipping unreadable %s: %s", path, err)


def _dict(value: object) -> dict[str, object]:
    return value if isinstance(value, dict) else {}


def _query(db: Path, sql: str) -> list[tuple[object, ...]]:
    if not db.is_file():
        return []
    try:
        with closing(sqlite3.connect(f"file:{db}?mode=ro", uri=True)) as conn:
            return conn.execute(sql).fetchall()
    except sqlite3.Error as err:
        logger.warning("skipping unreadable %s: %s", db, err)
        return []


# --- model naming -------------------------------------------------------------


def normalize_model(raw: str) -> str:
    """Collapse provider prefixes, versions, and dates into one model name."""
    name = raw.strip().lower()
    name = re.sub(r"^\[[^\]]+\]\s*", "", name)
    name = name.rsplit("/", 1)[-1]
    name = re.sub(r"^(global|us|eu|apac|jp|au)\.", "", name)
    name = re.sub(r"^[a-z]+\.(?=[a-z])", "", name)  # Bedrock vendor, e.g. anthropic.
    name = re.sub(r"\[\w+\]$", "", name)  # context-window tags, e.g. [1m]
    name = re.sub(r"-v\d+(:\d+)?$", "", name)
    name = re.sub(r"@[\w.-]+$", "", name)
    name = re.sub(r"-\d{8}$", "", name)
    if name.startswith("claude-"):
        name = re.sub(r"(?<=\d)\.(?=\d)", "-", name)
    return name or UNKNOWN


def provider_of(model: str) -> str:
    if model.startswith("claude"):
        return "Anthropic"
    if re.match(r"(gpt|o\d|codex|chatgpt)", model):
        return "OpenAI"
    if model.startswith(("gemini", "gemma")):
        return "Google"
    if model.startswith("kimi"):
        return "Moonshot"
    if model.startswith("qwen"):
        return "Alibaba"
    return "Other"


# --- loaders ------------------------------------------------------------------


def load_claude(home: Path) -> list[Usage]:
    """Claude Code rewrites each streamed reply; keep one per message+request."""
    usages: list[Usage] = []
    seen: set[tuple[object, object]] = set()
    for path in sorted((home / ".claude" / "projects").rglob("*.jsonl")):
        for rec in _jsonl(path):
            if rec.get("type") != "assistant":
                continue
            msg = _dict(rec.get("message"))
            usage = _dict(msg.get("usage"))
            model = msg.get("model")
            at = _parse_ts(rec.get("timestamp"))
            if not usage or not isinstance(model, str) or model.startswith("<") or not at:
                continue
            key = (msg.get("id"), rec.get("requestId"))
            if key[0] and key in seen:
                continue
            seen.add(key)
            usages.append(
                Usage(
                    harness="Claude Code",
                    session=str(rec.get("sessionId") or path.stem),
                    project=_project(rec.get("cwd")),
                    model=normalize_model(model),
                    effort=_effort(rec.get("effort")),
                    at=at,
                    input=_int(usage.get("input_tokens")),
                    output=_int(usage.get("output_tokens")),
                    cache_read=_int(usage.get("cache_read_input_tokens")),
                    cache_write=_int(usage.get("cache_creation_input_tokens")),
                    cache_write_1h=_int(_dict(usage.get("cache_creation")).get("ephemeral_1h_input_tokens")),
                )
            )
    return usages


def load_codex(home: Path) -> list[Usage]:
    """Codex logs per-turn deltas in `last_token_usage`; input includes cache."""
    usages: list[Usage] = []
    for path in sorted((home / ".codex" / "sessions").rglob("*.jsonl")):
        session, project, model, effort = path.stem, UNKNOWN, UNKNOWN, UNKNOWN
        last_total: object = None
        for rec in _jsonl(path):
            payload = _dict(rec.get("payload"))
            kind = rec.get("type")
            if kind == "session_meta":
                session = str(payload.get("id") or session)
                project = _project(payload.get("cwd"))
            elif kind == "turn_context":
                if isinstance(payload.get("model"), str):
                    model = normalize_model(payload["model"])
                effort = _effort(payload.get("effort"))
            elif kind == "event_msg" and payload.get("type") == "token_count":
                info = _dict(payload.get("info"))
                last = _dict(info.get("last_token_usage"))
                total = info.get("total_token_usage")
                at = _parse_ts(rec.get("timestamp"))
                # Codex re-emits token_count without new usage; skip unchanged totals.
                if not last or not at or total == last_total:
                    continue
                last_total = total
                cached = _int(last.get("cached_input_tokens"))
                usages.append(
                    Usage(
                        harness="Codex",
                        session=session,
                        project=project,
                        model=model,
                        effort=effort,
                        at=at,
                        input=max(_int(last.get("input_tokens")) - cached, 0),
                        output=_int(last.get("output_tokens")),
                        cache_read=cached,
                        cache_write=0,
                    )
                )
    return usages


def load_pi(home: Path) -> list[Usage]:
    """pi logs thinking level as change events, so carry it forward."""
    usages: list[Usage] = []
    for path in sorted((home / ".pi" / "agent" / "sessions").rglob("*.jsonl")):
        session, project, effort = path.stem, UNKNOWN, UNKNOWN
        for rec in _jsonl(path):
            kind = rec.get("type")
            if kind == "session":
                session = str(rec.get("id") or session)
                project = _project(rec.get("cwd"))
            elif kind == "thinking_level_change":
                effort = _effort(rec.get("thinkingLevel"))
            elif kind == "message":
                msg = _dict(rec.get("message"))
                usage = _dict(msg.get("usage"))
                model = msg.get("model")
                at = _parse_ts(rec.get("timestamp") or msg.get("timestamp"))
                if msg.get("role") != "assistant" or not usage or not isinstance(model, str) or not at:
                    continue
                cost = _dict(usage.get("cost")).get("total")
                usages.append(
                    Usage(
                        harness="pi",
                        session=session,
                        project=project,
                        model=normalize_model(model),
                        effort=effort,
                        at=at,
                        input=_int(usage.get("input")),
                        output=_int(usage.get("output")),
                        cache_read=_int(usage.get("cacheRead")),
                        cache_write=_int(usage.get("cacheWrite")),
                        cost=float(cost) if isinstance(cost, (int, float)) else None,
                    )
                )
    return usages


def load_opencode(home: Path) -> list[Usage]:
    """OpenCode logs reasoning separately from output, so add it back."""
    usages: list[Usage] = []
    db = home / ".local" / "share" / "opencode" / "opencode.db"
    for session, data in _query(db, "SELECT session_id, data FROM message"):
        try:
            msg = json.loads(str(data))
        except json.JSONDecodeError:
            continue
        tokens = _dict(msg.get("tokens"))
        model = msg.get("modelID")
        at = _parse_ts(_dict(msg.get("time")).get("created"))
        if msg.get("role") != "assistant" or not tokens or not isinstance(model, str) or not at:
            continue
        cache = _dict(tokens.get("cache"))
        cost = msg.get("cost")
        usages.append(
            Usage(
                harness="OpenCode",
                session=str(session),
                project=_project(_dict(msg.get("path")).get("cwd")),
                model=normalize_model(model),
                effort=_effort(msg.get("variant")),
                at=at,
                input=_int(tokens.get("input")),
                output=_int(tokens.get("output")) + _int(tokens.get("reasoning")),
                cache_read=_int(cache.get("read")),
                cache_write=_int(cache.get("write")),
                cost=float(cost) if isinstance(cost, (int, float)) else None,
            )
        )
    return usages


def _gemini_messages(path: Path) -> tuple[str, list[dict[str, object]]]:
    """Return the session id and message records from a JSON or JSONL chat."""
    if path.suffix == ".json":
        try:
            doc = _dict(json.loads(path.read_text(encoding="utf-8", errors="replace")))
        except (OSError, json.JSONDecodeError) as err:
            logger.warning("skipping unreadable %s: %s", path, err)
            return path.stem, []
        messages = doc.get("messages")
        return str(doc.get("sessionId") or path.stem), messages if isinstance(messages, list) else []
    session, messages = path.stem, []
    for rec in _jsonl(path):
        if rec.get("kind") == "main":
            session = str(rec.get("sessionId") or session)
        elif "$set" in rec:
            batch = _dict(rec["$set"]).get("messages")
            messages.extend(batch if isinstance(batch, list) else [])
        else:
            messages.append(rec)
    return session, messages


def load_gemini(home: Path) -> list[Usage]:
    """Gemini CLI writes each reply more than once; keep one per message id."""
    usages: list[Usage] = []
    seen: set[str] = set()
    for path in sorted((home / ".gemini" / "tmp").glob("*/chats/session-*.json*")):
        dirname = path.parent.parent.name
        project = UNKNOWN if re.fullmatch(r"[0-9a-f]{64}", dirname) else dirname
        session, messages = _gemini_messages(path)
        for msg in messages:
            if not isinstance(msg, dict) or msg.get("type") != "gemini":
                continue
            tokens = _dict(msg.get("tokens"))
            model = msg.get("model")
            at = _parse_ts(msg.get("timestamp"))
            msg_id = str(msg.get("id") or "")
            if not tokens or not isinstance(model, str) or not at or msg_id in seen:
                continue
            if msg_id:
                seen.add(msg_id)
            cached = _int(tokens.get("cached"))
            usages.append(
                Usage(
                    harness="Gemini CLI",
                    session=session,
                    project=project,
                    model=normalize_model(model),
                    effort=UNKNOWN,
                    at=at,
                    input=max(_int(tokens.get("input")) - cached, 0),
                    output=_int(tokens.get("output")) + _int(tokens.get("thoughts")),
                    cache_read=cached,
                    cache_write=0,
                )
            )
    return usages


def load_copilot(home: Path) -> list[Usage]:
    """Copilot's input_tokens includes both cache reads and cache writes."""
    usages: list[Usage] = []
    rows = _query(
        home / ".copilot" / "session-store.db",
        "SELECT e.session_id, e.model, e.input_tokens, e.output_tokens,"
        " e.cache_read_tokens, e.cache_write_tokens, e.reasoning_effort,"
        " e.created_at, s.cwd"
        " FROM assistant_usage_events e LEFT JOIN sessions s ON s.id = e.session_id",
    )
    for session, model, inp, out, read, write, effort, created, cwd in rows:
        at = _parse_ts(created)
        if not isinstance(model, str) or not at:
            continue
        usages.append(
            Usage(
                harness="Copilot CLI",
                session=str(session),
                project=_project(cwd),
                model=normalize_model(model),
                effort=_effort(effort),
                at=at,
                input=max(_int(inp) - _int(read) - _int(write), 0),
                output=_int(out),
                cache_read=_int(read),
                cache_write=_int(write),
            )
        )
    return usages


LOADERS: tuple[Callable[[Path], list[Usage]], ...] = (
    load_claude,
    load_codex,
    load_pi,
    load_opencode,
    load_gemini,
    load_copilot,
)


def load_all(home: Path) -> list[Usage]:
    return [usage for loader in LOADERS for usage in loader(home)]


# --- pricing ------------------------------------------------------------------


def load_prices(cache_dir: Path, *, offline: bool = False) -> dict[str, dict[str, object]]:
    """Return LiteLLM's price list, refreshing the cached copy once a day."""
    path = cache_dir / "litellm-prices.json"
    stale = not path.is_file() or time.time() - path.stat().st_mtime > PRICES_MAX_AGE.total_seconds()
    if stale and not offline:
        try:
            with urllib.request.urlopen(PRICES_URL, timeout=15) as resp:
                body = resp.read(PRICES_MAX_BYTES + 1)
            if len(body) > PRICES_MAX_BYTES:
                raise ValueError(f"price list exceeds {PRICES_MAX_BYTES} bytes")
            if not isinstance(json.loads(body), dict):
                raise ValueError("price list is not a JSON object")
            cache_dir.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(".tmp")
            tmp.write_bytes(body)
            tmp.replace(path)
        except (OSError, ValueError) as err:
            logger.warning("price list refresh failed, using cached copy if any: %s", err)
    try:
        prices = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return prices if isinstance(prices, dict) else {}


def build_price_index(prices: Prices) -> dict[str, Mapping[str, object]]:
    """Map bare model names to entries, preferring the shortest (least-prefixed) key."""
    index: dict[str, Mapping[str, object]] = {}
    for key in sorted(prices, key=len):
        entry = prices[key]
        if isinstance(entry, Mapping) and isinstance(entry.get("input_cost_per_token"), (int, float)):
            index.setdefault(normalize_model(key), entry)
    return index


def cost_of(usage: Usage, index: Mapping[str, Mapping[str, object]]) -> tuple[float, str]:
    """Return (USD, basis) where basis is logged, list, or unpriced."""
    if usage.cost is not None:
        return usage.cost, "logged"
    entry = index.get(usage.model)
    if entry is None:
        return 0.0, "unpriced"

    def rate(key: str, default: float) -> float:
        value = entry.get(key)
        return float(value) if isinstance(value, (int, float)) else default

    inp = rate("input_cost_per_token", 0.0)
    write = rate("cache_creation_input_token_cost", inp)
    cost = (
        usage.input * inp
        + usage.output * rate("output_cost_per_token", 0.0)
        + usage.cache_read * rate("cache_read_input_token_cost", inp)
        + (usage.cache_write - usage.cache_write_1h) * write
        + usage.cache_write_1h * rate("cache_creation_input_token_cost_above_1hr", write)
    )
    return cost, "list"


# --- report -------------------------------------------------------------------


def period_start(period: str, now: datetime) -> datetime | None:
    """Return the local midnight a period starts at, or None for all time."""
    if period not in PERIODS:
        raise ValueError(f"period must be one of {', '.join(PERIODS)}, got {period!r}")
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    days = {"day": 0, "week": 6, "month": 29}.get(period)
    return None if days is None else midnight - timedelta(days=days)


def build_report(
    usages: list[Usage],
    index: Mapping[str, Mapping[str, object]],
    period: str,
    now: datetime,
) -> dict[str, object]:
    """Aggregate usages into hourly rows per harness, model, effort, and session."""
    start = period_start(period, now)
    rows: dict[tuple[str, ...], list[float]] = {}
    for usage in usages:
        local = usage.at.astimezone(now.tzinfo)
        if (start and local < start) or usage.tokens == 0:
            continue
        cost, basis = cost_of(usage, index)
        key = (
            local.strftime("%Y-%m-%dT%H"),
            usage.harness,
            provider_of(usage.model),
            usage.model,
            usage.effort,
            usage.project,
            usage.session,
            basis,
        )
        acc = rows.setdefault(key, [0, 0, 0, 0, 0, 0.0])
        for i, value in enumerate((1, usage.input, usage.output, usage.cache_read, usage.cache_write, cost)):
            acc[i] += value
    return {
        "generated": now.isoformat(timespec="seconds"),
        "period": period,
        "since": start.date().isoformat() if start else None,
        "columns": COLUMNS,
        "rows": [[*key, *acc[:5], round(acc[5], 6)] for key, acc in sorted(rows.items())],
    }


def render_html(report: Mapping[str, object], template: str) -> str:
    if PLACEHOLDER not in template:
        raise ValueError(f"template is missing the {PLACEHOLDER} placeholder")
    payload = json.dumps(report, separators=(",", ":")).replace("</", "<\\/")
    return template.replace(PLACEHOLDER, payload)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("period", nargs="?", default="all", choices=PERIODS)
    parser.add_argument("--home", type=Path, default=Path.home(), help="home directory to read logs from")
    parser.add_argument("--offline", action="store_true", help="use the cached price list only")
    parser.add_argument("--no-open", action="store_true", help="write the page without opening it")
    args = parser.parse_args(argv)
    logging.basicConfig(format="model-stats: %(message)s", level=logging.INFO)

    now = datetime.now().astimezone()
    prices = load_prices(args.home / ".cache" / "model-stats", offline=args.offline)
    report = build_report(load_all(args.home), build_price_index(prices), args.period, now)
    if not report["rows"]:
        logger.warning("no usage found for period %r", args.period)

    fd, name = tempfile.mkstemp(prefix="model-stats-", suffix=".html", dir="/tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        handle.write(render_html(report, TEMPLATE.read_text(encoding="utf-8")))
    print(name)
    if not args.no_open:
        opener = "open" if sys.platform == "darwin" else "xdg-open"
        subprocess.run([opener, name], check=False)  # noqa: S603 # fixed opener, own temp file
    return 0


if __name__ == "__main__":
    sys.exit(main())
