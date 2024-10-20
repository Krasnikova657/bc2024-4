const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent');
const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cache>', 'Cache directory');

program.parse(process.argv);

const options = program.opts();

async function readFile(filePath) {
  try {
    const data = await fs.readFile(filePath);
    return data;
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

async function writeFile(filePath, data) {
  try {
    await fs.writeFile(filePath, data);
    console.log(`File written: ${filePath}`);
  } catch (error) {
    console.error('Error writing file:', error);
  }
}

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

async function fetchImageFromHttpCat(statusCode) {
  try {
    const response = await superagent.get(`https://http.cat/${statusCode}`).buffer(); // Use buffer() for image data
    return response.body; // Use response.body for binary image data
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const filePath = path.join(options.cache, req.url.substring(1));

  if (req.method === 'GET') {
    const data = await readFile(filePath);
    if (data) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } else {
      // If the file is not found, fetch from http.cat
      const statusCode = req.url.substring(1);
      const catImage = await fetchImageFromHttpCat(statusCode);
      if (catImage) {
        await writeFile(filePath, catImage);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(catImage);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found and failed to fetch from http.cat');
      }
    }
  } else if (req.method === 'PUT') {
    let body = [];
    req.on('data', chunk => {
      body.push(chunk);
    }).on('end', async () => {
      const buffer = Buffer.concat(body);
      await writeFile(filePath, buffer);
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end('File uploaded');
    });
  } else if (req.method === 'DELETE') {
    await deleteFile(filePath);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('File deleted');
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});
