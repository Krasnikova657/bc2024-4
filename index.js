const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;  // Імпорт модуля fs.promises для роботи з файлами
const path = require('path');  // Для роботи з шляхами до файлів
const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cache>', 'Cache directory');

program.parse(process.argv);

const options = program.opts();

// Функція для читання файлу
async function readFile(filePath) {
  try {
    const data = await fs.readFile(filePath);
    return data;
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

// Функція для запису файлу
async function writeFile(filePath, data) {
  try {
    await fs.writeFile(filePath, data);
    console.log(`File written: ${filePath}`);
  } catch (error) {
    console.error('Error writing file:', error);
  }
}

// Функція для видалення файлу
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Створення HTTP сервера
const server = http.createServer(async (req, res) => {
  const filePath = path.join(options.cache, req.url.substring(1)); // Отримання шляху до файлу

  if (req.method === 'GET') {
    const data = await readFile(filePath);
    if (data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'}); // Змінити тип контенту на необхідний
      res.end(data);
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found');
    }
  } else if (req.method === 'PUT') {
    let body = [];
    req.on('data', chunk => {
      body.push(chunk);
    }).on('end', async () => {
      const buffer = Buffer.concat(body);
      await writeFile(filePath, buffer);
      res.writeHead(201, {'Content-Type': 'text/plain'});
      res.end('File uploaded');
    });
  } else if (req.method === 'DELETE') {
    await deleteFile(filePath);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('File deleted');
  } else {
    res.writeHead(405, {'Content-Type': 'text/plain'});
    res.end('Method not allowed');
  }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});
