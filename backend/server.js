const http = require('http');
const express = require('express');
const cors = require('cors');
const Gun = require('gun');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises; // For async file operations
const crypto = require('crypto'); // For generating unique IDs

const app = express();
const server = http.createServer(app); // Use Express app for HTTP server

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(Gun.serve); // Serve Gun's '/gun' endpoint

// Initialize Gun on the server
const gun = Gun({
  web: server, // Attach Gun to the HTTP server
  radisk: true, // Enable Radisk for file system persistence for Gun
  file: 'radata' // Specify the directory for Gun data (relative to server.js)
});

const KART_REPO_PATH = path.resolve(__dirname, 'kart-repos/world-data');

// Ensure Kart repo directory exists
async function ensureKartRepoDir() {
    try {
        await fs.mkdir(KART_REPO_PATH, { recursive: true });
        // Optionally, initialize kart repo if it doesn't exist
        // For now, we assume it's pre-initialized or handled by direct kart commands.
        console.log(`Kart repository directory ensured at: ${KART_REPO_PATH}`);
    } catch (err) {
        console.error('Error ensuring Kart repository directory:', err);
    }
}


// Start the server
const port = process.env.PORT || 8765; // Keep existing port for Gun
server.listen(port, async () => {
  await ensureKartRepoDir();
  console.log(`Server (Express + Gun) listening on http://localhost:${port}`);
  console.log(`Gun peer accessible at http://localhost:${port}/gun`);
  runKartCommand('kart status'); // Test command within repo context
});

// Function to execute Kart commands
function runKartCommand(command) {
  // Ensure the command starts with 'kart ' for basic security/sanity check
  // Basic validation (adjust if running non-kart commands like pwd)
  // if (!command || !command.trim().startsWith('kart ')) {
  //   console.error('Invalid command format. Must start with "kart ".');
  //   return;
  // }
  if (!command) {
      console.error('No command provided.');
      return;
  }

  // kartRepoPath is now KART_REPO_PATH (global const)
  console.log(`Attempting to execute command in ${KART_REPO_PATH}: ${command}`);
  const fullCommand = `cd "${KART_REPO_PATH}" && ${command}`;
  const options = {};

  exec(fullCommand, options, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command '${command}': ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return;
    }
    if (stderr) {
      console.warn(`Command '${command}' stderr: ${stderr}`); // Log stderr as warning
    }
    console.log(`Command '${command}' stdout:\n${stdout}`);
  });
}

// --- API Endpoints ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running with Express' });
});

app.post('/api/kart/tilesets', async (req, res) => {
  const { name, zl21TileIds, metadata } = req.body;

  if (!name || !zl21TileIds || !Array.isArray(zl21TileIds) || zl21TileIds.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: name and zl21TileIds (array).' });
  }

  const tilesetId = metadata?.id || crypto.randomUUID();
  const filename = `${tilesetId}.json`;
  // Store tileset files in a dedicated subdirectory within the Kart repo
  const tilesetDir = path.join(KART_REPO_PATH, 'tilesets');
  const filePath = path.join(tilesetDir, filename);

  const tilesetData = {
    id: tilesetId,
    name,
    zl21TileIds,
    metadata: metadata || {},
    createdAt: new Date().toISOString()
  };

  try {
    await fs.mkdir(tilesetDir, { recursive: true }); // Ensure 'tilesets' directory exists
    await fs.writeFile(filePath, JSON.stringify(tilesetData, null, 2));
    console.log(`Tileset data saved to ${filePath}`);

    // Add and commit to Kart using runKartCommand
    // Note: runKartCommand is async in nature due to exec, but we're not awaiting its completion here.
    // For production, you might want to make runKartCommand return a Promise and await it.
    runKartCommand(`kart add tilesets/${filename}`);
    // Add a delay or chain commands carefully if 'kart commit' depends on 'add' finishing immediately
    // For simplicity, committing with a generic message.
    setTimeout(() => { // Simple delay to allow add to (likely) complete
        runKartCommand(`kart commit -m "Add tileset ${tilesetId}: ${name}"`);
    }, 500);


    res.status(201).json({ message: 'Tileset created and submitted to Kart.', tileset: tilesetData });
  } catch (error) {
    console.error('Error processing tileset for Kart:', error);
    res.status(500).json({ error: 'Failed to save tileset data.' });
  }
});


// Optional: Add some initial data or logic
gun.get('greeting').put({ message: 'Hello from Gun server!' });

module.exports = { app, server, gun }; // Export app, server, and gun instance
// module.exports.runKartCommand = runKartCommand; // If needed