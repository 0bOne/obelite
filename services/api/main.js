
const http = require('http');

const port = process.env.port;
if (!isFinite(port)) throw "please set env variable 'port'";


// Create a server object
const server = http.createServer((req, res) => {
  // Set the response HTTP header with HTTP status and Content type
  res.writeHead(200, {'Content-Type': 'text/plain'});

  // Send the response body "Hello, World!"
  res.end('Hello, API World!\n');
});

// The server listens on port 3000
server.listen(port, () => {
  console.log(`api server running at http://localhost:${port}/`);
});


