// kart-service.js - Module for interacting with Kart repositories

const { exec } = require('child_process');
const path = require('path');

const fs = require('fs').promises; // Need fs for directory checks/creation

// Define the base path for Kart repositories relative to this service file
const KART_REPOS_BASE_PATH = path.resolve(__dirname, 'kart-repos');

// --- Allowed Kart Commands ---
// Define a list of safe commands to prevent arbitrary execution
// Expand this list as needed for specific functionalities
const ALLOWED_KART_COMMANDS = [
    'status',
    'log',
    'ls-files',
    'cat', // Use with caution, ensure file paths are validated
    'init', // For creating new repos
    'branch',
    'checkout',
    'merge', // Core gameplay mechanic
    'commit', // Needed for saving changes
    'import', // Needed for adding initial data
    'add', // Needed before commit
    // Add other commands required by the application logic (e.g., diff, show)
];

/**
 * Executes a validated Kart command within a specific repository.
 * @param {string} repoName - The name of the repository within KART_REPOS_BASE_PATH.
 * @param {string} commandArgs - The Kart command and its arguments (e.g., "status", "log -n 5", "commit -m 'message'").
 * @returns {Promise<string>} Resolves with the stdout of the command.
 * @throws {Error} Rejects with an error if the command fails or is disallowed.
 */
function executeKartCommand(repoName, commandArgs) {
    return new Promise((resolve, reject) => {
        if (!repoName || !commandArgs) {
            return reject(new Error('Repository name and command arguments are required.'));
        }

        // Allow for nested repo paths, e.g., "user1/site123"
        // Basic sanitization to prevent path traversal beyond the base path
        const relativeRepoPath = path.normalize(repoName).replace(/^(\.\.(\/|\\|$))+/, '');
        if (relativeRepoPath.includes('..')) { // Double check after normalize
             return reject(new Error(`Invalid repository path format (contains '..'): ${repoName}`));
        }
        const repoPath = path.join(KART_REPOS_BASE_PATH, relativeRepoPath);

        // Ensure the base directory exists (create if not - might need adjustments based on security)
        // For simplicity now, we assume base exists, but check repoPath parent later if needed

        // Validate the command
        const commandParts = commandArgs.trim().split(' ');
        const kartCommand = commandParts[0];

        if (!ALLOWED_KART_COMMANDS.includes(kartCommand)) {
            return reject(new Error(`Disallowed Kart command: ${kartCommand}`));
        }

        // TODO: Add more specific argument validation/sanitization based on the command
        // e.g., for 'cat', ensure the file path argument is safe.

        const fullCommand = `kart ${commandArgs}`; // Prepend "kart"
        const options = { cwd: repoPath }; // Execute within the specific repo directory

        console.log(`Executing Kart command in ${repoPath}: ${fullCommand}`);

        exec(fullCommand, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command '${fullCommand}' in ${repoPath}: ${error.message}`);
                console.error(`stderr: ${stderr}`);
                // Reject with a more informative error object
                const err = new Error(`Kart command failed: ${error.message}`);
                err.stderr = stderr;
                err.command = fullCommand;
                err.repo = repoName;
                return reject(err);
            }
            // Kart often uses stderr for informational messages, log it but don't necessarily reject
            if (stderr) {
                console.warn(`Kart command stderr for '${fullCommand}' in ${repoPath}: ${stderr}`);
            }
            resolve(stdout.trim()); // Resolve with the trimmed stdout
        });
    });
}

// --- Specific Kart Operation Functions (Examples) ---

/**
 * Gets the status of a Kart repository.
 * @param {string} repoName - The name of the repository.
 * @returns {Promise<string>} Resolves with the status output.
 */
async function getRepoStatus(repoName) {
    // TODO: Parse the status output into a structured object if needed
    return executeKartCommand(repoName, 'status');
}

/**
 * Lists files in a Kart repository.
 * @param {string} repoName - The name of the repository.
 * @returns {Promise<string[]>} Resolves with an array of file paths.
 */
async function listRepoFiles(repoName) {
    const output = await executeKartCommand(repoName, 'ls-files');
    return output.split('\n').filter(line => line.trim() !== ''); // Split stdout into lines
}

/**
 * Initializes a new Kart repository if it doesn't exist.
 * @param {string} repoName - The relative path for the repository (e.g., "user1/site123").
 * @returns {Promise<string>} Resolves with init output or message indicating existence.
 */
async function initRepo(repoName) {
    const relativeRepoPath = path.normalize(repoName).replace(/^(\.\.(\/|\\|$))+/, '');
     if (relativeRepoPath.includes('..')) {
         throw new Error(`Invalid repository path format (contains '..'): ${repoName}`);
    }
    const repoPath = path.join(KART_REPOS_BASE_PATH, relativeRepoPath);

    try {
        // Check if directory exists
        await fs.access(repoPath);
        // If access doesn't throw, directory exists, check if it's a kart repo
        try {
            await executeKartCommand(repoName, 'status'); // Status fails on non-repo dirs
            console.log(`Kart repository '${repoName}' already exists.`);
            return `Repository '${repoName}' already exists.`;
        } catch (statusError) {
             // If status fails, it might be an empty dir or non-kart dir - attempt init cautiously
             console.warn(`Directory '${repoName}' exists but 'kart status' failed. Attempting init...`);
             // Ensure parent directory exists before init
             await fs.mkdir(path.dirname(repoPath), { recursive: true });
             return executeKartCommand(repoName, 'init .'); // Init in the existing directory
        }
    } catch (error) {
        // If access throws ENOENT, directory doesn't exist, create it and init
        if (error.code === 'ENOENT') {
            console.log(`Creating directory and initializing Kart repository '${repoName}'...`);
            await fs.mkdir(repoPath, { recursive: true });
            // Pass relative path '.' to init command since cwd is set to repoPath
            return executeKartCommand(repoName, 'init .');
        }
        // Rethrow other errors
        throw error;
    }
}

/**
 * Imports data from stdin and commits it to the repository.
 * Assumes data is formatted correctly for kart import.
 * @param {string} repoName - The name of the repository.
 * @param {string} dataToImport - The string data to pipe into kart import.
 * @param {string} message - The commit message.
 * @param {string} [author='Terrallax Backend <noreply>'] - The commit author.
 * @returns {Promise<string>} Resolves with the commit output.
 */
async function importAndCommit(repoName, dataToImport, message, author = 'Terrallax Backend <noreply>') {
    // 1. Import data via stdin
    // Note: executeKartCommand needs modification to support stdin input
    // For now, let's simulate by writing to a temp file and using 'kart import --dataset <name> <file>'
    // This requires knowing the dataset name structure. Let's assume a 'boundary.geojson' dataset for simplicity.

    const relativeRepoPath = path.normalize(repoName).replace(/^(\.\.(\/|\\|$))+/, '');
     if (relativeRepoPath.includes('..')) {
         throw new Error(`Invalid repository path format (contains '..'): ${repoName}`);
    }
    const repoPath = path.join(KART_REPOS_BASE_PATH, relativeRepoPath);
    const tempFilePath = path.join(repoPath, `temp_import_${Date.now()}.geojson`); // Temporary file in repo

    try {
        await fs.writeFile(tempFilePath, dataToImport);
        console.log(`Wrote data to temporary file: ${tempFilePath}`);

        // Use kart import command
        const importArgs = `import --dataset boundary ${path.basename(tempFilePath)}`;
        await executeKartCommand(repoName, importArgs);
        console.log(`Kart import successful for ${repoName}`);

    } finally {
        // Clean up temporary file
        try {
            await fs.unlink(tempFilePath);
            console.log(`Removed temporary file: ${tempFilePath}`);
        } catch (unlinkError) {
            console.warn(`Failed to remove temporary import file ${tempFilePath}:`, unlinkError);
        }
    }

    // 2. Commit the changes (import automatically stages)
    // Escape quotes in message and author for shell safety
    const escapedMessage = message.replace(/'/g, "'\\''");
    const escapedAuthor = author.replace(/'/g, "'\\''");
    const commitArgs = `commit -m '${escapedMessage}' --author '${escapedAuthor}'`;
    return executeKartCommand(repoName, commitArgs);
}


// TODO: Add more functions:
// - createBranch(repoName, branchName)
// - mergeBranch(repoName, sourceBranch) -> uses 'merge' (core for gameplay)
// - getFileContent(repoName, filePath) -> uses 'cat' (needs path validation)
// - getLog(repoName, options) -> uses 'log'

module.exports = {
    executeKartCommand, // Expose generic executor (use with caution)
    getRepoStatus,
    listRepoFiles,
    initRepo,
    importAndCommit,
    // createBranch, // Removed undefined export
    // mergeBranch, // Removed undefined export
    // Export other specific functions as they are added
};