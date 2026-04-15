---
name: go-api
description: Create a new Go API service. Use when starting a new Go service, API project, or microservice. Generates complete boilerplate with local development and observability.
---

# Go API Service

Create a production-ready Go API service.

## Instructions

When asked to create a new Go API service:

1. **Ask for the service name** (kebab-case, e.g., `user-service`, `config-manager`)
2. **Ask for the module path** (e.g., `github.com/myorg/myservice`)
3. **Generate the complete project structure** using the templates below
4. **Replace placeholders** (`{SERVICE_NAME}`, `{SERVICE_NAME_SNAKE}`, `{SERVICE_NAME_PASCAL}`, `{MODULE_PATH}`) with appropriate values

## Project Structure

Generate the following structure:

```
{SERVICE_NAME}/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── api/
│   │   ├── api.go
│   │   └── README.md
│   ├── config/
│   │   ├── config.go
│   │   └── README.md
│   ├── contextx/
│   │   ├── contextx.go
│   │   └── README.md
│   ├── deps/
│   │   ├── deps.go
│   │   └── README.md
│   ├── env/
│   │   ├── env.go
│   │   └── README.md
│   ├── errorsx/
│   │   ├── errorsx.go
│   │   └── README.md
│   ├── httpx/
│   │   ├── httpx.go
│   │   └── README.md
│   ├── logx/
│   │   ├── logx.go
│   │   └── README.md
│   ├── metrics/
│   │   ├── metrics.go
│   │   └── README.md
│   ├── middleware/
│   │   ├── middleware.go
│   │   └── README.md
│   ├── mysql/
│   │   ├── mysql.go
│   │   └── README.md
│   ├── redis/
│   │   ├── redis.go
│   │   └── README.md
│   └── traces/
│       ├── traces.go
│       └── README.md
├── docs/
│   ├── projects/
│   │   ├── completed/
│   │   └── README.md
│   └── architecture.md
├── e2e/
│   ├── doc.go
│   └── helpers_test.go
├── local/
│   ├── config/
│   │   └── api.json
│   ├── mysql/
│   │   ├── docker-compose.yml
│   │   └── initdb.d/
│   │       └── 01-schema.sql
│   └── observability/
│       └── docker-compose.yaml
├── scripts/
│   └── .gitkeep
├── go.mod
├── go.sum
├── Makefile
├── CLAUDE.md
└── README.md
```

## Key Patterns

### Clean Architecture
```
handlers (HTTP) → service (business logic) → repository (data) → model (entities)
```

### Package Naming
Use `x` suffix for packages that shadow stdlib: `logx`, `httpx`, `timex`, `errorsx`, `contextx`

### Error Handling
```go
return nil, fmt.Errorf("service: failed to create config: %w", err)
```

### Structured Logging
```go
logger.LogAttrs(ctx, slog.LevelError, "create_config",
    slog.String("config_id", configID),
    slog.Any("err", err),
)
```

### Tracing
```go
spanFunc := func(ctx context.Context) error {
    traces.AddAttributesToCurrentSpan(ctx,
        attribute.String("config_id", configID),
    )
    // ... operation
    return nil
}
err := traces.WithSpan(ctx, s.tracer, "service.CreateConfig", spanFunc)
```

## Templates

When generating files, use the templates in the `templates/` directory:

- [Makefile](templates/makefile.md) - Build, test, lint, run commands
- [MySQL Docker Compose](templates/docker-compose-mysql.md) - Local database
- [Observability Stack](templates/docker-compose-obs.md) - Grafana, Tempo, Loki, Prometheus
- [Local Config](templates/config-local.md) - JSON configuration
- [internal/api](templates/internal-api.md) - API server setup
- [internal/config](templates/internal-config.md) - Configuration management
- [internal/logx](templates/internal-logx.md) - Structured logging
- [internal/middleware](templates/internal-middleware.md) - HTTP middleware pipeline
- [go.mod](templates/go-mod.md) - Dependencies

## Running Locally

After generation:

```bash
# First-time setup
make tools-install

# Start full stack (API + MySQL + Redis + Observability)
make run

# Run tests
make test

# Run integration tests
make test-integration

# Run all linters
make lint-all
```

## Documentation

- Place all documentation in `docs/`
- Project plans go in `docs/plans/`
- Move completed plans to `docs/plans/completed/`
- Each internal package MUST have a `README.md` explaining its
  purpose and usage
- When code changes alter behavior, public APIs, or usage
  patterns, update the corresponding `docs/**/*.md` or
  `**/README.md` files
- Do not create new documentation files unless the change
  introduces a wholly new component
