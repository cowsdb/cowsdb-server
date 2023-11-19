import { Elysia, t } from "elysia";
import { db } from "./chdb.js";

let PORT = process.env.PORT || 8123
let HOST = process.env.HOST || '0.0.0.0'

const conn = new db('CSV')

const app = new Elysia()
        .onRequest(({ set }) => {
		set.headers = {
			'Access-Control-Allow-Origin': '*'
		}
	})
        .onError(({ code, error }) => {
          return new Response(error.toString())
        })
	.get('/play', () => Bun.file('public/play.html'))
        .get("/", ({ query }) => {

          if (!query.query) throw new Error('no query, no party.')
	  if (!query.format) query.format = query.default_format || 'CSV';
	  console.log("query", query);

	  let result = conn.query(query.query, query.format);
	  console.log("res", result);
	  return result.toString();

        })
        .post("/", ({ body, query }) => {

	  if (!query.query && body) {
		query.query = body
		body = false
	  }
	  if (query.database)
		console.log(query.database);

          if (!query.query) throw new Error('no query, no party.')
	  if (!query.format) query.format = query.default_format || 'CSV';

	  console.log("query", query);

	  let result = conn.query(query.query, query.format);
	  console.log("res", result);

	  return result.toString()

        })
	.post('/mirror', ({ body }) => body)
	.listen({ port: PORT, hostname: HOST })

console.log('🦊Elysia is running at :'+PORT)
