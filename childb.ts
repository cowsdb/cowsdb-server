import { db, chdb } from "./chdb.js";

let conn = new db('CSV', '/tmp/')


process.on("message", (message) => {
  let result;
  if(message.query && message.format && message.path){
        result = conn.session(message.query, message.format, message.path);
        // console.log(result);
        process.send({ data: result, type: "response", id: message.id });
        process.stdout.write(result);
  }
});

process.send({ message: "DB Worker Init", type: 0 });

process.stdin.on('data', (chunk) => {
  console.log('stdin:', chunk.toString());
});