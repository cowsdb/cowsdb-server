<a href="https://github.com/cowsdb" target="_blank">
  <img src="https://avatars.githubusercontent.com/u/154673217?s=200&v=4" width=180 />
</a>

# cowsdb-server <img src="https://user-images.githubusercontent.com/1423657/236928733-43e4f74e-5cff-4b3f-8bb7-20df58e10829.png" height=20 />
Experimental [CowsDB/chdb](https://github.com/cowsdb) API server powered by [bun runtime](https://bun.sh)
### Status

- experimental, potentially unstable
- requires [`libcows`](https://github.com/cowsdb/libcows)
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
docker pull ghcr.io/clowsdb/cowsdb-server:slim
```

```
version: '2.1'

volumes:
    clickhouse_data: {}

services:
  chdb-server:
    image: ghcr.io/cowsdb/cowsdb-server:slim
    container_name: cowsdb-server
    restart: unless-stopped
    expose:
      - 8123
    volumes:
      - clickhouse_data:/app/.chdb_data

```
