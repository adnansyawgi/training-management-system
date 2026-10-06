const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello welcome to Node JS');
});

server.listen(3000, () => {
    console.log('HTTP server is running at http://localhost:3000');
});