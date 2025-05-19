const express = require('express');
const path = require('path'); // Require the path module

const app = express();
const port = 3000;

// Explicitly serve map-interface.html for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../AR.js/map-interface.html'));
});

const arJsPath = path.join(__dirname, '../AR.js');
console.log('Serving static files from:', arJsPath); // Log the path

// Serve other static files from the AR.js directory using absolute path
app.use(express.static(arJsPath));

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});