import { db, chdb } from "./chdb.ts";

let conn = new db('CSV', '/tmp/')

process.on("message", async (message) => {
  let result;
  if(message.query && message.format && message.path){
    try {
        result = conn.session(message.query, message.format, message.path);
        process.send({ data: result, type: "response", id: message.id });
        // process.stdout.write(result);
    } catch(e) {
	const err = await new Response(proc.stderr).text()
	process.stdout.write('process crashed', err, e)
        process.send({ data: err, type: "response", id: message.id });
    }
  }
});

process.send({ message: "DB Worker Init", type: 0 });

process.stdin.on('data', (chunk) => {
  console.log('stdin:', chunk.toString());
});
