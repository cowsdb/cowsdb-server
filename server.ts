import { db, chdb } from "./chdb.ts";
import { Elysia } from "elysia";
import { basicAuth } from './auth.ts';
import QuickLRU from 'quick-lru';

const PORT = process.env.PORT || 8123;
const HOST = process.env.HOST || '0.0.0.0';
const DATAPATH = process.env.DATA || '.chdb_data/';

const conn = new db('CSV', '/tmp/');
const version = conn.query("SELECT chdb()") || '0.0.0';

const pendingQueries = new QuickLRU({ maxSize: 100 });

const tmpfd =  "/tmp/.chdb_stderr";

const controller = {
  findQuery(id) {
    return pendingQueries.get(id);
  },
  async receive(message) {
    const query = this.findQuery(message.id);
    if (!query) return null;
    if (message?.data.length == 0 ) {
      try {
        // const stderr = await dbworker.stderr.getReader().readMany();
	let decoder = new TextDecoder('utf-8')
        const reader = await dbworker.stderr.getReader();
        const stderr = reader.read().then(function (result) {
           return decoder.decode(Buffer.from(result.value));
        });
        reader.releaseLock();
	query.callback(stderr); 
      } catch(e) { console.log(e); }
    }
    query.callback(message.data);
  },
  query(query, format, path, worker) {
    if (path && worker) {
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substring(7);
        pendingQueries.set(id, { id, callback: resolve, error: reject });
        dbworker.send({ query, format, path, id });
      });
    } else {
      return chdb_query(query, format, path);
    }
  }
};

// DB Worker
const dbworker = await Bun.spawn(["bun", "run", "childb.ts"], {
  ipc(message, childProc) {
    controller.receive(message);
  },
  stderr: "pipe",
  stdout: "inherit",
  stdin: "pipe",
});

const chdb_query = async function (query, format, path, worker) {
  let result = {};
  if (path && worker) {
    dbworker.send({ query, format, path });
    result = await new Response(dbworker.stdout).text();
    const err = await new Response(dbworker.stderr).text();
    return err ? err : result;
  } else if (path) {
    result = conn.session(query, format, path);
  } else {
    result = conn.query(query, format);
  }

  return result;
};

const app = new Elysia()
  .use(basicAuth())
  .onParse(({ request }, contentType) => {
    if (contentType !== 'application/json') {
      return request.text();
    }
  })
  .onRequest(({ set }) => {
    set.headers = { 'Access-Control-Allow-Origin': '*' };
  })
  .onError(({ code, error }) => {
    return new Response(error.toString());
  })
  .get('/version', () => controller.query("SELECT version(), chdb()"))
  .get('/play', () => Bun.file('public/play.html'))
  .get("/", async ({ query, basicAuth }) => {
    if (!query.query) throw new Error('no query, no party.');
    if (!query.format) query.format = query.default_format || 'CSV';

    let path = false;
    if (basicAuth?.token) {
      path = DATAPATH + basicAuth.token;
    }

    if (query.database) {
      await controller.query(("USE " + query.database).toString(), query.format.toString(), path);
    }

    const result = await controller.query(query.query.toString(), query.format.toString(), path);
    return result.toString();
  })
  .post("/", async ({ body, query, basicAuth }) => {
    if (!query.query && body) {
      query.query = body;
      query.query = query.query.split('\n').join(' ').trim();
      body = false;
    } else if (query.query && body) {
      body = body.split('\n').join('').trim();
      query.query = query.query + ` ${body}`;
    }

    if (!query.query && !body) throw new Error('no query, no party.');
    if (!query.format) query.format = query.default_format || 'CSV';
    if (!query.worker) query.worker = true;

    let path = false;
    if (basicAuth?.token) {
      path = DATAPATH + basicAuth.token;
    }

    if (query.database) {
      await controller.query(("USE " + query.database).toString(), query.format.toString(), path);
    }

    const result = await controller.query(query.query ? query.query.toString() : '', query.format.toString(), path, query.worker);
    return result.toString();
  })
  .post('/mirror', ({ body }) => body)
  .listen({ port: PORT, hostname: HOST });

console.log(`chdb-bun ${version} HTTP API running at ${HOST}:${PORT}`);

