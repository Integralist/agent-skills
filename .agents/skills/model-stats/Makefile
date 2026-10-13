.PHONY: test test-unit test-browser
export PYTHONDONTWRITEBYTECODE := 1

test: test-unit test-browser

test-unit:
	@uvx pytest -q -p no:cacheprovider scripts/test_report.py

test-browser:
	@uvx --with playwright pytest -q -p no:cacheprovider scripts/test_browser.py
