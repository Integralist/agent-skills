# go.mod

Create the module with the current Go toolchain and the latest dependency
versions, rather than pinning versions here that go stale:

```bash
go mod init {MODULE_PATH}
go get \
	github.com/go-sql-driver/mysql \
	github.com/google/uuid \
	github.com/prometheus/client_golang \
	github.com/redis/go-redis/v9 \
	github.com/stretchr/testify \
	github.com/veqryn/slog-dedup \
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp \
	go.opentelemetry.io/otel \
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp \
	go.opentelemetry.io/otel/sdk \
	go.opentelemetry.io/otel/trace
make tools-install
go mod tidy
```

`make tools-install` adds the Makefile's `TOOLS` to the `tool` block in
`go.mod`, so `go tool <name>` runs a version pinned per project. The `tool`
directive needs Go 1.24 or later.

| Dependency                            | Why                                  |
| ------------------------------------- | ------------------------------------ |
| `github.com/go-sql-driver/mysql`      | MySQL driver                         |
| `github.com/google/uuid`              | Resource IDs                         |
| `github.com/prometheus/client_golang` | Prometheus metrics                   |
| `github.com/redis/go-redis/v9`        | Redis cache client                   |
| `github.com/stretchr/testify`         | Test assertions                      |
| `github.com/veqryn/slog-dedup`        | Drop duplicate slog keys in `logx`   |
| `go.opentelemetry.io/...`             | Tracing, exported over OTLP HTTP     |
