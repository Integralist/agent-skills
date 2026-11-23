---
name: conventions-python
description: >-
  MANDATORY for any work on Python files (*.py). Load this before editing,
  reviewing, or creating any *.py file. House Python 3.12+ conventions covering
  uv/ruff/mypy tooling, typing, data models, async, logging, and pytest.
metadata:
  model-tier: moderate
---

> [!NOTE]
> If invoked directly with no specific task, load these conventions and stop.

House deltas for Python. Target Python 3.12+ unless `pyproject.toml` or
`.python-version` pins an older runtime. In an established repo, match its
existing patterns.

## Tooling

Use `uv` for environments/dependencies (`uv sync`, `uv add`, `uv run`). Before
finishing Python changes, run (or use the repo's Make/lint targets):

```bash
ruff format .
ruff check --fix .
uv run mypy .   # or `uv run pyright .` where the repo uses it
uv run pytest   # narrow with path or -k when iterating
```

Fix root causes over suppressions; if needed, name exact codes
(`# noqa: F401`, `# type: ignore[assignment]`). For new projects, configure
`pyproject.toml` with `ruff` (`line-length = 88`, rules
`E, W, F, I, B, UP, RUF`), `mypy` (`strict = true`, `warn_return_any = true`,
`warn_unused_configs = true`), and `pytest` (`testpaths = ["tests"]`).

## Comments and docstrings

Give every module, class, function, and method (public or private) a docstring,
and put a comment above every module-level constant and every dataclass or
Pydantic field. State what it is or does and why it exists (constraint, policy,
invariant, or caller need), describing observable effect rather than steps,
and never restating the name.

## Types and data

- Annotate all function parameters and return types. Use modern 3.12+ syntax:
  `X | Y`, built-in generics (`list[str]`), `collections.abc` abstractions
  (`Sequence`, `Mapping`, `Callable`), PEP 695 type parameters
  (`def first[T](items: Sequence[T]) -> T`) and `type UserID = str`, `Self`,
  and `Protocol`. Avoid `Any`; use a precise type, type param, or `object`.
- **Data structures:** `@dataclass(frozen=True, slots=True)` for internal
  values; Pydantic `BaseModel` for boundaries, JSON, and settings; `StrEnum`
  (or `Enum`) for fixed sets.

## Idioms, errors, async, and logging

- Export explicit public APIs via `__all__` in `__init__.py` and multi-module
  packages; no `from x import *`.
- Use `pathlib.Path` (passing `encoding="utf-8"` for text), context managers
  for resources, and guard clauses to keep nesting shallow.
- Give each module/service a base exception inheriting `Exception` (never
  `BaseException`), chain with `raise ... from err`, and avoid bare `except:`.
- Use `asyncio.TaskGroup` (not `gather`), `asyncio.timeout` (not `wait_for`),
  and `asyncio.to_thread` for blocking work.
- Log via `logging.getLogger(__name__)` or `structlog` (never `print()`) with
  lazy `%s` arguments rather than f-strings.

## Testing

- Use `pytest` (`test_*.py`, `test_*`), `@pytest.fixture`,
  `@pytest.mark.parametrize`, `pytest.raises(..., match=...)`, and
  `unittest.mock` / `pytest-mock`. Add a brief docstring on each test stating
  what it proves.
- Test through public APIs—don't import `_`-prefixed internals or assert on
  private attributes. Extract complex internal logic into a focused submodule
  with a public API if needed.
- Put integration tests in `tests/integration/` or `tests/e2e/` against a real
  app instance (e.g. `httpx.AsyncClient` + `ASGITransport`), overriding only
  at wire/storage boundaries.
