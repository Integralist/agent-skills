"""Exercise the generated HTML in Chrome, with Chart.js config capture offline."""

from __future__ import annotations

from collections.abc import Iterator
from colorsys import rgb_to_hsv
from datetime import UTC, datetime, timezone
from itertools import combinations
from pathlib import Path

import pytest
import report
from playwright.sync_api import Browser, Page, expect, sync_playwright
from report import Usage

# Capture chart options offline without depending on the Chart.js CDN.
CHART_CAPTURE = """
window.chartConfigs = {};
window.Chart = class {
  static defaults = { font: {} };
  static instances = new Map();
  static getChart(id) { return this.instances.get(id); }
  constructor(canvas, config) {
    this.canvas = canvas;
    this.id = canvas.id;
    this.config = config;
    this.data = config.data;
    this.hiddenDatasets = new Set();
    this.hiddenItems = new Set();
    window.chartConfigs[this.id] = config;
    window.Chart.instances.set(this.id, this);
  }
  isDatasetVisible(index) { return !this.hiddenDatasets.has(index); }
  setDatasetVisibility(index, visible) {
    if (visible) this.hiddenDatasets.delete(index); else this.hiddenDatasets.add(index);
  }
  getDataVisibility(index) { return !this.hiddenItems.has(index); }
  toggleDataVisibility(index) {
    if (this.hiddenItems.has(index)) this.hiddenItems.delete(index); else this.hiddenItems.add(index);
  }
  update() {}
  destroy() { delete window.chartConfigs[this.id]; window.Chart.instances.delete(this.id); }
};
"""


@pytest.fixture(scope="module")
def browser() -> Iterator[Browser]:
    with sync_playwright() as playwright:
        instance = playwright.chromium.launch(channel="chrome")
        yield instance
        instance.close()


@pytest.fixture
def page(browser: Browser) -> Iterator[Page]:
    context = browser.new_context(offline=True, timezone_id="America/Los_Angeles")
    # Inject the capture stub directly; a fake CDN response fails the report's SRI check.
    context.add_init_script(CHART_CAPTURE)
    context.route("https://**", lambda route: route.abort())
    page = context.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    yield page
    context.close()
    assert errors == []


@pytest.mark.parametrize("theme", ["anthropic", "fastly"])
def test_mode_switch_redraws_charts_and_keeps_metric(
    page: Page, tmp_path: Path, theme: str
) -> None:
    """Canvas charts pick up mode colours without reverting a Tokens selection."""
    now = datetime(2026, 3, 3, 12, tzinfo=UTC)
    data = report.build_report(
        [Usage("pi", "s1", "project", "gpt-5.5", "high", now, 10, 5, 0, 0, cost=2.0)],
        {},
        "all",
        now,
    )
    path = tmp_path / "report.html"
    path.write_text(
        report.render_html(
            data, report.TEMPLATE.read_text(encoding="utf-8"), theme=theme
        ),
        encoding="utf-8",
    )
    page.goto(path.as_uri())
    page.wait_for_function("window.chartConfigs['c-provider']")
    page.get_by_role("button", name="Tokens", exact=True).click()
    page.get_by_label("Appearance").select_option("light")
    page.evaluate("""() => {
      Chart.getChart('c-provider').toggleDataVisibility(0);
      Chart.getChart('c-model-effort').setDatasetVisibility(0, false);
    }""")
    before = page.evaluate("window.chartConfigs['c-provider'].data")
    page.get_by_label("Appearance").select_option("dark")
    after = page.evaluate("window.chartConfigs['c-provider'].data")
    assert before["datasets"][0]["data"] == after["datasets"][0]["data"]
    assert page.evaluate("Chart.getChart('c-provider').getDataVisibility(0)") is False
    assert (
        page.evaluate("Chart.getChart('c-model-effort').isDatasetVisible(0)") is False
    )
    assert (
        before["datasets"][0]["backgroundColor"]
        != after["datasets"][0]["backgroundColor"]
    )
    expect(page.get_by_role("button", name="Tokens", exact=True)).to_have_attribute(
        "aria-pressed", "true"
    )
    page.set_viewport_size({"width": 320, "height": 800})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@pytest.mark.parametrize("theme", ["anthropic", "fastly"])
def test_print_redraws_dark_canvas_text_and_restores_screen(
    page: Page, tmp_path: Path, theme: str
) -> None:
    """Printing resolves light text roles and preserves hidden legend items."""
    now = datetime(2026, 3, 3, 12, tzinfo=UTC)
    data = report.build_report(
        [Usage("pi", "s1", "project", "gpt-5.5", "high", now, 10, 5, 0, 0, cost=2.0)],
        {},
        "all",
        now,
    )
    path = tmp_path / "report.html"
    path.write_text(
        report.render_html(
            data, report.TEMPLATE.read_text(encoding="utf-8"), theme=theme
        ),
        encoding="utf-8",
    )
    page.goto(path.as_uri())
    page.get_by_label("Appearance").select_option("dark")
    page.evaluate("Chart.getChart('c-provider').toggleDataVisibility(0)")
    dark = page.evaluate("Chart.defaults.color")
    # Chrome fires beforeprint before activating print-media CSS.
    page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    page.emulate_media(media="print")
    light = page.evaluate("Chart.defaults.color")
    expected = page.evaluate(
        "getComputedStyle(document.documentElement).getPropertyValue('--d-muted').trim()"
    )
    assert light == expected
    assert light != dark
    assert page.evaluate("Chart.getChart('c-provider').getDataVisibility(0)") is False
    expect(page.get_by_label("Appearance")).not_to_be_visible()
    page.emulate_media(media="screen")
    page.evaluate("window.dispatchEvent(new Event('afterprint'))")
    assert page.evaluate("Chart.defaults.color") == dark
    assert page.evaluate("Chart.getChart('c-provider').getDataVisibility(0)") is False


@pytest.mark.parametrize("theme", ["anthropic", "fastly"])
@pytest.mark.parametrize("mode", ["light", "dark"])
def test_rendered_heatmap_and_effort_hues_remain_distinct(
    page: Page, tmp_path: Path, theme: str, mode: str
) -> None:
    """Read resolved palette roles, not the location or syntax of CSS blocks."""
    now = datetime(2026, 3, 3, 12, tzinfo=UTC)
    data = report.build_report(
        [Usage("pi", "s1", "project", "gpt-5.5", "high", now, 10, 5, 0, 0)],
        {},
        "all",
        now,
    )
    path = tmp_path / "report.html"
    path.write_text(
        report.render_html(
            data, report.TEMPLATE.read_text(encoding="utf-8"), theme=theme
        ),
        encoding="utf-8",
    )
    page.goto(path.as_uri())
    page.get_by_label("Appearance").select_option(mode)
    colours = page.evaluate("""() => {
      const css = getComputedStyle(document.documentElement);
      const read = key => css.getPropertyValue(key).trim();
      return {
        heat: [0, 1, 2, 3, 4].map(i => read('--heat-' + i)),
        effort: [1, 2, 3, 4, 5, 6, 7].map(i => read('--e' + i)),
      };
    }""")
    for group, values in colours.items():
        assert len(set(values)) == len(values)
        hues = []
        for index, value in enumerate(values):
            rgb = tuple(int(value[i : i + 2], 16) / 255 for i in (1, 3, 5))
            hue, saturation, _ = rgb_to_hsv(*rgb)
            if group == "heat" and index == 0:
                assert saturation <= 0.35, "No activity needs a neutral colour"
                continue
            if group == "heat" or index in (2, 4, 5):
                assert saturation >= (0.4 if group == "heat" else 0.25)
                hues.append(hue)
        for first, second in combinations(hues, 2):
            gap = abs(first - second)
            assert min(gap, 1 - gap) * 360 >= (25 if group == "heat" else 45)


@pytest.mark.parametrize(
    ("period", "labels", "costs"),
    [
        ("day", ["Mar 2026"], [13.0]),
        ("week", ["Feb 2026", "Mar 2026"], [7.0, 24.0]),
        ("month", ["Mar 2026"], [24.0]),
        (
            "year",
            [
                "Apr 2025",
                "May 2025",
                "Jun 2025",
                "Jul 2025",
                "Aug 2025",
                "Sep 2025",
                "Oct 2025",
                "Nov 2025",
                "Dec 2025",
                "Jan 2026",
                "Feb 2026",
                "Mar 2026",
            ],
            [0.0] * 8 + [5.0, 0.0, 7.0, 24.0],
        ),
        (
            "all",
            ["Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"],
            [5.0, 0.0, 7.0, 24.0],
        ),
    ],
)
def test_monthly_cost_chart_stays_in_usd_when_tokens_selected(
    page: Page, tmp_path: Path, period: str, labels: list[str], costs: list[float]
) -> None:
    now = datetime(2026, 3, 3, 12, tzinfo=timezone.utc)
    usages = [
        Usage("pi", "s1", "project", "gpt-5.5", "high", at, 10, 5, 0, 0, cost=cost)
        for at, cost in [
            (datetime(2025, 12, 1, tzinfo=timezone.utc), 5.0),
            (datetime(2026, 2, 25, tzinfo=timezone.utc), 7.0),
            (datetime(2026, 3, 1, tzinfo=timezone.utc), 11.0),
            (now, 13.0),
        ]
    ]
    data = report.build_report(usages, {}, period, now)
    html = report.render_html(data, report.TEMPLATE.read_text(encoding="utf-8"))
    path = tmp_path / "report.html"
    path.write_text(html, encoding="utf-8")
    page.goto(path.as_uri())
    expect(
        page.get_by_role("heading", name="Cost per month", exact=True)
    ).to_be_visible()
    page.wait_for_function(
        "window.chartConfigs && window.chartConfigs['c-monthly-cost']", timeout=5000
    )
    expect(page.locator("#c-monthly-cost")).to_be_visible()

    def chart_data() -> dict[str, object]:
        return page.evaluate("""() => {
          const config = window.chartConfigs['c-monthly-cost'];
          return {
            type: config.type,
            labels: config.data.labels,
            costs: config.data.datasets[0].data,
            axis: config.options.scales.y.ticks.callback(1234.5),
            tooltip: config.options.plugins.tooltip.callbacks.label({
              dataset: config.data.datasets[0], label: 'Mar 2026', raw: 12.34
            })
          };
        }""")

    expected = {
        "type": "bar",
        "labels": labels,
        "costs": costs,
        "axis": "$1234.50",
        "tooltip": " Mar 2026: $12.34",
    }
    assert chart_data() == expected
    page.get_by_role("button", name="Tokens", exact=True).click()
    assert chart_data() == expected
    page.get_by_role("button", name="Cost", exact=True).click()
    assert chart_data() == expected


@pytest.mark.parametrize("period", ["month", "year"])
def test_empty_report_has_no_broken_monthly_chart(
    page: Page, tmp_path: Path, period: str
) -> None:
    data = report.build_report(
        [], {}, period, datetime(2026, 3, 3, tzinfo=timezone.utc)
    )
    path = tmp_path / "empty.html"
    path.write_text(
        report.render_html(data, report.TEMPLATE.read_text(encoding="utf-8")),
        encoding="utf-8",
    )
    page.goto(path.as_uri())
    expect(
        page.get_by_text("No usage found for this period.", exact=True)
    ).to_be_visible()
    assert page.locator("#c-monthly-cost").count() == 0
