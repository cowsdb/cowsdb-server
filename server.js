/* chdb-server bun powered */
import { db, chdb } from "./chdb.js";
import { Elysia, t } from "elysia";
import { basicAuth } from './auth.ts';

let PORT = process.env.PORT || 8123
let HOST = process.env.HOST || '0.0.0.0'
let STDIN = `/proc/${process.pid}/fd/0`
let DATAPATH = '/tmp/'

let conn = new db('CSV', '/tmp/')
let version = conn.query("SELECT chdb()") || '0.0.0';

const chdb_query = function(query, format, path){
    let result;
    if (path) {
	result = conn.session(query, format, path);
    } else { result = conn.query(query, format); }
    return result;
}

const app = new Elysia()
        .use(basicAuth())
        .onParse(({ request }, contentType) => {
          if (contentType != 'application/json')
            return request.text()
        })
        .onRequest(({ set }) => {
          set.headers = { 'Access-Control-Allow-Origin': '*' }
        })
        .onError(({ code, error }) => {
          return new Response(error.toString())
        })
        .get('/version', () => chdb_query("SELECT version(), chdb()"))
        .get('/play', () => Bun.file('public/play.html'))
        .get("/", ({ query, basicAuth }) => {

          if (!query.query) throw new Error('no query, no party.')
          if (!query.format) query.format = query.default_format || 'CSV';

	  let path = false;
          if(basicAuth?.token){
              path = DATAPATH + basicAuth.token
	  }

          if (query.database)
                chdb_query(("USE "+query.database).toString(), query.format.toString(), path)

          let result = chdb_query(query.query.toString(), query.format.toString(), path);
          return result.toString();
        })
        .post("/", ({ body, query, basicAuth }) => {

          if (!query.query && body) {
                query.query = body
		query.query = query.query.split('\n').join(' ').trim()
                body = false
          } else if (query.query && body) {
		// Bun.write(STDIN, body);
		body = body.split('\n').join('').trim()
		query.query = query.query + ` ${body}`
	  }

          if (!query.query && !body) throw new Error('no query, no party.')
          if (!query.format) query.format = query.default_format || 'CSV';

	  let path = false;
          if(basicAuth?.token){
              path = DATAPATH + basicAuth.token
	  }
          if (query.database)
                chdb_query(("USE "+query.database).toString(), query.format.toString(), path)

          let result = chdb_query(query.query ? query.query.toString() : '', query.format.toString(), path);
          return result.toString()
        })
        .post('/mirror', ({ body }) => body)
        .listen({ port: PORT, hostname: HOST })

console.log(`chdb-bun ${version}HTTP API running at ${HOST}:${PORT} and PID ${process.pid}`)
