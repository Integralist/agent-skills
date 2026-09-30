import io
import json
import subprocess
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError

import pytest
from report import (
    API_URL,
    DataError,
    demo_models,
    fetch_models,
    generate,
    load_config,
    load_input,
    main,
    normalize,
    read_api_key,
    render,
)

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture
def api_record():
    return {
        "id": "stable-id",
        "slug": "claude-test-high",
        "name": "Claude Test (Adaptive Reasoning, High Effort)",
        "model_creator": {"slug": "anthropic", "name": "Anthropic"},
        "evaluations": {
            "artificial_analysis_intelligence_index": 61.5,
            "gpqa": 0.81,
            "unpublished": None,
        },
        "pricing": {
            "price_1m_input_tokens": 5,
            "price_1m_output_tokens": 25,
            "price_1m_blended_3_to_1": 10,
        },
        "median_output_tokens_per_second": 100,
    }


@pytest.fixture
def api_page(api_record):
    return {
        "tier": "free",
        "intelligence_index_version": 4.3,
        "pagination": {
            "page": 1,
            "page_size": 200,
            "total_pages": 1,
            "has_more": False,
        },
        "data": [api_record],
    }


@pytest.fixture
def cache_payload(api_record):
    return {
        "schema_version": 2,
        "api_url": "https://artificialanalysis.ai/api/v2/language/models/free",
        "tier": "free",
        "intelligence_index_version": 4.3,
        "page_count": 1,
        "models": normalize([api_record]),
    }


@pytest.fixture
def free_record():
    return {
        "id": "free-id",
        "slug": "gpt-6-1-sol-xhigh",
        "name": "GPT-6.1 Sol (xhigh)",
        "release_date": "2026-09-20",
        "model_creator": {"id": "creator-id", "name": "OpenAI"},
        "evaluations": {
            "artificial_analysis_intelligence_index": 51,
            "artificial_analysis_coding_index": None,
            "artificial_analysis_agentic_index": 45,
        },
        "artificial_analysis_intelligence_index_cost": {
            "total_cost": 662.28,
            "cost_per_task": {"total_cost": 0.3929},
        },
        "pricing": {
            "price_1m_input_tokens": 2,
            "price_1m_output_tokens": 10,
            "price_1m_cache_hit_tokens": 0.2,
            "price_1m_cache_write_tokens": None,
        },
        "performance": {"median_output_tokens_per_second": 105.4},
    }


def test_official_api_units_and_no_invented_task_cost(api_record):
    model = normalize({"data": [api_record]})[0]
    assert model["id"] == "stable-id"
    assert model["provider"] == "anthropic"
    assert model["series"] == "Claude Test"
    assert model["effort"] == "high"
    assert model["scores"] == {"intelligence": 61.5, "gpqa": 81}
    assert model["pricing"]["blended"] == 10
    assert model["cost_per_task"] == {}
    assert model["output_speed"] == 100


@pytest.mark.parametrize(
    ("name", "slug", "effort"),
    [
        ("GPT Test (xhigh)", "gpt-test", "xhigh"),
        ("Claude Test (Max Effort)", "claude-test", "max"),
        ("Gemini Test", "gemini-test-high", "high"),
        ("GPT Test (Non-reasoning)", "gpt-test", "none"),
        ("Gemini Test", "gemini-test", "default"),
    ],
)
def test_effort_detection(name, slug, effort):
    assert normalize([{"name": name, "slug": slug, "score": 20}])[0]["effort"] == effort


def test_native_schema_preserves_zero_and_explicit_group():
    row = {
        "slug": "gpt-test",
        "name": "GPT Test",
        "provider": "OpenAI",
        "series": "special-group",
        "effort": "low",
        "scores": {"deepswe": 0, "intelligence": 52},
        "cost_per_task": {"deepswe": 0},
        "output_tokens_per_task": {"deepswe": 0},
        "time_per_task": {"deepswe": 0},
    }
    result = normalize([row])[0]
    assert result["series"] == "special-group"
    assert result["provider"] == "openai"
    assert result["scores"]["deepswe"] == 0
    assert result["cost_per_task"]["deepswe"] == 0


def test_unknown_provider_and_custom_benchmark_not_discarded():
    model = normalize(
        [
            {
                "name": "New Vendor Model",
                "slug": "new-model",
                "provider": "New Vendor",
                "scores": {"new_bench": 1234},
            }
        ]
    )[0]
    assert model["provider"] == "new-vendor"
    assert model["scores"]["new_bench"] == 1234


@pytest.mark.parametrize("payload", [{}, {"data": {}}, [], [None], [{"name": ""}]])
def test_reject_empty_or_malformed_payload(payload):
    with pytest.raises(DataError):
        normalize(payload)


@pytest.mark.parametrize("value", [-1, float("nan"), float("inf"), True, "oops"])
def test_reject_invalid_values(value):
    with pytest.raises(DataError):
        normalize([{"slug": "m", "name": "M", "scores": {"intelligence": value}}])


def test_reject_duplicate_slugs():
    with pytest.raises(DataError, match="duplicate"):
        normalize([{"slug": "m", "name": "M"}] * 2)


def test_native_percentage_out_of_range():
    with pytest.raises(DataError, match="100"):
        normalize([{"slug": "m", "name": "M", "scores": {"deepswe": 101}}])


def test_csv_import_with_column_mapping(tmp_path):
    path = tmp_path / "export.csv"
    path.write_text(
        "Model,Slug,Creator,DeepSWE,Avg Cost per Task\n"
        '"Claude Test (High Effort)",claude-test-high,Anthropic,73%,$4.20\n'
    )
    models = load_input(
        path,
        benchmark="deepswe",
        columns={"score": "DeepSWE", "cost_per_task": "Avg Cost per Task"},
    )
    assert models[0]["scores"]["deepswe"] == 73
    assert models[0]["cost_per_task"]["deepswe"] == 4.2


def test_csv_missing_explicit_column_fails(tmp_path):
    path = tmp_path / "bad.csv"
    path.write_text("Model,Score\nM,2\n")
    with pytest.raises(DataError, match="Missing CSV column"):
        load_input(path, columns={"score": "Missing"})


def test_json_import_and_reimport_exported_snapshot(tmp_path, api_record):
    path = tmp_path / "models.json"
    path.write_text(json.dumps({"data": [api_record]}))
    models = load_input(path)
    path.write_text(json.dumps({"models": models, "demo": False}))
    assert load_input(path) == models


@pytest.mark.parametrize(("content", "suffix"), [("{bad", ".json"), ("x", ".txt")])
def test_bad_import(tmp_path, content, suffix):
    path = tmp_path / f"input{suffix}"
    path.write_text(content)
    with pytest.raises(DataError):
        load_input(path)


def test_missing_import(tmp_path):
    with pytest.raises(DataError):
        load_input(tmp_path / "missing.json")


def test_defaults_and_invalid_config(tmp_path):
    config = load_config(BASE / "defaults.json")
    assert config["providers"] == ["anthropic", "openai", "google"]
    assert config["models"] == []
    assert config["families_per_provider"] == 2
    bad = tmp_path / "config.json"
    bad.write_text('{"providers": "anthropic"}')
    with pytest.raises(DataError):
        load_config(bad)


@pytest.mark.parametrize("value", [-1, True, 1.2])
def test_invalid_family_limit(tmp_path, value):
    path = tmp_path / "config.json"
    path.write_text(json.dumps({"families_per_provider": value}))
    with pytest.raises(DataError):
        load_config(path)


def test_fetch_requires_key_and_cache_can_work_without_key(
    tmp_path, api_record, cache_payload, monkeypatch
):
    monkeypatch.delenv("ARTIFICIAL_ANALYSIS_API_KEY", raising=False)
    monkeypatch.delenv("AA_API_KEY", raising=False)
    cache = tmp_path / "cache.json"
    with pytest.raises(DataError, match="API key"):
        fetch_models(cache)
    cache.write_text(json.dumps(cache_payload))
    assert normalize(fetch_models(cache))[0]["slug"] == api_record["slug"]


def test_fetch_and_cache_key_stays_in_header(
    tmp_path, api_record, api_page, monkeypatch
):
    monkeypatch.setenv("ARTIFICIAL_ANALYSIS_API_KEY", "secret-test-key")
    cache = tmp_path / "nested/cache.json"
    response = io.BytesIO(json.dumps(api_page).encode())
    with patch("urllib.request.urlopen", return_value=response) as request:
        fetch_models(cache, refresh=True)
    assert request.call_args.args[0].get_header("X-api-key") == "secret-test-key"
    assert "secret-test-key" not in cache.read_text()
    assert normalize(json.loads(cache.read_text()))[0]["id"] == "stable-id"


@pytest.mark.parametrize("status", [401, 403, 429, 500])
def test_fetch_http_errors(tmp_path, monkeypatch, status):
    monkeypatch.setenv("AA_API_KEY", "secret")
    error = HTTPError("https://artificialanalysis.ai/", status, "error", {}, None)
    with (
        patch("urllib.request.urlopen", side_effect=error),
        pytest.raises(DataError, match=str(status)),
    ):
        fetch_models(tmp_path / "cache", refresh=True)


def test_fetch_network_error(tmp_path, monkeypatch):
    monkeypatch.setenv("AA_API_KEY", "secret")
    with (
        patch("urllib.request.urlopen", side_effect=URLError("offline")),
        pytest.raises(DataError, match="request failed"),
    ):
        fetch_models(tmp_path / "cache", refresh=True)


def test_fetch_invalid_response_not_cached(tmp_path, monkeypatch):
    monkeypatch.setenv("AA_API_KEY", "secret")
    path = tmp_path / "cache"
    with (
        patch("urllib.request.urlopen", return_value=io.BytesIO(b'{"data": []}')),
        pytest.raises(DataError),
    ):
        fetch_models(path, refresh=True)
    assert not path.exists()


def test_demo_is_explicit_and_covers_other_provider():
    models = demo_models()
    assert {m["provider"] for m in models} >= {"anthropic", "openai", "google", "other"}
    assert all("demo" in m["slug"] for m in models)
    assert all("DEMO" in m["name"] for m in models)
    assert len(models) >= 12


def test_inline_html_no_external_assets_and_safe_json(api_record):
    api_record["name"] = 'Claude </script><script>alert("x")</script>'
    api_record["api_key"] = "secret-test-key"
    content = render(
        normalize([api_record]),
        load_config(BASE / "defaults.json"),
        source="API <test>",
    )
    assert content.startswith("<!doctype html>")
    assert "<svg" in content
    assert "<style>" in content
    assert "<script src=" not in content
    assert '<link rel="stylesheet"' not in content
    assert "\\u003c/script\\u003e" in content
    assert "secret-test-key" not in content
    assert "API <test>" not in content
    assert "artificialanalysis.ai" in content


def test_fixed_output_replaces_previous_report_and_keeps_demo_label():
    config = load_config(BASE / "defaults.json")
    first = generate(demo_models(), config, source="First generation", demo=True)
    before = first.read_text()
    second = generate(demo_models(), config, source="Second generation", demo=True)
    assert first == second
    assert first.name == "llm-stats.html"
    assert before != second.read_text()
    assert "Second generation" in second.read_text()
    assert '"demo":true' in second.read_text()


def test_generation_failure_preserves_existing_report():
    config = load_config(BASE / "defaults.json")
    path = generate(demo_models(), config, source="Keep this report")
    before = path.read_text()
    with pytest.raises(DataError):
        generate([], config, source="Invalid")
    assert path.read_text() == before


def test_fixed_output_replaces_symlink_without_touching_target(tmp_path):
    import report

    target = tmp_path / "untouched.txt"
    target.write_text("Keep this file")
    report.OUTPUT.symlink_to(target)
    path = generate(demo_models(), load_config(BASE / "defaults.json"), source="Test")
    assert path == report.OUTPUT
    assert not path.is_symlink()
    assert target.read_text() == "Keep this file"


def test_free_endpoint_is_used():
    assert API_URL == "https://artificialanalysis.ai/api/v2/language/models/free"


def test_free_shape_maps_measured_cost_and_nested_performance(free_record):
    model = normalize([free_record])[0]
    assert model["scores"] == {"intelligence": 51, "agentic": 45}
    assert model["cost_per_task"] == {"intelligence": 0.3929}
    assert model.get("total_benchmark_cost") == {"intelligence": 662.28}
    assert model["provider"] == "openai"
    assert model["release_date"] == "2026-09-20"
    assert model["output_speed"] == 105.4
    assert "blended" not in model["pricing"]


@pytest.mark.parametrize("cost", [None, {"total_cost": 100, "cost_per_task": None}])
def test_free_shape_missing_task_cost_stays_absent(free_record, cost):
    free_record["artificial_analysis_intelligence_index_cost"] = cost
    model = normalize([free_record])[0]
    assert model["cost_per_task"] == {}


def test_free_shape_zero_task_cost_is_valid(free_record):
    free_record["artificial_analysis_intelligence_index_cost"]["cost_per_task"][
        "total_cost"
    ] = 0
    assert normalize([free_record])[0]["cost_per_task"] == {"intelligence": 0}


def test_fetch_all_pages_then_cache_complete_catalog(tmp_path, api_page, monkeypatch):
    import copy

    monkeypatch.setenv("AA_API_KEY", "secret")
    first = copy.deepcopy(api_page)
    first["pagination"].update(total_pages=2, has_more=True)
    second = copy.deepcopy(api_page)
    second["pagination"].update(page=2, total_pages=2)
    second["data"][0].update(slug="second-model", id="second-id")
    cache = tmp_path / "cache.json"
    with patch(
        "urllib.request.urlopen",
        side_effect=[
            io.BytesIO(json.dumps(first).encode()),
            io.BytesIO(json.dumps(second).encode()),
        ],
    ) as request:
        result = fetch_models(cache, refresh=True)
    assert request.call_count == 2
    assert [call.args[0].full_url for call in request.call_args_list] == [
        f"{API_URL}?page=1",
        f"{API_URL}?page=2",
    ]
    assert len(normalize(result)) == 2
    assert result["intelligence_index_version"] == 4.3
    assert result["page_count"] == 2
    assert json.loads(cache.read_text())["schema_version"] == 2
    with patch("urllib.request.urlopen") as request:
        assert len(normalize(fetch_models(cache))) == 2
    request.assert_not_called()


def test_legacy_cache_is_migrated_once(tmp_path, api_record, api_page, monkeypatch):
    monkeypatch.setenv("AA_API_KEY", "secret")
    cache = tmp_path / "cache.json"
    cache.write_text(json.dumps({"models": normalize([api_record])}))
    with patch(
        "urllib.request.urlopen", return_value=io.BytesIO(json.dumps(api_page).encode())
    ) as request:
        result = fetch_models(cache)
    request.assert_called_once()
    assert result["api_url"] == API_URL
    assert json.loads(cache.read_text())["schema_version"] == 2


def test_failed_later_page_preserves_previous_cache(tmp_path, api_page, monkeypatch):
    monkeypatch.setenv("AA_API_KEY", "secret")
    api_page["pagination"].update(total_pages=2, has_more=True)
    cache = tmp_path / "cache.json"
    cache.write_text("Keep previous cache")
    with (
        patch(
            "urllib.request.urlopen",
            side_effect=[
                io.BytesIO(json.dumps(api_page).encode()),
                URLError("offline"),
            ],
        ),
        pytest.raises(DataError),
    ):
        fetch_models(cache, refresh=True)
    assert cache.read_text() == "Keep previous cache"


@pytest.mark.parametrize(
    "pagination",
    [
        {},
        {"page": 1, "page_size": 200, "total_pages": 2, "has_more": False},
        {"page": 2, "page_size": 200, "total_pages": 2, "has_more": True},
        {"page": 1, "page_size": 200, "total_pages": 10000, "has_more": True},
        {"page": True, "page_size": 200, "total_pages": 1, "has_more": False},
    ],
)
def test_bad_pagination_not_cached(tmp_path, api_page, monkeypatch, pagination):
    monkeypatch.setenv("AA_API_KEY", "secret")
    api_page["pagination"] = pagination
    cache = tmp_path / "cache.json"
    with (
        patch(
            "urllib.request.urlopen",
            return_value=io.BytesIO(json.dumps(api_page).encode()),
        ),
        pytest.raises(DataError, match="pagination"),
    ):
        fetch_models(cache, refresh=True)
    assert not cache.exists()


def test_page_version_changes_are_rejected(tmp_path, api_page, monkeypatch):
    import copy

    monkeypatch.setenv("AA_API_KEY", "secret")
    first = copy.deepcopy(api_page)
    first["pagination"].update(total_pages=2, has_more=True)
    second = copy.deepcopy(api_page)
    second["pagination"].update(page=2, total_pages=2)
    second["intelligence_index_version"] = 4.4
    with (
        patch(
            "urllib.request.urlopen",
            side_effect=[
                io.BytesIO(json.dumps(first).encode()),
                io.BytesIO(json.dumps(second).encode()),
            ],
        ),
        pytest.raises(DataError, match="version"),
    ):
        fetch_models(tmp_path / "cache", refresh=True)


def test_index_version_is_embedded_in_shared_report():
    content = render(
        demo_models(),
        load_config(BASE / "defaults.json"),
        source="API",
        index_version=4.3,
    )
    assert '"intelligence_index_version":4.3' in content
    assert "Intelligence Index v4.3" in content


def test_cli_demo_outputs_existing_html(capsys):
    assert main(["--demo", "--no-open", "--benchmark", "deepswe", "--x", "cost"]) == 0
    output = Path(capsys.readouterr().out.strip())
    try:
        assert output.exists()
    finally:
        output.unlink(missing_ok=True)


def test_cli_missing_key_has_no_output(capsys, tmp_path, monkeypatch):
    monkeypatch.delenv("AA_API_KEY", raising=False)
    monkeypatch.delenv("ARTIFICIAL_ANALYSIS_API_KEY", raising=False)
    assert main(["--no-open", "--cache", str(tmp_path / "cache")]) == 1
    assert capsys.readouterr().out == ""


def test_csv_row_benchmark_applies_to_every_task_metric(tmp_path):
    path = tmp_path / "export.csv"
    path.write_text(
        "slug,name,benchmark,score,cost_per_task,output_tokens_per_task,time_per_task\n"
        "example-high,Example,deepswe,73,4.2,1000,10\n"
    )
    model = load_input(path)[0]
    assert model["scores"] == {"deepswe": 73}
    assert model["cost_per_task"] == {"deepswe": 4.2}
    assert model["output_tokens_per_task"] == {"deepswe": 1000}
    assert model["time_per_task"] == {"deepswe": 10}


def test_preset_rejects_unrecognized_fields(tmp_path):
    path = tmp_path / "config.json"
    path.write_text('{"presets": [{"name": "Private", "api_key": "secret"}]}')
    with pytest.raises(DataError, match="Unknown preset"):
        load_config(path)


@pytest.mark.parametrize("key", ["abc\nsecret", "has a space", " ", "nonascii-é"])
def test_invalid_api_key_not_sent_or_disclosed(tmp_path, monkeypatch, key):
    monkeypatch.setenv("ARTIFICIAL_ANALYSIS_API_KEY", key)
    with patch("urllib.request.urlopen") as request, pytest.raises(DataError) as error:
        fetch_models(tmp_path / "cache", refresh=True)
    request.assert_not_called()
    assert repr(key) not in str(error.value)


@pytest.mark.parametrize("content", [b"not-json", b"\xff"])
def test_fetch_bad_json_response(tmp_path, monkeypatch, content):
    monkeypatch.setenv("AA_API_KEY", "secret")
    with (
        patch("urllib.request.urlopen", return_value=io.BytesIO(content)),
        pytest.raises(DataError, match="invalid JSON"),
    ):
        fetch_models(tmp_path / "cache", refresh=True)


def test_fetch_oversized_response(tmp_path, monkeypatch):
    monkeypatch.setenv("AA_API_KEY", "secret")
    with (
        patch(
            "urllib.request.urlopen",
            return_value=io.BytesIO(b" " * (20 * 1024 * 1024 + 1)),
        ),
        pytest.raises(DataError, match="size limit"),
    ):
        fetch_models(tmp_path / "cache", refresh=True)


def test_expired_cache_does_not_hide_missing_key(tmp_path, api_record, monkeypatch):
    import os

    monkeypatch.delenv("AA_API_KEY", raising=False)
    monkeypatch.delenv("ARTIFICIAL_ANALYSIS_API_KEY", raising=False)
    cache = tmp_path / "cache"
    cache.write_text(json.dumps({"data": [api_record]}))
    os.utime(cache, (0, 0))
    with pytest.raises(DataError, match="API key"):
        fetch_models(cache)


@pytest.mark.parametrize(
    "config",
    [
        {"models": [1]},
        {"x": "other"},
        {"benchmark": 10},
        {"presets": {}},
        {"presets": [{}]},
        {"presets": [{"name": "a"}, {"name": "a"}]},
        {"unknown": True},
    ],
)
def test_config_error_branches(tmp_path, config):
    path = tmp_path / "config.json"
    path.write_text(json.dumps(config))
    with pytest.raises(DataError):
        load_config(path)


def test_csv_too_many_cells_and_bad_numeric_values(tmp_path):
    path = tmp_path / "bad.csv"
    path.write_text("Model,Score\nM,2,extra\n")
    with pytest.raises(DataError, match="more cells"):
        load_input(path)
    path.write_text("Model,Score\nM,nope\n")
    with pytest.raises(DataError, match="numeric"):
        load_input(path)


def test_fallback_scenarios_and_derived_slugs():
    models = normalize(
        [
            {"name": "Claude Example (High Effort, Default Fallback)"},
            {"name": "Claude Example (High Effort, No Fallback)"},
        ]
    )
    assert models[0]["series"] != models[1]["series"]
    assert models[0]["slug"] != models[1]["slug"]


@pytest.mark.parametrize(
    "row",
    [
        {"name": 2},
        {"name": "M", "slug": "bad slug"},
        {"name": "M", "model_creator": []},
        {"name": "M", "evaluations": []},
        {"name": "M", "pricing": [1]},
        {"name": "M", "scores": {"intelligence": {}}},
    ],
)
def test_model_boundary_errors(row):
    with pytest.raises(DataError):
        normalize([row])


def test_cli_imported_demo_csv_remains_demo(tmp_path, capsys):
    path = tmp_path / "demo.csv"
    path.write_text(
        "slug,name,benchmark,score,cost_per_task\n"
        "demo-example-high,Example [DEMO],deepswe,73,4.2\n"
    )
    assert main(["--input", str(path), "--no-open"]) == 0
    output = Path(capsys.readouterr().out.strip())
    try:
        assert '"demo":true' in output.read_text()
    finally:
        output.unlink()


def test_cli_import_and_model_overrides(tmp_path, capsys):
    path = tmp_path / "real.json"
    path.write_text(json.dumps([{"slug": "gpt-test", "name": "GPT Test", "score": 50}]))
    assert main(["--input", str(path), "--models", "gpt-test", "--no-open"]) == 0
    output = Path(capsys.readouterr().out.strip())
    try:
        assert '"models":["gpt-test"]' in output.read_text()
        assert '"demo":false' in output.read_text()
    finally:
        output.unlink()


def test_read_key_from_onepassword_uses_explicit_account(monkeypatch):
    monkeypatch.delenv("ARTIFICIAL_ANALYSIS_API_KEY", raising=False)
    monkeypatch.delenv("AA_API_KEY", raising=False)
    result = subprocess.CompletedProcess([], 0, stdout="secret-from-op\n", stderr="")
    with patch("report.subprocess.run", return_value=result) as command:
        assert (
            read_api_key(
                op_reference="op://Vault/item/credential", op_account="my.1password.com"
            )
            == "secret-from-op"
        )
    assert command.call_args.args[0] == [
        "op",
        "read",
        "--account",
        "my.1password.com",
        "op://Vault/item/credential",
    ]
    assert command.call_args.kwargs["capture_output"] is True


@pytest.mark.parametrize(
    "failure",
    [
        subprocess.CompletedProcess([], 1, stdout="secret-body", stderr="secret-body"),
        OSError("secret-body"),
        subprocess.TimeoutExpired("op", 60, output="secret-body"),
    ],
)
def test_onepassword_errors_never_disclose_output(monkeypatch, failure):
    monkeypatch.delenv("ARTIFICIAL_ANALYSIS_API_KEY", raising=False)
    monkeypatch.delenv("AA_API_KEY", raising=False)
    kwargs = (
        {"side_effect": failure}
        if isinstance(failure, Exception)
        else {"return_value": failure}
    )
    with patch("report.subprocess.run", **kwargs), pytest.raises(DataError) as error:
        read_api_key(
            op_reference="op://Vault/item/credential", op_account="my.1password.com"
        )
    assert "secret-body" not in str(error.value)
    assert "1Password" in str(error.value)


@pytest.mark.parametrize(
    "kwargs",
    [
        {"op_reference": "op://Vault/item/credential"},
        {"op_reference": "not-a-reference", "op_account": "my.1password.com"},
    ],
)
def test_onepassword_requires_reference_and_account(monkeypatch, kwargs):
    monkeypatch.delenv("ARTIFICIAL_ANALYSIS_API_KEY", raising=False)
    monkeypatch.delenv("AA_API_KEY", raising=False)
    with patch("report.subprocess.run") as command, pytest.raises(DataError):
        read_api_key(**kwargs)
    command.assert_not_called()


def test_environment_key_overrides_onepassword(monkeypatch):
    monkeypatch.setenv("ARTIFICIAL_ANALYSIS_API_KEY", "existing-env-key")
    with patch("report.subprocess.run") as command:
        assert (
            read_api_key(
                op_reference="op://Vault/item/credential", op_account="my.1password.com"
            )
            == "existing-env-key"
        )
    command.assert_not_called()


def test_fresh_cache_skips_onepassword(
    tmp_path, api_record, cache_payload, monkeypatch
):
    monkeypatch.delenv("ARTIFICIAL_ANALYSIS_API_KEY", raising=False)
    monkeypatch.delenv("AA_API_KEY", raising=False)
    cache = tmp_path / "cache.json"
    cache.write_text(json.dumps(cache_payload))
    with patch("report.subprocess.run") as command:
        assert (
            normalize(
                fetch_models(
                    cache,
                    op_reference="op://Vault/item/credential",
                    op_account="my.1password.com",
                )
            )[0]["id"]
            == "stable-id"
        )
    command.assert_not_called()


@pytest.mark.parametrize("returncode", [0, 1])
def test_mac_opens_generated_file_with_system_opener(capsys, returncode):
    import subprocess

    with (
        patch("report.sys.platform", "darwin"),
        patch(
            "report.subprocess.run",
            return_value=subprocess.CompletedProcess([], returncode),
        ) as opener,
        patch("report.webbrowser.open", return_value=False),
    ):
        assert main(["--demo"]) == 0
    output = Path(capsys.readouterr().out.strip())
    try:
        opener.assert_called_once()
        assert opener.call_args.args[0] == ["/usr/bin/open", str(output)]
    finally:
        output.unlink()


def test_system_opener_error_does_not_lose_report(capsys):
    with (
        patch("report.sys.platform", "darwin"),
        patch("report.subprocess.run", side_effect=OSError("not available")),
        patch("report.webbrowser.open", return_value=False),
    ):
        assert main(["--demo"]) == 0
    output = Path(capsys.readouterr().out.strip())
    try:
        assert output.exists()
    finally:
        output.unlink()


@pytest.mark.parametrize("opened", [True, False])
def test_non_mac_uses_browser_open(capsys, opened):
    with (
        patch("report.sys.platform", "linux"),
        patch("report.webbrowser.open", return_value=opened) as opener,
    ):
        assert main(["--demo"]) == 0
    output = Path(capsys.readouterr().out.strip())
    try:
        opener.assert_called_once_with(output.as_uri())
    finally:
        output.unlink()
