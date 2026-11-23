# Go Service Architecture

House conventions for HTTP/API services structured as handlers → service →
repository, on top of [conventions-go](../SKILL.md). Helper names (`errorsx`,
`httpx`, `traces.WithSpan`, `withDBMetrics`, `middleware.Pipeline`,
`CacheManager`) illustrate the pattern; match the existing repo's equivalents.

## Layers and files

- Requests flow handlers → service → repository. Business logic belongs in the
  service and data access in the repository. Don't bypass a layer that owns
  required behaviour, and don't add empty pass-throughs just to match a
  diagram.
- Split layers by resource: `handlers.go`/`handlers_*.go`,
  `service.go`/`service_*.go`, `repository.go`/`repository_*.go`, with
  `model.go` (domain types), `interface.go` (shared interfaces), and `cache.go`.

## Errors across layers

Translate errors at two boundaries only:

- **Repository:** map storage errors to domain sentinels with `%w`
  (`errors.Is(err, sql.ErrNoRows)` → `errorsx.ErrNotFound`), and format raw
  driver errors with `%v` so callers can log them without coupling to driver
  types.
- **Service:** pass domain errors through with `%w` context; translate only
  when introducing a new domain condition (e.g. soft delete → `ErrNotFound`).
- **Handler:** map domain sentinels to RFC 7807 Problem Details responses.

## Observability

- Add spans and metrics at handler, service, and repository entry points only,
  not on internal helpers or private `*InTx` methods already covered by their
  caller.
- Name spans `layer.Operation` (e.g. `service.CreateConfig`), record both
  count and duration via typed metric fields, and initialize `otel.Tracer(...)`
  at package or constructor level.

## Layer contracts

- **Handlers:** `Handlers` struct (logger, metrics, service, tracer) built via
  `NewHandlers`; mount routes behind the shared middleware pipeline in
  `RegisterRoutes(mux, pipeline, cfg)`.
- **Service:** Methods take `(ctx, In)` and return `(Out, error)` using plain
  domain structs (no JSON/protobuf/HTTP types). Put input validation in
  `In.Validate() error` and invoke it first inside the span.
- **Repository:** Wrap methods in a shared `withDBMetrics` helper (span +
  `dbOpsTotal`/`dbOpDuration` by operation, table, result). Deferred
  transaction rollbacks must log and count any error other than
  `sql.ErrTxDone`.
- **Middleware:** `type Decorator func(http.Handler) http.Handler`, composed by
  a `Pipeline` iterating `slices.Backward(p.middleware)` so the first entry
  runs outermost.
- **Caching:** Cache-aside for stable, cross-request reads via
  `CacheManager.CacheOrFetch()`, deduplicated with `singleflight.Group`, using
  hierarchical keys (`prefix:customerID:resource:id`).
