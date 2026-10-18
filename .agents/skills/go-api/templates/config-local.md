# local/config

`local/config/api.json`, the config `make run` passes to the API. Its values
match the local MySQL, Redis, and metrics ports; the MySQL password comes from `MYSQL_PASSWORD`,
which `make run` sets.

```json
{
  "addr": ":8080",
  "environment": "local",
  "metrics": {
    "host": "",
    "port": 8447
  },
  "mysql": {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "appuser",
    "dbname": "{SERVICE_NAME_SNAKE}",
    "max_open_conns": 25,
    "max_idle_conns": 10,
    "conn_max_lifetime": "5m",
    "conn_max_idle_time": "1m"
  },
  "redis": {
    "host": "127.0.0.1",
    "port": 6379
  },
  "timeouts": {
    "api_read_timeout": "10s",
    "api_write_timeout": "10s"
  }
}
```

Each field is documented on the matching `Config` struct field in
[internal-config.md](internal-config.md).
