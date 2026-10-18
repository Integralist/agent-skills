# internal/logx

Builds the service's `*slog.Logger`: JSON to stdout, UTC timestamps, the app's
name and version on every line, and the `event` and `err` keys that
conventions-go's logging rules expect.

## log.go

```go
// internal/logx/log.go

package logx

import (
	"context"
	"io"
	"log"
	"log/slog"
	"os"

	slogdedup "github.com/veqryn/slog-dedup"
)

// contextKey is unexported so no other package can collide with the key
// that stores a logger in a context.
type contextKey struct{}

var (
	// ContextKey stores a logger in a context, for code that receives only a
	// context.
	ContextKey = contextKey{}
	// Level is the shared minimum level, changeable at runtime without
	// rebuilding loggers. It defaults to slog.LevelInfo.
	Level = new(slog.LevelVar)
	// AppName identifies the service in every log line; set it before New.
	AppName = "unknown"
	// AppRepo is the service's repository URL; set it before New.
	AppRepo = "unknown"
	// AppVersion is the running build's version; set it before New.
	AppVersion = "unknown"
)

// New returns a logger writing to stdout at the shared Level.
func New() *slog.Logger {
	return NewWithOutputLevel(os.Stdout, Level)
}

// NewWithOutput returns a logger writing to w at the shared Level, so tests
// can capture output.
func NewWithOutput(w io.Writer) *slog.Logger {
	return NewWithOutputLevel(w, Level)
}

// NewWithOutputLevel returns a logger writing to w at level l. The dedup
// handler keeps the last value when a key is added twice, so scoped loggers
// can override attributes without duplicate keys in the JSON.
func NewWithOutputLevel(w io.Writer, l slog.Leveler) *slog.Logger {
	opts := &slog.HandlerOptions{
		AddSource:   true,
		Level:       l,
		ReplaceAttr: replaceAttr,
	}
	return slog.New(
		slogdedup.NewOverwriteHandler(
			slog.NewJSONHandler(w, opts).WithAttrs(appAttrs()),
			nil,
		),
	)
}

// Adapt returns a *log.Logger that writes through l, for dependencies that
// only accept the standard log package.
func Adapt(l *slog.Logger, level slog.Level) *log.Logger {
	return slog.NewLogLogger(l.Handler(), level)
}

// FromContext returns the logger stored in ctx, or a new default logger, so
// callers never have to nil-check.
func FromContext(ctx context.Context) *slog.Logger {
	if logger, ok := ctx.Value(ContextKey).(*slog.Logger); ok {
		return logger
	}
	return New()
}

// appAttrs groups the app identity attached to every line, so logs from
// several services can be filtered by name and version.
func appAttrs() []slog.Attr {
	return []slog.Attr{
		slog.Group("app",
			slog.String("name", AppName),
			slog.String("repo", AppRepo),
			slog.String("version", AppVersion),
		),
	}
}

// replaceAttr normalises output so every service's logs share one shape:
// UTC times, "event" for the message, "err" for errors, no nil errors, and
// durations in milliseconds.
func replaceAttr(groups []string, a slog.Attr) slog.Attr {
	// Rename only top-level keys; a nested "msg" belongs to the caller.
	if len(groups) == 0 {
		switch a.Key {
		case slog.TimeKey:
			a.Value = slog.TimeValue(a.Value.Time().UTC())
			return a
		case slog.MessageKey:
			if a.Value.String() == "" {
				return slog.Attr{}
			}
			a.Key = "event"
			return a
		}
	}

	if a.Key == "error" {
		a.Key = "err"
	}
	if a.Equal(slog.Any("err", error(nil))) {
		return slog.Attr{}
	}

	switch a.Key {
	case "dur", "delay", "p95", "previous_p95", "remaining", "max_wait":
		a.Value = slog.Float64Value(a.Value.Duration().Seconds() * 1000)
	}
	return a
}
```

## interface.go

```go
// internal/logx/interface.go

package logx

import (
	"context"
	"log/slog"
)

// Logger is the one logging method the service depends on, so tests can
// pass a fake instead of a real handler.
type Logger interface {
	// LogAttrs logs msg at level with typed attributes, avoiding the
	// allocations of the variadic any form.
	LogAttrs(ctx context.Context, level slog.Level, msg string, attrs ...slog.Attr)
}
```

## README.md

````markdown
# internal/logx

Structured JSON logging on `log/slog`: UTC timestamps, app name and version on
every line, `event` for the message and `err` for errors, and a runtime-
adjustable level.

```go
logx.AppName = "my-service" // before logx.New
logger := logx.New()
logger.LogAttrs(ctx, slog.LevelInfo, "create_config", slog.String("config_id", id))
logx.Level.Set(slog.LevelDebug)
```

Each line looks like:

```json
{"time":"2024-01-15T10:30:00Z","level":"INFO","event":"create_config","config_id":"cfg_123","app":{"name":"my-service","repo":"unknown","version":"abc123"}}
```
````
