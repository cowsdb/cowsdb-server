<a href="https://chdb.fly.dev" target="_blank">
  <img src="https://avatars.githubusercontent.com/u/132536224" width=130 />
</a>

# chdb-bun-server <img src="https://user-images.githubusercontent.com/1423657/236928733-43e4f74e-5cff-4b3f-8bb7-20df58e10829.png" height=20 />
Experimental [chDB](https://github.com/auxten/chdb) API server powered by [bun runtime](https://bun.sh)
### Status

- experimental, potentially unstable
- requires [`libchdb`](https://github.com/metrico/libchdb) on the system
- requires `gcc` to rebuild


### Usage
#### Bun
```
bun install
bun run build
bun dev
```

#### Bun in Docker

```
docker pull ghcr.io/metrico/chdb-bun-server:latest
```

```
version: '2.1'

volumes:
    clickhouse_data: {}

services:
  chdb-server:
    image: ghcr.io/metrico/chdb-bun-server:latest
    container_name: chdb-server
    restart: unless-stopped
    expose:
      - 8123
    volumes:
      - clickhouse_data:/app/.chdb_data

```
