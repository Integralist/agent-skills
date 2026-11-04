.PHONY: test test-unit test-browser check
export PYTHONDONTWRITEBYTECODE := 1

test: test-unit test-browser

test-unit:
	@uv run --with pytest --with playwright python -m pytest -q -p no:cacheprovider tests/test_design.py -k contract

test-browser:
	@uv run --with pytest --with playwright python -m pytest -q -p no:cacheprovider tests/test_design.py -k 'not contract'

check:
	@uvx ruff check tests
	@uvx ruff format --check tests
	@uvx --with pytest --with playwright mypy --follow-imports=silent tests/test_design.py
	@node --check ../shared/design-mode.js
