# Mondocosm Development Environment Setup Guide

This guide provides step-by-step instructions for setting up the Mondocosm development environment on a new computer, including the frontend (Mundial), backend server, and Mundial Units Node components.

## Overview

Mondocosm is a decentralized geospatial metaverse platform with several key components:

- **Mundial**: Web-based frontend application
- **Backend Server**: Node.js backend services
- **Mundial Units Node**: Native cryptocurrency implementation (Nano fork)
- **MondocosmOS**: Foundational layer (planned integration)

## Prerequisites

### Required Software

1. **Git**
   - Required for cloning the repository and managing submodules
   - [Download Git](https://git-scm.com/downloads)

2. **Node.js & npm**
   - Required for both frontend and backend components
   - Recommended version: LTS (14.x or newer)
   - [Download Node.js](https://nodejs.org/)

3. **C++ Build Environment**
   - Required for building the Mundial Units Node component
   - **Linux**: 
     ```bash
     # Ubuntu/Debian
     sudo apt-get install build-essential cmake
     
     # Fedora/RHEL
     sudo dnf install gcc-c++ cmake
     ```
   - **macOS**:
     ```bash
     # Install Xcode Command Line Tools
     xcode-select --install
     
     # Install CMake via Homebrew
     brew install cmake
     ```
   - **Windows**:
     - Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
     - Install [CMake](https://cmake.org/download/)

4. **Boost Libraries**
   - The project uses a custom subset of Boost modules
   - Will be handled by the build script, but system Boost development headers may be needed
   - **Linux**: `sudo apt-get install libboost-all-dev` (Ubuntu/Debian)
   - **macOS**: `brew install boost` (via Homebrew)
   - **Windows**: CMake will download and build as needed

5. **OpenCL Development Files** (Optional)
   - May be required for GPU acceleration features
   - **Linux**: `sudo apt-get install opencl-headers ocl-icd-opencl-dev`
   - **macOS**: Included with macOS
   - **Windows**: Included with GPU drivers or available from GPU vendor

## Setup Process

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/yourusername/mondocosm.git
cd mondocosm

# Initialize and fetch submodules
git submodule update --init --recursive
```

### 2. Set up Frontend (Mundial)

```bash
# Navigate to the frontend directory
cd mundial

# Install dependencies
npm install

# To run the frontend (development mode)
npm start
```

The frontend should be accessible at http://localhost:1234 (or another port specified by Parcel).

### 3. Set up Backend Server

```bash
# Navigate to the backend directory
cd ../backend-server

# Install dependencies
npm install

# To run the backend
npm start
```

The backend server should start and listen on the configured port (check server.js for details).

### 4. Build Mundial Units Node

This component is a fork of the Nano cryptocurrency node, adapted for the Mondocosm ecosystem.

```bash
# Navigate to the mundial-units-node directory
cd ../mundial-units-node

# Initialize and update the Boost submodule with required components
./boost_checkout_lite.sh

# Create build directory
mkdir -p build
cd build

# Configure with CMake
cmake \
  -DCMAKE_BUILD_TYPE=Debug \
  -DPORTABLE=ON \
  -DACTIVE_NETWORK=nano_live_network \
  -DNANO_TEST=OFF \
  -DNANO_GUI=OFF \
  ..

# Build using all available cores
cmake --build . --parallel $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

# Return to the project root
cd ../..
```

### 5. Configuration

Review any configuration files for environment-specific settings:

- Check `backend-server/server.js` for backend configuration
- Look for any `.env` files or configuration objects in the code
- Adjust settings as needed for your local environment

## IINE Controller Integration

The IINE controller integration for UI/UX and MAGI game development is a planned feature. After setting up the base environment:

1. Install any necessary drivers for the IINE controller on your system
2. The integration will involve developing specific modules within `mundial` to handle input from the controller
3. Implementation will leverage the Buckminster Fuller Geoscope concept for visualization and interaction

## Troubleshooting

### Common Issues

1. **Submodule initialization fails**
   - Ensure you have proper permissions for the repositories
   - Try using HTTPS instead of SSH for submodule URLs

2. **Node.js dependency issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

3. **CMake configuration errors**
   - Ensure all required development libraries are installed
   - Check CMake version (minimum 3.14 required)

4. **Build failures in Mundial Units Node**
   - Check compiler version compatibility
   - Ensure Boost libraries are properly initialized

## Next Steps

After successfully setting up the development environment:

1. Explore the codebase to understand the project structure
2. Review the `README.md` and whitepaper for project vision and architecture
3. Check for any TODO comments or known issues to address
4. Begin implementing planned features or fixing existing issues

## Additional Resources

- Refer to `MONDOCOSM_WHITEPAPER.md` for detailed project architecture
- Check `CONCEPT_DESIGN_OUTLINE.md` for design principles
- Review `DEVELOPMENT_PLAN.md` for roadmap and priorities