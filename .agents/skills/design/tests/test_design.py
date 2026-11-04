"""Verify discovery, conditional references, and the shared HTML theme contract."""

import re
from collections.abc import Iterator
from pathlib import Path

import pytest
from playwright.sync_api import Browser, Page, expect, sync_playwright

# Skill and shared paths also work after the normal skills-tree installation.
BASE = Path(__file__).resolve().parents[1]
SHARED = BASE.parent / "shared"


def test_contract_model_invocation_and_conditional_references() -> None:
    """Visual work is discoverable without loading every theme and format."""
    skill = BASE / "SKILL.md"
    assert skill.is_file(), "The auto-triggered design skill must exist"
    text = skill.read_text(encoding="utf-8")
    assert "disable-model-invocation: true" not in text
    assert "model-tier: complex" in text
    assert len(text.encode("utf-8")) < 4000
    for target in re.findall(r"\]\((\.\./shared/[^)#]+)", text):
        assert (BASE / target).is_file(), target
    assert "DESIGN-ANTHROPIC.md" in text
    assert "DESIGN-FASTLY.md" in text
    assert "DESIGN-HTML.md" in text
    assert "DESIGN-SLIDES.md" in text


@pytest.fixture(scope="module")
def browser() -> Iterator[Browser]:
    """Use the installed Chrome, matching the existing report suites."""
    with sync_playwright() as playwright:
        instance = playwright.chromium.launch(channel="chrome")
        yield instance
        instance.close()


@pytest.fixture
def page(browser: Browser) -> Iterator[Page]:
    """Keep local theme tests offline and fail on JavaScript exceptions."""
    context = browser.new_context(offline=True, color_scheme="light")
    tab = context.new_page()
    errors: list[str] = []
    tab.on("pageerror", lambda error: errors.append(str(error)))
    yield tab
    context.close()
    assert errors == []


def write_preview(tmp_path: Path, theme: str, mode: str = "") -> Path:
    """Exercise the shipped CSS and script, not a second implementation."""
    css = "\n".join(
        (SHARED / name).read_text(encoding="utf-8")
        for name in (f"design-{theme}.css", "design-charts.css", "design.css")
    )
    script = (SHARED / "design-mode.js").read_text(encoding="utf-8")
    mode_attribute = f' data-mode="{mode}"' if mode else ""
    target = tmp_path / "preview.html"
    target.write_text(
        f'<!doctype html><html lang="en" data-design="{theme}"{mode_attribute}>'
        f'<head><meta name="color-scheme" content="light dark"><style>{css}</style>'
        '</head><body><label>Appearance <select id="design-mode">'
        '<option value="system">System</option><option value="light">Light</option>'
        '<option value="dark">Dark</option></select></label>'
        "<h1>Theme preview</h1><p>Readable body text</p>"
        '<button>Secondary action</button><button class="design-primary">Save view</button>'
        f"<script>{script}</script></body></html>",
        encoding="utf-8",
    )
    return target


@pytest.mark.parametrize("theme", ["anthropic", "fastly"])
def test_mode_switch_overrides_system_and_restores_it(
    page: Page, tmp_path: Path, theme: str
) -> None:
    """Explicit choices beat the OS; System follows live OS changes."""
    page.goto(write_preview(tmp_path, theme).as_uri())
    control = page.get_by_label("Appearance")
    expect(control).to_have_value("system")
    assert (
        page.locator("html").evaluate("el => getComputedStyle(el).colorScheme")
        == "light"
    )
    control.select_option("dark")
    assert (
        page.locator("html").evaluate("el => getComputedStyle(el).colorScheme")
        == "dark"
    )
    page.reload()
    expect(control).to_have_value("dark")
    page.emulate_media(color_scheme="dark")
    control.select_option("light")
    assert (
        page.locator("html").evaluate("el => getComputedStyle(el).colorScheme")
        == "light"
    )
    control.select_option("system")
    assert (
        page.locator("html").evaluate("el => getComputedStyle(el).colorScheme")
        == "dark"
    )
    page.emulate_media(color_scheme="light")
    assert (
        page.locator("html").evaluate("el => getComputedStyle(el).colorScheme")
        == "light"
    )


@pytest.mark.parametrize("theme", ["anthropic", "fastly"])
@pytest.mark.parametrize("mode", ["light", "dark"])
def test_text_and_controls_have_accessible_contrast(
    page: Page, tmp_path: Path, theme: str, mode: str
) -> None:
    """Both themes retain readable text, links, controls, and focus rings."""
    page.goto(write_preview(tmp_path, theme, mode).as_uri())
    ratios = page.evaluate(
        """() => {
          const css = getComputedStyle(document.documentElement);
          const rgb = value => value.match(/[\\d.]+/g).slice(0, 3).map(Number);
          const luminance = value => rgb(value).map(v => {
            const c = v / 255;
            return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
          }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
          const contrast = (a, b) => {
            const x = luminance(a), y = luminance(b);
            return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
          };
          const sample = document.createElement('span');
          document.body.append(sample);
          const token = name => {
            sample.style.color = css.getPropertyValue('--d-' + name).trim();
            return getComputedStyle(sample).color;
          };
          return [
            contrast(token('text'), token('page')),
            contrast(token('muted'), token('page')),
            contrast(token('muted'), token('surface')),
            contrast(token('accent-text'), token('page')),
            contrast(token('on-accent'), token('accent')),
          ];
        }"""
    )
    assert all(ratio >= 4.5 for ratio in ratios), ratios
    page.get_by_label("Appearance").focus()
    assert (
        page.get_by_label("Appearance").evaluate(
            "el => getComputedStyle(el).outlineStyle"
        )
        != "none"
    )
    page.emulate_media(media="print")
    assert (
        page.locator("html").evaluate("el => getComputedStyle(el).colorScheme")
        == "light"
    )
    expect(page.get_by_label("Appearance")).not_to_be_visible()


def test_mode_switch_works_when_storage_is_blocked(page: Page, tmp_path: Path) -> None:
    """A privacy restriction must not disable appearance controls."""
    page.add_init_script(
        """Object.defineProperty(window, 'localStorage', {
          get() { throw new DOMException('Blocked', 'SecurityError'); }
        });"""
    )
    page.goto(write_preview(tmp_path, "anthropic").as_uri())
    page.get_by_label("Appearance").select_option("dark")
    expect(page.locator("html")).to_have_attribute("data-mode", "dark")


def test_invalid_preferences_fall_back_to_system(page: Page, tmp_path: Path) -> None:
    """Invalid stored, embedded, or control values cannot select an unknown mode."""
    page.add_init_script("localStorage.setItem('design-mode:anthropic', 'sepia')")
    page.goto(write_preview(tmp_path, "anthropic", "invalid").as_uri())
    expect(page.get_by_label("Appearance")).to_have_value("system")
    page.get_by_label("Appearance").evaluate("""el => {
      el.value = 'sepia';
      el.dispatchEvent(new Event('change'));
    }""")
    expect(page.locator("html")).to_have_attribute("data-mode", "system")


def test_controller_without_control_still_follows_system(
    page: Page, tmp_path: Path
) -> None:
    """A missing appearance control cannot crash the shared initializer."""
    path = write_preview(tmp_path, "anthropic")
    path.write_text(
        path.read_text(encoding="utf-8").replace('id="design-mode"', 'id="other-mode"'),
        encoding="utf-8",
    )
    page.goto(path.as_uri())
    page.emulate_media(color_scheme="dark")
    assert (
        page.locator("html").evaluate("el => getComputedStyle(el).colorScheme")
        == "dark"
    )


def test_saved_html_mode_wins_over_stored_preference(
    page: Page, tmp_path: Path
) -> None:
    """A portable HTML view keeps its explicit appearance when reopened."""
    page.goto(write_preview(tmp_path, "anthropic", "dark").as_uri())
    page.get_by_label("Appearance").select_option("light")
    page.reload()
    expect(page.get_by_label("Appearance")).to_have_value("dark")
