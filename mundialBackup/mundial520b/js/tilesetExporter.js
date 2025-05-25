console.log("tilesetExporter.js loaded");

/**
 * Initiates the process of fetching tile data, generating a 3D model,
 * and offering it for download.
 *
 * @param {Array<Array<number>>} tileset - An array of ZL21 tile coordinates, e.g., [[z, x, y], [z, x, y], ...]
 * @param {string} textureUrlTemplate - URL template for the texture tiles, e.g., "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
 * @param {string} terrainUrlTemplate - URL template for the terrain tiles, e.g., "https://terrain.openglobus.org/all/{z}/{x}/{y}.png"
 * @param {string} tilesetName - A name for the tileset.
 * @param {object} options - Options object: { target: 'download' | 'viewer', onComplete: function(result) }
 *                           result: { gltfData?: string, sceneObject?: THREE.Group, error?: string }
 * @param {object} cesiumScene - Optional Cesium.Scene object for sampling heights.
 */
async function exportTilesetToGLTF(
    selectionCriteria,
    options = {}
) {
    const {
        textureUrlTemplate,
        terrainUrlTemplate,
        tilesetName = 'tileset',
        onComplete,
        cesiumScene, // For heightmap path, or context for 3D Tiles
        
        dataSourceType = 'heightmap', // 'heightmap' or '3dtiles'
        // dataSourceRef, // Cesium.Cesium3DTileset object if dataSourceType is '3dtiles'
                           // For now, assume selectionCriteria will contain tile URLs and transforms if '3dtiles'
        target = 'download' // Default target from original options, though download modal handles this now.
                           // Still useful for 'viewer' target to bypass GLTF string generation.
    } = options;

    console.log(`[EXPORTER_ENTRY] Exporting tileset "${tilesetName}". Mode: ${dataSourceType}. Target: ${target}`);

    if (!window.THREE) {
        console.error("THREE.js is not loaded.");
        if (onComplete) onComplete({ error: "THREE.js missing." });
        return;
    }

    const combinedModel = new THREE.Group();
    combinedModel.name = tilesetName;

    if (dataSourceType === '3dtiles') {
        const selectedTilesData = selectionCriteria; // Expects array of { contentUrl: string, transformMatrix: THREE.Matrix4 }

        if (!selectedTilesData || !Array.isArray(selectedTilesData) || selectedTilesData.length === 0) {
            console.error("[EXPORTER_3DTILES] No 3D tiles data provided for extraction or invalid format.");
            if (onComplete) onComplete({ error: "No 3D tiles data selected/provided for extraction." });
            return;
        }
        if (!THREE.GLTFLoader) {
            console.error("[EXPORTER_3DTILES] THREE.GLTFLoader is required but not found.");
            if (onComplete) onComplete({ error: "THREE.GLTFLoader missing for 3D Tiles processing." });
            return;
        }

        console.log(`[EXPORTER_3DTILES] Attempting to extract from ${selectedTilesData.length} selected 3D tile contents.`);
        try {
            const loader = new THREE.GLTFLoader();
            for (const tileInfo of selectedTilesData) {
                if (!tileInfo.contentUrl) {
                    console.warn("[EXPORTER_3DTILES] Tile info missing contentUrl, skipping:", tileInfo);
                    continue;
                }
                let glbBuffer;
                try {
                    console.log(`[EXPORTER_3DTILES] Fetching tile content: ${tileInfo.contentUrl}`);
                    const response = await fetch(tileInfo.contentUrl); // TODO: Add error handling for fetch
                    if (!response.ok) throw new Error(`Failed to fetch ${tileInfo.contentUrl}: ${response.statusText}`);
                    glbBuffer = await response.arrayBuffer();
                } catch (fetchErr) {
                    console.error(`[EXPORTER_3DTILES] Error fetching GLB for ${tileInfo.contentUrl}:`, fetchErr);
                    continue;
                }

                if (glbBuffer) {
                    try {
                        const gltf = await loader.parseAsync(glbBuffer, '');
                        const tileScene = gltf.scene;
                        if (tileInfo.transformMatrix && tileInfo.transformMatrix.isMatrix4) {
                            tileScene.applyMatrix4(tileInfo.transformMatrix);
                        } else {
                             console.warn("[EXPORTER_3DTILES] Tile info missing valid transformMatrix, adding to origin:", tileInfo.contentUrl);
                        }
                        combinedModel.add(tileScene);
                        console.log(`[EXPORTER_3DTILES] Added content from ${tileInfo.contentUrl}`);
                    } catch (parseErr) {
                        console.error(`[EXPORTER_3DTILES] Error parsing GLB from ${tileInfo.contentUrl}:`, parseErr);
                    }
                }
            }

            if (combinedModel.children.length === 0) {
                throw new Error("No meshes extracted/parsed from selected 3D tiles.");
            }
            
            if (window) {
                window.currentGltfJsonForDownload = null;
                window.currentSceneObjectForDownload = combinedModel;
                window.currentGltfFilename = `${tilesetName}_extracted3DTiles.gltf`;
            }
            if (onComplete) onComplete({ sceneObject: combinedModel }); // Primarily pass the THREE.Group

        } catch (error) {
            console.error(`[EXPORTER_3DTILES] Error during 3D Tiles extraction for "${tilesetName}":`, error);
            if (onComplete) onComplete({ error: error.message || "3D Tiles extraction failed." });
        }

    } else { // Default to 'heightmap' generation (original logic)
        console.log(`[EXPORTER_HEIGHTMAP] Generating model for "${tilesetName}" using heightmap method.`);
        const tilesWithBoundsAndCoords = selectionCriteria; // In this mode, selectionCriteria is the old tilesWithBoundsAndCoords

        if (!tilesWithBoundsAndCoords || !Array.isArray(tilesWithBoundsAndCoords) || tilesWithBoundsAndCoords.length === 0) {
            console.error("[EXPORTER_HEIGHTMAP] No tiles provided for heightmap-based export.");
            if (onComplete) onComplete({ error: "No tiles provided for heightmap generation." });
            return;
        }
        if (!THREE.GLTFExporter) { // GLTFExporter is essential for this path
            console.error("[EXPORTER_HEIGHTMAP] THREE.GLTFExporter is not loaded.");
            if (onComplete) onComplete({ error: "THREE.GLTFExporter missing." });
            return;
        }
        
        const TILE_SIZE_UNITS = 100;
        const TERRAIN_MESH_SEGMENTS = 16;
        // combinedModel is already initialized
        
        let minTileX = Infinity, minTileY = Infinity;
        tilesWithBoundsAndCoords.forEach(item => {
            if (item && item.tileCoords && item.tileCoords.length === 3) {
                minTileX = Math.min(minTileX, item.tileCoords[1]);
                minTileY = Math.min(minTileY, item.tileCoords[2]);
            } else {
                console.warn("[EXPORTER_HEIGHTMAP] Invalid item in tilesWithBoundsAndCoords:", item);
            }
        });

        try {
            for (let i = 0; i < tilesWithBoundsAndCoords.length; i++) {
                const item = tilesWithBoundsAndCoords[i];
                if (!item || !item.tileCoords || item.tileCoords.length !== 3 || !item.bounds) {
                    console.warn(`[EXPORTER_HEIGHTMAP] Skipping invalid tile item at index ${i}:`, item);
                    continue;
                }
                const tileCoords = item.tileCoords;
                const geographicBounds = item.bounds;
                const [z, x, y] = tileCoords;
                
                const currentTextureUrl = (textureUrlTemplate || "")
                    .replace('{z}', z).replace('{x}', x).replace('{y}', y)
                    .replace('{s}', ['a', 'b', 'c'][i % 3]);
                
                const textureImage = currentTextureUrl ? await loadImage(currentTextureUrl) : null;
                if(currentTextureUrl) console.log(`[EXPORTER_HEIGHTMAP] Texture for Z${z}X${x}Y${y}: ${textureImage ? 'Loaded' : 'Failed/Null'}, URL: ${currentTextureUrl}`);


                let heightmap = null;
                if (cesiumScene && geographicBounds) { // cesiumScene from options
                    heightmap = await sampleHeightsFromCesiumScene(geographicBounds, cesiumScene, TERRAIN_MESH_SEGMENTS + 1, TERRAIN_MESH_SEGMENTS + 1);
                     console.log(`[EXPORTER_HEIGHTMAP] Cesium sampling for Z${z}X${x}Y${y}: ${heightmap ? 'Success' : 'Failed/Null'}`);
                }
                if (!heightmap && terrainUrlTemplate) {
                    const currentTerrainUrl = terrainUrlTemplate.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{s}', ['a', 'b', 'c'][i % 3]);
                    heightmap = await fetchTerrainTileWithFallback([z,x,y], terrainUrlTemplate); // fetchTerrainTileWithFallback might need direct template
                    console.log(`[EXPORTER_HEIGHTMAP] Fallback terrain fetch for Z${z}X${x}Y${y}: ${heightmap ? 'Success' : 'Failed/Null'}, URL: ${currentTerrainUrl}`);
                }
                
                const mesh = generateTileMesh(heightmap, textureImage, TILE_SIZE_UNITS, TERRAIN_MESH_SEGMENTS);
                mesh.position.x = (x - minTileX) * TILE_SIZE_UNITS;
                mesh.position.y = -(y - minTileY) * TILE_SIZE_UNITS;
                combinedModel.add(mesh);
            }

            if (combinedModel.children.length === 0) {
                throw new Error("No meshes were generated for the heightmap tileset.");
            }

            if (target === 'viewer' && onComplete) { // Original 'viewer' target logic
                if (window) {
                    window.currentGltfJsonForDownload = null;
                    window.currentSceneObjectForDownload = combinedModel;
                    window.currentGltfFilename = `${tilesetName}_sceneHeightmap.gltf`;
                }
                onComplete({ sceneObject: combinedModel });
                return;
            }

            const gltfExporter = new THREE.GLTFExporter();
            gltfExporter.parse(
                combinedModel,
                function (gltf) {
                    const output = JSON.stringify(gltf, null, 2);
                    if (window) {
                        window.currentGltfJsonForDownload = output;
                        window.currentSceneObjectForDownload = combinedModel;
                        window.currentGltfFilename = `${tilesetName}.gltf`;
                    }
                    if (onComplete) onComplete({ gltfData: output, sceneObject: combinedModel });
                },
                function (error) {
                    console.error(`[EXPORTER_HEIGHTMAP] GLTF exportation error:`, error);
                    if (onComplete) onComplete({ error: error.message || "GLTF export error (heightmap path)." });
                },
                { binary: false }
            );

        } catch (error) {
            console.error(`[EXPORTER_HEIGHTMAP] Error during heightmap export for "${tilesetName}":`, error);
            if (onComplete) onComplete({ error: error.message || "Heightmap export process failed." });
        }
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
        img.onerror = (evt) => {
            console.error(`Failed to load image: ${url}`, evt);
            resolve(null); // Resolve with null so the exporter can use a fallback material
        };
        img.src = url; // Make sure img.src is set after handlers
    });
}

// New function to sample heights from Cesium
async function sampleHeightsFromCesiumScene(geographicBounds, cesiumScene, numSamplesX, numSamplesY) {
    // Detailed checks for Cesium and its methods
    console.log(`[SAMPLE_CESIUM_DEBUG] Entered sampleHeightsFromCesiumScene for bounds:`, geographicBounds);
    console.log("[SAMPLE_CESIUM_DEBUG] typeof window.Cesium:", typeof window.Cesium);
    if (window.Cesium) {
        console.log("[SAMPLE_CESIUM_DEBUG] typeof window.Cesium.sampleHeightMostDetailed:", typeof window.Cesium.sampleHeightMostDetailed);
        console.log("[SAMPLE_CESIUM_DEBUG] typeof window.Cesium.Cartographic:", typeof window.Cesium.Cartographic);
        if (window.Cesium.Cartographic) {
            console.log("[SAMPLE_CESIUM_DEBUG] typeof window.Cesium.Cartographic.fromDegrees:", typeof window.Cesium.Cartographic.fromDegrees);
        }
    } else {
        console.log("[SAMPLE_CESIUM_DEBUG] window.Cesium is not defined/accessible here.");
    }
    console.log("[SAMPLE_CESIUM_DEBUG] cesiumScene object received:", cesiumScene ? 'Exists' : 'Does NOT exist', cesiumScene);

    if (!cesiumScene || typeof window.Cesium === 'undefined' ||
        typeof window.Cesium.Cartographic !== 'object' || typeof window.Cesium.Cartographic.fromDegrees !== 'function') {
        console.warn("SAMPLE_CESIUM_FAIL: Cesium, Cesium.Cartographic, or Cesium.Cartographic.fromDegrees function not available.");
        return null;
    }

    let sampleFunction = null;
    if (cesiumScene && typeof cesiumScene.sampleHeightMostDetailed === 'function') {
        sampleFunction = (pos) => cesiumScene.sampleHeightMostDetailed(pos); // Cesium versions where it's on the scene
        console.log("[SAMPLE_CESIUM_DEBUG] Using scene.sampleHeightMostDetailed.");
    } else if (typeof window.Cesium.sampleHeightMostDetailed === 'function') {
        sampleFunction = (pos) => window.Cesium.sampleHeightMostDetailed(cesiumScene, pos); // Pass scene as first arg
        console.log("[SAMPLE_CESIUM_DEBUG] Using window.Cesium.sampleHeightMostDetailed.");
    } else {
        console.warn("SAMPLE_CESIUM_FAIL: sampleHeightMostDetailed function not available on Cesium or scene object.");
        return null;
    }

    const positions = [];
    for (let r = 0; r < numSamplesY; r++) { // Iterate Y first for row-major heightmap
        for (let c = 0; c < numSamplesX; c++) {
            const lon = geographicBounds.minLon + (geographicBounds.maxLon - geographicBounds.minLon) * (c / (numSamplesX - 1));
            const lat = geographicBounds.minLat + (geographicBounds.maxLat - geographicBounds.minLat) * (r / (numSamplesY - 1));
            positions.push(window.Cesium.Cartographic.fromDegrees(lon, lat));
        }
    }

    try {
        console.log(`Sampling ${positions.length} points from Cesium scene for bounds:`, geographicBounds);
        const updatedCartographics = await sampleFunction(positions);
        
        const heightmap = [];
        for (let r = 0; r < numSamplesY; r++) {
            const row = [];
            for (let c = 0; c < numSamplesX; c++) {
                const cartographic = updatedCartographics[r * numSamplesX + c];
                const height = (cartographic && typeof cartographic.height === 'number') ? cartographic.height : 0;
                row.push(height);
            }
            heightmap.push(row);
        }
        console.log("Successfully created heightmap from Cesium scene samples.");
        return heightmap;
    } catch (error) {
        console.error("Error sampling heights from Cesium scene:", error);
        return null;
    }
}


async function fetchTerrainTileWithFallback(tileCoordsZOriginal, baseTerrainUrlTemplate, minZoom = 14) {
    let [zOriginal, xOriginal, yOriginal] = tileCoordsZOriginal;
    
    for (let currentZ = zOriginal; currentZ >= minZoom; currentZ--) {
        let currentX, currentY;
        const zoomDiff = zOriginal - currentZ;

        if (currentZ === zOriginal) {
            currentX = xOriginal;
            currentY = yOriginal;
        } else {
            currentX = Math.floor(xOriginal / Math.pow(2, zoomDiff));
            currentY = Math.floor(yOriginal / Math.pow(2, zoomDiff));
        }

        // Use a simple cycling for subdomains, or remove if not applicable to terrainUrlTemplate
        const subdomain = ['a', 'b', 'c'][(currentX + currentY) % 3];
        const terrainTileUrl = baseTerrainUrlTemplate
            .replace('{z}', currentZ)
            .replace('{x}', currentX)
            .replace('{y}', currentY)
            .replace('{s}', subdomain);

        console.log(`Attempting to fetch terrain: Z=${currentZ}, X=${currentX}, Y=${currentY} (for original ZL21 tile ${xOriginal},${yOriginal}) from ${terrainTileUrl}`);
        
        // Call the original fetchTerrainTile function that decodes a single tile
        const heightmap = await fetchTerrainTile(terrainTileUrl);

        if (heightmap) {
            console.log(`Successfully fetched and decoded terrain at Z=${currentZ} for ZL21 tile ${xOriginal},${yOriginal}`);
            // The generateTileMesh function will use the dimensions of this heightmap.
            // If currentZ < zOriginal, the mesh will have fewer segments than a full ZL21 terrain,
            // effectively using coarser terrain data, which is the desired fallback.
            return heightmap;
        }
        // If heightmap is null, loop will continue to try next lower zoom level.
    }
    console.warn(`Failed to fetch any terrain for ZL21 tile ${xOriginal},${yOriginal} down to Z=${minZoom}.`);
    return null; // Return null if no terrain found after all fallbacks
}

/**
 * Fetches a single terrain tile and decodes it into a heightmap.
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
 * @param {number} targetSegments - The desired number of segments for the plane geometry (e.g., 16 for 16x16), used if heightmap is from Cesium or no heightmap.
 * @returns {THREE.Mesh}
 */
function generateTileMesh(heightmap, textureImage, tileSizeInSceneUnits, targetSegments = 16) { // Default targetSegments
    let geometry;
    let segmentsX, segmentsY;

    if (heightmap && heightmap.length > 0 && heightmap[0].length > 0) {
        // If heightmap is provided, its dimensions determine the segments for applying heights.
        // The heightmap from Cesium sampling will have (targetSegments + 1) x (targetSegments + 1) points.
        // The heightmap from TerrainRGB will have dimensions from the image (e.g., 256x256 or 512x512).
        segmentsX = Math.max(1, heightmap[0].length - 1);
        segmentsY = Math.max(1, heightmap.length - 1);
        
        console.log(`generateTileMesh: Using heightmap. Dimensions: ${heightmap[0].length}x${heightmap.length}. Derived segments: ${segmentsX}x${segmentsY}`);

        geometry = new THREE.PlaneGeometry(
            tileSizeInSceneUnits, tileSizeInSceneUnits,
            segmentsX, segmentsY
        );

        const vertices = geometry.attributes.position.array;
        for (let i = 0, vertIdx = 0, numVerts = vertices.length / 3; i < numVerts; i++, vertIdx += 3) {
            // Normalized vertex positions (0 to 1) within the plane
            const u = (vertices[vertIdx] / tileSizeInSceneUnits) + 0.5;
            const v = 1.0 - ((vertices[vertIdx + 1] / tileSizeInSceneUnits) + 0.5); // Flipped Y for texture and heightmap lookup (0,0 is top-left)

            // Corresponding indices in the heightmap
            const xIndex = Math.floor(u * (heightmap[0].length -1)); // Use floor for 0-based index, map [0,1] to [0, width-1]
            const yIndex = Math.floor(v * (heightmap.length -1));   // Use floor for 0-based index, map [0,1] to [0, height-1]
            
            const clampedX = Math.max(0, Math.min(xIndex, heightmap[0].length - 1));
            const clampedY = Math.max(0, Math.min(yIndex, heightmap.length - 1));

            if (heightmap[clampedY] && typeof heightmap[clampedY][clampedX] === 'number') {
                vertices[vertIdx + 2] = heightmap[clampedY][clampedX];
            } else {
                vertices[vertIdx + 2] = 0; // Default to flat if something is wrong
            }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
    } else {
        // No valid heightmap, create a flat plane using targetSegments
        console.warn(`generateTileMesh: No valid heightmap data, creating flat plane with ${targetSegments}x${targetSegments} segments.`);
        geometry = new THREE.PlaneGeometry(tileSizeInSceneUnits, tileSizeInSceneUnits, targetSegments, targetSegments);
    }

    let material;
    if (textureImage) {
        const texture = new THREE.Texture(textureImage);
        texture.needsUpdate = true;
        material = new THREE.MeshStandardMaterial({
            map: texture,
            // side: THREE.DoubleSide,
            // wireframe: true
        });
    } else {
        // Fallback material if texture couldn't be loaded
        console.warn("generateTileMesh: No texture image provided, using fallback material.");
        material = new THREE.MeshBasicMaterial({
            color: 0x888888, // Gray color
            wireframe: true // Show wireframe if no texture
        });
    }

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