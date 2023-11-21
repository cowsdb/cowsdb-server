import { db, chdb } from "./chdb.ts";

let conn = new db('CSV', '/tmp/')

process.on("message", (message) => {
  let result;
  if(message.query && message.format && message.path){
    try {
        result = conn.session(message.query, message.format, message.path);
        // console.log(result);
        process.send({ data: result, type: "response", id: message.id });
        // process.stdout.write(result);
    } catch(e) {
	process.stdout.write('process crashed', process.stderr)
        process.send({ data: e, type: "response", id: message.id });
    }
  }
});

process.send({ message: "DB Worker Init", type: 0 });

process.stdin.on('data', (chunk) => {
  console.log('stdin:', chunk.toString());
});
