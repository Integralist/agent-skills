.PHONY: test test-unit test-browser check report preview
UV ?= uv
export PYTHONDONTWRITEBYTECODE := 1

test: test-unit test-browser

test-unit:
	@$(UV) run --with pytest python -m pytest -q -p no:cacheprovider tests/test_report.py

test-browser:
	@$(UV) run --with pytest --with playwright python -m pytest -q -p no:cacheprovider tests/test_browser.py

check:
	@uvx ruff check scripts tests
	@uvx ruff format --check scripts tests
	@uvx mypy scripts/report.py
	@node --check assets/app.js

report:
	@python3 scripts/report.py --op-account my.1password.com \
		--op-reference "op://Programming/zvrrcqni5d622eqhdt572w34da/credential" $(ARGS)

preview:
	@python3 scripts/report.py --demo --benchmark intelligence --x cost
