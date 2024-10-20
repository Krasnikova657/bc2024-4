const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'address of the server')
  .requiredOption('-p, --port <port>', 'port of the server')
  .requiredOption('-c, --cache <cache>', 'path to the directory containing cached files')
  .parse(process.argv);
  const http = require('http');

const server = http.createServer((req, res) => {
  // Обробка запитів тут
});

server.listen(program.host, program.port, () => {
  console.log(`Server running at http://${program.host}:${program.port}/`);
});