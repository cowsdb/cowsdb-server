/* chdb-server bun powered */

import { db, chdb } from "./chdb.js";
import { Elysia } from "elysia";
import { basicAuth } from './auth.ts';

let PORT = process.env.PORT || 8123
let HOST = process.env.HOST || '0.0.0.0'

let conn = new db('CSV')
let version = conn.query("SELECT chdb()").toString() || '0.0.0';

const chdb_query = function(query, format, path){
    let result;
    if (path) {
	result = conn.session(query, format, path);
    } else { result = conn.query(query, format); }
    return result;
}

const app = new Elysia()
        .use(basicAuth())
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
              path = basicAuth.token
	  }

          if (query.database)
                chdb_query("USE "+query.database.toString(), "Null", path)

          let result = chdb_query(query.query.toString(), query.format.toString(), path);
          return result.toString();
        })
        .post("/", ({ body, query, basicAuth }) => {

          if (!query.query && body) {
                query.query = body
                body = false
          }
          if (!query.query) throw new Error('no query, no party.')
          if (!query.format) query.format = query.default_format || 'CSV';

	  let path = false;
          if(basicAuth?.token){
              path = basicAuth.token
	  }
          if (query.database)
                chdb_query("USE "+query.database.toString(), "Null", path)

          let result = chdb_query(query.query.toString(), query.format.toString(), path);
          return result.toString()
        })
        .post('/mirror', ({ body }) => body)
        .listen({ port: PORT, hostname: HOST })

console.log(`chdb-bun ${version}HTTP API running at ${HOST}:${PORT}`)
