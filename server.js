/* chdb-server bun powered clickhouse API   */
/* (C) 2023 QXIP BV see LICENSE for details */

import { db, chdb } from "./chdb.js";
import { Elysia, t } from "elysia";
import { basicAuth } from './auth.ts';

let PORT = process.env.PORT || 8123
let HOST = process.env.HOST || '0.0.0.0'
let DATAPATH = process.env.DATA || '.chdb_data/'

let conn = new db('CSV', '/tmp/')
let version = conn.query("SELECT chdb()") || '0.0.0';

let controller = {
        pendingQueries: [],
        findQuery: function (id) {
            let object = this.pendingQueries.find((el)=> el.id == id)
            return object
        },
        receive: function (message) {
            let query = this.findQuery(message.id)
            if (!query) return null
            query.callback(message.data)
        },
        query: function (query, format, path, worker) {
            if (path && worker) {
                    let self = this
                return new Promise((resolve, reject) => {
                    let id = Math.random().toString(36).substring(7)
                    self.pendingQueries.push({
                        id: id,
                        callback: resolve,
                        error: reject
                    })
                    dbworker.send({ query: query, format: format, path: path, id:id })
                })
            } else {
                return chdb_query(query, format, path)
            }
        }
    }

/* DB Worker */
// Params: query, format, path
const dbworker = await Bun.spawn(["bun", "run", "childb.ts"], {
  ipc(message, childProc) {
    // console.log('received from dbworker', message)
    controller.receive(message)
  },
  stderr: "pipe",
  stdout: "pipe",
  stdin: "pipe",
});


const chdb_query = async function(query, format, path, worker){
    let result = {};
    if (path && worker) {
        dbworker.send({ query: query, format: format, path: path })
        result = await new Response(dbworker.stdout).text();
        return result;
    } else if (path) {
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
        .get('/version', () => controller.query("SELECT version(), chdb()"))
        .get('/play', () => Bun.file('public/play.html'))
        .get("/", async ({ query, basicAuth }) => {

          if (!query.query) throw new Error('no query, no party.')
          if (!query.format) query.format = query.default_format || 'CSV';

          let path = false;
          if(basicAuth?.token){
              path = DATAPATH + basicAuth.token
          }

          if (query.database) {
            await controller.query(("USE "+query.database).toString(), query.format.toString(), path)
          }

          let result = await controller.query(query.query.toString(), query.format.toString(), path);
          return result.toString();
        })
        .post("/", async ({ body, query, basicAuth }) => {

          if (!query.query && body) {
                query.query = body
                query.query = query.query.split('\n').join(' ').trim()
                body = false
          } else if (query.query && body) {
                // TODO: replace with stdin pipe for binary support
                body = body.split('\n').join('').trim()
                query.query = query.query + ` ${body}`
          }

          if (!query.query && !body) throw new Error('no query, no party.')
          if (!query.format) query.format = query.default_format || 'CSV';
          if (!query.worker) query.worker = true;

          let path = false;
          if(basicAuth?.token){
              path = DATAPATH + basicAuth.token
          }

          if (query.database) {
            await controller.query(("USE "+query.database).toString(), query.format.toString(), path)
          }

          let result = await controller.query(query.query ? query.query.toString() : '', query.format.toString(), path, query.worker);
          return result.toString()
        })
        .post('/mirror', ({ body }) => body)
        .listen({ port: PORT, hostname: HOST })

console.log(`chdb-bun ${version}HTTP API running at ${HOST}:${PORT}`)
