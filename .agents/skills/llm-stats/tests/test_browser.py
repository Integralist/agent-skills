"""Real browser tests on file:// with networking disabled."""

import json
from collections.abc import Iterator
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect, sync_playwright
from report import demo_models, generate, load_config, normalize

BASE = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as playwright:
        instance = playwright.chromium.launch(channel="chrome")
        yield instance
        instance.close()


@pytest.fixture
def report_file():
    config = load_config(BASE / "defaults.json")
    config.update(benchmark="deepswe", x="cost")
    path = generate(demo_models(), config, source="Synthetic demo", demo=True)
    yield path
    path.unlink(missing_ok=True)


@pytest.fixture
def page(browser):
    context = browser.new_context(
        offline=True, viewport={"width": 1500, "height": 1100}
    )
    page = context.new_page()
    errors = []
    requests = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on(
        "request",
        lambda request: (
            requests.append(request.url)
            if request.url.startswith(("http://", "https://"))
            else None
        ),
    )
    yield page
    assert errors == []
    assert requests == []
    context.close()


def node(page, slug):
    return page.locator(f'.node[data-slug="{slug}"]')


def test_dark_warm_surfaces_and_readable_text(page: Page, report_file: Path) -> None:
    page.goto(report_file.as_uri())
    colors = page.evaluate(
        """() => {
          const rgb = color => color.match(/[\\d.]+/g).slice(0, 3).map(Number);
          const luminance = channels => channels.map(value => {
            const c = value / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
          const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          const root = getComputedStyle(document.documentElement);
          const paper = luminance(rgb(root.backgroundColor));
          const card = luminance(rgb(getComputedStyle(document.querySelector('.chart-card')).backgroundColor));
          const surfaces = ['.chart-card', '#models-toggle', '#models-panel',
            '#model-search', '#demo-banner', '#tooltip', '#warnings'].map(selector => {
              const channels = rgb(getComputedStyle(document.querySelector(selector)).backgroundColor);
              return {luminance: luminance(channels), warm: channels[0] > channels[2]};
            });
          const muted = luminance(rgb(getComputedStyle(document.querySelector('.intro')).color));
          const ink = luminance(rgb(root.color));
          const labels = [...document.querySelectorAll('.family-label, .effort-label, .axis-tick')]
            .map(label => contrast(card, luminance(rgb(getComputedStyle(label).fill))));
          const primary = getComputedStyle(document.querySelector('#save-html'));
          return {paper, paperColor: root.backgroundColor,
            cardColor: getComputedStyle(document.querySelector('.chart-card')).backgroundColor,
            surfaces, scheme: root.colorScheme,
            inkContrast: contrast(paper, ink),
            mutedContrast: contrast(paper, muted), labelContrast: Math.min(...labels),
            primaryContrast: contrast(luminance(rgb(primary.color)), luminance(rgb(primary.backgroundColor)))};
        }"""
    )
    assert colors["paperColor"] == "rgb(106, 61, 23)"
    assert colors["cardColor"] == "rgb(65, 39, 21)"
    assert colors["paper"] < 0.12
    assert all(surface["luminance"] < 0.07 for surface in colors["surfaces"])
    assert colors["scheme"] == "dark"
    assert all(surface["warm"] for surface in colors["surfaces"])
    assert colors["inkContrast"] >= 4.5
    assert colors["mutedContrast"] >= 4.5
    assert colors["labelContrast"] >= 4.5
    assert colors["primaryContrast"] >= 4.5


def test_dark_theme_hover_states_and_native_controls(
    page: Page, report_file: Path
) -> None:
    page.goto(report_file.as_uri())
    expect(page.locator('meta[name="color-scheme"]')).to_have_attribute(
        "content", "dark"
    )
    page.locator("#models-toggle").hover()
    background = page.locator("#models-toggle").evaluate(
        "button => getComputedStyle(button).backgroundColor"
    )
    assert (
        max(
            int(part.strip())
            for part in background.removeprefix("rgb(").removesuffix(")").split(",")
        )
        < 80
    )
    page.locator("#models-toggle").click()
    expect(page.locator("#models-panel")).to_be_visible()
    assert (
        page.locator("#model-search").evaluate(
            "input => getComputedStyle(input).colorScheme"
        )
        == "dark"
    )
    page.emulate_media(media="print")
    assert (
        page.locator("h1").evaluate("heading => getComputedStyle(heading).color")
        == "rgb(53, 44, 36)"
    )
    assert (
        page.locator(".chart-card").evaluate(
            "card => getComputedStyle(card).backgroundColor"
        )
        == "rgb(255, 255, 255)"
    )


def test_omission_warning_lists_names_and_exact_missing_metrics(page: Page) -> None:
    rows = [
        {
            "slug": "claude-both",
            "name": "Claude Both Missing",
            "scores": {},
            "cost_per_task": {},
            "output_speed": None,
        },
        {
            "slug": "claude-cost",
            "name": "Claude Cost Missing",
            "scores": {"intelligence": 52},
            "cost_per_task": {},
            "output_speed": 100,
        },
        {
            "slug": "claude-score",
            "name": "Claude Score Missing",
            "scores": {},
            "cost_per_task": {"intelligence": 1},
            "output_speed": 100,
        },
        {
            "slug": "claude-zero",
            "name": "Claude Zero Is Valid",
            "scores": {"intelligence": 0},
            "cost_per_task": {"intelligence": 0},
            "output_speed": 0,
        },
    ]
    config = load_config(BASE / "defaults.json")
    config["models"] = [row["slug"] for row in rows]
    path = generate(normalize(rows), config, source="Warning fixture")
    page.goto(path.as_uri())
    expect(page.locator("#warnings li")).to_have_count(3)
    expect(page.locator('#warnings li[data-model="claude-both"]')).to_have_text(
        "Claude Both Missing — missing benchmark score and avg cost per task."
    )
    expect(page.locator('#warnings li[data-model="claude-cost"]')).to_have_text(
        "Claude Cost Missing — missing avg cost per task."
    )
    expect(page.locator('#warnings li[data-model="claude-score"]')).to_have_text(
        "Claude Score Missing — missing benchmark score."
    )
    expect(page.locator("#warnings")).not_to_contain_text("Claude Zero Is Valid")
    page.locator("#x-metric").select_option("speed")
    expect(page.locator("#warnings li")).to_have_count(2)
    expect(page.locator('#warnings li[data-model="claude-both"]')).to_contain_text(
        "benchmark score and output speed"
    )
    page.locator("#models-toggle").click()
    page.locator("#clear-models").click()
    expect(page.locator("#warnings")).to_be_hidden()
    expect(page.locator("#warnings li")).to_have_count(0)


def test_omitted_model_names_are_safe_text(page: Page) -> None:
    model = normalize(
        [
            {
                "slug": "claude-hostile",
                "name": "Claude <img src=x onerror=alert(1)>",
                "scores": {"intelligence": 50},
            }
        ]
    )
    path = generate(model, load_config(BASE / "defaults.json"), source="Safe warning")
    page.goto(path.as_uri())
    expect(page.locator("#warnings li")).to_contain_text("<img src=x onerror=alert(1)>")
    expect(page.locator("#warnings img")).to_have_count(0)


def test_family_labels_render_above_lines_and_dim_with_their_series(
    page: Page, report_file: Path
) -> None:
    page.goto(report_file.as_uri())
    layering = page.locator("#chart").evaluate(
        """chart => {
          const series = [...chart.querySelectorAll('.series')];
          const labels = [...chart.querySelectorAll('.family-label')];
          return {
            labelsFollowLines: series.every(group => labels.every(label =>
              Boolean(group.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING))),
            labelCount: labels.length,
            pointerEvents: chart.querySelector('.family-label-layer')
              ? getComputedStyle(chart.querySelector('.family-label-layer')).pointerEvents
              : null,
          };
        }"""
    )
    assert layering == {
        "labelsFollowLines": True,
        "labelCount": 4,
        "pointerEvents": "none",
    }

    node(page, "demo-claude-opus-high").hover()
    expect(page.locator(".family-label.is-dim")).to_have_count(3)


def test_model_lines_are_bright_and_distinct(page: Page, report_file: Path) -> None:
    page.goto(report_file.as_uri())
    colors = page.locator(".series path").evaluate_all(
        """paths => paths.map(path => getComputedStyle(path).stroke
          .match(/[\\d.]+/g).slice(0, 3).map(Number))"""
    )
    assert len({tuple(color) for color in colors}) == len(colors)
    assert all(max(color) >= 210 for color in colors)
    assert all(max(color) - min(color) >= 140 for color in colors)


def test_default_preview_uses_intelligence_not_deepswe(page: Page) -> None:
    path = generate(
        demo_models(), load_config(BASE / "defaults.json"), source="Demo", demo=True
    )
    page.goto(path.as_uri())
    expect(page.locator("#benchmark")).to_have_value("intelligence")
    expect(page.locator("#x-metric")).to_have_value("cost")
    expect(page.locator("#chart-title")).to_contain_text(
        "Artificial Analysis Intelligence Index"
    )


def test_effort_curve_uses_measured_cost_not_identical_token_rates(page: Page) -> None:
    rows = [
        {
            "slug": "gpt-6-1-sol-high",
            "name": "GPT-6.1 Sol (high)",
            "evaluations": {"artificial_analysis_intelligence_index": 50.2},
            "artificial_analysis_intelligence_index_cost": {
                "total_cost": 521.32,
                "cost_per_task": {"total_cost": 0.3191},
            },
            "pricing": {"price_1m_input_tokens": 2, "price_1m_output_tokens": 10},
        },
        {
            "slug": "gpt-6-1-sol-xhigh",
            "name": "GPT-6.1 Sol (xhigh)",
            "evaluations": {"artificial_analysis_intelligence_index": 51},
            "artificial_analysis_intelligence_index_cost": {
                "total_cost": 662.28,
                "cost_per_task": {"total_cost": 0.3929},
            },
            "pricing": {"price_1m_input_tokens": 2, "price_1m_output_tokens": 10},
        },
    ]
    path = generate(
        normalize(rows),
        load_config(BASE / "defaults.json"),
        source="API regression",
        index_version=4.3,
    )
    page.goto(path.as_uri())
    expect(page.locator(".node")).to_have_count(2)
    high_x = float(node(page, "gpt-6-1-sol-high").locator(".dot").get_attribute("cx"))
    xhigh_x = float(node(page, "gpt-6-1-sol-xhigh").locator(".dot").get_attribute("cx"))
    assert high_x > xhigh_x
    node(page, "gpt-6-1-sol-high").click()
    expect(page.locator("#tooltip")).to_contain_text("$0.3191")
    expect(page.locator("#y-axis-label")).to_contain_text("v4.3")


def test_offline_default_providers_and_axes(page, report_file):
    page.goto(report_file.as_uri())
    expect(page.locator(".node")).to_have_count(12)
    expect(page.locator('[data-provider="other"].series')).to_have_count(0)
    expect(page.locator("#demo-banner")).to_be_visible()
    expect(page.locator("#x-axis-label")).to_have_text("Avg cost per task · USD")
    expect(page.locator("#y-axis-label")).to_have_text("DeepSWE score · %")
    expect(page.locator("#chart")).to_contain_text("LOW")
    assert page.locator(".series path").count() == 4


def test_hover_pin_switch_toggle_and_crosshairs(page, report_file):
    page.goto(report_file.as_uri())
    first = node(page, "demo-claude-opus-high")
    second = node(page, "demo-gpt-high")
    first.hover()
    expect(page.locator(".series.is-dim")).to_have_count(3)
    expect(page.locator("#tooltip")).to_contain_text("Claude Opus")
    expect(page.locator(".crosshair line")).to_have_count(2)
    page.locator("h1").hover()
    expect(page.locator(".series.is-dim")).to_have_count(0)
    first.click()
    page.locator("h1").hover()
    expect(page.locator(".series.is-dim")).to_have_count(3)
    second.hover()
    expect(page.locator('.series.is-active[data-provider="anthropic"]')).to_have_count(
        1
    )
    second.click()
    expect(page.locator('.series.is-active[data-provider="openai"]')).to_have_count(1)
    second.click()
    expect(page.locator(".series.is-dim")).to_have_count(0)
    assert "highlight=" not in page.url


def test_keyboard_pin_and_escape(page, report_file):
    page.goto(report_file.as_uri())
    first = node(page, "demo-claude-opus-high")
    first.focus()
    first.press("Enter")
    expect(page.locator(".series.is-dim")).to_have_count(3)
    assert "highlight=demo-claude-opus-high" in page.url
    page.keyboard.press("Escape")
    expect(page.locator(".series.is-dim")).to_have_count(0)


def test_fuzzy_search_selection_url_and_reload(page, report_file):
    page.goto(report_file.as_uri() + "?unrelated=keep")
    page.locator("#models-toggle").click()
    page.get_by_label("Search models", exact=True).fill("cldops")
    expect(page.locator("#model-options input[type=checkbox]")).to_have_count(3)
    page.get_by_label("Claude Opus [DEMO] (High Effort)", exact=True).uncheck()
    assert "unrelated=keep" in page.url
    page.get_by_label("Search models", exact=True).press("Escape")
    expect(page.locator("#models-panel")).to_be_hidden()
    expect(page.locator(".node")).to_have_count(11)
    assert "models=" in page.url
    page.reload()
    expect(page.locator(".node")).to_have_count(11)


def test_empty_selection_survives_reload_and_reset(page, report_file):
    page.goto(report_file.as_uri() + "?models=")
    expect(page.locator(".node")).to_have_count(0)
    expect(page.locator("#empty-state")).to_contain_text("Select")
    page.reload()
    expect(page.locator(".node")).to_have_count(0)
    page.locator("#models-toggle").click()
    page.locator("#reset-models").click()
    expect(page.locator(".node")).to_have_count(12)
    page.locator("#clear-models").click()
    expect(page.locator(".node")).to_have_count(0)
    page.get_by_label("Search models", exact=True).fill("gmn")
    page.locator("#select-matches").click()
    expect(page.locator(".node")).to_have_count(3)


def test_unknown_url_slugs_warn_without_fallback(page, report_file):
    page.goto(report_file.as_uri() + "?models=not-a-model")
    expect(page.locator(".node")).to_have_count(0)
    expect(page.locator("#warnings")).to_contain_text("not-a-model")


def test_metrics_and_artificial_analysis_query_alias(page, report_file):
    page.goto(
        report_file.as_uri()
        + "?models=demo-gpt-high&eval-cost=intelligence-vs-total-cost"
        "&eval-token-usage=score-vs-output-tokens-per-task"
        "&eval-speed=intelligence-vs-time-per-task"
    )
    expect(page.locator("#benchmark")).to_have_value("intelligence")
    expect(page.locator("#x-metric")).to_have_value("cost")
    page.locator("#x-metric").select_option("tokens")
    expect(page.locator("#x-axis-label")).to_have_text("Output tokens per task")
    assert "x=tokens" in page.url
    assert "eval-cost=intelligence-vs-total-cost" in page.url
    page.locator("#x-metric").select_option("time")
    expect(page.locator("#metric-note")).to_contain_text("not wall-clock")
    page.locator("#x-metric").select_option("price")
    expect(page.locator("#x-axis-label")).to_have_text(
        "Blended token price · USD / 1M tokens"
    )
    expect(page.locator("#metric-note")).to_contain_text("not cost per task")
    page.locator("#x-metric").select_option("speed")
    expect(page.locator("#x-axis-label")).to_have_text("Output speed · tokens / second")


def test_saved_html_keeps_view_without_query_and_exports_data(
    page, report_file, tmp_path
):
    page.goto(
        report_file.as_uri()
        + "?models=demo-gpt-high,demo-gpt-max&x=cost&benchmark=deepswe"
    )
    node(page, "demo-gpt-high").click()
    with page.expect_download() as download:
        page.locator("#save-html").click()
    saved = tmp_path / "shared.html"
    download.value.save_as(saved)
    assert "<script src=" not in saved.read_text()
    page.goto(saved.as_uri())
    expect(page.locator(".node")).to_have_count(2)
    expect(page.locator("#pin-status")).to_contain_text("GPT")
    with page.expect_download() as download:
        page.locator("#export-json").click()
    exported = tmp_path / "data.json"
    download.value.save_as(exported)
    payload = json.loads(exported.read_text())
    assert payload["demo"] is True
    assert len(normalize(payload)) == 15
    with page.expect_download() as download:
        page.locator("#export-csv").click()
    csv = tmp_path / "chart.csv"
    download.value.save_as(csv)
    assert len(csv.read_text().splitlines()) == 3
    assert "demo-gpt-high" in csv.read_text()


def test_presets_and_url_overrides_config(page, report_file):
    page.goto(report_file.as_uri() + "?models=demo-other-model-high")
    expect(page.locator(".node")).to_have_count(1)
    expect(page.locator('.series[data-provider="other"]')).to_have_count(1)
    page.locator("#preset").select_option("1")
    expect(page.locator(".node")).to_have_count(6)
    expect(page.locator('.series[data-provider="openai"]')).to_have_count(0)


def test_missing_task_cost_not_replaced_by_token_price(page):
    models = normalize(
        [
            {
                "slug": "claude-test",
                "name": "Claude Test",
                "scores": {"intelligence": 60},
                "pricing": {"blended": 10},
            }
        ]
    )
    config = load_config(BASE / "defaults.json")
    config["x"] = "cost"
    path = generate(models, config, source="Test")
    try:
        page.goto(path.as_uri())
        expect(page.locator(".node")).to_have_count(0)
        expect(page.locator("#warnings")).to_contain_text("missing")
        expect(page.locator("#empty-state")).to_contain_text("No data")
        page.locator("#x-metric").select_option("price")
        expect(page.locator(".node")).to_have_count(1)
    finally:
        path.unlink(missing_ok=True)


def test_safe_model_text_and_csv_formula_injection(page, tmp_path):
    models = normalize(
        [
            {
                "slug": "evil",
                "name": '=HYPERLINK("x") </script><script>window.injected=1</script>',
                "provider": "anthropic",
                "scores": {"intelligence": 50},
                "pricing": {"blended": 2},
            }
        ]
    )
    config = load_config(BASE / "defaults.json")
    config["x"] = "price"
    path = generate(models, config, source="Test")
    try:
        page.goto(path.as_uri())
        assert page.evaluate("window.injected") is None
        expect(page.locator(".node")).to_have_count(1)
        with page.expect_download() as download:
            page.locator("#export-csv").click()
        target = tmp_path / "safe.csv"
        download.value.save_as(target)
        assert "'=HYPERLINK" in target.read_text()
        with page.expect_download() as download:
            page.locator("#save-html").click()
        shared = tmp_path / "hostile-shared.html"
        download.value.save_as(shared)
        page.goto(shared.as_uri())
        assert page.evaluate("window.injected") is None
        expect(page.locator(".node")).to_have_count(1)
    finally:
        path.unlink(missing_ok=True)


def test_zero_values_render_without_invalid_coordinates(page):
    models = normalize(
        [
            {
                "slug": "claude-zero",
                "name": "Claude Zero",
                "scores": {"deepswe": 0},
                "cost_per_task": {"deepswe": 0},
            }
        ]
    )
    config = load_config(BASE / "defaults.json")
    config.update(benchmark="deepswe", x="cost")
    path = generate(models, config, source="Zero fixture")
    try:
        page.goto(path.as_uri())
        expect(page.locator(".node")).to_have_count(1)
        node(page, "claude-zero").click()
        expect(page.locator("#tooltip")).to_contain_text("0%")
        expect(page.locator("#tooltip")).to_contain_text("$0")
        assert "NaN" not in page.locator("#chart").inner_html()
        assert "Infinity" not in page.locator("#chart").inner_html()
    finally:
        path.unlink(missing_ok=True)


def test_glob_patterns_family_limit_and_explicit_selection(page):
    config = load_config(BASE / "defaults.json")
    config.update(
        benchmark="deepswe",
        x="cost",
        families_per_provider=1,
        model_patterns=["demo-claude-*-high"],
    )
    path = generate(demo_models(), config, source="Pattern fixture")
    try:
        page.goto(path.as_uri())
        expect(page.locator(".node")).to_have_count(2)
    finally:
        path.unlink(missing_ok=True)
    config.update(model_patterns=[], models=["demo-other-model-high"])
    path = generate(demo_models(), config, source="Explicit fixture")
    try:
        page.goto(path.as_uri())
        expect(page.locator(".node")).to_have_count(1)
        expect(page.locator('.series[data-provider="other"]')).to_have_count(1)
    finally:
        path.unlink(missing_ok=True)


def test_automatic_defaults_pick_recent_family_with_all_efforts(page):
    models = demo_models()
    for model in models:
        model["release_date"] = (
            "2026-09-29" if "sonnet" in model["slug"] else "2026-09-01"
        )
    config = load_config(BASE / "defaults.json")
    config.update(benchmark="deepswe", x="cost", families_per_provider=1)
    path = generate(models, config, source="Date fixture")
    try:
        page.goto(path.as_uri())
        expect(page.locator(".node")).to_have_count(9)
        expect(page.locator('.node[data-slug^="demo-claude-opus"]')).to_have_count(0)
        expect(page.locator('.node[data-slug^="demo-claude-sonnet"]')).to_have_count(3)
    finally:
        path.unlink(missing_ok=True)


def test_keyboard_model_selector_and_removed_pin(page, report_file):
    page.goto(report_file.as_uri())
    node(page, "demo-gpt-high").click()
    page.locator("#models-toggle").click()
    search = page.get_by_label("Search models", exact=True)
    search.fill("GPT high")
    expect(page.locator("#model-options input").first).to_have_attribute(
        "aria-label", "GPT [DEMO] (High Effort)"
    )
    search.press("ArrowDown")
    page.keyboard.press("Enter")
    expect(page.locator(".node")).to_have_count(11)
    expect(page.locator(".series.is-dim")).to_have_count(0)
    expect(page.locator("#pin-status")).to_have_text("No line pinned")
    assert "highlight=" not in page.url


def test_explicit_metrics_override_aliases_and_invalid_x_warns(page, report_file):
    page.goto(
        report_file.as_uri()
        + "?benchmark=deepswe&x=speed&eval-cost=intelligence-vs-total-cost"
    )
    expect(page.locator("#benchmark")).to_have_value("deepswe")
    expect(page.locator("#x-metric")).to_have_value("speed")
    page.goto(report_file.as_uri() + "?x=invalid")
    expect(page.locator("#warnings")).to_contain_text("Unknown x metric")
    expect(page.locator(".node")).to_have_count(12)


def test_clipboard_fallback_and_mobile_layout(page, report_file):
    page.goto(report_file.as_uri())
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {value: undefined})")
    page.locator("#copy-link").click()
    expect(page.locator("#view-url")).to_have_value(page.url)
    page.set_viewport_size({"width": 390, "height": 844})
    page.locator("#models-toggle").click()
    expect(page.get_by_label("Search models", exact=True)).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")


@pytest.fixture
def pareto_report() -> Iterator[Path]:
    """Include trade-offs, dominance ties, duplicates, zeroes, and missing data."""
    records = [
        ("dominated", 45, 3),
        ("middle-twin", 50, 2),
        ("zero", 0, 0),
        ("tied-score", 40, 2),
        ("premium", 80, 4),
        ("missing-score", None, 0),
        ("tied-cost", 30, 1),
        ("middle", 50, 2),
        ("cheap", 40, 1),
        ("missing-metric", 100, None),
    ]
    models = normalize(
        [
            {
                "slug": slug,
                "name": slug.replace("-", " ").title(),
                "provider": (
                    "anthropic"
                    if slug in {"middle", "tied-score"}
                    else ["anthropic", "openai", "google"][index % 3]
                ),
                "series": (
                    "Mixed family" if slug in {"middle", "tied-score"} else slug
                ),
                "scores": (
                    {"intelligence": score, "deepswe": 100 - score}
                    if score is not None
                    else {}
                ),
                "cost_per_task": {"intelligence": metric, "deepswe": metric},
                "output_tokens_per_task": {"intelligence": metric},
                "time_per_task": {"intelligence": metric},
                "pricing": {"blended": metric},
                "output_speed": 4 - metric if metric is not None else None,
            }
            for index, (slug, score, metric) in enumerate(records)
        ]
    )
    config = load_config(BASE / "defaults.json")
    config.update(
        benchmark="intelligence", x="cost", models=[slug for slug, _, _ in records]
    )
    path = generate(models, config, source="Synthetic Pareto test fixture", demo=True)
    yield path
    path.unlink(missing_ok=True)


def expect_frontier(page: Page, slugs: list[str]) -> None:
    """Compare rendered line vertices with the expected plotted model locations."""
    actual = page.locator(".pareto-line").evaluate(
        """path => [...path.getAttribute('d').matchAll(/[ML]([^ML]+)/g)]
          .map(match => match[1].trim().split(',').map(Number))"""
    )
    expected = [
        node(page, slug)
        .locator(".dot")
        .evaluate(
            "circle => ['cx', 'cy'].map(name => Number(circle.getAttribute(name)))"
        )
        for slug in slugs
    ]
    assert actual == expected


@pytest.mark.parametrize("metric", ["cost", "tokens", "time", "price", "speed"])
def test_pareto_line_uses_nondominated_points(
    page: Page, pareto_report: Path, metric: str
) -> None:
    """The frontier respects metric direction, ties, duplicates, zeroes, and gaps."""
    page.goto(pareto_report.as_uri())
    checkbox = page.get_by_role("checkbox", name="Pareto line", exact=True)
    expect(checkbox).not_to_be_checked()
    expect(page.locator(".pareto-line")).to_have_count(0)
    expect(page.locator("#pareto-note")).to_be_hidden()
    page.locator("#x-metric").select_option(metric)
    checkbox.check()
    expect(page.locator(".pareto-line")).to_have_count(1)
    expect_frontier(page, ["premium", "middle", "cheap", "zero"])
    expect(page.locator(".node")).to_have_count(8)
    expect(page.locator("#warnings")).to_contain_text("Missing Score")
    expect(page.locator("#warnings")).to_contain_text("Missing Metric")
    expect(page.locator("#pareto-note")).to_be_visible()
    style = page.locator(".pareto-line").evaluate(
        """line => {
          const style = getComputedStyle(line);
          return {dash: style.strokeDasharray, fill: style.fill,
            events: style.pointerEvents};
        }"""
    )
    assert style["dash"] != "none"
    assert style["fill"] == "none"
    assert style["events"] == "none"


def test_pareto_recomputes_for_model_and_benchmark_changes(
    page: Page, pareto_report: Path
) -> None:
    """Removing frontier models promotes alternatives; a new benchmark recalculates."""
    page.goto(pareto_report.as_uri() + "?pareto=1")
    expect_frontier(page, ["premium", "middle", "cheap", "zero"])
    page.locator("#models-toggle").click()
    page.get_by_role("checkbox", name="Middle", exact=True).uncheck()
    page.get_by_role("checkbox", name="Middle Twin", exact=True).uncheck()
    expect_frontier(page, ["premium", "dominated", "cheap", "zero"])
    page.get_by_role("checkbox", name="Premium", exact=True).uncheck()
    expect_frontier(page, ["dominated", "cheap", "zero"])
    page.get_by_label("Search models", exact=True).press("Escape")
    page.locator("#benchmark").select_option("deepswe")
    expect(page.locator(".pareto-line")).to_have_count(0)
    expect(page.get_by_role("checkbox", name="Pareto line")).to_be_checked()
    page.locator("#benchmark").select_option("intelligence")
    expect_frontier(page, ["dominated", "cheap", "zero"])
    cost_line = page.locator(".pareto-line").get_attribute("d")
    page.locator("#x-metric").select_option("speed")
    expect_frontier(page, ["dominated", "cheap", "zero"])
    assert page.locator(".pareto-line").get_attribute("d") != cost_line


@pytest.mark.parametrize(
    "selection",
    ["", "zero", "middle,middle-twin", "missing-score,missing-metric"],
)
def test_pareto_does_not_invent_lines_with_fewer_than_two_locations(
    page: Page, pareto_report: Path, selection: str
) -> None:
    """Empty, missing, singleton, and coincident selections have no fake segment."""
    page.goto(pareto_report.as_uri() + f"?models={selection}&pareto=1")
    expect(page.get_by_role("checkbox", name="Pareto line")).to_be_checked()
    expect(page.locator(".pareto-line")).to_have_count(0)
    assert "NaN" not in page.locator("#chart").inner_html()
    assert "Infinity" not in page.locator("#chart").inner_html()


def test_pareto_keyboard_toggle_preserves_family_lines_and_pins(
    page: Page, report_file: Path
) -> None:
    """The overlay never changes family curves or intercepts node interactions."""
    page.goto(report_file.as_uri())
    family_lines = page.locator(".series path").evaluate_all(
        "paths => paths.map(path => path.getAttribute('d'))"
    )
    checkbox = page.get_by_role("checkbox", name="Pareto line")
    checkbox.focus()
    checkbox.press("Space")
    expect(page.locator(".pareto-line")).to_have_count(1)
    frontier = page.locator(".pareto-line").get_attribute("d")
    node(page, "demo-gpt-high").click()
    expect(page.locator("#pin-status")).to_contain_text("GPT")
    expect(page.locator(".pareto-line")).to_have_attribute("d", frontier)
    checkbox.focus()
    checkbox.press("Space")
    expect(page.locator(".pareto-line")).to_have_count(0)
    expect(page.locator("#pin-status")).to_contain_text("GPT")
    assert (
        page.locator(".series path").evaluate_all(
            "paths => paths.map(path => path.getAttribute('d'))"
        )
        == family_lines
    )
    assert "pareto=0" in page.url


def test_pareto_url_state_survives_reload_and_history(
    page: Page, pareto_report: Path
) -> None:
    """Bookmarks and same-page history restore both the checkbox and overlay."""
    page.goto(pareto_report.as_uri() + "?pareto=1&unrelated=keep")
    checkbox = page.get_by_role("checkbox", name="Pareto line")
    expect(checkbox).to_be_checked()
    expect_frontier(page, ["premium", "middle", "cheap", "zero"])
    checkbox.uncheck()
    assert "pareto=0" in page.url
    assert "unrelated=keep" in page.url
    page.reload()
    expect(checkbox).not_to_be_checked()
    expect(page.locator(".pareto-line")).to_have_count(0)
    page.evaluate(
        """() => {
          const url = new URL(location.href);
          url.searchParams.set('pareto', '1');
          history.pushState(null, '', url);
          dispatchEvent(new PopStateEvent('popstate'));
        }"""
    )
    expect(checkbox).to_be_checked()
    expect_frontier(page, ["premium", "middle", "cheap", "zero"])
    page.go_back()
    expect(checkbox).not_to_be_checked()
    expect(page.locator(".pareto-line")).to_have_count(0)


@pytest.mark.parametrize("enabled", [False, True])
def test_pareto_saved_html_and_url_override(
    page: Page, pareto_report: Path, tmp_path: Path, enabled: bool
) -> None:
    """Saved HTML/JSON retain the option; an explicit URL overrides saved state."""
    page.goto(pareto_report.as_uri() + f"?pareto={int(enabled)}")
    with page.expect_download() as download:
        page.locator("#save-html").click()
    saved = tmp_path / "pareto-shared.html"
    download.value.save_as(saved)
    page.goto(saved.as_uri())
    checkbox = page.get_by_role("checkbox", name="Pareto line")
    expect(checkbox).to_be_checked(checked=enabled)
    expect(page.locator(".pareto-line")).to_have_count(int(enabled))
    with page.expect_download() as download:
        page.locator("#export-json").click()
    exported = tmp_path / "pareto.json"
    download.value.save_as(exported)
    payload = json.loads(exported.read_text(encoding="utf-8"))
    assert payload["savedState"]["pareto"] is enabled
    page.goto(saved.as_uri() + f"?pareto={int(not enabled)}")
    expect(checkbox).to_be_checked(checked=not enabled)
    expect(page.locator(".pareto-line")).to_have_count(int(not enabled))


def effective_opacities(page: Page, selector: str) -> list[float]:
    """Include ancestor opacity so a bright node inside a faded family fails."""
    return page.locator(selector).evaluate_all(
        """elements => elements.map(element => {
          let opacity = 1;
          for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
            opacity *= Number(getComputedStyle(ancestor).opacity);
          }
          return opacity;
        })"""
    )


@pytest.mark.parametrize(
    ("slug", "opacity"),
    [
        ("zero", 1),
        ("cheap", 1),
        ("middle", 1),
        ("middle-twin", 1),
        ("premium", 1),
        ("dominated", 0.25),
        ("tied-cost", 0.25),
        ("tied-score", 0.25),
    ],
)
def test_pareto_focus_dims_only_nonfrontier_nodes_and_labels(
    page: Page, pareto_report: Path, slug: str, opacity: float
) -> None:
    """Frontier nodes, including exact ties and mixed families, stay fully vivid."""
    page.goto(pareto_report.as_uri() + "?pareto=1")
    selector = f'.node[data-slug="{slug}"]'
    assert effective_opacities(page, selector) == [opacity]
    assert effective_opacities(page, selector + " .effort-label") == [opacity]


def test_pareto_line_stands_out_from_context(page: Page, pareto_report: Path) -> None:
    """A thick yellow line with a dark outline outranks faded family context."""
    page.goto(pareto_report.as_uri() + "?pareto=1")
    assert effective_opacities(page, ".series path") == [0.2]
    expect(page.locator(".family-label").filter(has_text="Mixed family")).to_have_css(
        "opacity", "1"
    )
    expect(page.locator(".family-label").filter(has_text="dominated")).to_have_css(
        "opacity", "0.25"
    )
    style = page.locator(".pareto-line").evaluate(
        """line => {
          const rgb = color => color.match(/[0-9.]+/g).slice(0, 3).map(Number);
          const luminance = channels => channels.map(value => {
            const c = value / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
          const style = getComputedStyle(line);
          const foreground = luminance(rgb(style.stroke));
          const background = luminance(rgb(
            getComputedStyle(document.querySelector('.chart-card')).backgroundColor));
          return {color: rgb(style.stroke), width: Number.parseFloat(style.strokeWidth),
            contrast: (Math.max(foreground, background) + 0.05)
              / (Math.min(foreground, background) + 0.05)};
        }"""
    )
    assert style["color"][0] >= 240
    assert style["color"][1] >= 200
    assert style["color"][2] <= 100
    assert style["contrast"] >= 7
    assert style["width"] >= 4
    outline = page.locator(".pareto-outline")
    expect(outline).to_have_count(1)
    expect(outline).to_have_attribute(
        "d", page.locator(".pareto-line").get_attribute("d")
    )
    assert (
        outline.evaluate(
            "path => Number.parseFloat(getComputedStyle(path).strokeWidth)"
        )
        > style["width"]
    )
    assert outline.evaluate("path => getComputedStyle(path).pointerEvents") == "none"


def test_pareto_keeps_keyboard_access_and_restores_normal_view(
    page: Page, pareto_report: Path
) -> None:
    """Keyboard focus, pin, clear, and toggle-off preserve deliberate exploration."""
    page.goto(pareto_report.as_uri() + "?pareto=1")
    dominated = '.node[data-slug="dominated"]'
    mixed = '.node[data-slug="tied-score"]'
    node(page, "dominated").focus()
    expect(page.locator("#tooltip")).to_contain_text("Dominated")
    assert effective_opacities(page, dominated) == [1]
    assert effective_opacities(page, '.node[data-slug="middle"]') == [1]
    page.get_by_role("checkbox", name="Pareto line").focus()
    assert effective_opacities(page, dominated) == [0.25]
    node(page, "tied-score").focus()
    node(page, "tied-score").press("Space")
    page.get_by_role("checkbox", name="Pareto line").focus()
    expect(page.locator("#pin-status")).to_contain_text("Mixed family")
    assert effective_opacities(page, mixed) == [1]
    assert effective_opacities(page, '.node[data-slug="cheap"]') == [1]
    assert effective_opacities(page, ".series path") == [1]
    page.locator("#clear-highlight").click()
    assert effective_opacities(page, mixed) == [0.25]
    assert effective_opacities(page, ".series path") == [0.2]
    page.get_by_role("checkbox", name="Pareto line").uncheck()
    expect(page.locator(".pareto-line, .pareto-outline")).to_have_count(0)
    assert effective_opacities(page, ".node") == [1] * 8
    assert effective_opacities(page, ".series path") == [1]
    assert all(value == 1 for value in effective_opacities(page, ".family-label"))


def test_pareto_focus_marks_all_coincident_frontier_nodes_without_a_line(
    page: Page, pareto_report: Path
) -> None:
    """A lone frontier location still distinguishes tied models from dominated ones."""
    page.goto(pareto_report.as_uri() + "?pareto=1&models=middle,middle-twin,tied-score")
    expect(page.locator(".pareto-line, .pareto-outline")).to_have_count(0)
    assert effective_opacities(page, '.node[data-slug="middle"]') == [1]
    assert effective_opacities(page, '.node[data-slug="middle-twin"]') == [1]
    assert effective_opacities(page, '.node[data-slug="tied-score"]') == [0.25]


@pytest.fixture
def pointer_report() -> Iterator[Path]:
    """Place a later-painted dominated node over two nearby frontier hit areas."""
    records = [
        ("front-a", "Frontier A (High Effort)", "high", 1, 80),
        ("front-b", "Frontier B (Low Effort)", "low", 0.99, 79.5),
        ("blocked", "Dominated (Medium Effort)", "medium", 1.005, 79.8),
    ]
    models = normalize(
        [
            {
                "slug": slug,
                "name": name,
                "provider": "anthropic",
                "series": slug,
                "effort": effort,
                "scores": {"intelligence": score},
                "cost_per_task": {"intelligence": cost},
            }
            for slug, name, effort, cost, score in records
        ]
    )
    config = load_config(BASE / "defaults.json")
    config.update(
        benchmark="intelligence", x="cost", models=[slug for slug, *_ in records]
    )
    path = generate(models, config, source="Synthetic pointer test fixture", demo=True)
    yield path
    path.unlink(missing_ok=True)


def node_center(page: Page, slug: str) -> dict[str, float]:
    """Locate the visible dot in viewport coordinates, not its larger group box."""
    dot = node(page, slug).locator(".dot")
    return dot.evaluate(
        """dot => {
          const point = new DOMPoint(Number(dot.getAttribute('cx')),
            Number(dot.getAttribute('cy'))).matrixTransform(dot.getScreenCTM());
          return {x: point.x, y: point.y};
        }"""
    )


@pytest.mark.parametrize(
    ("slug", "name", "effort"),
    [
        ("front-a", "Frontier A (High Effort)", "HIGH"),
        ("front-b", "Frontier B (Low Effort)", "LOW"),
    ],
)
def test_pareto_mouse_targets_the_visible_frontier_dot(
    page: Page, pointer_report: Path, slug: str, name: str, effort: str
) -> None:
    """Neither an overlapping faded node nor a nearby yellow node steals input."""
    page.goto(pointer_report.as_uri() + "?pareto=1")
    position = node_center(page, slug)
    page.mouse.move(**position)
    expect(page.locator("#tooltip strong")).to_have_text(name)
    expect(page.locator("#tooltip .muted")).to_contain_text(effort)
    page.mouse.click(**position)
    expect(node(page, slug)).to_have_attribute("aria-pressed", "true")
    expect(node(page, "blocked")).to_have_attribute("aria-pressed", "false")


def test_pareto_mouse_targets_restore_when_unchecked(
    page: Page, pointer_report: Path
) -> None:
    """Normal hit areas and faded-model mouse access return after toggling off."""
    page.goto(pointer_report.as_uri())
    position = node_center(page, "front-a")
    page.mouse.move(**position)
    expect(page.locator("#tooltip strong")).to_have_text("Dominated (Medium Effort)")
    checkbox = page.get_by_role("checkbox", name="Pareto line")
    checkbox.check()
    page.mouse.move(**node_center(page, "front-a"))
    expect(page.locator("#tooltip strong")).to_have_text("Frontier A (High Effort)")
    checkbox.uncheck()
    page.mouse.move(**node_center(page, "front-a"))
    expect(page.locator("#tooltip strong")).to_have_text("Dominated (Medium Effort)")
    page.mouse.click(**node_center(page, "front-a"))
    expect(node(page, "blocked")).to_have_attribute("aria-pressed", "true")


def test_pareto_ignores_distant_padding_and_effort_labels(
    page: Page, pointer_report: Path
) -> None:
    """Only the area near a yellow dot, not its label or old padding, triggers it."""
    page.goto(pointer_report.as_uri() + "?pareto=1")
    position = node_center(page, "front-a")
    scale = page.locator("#chart").evaluate("svg => svg.getScreenCTM().a")
    page.mouse.move(position["x"] - 14 * scale, position["y"])
    expect(page.locator("#tooltip")).to_be_hidden()
    label = node(page, "front-a").locator(".effort-label").bounding_box()
    assert label is not None
    page.mouse.move(label["x"] + label["width"] / 2, label["y"] + label["height"] / 2)
    expect(page.locator("#tooltip")).to_be_hidden()


def test_pareto_nonfrontier_nodes_stay_mouse_inert_when_their_family_is_revealed(
    page: Page, pareto_report: Path
) -> None:
    """Keyboard inspection can reveal a family without re-enabling its mouse traps."""
    page.goto(pareto_report.as_uri() + "?pareto=1")
    node(page, "middle").focus()
    node(page, "middle").press("Enter")
    expect(node(page, "middle")).to_have_attribute("aria-pressed", "true")
    assert effective_opacities(page, '.node[data-slug="tied-score"]') == [1]
    page.mouse.move(**node_center(page, "tied-score"))
    page.mouse.click(**node_center(page, "tied-score"))
    expect(node(page, "middle")).to_have_attribute("aria-pressed", "true")
    expect(node(page, "tied-score")).to_have_attribute("aria-pressed", "false")
    expect(page.locator("#tooltip strong")).to_have_text("Middle")
    page.locator("#clear-highlight").click()
    node(page, "tied-score").focus()
    node(page, "tied-score").press("Space")
    expect(node(page, "tied-score")).to_have_attribute("aria-pressed", "true")
