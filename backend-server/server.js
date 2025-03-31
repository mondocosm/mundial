const http = require('http');
const Gun = require('gun');

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Handle Gun requests or serve a basic page if needed
  if (Gun.serve(req, res)) {
    return; // Gun handled the request
  }
  // Optional: Serve a simple status page or frontend files
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Gun server is running.');
});

// Initialize Gun on the server
const gun = Gun({
  web: server // Attach Gun to the HTTP server
});

// Start the server
const port = process.env.PORT || 8765;
server.listen(port, () => {
  console.log(`Gun server listening on http://localhost:${port}/gun`);
});

// Optional: Add some initial data or logic
gun.get('greeting').put({ message: 'Hello from Gun server!' });

module.exports = gun; // Export gun instance if needed elsewhere