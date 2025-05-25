// mundial/js/gltf_test_main.js

const state = {
    threeJsViewer: {
        isInitialized: false,
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        container: null,
        currentModel: null,
        animationFrameId: null,
        resizeObserver: null
    },
    currentSceneObjectForDownload: null,
    currentGltfFilename: "converted_model.gltf"
};

function initThreeJsViewer() {
    console.log("[THREE_INIT_TEST] Attempting to initialize THREE.js viewer...");
    if (state.threeJsViewer.isInitialized) {
        console.log("[THREE_INIT_TEST] Viewer already initialized.");
        return;
    }

    const container = document.getElementById('threejs-viewer-area');
    if (!container) {
        console.error("[THREE_INIT_TEST] CRITICAL: Viewer container 'threejs-viewer-area' not found.");
        return;
    }
    state.threeJsViewer.container = container;

    try {
        state.threeJsViewer.scene = new THREE.Scene();
        state.threeJsViewer.scene.background = new THREE.Color(0x282c34); // Darker background

        const aspect = container.clientWidth > 0 && container.clientHeight > 0 ? container.clientWidth / container.clientHeight : 1;
        state.threeJsViewer.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 20000);
        state.threeJsViewer.camera.position.set(0, 30, 100);
        state.threeJsViewer.camera.lookAt(0, 0, 0);

        state.threeJsViewer.renderer = new THREE.WebGLRenderer({ antialias: true });
        state.threeJsViewer.renderer.setSize(container.clientWidth || 600, container.clientHeight || 400);
        state.threeJsViewer.renderer.setPixelRatio(window.devicePixelRatio);
        container.innerHTML = ''; // Clear any placeholder
        container.appendChild(state.threeJsViewer.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        state.threeJsViewer.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(50, 80, 60).normalize();
        state.threeJsViewer.scene.add(directionalLight);
        
        const axesHelper = new THREE.AxesHelper(20);
        state.threeJsViewer.scene.add(axesHelper);

        if (typeof THREE.OrbitControls === 'function') {
            state.threeJsViewer.controls = new THREE.OrbitControls(state.threeJsViewer.camera, state.threeJsViewer.renderer.domElement);
            state.threeJsViewer.controls.enableDamping = true;
        } else {
            console.warn("[THREE_INIT_TEST] THREE.OrbitControls not found.");
        }

        function animate() {
            state.threeJsViewer.animationFrameId = requestAnimationFrame(animate);
            if (state.threeJsViewer.controls) state.threeJsViewer.controls.update();
            if (state.threeJsViewer.renderer && state.threeJsViewer.scene && state.threeJsViewer.camera) {
                 state.threeJsViewer.renderer.render(state.threeJsViewer.scene, state.threeJsViewer.camera);
            }
        }
        animate();

        state.threeJsViewer.resizeObserver = new ResizeObserver(entries => {
            if (!entries || !entries.length) return;
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0 && state.threeJsViewer.isInitialized) {
                if (state.threeJsViewer.camera) {
                    state.threeJsViewer.camera.aspect = width / height;
                    state.threeJsViewer.camera.updateProjectionMatrix();
                }
                if (state.threeJsViewer.renderer) {
                    state.threeJsViewer.renderer.setSize(width, height);
                }
            }
        });
        state.threeJsViewer.resizeObserver.observe(container);

        state.threeJsViewer.isInitialized = true;
        console.log("[THREE_INIT_TEST] THREE.js viewer initialized successfully.");
    } catch (error) {
        console.error("[THREE_INIT_TEST] Error during THREE.js viewer initialization:", error);
        // Basic cleanup
        if (container && state.threeJsViewer.renderer && state.threeJsViewer.renderer.domElement) {
            try { container.removeChild(state.threeJsViewer.renderer.domElement); } catch (e) {}
        }
        if (state.threeJsViewer.resizeObserver && container) { state.threeJsViewer.resizeObserver.unobserve(container); }
        Object.keys(state.threeJsViewer).forEach(key => state.threeJsViewer[key] = (key === 'isInitialized' ? false : null));
    }
}

function loadSceneObjectInViewer(sceneObject) {
    if (!state.threeJsViewer.isInitialized || !state.threeJsViewer.scene || !state.threeJsViewer.camera) {
        console.error("[LOAD_OBJECT_TEST] Viewer not ready.");
        initThreeJsViewer(); // Attempt to init if not already
        if (!state.threeJsViewer.isInitialized) {
            alert("3D Viewer could not be initialized."); return;
        }
    }

    if (state.threeJsViewer.currentModel) {
        state.threeJsViewer.scene.remove(state.threeJsViewer.currentModel);
        // TODO: Add proper disposal of old model's geometries/materials
    }
    state.threeJsViewer.currentModel = sceneObject;
    state.threeJsViewer.scene.add(sceneObject);

    try {
        const box = new THREE.Box3().setFromObject(sceneObject);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        if (size.lengthSq() === 0) { 
             console.warn("[LOAD_OBJECT_TEST] Loaded model has zero size or invalid bounds.");
             state.threeJsViewer.camera.position.set(0, 10, 50); 
             state.threeJsViewer.camera.lookAt(0,0,0);
        } else {
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = state.threeJsViewer.camera.fov * (Math.PI / 180);
            let cameraDistance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
            cameraDistance = Math.max(cameraDistance, maxDim); // Ensure camera is at least maxDim away
            
            state.threeJsViewer.camera.position.copy(center);
            state.threeJsViewer.camera.position.z += cameraDistance * 1.2; // Pull back a bit more
            state.threeJsViewer.camera.lookAt(center);

            if (state.threeJsViewer.controls) {
                state.threeJsViewer.controls.target.copy(center);
                state.threeJsViewer.controls.maxDistance = cameraDistance * 20;
                state.threeJsViewer.controls.minDistance = cameraDistance * 0.001;
                state.threeJsViewer.controls.update();
            }
        }
    } catch (e) {
        console.error("[LOAD_OBJECT_TEST] Error adjusting camera:", e);
        state.threeJsViewer.camera.position.set(0, 30, 100); // Default fallback
        state.threeJsViewer.camera.lookAt(0,0,0);
    }
    console.log("[LOAD_OBJECT_TEST] Loaded new scene object.");
}

async function initiateTilesetConversionToGltf(tilesetJsonUrl) {
    const statusBar = document.getElementById('scene-status-bar');
    const sceneTitle = document.getElementById('scene-title');
    const downloadBtn = document.getElementById('download-gltf-btn');
    if(downloadBtn) downloadBtn.style.display = 'none';

    const updateStatus = (message, show = true) => {
        if (statusBar) {
            statusBar.textContent = message;
            statusBar.style.display = show ? 'block' : 'none';
        }
        if (sceneTitle && show) sceneTitle.textContent = message.length > 40 ? message.substring(0,37) + "..." : message;
        console.log(`[CONVERT_TEST_STATUS] ${message}`);
    };

    updateStatus(`Starting: ${tilesetJsonUrl.split('/').pop()}`);
    
    if (!window.exportTilesetToGLTF || typeof THREE === 'undefined' || !THREE.GLTFLoader || !THREE.GLTFExporter) {
        const errMsg = "Error: Conversion components missing (THREE.js, GLTFExporter, or tilesetExporter.js).";
        updateStatus(errMsg, true); console.error("[CONVERT_TEST] " + errMsg); alert(errMsg); return;
    }
    if (!state.threeJsViewer.isInitialized) initThreeJsViewer();
    if (!state.threeJsViewer.isInitialized) {
        const errMsg = "Error: 3D Viewer could not be initialized for conversion.";
        updateStatus(errMsg, true); console.error("[CONVERT_TEST] " + errMsg); alert(errMsg); return;
    }

    try {
        updateStatus(`Fetching ${tilesetJsonUrl.split('/').pop()}...`);
        const response = await fetch(tilesetJsonUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        
        updateStatus(`Parsing ${tilesetJsonUrl.split('/').pop()}...`);
        const tilesetData = await response.json();
        console.log("[CONVERT_TEST] Fetched tileset.json:", tilesetData);

        updateStatus(`Processing tile hierarchy...`);
        const selectionCriteria = [];
        const baseUrl = tilesetJsonUrl.substring(0, tilesetJsonUrl.lastIndexOf('/') + 1);

        function processTile(tile, parentTransformMatrix) {
            let currentTransformMatrix = parentTransformMatrix.clone();
            if (tile.transform) {
                const tileMatrix = new THREE.Matrix4().fromArray(tile.transform);
                currentTransformMatrix.multiply(tileMatrix);
            }
            if (tile.content && (tile.content.uri || tile.content.url)) {
                let contentUrl = tile.content.uri || tile.content.url;
                if (!contentUrl.startsWith('http://') && !contentUrl.startsWith('https://') && !contentUrl.startsWith('data:')) {
                    contentUrl = baseUrl + contentUrl;
                }
                if (contentUrl.toLowerCase().endsWith('.glb') || contentUrl.toLowerCase().endsWith('.gltf')) {
                    selectionCriteria.push({ contentUrl: contentUrl, transformMatrix: currentTransformMatrix.clone() });
                } else { console.warn(`[CONVERT_TEST] Skipping non-GLB/GLTF: ${contentUrl}`); }
            }
            if (tile.children) tile.children.forEach(child => processTile(child, currentTransformMatrix));
        }

        if (tilesetData.root) processTile(tilesetData.root, new THREE.Matrix4());
        else { updateStatus("Tileset has no root tile.", true); console.warn("[CONVERT_TEST] No root tile."); return; }

        if (selectionCriteria.length === 0) {
            updateStatus("No convertible GLB/GLTF found.", true); console.warn("[CONVERT_TEST] No models to process."); return;
        }
        
        const exportOptions = {
            tilesetName: tilesetJsonUrl.split('/').pop().replace(/\.tileset\.json$|\.json$/, '') || 'ConvertedModel',
            dataSourceType: '3dtiles',
            onComplete: ({ sceneObject, error }) => {
                if (error) {
                    const errMsg = `Error merging: ${error.message || error}`;
                    updateStatus(errMsg, true); console.error("[CONVERT_TEST] " + errMsg);
                } else if (sceneObject) {
                    updateStatus(`Merge complete. Loading view...`, true);
                    loadSceneObjectInViewer(sceneObject); 
                    const finalName = exportOptions.tilesetName;
                    if(sceneTitle) sceneTitle.textContent = `View: ${finalName}`;
                    state.currentSceneObjectForDownload = sceneObject;
                    state.currentGltfFilename = finalName + "_merged.gltf";
                    if(downloadBtn) downloadBtn.style.display = 'inline-block';
                    updateStatus(`Model "${finalName}" ready.`, true); 
                    setTimeout(() => { if (statusBar.textContent === `Model "${finalName}" ready.`) updateStatus('', false); }, 4000);
                } else {
                    updateStatus(`Conversion done, no model.`, true); console.warn("[CONVERT_TEST] No sceneObject from export.");
                }
            },
            onProgress: (message) => updateStatus(message, true)
        };
        updateStatus(`Processing ${selectionCriteria.length} model(s)...`);
        if (typeof window.exportTilesetToGLTF === 'function') {
            window.exportTilesetToGLTF(selectionCriteria, exportOptions);
        } else {
             const errMsg = "Error: exportTilesetToGLTF function not found!";
             updateStatus(errMsg, true); console.error("[CONVERT_TEST] " + errMsg); alert(errMsg);
        }
    } catch (error) {
        const errMsg = `Error processing tileset: ${error.message || error}`;
        updateStatus(errMsg, true); console.error(`[CONVERT_TEST] ${errMsg}`);
    }
}

function downloadCurrentGltf() {
    if (!state.currentSceneObjectForDownload) {
        alert("No model available to download.");
        return;
    }
    if (typeof THREE.GLTFExporter !== 'function') {
        alert("GLTFExporter not available.");
        return;
    }
    const exporter = new THREE.GLTFExporter();
    exporter.parse(
        state.currentSceneObjectForDownload,
        function (gltf) {
            const output = JSON.stringify(gltf, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = state.currentGltfFilename;
            link.click();
            URL.revokeObjectURL(link.href);
        },
        function (error) {
            console.error('Error exporting GLTF:', error);
            alert('Failed to export GLTF. Check console.');
        },
        { binary: false } // Set to true for GLB
    );
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("GLTF Test Page DOMContentLoaded.");
    initThreeJsViewer(); // Initialize viewer on load

    const testBtn = document.getElementById('test-conversion-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            // Sample tileset.json URL (KhronosGroup 3D Tiles Samples - Box)
            const sampleTilesetUrl = 'https://raw.githubusercontent.com/KhronosGroup/3d-tiles-samples/main/1.0/Box/tileset.json';
            // const sampleTilesetUrl = 'https://raw.githubusercontent.com/CesiumGS/3d-tiles-samples/main/glTF/InstancedOrientation/tileset.json'; // Also 404?
            // const sampleTilesetUrl = 'https://raw.githubusercontent.com/CesiumGS/cesium-ion-3d-tiles-examples/main/ion-3d-tiles/production/06827240ddc55deda840095985985553/tileset.json'; // Also 404?
            initiateTilesetConversionToGltf(sampleTilesetUrl);
        });
    } else {
        console.error("Test conversion button not found.");
    }

    const dlBtn = document.getElementById('download-gltf-btn');
    if (dlBtn) {
        dlBtn.addEventListener('click', downloadCurrentGltf);
    }
});