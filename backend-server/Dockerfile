# Use an official Node.js runtime as a parent image (Alpine for smaller size)
# Consider using a specific architecture if targeting devices like Jetson (e.g., arm64v8/node:18-alpine)
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
# This leverages Docker build caching
COPY package*.json ./

# Install only production dependencies
# Using npm ci is generally recommended for faster, more reliable builds in CI/CD
RUN npm ci --only=production

# Bundle app source
COPY . .

# Make port 8765 available to the world outside this container
# This is the default port used in server.js
EXPOSE 8765

# Define the command to run your app using node
# This will be executed when the container starts
CMD [ "node", "server.js" ]

# --- Notes ---
# Environment Variables:
# This Dockerfile assumes configuration (like PORT, GITHUB_CLIENT_ID, IPFS_API_URL, etc.)
# will be passed in as environment variables when running the container.
# Example: docker run -p 8765:8765 -e PORT=8765 -e GITHUB_CLIENT_ID=... your-image-name
#
# Secrets Management:
# For sensitive data like GITHUB_CLIENT_SECRET, MATRIX_ACCESS_TOKEN, OPENSEARCH_AUTH,
# use proper secrets management (e.g., Docker secrets, Kubernetes secrets, HashiCorp Vault)
# instead of passing them directly as environment variables in production.
#
# Volumes:
# If your application needs persistent storage (e.g., for kart-repos, databases),
# you'll need to mount volumes when running the container.
# Example: docker run -v /path/on/host:/usr/src/app/kart-repos ... your-image-name
#
# Multi-stage Builds:
# For smaller production images, consider multi-stage builds to avoid including
# build tools or unnecessary files in the final image.