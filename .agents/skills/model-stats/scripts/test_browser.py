"""Exercise the generated HTML in Chrome, with Chart.js config capture offline."""

from __future__ import annotations

from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path

import pytest
import report
from playwright.sync_api import Browser, Page, expect, sync_playwright
from report import Usage

CHART_CAPTURE = """
window.chartConfigs = {};
window.Chart = class {
  static defaults = { font: {} };
  constructor(canvas, config) {
    this.id = canvas.id;
    window.chartConfigs[this.id] = config;
  }
  destroy() { delete window.chartConfigs[this.id]; }
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
