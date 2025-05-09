window.globus = null; // Declare globus in global scope and attach to window
console.log("Roo Debug: main.js version check 1"); // Unique log to check script version

// mundial/main.js - Reconstructed FINAL for Side-by-Side View

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired."); // DEBUG LINE

    // --- Settings Panel DOM Elements ---
    const settingStartLonInput = document.getElementById('setting-start-lon'); // Added
    const settingStartLatInput = document.getElementById('setting-start-lat'); // Added
    const settingStartZoomInput = document.getElementById('setting-start-zoom'); // Added
    const settingSetStartLocationBtn = document.getElementById('setting-set-start-location-btn'); // Added
    const settingGridVisibleCheckbox = document.getElementById('setting-grid-visible'); // Added
    const settingGridWeightInput = document.getElementById('setting-grid-weight'); // Added
    // --- End Settings Panel DOM Elements ---


    // --- Draggable Panels ---
    function makeDraggable(elmnt) {
      console.log(`Attempting to make element draggable: ${elmnt.id || elmnt.tagName}`); // Log when function is called
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const dragHandle = elmnt.querySelector('.panel-header') || elmnt.querySelector('h2') || elmnt;
      if (dragHandle) {
        dragHandle.style.cursor = 'move';
        dragHandle.onmousedown = dragMouseDown;
        console.log(`Attached mousedown to drag handle for ${elmnt.id || elmnt.tagName}`); // Log when listener is attached
      } else {
        elmnt.style.cursor = 'move';
        elmnt.onmousedown = dragMouseDown;
        console.log(`Attached mousedown directly to element ${elmnt.id || elmnt.tagName}`); // Log when listener is attached
      }
      function dragMouseDown(e) {
        console.log(`dragMouseDown triggered for ${elmnt.id || elmnt.tagName}`); // Log when mousedown occurs
        e = e || window.event; e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        console.log(`Attached mouseup and mousemove for ${elmnt.id || elmnt.tagName}`); // Log when move/up listeners are attached
      }
      function elementDrag(e) {
        // console.log(`elementDrag triggered for ${elmnt.id || elmnt.tagName}`); // Log when dragging occurs (can be noisy)
        e = e || window.event; e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
        pos3 = e.clientX; pos4 = e.clientY;
        const newTop = Math.max(0, Math.min(window.innerHeight - elmnt.offsetHeight, elmnt.offsetTop - pos2));
        const newLeft = Math.max(0, Math.min(window.innerWidth - elmnt.offsetWidth, elmnt.offsetLeft - pos1));
        elmnt.style.top = newTop + "px"; elmnt.style.left = newLeft + "px";
        elmnt.style.bottom = ''; elmnt.style.right = '';
      }
      function closeDragElement() {
        console.log(`closeDragElement triggered for ${elmnt.id || elmnt.tagName}`); // Log when mouseup occurs
        document.onmouseup = null; document.onmousemove = null;
        console.log(`Removed mouseup and mousemove for ${elmnt.id || elmnt.tagName}`); // Log when move/up listeners are removed
      }
    }

    // --- OpenLayers Setup ---
    const osmLayer = new ol.layer.Tile({ source: new ol.source.OSM(), visible: false, title: 'osm' }); 
    const satelliteLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attributions: 'Tiles © ArcGIS', maxZoom: 19 }),
        visible: true, title: 'satellite'
    }); 
    const topoLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({ url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', attributions: 'Map data © OSM contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)', maxZoom: 17 }),
        visible: false, title: 'topo'
    }); 
    const mapzenTerrariumLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({ url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', attributions: 'Mapzen, SRTM, GMTED2010, ETOPO1', maxZoom: 15 }),
        visible: false, title: 'terrarium'
    }); 
    let baseLayers = [osmLayer, satelliteLayer, topoLayer, mapzenTerrariumLayer];
    let previouslySelectedLayerValue = 'satellite';

    // --- Grid and Selection Setup ---
    const TILE_SELECTION_ZOOM = 21;
    const GRID_VISIBILITY_MIN_ZOOM = 16;
    const selectionStyle = new ol.style.Style({ fill: new ol.style.Fill({ color: 'rgba(200, 200, 200, 0.5)' }) }); 
    const selectionSource = new ol.source.Vector();
    const groupSelectionStyle = new ol.style.Style({ fill: new ol.style.Fill({ color: 'rgba(0, 255, 255, 0.5)' }) });  // Cyan fill for selected groups
    const selectionLayer = new ol.layer.Vector({
        source: selectionSource,
        style: function(feature) {
            // Use cyan for selected groups, grey for individual selections
            return feature.get('isGroupSelection') ? groupSelectionStyle : selectionStyle;
        },
        title: 'selection',
        zIndex: 3
    }); 
    const highlightStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 0, 0.8)', width: 4 }),
        fill: new ol.style.Fill({ color: 'rgba(255, 255, 0, 0.2)' }), zIndex: 4
    }); 
    const highlightSource = new ol.source.Vector();
    const highlightLayer = new ol.layer.Vector({ source: highlightSource, style: highlightStyle, title: 'highlight' }); 
    const gridStyleZ21 = new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 1)', width: 1 }) }); 
    const gridSourceZ21 = new ol.source.Vector();
    const gridLayerZ21 = new ol.layer.Vector({ source: gridSourceZ21, style: gridStyleZ21, title: 'grid-z21', visible: false, zIndex: 1 }); 
    const selectionTileGrid = ol.tilegrid.createXYZ({ maxZoom: TILE_SELECTION_ZOOM }); 

    // --- User Layers Setup ---
    const layer0Id = 'layer-0';
    const layer0Name = 'Layer 0';
    const layer0Source = new ol.source.Vector();
    const tilesetFeatureStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({ color: 'rgba(0, 128, 128, 0.9)', width: 3 }),
        fill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0.0)' }) // Add transparent fill for hit detection
    }); 
    const layer0Layer = new ol.layer.Vector({ source: layer0Source, style: tilesetFeatureStyle, title: layer0Id, zIndex: 2, visible: true }); 
    layer0Layer.set('userLayerName', layer0Name);
    const userLayers = { [layer0Id]: { name: layer0Name, layer: layer0Layer, tilesetCount: 0 } };
    let selectedLayerId = layer0Id; // Initialize the selected layer ID

    // --- Initialize OpenLayers Map ---
    const map = new ol.Map({
        target: 'map',
        layers: [ ...baseLayers, layer0Layer, gridLayerZ21, selectionLayer, highlightLayer ],
        view: new ol.View({ center: ol.proj.fromLonLat([-74.0445, 40.6892]), zoom: 18, maxZoom: TILE_SELECTION_ZOOM + 1, minZoom: 0 }), // Centered on Statue of Liberty, Zoom 18
        controls: [],
    }); 
    const mapElementOL = document.getElementById('map'); // OpenLayers container

    // Get the default DragPan interaction
    let dragPanInteraction = null;
    map.getInteractions().forEach(interaction => {
        if (interaction instanceof ol.interaction.DragPan) {
            dragPanInteraction = interaction;
        }
    }); 
    if (!dragPanInteraction) {
        console.warn("Could not find default DragPan interaction.");
    }

    // --- OpenGlobus Initialization ---
    let ogBaseLayers = {};
    let gridLayerOG = null;
    // let ogSelectionLayer = null; // Removed - Layer wasn't rendering
    // let ogSelectionHighlightEntity = null; // Removed
    let tileCubeLayer = null; // Layer for the ZL21 tile *indicator* cube
    let selectedTileCubeEntity = null; // The currently displayed indicator cube entity
    let ogSavedTilesetsLayer = null; // Layer for displaying saved tilesets on the globe
    const globusElement = document.getElementById('globusContainer'); // OpenGlobus container

    function initializeOpenGlobus() {
    if (!globus && typeof og !== 'undefined') {
        try {
                // Define Grid Layer Class
                // Removed custom GridCanvasTiles class definition

                // Create OG base layers
                ogBaseLayers = {};
                const osmOgLayer = new og.layer.XYZ("OpenStreetMap", {
                    isBaseLayer: true,
                    url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    visibility: false, // Set OSM to hidden
                    attribution: '© OpenStreetMap contributors'
                });
                 const satelliteOgLayer = new og.layer.XYZ("Satellite", {
                    isBaseLayer: true,
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    visibility: true, // Set Satellite to visible
                    attribution: 'Tiles © ArcGIS'
                });
                const initialOgLayers = [osmOgLayer, satelliteOgLayer]; // Include both layers
                ogBaseLayers['osm'] = osmOgLayer;
                ogBaseLayers['satellite'] = satelliteOgLayer; // Add satellite to baseLayers map

                // Initialize Globe with layers and camera position
                console.log("Initializing OpenGlobus with layers and camera position.");

                globus = new og.Globe({
                    target: "globusContainer",
                    name: "OpenGlobus View",
                    layers: initialOgLayers, // Use the array with both layers
                    // terrain: new og.terrain.GlobusRgbTerrain({...}), // Removed from constructor
                    lon: -106.817, // Rocky Mountains
                    lat: 39.113,   // Rocky Mountains
                    alt: 1000,    // Lower altitude for terrain visibility
                    resourcesSrc: "/packages/openglobus/res",
                    fontsSrc: "/packages/openglobus/res/fonts"
                });

                // Create terrain instance separately
                const terrariumTerrain = new og.terrain.GlobusRgbTerrain({
                    url: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
                    heightFactor: 1.0 // Use height factor 1.0 as requested
                });
                // Removed redundant globus.planet.addLayer(osmOgLayer);

                console.log("OpenGlobus initialized with Satellite as default.");
// --- Initialize Tile Cube Layer ---
                tileCubeLayer = new og.layer.Vector("Tile Cube Indicator", {
                    // No clamping initially, let the cube float slightly
                    // No entities added at initialization
                    'pickingEnabled': false // Not interactive itself
                }); 
                globus.planet.addLayer(tileCubeLayer);
                console.log("Created and added tileCubeLayer.");
// --- Initialize Saved Tilesets Layer (Using CanvasTiles) ---
ogSavedTilesetsLayer = new og.layer.CanvasTiles("Saved Tilesets", {
    visibility: true,
    minZoom: TILE_SELECTION_ZOOM, // Only draw at the target zoom
    maxZoom: TILE_SELECTION_ZOOM,
    // isBaseLayer: false, // Explicitly not a base layer
    opacity: 0.7, // Make slightly transparent
    drawTile: function (material, applyTexture) {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const tileZoom = material.segment.tileZoom;
        const tileX = material.segment.tileX;
        const tileY = material.segment.tileY;
        const tileId = `${tileZoom}-${tileX}-${tileY}`;

        // Check if this tile exists in the currently selected user layer
        let isTileSaved = false;
        let tileColor = null;
        if (selectedLayerId && userLayers[selectedLayerId]) {
            const source = userLayers[selectedLayerId].layer.getSource();
            const feature = source.getFeatures().find(f => f.get('tileId') === tileId);
            if (feature) {
                isTileSaved = true;
                tileColor = feature.get('color') || '#008080'; // Use saved color or default
            }
        }

        if (isTileSaved && tileZoom === TILE_SELECTION_ZOOM) {
            // Draw a colored square for the saved tile
            ctx.fillStyle = tileColor;
            ctx.fillRect(0, 0, size, size);
            // Optional: Add a border?
            // ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            // ctx.strokeRect(0, 0, size, size);
            // console.log(`Drawing saved tile ${tileId} with color ${tileColor}`); // DEBUG
        } else {
            // Draw nothing / transparent for non-saved tiles or wrong zoom
            ctx.clearRect(0, 0, size, size);
        }

        applyTexture(canvas);
    }
}); 
globus.planet.addLayer(ogSavedTilesetsLayer);
console.log("Created and added ogSavedTilesetsLayer as CanvasTiles.");

// Removed test entities and ogSelectionLayer initialization for now

                // Add grid layer
                gridLayerOG = new og.layer.CanvasTiles("ZL21 Grid", {
                    minZoom: 16,
                    maxZoom: 21,
                    visibility: true, // Initially visible, adjust as needed
                    drawTile: function (material, applyTexture) {
                        const canvas = document.createElement("canvas");
                        const size = 256; // Standard tile size
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        // --- Add null check for material.segment ---
                        if (!material.segment) {
                            console.warn("drawTile called with null material.segment for ZL21 Grid");
                            applyTexture(canvas); // Apply empty canvas
                            return;
                        }
                        // --- End null check ---

                        const currentTileZoom = material.segment.tileZoom;
                        const targetGridZoom = TILE_SELECTION_ZOOM; // 21

                        ctx.clearRect(0, 0, size, size); // Clear initially

                        // Check if the current tile zoom is within the layer's display range (16-21)
                        if (currentTileZoom >= this.minZoom && currentTileZoom <= this.maxZoom) {
                            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
                            // Read line weight from settings input dynamically
                            const lineWeight = settingGridWeightInput ? parseFloat(settingGridWeightInput.value) : 0.5;
                            ctx.lineWidth = !isNaN(lineWeight) ? lineWeight : 0.5;

                            // Calculate subdivisions needed to represent ZL21 grid on this tile
                            const subdivisions = Math.pow(2, targetGridZoom - currentTileZoom);
                            const subdivisionSize = size / subdivisions;

                            ctx.beginPath();
                            // Draw vertical lines if subdivisions > 1
                            if (subdivisions > 1) {
                                for (let i = 1; i < subdivisions; i++) {
                                    const x = Math.round(i * subdivisionSize); // Use Math.round for potentially sharper lines
                                    ctx.moveTo(x, 0);
                                    ctx.lineTo(x, size);
                                }
                                // Draw horizontal lines if subdivisions > 1
                                for (let j = 1; j < subdivisions; j++) {
                                    const y = Math.round(j * subdivisionSize);
                                    ctx.moveTo(0, y);
                                    ctx.lineTo(size, y);
                                }
                            }
                            // Always draw outer border for the current tile itself
                            ctx.rect(0, 0, size, size);
                            ctx.stroke();
                        }
                        // If outside minZoom/maxZoom, canvas remains clear

                        applyTexture(canvas);
                    }
                }); 
                globus.planet.addLayer(gridLayerOG);

                // Add controls
                globus.planet.addControl(new og.control.ZoomControl());
                globus.planet.addControl(new og.control.LayerSwitcher());

                console.log("OpenGlobus initialized.");
// --- OpenGlobus Selection Layer Setup (Moved Earlier) ---

                // Trigger initial resize
                setTimeout(() => {
                    if (globus && globus.planet && globus.planet.renderer) {
                         // Use the renderer's resize method
                         globus.planet.renderer.resize();
                         globus.planet.setTerrain(terrariumTerrain); // Set terrain after resize
// --- OpenGlobus Selection Layer Setup ---
                // Removed ogSelectionStyle constant, will apply directly
// Explicitly set initial camera position after layers are added
                globus.planet.viewLonLat(new og.LonLat(-74.0445, 40.6892, 1000)); // Set altitude to 1000
                const ogSelectionLayer = new og.layer.Vector("OG Selection", {
                    'pickingEnabled': false, // Don't need to pick these features directly
                    'zIndex': 10 // Ensure it draws on top
                }); 
                globus.planet.addLayer(ogSelectionLayer);
// --- Globe Click Handler for Tile Selection ---
                // Removed click listener from inside initializeOpenGlobus
                         console.log("Triggered initial OpenGlobus resize.");
                    }
                }, 500); // Increased delay to 500ms

    } catch (error) { console.error("Error initializing OpenGlobus:", error); alert("Failed to initialize 3D view."); }
    }
} // End function initializeOpenGlobus
    // }

    // --- Globe Click Handler now defined at line ~550 ---

    // Removed attempt to attach listeners via globus.planet.events

    // --- Attach Click Listener directly to OpenGlobus Canvas ---
    // Wait a short moment for OG canvas to likely be ready
    setTimeout(() => {
        if (globus && globus.renderer && globus.renderer.handler && globus.renderer.handler.canvas) {
            const canvas = globus.renderer.handler.canvas;
            canvas.addEventListener('click', (event) => {
                // Recalculate rect inside handler in case of resize/scroll
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const mouse = { x: x, y: y, event: event };
                handleGlobeClick(mouse, "Canvas DOM click"); // Pass event type
            }); 
            console.log("Attached DOM click listener directly to OpenGlobus canvas.");
        } else {
            console.error("Could not find OpenGlobus canvas to attach click listener after delay.");
        }
    }, 1000); // Increased delay slightly

    // --- UI Element References ---
    const baseLayerSelect = document.getElementById('base-layer-select');
    const customLayerInputsDiv = document.getElementById('custom-layer-inputs');
    const customLayerNameInput = document.getElementById('custom-layer-name');
    const customLayerUrlInput = document.getElementById('custom-layer-url');
    const addCustomLayerBtn = document.getElementById('add-custom-layer-btn');
    const userLayersPanel = document.getElementById('user-layers-panel');
    const userLayerList = document.getElementById('user-layer-list');
    const createLayerBtn = document.getElementById('create-layer-btn');
    const tilesetListDiv = document.getElementById('tileset-list');
    const selectionActionsDiv = document.getElementById('selection-actions');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const saveSelectionBtn = document.getElementById('save-selection-btn');
    const tilesetNameInput = document.getElementById('tileset-name-input');
    const appControlsPanel = document.getElementById('app-controls');
    const interactionModeBtn = document.getElementById('interaction-mode-btn');
    const selectedTileCountDisplay = document.getElementById('selected-tile-count-display');
    const tilesetDetailsModal = document.getElementById('tileset-details-modal');
    const closeTilesetDetailsModalBtn = document.getElementById('close-tileset-details-modal');
    const detailsTilesetNameInput = document.getElementById('details-tileset-name');
    const detailsTilesetCoordsSpan = document.getElementById('details-tileset-coords');
    const detailsLocationInfoSpan = document.getElementById('details-location-info');
    const detailsTilesetImage = document.getElementById('details-tileset-image');
    const detailsTilesetImageUrlInput = document.getElementById('details-tileset-image-url');
    const detailsTilesetLinkInput = document.getElementById('details-tileset-link');
    const detailsTilesetTagsTextarea = document.getElementById('details-tileset-tags');
    const detailsColorPicker = document.getElementById('details-color-picker');
    const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel'); // Added

    // Toolbar Buttons & Panels for View Toggling
    const socialBtn = document.getElementById('social-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const globeViewBtn = document.getElementById('globe-view-btn');
    const layersBtn = document.getElementById('layers-btn'); // Added Layers button
    const signInBtn = document.getElementById('signin-btn'); // Added Sign In button
    // const xrBtn = document.getElementById('xr-view-btn'); // XR button reference if needed later
    const profileBtn = document.getElementById('profile-btn'); // Added Profile button reference
    const xrViewBtn = document.getElementById('xr-view-btn'); // Added XR button reference

    const socialPanel = document.getElementById('social-panel');
    // const mapPanel = document.getElementById('map-panel'); // Redeclared - Removed
    const globePanel = document.getElementById('globe-panel');
    // const layerSwitcherPanel = document.getElementById('layer-switcher'); // Redeclared - Removed
    const mapPanel = document.getElementById('map-panel'); // Added semicolon and fixed indent
    const layerSwitcherPanel = document.getElementById('layer-switcher'); // Added semicolon
    const profilePanel = document.getElementById('profile-panel'); // Added Profile panel reference
    const xrPanel = document.getElementById('xr-panel'); // Added XR panel reference
    if (xrPanel) { // Ensure element exists before making it draggable
        makeDraggable(xrPanel);
        console.log("DEBUG: XR panel made draggable."); // DEBUG
    } else {
        console.warn("XR panel not found, cannot make draggable."); // DEBUG
    }
    // userLayersPanel is already defined above
    // appControlsPanel is already defined above

    const toolbarButtons = [mapViewBtn, globeViewBtn, socialBtn, layersBtn, signInBtn, profileBtn, xrViewBtn]; // Define toolbar buttons array including profileBtn and xrViewBtn
    console.log("DEBUG: Finished UI Element References section."); // DEBUG LINE
    
    // Make all panels draggable
    function applyDraggableToAllPanels() {
        const allPanels = document.querySelectorAll('.view-panel, .control-panel');
        allPanels.forEach(panel => {
            makeDraggable(panel);
            console.log(`Made panel draggable: ${panel.id}`);
        }); 
    }
    
    // Apply immediately
    applyDraggableToAllPanels();
    
    // Also apply after a short delay to ensure elements created dynamically are also draggable
    setTimeout(applyDraggableToAllPanels, 500);

    // This entire block (lines 470-564) is being removed from here
// --- Tileset Details Modal Function ---
    function openTilesetDetailsModal(feature) {
        if (!feature) {
            console.error("openTilesetDetailsModal called with invalid feature.");
            return;
        }
        const groupId = feature.get('tilesetGroupId');
        const name = feature.get('tilesetName') || 'Unnamed Tileset';
        const color = feature.get('color') || '#008080'; // Default color if none saved
        const imageUrl = feature.get('imageUrl') || '';
        const linkUrl = feature.get('linkUrl') || '';
        const tags = feature.get('tags') || '';

        if (!groupId) {
            console.error("Cannot open details modal: Feature is missing tilesetGroupId.", feature);
            return;
        }

        console.log(`DEBUG: Opening details modal for GroupID: ${groupId}, Name: ${name}`); // DEBUG LOG

        currentEditingGroupId = groupId; // Set the global editing context

        // Populate modal fields
        detailsTilesetNameInput.value = name;
        detailsColorPicker.value = color; // Set color picker value
        detailsTilesetImageUrlInput.value = imageUrl;
        detailsTilesetLinkInput.value = linkUrl;
        detailsTilesetTagsTextarea.value = tags;

        // Display image if URL exists
        if (imageUrl) {
            detailsTilesetImage.src = imageUrl;
            detailsTilesetImage.style.display = 'block';
        } else {
            detailsTilesetImage.style.display = 'none';
            detailsTilesetImage.src = '';
        }

        // --- Calculate and display other info (Placeholder) ---
        // Get all features for this group to calculate coords/count
        const layer = userLayers[selectedLayerId]?.layer;
        let tileCount = 0;
        let coordsStr = 'N/A';
        if (layer) {
            const groupFeatures = layer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
            tileCount = groupFeatures.length;
            if (tileCount > 0) {
                 // Example: Get coords of the first tile in the group
                 const firstTileId = groupFeatures[0].get('tileId');
                 if (firstTileId) {
                     const tileCoord = firstTileId.split('-').map(Number);
                     const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                     const center = ol.extent.getCenter(tileExtent);
                     const centerLonLat = ol.proj.toLonLat(center);
                     coordsStr = `~ ${centerLonLat[1].toFixed(4)}, ${centerLonLat[0].toFixed(4)}`; // Lat, Lon
                 }
            }
        }
        detailsTilesetCoordsSpan.textContent = coordsStr;
        detailsLocationInfoSpan.textContent = 'Loading...'; // Placeholder for reverse geocoding
        // TODO: Implement reverse geocoding if needed

        // Display the modal
        tilesetDetailsModal.style.setProperty('display', 'block', 'important');
    }
    // --- End Tileset Details Modal Function ---

    // --- Initialize Globe ---
    initializeOpenGlobus(); // Call the initialization function

    // --- Globe Click Handler (Moved outside initializeOpenGlobus) ---
    function handleGlobeClick(mouse, eventName) {
        console.log(`Globe ${eventName} event fired`, mouse); // Log which event fired
        if (!globus || !globus.planet || !tileCubeLayer) return; // Check for tileCubeLayer

        const now = Date.now();
        // Basic debounce/throttle to avoid issues if multiple events fire for one click
        if (globus._lastClickTime && (now - globus._lastClickTime < 300)) {
            console.log(`Globe ${eventName} ignored (too soon after previous event)`);
            return;
        }
        globus._lastClickTime = now;

        const coords = globus.planet.getLonLatFromPixelTerrain(mouse);
        if (coords) {
            console.log(`Globe clicked at Lon: ${coords.lon}, Lat: ${coords.lat}`);
            try {
                const mapCoords = ol.proj.fromLonLat([coords.lon, coords.lat]);
                const tileCoord = selectionTileGrid.getTileCoordForCoordAndZ(mapCoords, TILE_SELECTION_ZOOM);
                const tileId = getTileId(tileCoord);
                console.log(`Corresponding ZL${TILE_SELECTION_ZOOM} Tile: z=${tileCoord[0]}, x=${tileCoord[1]}, y=${tileCoord[2]}, ID=${tileId}`);

                const targetLayer = selectedLayerId ? userLayers[selectedLayerId]?.layer : null;
                let isTileSaved = false;
                if (targetLayer) {
                    const targetSource = targetLayer.getSource();
                    isTileSaved = targetSource.getFeatures().some(f => f.get('tileId') === tileId);
                }

                if (isTileSaved) {
                    console.log(`Globe click on saved tile ${tileId}, cube placement prevented.`);
                    // If a cube is currently shown, remove it
                    if (selectedTileCubeEntity) {
                        tileCubeLayer.remove(selectedTileCubeEntity);
                        selectedTileCubeEntity = null;
                        console.log("Removed existing cube because clicked tile is saved.");
                        if (globus.renderer) globus.renderer.draw();
                    }
                    return; // Don't proceed further for saved tiles
                }
// Removed redundant check for saved tiles on ogSavedTilesetsLayer (CanvasTiles doesn't have getEntities)
// The 'isTileSaved' check earlier (line ~563) using the OL source is sufficient.


                // Calculate tile center for cube placement
                const tileExtentEPSG3857 = selectionTileGrid.getTileCoordExtent(tileCoord);
                const tileCenterEPSG3857 = ol.extent.getCenter(tileExtentEPSG3857);
                const tileCenterLonLat = ol.proj.toLonLat(tileCenterEPSG3857);
                const cubeAltitude = 0.5; // Place cube slightly above ground

                if (selectedTileCubeEntity) {
                    // Cube exists, check if it's the same tile
                    if (selectedTileCubeEntity.properties.tileId === tileId) {
                        // Same tile clicked again, remove the cube
                        console.log(`Removing cube from tile: ${tileId}`);
                        tileCubeLayer.remove(selectedTileCubeEntity);
                        selectedTileCubeEntity = null;
                    } else {
                        // Different tile clicked, move the existing cube
                        console.log(`Moving cube from tile ${selectedTileCubeEntity.properties.tileId} to ${tileId}`);
                        selectedTileCubeEntity.setLonLat(new og.LonLat(tileCenterLonLat[0], tileCenterLonLat[1], cubeAltitude));
                        selectedTileCubeEntity.properties.tileId = tileId; // Update tile ID property
                    }
                } else {
                    // No cube exists, create a new one
                    console.log(`Creating cube for tile: ${tileId}`);
                    selectedTileCubeEntity = new og.Entity({
                        lonlat: [tileCenterLonLat[0], tileCenterLonLat[1], cubeAltitude],
                        name: `TileCube-${tileId}`,
                        box: {
                            dimensions: [1, 1, 1], // 1x1x1 meter cube
                            color: "green"
                        },
                        properties: {
                            tileId: tileId
                        }
                    }); 
                    tileCubeLayer.add(selectedTileCubeEntity);
                }

                if (globus.renderer) globus.renderer.draw(); // Force redraw
            } catch (error) { console.error("Error processing globe click:", error); }
        } else { console.log("Globe click detected, but no terrain intersection found."); }
    }

    // Attach listeners after globus is potentially initialized and DOM is ready
    // Use a small delay to ensure globus object is available
    setTimeout(() => {
        if (globus && globus.planet && globus.planet.events) {
            console.log("Attaching globe click listeners...");
            globus.planet.events.on("lclick", (mouse) => handleGlobeClick(mouse, "lclick"));
            // globus.planet.events.on("click", (mouse) => handleGlobeClick(mouse, "click")); // Often redundant with lclick
            // globus.planet.events.on("pointerup", (mouse) => handleGlobeClick(mouse, "pointerup")); // Might fire too often
        } else {
            console.warn("Could not attach globe click handlers: Globus object not ready.");
        }
    }, 500); // Delay attachment slightly

    // --- Add Initial Layer to UI List ---
    // Ensure this happens *after* userLayerList is defined
    if (userLayerList && userLayers[layer0Id]) {
        addLayerToList(layer0Id, layer0Name, true); // Add the default layer to the UI list
        selectLayerInList(layer0Id); // Select it by default
    } else {
        console.error("Could not add initial Layer 0 to the UI list.");
    }


    // --- Tileset Details Modal Logic ---
    let currentEditingGroupId = null;
    // Definition of openTilesetDetailsModal moved towards the end of DOMContentLoaded

// --- New Toolbar Button Logic ---
    console.log("DEBUG: Reached start of New Toolbar Button Logic section."); // DEBUG LINE

    // Helper function to toggle a single panel and its button's active state
    function simpleToggle(panel, button) {
        if (!panel || !button) return; // Ensure elements exist
        const isActive = panel.style.display !== 'none';
        
        if (isActive) {
            // Hide the panel
            panel.style.display = 'none';
            button.classList.remove('active');
            console.log(`Panel hidden: ${panel.id || panel.tagName}`);
        } else {
            // Show the panel
            panel.style.display = 'block';
            button.classList.add('active');
            console.log(`Panel shown: ${panel.id || panel.tagName}`);

            // Re-apply draggable after showing the panel
            makeDraggable(panel);

            // Bring the shown panel to front
            const allVisiblePanels = document.querySelectorAll('.view-panel[style*="display: block"], .control-panel[style*="display: block"]');
            allVisiblePanels.forEach(p => {
                if (p !== panel) {
                    // Lower the z-index of other visible panels
                    const currentZIndex = parseInt(getComputedStyle(p).zIndex) || 990;
                    if (currentZIndex === 1005) { // Only lower if it was previously brought to front
                         p.style.zIndex = 1000; // Set to a standard visible z-index
                    }
                }
            }); 
            panel.style.zIndex = 1005; // Bring the clicked panel to front
            console.log(`Brought panel to front: ${panel.id || panel.tagName}`);
        }
    }

    // Social Button
    console.log("Checking Social Button elements:", socialBtn, socialPanel); // DEBUG
    if (socialBtn && socialPanel) {
        console.log("Attaching listener to Social Button"); // DEBUG
        socialBtn.addEventListener('click', () => {
            console.log("Social Button clicked!"); // DEBUG
            simpleToggle(socialPanel, socialBtn);
        }); 
        // Initial state: hidden (CSS), button inactive
    } else { console.error("Social button or panel not found for listener."); } // DEBUG

    // Map Button (Toggles Map Panel, Layer Switcher, App Controls)
    console.log("Checking Map Button elements:", mapViewBtn, mapPanel, layerSwitcherPanel, appControlsPanel); // DEBUG
    if (mapViewBtn && mapPanel && layerSwitcherPanel && appControlsPanel) {
        console.log("Attaching listener to Map Button"); // DEBUG
        mapViewBtn.addEventListener('click', () => {
            console.log("Map Button clicked!"); // DEBUG
            const isActive = mapPanel.style.display !== 'none';
            const displayStyle = isActive ? 'none' : 'block';

            mapPanel.style.display = displayStyle;
            layerSwitcherPanel.style.display = displayStyle; // Toggle layer switcher
            appControlsPanel.style.display = displayStyle; // Toggle app controls

            mapViewBtn.classList.toggle('active', !isActive);

            // Special handling for map resize when shown
            if (!isActive && typeof map !== 'undefined' && map.updateSize) {
                map.updateSize();
                console.log("Map panel shown, updated OL map size.");
            }
        }); 
        // Initial state: map panel visible (assuming default), button active
        if (mapPanel.style.display !== 'none') {
             mapViewBtn.classList.add('active');
             // Ensure controls are also visible initially if map is
             layerSwitcherPanel.style.display = 'block';
             appControlsPanel.style.display = 'block';
        } else {
             layerSwitcherPanel.style.display = 'none';
             appControlsPanel.style.display = 'none';
        }
    }

    // Globe Button
    console.log("Checking Globe Button elements:", globeViewBtn, globePanel); // DEBUG
    if (globeViewBtn && globePanel) {
        console.log("Attaching listener to Globe Button"); // DEBUG
        globeViewBtn.addEventListener('click', () => {
             console.log("Globe Button clicked!"); // DEBUG
             simpleToggle(globePanel, globeViewBtn);
             // Potentially trigger globe resize/render here if needed when shown
             if (globePanel.style.display !== 'none' && typeof globus !== 'undefined' && globus.planet && globus.planet.renderer) {
                 // Add a small delay to ensure the panel is rendered before resizing
                 setTimeout(() => {
                     globus.planet.renderer.resize();
                     console.log("Globe panel shown, triggered OpenGlobus resize.");
                 }, 50);
             }
        }); 
        // Initial state: hidden (CSS), button inactive
    }

    // Layers Button
    console.log("Checking Layers Button elements:", layersBtn, userLayersPanel); // DEBUG
    if (layersBtn && userLayersPanel) {
        console.log("Attaching listener to Layers Button"); // DEBUG
        layersBtn.addEventListener('click', () => {
             console.log("Layers Button clicked!"); // DEBUG
             simpleToggle(userLayersPanel, layersBtn);
        }); 
        // Initial state: visible (assuming default), button active? Check CSS/HTML default
         if (userLayersPanel.style.display !== 'none') {
             layersBtn.classList.add('active');
         }
    }

    // Profile Button
    console.log("Checking Profile Button elements:", profileBtn, profilePanel); // DEBUG
    if (profileBtn && profilePanel) {
        console.log("Attaching listener to Profile Button"); // DEBUG
        profileBtn.addEventListener('click', () => {
            console.log("Profile Button clicked!"); // DEBUG
            simpleToggle(profilePanel, profileBtn);
        }); 
        // Initial state: hidden, button inactive
    }
    
    // XR Button
    console.log("Checking XR Button elements:", xrViewBtn, xrPanel); // DEBUG
    if (xrViewBtn && xrPanel) {
        console.log("Attaching listener to XR Button"); // DEBUG
        xrViewBtn.addEventListener('click', () => {
            console.log("XR Button clicked!"); // DEBUG
            simpleToggle(xrPanel, xrViewBtn);
        }); 
        // Initial state: hidden, button inactive
    }

    // Sign In Button
    console.log("Checking Sign In Button element:", signInBtn); // DEBUG
    if (signInBtn) {
        console.log("Attaching listener to Sign In Button"); // DEBUG
        signInBtn.addEventListener('click', () => {
            console.log("Sign In Button clicked!"); // DEBUG
            window.location.href = 'auth/auth.html'; // Navigate to sign-in page
        }); 
    } else { console.error("Sign In button not found for listener."); } // DEBUG
// Settings Button
    console.log("Checking Settings Button elements:", settingsBtn, settingsPanel); // DEBUG
    if (settingsBtn && settingsPanel) {
        console.log("Attaching listener to Settings Button"); // DEBUG
        settingsBtn.addEventListener('click', () => {
             console.log("Settings Button clicked!"); // DEBUG
             simpleToggle(settingsPanel, settingsBtn);
        }); 
        // Initial state: hidden (HTML style), button inactive
    } else { console.error("Settings button or panel not found for listener."); } // DEBUG

    // --- End New Toolbar Button Logic ---
    // Removed misplaced code block (lines 343-352) that likely belonged in openTilesetDetailsModal
    closeTilesetDetailsModalBtn.addEventListener('click', () => { tilesetDetailsModal.style.display = 'none'; currentEditingGroupId = null; }); 
    window.addEventListener('click', (event) => { if (event.target === tilesetDetailsModal) { tilesetDetailsModal.style.display = 'none'; currentEditingGroupId = null; } }); 
    function applyGroupPropertyChange(propertyName, value) {
        if (!currentEditingGroupId || !selectedLayerId || !userLayers[selectedLayerId]) { console.warn(`Cannot update ${propertyName}: No group or layer context.`); return false; }
        const layer = userLayers[selectedLayerId].layer; const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);
        if (groupFeatures.length === 0) { console.warn(`Cannot update ${propertyName}: No features found for group ${currentEditingGroupId}.`); return false; }
        groupFeatures.forEach(feature => { feature.set(propertyName, value); }); 
        console.log(`Updated ${propertyName} for group ${currentEditingGroupId} to "${value}"`); return true;
    }
    detailsTilesetNameInput.addEventListener('change', (event) => {
        const newName = event.target.value.trim(); if (newName === '') { alert("Tileset name cannot be empty."); return; }
        if (applyGroupPropertyChange('tilesetName', newName)) {
            const listItem = tilesetListDiv.querySelector(`.layer-item[data-tileset-group-id="${currentEditingGroupId}"]`);
            if (listItem) {
                const nameSpan = listItem.querySelector('span'); if (nameSpan) nameSpan.textContent = newName;
                listItem.querySelectorAll('button').forEach(btn => {
                     if (btn.title.includes('Edit name')) btn.title = `Edit name for "${newName}"`;
                     if (btn.title.includes('Delete tileset')) btn.title = `Delete tileset "${newName}"`;
                }); 
                 const checkbox = listItem.querySelector('input[type="checkbox"]'); if (checkbox) checkbox.title = `Toggle visibility of "${newName}"`;
            }
        }
    }); 
    detailsTilesetImageUrlInput.addEventListener('change', (event) => {
        const url = event.target.value.trim();
        if (applyGroupPropertyChange('imageUrl', url)) {
            if (url) { detailsTilesetImage.src = url; detailsTilesetImage.style.display = 'block'; }
            else { detailsTilesetImage.style.display = 'none'; detailsTilesetImage.src = ''; }
        }
    }); 
    detailsTilesetLinkInput.addEventListener('change', (event) => { applyGroupPropertyChange('linkUrl', event.target.value.trim()); }); 
    detailsTilesetTagsTextarea.addEventListener('change', (event) => { applyGroupPropertyChange('tags', event.target.value.trim()); }); 
    detailsColorPicker.addEventListener('input', (event) => {
        if (!currentEditingGroupId || !selectedLayerId || !userLayers[selectedLayerId]) { console.warn("Cannot update color: No group or layer context."); return; }
        const layer = userLayers[selectedLayerId].layer; const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);
        if (groupFeatures.length === 0) { console.warn(`Cannot update color: No features found for group ${currentEditingGroupId}.`); return; }
        const newColor = event.target.value;
        groupFeatures.forEach(feature => {
            feature.set('color', newColor);
            if (feature.get('isVisible') !== false) {
                 feature.setStyle(new ol.style.Style({ stroke: new ol.style.Stroke({ color: newColor, width: 3 }) }));
            }
        }); 
        console.log(`Updated color for group ${currentEditingGroupId} to ${newColor}`);
    }); 

    // --- Base Layer Switcher Logic (Syncs OL and OG) ---
    function switchBaseLayer(selectedValue) {
        baseLayers.forEach(layer => layer.setVisible(layer.get('title') === selectedValue));
        if (globus && ogBaseLayers) {
            for (const title in ogBaseLayers) {
                if (ogBaseLayers.hasOwnProperty(title)) { ogBaseLayers[title].setVisibility(title === selectedValue); }
            }
            console.log(`Switched OG base layer to: ${selectedValue}`);
        }
    }
    baseLayerSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue === 'add-custom') { customLayerInputsDiv.style.display = 'block'; this.value = previouslySelectedLayerValue; }
        else { customLayerInputsDiv.style.display = 'none'; switchBaseLayer(selectedValue); previouslySelectedLayerValue = selectedValue; }
    }); 
    baseLayerSelect.value = 'satellite';

    // --- Add Custom Base Layer Logic ---
    addCustomLayerBtn.addEventListener('click', function() {
        const name = customLayerNameInput.value.trim(); const url = customLayerUrlInput.value.trim();
        const title = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!name || !url || !url.includes('{z}') || !url.includes('{x}') || !url.includes('{y}')) { alert('Invalid name or URL template.'); return; }
        const allLayerTitles = map.getLayers().getArray().map(l => l.get('title'));
        const reservedTitles = ['add-custom', 'selection', 'grid-z21'];
        if (reservedTitles.includes(title) || allLayerTitles.includes(title) || (ogBaseLayers && ogBaseLayers[title])) { alert(`Title "${title}" reserved or exists.`); return; }
        console.log(`Adding custom base layer: Name="${name}", Title="${title}"`);
        const newOlLayer = new ol.layer.Tile({ source: new ol.source.XYZ({ url: url, attributions: `Custom: ${name}` }), visible: false, title: title }); 
        map.getLayers().insertAt(baseLayers.length, newOlLayer); baseLayers.push(newOlLayer);
        if (globus) {
             const newOgLayer = new og.layer.XYZ(title, { isBaseLayer: true, url: url.replace(/\{[abc]\}/, '{s}'), visibility: false, attribution: `Custom: ${name}`, maxZoom: 21 }); 
             ogBaseLayers[title] = newOgLayer; globus.planet.addLayer(newOgLayer); console.log(`Added custom layer "${title}" to OpenGlobus.`);
        }
        const addCustomOption = baseLayerSelect.querySelector('option[value="add-custom"]');
        const newOption = document.createElement('option'); newOption.value = title; newOption.textContent = name;
        baseLayerSelect.insertBefore(newOption, addCustomOption);
        customLayerNameInput.value = ''; customLayerUrlInput.value = ''; customLayerInputsDiv.style.display = 'none';
        baseLayerSelect.value = title; switchBaseLayer(title); previouslySelectedLayerValue = title;
    }); 

    // --- Z21 Grid Update Logic ---
    let gridUpdateTimeout;
    function updateZ21Grid() {
        const currentZoom = map.getView().getZoom(); const showGrid = currentZoom >= GRID_VISIBILITY_MIN_ZOOM;
        gridLayerZ21.setVisible(showGrid); if (!showGrid) { gridSourceZ21.clear(); return; }
        clearTimeout(gridUpdateTimeout);
        gridUpdateTimeout = setTimeout(() => {
            console.time('updateZ21Grid'); gridSourceZ21.clear(); const view = map.getView();
            const extent = view.calculateExtent(map.getSize()); const features = [];
            try {
                selectionTileGrid.forEachTileCoord(extent, TILE_SELECTION_ZOOM, function (tileCoord) {
                    const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                    features.push(new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) }));
                }); 
                gridSourceZ21.addFeatures(features);
            } catch (error) { console.error("Error Z21 grid:", error); } finally { console.timeEnd('updateZ21Grid'); }
        }, 150);
    }

    // --- User Layer Visibility Update Logic ---
    function updateUserLayerVisibility() {
        const currentZoom = Math.floor(map.getView().getZoom());
        const showUserLayers = currentZoom >= GRID_VISIBILITY_MIN_ZOOM;
        Object.values(userLayers).forEach(layerInfo => { if (layerInfo && layerInfo.layer) { layerInfo.layer.setVisible(showUserLayers); } }); 
    }

    // --- Map Move End Logic ---
    map.on('moveend', () => {
        const currentZoom = Math.floor(map.getView().getZoom());
        const showGridAndSelection = currentZoom >= GRID_VISIBILITY_MIN_ZOOM;
        gridLayerZ21.setVisible(showGridAndSelection);
        selectionLayer.setVisible(showGridAndSelection);
        updateUserLayerVisibility();
        if (showGridAndSelection) { updateZ21Grid(); }
        else { gridSourceZ21.clear(); selectionSource.clear(); }
    }); 
    updateZ21Grid(); updateUserLayerVisibility();
    selectionLayer.setVisible(Math.floor(map.getView().getZoom()) >= GRID_VISIBILITY_MIN_ZOOM);

    // --- Tile Selection Interaction Logic ---
    let currentInteractionMode = 'select';
    function getTileId(tileCoord) { return `${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}`; }
    function toggleTileSelection(tileCoord) {
        const tileId = getTileId(tileCoord);
        const existingFeature = selectionSource.getFeatureById(tileId);

        // --- Check if this tile is part of ANY saved group in the CURRENT layer ---
        if (!selectedLayerId || !userLayers[selectedLayerId]) {
            console.warn("Cannot toggle tile: No layer selected.");
            return; // Should not happen if click handler logic is correct
        }
        const targetSource = userLayers[selectedLayerId].layer.getSource();
        const existingFeaturesInLayer = targetSource.getFeatures();
        const isTileSaved = existingFeaturesInLayer.some(f => f.get('tileId') === tileId);
        // --- End check ---

        if (existingFeature) {
            // Tile is currently selected individually, remove it
            selectionSource.removeFeature(existingFeature);
            console.log(`Deselected individual tile: ${tileId}`);
        } else if (!isTileSaved) {
            // Tile is not currently selected AND not part of a saved group, add it
            const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
            const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) }); 
            newFeature.setId(tileId);
            // Add a property to distinguish individual selections from group selections if needed later
            newFeature.set('isIndividualSelection', true);
            selectionSource.addFeature(newFeature);
            console.log(`Selected individual tile: ${tileId}`);
        } else {
            // Tile is part of a saved group, do nothing (click handler should select the group)
            console.log(`Tile ${tileId} is part of a saved group, preventing individual selection toggle.`);
        }
        updateSelectedTileCountDisplay(); // Update count after toggle
    }

    // Function to ONLY add an *unsaved* tile to selection (used by drag-box)
    function addTileToSelection(tileCoord) {
        const tileId = getTileId(tileCoord);
        const existingSelectionFeature = selectionSource.getFeatureById(tileId);

        // Only add if not already selected individually
        if (!existingSelectionFeature) {
            // --- Check if this tile is part of ANY saved group in the CURRENT layer ---
            // This check is duplicated from toggleTileSelection but necessary here too
            if (!selectedLayerId || !userLayers[selectedLayerId]) {
                console.warn("Cannot add tile via drag: No layer selected.");
                return;
            }
            const targetSource = userLayers[selectedLayerId].layer.getSource();
            const existingFeaturesInLayer = targetSource.getFeatures();
            const isTileSaved = existingFeaturesInLayer.some(f => f.get('tileId') === tileId);
            // --- End check ---

            if (!isTileSaved) {
                // Add to the temporary selection layer only if it's not already selected AND not saved
                const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) }); 
                newFeature.setId(tileId);
                newFeature.set('isIndividualSelection', true); // Mark as individual selection
                selectionSource.addFeature(newFeature);
                // console.log(`Added tile via drag: ${tileId}`);
            } else {
                 // console.log(`Skipping saved tile during drag: ${tileId}`);
            }
        }
        // else { console.log(`Tile ${tileId} already in current drag selection, skipping.`); }
        // No need to call updateSelectedTileCountDisplay here, it's called after the loop in boxend handler
    }

    const clickSelectHandler = function (evt) {
        console.log("clickSelectHandler triggered via singleclick", evt.coordinate); // Add this log
        // This handler runs on 'singleclick'

        const currentZoom = map.getView().getZoom();
        if (currentZoom < GRID_VISIBILITY_MIN_ZOOM) {
            console.log("Zoom in further to select tiles.");
            selectionSource.clear(); // Clear selection if zoomed out too far
            highlightListItem(null); // Clear list highlight
            return;
        }

        const coordinate = evt.coordinate;
        let clickedSavedFeature = null; // The actual saved feature that was clicked
        let clickedGroupId = null;

        // 1. Check if the click hit a SAVED feature in the selected layer using map.forEachFeatureAtPixel
        const pixel = map.getEventPixel(evt.originalEvent);
        const targetLayer = selectedLayerId ? userLayers[selectedLayerId]?.layer : null;

        if (targetLayer) {
            map.forEachFeatureAtPixel(pixel, (feature, layer) => {
                // Check if the feature belongs to the target layer and is part of a saved group
                if (layer === targetLayer) {
                    const groupId = feature.get('tilesetGroupId');
                    if (groupId) {
                        clickedGroupId = groupId;
                        clickedSavedFeature = feature; // Store the first saved feature found at this pixel in the target layer
                        return true; // Stop searching after finding the first match in the target layer
                    }
                }
                return false; // Continue searching if not the target layer or not a saved feature
            }, {
                hitTolerance: 3 // Optional: tolerance in pixels to detect features near the click
                // layerFilter is implicitly handled by checking `layer === targetLayer` inside the callback
            }); 
        }

        // 2. Handle the click based on what was hit
        if (clickedSavedFeature && clickedGroupId) {
            // --- Clicked on a SAVED tileset group ---
console.log(`DEBUG: Click detected on saved feature. GroupID: ${clickedGroupId}, Feature:`, clickedSavedFeature); // DEBUG LOG
            console.log(`Clicked on saved tileset group: ${clickedGroupId}`);
            // Action: Clear everything currently selected and select this group.
            selectionSource.clear(); // Clear previous selections (individual or other group)
            highlightListItem(null); // Clear previous list highlight

            const targetSource = userLayers[selectedLayerId].layer.getSource();
            const allFeaturesInLayer = targetSource.getFeatures();
            const groupFeatures = allFeaturesInLayer.filter(f => f.get('tilesetGroupId') === clickedGroupId);
            const featuresToAdd = groupFeatures.map(f => {
                const clone = f.clone();
                const originalTileId = f.get('tileId');
                clone.setId(`selection-${f.getId() || f.ol_uid}`);
                if (originalTileId) {
                    clone.set('originalTileId', originalTileId);
                    clone.set('isGroupSelection', true); // Mark as group selection
                } else { console.warn("Original feature missing tileId during group selection clone:", f.getId()); }
                return clone;
            }); 

            if (featuresToAdd.length > 0) {
                selectionSource.addFeatures(featuresToAdd);
                highlightListItem(clickedGroupId); // Highlight the new group in the list
console.log(`DEBUG: Calling openTilesetDetailsModal for feature:`, clickedSavedFeature); // DEBUG LOG
                openTilesetDetailsModal(clickedSavedFeature); // <-- ADDED: Open modal on click
            } else { console.warn(`No features found for group ${clickedGroupId} during selection mapping.`); }

        } else {
            // --- Clicked on EMPTY SPACE or an UNSAVED tile ---
            console.log("Clicked on empty space or potentially unsaved tile.");
            // Action: Clear any selected group, then toggle the individual tile.
            highlightListItem(null); // Clear list highlight (in case a group was selected)

            // Check if a group is currently selected in the source. If yes, clear the source.
            const isGroupCurrentlySelected = selectionSource.getFeatures().some(f => f.get('isGroupSelection'));
            if (isGroupCurrentlySelected) {
                console.log("Clearing previously selected group before toggling individual tile.");
                selectionSource.clear();
            }

            // Now, toggle the individual tile at the clicked coordinate
            const tileCoord = selectionTileGrid.getTileCoordForCoordAndZ(coordinate, TILE_SELECTION_ZOOM);
            toggleTileSelection(tileCoord); // This function handles adding/removing unsaved tiles
        }

        // Update UI after any change
        updateSelectedTileCountDisplay();
    }
    // Define and add DragBox interaction for area selection
    const dragBoxInteraction = new ol.interaction.DragBox({
        // condition: ol.events.condition.platformModifierKeyOnly // Example: Use Ctrl/Cmd key for drag-box
        // No condition means drag-box is always active when the interaction is active
    }); 
    map.addInteraction(dragBoxInteraction); // Add DragBox interaction
    dragBoxInteraction.setActive(false); // Start with DragBox inactive (select mode starts with click/toggle)

    if (dragPanInteraction) {
        dragPanInteraction.setActive(true); // Start with DragPan active initially (matching initial 'select' mode behavior where click selects)
    }

    // --- DragBox Selection Logic ---
    dragBoxInteraction.on('boxend', function() {
        if (currentInteractionMode !== 'select') return; // Only act in select mode

        const boxExtent = dragBoxInteraction.getGeometry().getExtent();
        console.log("DragBox ended, extent:", boxExtent);

        // --- Make Drag Additive ---
        // Remove selectionSource.clear(); to make drag additive.
        // Clear group selection *if* a group was selected before dragging.
        const isGroupCurrentlySelected = selectionSource.getFeatures().some(f => f.get('isGroupSelection'));
        if (isGroupCurrentlySelected) {
            console.log("Clearing previously selected group before additive drag.");
            selectionSource.clear(); // Clear the group selection
            highlightListItem(null); // Clear list highlight
        }
        // Now, individual selections will persist and new ones will be added.
        // --- End Additive Logic ---


        const targetLayerId = selectedLayerId; // Capture selected layer at start of drag
        if (!targetLayerId || !userLayers[targetLayerId]) {
            console.warn("Cannot perform drag-select: No valid layer selected.");
            return;
        }
        const targetSource = userLayers[targetLayerId].layer.getSource();
        const existingFeaturesInLayer = targetSource.getFeatures();
        const existingTileIdsInLayer = new Set(existingFeaturesInLayer.map(f => f.get('tileId')).filter(id => id));

        console.time('dragBoxSelect');
        try {
            selectionTileGrid.forEachTileCoord(boxExtent, TILE_SELECTION_ZOOM, function (tileCoord) {
                const tileId = getTileId(tileCoord);
                // Check if this tile ID exists in the *saved* features of the target layer
                if (!existingTileIdsInLayer.has(tileId)) {
                    addTileToSelection(tileCoord); // Add unsaved tile to selection
                } else {
                    // console.log(`Skipping saved tile during drag: ${tileId}`);
                }
            }); 
        } catch (error) {
            console.error("Error during DragBox tile iteration:", error);
        } finally {
            console.timeEnd('dragBoxSelect');
            updateSelectedTileCountDisplay(); // Update count after drag
        }
    }); 
    // --- End DragBox Selection Logic ---


    map.on('singleclick', clickSelectHandler); // Use singleclick to avoid conflict with DragBox

    // --- Selection Actions Visibility & Count ---
    function updateSelectionActionsVisibility() {
        const hasSelection = selectionSource.getFeatures().length > 0;
        selectionActionsDiv.style.display = hasSelection ? 'block' : 'none';
        clearSelectionBtn.style.display = hasSelection ? 'block' : 'none';
        tilesetNameInput.style.display = hasSelection ? 'block' : 'none';
        selectedTileCountDisplay.style.display = hasSelection ? 'block' : 'none';
    }
    function updateSelectedTileCountDisplay() {
        const count = selectionSource.getFeatures().length;
        selectedTileCountDisplay.textContent = `Selected: ${count}`;
        updateSelectionActionsVisibility();
    }
    selectionSource.on('addfeature', updateSelectedTileCountDisplay);
    selectionSource.on('removefeature', updateSelectedTileCountDisplay);

    // --- Tileset List Population & Interaction ---
    // let selectedLayerId = layer0Id; // Moved declaration earlier
    let tilesetFeatureCounter = 0;
    function populateTilesetList(layerId) {
console.log(`DEBUG: populateTilesetList called for layer ${layerId}`); // DEBUG LOG
        tilesetListDiv.innerHTML = '';
        const layerInfo = userLayers[layerId];
        if (!layerInfo || !layerInfo.layer) { tilesetListDiv.innerHTML = '<small><i>Invalid layer selected.</i></small>'; return; }
        const source = layerInfo.layer.getSource();
        const features = source.getFeatures();
        const groupedTilesets = {};
        features.forEach(feature => {
            const groupId = feature.get('tilesetGroupId');
            const name = feature.get('tilesetName') || 'Unnamed Tileset';
            if (groupId) {
                if (!groupedTilesets[groupId]) { groupedTilesets[groupId] = { name: name, features: [], isVisible: feature.get('isVisible') !== false, color: feature.get('color') }; }
                groupedTilesets[groupId].features.push(feature);
                if (feature.get('isVisible') !== false) groupedTilesets[groupId].isVisible = true;
                if (!groupedTilesets[groupId].color) groupedTilesets[groupId].color = feature.get('color');
            } else { console.warn("Feature found without a tilesetGroupId:", feature.getId()); }
        }); 
console.log('DEBUG: Grouped tilesets:', groupedTilesets); // DEBUG LOG
        if (Object.keys(groupedTilesets).length === 0) { tilesetListDiv.innerHTML = '<small><i>No tilesets saved in this layer.</i></small>'; return; }
        Object.entries(groupedTilesets).forEach(([groupId, groupData]) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('layer-item', 'tileset-item');
            itemDiv.dataset.tilesetGroupId = groupId;
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox'; checkbox.checked = groupData.isVisible;
            checkbox.title = `Toggle visibility of "${groupData.name}"`;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = groupData.name;
            nameSpan.title = `Zoom to "${groupData.name}"`;
            const buttonContainer = document.createElement('div'); buttonContainer.classList.add('button-container');
            const editBtn = document.createElement('button'); editBtn.innerHTML = '✏️'; editBtn.classList.add('settings-btn-small'); editBtn.title = `Edit details for "${groupData.name}"`;
            const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '🗑️'; deleteBtn.classList.add('settings-btn-small'); deleteBtn.title = `Delete tileset "${groupData.name}"`;
            buttonContainer.appendChild(editBtn); buttonContainer.appendChild(deleteBtn);
            itemDiv.appendChild(checkbox); itemDiv.appendChild(nameSpan); itemDiv.appendChild(buttonContainer);
            tilesetListDiv.appendChild(itemDiv);
        }); 
    }
    function editTilesetGroupName(groupId, nameSpanElement) { console.log("Edit name for group:", groupId); } // Placeholder
    function deleteTilesetGroup(groupId) {
        if (!selectedLayerId || !userLayers[selectedLayerId]) return;
        const layer = userLayers[selectedLayerId].layer; const source = layer.getSource();
        const featuresToRemove = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        if (featuresToRemove.length > 0) {
            const tilesetName = featuresToRemove[0].get('tilesetName') || 'Unnamed Tileset';
            if (confirm(`Are you sure you want to delete the tileset "${tilesetName}"?`)) {
                featuresToRemove.forEach(feature => source.removeFeature(feature));

                // --- Remove corresponding OpenGlobus entities ---
                if (ogSavedTilesetsLayer) {
                    const ogEntitiesToRemove = ogSavedTilesetsLayer.getEntities().filter(e => e.properties?.groupId === groupId);
                    if (ogEntitiesToRemove.length > 0) {
                        ogSavedTilesetsLayer.removeEntities(ogEntitiesToRemove); // Use bulk remove
                        console.log(`Removed ${ogEntitiesToRemove.length} OG entities for group ${groupId}.`);
                        if (globus.renderer) globus.renderer.draw(); // Redraw globe
                    }
                }
                // --- End OG entity removal ---

                userLayers[selectedLayerId].tilesetCount = Math.max(0, (userLayers[selectedLayerId].tilesetCount || 1) - 1);
                populateTilesetList(selectedLayerId);
                console.log(`Deleted tileset group ${groupId} ("${tilesetName}") from map`);
            }
        }
    }
    function toggleTilesetGroupVisibility(groupId, isVisible) {
        if (!selectedLayerId || !userLayers[selectedLayerId]) return;
        const layer = userLayers[selectedLayerId].layer; const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        groupFeatures.forEach(feature => {
            feature.set('isVisible', isVisible);
            if (isVisible) {
                const color = feature.get('color') || '#008080';
                feature.setStyle(new ol.style.Style({ stroke: new ol.style.Stroke({ color: color, width: 3 }) }));
            } else { feature.setStyle(null); }
        }); 
        console.log(`Set visibility for group ${groupId} to ${isVisible}`);
    }
    function zoomToTilesetGroup(groupId) {
        if (!selectedLayerId || !userLayers[selectedLayerId]) return;
        const layer = userLayers[selectedLayerId].layer; const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        if (groupFeatures.length > 0) {
            const groupExtent = ol.extent.createEmpty();
            groupFeatures.forEach(f => ol.extent.extend(groupExtent, f.getGeometry().getExtent()));
            if (!ol.extent.isEmpty(groupExtent)) {
                map.getView().fit(groupExtent, { padding: [50, 50, 50, 50], duration: 500, maxZoom: TILE_SELECTION_ZOOM }); 
                highlightListItem(groupId);
            }
        }
    }
    function highlightListItem(groupId) {
        const currentlyHighlighted = tilesetListDiv.querySelector('.highlighted');
        if (currentlyHighlighted) currentlyHighlighted.classList.remove('highlighted');
        const listItem = tilesetListDiv.querySelector(`.layer-item[data-tileset-group-id="${groupId}"]`);
        if (listItem) listItem.classList.add('highlighted');
    }
    tilesetListDiv.addEventListener('click', (event) => {
        const target = event.target; const itemDiv = target.closest('.tileset-item'); if (!itemDiv) return;
        const groupId = itemDiv.dataset.tilesetGroupId; if (!groupId) return;
        if (target.tagName === 'SPAN') {
            zoomToTilesetGroup(groupId); // Keep zoom functionality
            // Also open the details modal
            const layer = userLayers[selectedLayerId]?.layer;
            if (layer) {
                const firstFeature = layer.getSource().getFeatures().find(f => f.get('tilesetGroupId') === groupId);
                if (firstFeature) {
                    console.log(`DEBUG: Opening details modal from list click for GroupID: ${groupId}`); // DEBUG LOG
                    openTilesetDetailsModal(firstFeature);
                } else {
                    console.warn("Could not find feature to open details modal from list click for group:", groupId);
                }
            }
        }
        else if (target.innerHTML === '✏️') {
             const layer = userLayers[selectedLayerId]?.layer;
             if (layer) {
                 const firstFeature = layer.getSource().getFeatures().find(f => f.get('tilesetGroupId') === groupId);
                 if (firstFeature) openTilesetDetailsModal(firstFeature);
                 else console.warn("Could not find feature to open details modal for group:", groupId);
             }
        }
        else if (target.innerHTML === '🗑️') { deleteTilesetGroup(groupId); }
    }); 
    tilesetListDiv.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const itemDiv = event.target.closest('.tileset-item');
            if (itemDiv) { const groupId = itemDiv.dataset.tilesetGroupId; if (groupId) { toggleTilesetGroupVisibility(groupId, event.target.checked); } }
        }
    }); 

    // --- User Layer List Population & Interaction ---
    let layerCounter = 1;
    function addLayerToList(layerId, layerName, isVisible) {
        const itemDiv = document.createElement('div'); itemDiv.classList.add('layer-item'); itemDiv.dataset.layerId = layerId;

        // Visibility Toggle (Eye Icon)
        const visibilityBtn = document.createElement('button');
        visibilityBtn.classList.add('visibility-btn', 'settings-btn-small'); // Use button for click handling
        visibilityBtn.innerHTML = isVisible ? '👁️' : '👁️‍🗨️'; // Use appropriate eye icons
        visibilityBtn.title = `Toggle visibility of "${layerName}"`;

        // Selection Indicator (Checkmark) - Initially hidden
        const selectionIndicator = document.createElement('span');
        selectionIndicator.classList.add('selection-indicator');
        selectionIndicator.style.display = 'inline-block'; // Ensure it takes space
        selectionIndicator.style.width = '1.2em'; // Reserve space for checkmark
        selectionIndicator.style.textAlign = 'center';
        selectionIndicator.innerHTML = ''; // Empty initially

        const nameSpan = document.createElement('span');
        nameSpan.textContent = layerName;
        nameSpan.title = `Select layer "${layerName}"`;
        nameSpan.style.cursor = 'pointer'; // Indicate clickable for selection
        nameSpan.style.flexGrow = '1'; // Allow name to take space

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        const editBtn = document.createElement('button'); editBtn.innerHTML = '✏️'; editBtn.classList.add('settings-btn-small'); editBtn.title = `Edit name for "${layerName}"`;
        const privacyBtn = document.createElement('button'); privacyBtn.innerHTML = '🌐'; privacyBtn.classList.add('settings-btn-small'); privacyBtn.title = `Toggle privacy for "${layerName}" (Current: Public)`;
        const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '🗑️'; deleteBtn.classList.add('settings-btn-small'); deleteBtn.title = `Delete layer "${layerName}"`;
        buttonContainer.appendChild(editBtn); buttonContainer.appendChild(privacyBtn); buttonContainer.appendChild(deleteBtn);

        itemDiv.appendChild(selectionIndicator); // Add checkmark placeholder first
        itemDiv.appendChild(visibilityBtn); // Add visibility button second
        itemDiv.appendChild(nameSpan); // Add name
        itemDiv.appendChild(buttonContainer); // Add action buttons

        const initialMsg = userLayerList.querySelector('small'); if (initialMsg) initialMsg.remove();
        userLayerList.appendChild(itemDiv);
    }

    function selectLayerInList(layerId) {
        // Clear previous checkmark
        const currentSelectedItem = userLayerList.querySelector(`.layer-item[data-layer-id="${selectedLayerId}"]`);
        if (currentSelectedItem) {
            const prevIndicator = currentSelectedItem.querySelector('.selection-indicator');
            if (prevIndicator) prevIndicator.innerHTML = '';
        }
         // Remove .selected class if still used elsewhere, though it shouldn't be needed for selection indication now
        const currentSelectedClass = userLayerList.querySelector('.selected');
        if (currentSelectedClass) currentSelectedClass.classList.remove('selected');


        // Set new checkmark
        const newItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
        if (newItem) {
            const newIndicator = newItem.querySelector('.selection-indicator');
            if (newIndicator) newIndicator.innerHTML = '✔️';
             // Optionally add back .selected class if needed for other styling, but checkmark is primary
             // newItem.classList.add('selected');
        }

        selectedLayerId = layerId;
        populateTilesetList(layerId);
        console.log(`Selected layer: ${layerId}`);
    }

    function editLayerName(layerId, nameSpanElement) {
        const currentName = userLayers[layerId]?.name || '';
        const newName = prompt(`Enter new name for layer "${currentName}":`, currentName);
        if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
            const trimmedName = newName.trim(); userLayers[layerId].name = trimmedName; nameSpanElement.textContent = trimmedName;
            const listItem = nameSpanElement.closest('.layer-item');
            if (listItem) {
                listItem.querySelectorAll('button').forEach(btn => {
                    if (btn.title.includes('Edit name')) btn.title = `Edit name for "${trimmedName}"`;
                    if (btn.title.includes('Toggle privacy')) btn.title = btn.title.replace(/"(.*?)"/, `"${trimmedName}"`);
                    if (btn.title.includes('Delete layer')) btn.title = `Delete layer "${trimmedName}"`;
                }); 
                 // Update visibility button title
                 const visibilityBtn = listItem.querySelector('.visibility-btn'); if (visibilityBtn) visibilityBtn.title = `Toggle visibility of "${trimmedName}"`;
                 nameSpanElement.title = `Select layer "${trimmedName}"`;
            }
            console.log(`Renamed layer ${layerId} to "${trimmedName}"`);
        }
    }
    function toggleLayerPrivacy(layerId, buttonElement) {
        const isCurrentlyPublic = buttonElement.innerHTML === '🌐'; const newPrivacy = isCurrentlyPublic ? 'Private' : 'Public';
        const newIcon = isCurrentlyPublic ? '🔒' : '🌐'; const layerName = userLayers[layerId]?.name || 'this layer';
        if (confirm(`Change privacy for layer "${layerName}" to ${newPrivacy}?`)) {
            buttonElement.innerHTML = newIcon; buttonElement.title = `Toggle privacy for "${layerName}" (Current: ${newPrivacy})`;
            console.log(`Layer ${layerId} privacy set to ${newPrivacy}`);
        }
    }
    function deleteLayer(layerId) {
        if (layerId === layer0Id) { alert("Cannot delete the default layer."); return; }
        const layerInfo = userLayers[layerId]; if (!layerInfo) return;
        const layerName = layerInfo.name || 'Unnamed Layer';
        if (confirm(`Are you sure you want to delete layer "${layerName}" and all its tilesets? This cannot be undone.`)) {
            map.removeLayer(layerInfo.layer); delete userLayers[layerId];
            const listItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`); if (listItem) listItem.remove();
            console.log(`Deleted layer ${layerId} ("${layerName}")`);
            if (selectedLayerId === layerId) { selectLayerInList(layer0Id); }
            if (userLayerList.children.length === 0) { userLayerList.innerHTML = '<small><i>No layers created yet.</i></small>'; }
        }
    }
    userLayerList.addEventListener('click', (event) => {
        const target = event.target;
        const itemDiv = target.closest('.layer-item'); if (!itemDiv) return;
        const layerId = itemDiv.dataset.layerId; if (!layerId || !userLayers[layerId]) return; // Ensure layer exists

        // Handle clicks on different parts of the layer item
        if (target.classList.contains('visibility-btn')) {
            // Toggle Visibility
            const layer = userLayers[layerId].layer;
            const isCurrentlyVisible = layer.getVisible();
            const newVisibility = !isCurrentlyVisible;
            layer.setVisible(newVisibility);
            target.innerHTML = newVisibility ? '👁️' : '👁️‍🗨️'; // Update icon
            console.log(`Layer ${layerId} visibility set to ${newVisibility}`);
        } else if (target.tagName === 'SPAN' && target.closest('.layer-item') === itemDiv) {
             // Select Layer (Click on Name)
            selectLayerInList(layerId);
        } else if (target.innerHTML === '✏️') {
            // Edit Name
            editLayerName(layerId, itemDiv.querySelector('span')); // Pass the name span
        } else if (target.innerHTML === '🌐' || target.innerHTML === '🔒') {
            // Toggle Privacy
            toggleLayerPrivacy(layerId, target);
        } else if (target.innerHTML === '🗑️') {
            // Delete Layer
            deleteLayer(layerId);
        }
        // Note: No need for the separate 'change' event listener anymore
    }); 
    // Removed the 'change' event listener as visibility is handled by button click now

    createLayerBtn.addEventListener('click', () => {
        const newLayerName = prompt("Enter name for new layer:", `Layer ${layerCounter}`);
        if (newLayerName && newLayerName.trim() !== '') {
            const trimmedName = newLayerName.trim(); const newLayerId = `layer-${layerCounter++}`;
            const newSource = new ol.source.Vector();
            const newLayer = new ol.layer.Vector({ source: newSource, style: tilesetFeatureStyle, title: newLayerId, zIndex: 2, visible: true }); 
            newLayer.set('userLayerName', trimmedName); userLayers[newLayerId] = { name: trimmedName, layer: newLayer, tilesetCount: 0 };
            map.addLayer(newLayer); addLayerToList(newLayerId, trimmedName, true); selectLayerInList(newLayerId);
            console.log(`Created new layer: ${newLayerId} ("${trimmedName}")`);
        }
    }); 

    // --- Ctrl/Cmd Key Mode Toggle ---
    let ctrlOrCmdPressed = false;

    document.addEventListener('keydown', (event) => {
        // Check if Ctrl (Windows/Linux) or Meta (Mac Cmd) key is pressed
        const isModifier = event.ctrlKey || event.metaKey;
        if (isModifier && !ctrlOrCmdPressed) {
            ctrlOrCmdPressed = true;
            // Only toggle if current mode is 'select'
            if (currentInteractionMode === 'select') {
                interactionModeBtn.click(); // Simulate click to switch to Pan
            }
        }
    }); 

    document.addEventListener('keyup', (event) => {
        // Check if Ctrl or Meta key is released
        const wasModifier = event.key === 'Control' || event.key === 'Meta';
        if (wasModifier && ctrlOrCmdPressed) {
            ctrlOrCmdPressed = false;
            // Only toggle back if current mode is 'pan' (meaning we switched using the key)
            if (currentInteractionMode === 'pan') {
                 interactionModeBtn.click(); // Simulate click to switch back to Select
            }
        }
        // Handle case where modifier key is released but wasn't the one tracked (e.g., Alt released while Ctrl held)
        if (!event.ctrlKey && !event.metaKey && ctrlOrCmdPressed) {
             ctrlOrCmdPressed = false;
             // If we were in pan mode due to the key, switch back
             if (currentInteractionMode === 'pan') {
                  interactionModeBtn.click();
             }
        }
    }); 

    // --- Save Selection Logic ---
    saveSelectionBtn.addEventListener('click', () => {
        let tilesetName = tilesetNameInput.value.trim();
        if (!selectedLayerId || !userLayers[selectedLayerId]) { alert("Please select a layer to save to."); return; } // Moved layer check earlier
        if (!tilesetName) {
            // Generate default name if input is empty
            const currentLayerTilesetCount = userLayers[selectedLayerId].tilesetCount || 0;
            tilesetName = `Tileset ${currentLayerTilesetCount + 1}`;
            console.log(`No name entered, using default: "${tilesetName}"`);
        }
        // Original layer check moved up
        const selectedFeatures = selectionSource.getFeatures(); if (selectedFeatures.length === 0) { alert("No tiles selected to save."); return; }

        // Ensure we are saving *individual* tiles, not a selected group
        const isSavingGroup = selectedFeatures.some(f => f.get('isGroupSelection'));
        if (isSavingGroup) {
            alert("Cannot save a selected tileset group. Please clear selection and select individual tiles or use drag-select to create a new tileset.");
            return;
        }

        const targetSource = userLayers[selectedLayerId].layer.getSource();

        // --- Check for overlap with existing tilesets in the target layer ---
        const existingFeaturesInLayer = targetSource.getFeatures();
        const existingTileIdsInLayer = new Set(existingFeaturesInLayer.map(f => f.get('tileId')).filter(id => id)); // Get all existing tileIds

        let overlapFound = false;
        for (const selectedFeature of selectedFeatures) {
            // Individual selections should have their ID as the tileId
            const tileId = selectedFeature.getId();
            if (!tileId || !tileId.includes('-')) { // Basic check for tileId format
                 console.warn("Selected feature missing valid tileId during save check:", selectedFeature.getId());
                 alert("Error: Cannot verify selection due to missing tile information. Please clear selection and try again.");
                 return;
            }
            if (existingTileIdsInLayer.has(tileId)) {
                overlapFound = true;
                break; // Found an overlap, no need to check further
            }
        }

        if (overlapFound) {
            alert("Cannot save: The current selection includes tiles that are already part of another tileset in this layer.");
            return; // Abort saving
        }
        // --- End overlap check ---

        const featuresToAdd = [];
        const tilesetGroupId = `tileset-group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        selectedFeatures.forEach(feature => {
            // For individual selections, the feature ID *is* the tileId
            const tileId = feature.getId();
             if (!tileId || !tileId.includes('-')) {
                 console.error("Critical error: Invalid tileId found during feature cloning for save. Skipping feature:", feature.getId());
                 return; // Skip this feature if ID is invalid
            }
console.log(`DEBUG: Saving selection. Assigning Name: ${tilesetName}, GroupID: ${tilesetGroupId}`); // DEBUG LOG
            const clonedFeature = feature.clone(); // Clone the selection feature
            const featureId = `tileset-tile-${tilesetFeatureCounter++}`; clonedFeature.setId(featureId); // New unique ID for the saved feature
            clonedFeature.set('tilesetName', tilesetName);
            clonedFeature.set('tilesetGroupId', tilesetGroupId);
            clonedFeature.set('tileId', tileId); // Set the correct tileId from the original selection feature's ID
            clonedFeature.set('isVisible', true);
            clonedFeature.set('color', null); // Reset color or apply default?
            // Remove temporary properties if they exist
            clonedFeature.unset('isIndividualSelection'); // Clean up selection marker

            featuresToAdd.push(clonedFeature);

            // --- Create corresponding OpenGlobus polyline entity ---
            if (tileId && ogSavedTilesetsLayer) {
                try {
                    const tileCoord = tileId.split('-').map(Number); // z-x-y -> [z, x, y]
                    const tileExtentEPSG3857 = selectionTileGrid.getTileCoordExtent(tileCoord);
                    const tileExtentLonLat = ol.proj.transformExtent(tileExtentEPSG3857, 'EPSG:3857', 'EPSG:4326');

                    // Validate coordinates before creating LonLat objects
                    if (!tileExtentLonLat || tileExtentLonLat.length !== 4 || tileExtentLonLat.some(isNaN)) {
                        console.error(`Invalid tileExtentLonLat calculated for tile ${tileId}:`, tileExtentLonLat);
                        return; // Skip this iteration if coordinates are invalid
                    }

                    const polylineCoords = [ // Outline coordinates as og.LonLat objects
                        new og.LonLat(tileExtentLonLat[0], tileExtentLonLat[1]), // Bottom-left
                        new og.LonLat(tileExtentLonLat[2], tileExtentLonLat[1]), // Bottom-right
                        new og.LonLat(tileExtentLonLat[2], tileExtentLonLat[3]), // Top-right
                        new og.LonLat(tileExtentLonLat[0], tileExtentLonLat[3]), // Top-left
                    ];

                    const ogEntity = new og.Entity({
                        name: `saved-${tileId}`,
                        polyline: {
                            pathLonLat: [polylineCoords], // Wrap the single path in an array
                            isClosed: true,
                            color: '#008080', // Default color Teal - TODO: Use actual saved color later
                            thickness: 2
                        },
                        properties: {
                            tileId: tileId,
                            groupId: tilesetGroupId // Link to the map feature group
                        },
                        altitude: 0 // Explicitly set altitude for the entity
                    }); 
                    // Add to a temporary array for bulk addition later
                    // No need for temporary array, redraw will handle it
                } catch (error) {
                    console.error(`Error creating OG entity for tile ${tileId}:`, error);
                }
            }
            // --- End OG entity creation ---
        }); 

        // Add features to OpenLayers layer
        if (featuresToAdd.length > 0) {
console.log(`DEBUG: Added ${featuresToAdd.length} features to targetSource. Features:`, featuresToAdd); // DEBUG LOG
            targetSource.addFeatures(featuresToAdd);

            // Trigger redraw of the OpenGlobus saved layer
            if (ogSavedTilesetsLayer && ogSavedTilesetsLayer.redraw) {
                 console.log("DEBUG: Calling ogSavedTilesetsLayer.redraw()"); // DEBUG LOG
                 ogSavedTilesetsLayer.redraw();
            } else if (globus && globus.renderer) {
                 console.log("DEBUG: Calling globus.renderer.draw() as fallback redraw."); // DEBUG LOG
                 globus.renderer.draw(); // Fallback redraw
            }

            userLayers[selectedLayerId].tilesetCount = (userLayers[selectedLayerId].tilesetCount || 0) + 1;
            selectionSource.clear(); // Clear selection after successful save
            // Add a small delay before populating list to allow source update
            setTimeout(() => {
                 console.log("DEBUG: Calling populateTilesetList after delay."); // DEBUG LOG
                 populateTilesetList(selectedLayerId);
            }, 100); // 100ms delay
            updateSelectedTileCountDisplay(); // Update UI (count to 0, hide actions)
            tilesetNameInput.value = '';
            console.log(`Saved ${featuresToAdd.length} tiles as "${tilesetName}" to layer ${selectedLayerId}`);
        } else { console.warn("No features were added during save operation."); }
    }); 

    // --- Clear Selection Logic ---
    clearSelectionBtn.addEventListener('click', () => {
        selectionSource.clear(); // Clears both individual tiles and selected groups
        highlightSource.clear(); // Clear any map highlight (though not currently used)
        highlightListItem(null); // Clear list highlight
        tilesetDetailsModal.style.display = 'none'; // Close details modal if open
        currentEditingGroupId = null;
        console.log("Cleared current selection.");
        updateSelectedTileCountDisplay(); // Ensure count display updates to 0 and actions hide
    }); 

    // --- Interaction Mode Switching ---
    interactionModeBtn.addEventListener('click', () => {
        if (currentInteractionMode === 'select') {
            // Switch TO Pan mode
            currentInteractionMode = 'pan';
            interactionModeBtn.textContent = 'Mode: Pan Map';
            dragBoxInteraction.setActive(false); // Deactivate DragBox
            if (dragPanInteraction) {
                dragPanInteraction.setActive(true); // Activate DragPan
            }
            if (mapElementOL) mapElementOL.style.cursor = 'grab';
            console.log("Switched to Pan mode");
        } else {
            // Switch TO Select mode
            currentInteractionMode = 'select';
            interactionModeBtn.textContent = 'Mode: Select Tiles'; // Updated text
             if (dragPanInteraction) {
                 dragPanInteraction.setActive(false); // Deactivate DragPan
            }
            dragBoxInteraction.setActive(true); // Activate DragBox
            // Use crosshair cursor in select mode to indicate selection capability
            if (mapElementOL) mapElementOL.style.cursor = 'crosshair';
            console.log("Switched to Select Tiles mode");
        }
    }); 

    // --- Initial UI Setup ---
    // addLayerToList(layer0Id, layer0Name, true); // Removed duplicate call, already added earlier (around line 366)
    selectLayerInList(layer0Id); // Select the initially added Layer 0
    populateTilesetList(layer0Id);
    updateSelectionActionsVisibility();
    updateSelectedTileCountDisplay();
    // Initial mode is 'select', but DragPan is active and DragBox is inactive by default.
    // Click handler works, DragBox needs mode switch.
    // Let's set the initial cursor based on the initial state (DragPan active).
    if (mapElementOL) mapElementOL.style.cursor = 'grab'; // Initial cursor matches initial DragPan state
    interactionModeBtn.textContent = 'Mode: Pan Map'; // Initial button text reflects initial state
    currentInteractionMode = 'pan'; // Set initial mode state variable correctly

    // initializeOpenGlobus(); // Initialize Globus early but keep hidden // Temporarily commented out

    // --- Helper to find features being edited ---
    function findCurrentGroupFeatures() {
        if (!selectedLayerId || !userLayers[selectedLayerId] || !currentEditingGroupId) { return []; }
        const source = userLayers[selectedLayerId].layer.getSource();
        return source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);
    }

    // --- Map/Globe Toggle Button (Sync on Toggle) ---
    // Moved layerSwitcherPanel definition to UI Element References section
    const panelHeader = layerSwitcherPanel.querySelector('.panel-header');
    const minimizeBtn = panelHeader.querySelector('.minimize-btn');

    const toggleMapGlobeBtn = document.createElement('button');
    toggleMapGlobeBtn.innerHTML = '3D Globe'; // Initial state: show 2D map
    toggleMapGlobeBtn.title = 'Toggle 2D Map / 3D Globe View';
    toggleMapGlobeBtn.style.marginLeft = '10px'; toggleMapGlobeBtn.style.padding = '2px 6px';
    toggleMapGlobeBtn.style.fontSize = '12px'; toggleMapGlobeBtn.style.cursor = 'pointer';
    toggleMapGlobeBtn.style.backgroundColor = '#555'; toggleMapGlobeBtn.style.color = '#eee';
    toggleMapGlobeBtn.style.border = '1px solid #777'; toggleMapGlobeBtn.style.borderRadius = '3px';

    let isGlobeView = false;

    toggleMapGlobeBtn.onclick = () => {
        isGlobeView = !isGlobeView;
        if (isGlobeView) {
            if (!globus) { initializeOpenGlobus(); }
            if (globus) {
                mapElementOL.style.display = 'none'; globusElement.style.display = 'block';
                toggleMapGlobeBtn.innerHTML = '2D Map';
                // Sync OL view to OG view
                try {
                    const olView = map.getView(); const olExtent = olView.calculateExtent(map.getSize());
                    const olExtentLonLat = ol.proj.transformExtent(olExtent, 'EPSG:3857', 'EPSG:4326');
                    const ogExtent = new og.Extent(new og.LonLat(olExtentLonLat[0], olExtentLonLat[1]), new og.LonLat(olExtentLonLat[2], olExtentLonLat[3]));
                    globus.planet.setViewExtent(ogExtent);
                    console.log("Switched to Globe view, synced view.");
                } catch (e) { console.error("Error syncing view from OL to OG:", e); console.log("Switched to Globe view (sync failed)."); }
            } else { isGlobeView = false; } // Revert state if globus failed to init
        } else {
            mapElementOL.style.display = 'block'; globusElement.style.display = 'none';
            toggleMapGlobeBtn.innerHTML = '3D Globe';
            map.getView().setRotation(0); // Reset OL map rotation
            // Sync OG view back to OL view (approximate)
            if (globus && globus.planet && globus.planet.camera) {
                 try {
                    const ogCenter = globus.planet.camera.getLonLat(); const ogAltitude = globus.planet.camera.altitude;
                    const olCenter = ol.proj.fromLonLat([ogCenter.lon, ogCenter.lat]);
                    const olZoom = Math.min(TILE_SELECTION_ZOOM, Math.max(0, 20 - Math.log2(ogAltitude / 1000)));
                    map.getView().setCenter(olCenter); map.getView().setZoom(olZoom);
                    console.log("Switched to Map view, synced view.");
                 } catch(e) { console.error("Error syncing view from OG to OL:", e); console.log("Switched to Map view (sync failed)."); }
            } else { console.log("Switched to Map view (no globe view to sync from)."); }
        }
    };

    // Insert button into header
    if (panelHeader && minimizeBtn) { panelHeader.insertBefore(toggleMapGlobeBtn, minimizeBtn); }
    else { console.error("Could not find Maps panel header or minimize button."); document.body.appendChild(toggleMapGlobeBtn); }

    // Check if OpenGlobus library is loaded
    if (typeof og === 'undefined') {
        console.warn("OpenGlobus library (og) not loaded globally. 3D view will not work.");
        toggleMapGlobeBtn.disabled = true; toggleMapGlobeBtn.title = 'OpenGlobus library not loaded';
    }

    // --- Resize Handling for OL Map ---
    // Moved mapPanel definition to UI Element References section
    if (mapPanel) {
        const resizeObserver = new ResizeObserver(() => {
            map.updateSize(); console.log("Map panel resized, updated OL map size.");
        }); 
        resizeObserver.observe(mapPanel);
    } else { console.error("Could not find map panel for resize observer."); }

    // Explicitly update OL map size after initial setup
    setTimeout(() => map.updateSize(), 100);

    // --- Toolbar View Button Logic (Moved Here) ---
    // Note: mapPanel, globePanel, socialPanel, mapViewBtn, globeViewBtn, socialBtn, toolbarButtons should be defined earlier
    function setActiveButton(clickedButton) {
        toolbarButtons.forEach(button => {
            if (button) { button.classList.remove('active'); }
        }); 
        if (clickedButton) { clickedButton.classList.add('active'); }
    }

    function togglePanelVisibility(panel, button) {
        if (!panel) return;
        const isVisible = panel.classList.contains('visible-panel');

        if (!isVisible) {
            // Show the panel by adding the visible-panel class
            panel.classList.add('visible-panel');
            setActiveButton(button);
            // Special handling for OpenGlobus resize
            if (panel === globePanel && globus && globus.planet && globus.planet.renderer) {
                 setTimeout(() => { globus.planet.renderer.resize(); console.log("Resized OpenGlobus after panel toggle."); }, 50);
            }
            // Special handling for OpenLayers map resize
            if (panel === mapPanel && map) { // mapPanel is defined here
                 setTimeout(() => { map.updateSize(); console.log("Updated OpenLayers map size after panel toggle."); }, 50);
            }
            } else if (panel.id === 'xr-panel') {
                 // Position in center, large size
                 panel.style.top = '50% !important';
                 panel.style.left = '50% !important';
                 panel.style.transform = 'translate(-50%, -50%) !important'; // Center the panel
                 panel.style.width = '80% !important'; // Large width
                 panel.style.height = '80% !important'; // Large height
                 panel.style.bottom = 'auto !important'; // Unset bottom positioning
                 panel.style.right = 'auto !important'; // Unset right positioning
                 panel.style.maxHeight = 'auto !important'; // Remove max height limit
            } else if (panel.id === 'xr-panel') {
                 // Position in center, large size
                 panel.style.top = '50% !important';
                 panel.style.left = '50% !important';
                 panel.style.transform = 'translate(-50%, -50%) !important'; // Center the panel
                 panel.style.width = '80% !important'; // Large width
                 panel.style.height = '80% !important'; // Large height
                 panel.style.bottom = 'auto !important'; // Unset bottom positioning
                 panel.style.right = 'auto !important'; // Unset right positioning
                 panel.style.maxHeight = 'auto !important'; // Remove max height limit
            }
            else {
                 // Hide the panel by setting display to none
                 panel.style.display = 'none';
                 // Optionally reset z-index when hidden if needed
                 // panel.style.zIndex = '';
                 if (button) button.classList.remove('active');
            }
    }

    // Toolbar Button Logic moved to after UI element definitions

    // --- Make Panels Draggable ---
    makeDraggable(document.getElementById('layer-switcher'));
    // Old makeDraggable calls removed below
// Add checks for existing draggable calls too
    const layerSwitcherEl = document.getElementById('layer-switcher');
    if (layerSwitcherEl) { makeDraggable(layerSwitcherEl); } else { console.warn("Layer switcher element not found for dragging."); }
    const userLayersPanelEl = document.getElementById('user-layers-panel');
    if (userLayersPanelEl) { makeDraggable(userLayersPanelEl); } else { console.warn("User layers panel element not found for dragging."); }
    const appControlsPanelEl = document.getElementById('app-controls');
    if (appControlsPanelEl) { makeDraggable(appControlsPanelEl); } else { console.warn("App controls panel element not found for dragging."); }
    const tilesetDetailsModalEl = document.getElementById('tileset-details-modal');
    if (tilesetDetailsModalEl) { makeDraggable(tilesetDetailsModalEl); } else { console.warn("Tileset details modal element not found for dragging."); }
    const mapPanelEl = document.getElementById('map-panel');
    if (mapPanelEl) { makeDraggable(mapPanelEl); } else { console.warn("Map panel element not found for dragging."); }
    const globePanelEl = document.getElementById('globe-panel');
    if (globePanelEl) { makeDraggable(globePanelEl); } else { console.warn("Globe panel element not found for dragging."); }
    const socialPanelEl = document.getElementById('social-panel');
    if (socialPanelEl) { makeDraggable(socialPanelEl); } else { console.warn("Social panel element not found for dragging."); }
    const profilePanelEl = document.getElementById('profile-panel');
    if (profilePanelEl) { makeDraggable(profilePanelEl); } else { console.warn("Profile panel element not found for dragging."); }

    // --- Minimize/Expand Panel Logic --- (Updated for View Panels)
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('minimize-btn')) {
            // Target both control and view panels
            const panel = event.target.closest('.control-panel, .view-panel');
            if (panel) {
                panel.classList.toggle('minimized');
                event.target.textContent = panel.classList.contains('minimized') ? '+' : '-';
                event.target.title = panel.classList.contains('minimized') ? 'Expand' : 'Minimize';

                // If expanding a view panel, update the corresponding map/globe size
                if (!panel.classList.contains('minimized')) {
                    if (panel.id === 'map-panel') {
                        // Update OL map size after a short delay for CSS transition
                        setTimeout(() => map.updateSize(), 50);
                        console.log("Map panel expanded, updated OL size.");
                    } else if (panel.id === 'globe-panel') {
                        // Trigger OG resize after a short delay
                        setTimeout(() => {
                            if (globus && globus.planet && globus.planet.renderer) {
                                 // Use the renderer's resize method
                                 globus.planet.renderer.resize();
                                 console.log("Globe panel expanded, triggered OG resize.");
                            }
                        }, 50);
                    }
                }
            }
        }
    }); 

    // --- Maximize/Restore View Panel Logic ---
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('maximize-btn')) {
            const panel = event.target.closest('.view-panel');
            if (panel) {
                const isMaximized = panel.classList.contains('maximized');

                // If one is maximized, restore it first before maximizing another
                if (!isMaximized) {
                    const otherMaximized = document.querySelector('.view-panel.maximized');
                    if (otherMaximized) {
                        otherMaximized.classList.remove('maximized');
                        // Trigger resize on restore
                        if (otherMaximized.id === 'map-panel') setTimeout(() => map.updateSize(), 50);
                        if (otherMaximized.id === 'globe-panel' && globus && globus.planet.renderer) setTimeout(() => globus.planet.renderer.resize(), 50);
                    }
                }

                // Toggle maximized state for the clicked panel
                panel.classList.toggle('maximized');

                // Update map/globe size after toggling
                setTimeout(() => {
                    if (panel.id === 'map-panel') map.updateSize();
// --- Gun.js Chat Logic (Temporarily commented out) ---
    // try {
    //     const gun = Gun(); // Initialize Gun - connects to peers automatically

    //     const messagesContainer = document.getElementById('messages');
    //     const messageInput = document.getElementById('message-input');
    //     const sendButton = document.getElementById('send-button');

    //     // Function to display a message
    //     function displayMessage(messageData) {
    //         if (!messagesContainer || !messageData || !messageData.text) return; // Basic validation

    //         const messageElement = document.createElement('div');
    //         messageElement.classList.add('message'); // Add class for potential styling

    //         // Simple display: [timestamp] user: text
    //         const timestamp = messageData.timestamp ? new Date(messageData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    //         const user = messageData.user || 'Anonymous'; // Basic user handling for now
    //         messageElement.textContent = `[${timestamp}] ${user}: ${messageData.text}`;

    //         messagesContainer.appendChild(messageElement);
    //         // Scroll to the bottom
    //         messagesContainer.scrollTop = messagesContainer.scrollHeight;
    //     }

    //     // Send message when button is clicked
    //     if (sendButton && messageInput) {
    //         sendButton.addEventListener('click', () => {
    //             const messageText = messageInput.value.trim();
    //             if (messageText) {
    //                 const messageData = {
    //                     // Add user info here later if implementing authentication
    //                     user: 'User' + Math.random().toString(36).substring(2, 7), // Temporary random user ID
    //                     text: messageText,
    //                     timestamp: Gun.state() // Get Gun's network timestamp
    //                 };
    //                 // Put the message onto the 'chat' graph node
    //                 gun.get('chat').set(messageData);
    //                 messageInput.value = ''; // Clear input field
    //             }
    //         }); 

    //         // Allow sending with Enter key
    //         messageInput.addEventListener('keypress', (e) => {
    //             if (e.key === 'Enter') {
    //                 sendButton.click(); // Trigger button click
    //             }
    //         }); 
    //     } else {
    //          console.warn("Chat input or send button not found.");
    //     }

    //     // Listen for messages on the 'chat' graph node
    //     gun.get('chat').map().on((messageData, messageId) => {
    //         // console.log("Received message:", messageData); // Debugging
    //         if (messageData) {
    //             // Ensure displayMessage is called only once per message ID if needed,
    //             // though Gun's .on() usually handles this reasonably well for simple cases.
    //             displayMessage(messageData);
    //         }
    //     }); 
    //     console.log("Gun.js chat logic initialized.");

    // } catch (error) {
    //     console.error("Error initializing Gun.js chat logic:", error);
    // }
    // --- End Gun.js Chat Logic ---
                    if (panel.id === 'globe-panel' && globus && globus.planet.renderer) globus.planet.renderer.resize();
                }, 50); // Delay slightly for CSS transition
            }
        }
    }); 

// --- Initial Layer List Population ---
    // Removed redundant addLayerToList call for Layer 0
    selectLayerInList(layer0Id);
// --- Gun.js Chat & Auth Logic ---
    try {
        // Connect to a local relay peer if running one, or default peers
        // Ensure the peer URL is correct for your setup.
        // If running the basic `node examples/relay.js` from gun repo, it's usually http://localhost:8765/gun
        const gun = Gun({ peers: ['http://localhost:8765/gun'] }); 
        const user = gun.user(); // Gun User Authentication (SEA)

        // --- UI Element References ---
        const messagesDiv = document.getElementById('chat-messages');
        const messageInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message-btn');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        const signupBtn = document.getElementById('signup-btn');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const authStatusDiv = document.getElementById('auth-status');

        // --- Basic Input Validation ---
        if (!messagesDiv || !messageInput || !sendBtn || !usernameInput || !passwordInput || !signupBtn || !loginBtn || !logoutBtn || !authStatusDiv) {
            console.error("One or more Gun.js UI elements are missing from the HTML.");
            throw new Error("Missing Gun.js UI elements."); // Stop execution if critical elements missing
        }

        // --- Chat Functionality ---
        // Send message
        sendBtn.addEventListener('click', () => {
            if (!user.is) {
                alert('Please log in to send messages.');
                return;
            }
            const messageText = messageInput.value.trim();
            if (messageText) {
                // Save message to a public space ('mundial/chat'), timestamped
                gun.get('mundial/chat').set({
                    text: messageText,
                    sender: user.is.alias, // Use alias of logged-in user
                    timestamp: Gun.state() // Use Gun's server timestamp for consistency
                }); 
                messageInput.value = ''; // Clear input
            }
        }); 

         // Allow sending with Enter key in message input
         messageInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow Shift+Enter for newline
                 e.preventDefault(); // Prevent default newline insertion
                 sendBtn.click(); // Trigger button click
             }
         }); 

        // Display messages
        gun.get('mundial/chat').map().once((message, id) => { // Use once initially to load history faster if desired
             if (isValidMessage(message)) {
                 displayMessage(message);
             }
        }); 
         gun.get('mundial/chat').map().on((message, id) => { // Use on for real-time updates
             if (isValidMessage(message)) {
                 // Check if already displayed by 'once' or previous 'on'
                 const existingMsg = messagesDiv.querySelector(`[data-key="${id}"]`);
                 if (!existingMsg) {
                    displayMessage(message, id);
                 }
             }
         }); 


        function isValidMessage(message) {
            return message && message.text && message.sender && message.timestamp;
        }

        function displayMessage(message, id) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message-item'); // Add a class for styling
            messageElement.setAttribute('data-key', id); // Use Gun's message ID as a key

            const date = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
            // Sanitize sender and text before displaying to prevent XSS
            const safeSender = document.createTextNode(message.sender).textContent;
            const safeText = document.createTextNode(message.text).textContent;

            messageElement.innerHTML = `<span class="chat-timestamp">[${date}]</span> <span class="chat-sender">${safeSender}:</span> <span class="chat-text">${safeText}</span>`;

            messagesDiv.appendChild(messageElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
        }

        // --- Auth Functionality ---
        signupBtn.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (username && password) {
                user.create(username, password, (ack) => {
                    if (ack.err) {
                        alert(`Signup Error: ${ack.err}`);
                    } else {
                        alert(`User '${username}' created! Please log in.`);
                        usernameInput.value = '';
                        passwordInput.value = '';
                    }
                }); 
            } else {
                alert('Please enter both username and password.');
            }
        }); 

        loginBtn.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (username && password) {
                user.auth(username, password, (ack) => {
                    if (ack.err) {
                        alert(`Login Error: ${ack.err}`);
                    } else {
                        console.log('Logged in as:', ack.put.alias);
                        // UI update is handled by gun.on('auth') listener below
                    }
                }); 
            } else {
                alert('Please enter both username and password.');
            }
        }); 

        logoutBtn.addEventListener('click', () => {
            user.leave();
            // UI update is handled by gun.on('auth') listener below
        }); 

        // Update UI based on auth state changes
        gun.on('auth', () => { // No need for ack here, just check user.is
            console.log('Auth state changed. Current user:', user.is);
            updateAuthUI();
        }); 

        function updateAuthUI() {
             if (user.is) { // User is logged in
                 authStatusDiv.textContent = `Logged in as: ${user.is.alias}`;
                 loginBtn.style.display = 'none';
                 signupBtn.style.display = 'none';
                 usernameInput.style.display = 'none';
                 passwordInput.style.display = 'none';
                 logoutBtn.style.display = 'block'; // Show logout button
                 messageInput.disabled = false;
                 sendBtn.disabled = false;
             } else { // User is logged out
                 authStatusDiv.textContent = 'Status: Not logged in';
                 loginBtn.style.display = 'inline-block'; // Show login/signup
                 signupBtn.style.display = 'inline-block';
                 usernameInput.style.display = 'inline-block';
                 passwordInput.style.display = 'inline-block';
                 logoutBtn.style.display = 'none'; // Hide logout button
                 messageInput.disabled = true; // Disable chat input
                 sendBtn.disabled = true;
                 usernameInput.value = ''; // Clear fields on logout/initial load
                 passwordInput.value = '';
             }
        }

         // Initial UI state check
         updateAuthUI(); // Call once on load to set the correct initial state

    } catch (error) {
        console.error("Error in Gun.js Chat & Auth Logic:", error);
    }
// --- Settings Panel Logic ---
    function loadSettings() {
        // Load Start Location
        const startLon = localStorage.getItem('setting_startLon');
        const startLat = localStorage.getItem('setting_startLat');
        const startZoom = localStorage.getItem('setting_startZoom');
        if (startLon !== null) settingStartLonInput.value = startLon;
        if (startLat !== null) settingStartLatInput.value = startLat;
        if (startZoom !== null) settingStartZoomInput.value = startZoom;
        // Apply loaded start location (needs map/globe to be initialized)
        // We'll call applyStartLocationSettings() after map/globe init

        // Load Grid Settings
        const gridVisible = localStorage.getItem('setting_gridVisible');
        const gridWeight = localStorage.getItem('setting_gridWeight');
        if (gridVisible !== null) settingGridVisibleCheckbox.checked = (gridVisible === 'true');
        if (gridWeight !== null) settingGridWeightInput.value = gridWeight;
        applyGridSettings(); // Apply loaded grid settings
    }

    function applyStartLocationSettings() {
        const lon = parseFloat(settingStartLonInput.value);
        const lat = parseFloat(settingStartLatInput.value);
        const zoom = parseInt(settingStartZoomInput.value, 10);

        if (!isNaN(lon) && !isNaN(lat) && !isNaN(zoom)) {
            console.log(`Applying start location: Lon=${lon}, Lat=${lat}, Zoom=${zoom}`);
            if (map && map.getView()) {
                map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
                map.getView().setZoom(zoom);
            }
            if (globus && globus.planet) {
                 // Calculate rough altitude from zoom (needs refinement)
                 const altitude = 5000000 / Math.pow(2, zoom - 1);
                 globus.planet.viewLonLat(new og.LonLat(lon, lat, altitude));
            }
        } else {
            console.warn("Cannot apply start location: Invalid input values.");
        }
    }

     function applyGridSettings() {
        const isVisible = settingGridVisibleCheckbox.checked;
        const weight = parseFloat(settingGridWeightInput.value);

        console.log(`Applying grid settings: Visible=${isVisible}, Weight=${weight}`);

        // Apply visibility (assuming gridLayerZ21 and gridLayerOG exist)
        if (gridLayerZ21) gridLayerZ21.setVisible(isVisible && map.getView().getZoom() >= GRID_VISIBILITY_MIN_ZOOM);
        if (gridLayerOG) gridLayerOG.setVisibility(isVisible); // OG layer visibility might be simpler

        // Apply line weight (requires modifying the drawTile function or layer style)
        // For CanvasTiles, we need to update the drawTile function logic
        if (gridLayerOG && !isNaN(weight)) {
            // Need to modify the drawTile function itself or store weight globally
            // For now, just log it. Re-drawing requires layer refresh.
            console.log("Grid weight change requires layer refresh/redraw logic (TODO)");
             // Example: Store globally (simple approach)
             window.gridLineWeight = weight;
             // Force redraw (might not update style immediately for CanvasTiles)
             if (gridLayerOG.clear) gridLayerOG.clear(); // Clear existing tiles
             if (globus && globus.renderer) globus.renderer.draw();
        }
         if (gridLayerZ21 && !isNaN(weight)) {
             // For OL Vector layer, update the style
             const newStyle = new ol.style.Style({
                 stroke: new ol.style.Stroke({ color: 'rgba(0,0,0,0.4)', width: weight })
             }); 
             gridLayerZ21.setStyle(newStyle);
             console.log("Updated OL grid style weight.");
         }
    }

    // --- Settings Event Listeners ---
    if (settingSetStartLocationBtn) {
        settingSetStartLocationBtn.addEventListener('click', () => {
            if (map && map.getView()) {
                const currentCenterLonLat = ol.proj.toLonLat(map.getView().getCenter());
                const currentZoom = map.getView().getZoom();
                settingStartLonInput.value = currentCenterLonLat[0].toFixed(6);
                settingStartLatInput.value = currentCenterLonLat[1].toFixed(6);
                settingStartZoomInput.value = Math.round(currentZoom);
                localStorage.setItem('setting_startLon', settingStartLonInput.value);
                localStorage.setItem('setting_startLat', settingStartLatInput.value);
                localStorage.setItem('setting_startZoom', settingStartZoomInput.value);
                alert("Current view set as start location.");
            }
        }); 
    }

    if (settingGridVisibleCheckbox) {
        settingGridVisibleCheckbox.addEventListener('change', () => {
            localStorage.setItem('setting_gridVisible', settingGridVisibleCheckbox.checked);
            applyGridSettings();
        }); 
    }

     if (settingGridWeightInput) {
        settingGridWeightInput.addEventListener('input', () => { // Use 'input' for live updates
            localStorage.setItem('setting_gridWeight', settingGridWeightInput.value);
            applyGridSettings(); // Apply immediately (redraw logic needed for OG)
        }); 
    }

    // Load settings when the script runs (after DOM is ready)
    loadSettings();

    // Apply start location after map/globe are initialized
    // Need to find the end of the initialization block
    // For now, let's assume it's done and call it (might need adjustment)
    // TODO: Move this call to the correct place after map/globe init
    // applyStartLocationSettings();
// --- End Settings Panel Logic ---
}); // Close the main DOMContentLoaded event listener from line 3