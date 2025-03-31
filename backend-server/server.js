const http = require('http');
const Gun = require('gun');
const { exec } = require('child_process');
const path = require('path');

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
  // Example: Run a kart command on startup
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

  // Define the working directory for Kart commands if needed (e.g., path to a repo)
  const kartRepoPath = path.resolve(__dirname, 'kart-repos/world-data'); // Corrected absolute path
  console.log(`Attempting to execute command: cd ${kartRepoPath} && ${command}`); // Log the full command
  const fullCommand = `cd "${kartRepoPath}" && ${command}`; // Construct command with cd
  const options = {}; // No cwd option needed now

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

// Optional: Add some initial data or logic
gun.get('greeting').put({ message: 'Hello from Gun server!' });

module.exports = gun; // Export gun instance if needed elsewhere
// Expose the command execution function if you want to trigger it via Gun or HTTP
// module.exports.runKartCommand = runKartCommand;