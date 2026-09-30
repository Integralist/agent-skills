"""Fetch/import Artificial Analysis data and render a single offline HTML file.

Runtime dependencies: Python 3.10+ standard library only. Token pricing is
never substituted for task costs. Use reported Intelligence Index task costs
from the paginated Free API; import exports for other benchmark task metrics.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import math
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import webbrowser
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict, cast

BASE = Path(__file__).resolve().parents[1]
API_URL = "https://artificialanalysis.ai/api/v2/language/models/free"
MAX_BYTES = 20 * 1024 * 1024
CACHE_SECONDS = 86400
CACHE_SCHEMA = 2
MAX_API_PAGES = 32
OUTPUT = Path("/tmp/llm-stats.html")
X_METRICS = ("cost", "tokens", "time", "price", "speed")
BENCHMARKS = {
    "intelligence": {
        "label": "Artificial Analysis Intelligence Index",
        "unit": "points",
    },
    "coding": {"label": "Artificial Analysis Coding Index", "unit": "points"},
    "math": {"label": "Artificial Analysis Math Index", "unit": "points"},
    "agentic": {"label": "Artificial Analysis Agentic Index", "unit": "points"},
    "deepswe": {"label": "DeepSWE", "unit": "percent"},
    "gpqa": {"label": "GPQA", "unit": "percent"},
    "mmlu_pro": {"label": "MMLU-Pro", "unit": "percent"},
    "hle": {"label": "Humanity's Last Exam", "unit": "percent"},
    "livecodebench": {"label": "LiveCodeBench", "unit": "percent"},
    "scicode": {"label": "SciCode", "unit": "percent"},
    "math_500": {"label": "MATH-500", "unit": "percent"},
    "aime": {"label": "AIME", "unit": "percent"},
}
INDEX_KEYS = {
    "artificial_analysis_intelligence_index": "intelligence",
    "artificial_analysis_coding_index": "coding",
    "artificial_analysis_math_index": "math",
    "artificial_analysis_agentic_index": "agentic",
}
logger = logging.getLogger("llm-stats")
Record = dict[str, object]


class Model(TypedDict):
    id: str
    slug: str
    name: str
    provider: str
    series: str
    effort: str
    release_date: str
    scores: dict[str, float]
    cost_per_task: dict[str, float]
    total_benchmark_cost: dict[str, float]
    output_tokens_per_task: dict[str, float]
    time_per_task: dict[str, float]
    pricing: dict[str, float]
    output_speed: float | None


class Preset(TypedDict, total=False):
    name: str
    providers: list[str]
    models: list[str]
    model_patterns: list[str]
    families_per_provider: int
    benchmark: str
    x: str


class Config(TypedDict):
    providers: list[str]
    models: list[str]
    model_patterns: list[str]
    families_per_provider: int
    benchmark: str
    x: str
    presets: list[Preset]


class DataError(ValueError):
    """Input data cannot be used safely."""


def _mapping(value: object, field: str) -> Record:
    if not isinstance(value, dict):
        raise DataError(f"{field} must be an object")
    return cast(Record, value)


def _text(value: object, field: str, *, default: str = "") -> str:
    if value is None:
        return default
    if not isinstance(value, str):
        raise DataError(f"{field} must be text")
    return value.strip()


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-")


def _number(value: object, field: str) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise DataError(f"{field} must be a finite nonnegative number")
    if isinstance(value, str):
        value = value.strip().replace("$", "").replace(",", "").removesuffix("%")
    if not isinstance(value, (str, int, float)):
        raise DataError(f"{field} must be numeric")
    try:
        number = float(value)
    except (TypeError, ValueError) as err:
        raise DataError(f"{field} must be numeric") from err
    if not math.isfinite(number) or number < 0:
        raise DataError(f"{field} must be a finite nonnegative number")
    return number


def _numbers(value: object, field: str, benchmark: str) -> dict[str, float]:
    if value is None:
        return {}
    entries = value if isinstance(value, dict) else {benchmark: value}
    result = {}
    for key, raw in entries.items():
        key = _text(key, field)
        number = _number(raw, f"{field}.{key}")
        if number is not None:
            result[key] = number
    return result


def _provider(row: Record, name: str, slug: str) -> str:
    creator = row.get("model_creator")
    if creator is not None:
        creator = _mapping(creator, "model_creator")
        value = creator.get("slug") or creator.get("name")
    else:
        value = row.get("provider")
    if value:
        return _slug(_text(value, "provider"))
    combined = f"{name} {slug}".lower()
    for prefix, provider in (
        ("claude", "anthropic"),
        ("gpt", "openai"),
        ("gemini", "google"),
        ("o1", "openai"),
        ("o3", "openai"),
        ("o4", "openai"),
    ):
        if re.search(rf"\b{prefix}", combined):
            return provider
    return "other"


def _effort(row: Record, name: str, slug: str) -> str:
    if row.get("effort"):
        return _text(row["effort"], "effort").lower()
    qualifiers = name.partition("(")[2].lower()
    if "non-reasoning" in qualifiers or "non-thinking" in qualifiers:
        return "none"
    for effort in ("max", "xhigh", "high", "medium", "low", "minimal", "none"):
        if re.search(rf"\b{effort}\b", qualifiers) or slug.endswith(f"-{effort}"):
            return effort
    return "default"


def normalize(payload: object, *, benchmark: str = "intelligence") -> list[Model]:
    """Accept API responses, native snapshots, or arrays; preserve missing vs zero."""
    if isinstance(payload, dict):
        payload = payload.get("models", payload.get("data"))
    if not isinstance(payload, list) or not payload:
        raise DataError("Expected a nonempty models array or API data array")
    models: list[Model] = []
    seen: set[str] = set()
    for index, raw in enumerate(payload, 1):
        row = _mapping(raw, f"Model {index}")
        name = _text(row.get("name"), "name")
        if not name:
            raise DataError(f"Model {index} needs a name")
        slug = _text(row.get("slug"), "slug", default=_slug(name))
        if not re.fullmatch(r"[a-zA-Z0-9._-]+", slug):
            raise DataError(f"Invalid model slug: {slug!r}")
        if slug in seen:
            raise DataError(f"duplicate model slug: {slug}")
        seen.add(slug)
        row_benchmark = _text(row.get("benchmark"), "benchmark", default=benchmark)
        scores = _numbers(row.get("scores", row.get("score")), "scores", row_benchmark)
        if "evaluations" in row:
            evaluations = _mapping(row["evaluations"], "evaluations")
            for key, raw_score in evaluations.items():
                key = INDEX_KEYS.get(key, key)
                score = _number(raw_score, f"{slug}.{key}")
                if score is not None:
                    is_percent = BENCHMARKS.get(key, {}).get("unit") == "percent"
                    scores[key] = score * 100 if is_percent else score
        for key, score in scores.items():
            if BENCHMARKS.get(key, {}).get("unit") == "percent" and score > 100:
                raise DataError(f"{slug}.{key} percentage must be at most 100")
        raw_pricing = _mapping(row.get("pricing") or {}, "pricing")
        pricing = {}
        for key, api_key in (
            ("input", "price_1m_input_tokens"),
            ("output", "price_1m_output_tokens"),
            ("blended", "price_1m_blended_3_to_1"),
        ):
            number = _number(raw_pricing.get(api_key, raw_pricing.get(key)), key)
            if number is not None:
                pricing[key] = number
        task_cost = _numbers(row.get("cost_per_task"), "cost_per_task", row_benchmark)
        total_cost = _numbers(
            row.get("total_benchmark_cost"), "total_benchmark_cost", row_benchmark
        )
        benchmark_cost = row.get("artificial_analysis_intelligence_index_cost")
        if benchmark_cost is not None:
            benchmark_cost = _mapping(benchmark_cost, "Intelligence Index cost")
            total = _number(
                benchmark_cost.get("total_cost"), "Intelligence Index total cost"
            )
            if total is not None:
                total_cost["intelligence"] = total
            per_task = benchmark_cost.get("cost_per_task")
            if per_task is not None:
                per_task = _mapping(per_task, "Intelligence Index cost per task")
                measured = _number(
                    per_task.get("total_cost"), "Intelligence Index task cost"
                )
                if measured is not None:
                    task_cost["intelligence"] = measured
        performance = _mapping(row.get("performance") or {}, "performance")
        series = _text(
            row.get("series"), "series", default=name.partition("(")[0].strip()
        )
        # Separate fallback scenarios instead of connecting different configurations.
        if not row.get("series") and re.search(r"fallback", name, re.IGNORECASE):
            suffix = re.search(
                r"(Default Fallback|No Fallback|with fallback)", name, re.IGNORECASE
            )
            if suffix:
                series = f"{series} · {suffix[0].lower()}"
        models.append(
            {
                "id": _text(row.get("id"), "id", default=slug),
                "slug": slug,
                "name": name,
                "provider": _provider(row, name, slug),
                "series": series,
                "effort": _effort(row, name, slug),
                "release_date": _text(row.get("release_date"), "release_date"),
                "scores": scores,
                "cost_per_task": task_cost,
                "total_benchmark_cost": total_cost,
                "output_tokens_per_task": _numbers(
                    row.get("output_tokens_per_task"),
                    "output_tokens_per_task",
                    row_benchmark,
                ),
                "time_per_task": _numbers(
                    row.get("time_per_task"), "time_per_task", row_benchmark
                ),
                "pricing": pricing,
                "output_speed": _number(
                    performance.get(
                        "median_output_tokens_per_second",
                        row.get(
                            "median_output_tokens_per_second", row.get("output_speed")
                        ),
                    ),
                    "output_speed",
                ),
            }
        )
    return models


def _read_json(path: Path) -> object:
    try:
        if path.stat().st_size > MAX_BYTES:
            raise DataError(f"Input exceeds {MAX_BYTES} bytes: {path}")
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError, json.JSONDecodeError) as err:
        raise DataError(f"Cannot read JSON: {path}: {err}") from err


def load_input(
    path: Path,
    *,
    benchmark: str = "intelligence",
    columns: dict[str, str] | None = None,
) -> list[Model]:
    """Read JSON or CSV; explicit CSV mappings avoid guessing ambiguous axes."""
    if path.suffix.lower() == ".json":
        return normalize(_read_json(path), benchmark=benchmark)
    if path.suffix.lower() != ".csv":
        raise DataError("Input must be a .json or .csv file")
    aliases = {
        "model": "name",
        "modelname": "name",
        "name": "name",
        "slug": "slug",
        "modelslug": "slug",
        "creator": "provider",
        "modelcreator": "provider",
        "provider": "provider",
        "series": "series",
        "effort": "effort",
        "benchmark": "benchmark",
        "score": "score",
        "costpertask": "cost_per_task",
        "avgcostpertask": "cost_per_task",
        "outputtokenspertask": "output_tokens_per_task",
        "timepertask": "time_per_task",
        "priceinput": "price_input",
        "priceoutput": "price_output",
        "priceblended": "price_blended",
        "outputspeed": "output_speed",
        "releasedate": "release_date",
    }
    try:
        if path.stat().st_size > MAX_BYTES:
            raise DataError(f"Input exceeds {MAX_BYTES} bytes: {path}")
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for column in (columns or {}).values():
                if column not in (reader.fieldnames or []):
                    raise DataError(f"Missing CSV column: {column}")
            rows: list[Record] = []
            for raw in reader:
                if None in raw:
                    raise DataError("CSV row has more cells than its header")
                row: Record = {}
                for header, value in raw.items():
                    field = aliases.get(re.sub(r"[^a-z0-9]", "", header.lower()))
                    if field:
                        row[field] = value
                for field, column in (columns or {}).items():
                    row[field] = raw[column]
                row["pricing"] = {
                    key: row.pop(f"price_{key}", None)
                    for key in ("input", "output", "blended")
                }
                rows.append(row)
        return normalize(rows, benchmark=benchmark)
    except (OSError, UnicodeError, csv.Error) as err:
        raise DataError(f"Cannot read CSV: {path}: {err}") from err


def _validate_selection(config: Record) -> None:
    for key in ("providers", "models", "model_patterns"):
        value = config.get(key, [])
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            raise DataError(f"{key} must be an array of strings")
    limit = config.get("families_per_provider", 0)
    if isinstance(limit, bool) or not isinstance(limit, int) or limit < 0:
        raise DataError("families_per_provider must be a nonnegative integer")
    if "x" in config and config["x"] not in X_METRICS:
        raise DataError(f"x must be one of {X_METRICS}")
    if "benchmark" in config and not isinstance(config["benchmark"], str):
        raise DataError("benchmark must be text")


def load_config(path: Path) -> Config:
    """Validate editable defaults; partial custom configs inherit bundled defaults."""
    default = _mapping(_read_json(BASE / "defaults.json"), "defaults")
    config = default | _mapping(_read_json(path), "config")
    unknown = set(config) - set(default)
    if unknown:
        raise DataError(f"Unknown config keys: {sorted(unknown)}")
    _validate_selection(config)
    presets = config.get("presets", [])
    if not isinstance(presets, list):
        raise DataError("presets must be an array")
    names = set()
    for preset in presets:
        preset = _mapping(preset, "preset")
        unknown = set(preset) - (set(default) - {"presets"} | {"name"})
        if unknown:
            raise DataError(f"Unknown preset keys: {sorted(unknown)}")
        name = _text(preset.get("name"), "preset name")
        if not name or name in names:
            raise DataError("Preset names must be nonempty and unique")
        names.add(name)
        _validate_selection(preset)
    return cast(Config, config)


def read_api_key(
    *, op_reference: str | None = None, op_account: str | None = None
) -> str:
    """Read a key into memory only; select 1Password accounts explicitly."""
    key = os.environ.get("ARTIFICIAL_ANALYSIS_API_KEY") or os.environ.get("AA_API_KEY")
    if not key and op_reference:
        if not op_reference.startswith("op://") or not op_account:
            raise DataError(
                "1Password requires an op:// reference and explicit --op-account"
            )
        try:
            result = subprocess.run(
                ["op", "read", "--account", op_account, op_reference],
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as err:
            raise DataError(
                "1Password read failed or timed out. Sign in to the selected account and retry."
            ) from err
        if result.returncode:
            # CLI output may contain sensitive material; report only the action needed.
            raise DataError(
                "1Password read failed. Sign in to the selected account and retry."
            )
        key = result.stdout
    if not key:
        raise DataError(
            "API key missing. Set ARTIFICIAL_ANALYSIS_API_KEY locally, "
            "use --op-reference with --op-account, import with --input, or preview with --demo."
        )
    key = key.strip()
    if (
        not key
        or not key.isascii()
        or any(ord(char) < 33 or ord(char) == 127 for char in key)
    ):
        raise DataError(
            "API key must be nonempty ASCII without spaces or control characters"
        )
    return key


def _pagination(value: object, expected_page: int) -> int:
    meta = _mapping(value, "API pagination")
    counts: dict[str, int] = {}
    for key in ("page", "page_size", "total_pages"):
        count = meta.get(key)
        if isinstance(count, bool) or not isinstance(count, int) or count <= 0:
            raise DataError(f"API pagination {key} must be a positive integer")
        counts[key] = count
    if counts["page"] != expected_page or counts["total_pages"] > MAX_API_PAGES:
        raise DataError("API pagination page number or page count is invalid")
    more = meta.get("has_more")
    if not isinstance(more, bool) or more != (counts["page"] < counts["total_pages"]):
        raise DataError("API pagination has_more is inconsistent")
    if counts["page"] > counts["total_pages"]:
        raise DataError("API pagination page exceeds total_pages")
    return counts["total_pages"]


def fetch_models(
    cache: Path,
    *,
    refresh: bool = False,
    op_reference: str | None = None,
    op_account: str | None = None,
) -> object:
    """Fetch every Free API page; reuse a compatible complete cache for 24 hours."""
    if (
        not refresh
        and cache.exists()
        and time.time() - cache.stat().st_mtime < CACHE_SECONDS
    ):
        cached = _read_json(cache)
        if (
            isinstance(cached, dict)
            and cached.get("schema_version") == CACHE_SCHEMA
            and cached.get("api_url") == API_URL
        ):
            normalize(cached)
            return cached
        logger.warning("Refreshing legacy API cache once to load benchmark costs")
    key = read_api_key(op_reference=op_reference, op_account=op_account)
    models: list[Model] = []
    version: float | None = None
    tier = ""
    total_pages = 0
    bytes_read = 0
    try:
        for page in range(1, MAX_API_PAGES + 1):
            request = urllib.request.Request(
                f"{API_URL}?page={page}",
                headers={"x-api-key": key, "User-Agent": "llm-stats/1"},
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read(MAX_BYTES - bytes_read + 1)
            bytes_read += len(body)
            if bytes_read > MAX_BYTES:
                raise DataError("API response exceeds size limit")
            payload = _mapping(json.loads(body), "API response")
            page_models = normalize(payload)
            current_version = _number(
                payload.get("intelligence_index_version"), "API index version"
            )
            if current_version is None or current_version <= 0:
                raise DataError("API response is missing an index version")
            current_tier = _text(payload.get("tier"), "API tier")
            if current_tier not in ("free", "pro", "commercial"):
                raise DataError("API response has an invalid tier")
            pages = _pagination(payload.get("pagination"), page)
            if page == 1:
                version, tier, total_pages = current_version, current_tier, pages
            elif current_version != version:
                raise DataError(
                    "API index version changed between pages; retry the refresh"
                )
            elif pages != total_pages or current_tier != tier:
                raise DataError("API pagination or tier changed between pages")
            models.extend(page_models)
            if page == total_pages:
                break
        # Validate uniqueness across pages before replacing a complete cache.
        models = normalize(models)
    except urllib.error.HTTPError as err:
        advice = {
            401: "Check your API key.",
            403: "Check API access permissions.",
            429: "Rate limit reached; use the cache and try later.",
        }.get(err.code, "Try again later or import an export.")
        raise DataError(f"API HTTP {err.code}. {advice}") from err
    except (urllib.error.URLError, TimeoutError, OSError) as err:
        raise DataError(
            "API request failed; use a cached response or --input."
        ) from err
    except (UnicodeError, json.JSONDecodeError) as err:
        raise DataError("API returned invalid JSON") from err
    result = {
        "schema_version": CACHE_SCHEMA,
        "api_url": API_URL,
        "tier": tier,
        "intelligence_index_version": version,
        "page_count": total_pages,
        "models": models,
    }
    cache.parent.mkdir(parents=True, exist_ok=True)
    # Replace only after all pages validate; never cache headers or credentials.
    temporary: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=cache.parent, delete=False
        ) as handle:
            temporary = Path(handle.name)
            json.dump(result, handle, allow_nan=False)
        temporary.replace(cache)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return result


def demo_models() -> list[Model]:
    """Invented, conspicuously labeled values for exploring the UI, not benchmarks."""
    rows = []
    families = [
        ("anthropic", "Claude Opus", [58, 68, 73], [1.4, 5.7, 10.8]),
        ("anthropic", "Claude Sonnet", [45, 57, 63], [0.5, 2.9, 6.8]),
        ("openai", "GPT", [52, 69, 76], [0.9, 3.6, 8.2]),
        ("google", "Gemini Pro", [49, 65, 72], [0.3, 2.1, 4.5]),
        ("other", "Other Model", [40, 60, 67], [0.1, 1.3, 3.3]),
    ]
    for provider, family, scores, costs in families:
        for index, effort in enumerate(("low", "high", "max")):
            cost = costs[index]
            rows.append(
                {
                    "slug": f"demo-{_slug(family)}-{effort}",
                    "name": f"{family} [DEMO] ({effort.title()} Effort)",
                    "provider": provider,
                    "series": f"{family} [DEMO]",
                    "effort": effort,
                    "scores": {
                        "deepswe": scores[index],
                        "intelligence": scores[index] * 0.8,
                    },
                    "cost_per_task": {"deepswe": cost, "intelligence": cost * 0.7},
                    "output_tokens_per_task": {
                        "deepswe": 12000 * (index + 1),
                        "intelligence": 8000 * (index + 1),
                    },
                    "time_per_task": {
                        "deepswe": 140 * (index + 1),
                        "intelligence": 80 * (index + 1),
                    },
                    "pricing": {
                        "input": 2 + cost / 2,
                        "output": 8 + cost * 2,
                        "blended": 3.5 + cost,
                    },
                    "output_speed": 60 + scores[index],
                }
            )
    return normalize(rows)


def render(
    models: list[Model],
    config: Config,
    *,
    source: str,
    demo: bool = False,
    index_version: float | None = None,
) -> str:
    """Inline data, CSS, and JavaScript; safely encode even hostile model names."""
    models = normalize(models)
    keys = sorted({key for model in models for key in model["scores"]})
    benchmarks = {
        key: BENCHMARKS.get(key, {"label": key, "unit": "points"}) for key in keys
    }
    if index_version is not None and "intelligence" in benchmarks:
        benchmarks["intelligence"] = {
            **benchmarks["intelligence"],
            "label": f"Artificial Analysis Intelligence Index v{index_version:g}",
        }
    payload = {
        "intelligence_index_version": index_version,
        "models": models,
        "config": config,
        "benchmarks": benchmarks,
        "source": source,
        "demo": demo,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    encoded = json.dumps(
        payload, ensure_ascii=True, separators=(",", ":"), allow_nan=False
    )
    encoded = (
        encoded.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    )
    template = (BASE / "assets/template.html").read_text(encoding="utf-8")
    replacements = {
        "/*__STYLE__*/": (BASE / "assets/style.css").read_text(encoding="utf-8"),
        "/*__APP__*/": (BASE / "assets/app.js").read_text(encoding="utf-8"),
        "/*__DATA__*/": encoded,
    }
    for placeholder, replacement in replacements.items():
        if template.count(placeholder) != 1:
            raise DataError(f"HTML template needs exactly one {placeholder}")
        template = template.replace(placeholder, replacement)
    return template


def generate(
    models: list[Model],
    config: Config,
    *,
    source: str,
    demo: bool = False,
    index_version: float | None = None,
) -> Path:
    """Atomically replace the fixed report; preserve the old file on failure."""
    content = render(
        models, config, source=source, demo=demo, index_version=index_version
    )
    temporary: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            prefix=".llm-stats-",
            suffix=".html",
            dir=OUTPUT.parent,
            delete=False,
        ) as handle:
            temporary = Path(handle.name)
            handle.write(content)
        # Replace the directory entry, not a symlink target; readers see a complete file.
        temporary.replace(OUTPUT)
        return OUTPUT
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    """CLI boundary: stdout is the resulting path; diagnostics go to stderr."""
    parser = argparse.ArgumentParser(description=__doc__)
    sources = parser.add_mutually_exclusive_group()
    sources.add_argument(
        "--demo", action="store_true", help="Use labeled synthetic data"
    )
    sources.add_argument("--input", type=Path, help="Import a CSV/JSON export")
    parser.add_argument("--config", type=Path, default=BASE / "defaults.json")
    parser.add_argument(
        "--cache", type=Path, default=Path.home() / ".cache/llm-stats/models.json"
    )
    parser.add_argument(
        "--refresh", action="store_true", help="Bypass the 24-hour API cache"
    )
    parser.add_argument("--no-open", action="store_true")
    parser.add_argument(
        "--op-reference", help="1Password secret reference; read only on cache misses"
    )
    parser.add_argument(
        "--op-account", help="Explicit 1Password account for --op-reference"
    )
    parser.add_argument("--models", help="Comma-separated default model slugs")
    parser.add_argument(
        "--benchmark", help="Score key; CSV scalar scores use this benchmark"
    )
    parser.add_argument("--x", choices=X_METRICS)
    for field in ("score", "cost", "tokens", "time"):
        parser.add_argument(
            f"--{field}-column", help=f"Exact CSV {field} column heading"
        )
    args = parser.parse_args(argv)
    try:
        config = load_config(args.config)
        if args.benchmark is not None:
            config["benchmark"] = args.benchmark
        if args.x is not None:
            config["x"] = args.x
        if args.models is not None:
            config["models"] = [
                slug.strip() for slug in args.models.split(",") if slug.strip()
            ]
        demo = args.demo
        index_version: float | None = None
        if args.demo:
            models = demo_models()
            source = "Synthetic demo — invented values, not Artificial Analysis results"
        elif args.input:
            fields = {
                "score": "score",
                "cost": "cost_per_task",
                "tokens": "output_tokens_per_task",
                "time": "time_per_task",
            }
            columns = {
                target: getattr(args, f"{field}_column")
                for field, target in fields.items()
                if getattr(args, f"{field}_column")
            }
            models = load_input(
                args.input, benchmark=config["benchmark"], columns=columns
            )
            source = f"Imported export: {args.input.name}"
            if args.input.suffix.lower() == ".json":
                imported = _read_json(args.input)
                if isinstance(imported, dict):
                    demo = imported.get("demo") is True
                    index_version = _number(
                        imported.get("intelligence_index_version"), "index version"
                    )
                    original = imported.get("source")
                    if isinstance(original, str):
                        source = f"Imported snapshot · {original}"
        else:
            api_data = _mapping(
                fetch_models(
                    args.cache,
                    refresh=args.refresh,
                    op_reference=args.op_reference,
                    op_account=args.op_account,
                ),
                "API data",
            )
            models = normalize(api_data)
            index_version = _number(
                api_data.get("intelligence_index_version"), "index version"
            )
            as_of = datetime.fromtimestamp(
                args.cache.stat().st_mtime, timezone.utc
            ).isoformat()
            source = f"Artificial Analysis Free API · fetched {as_of}"
        demo = demo or all(
            model["slug"].startswith("demo-") and "[DEMO]" in model["name"]
            for model in models
        )
        path = generate(
            models, config, source=source, demo=demo, index_version=index_version
        )
    except (DataError, OSError) as err:
        logger.error("%s", err)
        return 1
    print(path)
    if demo:
        logger.warning("DEMO: all chart values are synthetic, not benchmark results")
    if not args.no_open:
        try:
            if sys.platform == "darwin":
                opened = (
                    subprocess.run(
                        ["/usr/bin/open", str(path)], check=False, capture_output=True
                    ).returncode
                    == 0
                )
            else:
                opened = webbrowser.open(path.as_uri())
        except (OSError, webbrowser.Error):
            opened = False
        if not opened:
            logger.warning("Browser did not open; open the printed HTML path manually")
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING, format="llm-stats: %(message)s")
    raise SystemExit(main())
