---
name: go-api
description: >-
  Scaffold a new Go HTTP API service with its local development stack and
  observability. Use when the user asks to create a new Go API service or
  project.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Go API Service

Scaffold a production-ready Go API service: the handlers → service →
repository layout, config, structured logging, middleware, metrics, and
tracing, plus a Makefile that runs it locally with MySQL, Redis, and a
Grafana observability stack. All generated Go follows
[conventions-go](../conventions-go/SKILL.md) and its
[service architecture](../conventions-go/references/SERVICE-ARCHITECTURE.md);
the templates here are the files to generate, not a second set of rules.

1. **Ask for the service name and module path:** a kebab-case name such as
   `user-service`, and a module path such as `github.com/myorg/myservice`.
   Derive `{SERVICE_NAME}` (kebab-case), `{SERVICE_NAME_SNAKE}`,
   `{SERVICE_NAME_PASCAL}`, and `{MODULE_PATH}` from them. Done when all four
   placeholders have values.
2. **Generate the project** in the layout below, resolving every placeholder.
   Use the templates where one exists; write the other packages to the
   contracts below, so they fit the templates that call them. Give every
   package a `doc.go` and a short `README.md`, as conventions-go requires.
   Done when every file in the layout exists and no `{…}` placeholder is
   left.
3. **Initialise and check it.** Create `go.mod` as
   [go-mod.md](templates/go-mod.md) describes, then run `make fmt`,
   `make lint-all`, and `make test`. Done when all three pass.

**Parallel scaffold.** The placeholder map is fixed, so instantiating the
templates is a
[verified-pattern fan-out](../shared/SUBAGENT-STEERABILITY.md): generate one
representative package (`internal/api`) first and confirm the substitutions
and layout with the user, then have subagents instantiate the rest in
parallel, following the shared completion and retry protocol.

## Layout

```txt
{SERVICE_NAME}/
├── cmd/api/main.go
├── internal/
│   ├── api/  config/  contextx/  deps/  env/  errorsx/  httpx/
│   └── logx/  metrics/  middleware/  mysql/  redis/  traces/
├── docs/
│   ├── projects/completed/
│   ├── projects/README.md
│   └── architecture.md
├── e2e/
├── local/
│   ├── config/  mysql/  observability/
├── scripts/
├── go.mod  go.sum  Makefile  AGENTS.md  README.md
```

Packages that shadow a standard-library name take an `x` suffix: `logx`,
`httpx`, `errorsx`, `contextx`, `timex`.

## Templates

- `cmd/api` and `internal/api`: [internal-api.md](templates/internal-api.md)
- `internal/config`: [internal-config.md](templates/internal-config.md)
- `internal/logx`: [internal-logx.md](templates/internal-logx.md)
- `internal/middleware`:
  [internal-middleware.md](templates/internal-middleware.md)
- `go.mod`: [go-mod.md](templates/go-mod.md)
- `Makefile`: [makefile.md](templates/makefile.md)
- `local/config`: [config-local.md](templates/config-local.md)
- `local/mysql`: [docker-compose-mysql.md](templates/docker-compose-mysql.md)
- `local/observability`:
  [docker-compose-obs.md](templates/docker-compose-obs.md)

## Contracts for packages without a template

The templates call these, so write each package to match:

- **`contextx`:** `WithComponent(ctx, name) context.Context`,
  `RoutePatternContextKey`, `RoutePatternFromContext(ctx) (string, bool)`.
- **`deps`:** `Dependencies{MySQLFailed, RedisFailed bool}`.
- **`env`:** `type Environment string`, and `All []Environment` holding
  `local`, `dev`, `stg`, and `prd`.
- **`errorsx`:** domain sentinels such as `ErrNotFound`, and
  `NewProblem(title, detail)` for RFC 7807 responses.
- **`httpx`:** `WriteJSON(ctx, logger, w, status, v)`.
- **`metrics`:** `New(registry, component, logger) *Metrics`,
  `StoreCreate(*Store)`, `StartServer(ctx, logger, host, port) *http.Server`,
  `RegisterGauge`, `Count`, `RequestsTotal`, `RequestDuration`,
  `RequestSize`, `ResponseSize`, and `WithHealthCheckMetrics`.
- **`mysql`:** `New(ctx, config.MySQL, logger) (*sql.DB, error)`, reading the
  password from `MYSQL_PASSWORD` so it stays out of the config file.
- **`redis`:** `NewClient(ctx, logger, *config.Config) (*redis.Client, error)`.
- **`traces`:** `New(ctx, serviceName) (shutdown func(context.Context) error,
  tracer, error)`, `WithSpan(ctx, tracer, name, fn)`,
  `AddAttributesToCurrentSpan`, and `GetTraceID(ctx) string`.

## Running locally

```bash
make tools-install     # first-time setup
make run               # API + MySQL + Redis + observability
make test              # unit tests
make test-integration  # end-to-end tests against the running stack
make lint-all          # every linter
```
