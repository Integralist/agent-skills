# internal/config

Loads the JSON config file and validates it, so a bad value fails at startup
with every problem listed at once.

## config.go

```go
// internal/config/config.go

package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"os"
	"slices"
	"time"

	"{MODULE_PATH}/internal/env"
)

// MaxPort is the largest valid TCP port, used to bound every port field.
const MaxPort = math.MaxUint16

// Config holds everything the API needs to start, loaded from one JSON file
// so each environment differs only by that file.
type Config struct {
	// Addr is the address the API server listens on, such as ":8080".
	Addr string `json:"addr"`
	// Environment names where the service runs, so behaviour can differ
	// between local and deployed environments.
	Environment env.Environment `json:"environment"`
	// Metrics is where the Prometheus metrics server listens.
	Metrics Metrics `json:"metrics"`
	// MySQL is the primary datastore's connection settings.
	MySQL MySQL `json:"mysql"`
	// Redis is the cache's connection settings.
	Redis Redis `json:"redis"`
	// Timeouts override the API server's default read and write timeouts.
	Timeouts Timeouts `json:"timeouts"`
}

// Metrics is where the metrics server listens, kept apart from the API port
// so scraping never competes with client traffic.
type Metrics struct {
	// Host is the interface to bind; empty means all interfaces.
	Host string `json:"host"`
	// Port is the metrics port; 0 leaves the metrics package's default.
	Port int `json:"port"`
}

// MySQL holds the database connection settings. The password comes from the
// MYSQL_PASSWORD environment variable, so it never sits in a config file.
type MySQL struct {
	// Host is the database server's hostname or IP.
	Host string `json:"host"`
	// Port is the database server's port.
	Port int `json:"port"`
	// User is the database user the service connects as.
	User string `json:"user"`
	// DBName is the schema the service uses.
	DBName string `json:"dbname"`
	// MaxOpenConns caps open connections, so the service can't exhaust the
	// server's connection limit.
	MaxOpenConns int `json:"max_open_conns,omitempty"`
	// MaxIdleConns caps idle connections kept for reuse.
	MaxIdleConns int `json:"max_idle_conns,omitempty"`
	// ConnMaxLifetime is how long a connection lives before it's replaced,
	// as a Go duration such as "5m".
	ConnMaxLifetime string `json:"conn_max_lifetime,omitempty"`
	// ConnMaxIdleTime is how long a connection may sit idle before it's
	// closed, as a Go duration.
	ConnMaxIdleTime string `json:"conn_max_idle_time,omitempty"`
}

// Redis holds the cache's address.
type Redis struct {
	// Host is the Redis server's hostname or IP.
	Host string `json:"host"`
	// Port is the Redis server's port.
	Port int `json:"port"`
}

// Timeouts override the API server's defaults, as Go durations such as
// "10s"; empty keeps the default.
type Timeouts struct {
	// APIReadTimeout bounds how long a client may take to send a request.
	APIReadTimeout string `json:"api_read_timeout"`
	// APIWriteTimeout bounds how long a handler may take to respond.
	APIWriteTimeout string `json:"api_write_timeout"`
}

// Load reads and decodes the JSON config at cfgPath. It doesn't validate;
// call Validate next.
func Load(cfgPath string) (*Config, error) {
	file, err := os.ReadFile(cfgPath)
	if err != nil {
		return nil, fmt.Errorf("config: failed to read %q: %w", cfgPath, err)
	}

	var cfg Config
	if err := json.Unmarshal(file, &cfg); err != nil {
		return nil, fmt.Errorf("config: failed to decode %q: %w", cfgPath, err)
	}
	return &cfg, nil
}

// Validate checks every field and returns all problems joined, so one run
// shows everything to fix.
func (cfg *Config) Validate() error {
	var errs []error
	if cfg.Addr == "" {
		errs = append(errs, errors.New("missing addr"))
	}
	if !slices.Contains(env.All, cfg.Environment) {
		errs = append(errs, fmt.Errorf("invalid environment: %q", cfg.Environment))
	}
	if cfg.MySQL.Host == "" {
		errs = append(errs, errors.New("missing mysql.host"))
	}
	if cfg.MySQL.User == "" {
		errs = append(errs, errors.New("missing mysql.user"))
	}
	if cfg.MySQL.DBName == "" {
		errs = append(errs, errors.New("missing mysql.dbname"))
	}
	if cfg.Redis.Host == "" {
		errs = append(errs, errors.New("missing redis.host"))
	}
	errs = append(errs,
		validPort("mysql.port", cfg.MySQL.Port, false),
		validPort("redis.port", cfg.Redis.Port, false),
		validPort("metrics.port", cfg.Metrics.Port, true),
		validDuration("timeouts.api_read_timeout", cfg.Timeouts.APIReadTimeout),
		validDuration("timeouts.api_write_timeout", cfg.Timeouts.APIWriteTimeout),
	)
	return errors.Join(errs...)
}

// validPort reports a port outside 1–MaxPort; allowZero lets 0 mean "use the
// default".
func validPort(name string, port int, allowZero bool) error {
	if allowZero && port == 0 {
		return nil
	}
	if port <= 0 || port > MaxPort {
		return fmt.Errorf("invalid %s: %d (must be 1-%d)", name, port, MaxPort)
	}
	return nil
}

// validDuration reports a set value that isn't a Go duration; empty is
// allowed and means "use the default".
func validDuration(name, value string) error {
	if value == "" {
		return nil
	}
	if _, err := time.ParseDuration(value); err != nil {
		return fmt.Errorf("invalid %s: %w", name, err)
	}
	return nil
}
```

## README.md

````markdown
# internal/config

Loads `local/config/api.json` (or the file passed with `-cfg`) and validates
it, listing every problem at once.

```go
cfg, err := config.Load(path)
if err != nil {
	return err
}
if err := cfg.Validate(); err != nil {
	return err
}
```

To add a setting, add the field with a JSON tag and a comment, validate it in
`Validate` if it's required, and add it to `local/config/api.json`.
````
