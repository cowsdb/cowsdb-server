import { db, chdb } from "./chdb.js";
import { Elysia } from "elysia";

let PORT = process.env.PORT || 8123
let HOST = process.env.HOST || '0.0.0.0'

const conn = new db('CSV', '/tmp')
console.log("version:", conn.query("SELECT chdb()"));

const chdb_query = function(query, format){
    let result = conn.query(query, format);
    return result;
}

const app = new Elysia()
        .onRequest(({ set }) => {
          set.headers = { 'Access-Control-Allow-Origin': '*' }
        })
        .onError(({ code, error }) => {
          return new Response(error.toString())
        })
        .get('/version', () => chdb_query("SELECT version(), chdb()"))
        .get('/play', () => Bun.file('public/play.html'))
        .get("/", ({ query }) => {
          if (!query.query) throw new Error('no query, no party.')
          if (!query.format) query.format = query.default_format || 'CSV';
          let result = chdb_query(query.query.toString(), query.format.toString());
          return result.toString();
        })
        .post("/", ({ body, query }) => {
          if (!query.query && body) {
                query.query = body
                body = false
          }
          if (query.database)
                chdb_query("USE "+query.database)
          if (!query.query) throw new Error('no query, no party.')
          if (!query.format) query.format = query.default_format || 'CSV';
          let result = chdb_query(query.query.toString(), query.format.toString());
          return result.toString()
        })
        .post('/mirror', ({ body }) => body)
        .listen({ port: PORT, hostname: HOST })

console.log('🐍 chdb-bun API running at :'+PORT)
