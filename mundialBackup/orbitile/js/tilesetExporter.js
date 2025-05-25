console.log("tilesetExporter.js loaded");

/**
 * Initiates the process of fetching tile data, generating a 3D model,
 * and offering it for download.
 *
 * @param {Array<Array<number>>} tileset - An array of ZL21 tile coordinates, e.g., [[z, x, y], [z, x, y], ...]
 * @param {string} textureUrlTemplate - URL template for the texture tiles, e.g., "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
 * @param {string} terrainUrlTemplate - URL template for the terrain tiles, e.g., "https://terrain.openglobus.org/all/{z}/{x}/{y}.png"
 * @param {string} tilesetName - A name for the tileset.
 * @param {function(string): void} onGLTFReadyCallback - Callback function to handle the generated GLTF JSON string.
 */
async function exportTilesetToGLTF(tileset, textureUrlTemplate, terrainUrlTemplate, tilesetName = 'tileset', onGLTFReadyCallback) {
    console.log(`Exporting tileset "${tilesetName}" with ${tileset.length} tiles.`);
    if (!tileset || tileset.length === 0) {
        console.error("No tiles provided for export.");
        if (onGLTFReadyCallback) onGLTFReadyCallback(null, "No tiles provided.");
        return;
    }

    if (!window.THREE || !THREE.GLTFExporter) {
        console.error("THREE.js or THREE.GLTFExporter is not loaded.");
        alert("THREE.js or GLTFExporter library is missing. Cannot export 3D model.");
        if (onGLTFReadyCallback) onGLTFReadyCallback(null, "THREE.js or GLTFExporter missing.");
        return;
    }

    const TILE_SIZE_UNITS = 100; // Defined in generateTileMesh, used for positioning.
    const combinedModel = new THREE.Group();
    combinedModel.name = tilesetName;

    // Determine bounds for relative positioning
    let minX = Infinity, minY = Infinity;
    tileset.forEach(tile => {
        minX = Math.min(minX, tile[1]);
        minY = Math.min(minY, tile[2]);
    });

    try {
        for (let i = 0; i < tileset.length; i++) {
            const tileCoords = tileset[i];
            const [z, x, y] = tileCoords;
            console.log(`Processing tile ${i+1}/${tileset.length}: Z${z}, X${x}, Y${y}`);

            const textureImageUrl = textureUrlTemplate
                .replace('{z}', z)
                .replace('{x}', x)
                .replace('{y}', y)
                .replace('{s}', ['a', 'b', 'c'][i % 3]); // Basic subdomain cycling

            console.log("Fetching texture:", textureImageUrl);
            const textureImage = await loadImage(textureImageUrl);
            console.log("Texture image loaded for tile:", x, y);

            const terrainTileUrl = terrainUrlTemplate
                .replace('{z}', z)
                .replace('{x}', x)
                .replace('{y}', y)
                .replace('{s}', ['a', 'b', 'c'][i % 3]); // Basic subdomain cycling

            console.log("Fetching terrain tile:", terrainTileUrl);
            const terrainData = await fetchTerrainTile(terrainTileUrl);
            
            if (!terrainData) {
                console.warn(`Failed to get terrain data for tile Z${z}X${x}Y${y}. Skipping this tile.`);
                continue; // Skip this tile if terrain data is missing
            }
            console.log("Terrain data processed for tile:", x, y);

            const mesh = generateTileMesh(terrainData, textureImage, TILE_SIZE_UNITS);
            
            // Position the mesh relative to the minX, minY of the tileset
            mesh.position.x = (x - minX) * TILE_SIZE_UNITS;
            mesh.position.y = -(y - minY) * TILE_SIZE_UNITS; // Invert Y for typical map to 3D scene
            mesh.position.z = 0; // Height is within the mesh's vertices

            combinedModel.add(mesh);
            console.log(`Added mesh for tile Z${z}X${x}Y${y} to group at position`, mesh.position);
        }

        if (combinedModel.children.length === 0) {
            console.error("No meshes were generated for the tileset.");
            if (onGLTFReadyCallback) onGLTFReadyCallback(null, "No meshes generated.");
            return;
        }

        console.log("All tiles processed. Exporting combined model to GLTF...");
        const gltfExporter = new THREE.GLTFExporter();
        gltfExporter.parse(
            combinedModel,
            function (gltf) { // Success callback
                const output = JSON.stringify(gltf, null, 2);
                console.log(`GLTF generated for tileset "${tilesetName}". Size: ~${(output.length / 1024).toFixed(2)} KB`);
                if (onGLTFReadyCallback) {
                    onGLTFReadyCallback(output);
                } else {
                    // Fallback to download if no callback provided (for testing)
                    downloadJSON(output, `${tilesetName}.gltf`);
                }
            },
            function (error) { // Error callback
                console.error(`An error happened during GLTF exportation for tileset "${tilesetName}":`, error);
                if (onGLTFReadyCallback) onGLTFReadyCallback(null, error.message || "GLTF export error.");
            },
            { binary: false } // Export as .gltf (JSON)
        );

    } catch (error) {
        console.error(`Error during tileset export process for "${tilesetName}":`, error);
        if (onGLTFReadyCallback) onGLTFReadyCallback(null, error.message || "General export error.");
    }
}

/**
 * Loads an image from a URL.
 * @param {string} url - The URL of the image.
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Handle CORS if fetching from different domains
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(`Failed to load image: ${url}`, err);
            reject(err);
        };
        img.src = url;
    });
}

/**
 * Fetches a terrain tile and decodes it into a heightmap.
 * THIS IS A CRITICAL FUNCTION AND NEEDS THE CORRECT DECODING LOGIC.
 * @param {string} url - The URL of the terrain tile.
 * @returns {Promise<Array<Array<number>>|null>} A 2D array representing the heightmap, or null on error.
 */
async function fetchTerrainTile(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch terrain tile ${url}: ${response.statusText}`);
            return null;
        }
        const imageBlob = await response.blob();
        const imageBitmap = await createImageBitmap(imageBlob);

        // TODO: Implement actual terrain decoding (e.g., from RGB PNG to height values)
        // This is a placeholder and will need to be specific to the terrain tile format.
        // For example, if it's a Mapbox Terrain-RGB like PNG:
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;

        const heightmap = [];
        for (let r = 0; r < height; r++) {
            const row = [];
            for (let c = 0; c < width; c++) {
                const i = (r * width + c) * 4;
                const R = data[i];
                const G = data[i + 1];
                const B = data[i + 2];
                // Assuming Mapbox Terrain-RGB encoding for OpenGlobus terrain tiles:
                // height = -10000 + (R * 256 * 256 + G * 256 + B) * 0.1
                const terrainHeight = -10000 + (R * 256 * 256 + G * 256 + B) * 0.1;
                row.push(terrainHeight);
            }
            heightmap.push(row);
        }
        console.log(`Terrain tile ${url} decoded into ${width}x${height} heightmap.`);
        return heightmap;

    } catch (error) {
        console.error(`Error fetching or processing terrain tile ${url}:`, error);
        return null;
    }
}

/**
 * Generates a THREE.Mesh for a single tile based on heightmap and texture.
 * @param {Array<Array<number>>} heightmap - 2D array of elevation values.
 * @param {HTMLImageElement} textureImage - The texture for the tile.
 * @param {number} tileSizeInSceneUnits - The size (width/height) of the tile mesh in 3D scene units.
 * @returns {THREE.Mesh}
 */
function generateTileMesh(heightmap, textureImage, tileSizeInSceneUnits) {
    if (!heightmap || heightmap.length === 0 || heightmap[0].length === 0) {
        console.error("Invalid heightmap data provided to generateTileMesh.");
        return new THREE.Mesh(); // Return an empty mesh or throw error
    }
    const tileWidthSegments = heightmap[0].length - 1;
    const tileHeightSegments = heightmap.length - 1;

    if (tileWidthSegments <= 0 || tileHeightSegments <= 0) {
        console.error("Heightmap dimensions are too small for segments.");
        return new THREE.Mesh();
    }
    
    const geometry = new THREE.PlaneGeometry(
        tileSizeInSceneUnits, tileSizeInSceneUnits,
        tileWidthSegments, tileHeightSegments
    );

    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
        // Corresponding (x,y) in the heightmap grid
        // This mapping needs to be precise. PlaneGeometry vertices are ordered row by row.
        const xIndex = Math.round((vertices[j] / TILE_SIZE_UNITS + 0.5) * tileWidthSegments);
        const yIndex = Math.round((-vertices[j + 1] / TILE_SIZE_UNITS + 0.5) * tileHeightSegments); // Y is inverted in PlaneGeometry

        const clampedX = Math.max(0, Math.min(xIndex, tileWidthSegments));
        const clampedY = Math.max(0, Math.min(yIndex, tileHeightSegments));
        
        if (heightmap[clampedY] && typeof heightmap[clampedY][clampedX] !== 'undefined') {
            vertices[j + 2] = heightmap[clampedY][clampedX]; // Set Z value (height)
        } else {
             vertices[j + 2] = 0; // Default height if out of bounds (should not happen with clamping)
        }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals(); // Important for lighting

    const texture = new THREE.Texture(textureImage);
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        // side: THREE.DoubleSide, // For debugging
        // wireframe: true // For debugging
    });

    return new THREE.Mesh(geometry, material);
}

/**
 * Helper to trigger download of a JSON string as a .gltf file.
 * @param {string} jsonString
 * @param {string} filename
 */
function downloadJSON(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`Download initiated for ${filename}`);
}

// Example Usage (to be called from main.js or console for testing):
// async function testExport() {
//     // These are placeholders - get actual ZL21 tile coordinates and URL templates
//     const testTileset = [[21, 382603, 760999]]; // Example ZL21 tile (near Statue of Liberty)
//     const osmTextureUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"; // Check actual OSM tile server (a,b,c subdomains)
//     const globusTerrainUrl = "https://terrain.openglobus.org/all/{z}/{x}/{y}.png"; // Check actual OpenGlobus terrain server
//
//     // Ensure THREE.js is loaded via a <script> tag in index.html
//     // <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//     // <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js"></script>
//
//     if (typeof THREE === 'undefined' || typeof THREE.GLTFExporter === 'undefined') {
//         console.error("THREE.js or THREE.GLTFExporter not found. Make sure they are included in index.html.");
//         alert("THREE.js or GLTFExporter missing. Check console.");
//         return;
//     }
//
//     await exportTilesetToGLTF(testTileset, osmTextureUrl, globusTerrainUrl, "StatueOfLiberty_Tile");
// }
// // To test from console: testExport();
// // Or, call from a button in main.js