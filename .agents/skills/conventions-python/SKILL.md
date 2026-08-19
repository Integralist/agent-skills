---
name: conventions-python
description: >-
  MANDATORY for any work on Python files (*.py). Load this before editing,
  reviewing, or creating any *.py file. Python coding conventions and style
  guide covering modern typing, tooling (ruff, mypy, uv), project structure,
  error handling, and testing.
---

> [!NOTE]
> If you were invoked directly (e.g. `/conventions-python`) with no specific
> task, just read this skill so its conventions are loaded into context, then
> stop — there is nothing to do yet. They're now ready to apply when I
> ask you to design, write, or edit Python code.

Target modern Python (3.10+) unless the repository specifies an older runtime in
`pyproject.toml` or `.python-version`. Match existing patterns when editing an
established project.

## Tooling

### Project & Package Management (`uv`)

Use `uv` for package management, virtual environments, and running project
scripts:

```bash
uv venv                       # create virtual environment
uv sync                       # sync dependencies from lockfile
uv add <package>              # add dependency
uv add --dev <package>        # add development dependency
uv run <command>              # execute command within environment
```

### Formatting & Linting (`ruff`)

Use `ruff` as the single tool for formatting, linting, and import sorting:

```bash
# Format code (replaces black)
ruff format .

# Lint and auto-fix safe rules (replaces flake8, isort, pyupgrade)
ruff check --fix .

# Preview lint violations without fixing
ruff check .
```

### Type Checking (`mypy` / `pyright`)

Run static type checking across the codebase:

```bash
# Using mypy
uv run mypy .

# Using pyright (if configured in repo)
uv run pyright .
```

### Testing (`pytest`)

Run tests with `pytest`:

```bash
uv run pytest
uv run pytest path/to/test_file.py -k "test_filter"
```

## Configuration (`pyproject.toml`)

Consolidate tool configuration in `pyproject.toml`:

```toml
[project]
name = "my-project"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []

[tool.ruff]
target-version = "py311"
line-length = 88

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "UP",  # pyupgrade
    "RUF", # ruff-specific rules
]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
```

## Type Annotations

Always annotate function arguments and return types for public functions and
methods.

- **Union syntax (PEP 604):** Use `X | Y` and `X | None`. Do not use
  `typing.Union` or `typing.Optional`.
- **Built-in collections (PEP 585):** Use `list[str]`, `dict[str, int]`,
  `set[bytes]`, `tuple[int, ...]`. Do not use `typing.List`, `typing.Dict`,
  `typing.Set`, `typing.Tuple`.
- **Abstract collections:** Import from `collections.abc` (`Iterable`,
  `Sequence`, `Mapping`, `Callable`, `Awaitable`), not `typing`.
- **Self types (Python 3.11+ / PEP 673):** Use `typing.Self` for method chaining
  or factory methods returning the instance type.
- **Protocols (PEP 544):** Prefer `typing.Protocol` for structural typing and
  interfaces over rigid inheritance hierarchies.
- **Avoid `Any`:** Prefer precise types, `object` (when type is genuinely
  arbitrary), or generic type parameters (`TypeVar`).

```python
from collections.abc import Iterable, Sequence
from typing import Protocol, Self


class Repository(Protocol):
    def fetch_by_id(self, item_id: str) -> dict[str, str] | None: ...


class ConfigBuilder:
    def __init__(self) -> None:
        self._options: dict[str, str] = {}

    def with_option(self, key: str, value: str) -> Self:
        self._options[key] = value
        return self


def process_items(items: Sequence[str]) -> list[str]:
    return [item.strip().lower() for item in items if item]
```

### Suppressing Linter & Type Warnings

Fix root causes instead of suppressing warnings. When suppression is required,
use targeted comments with explicit codes:

- **Ruff:** `# noqa: <RULE_CODE>` (e.g. `# noqa: F401`, `# noqa: E501`)
- **Mypy:** `# type: ignore[<error-code>]` (e.g. `# type: ignore[assignment]`)

## Data Modeling

- **Value objects / Internal state:** Use standard library dataclasses with
  `frozen=True` and `slots=True` for lightweight, immutable data structures.
- **Boundary models / Settings:** Use Pydantic (`pydantic.BaseModel`) for API
  request/response schemas, JSON deserialization, and environment settings.
- **Enumerations:** Use `enum.StrEnum` (Python 3.11+) or `enum.Enum` for fixed
  sets of values.

```python
from dataclasses import dataclass
from enum import StrEnum, auto


class TaskStatus(StrEnum):
    PENDING = auto()
    IN_PROGRESS = auto()
    COMPLETED = auto()


@dataclass(frozen=True, slots=True)
class UserProfile:
    user_id: str
    email: str
    status: TaskStatus = TaskStatus.PENDING
```

## Code Conventions & Idioms

- **Imports:** Group in order: standard library, third-party, local modules. Let
  `ruff check --fix` sort and format them. Never use star imports (`from x
  import *`).
- **Paths:** Always use `pathlib.Path` instead of `os.path` and string
  manipulations:
  ```python
  from pathlib import Path

  config_path = Path("/etc/app") / "config.json"
  content = config_path.read_text(encoding="utf-8")
  ```
- **String interpolation:** Use f-strings (`f"value: {val}"`) exclusively. Avoid
  `%` formatting and `.format()`.
- **Resource management:** Always wrap I/O, database sessions, locks, and
  network handles in `with` or `async with` context managers. Use
  `contextlib.contextmanager` / `asynccontextmanager` when building custom
  managers.
- **Early returns:** Use guard clauses and return early to keep nesting levels
  shallow.

## Error Handling

- **Custom exception hierarchies:** Inherit from `Exception` (never
  `BaseException`). Define a domain base exception for the module or service.
- **Exception chaining:** Always use `raise CustomError(...) from err` to
  preserve the underlying traceback and cause.
- **No bare excepts:** Never write `except:` or `except Exception:` without
  re-raising or logging with full traceback. Catch specific exceptions.

```python
class StorageError(Exception):
    """Base error for storage operations."""


class ItemNotFoundError(StorageError):
    """Raised when an item is missing from storage."""


def load_record(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError as err:
        raise ItemNotFoundError(f"Record at {path} not found") from err
```

## Async & Concurrency

- **Structured concurrency (Python 3.11+):** Use `asyncio.TaskGroup` instead of
  `asyncio.gather` for managing multiple concurrent background tasks safely.
- **Timeouts:** Use `asyncio.timeout(seconds)` context manager (3.11+) rather
  than wrapping tasks in `wait_for`.
- **Blocking I/O:** Never run synchronous I/O or CPU-heavy loops directly inside
  async functions; offload with `asyncio.to_thread`.

```python
import asyncio


async def fetch_item(item_id: str) -> str:
    async with asyncio.timeout(5.0):
        await asyncio.sleep(0.1)
        return f"item-{item_id}"


async def fetch_all(item_ids: list[str]) -> list[str]:
    results: list[str] = []
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_item(i)) for i in item_ids]
    return [task.result() for task in tasks]
```

## Logging & Observability

- Use standard `logging.getLogger(__name__)` or structured logging libraries
  (e.g. `structlog`).
- Never use `print()` for runtime diagnostics, debug statements, or errors.
- Supply arguments to log methods for deferred formatting:
  ```python
  import logging

  logger = logging.getLogger(__name__)

  # Good: deferred evaluation
  logger.info("Processed item %s for user %s", item_id, user_id)

  # Bad: eager interpolation
  logger.info(f"Processed item {item_id} for user {user_id}")
  ```

## Testing (`pytest`)

- Name test files `test_*.py` and test functions `test_*`.
- Use `@pytest.fixture` for test setup and teardown.
- Parameterize test cases with `@pytest.mark.parametrize` instead of writing
  loops inside test functions.
- Verify exceptions using `with pytest.raises(ExpectedException):`.
- Mock external systems using `unittest.mock` or `pytest-mock` (`mocker`
  fixture).

```python
import pytest


def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b


@pytest.mark.parametrize(
    ("a", "b", "expected"),
    [
        (10.0, 2.0, 5.0),
        (9.0, 3.0, 3.0),
        (0.0, 5.0, 0.0),
    ],
)
def test_divide_valid(a: float, b: float, expected: float) -> None:
    assert divide(a, b) == expected


def test_divide_by_zero() -> None:
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        divide(10.0, 0.0)
```
