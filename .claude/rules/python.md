---
paths:
  - '**/*.py'
---

> [!NOTE]
> If you were invoked directly (e.g. `/conventions-python`) with no specific
> task, just read this skill so its conventions are loaded into context, then
> stop — there is nothing to do yet. They're now ready to apply when I
> ask you to design, write, or edit Python code.

# Python Conventions

Write Python that follows these conventions, and run the tools below after
every edit. When editing an established project, match its existing patterns.

**Python version.** Target Python 3.12+, unless `pyproject.toml` or
`.python-version` pins an older runtime; then use only what that version
supports.

## Tooling

Use `uv` for environments and dependencies (`uv sync`, `uv add <pkg>`,
`uv add --dev <pkg>`) and run everything through `uv run`. After editing, run:

```bash
ruff format .              # format
ruff check --fix .         # lint and sort imports
uv run mypy .              # or `uv run pyright .` where the repo uses it
uv run pytest              # add a path or -k "name" to narrow
```

Fix the cause rather than suppress a warning. When a suppression is
warranted, name the exact code: `# noqa: F401` for ruff, or
`# type: ignore[assignment]` for mypy.

**Configuration.** Keep tool settings in `pyproject.toml`. For a new project,
start from:

```toml
[project]
requires-python = ">=3.12"

[tool.ruff]
target-version = "py312"
line-length = 88

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "UP", "RUF"]

[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
```

## Comments and docstrings

Give every module, class, function, and method a docstring, public or
private, and put a comment above every module-level constant and every
dataclass or Pydantic field. Say what it is or does and why it exists: the
constraint, policy, invariant, or caller need behind it. Describe the result
or observable effect, not the steps taken. Make the why specific; restating
the name adds nothing.

```python
"""Load and cache feature flags so requests don't hit the flag service."""

# DEFAULT_TTL is how long a flag stays cached; short enough that a flipped
# flag takes effect within a minute.
DEFAULT_TTL = 60.0


@dataclass(frozen=True, slots=True)
class Flag:
    """One feature flag, immutable so a cached copy can't drift."""

    # name is the flag's key in the flag service.
    name: str
    # enabled is the value at fetch time; refetch after DEFAULT_TTL.
    enabled: bool


def is_enabled(flags: Mapping[str, Flag], name: str) -> bool:
    """Return whether a flag is on, treating unknown flags as off so a typo
    never enables a feature."""
    flag = flags.get(name)
    return flag is not None and flag.enabled
```

## Types

Annotate every function's arguments and return type.

- Write unions as `X | Y` and `X | None`, not `Union` or `Optional`.
- Use built-in generics (`list[str]`, `dict[str, int]`, `tuple[int, ...]`),
  not `typing.List` and friends, and abstract types (`Iterable`, `Sequence`,
  `Mapping`, `Callable`, `Awaitable`) from `collections.abc`, not `typing`.
- Declare generics with type parameters (`def first[T](items: Sequence[T]) ->
  T`, `class Box[T]:`) and aliases with `type`
  (`type UserID = str`), not `TypeVar` or `TypeAlias`.
- Return `Self` from chaining and factory methods.
- Prefer `Protocol` for interfaces over inheritance hierarchies.
- Avoid `Any`; use a precise type, a type parameter, or `object` when the
  type really is arbitrary.

```python
class Repository(Protocol):
    """Anything that can fetch a record by ID, so services can swap stores."""

    def fetch_by_id(self, item_id: str) -> dict[str, str] | None:
        """Return the record, or None when it doesn't exist."""
        ...


class ConfigBuilder:
    """Collect options step by step, so callers set only what they need."""

    def __init__(self) -> None:
        """Start with no options; defaults apply at build time."""
        self._options: dict[str, str] = {}

    def with_option(self, key: str, value: str) -> Self:
        """Set one option and return the builder, so calls can chain."""
        self._options[key] = value
        return self
```

## Data

- **Internal values:** `@dataclass(frozen=True, slots=True)`, for light,
  immutable structures.
- **Boundaries and settings:** Pydantic `BaseModel` for API schemas, JSON
  parsing, and environment settings.
- **Fixed sets of values:** `StrEnum` (or `Enum` for non-string values).

```python
class TaskStatus(StrEnum):
    """Where a task is in its lifecycle, stored as readable strings."""

    # PENDING tasks are queued and not yet picked up.
    PENDING = auto()
    # IN_PROGRESS tasks are held by a worker.
    IN_PROGRESS = auto()
    # COMPLETED tasks are finished and won't run again.
    COMPLETED = auto()
```

## Idioms

- Define `__all__` in `__init__.py` and multi-module packages so the public
  API is explicit and helpers stay internal.
- Group imports as standard library, third party, then local, and let `ruff
  check --fix` sort them. Never use `from x import *`.
- Use `pathlib.Path`, not `os.path` or string joins:
  `Path("/etc/app") / "config.json"`, and pass `encoding="utf-8"` when reading
  or writing text.
- Use f-strings, not `%` or `.format()`, except in log calls (see Logging).
- Wrap files, sessions, locks, and network handles in `with` or `async with`;
  build custom managers with `contextlib.contextmanager` or
  `asynccontextmanager`.
- Return early with guard clauses to keep nesting shallow.

## Errors

Give each module or service a base exception that inherits from `Exception`,
never `BaseException`, and derive specific errors from it. Chain with
`raise NewError(...) from err` to keep the cause. Catch specific exceptions;
never write a bare `except:`, and don't catch `Exception` unless you re-raise
or log the full traceback.

```python
class StorageError(Exception):
    """Base for storage failures, so callers can catch them all at once."""


class ItemNotFoundError(StorageError):
    """A requested item doesn't exist, which callers usually treat as a 404."""


def load_record(path: Path) -> str:
    """Return a record's text, raising ItemNotFoundError rather than the OS
    error so callers don't depend on the storage backend."""
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError as err:
        raise ItemNotFoundError(f"record at {path} not found") from err
```

## Async

Run concurrent tasks in an `asyncio.TaskGroup`, not `asyncio.gather`, so one
failure cancels the rest. Bound waits with `async with asyncio.timeout(...)`,
not `wait_for`. Move blocking I/O and CPU-heavy work off the event loop with
`asyncio.to_thread`.

```python
async def fetch_all(item_ids: list[str]) -> list[str]:
    """Fetch every item concurrently, failing fast if any fetch fails."""
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_item(i)) for i in item_ids]
    return [task.result() for task in tasks]
```

## Logging

Log with `logging.getLogger(__name__)` or a structured logger such as
`structlog`, never `print()`. Pass values as arguments so formatting is
deferred until the record is emitted:

```python
logger.info("processed item %s for user %s", item_id, user_id)  # not an f-string
```

## Testing

- Name files `test_*.py` and functions `test_*`, and give each test a
  docstring saying what it proves.
- Set up with `@pytest.fixture`, and use `@pytest.mark.parametrize` rather
  than loops inside a test.
- Check exceptions with `pytest.raises(..., match=...)`.
- Mock external systems with `unittest.mock` or the `pytest-mock` `mocker`
  fixture.
- Put integration tests in `tests/integration/` or `tests/e2e/`, against a
  real app instance (for example `httpx.AsyncClient` with `ASGITransport`),
  overriding dependencies only at the wire or storage boundary.
- Test through public functions and methods. Don't import `_`-prefixed names
  or assert on private attributes. Delete a branch no public entry point can
  reach. When internal logic has too many edge cases to test through the outer
  API, extract it into a focused submodule with a public function and test
  that.

```python
@pytest.mark.parametrize(
    ("a", "b", "expected"),
    [(10.0, 2.0, 5.0), (9.0, 3.0, 3.0), (0.0, 5.0, 0.0)],
)
def test_divide_valid(a: float, b: float, expected: float) -> None:
    """divide returns the quotient for any non-zero divisor."""
    assert divide(a, b) == expected


def test_divide_by_zero() -> None:
    """divide refuses a zero divisor instead of returning inf."""
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        divide(10.0, 0.0)
```
