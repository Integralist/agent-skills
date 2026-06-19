---
name: go-api
description: >-
  Create a new Go API service with complete boilerplate, local
  development, and observability.
disable-model-invocation: true
---

# Go API Service

Create a production-ready Go API service.

## Instructions

When asked to create a new Go API service:

1. **Ask for the service name** (kebab-case, e.g.,
   `user-service`, `config-manager`)
2. **Ask for the module path** (e.g.,
   `github.com/myorg/myservice`)
3. **Generate the complete project structure** using the
   templates below
4. **Replace placeholders** (`{SERVICE_NAME}`,
   `{SERVICE_NAME_SNAKE}`, `{SERVICE_NAME_PASCAL}`,
   `{MODULE_PATH}`) with appropriate values

## Project Structure

Generate the following structure:

```txt
{SERVICE_NAME}/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── api/
│   ├── config/
│   ├── contextx/
│   ├── deps/
│   ├── env/
│   ├── errorsx/
│   ├── httpx/
│   ├── logx/
│   ├── metrics/
│   ├── middleware/
│   ├── mysql/
│   ├── redis/
│   └── traces/
├── docs/
│   ├── projects/
│   │   ├── completed/
│   │   └── README.md
│   └── architecture.md
├── e2e/
├── local/
│   ├── config/
│   ├── mysql/
│   └── observability/
├── scripts/
├── go.mod
├── go.sum
├── Makefile
├── AGENTS.md
└── README.md
```

## Key Patterns

### Clean Architecture

```txt
handlers (HTTP) → service (business logic) → repository (data)
  → model (entities)
```

### Package Naming

Use `x` suffix for packages that shadow stdlib: `logx`, `httpx`,
`timex`, `errorsx`, `contextx`

### Error Handling

```go
return nil, fmt.Errorf(
    "service: failed to create config: %w", err)
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
    return nil
}
err := traces.WithSpan(
    ctx, s.tracer, "service.CreateConfig", spanFunc)
```

## Templates

When generating files, use the templates in the `templates/`
directory:

- [Makefile](templates/makefile.md)
- [MySQL Docker Compose](templates/docker-compose-mysql.md)
- [Observability Stack](templates/docker-compose-obs.md)
- [Local Config](templates/config-local.md)
- [internal/api](templates/internal-api.md)
- [internal/config](templates/internal-config.md)
- [internal/logx](templates/internal-logx.md)
- [internal/middleware](templates/internal-middleware.md)
- [go.mod](templates/go-mod.md)

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
