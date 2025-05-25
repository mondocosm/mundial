import * as og from '../packages/openglobus/lib/og.es.js';
// Ensure 'ol' is available globally if not imported as a module, or import it.
// For now, assuming OpenLayers (ol) is globally available from its CDN script.
// console.log("%cMAIN.JS SCRIPT EXECUTION STARTED - VERY TOP LINE", "color: green; font-size: 1.5em; font-weight: bold;");
// console.log("GLOBAL SCOPE: JavaScript is running in main.js (line 4 now)");
// let globus = null; // Declare globus in local scope
// let olMap = null; // Declare olMap in local scope for OpenLayers map
const TILE_SELECTION_ZOOM = 21; // Global scope for OpenGlobus layers
const GRID_VISIBILITY_MIN_ZOOM = 16; // Global scope for OpenGlobus grid layer
let gridLayerZ21 = null; // For OpenLayers ZL21 grid
let selectionTileGrid = null; // For OpenLayers ZL21 grid calculation
let selectionSource = null;
let selectionLayer = null;
let highlightSource = null;
let highlightLayer = null;
let layer0Source = null;
let layer0Layer = null;
const layer0Id = 'layer-0'; // Define layer0Id at a higher scope
let dragPanInteraction = null; // Define dragPanInteraction at top level
let dragBoxInteraction = null; // Define dragBoxInteraction at top level
let olcsMapPanel = null; // For OLCesium instance in the map panel

const state = {
    globus: null, // Declare globus in local scope
    olMap: null, // Declare olMap in local scope for OpenLayers map
    mapLibreMap: null, // For MapLibre map instance
    // leafletMap: null, // Added for Leaflet // Commented out
    // leafletGridLayer: null, // For Leaflet ZL21 grid // Commented out
    // leafletSavedTilesetsLayerGroup: null, // For Leaflet saved tilesets // Commented out
    itownsView: null, // Added for iTowns
    activeMapLibrary: 'openlayers', // 'openlayers' or 'maplibre' // Leaflet removed
    activeGlobeLibrary: 'openglobus', // 'openglobus' or 'itowns'
    gridLayerZ21: null, // For OpenLayers ZL21 grid
    selectionTileGrid: null, // For OpenLayers ZL21 grid calculation
    selectionSource: null,
    selectionLayer: null,
    highlightSource: null,
    highlightLayer: null,
    layer0Source: null,
    layer0Layer: null,
    highlightedGlobeGroupId: null, // To store the ID of the tileset group to highlight on the globe
    saveSelectionListenerAttached: false,
    populateListCallCounter: 0,
    masterMapModeIs3D: false // Default to 2D for master control
};
// userLayers and selectedLayerId are already on window object from previous steps
let cesiumGridDataSource = null; // For Cesium ZL21 grid entities
const updateCesiumZL21Grid = function(scene, dataSource) {
    if (!scene || !dataSource || !selectionTileGrid || !state.olMap || !Cesium || !olcsMapPanel) {
        // console.warn("updateCesiumZL21Grid: Prerequisites not met (early def).");
        return;
    }
    const viewer = olcsMapPanel.getCesiumViewer();
    if (!viewer || !viewer.scene || !viewer.camera || !viewer.scene.globe || !viewer.scene.canvas) {
        // console.warn("updateCesiumZL21Grid: Cesium viewer components not ready (early def).");
        return;
    }

    const camera = viewer.camera;
    const canvas = viewer.scene.canvas;
    const ellipsoid = viewer.scene.globe.ellipsoid;

    let currentViewRectangle = camera.computeViewRectangle(ellipsoid);
    if (!currentViewRectangle) {
        const corners = [
            camera.pickEllipsoid(new Cesium.Cartesian2(0, 0), ellipsoid),
            camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width, 0), ellipsoid),
            camera.pickEllipsoid(new Cesium.Cartesian2(0, canvas.height), ellipsoid),
            camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width, canvas.height), ellipsoid),
            camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width / 2, canvas.height / 2), ellipsoid)
        ];
        const validCorners = corners.filter(c => c);
        if (validCorners.length >= 2) {
            currentViewRectangle = Cesium.Rectangle.fromCartesianArray(validCorners, ellipsoid);
        }
    }

    if (!currentViewRectangle) {
        // console.warn("updateCesiumZL21Grid: Could not determine view rectangle. Grid not updated (early def).");
        return;
    }
    
    const west = Cesium.Math.toDegrees(currentViewRectangle.west);
    const south = Cesium.Math.toDegrees(currentViewRectangle.south);
    const east = Cesium.Math.toDegrees(currentViewRectangle.east);
    const north = Cesium.Math.toDegrees(currentViewRectangle.north);

    const bufferFactor = 0.2;
    const lonBuffer = Math.abs(east - west) * bufferFactor;
    const latBuffer = Math.abs(north - south) * bufferFactor;

    const minLon = Math.max(-180.0, west - lonBuffer);
    const maxLon = Math.min(180.0, east + lonBuffer);
    const minLat = Math.max(-85.05112878, south - latBuffer);
    const maxLat = Math.min(85.05112878, north + latBuffer);
    
    const viewExtentForOL = [minLon, minLat, maxLon, maxLat];

    const zoom = TILE_SELECTION_ZOOM;
    const olMapProjection = state.olMap.getView().getProjection();
    let tileRange;

    try {
        const transformedExtentForGrid = ol.proj.transformExtent(viewExtentForOL, 'EPSG:4326', olMapProjection);
        tileRange = selectionTileGrid.getTileRangeForExtentAndZ(transformedExtentForGrid, zoom);
    } catch (e) {
        // console.error("Error calculating tile range for Cesium grid (early def):", e);
        return;
    }

    if (!tileRange) {
        // console.warn("updateCesiumZL21Grid: No tile range calculated. Grid not updated (early def).");
        return;
    }
    
    const MAX_GRID_ENTITIES = 350;
    let currentEntityCount = dataSource.entities.values.length;
    let tilesToProcess = [];

    for (let x = tileRange.minX; x <= tileRange.maxX; x++) {
        for (let y = tileRange.minY; y <= tileRange.maxY; y++) {
            tilesToProcess.push({x: x, y: y});
        }
    }
    
    // Smart clearing: If the number of tiles to draw is very different from current, or exceeds max, clear all.
    // Otherwise, we'd ideally update/remove specific entities (more complex, not done here).
    if (tilesToProcess.length > MAX_GRID_ENTITIES * 1.2 ||
        (tilesToProcess.length === 0 && currentEntityCount > 0) ||
        (currentEntityCount > MAX_GRID_ENTITIES && tilesToProcess.length < currentEntityCount * 0.8) ) {
        dataSource.entities.removeAll();
    }

    let addedCount = 0;
    for (const tile of tilesToProcess) {
        if (dataSource.entities.values.length + addedCount >= MAX_GRID_ENTITIES) break;

        const tileCoord = [zoom, tile.x, tile.y];
        const tileId = `cesium-grid-${zoom}-${tile.x}-${tile.y}`;

        if (!dataSource.entities.getById(tileId)) {
            try {
                const tileOLGeoJsonExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                const tileWGS84Extent = ol.proj.transformExtent(tileOLGeoJsonExtent, olMapProjection, 'EPSG:4326');
                
                const westDeg = tileWGS84Extent[0];
                const southDeg = tileWGS84Extent[1];
                const eastDeg = tileWGS84Extent[2];
                const northDeg = tileWGS84Extent[3];

                if (westDeg < eastDeg && southDeg < northDeg &&
                    westDeg >= -180 && eastDeg <= 180 && southDeg >= -89.99 && northDeg <= 89.99) {
                    
                    dataSource.entities.add({
                        id: tileId,
                        polyline: {
                            positions: Cesium.Cartesian3.fromDegreesArray([
                                westDeg, northDeg, eastDeg, northDeg,
                                eastDeg, southDeg, westDeg, southDeg,
                                westDeg, northDeg
                            ]),
                            width: 0.7,
                            material: Cesium.Color.DIMGRAY.withAlpha(0.55),
                            classificationType: Cesium.ClassificationType.TERRAIN
                        }
                    });
                    addedCount++;
                }
            } catch (e) { /* console.warn(`Error processing tile ${tileCoord} for Cesium (early def): ${e}`); */ }
        }
    }
    // if (addedCount > 0) { console.log(`Cesium grid: Added ${addedCount} new entities. Total: ${dataSource.entities.values.length}`); }
};
// mundial/main.js - Full version with OpenGlobus focus

document.addEventListener('DOMContentLoaded', () => {
// Set Cesium Ion default access token
    if (typeof Cesium !== 'undefined' && Cesium.Ion) {
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YmNlMDhkNS0xZDYxLTQ0ZjktODZmOS0wMjU0ODg1MDVjYzYiLCJpZCI6OTkwMjQsImlhdCI6MTc0NzY3NjgzNX0.5os4B_GmIeUHxxUWlz8UkG7HJjltQodu_6b2HwF9JQ4';
        console.log("CESIUM_ION_TOKEN: Default access token set.");
    } else {
        console.warn("CESIUM_ION_TOKEN: Cesium or Cesium.Ion object not found. Cannot set default access token.");
    }

    // --- AGGRESSIVE DEBUGGING FOR #user-layers-panel ---
    const userLayersPanelDebugTarget = document.getElementById('user-layers-panel');
    if (userLayersPanelDebugTarget) {
        const originalSetProperty = userLayersPanelDebugTarget.style.setProperty;
        userLayersPanelDebugTarget.style.setProperty = function(property, value, priority) {
            if (property === 'top' || property === 'bottom' || property === 'transform' || property === 'height' || property === 'max-height') {
                console.error(`PANEL_DEBUG: #user-layers-panel.style.setProperty CALLED! Property: ${property}, Value: ${value}, Priority: ${priority}`, new Error().stack);
            }
            originalSetProperty.call(this, property, value, priority);
        };

        const originalSetAttribute = userLayersPanelDebugTarget.setAttribute;
        userLayersPanelDebugTarget.setAttribute = function(name, value) {
            if (name.toLowerCase() === 'style') {
                 console.error(`PANEL_DEBUG: #user-layers-panel.setAttribute('style', ...) CALLED! Value: ${value}`, new Error().stack);
            }
            originalSetAttribute.call(this, name, value);
        };
        console.error('PANEL_DEBUG: Attached style modification interceptors to #user-layers-panel.');
    } else {
        console.error('PANEL_DEBUG: #user-layers-panel not found for interceptor attachment.');
    }
    // --- END AGGRESSIVE DEBUGGING ---

    const mapTilerKey = "T82iw5O12y2FVZUGLFIX"; // Placeholder MapTiler API Key
    let gridUpdateTimeoutML; // For debouncing MapLibre grid updates
    // let gridUpdateTimeoutLeaflet; // For debouncing Leaflet grid updates // Commented out

    // --- Settings Panel DOM Elements ---
    const settingStartLonInput = document.getElementById('setting-start-lon');
    const settingStartLatInput = document.getElementById('setting-start-lat');
    const settingStartZoomInput = document.getElementById('setting-start-zoom');
    const settingSetStartLocationBtn = document.getElementById('setting-set-start-location-btn');
    const settingGridVisibleCheckbox = document.getElementById('setting-grid-visible');
    const settingGridWeightInput = document.getElementById('setting-grid-weight');

    // Globe settings buttons
    const settingGlobeEarthBtn = document.getElementById('setting-globe-earth'); // Renamed var and ID
    const settingGlobeMoonBtn = document.getElementById('setting-globe-moon');   // Renamed var and ID
    const settingGlobeMarsBtn = document.getElementById('setting-globe-mars');   // Renamed var and ID
    const settingGlobeMetaverseBtn = document.getElementById('setting-globe-metaverse'); // Renamed var and ID
    const settingGlobeCustomBtn = document.getElementById('setting-globe-custom'); // Renamed var and ID
    const settingGlobeITownsBtn = document.getElementById('setting-globe-itowns'); // Added for iTowns

    // --- Draggable Panels ---
    function makeDraggable(elmnt) {
      console.log(`DRAG_DEBUG: makeDraggable called for panel:`, elmnt.id);
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const dragHandle = elmnt.querySelector('.panel-header') || elmnt.querySelector('h2') || elmnt;
      console.log(`DRAG_DEBUG: dragHandle for ${elmnt.id}:`, dragHandle);

      if (dragHandle) {
        dragHandle.style.cursor = 'move';
        dragHandle.onmousedown = dragMouseDown;
      } else {
        // This case should ideally not happen if panels have headers or are meant to be draggable by body
        console.warn(`DRAG_DEBUG: No .panel-header or h2 found for ${elmnt.id}, making whole element draggable.`);
        elmnt.style.cursor = 'move';
        elmnt.onmousedown = dragMouseDown;
      }

      function dragMouseDown(e) {
        e = e || window.event;
        console.log(`DRAG_DEBUG: dragMouseDown on ${elmnt.id}. Target:`, e.target);

        // Condition 1 (REMOVED): This was preventing drag when clicking on header text like <h4>.
        // const isChildOfDragHandleNotHeaderItself = (e.target !== dragHandle && dragHandle.contains(e.target));
        // if (isChildOfDragHandleNotHeaderItself) {
        //     console.log(`DRAG_DEBUG: Click on child of dragHandle for ${elmnt.id}. Target:`, e.target, " - NOT DRAGGING.");
        //     return;
        // }

        // Condition 2: Click on common interactive element (buttons, inputs, etc.)
        // This should now be the primary check to allow clicks on interactive elements
        // while allowing drags on non-interactive parts of the header or panel body (if header is missing).
        const isInteractiveElement = e.target.closest('button, select, input, a, [onclick], .no-drag');
        if (isInteractiveElement) {
             console.log(`DRAG_DEBUG: Click on interactive element for ${elmnt.id}. Target:`, e.target, " - NOT DRAGGING.");
            return;
        }
        
        console.log(`DRAG_DEBUG: Proceeding with drag for ${elmnt.id}.`);
        e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
      function elementDrag(e) {
        e = e || window.event; e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
        pos3 = e.clientX; pos4 = e.clientY;
        const TOOLBAR_HEIGHT = 50; // Assuming 50px toolbar height
        const newTop = Math.max(TOOLBAR_HEIGHT, Math.min(window.innerHeight - elmnt.offsetHeight, elmnt.offsetTop - pos2));
        const newLeft = Math.max(0, Math.min(window.innerWidth - elmnt.offsetWidth, elmnt.offsetLeft - pos1));
        // elmnt.style.top = newTop + "px"; elmnt.style.left = newLeft + "px";
        elmnt.style.setProperty('top', newTop + "px", 'important');
        elmnt.style.setProperty('left', newLeft + "px", 'important');
        elmnt.style.setProperty('bottom', '', 'important'); // Clear bottom
        elmnt.style.setProperty('right', '', 'important'); // Clear right
        elmnt.style.setProperty('transform', 'none', 'important'); // Ensure no transform interferes after drag starts
      }
      function closeDragElement() {
        document.onmouseup = null; document.onmousemove = null;
      }
    }

    // --- XR Panel Logic ---
// Removed duplicate setupXRPanelLogic function

    // --- UI Element References (from reference code) ---
    const baseLayerSelect = document.getElementById('base-layer-select');
    const mapLibrarySelect = document.getElementById('map-library-select');
    const mapLibreMapContainerElement = document.getElementById('maplibre-map-container');
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
console.log("MODE_BTN_INIT_DEBUG: interactionModeBtn element after getElementById:", interactionModeBtn);
    const masterMapModeBtn = document.getElementById('master-map-mode-btn'); // Added master button
    const selectedTileCountDisplay = document.getElementById('selected-tile-count-display');
    const tilesetDetailsModal = document.getElementById('tileset-details-modal');
    const closeTilesetDetailsModalBtn = document.getElementById('close-tileset-details-modal');
    const detailsTilesetNameInput = document.getElementById('details-tileset-name');
    const detailsTilesetCoordsSpan = document.getElementById('details-tileset-coords');
    // const detailsLocationInfoSpan = document.getElementById('details-location-info'); // Already defined in settings

    let currentInteractionMode = 'pan'; // Initial mode is 'pan'

    // --- Interaction Mode Button Setup ---
    if (interactionModeBtn) {
        console.log("MODE_BTN_DEBUG: Attaching listener to interactionModeBtn (early setup).");
        interactionModeBtn.addEventListener('click', () => {
            console.log("MODE_BTN_DEBUG: interactionModeBtn clicked. Current mode before change:", currentInteractionMode);
            if (currentInteractionMode === 'pan') {
                currentInteractionMode = 'selectTiles';
                if (dragPanInteraction) {
                    dragPanInteraction.setActive(false);
                    console.log("MODE_BTN_DEBUG: dragPanInteraction deactivated.");
                } else { console.warn("MODE_BTN_DEBUG: dragPanInteraction is null/undefined for deactivation."); }
                if (dragBoxInteraction) {
                    dragBoxInteraction.setActive(true);
                    console.log("MODE_BTN_DEBUG: dragBoxInteraction activated.");
                } else { console.warn("MODE_BTN_DEBUG: dragBoxInteraction is null/undefined for activation."); }
            } else { // currentInteractionMode was 'selectTiles'
                currentInteractionMode = 'pan';
                if (dragBoxInteraction) {
                    dragBoxInteraction.setActive(false);
                    console.log("MODE_BTN_DEBUG: dragBoxInteraction deactivated.");
                } else { console.warn("MODE_BTN_DEBUG: dragBoxInteraction is null/undefined for deactivation."); }
                if (dragPanInteraction) {
                    dragPanInteraction.setActive(true);
                    console.log("MODE_BTN_DEBUG: dragPanInteraction activated.");
                } else { console.warn("MODE_BTN_DEBUG: dragPanInteraction is null/undefined for activation."); }
            }
            updateInteractionModeUI(currentInteractionMode); // Update cursor
            console.log("MODE_BTN_DEBUG: New currentInteractionMode:", currentInteractionMode);
        });
        // Set initial OL map cursor based on default mode
        if (state.olMap && state.olMap.getTargetElement()) {
            state.olMap.getTargetElement().style.cursor = (currentInteractionMode === 'selectTiles' || currentInteractionMode === 'boxselect') ? 'crosshair' : 'grab';
        }
        // No longer need to set initial button text here as it's static in HTML
    } else {
        console.warn("interactionModeBtn not found at early setup. Mode switching will not work.");
    }
    // --- End Interaction Mode Button Setup ---
    const detailsTilesetImage = document.getElementById('details-tileset-image');
    const detailsTilesetImageUrlInput = document.getElementById('details-tileset-image-url');
    const detailsTilesetLinkInput = document.getElementById('details-tileset-link');
    const detailsTilesetTagsTextarea = document.getElementById('details-tileset-tags');
    const detailsColorPicker = document.getElementById('details-color-picker');
    const viewTilesetInBabylonBtn = document.getElementById('view-tileset-in-babylon-btn');
const viewTilesetInCesiumBtn = document.getElementById('view-tileset-in-cesium-btn');
    const sceneIframe = document.getElementById('scene-iframe'); // Added in index.html
    // Scene panel and its type buttons
    // const scenePanel = document.getElementById('scene-panel'); // Already defined at line 134
    const sceneType3dtileBtn = document.getElementById('scene-type-3dtile');
    const sceneTypeUsdBtn = document.getElementById('scene-type-usd');
    const sceneTypeI3sBtn = document.getElementById('scene-type-i3s');

    // For OLCesium in map panel
    const olCesiumToggleBtn = document.getElementById('map-view-toggle-btn'); // Renamed for clarity
    const mapLibreToggleBtn = document.getElementById('maplibre-view-toggle-btn');
    const cesiumMapContainer = document.getElementById('cesium-map-container');
    const mapElementForOL = document.getElementById('map'); // Already used, ensure it's consistently referenced
    console.log("DEBUG: olCesiumToggleBtn DOM element:", olCesiumToggleBtn); // Corrected variable name

    // settingsBtn and settingsPanel are already defined

    // Toolbar Buttons & Panels for View Toggling (already mostly handled, ensure all refs exist)
    const socialBtn = document.getElementById('social-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const globeViewBtn = document.getElementById('globe-view-btn');
    const layersBtn = document.getElementById('layers-btn');
    const signInBtn = document.getElementById('signin-btn');
    const profileBtn = document.getElementById('profile-btn');
    const xrViewBtn = document.getElementById('xr-view-btn');
    const sceneBtn = document.getElementById('scene-btn'); // New Scene Button

    const socialPanel = document.getElementById('social-panel');
    const mapPanelOL = document.getElementById('map-panel'); // Renamed to avoid conflict
    const globePanelOG = document.getElementById('globe-panel'); // Renamed
    const layerSwitcherPanelOL = document.getElementById('layer-switcher'); // Renamed
    const profilePanel = document.getElementById('profile-panel');
    const xrPanel = document.getElementById('xr-panel');
    const scenePanel = document.getElementById('scene-panel'); // New Scene Panel

    // Social/Chat Panel Elements
    const chatMessagesDiv = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const usernameInputForChat = document.getElementById('username-input'); // Assumes this ID is for chat username

    // DEBUG: Check Scene Panel related elements immediately after declaration
    console.log("%cSCENE_ELEMENT_CHECK:", "color: purple; font-weight: bold;", {
        sceneType3dtileBtn_Exists: !!sceneType3dtileBtn,
        sceneTypeUsdBtn_Exists: !!sceneTypeUsdBtn,
        sceneTypeI3sBtn_Exists: !!sceneTypeI3sBtn,
        sceneIframe_Exists: !!sceneIframe,
        scenePanel_Exists: !!scenePanel
    });
    // END DEBUG

    // --- Scene Panel Viewer Logic ---
    const sceneTypeThreejsBtn = document.getElementById('scene-type-threejs');
    const sceneViewer3dtile = document.getElementById('scene-viewer-3dtile');
    const sceneViewerUsd = document.getElementById('scene-viewer-usd');
    const sceneViewerI3s = document.getElementById('scene-viewer-i3s');
    const sceneViewerThreejs = document.getElementById('scene-viewer-threejs');

    const sceneTypeButtons = [sceneType3dtileBtn, sceneTypeUsdBtn, sceneTypeI3sBtn, sceneTypeThreejsBtn];
    const sceneViewers = [sceneViewer3dtile, sceneViewerUsd, sceneViewerI3s, sceneViewerThreejs];
    
    const sceneViewerMap = {
        'scene-type-3dtile': sceneViewer3dtile,
        'scene-type-usd': sceneViewerUsd,
        'scene-type-i3s': sceneViewerI3s,
        'scene-type-threejs': sceneViewerThreejs
    };

    sceneTypeButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                // Deactivate all buttons
                sceneTypeButtons.forEach(btn => btn && btn.classList.remove('active'));
                // Activate clicked button
                button.classList.add('active');

                // Hide all viewers
                sceneViewers.forEach(viewer => viewer && (viewer.style.display = 'none'));
                
                // Show corresponding viewer
                const targetViewerId = button.id; // e.g., "scene-type-3dtile"
                const targetViewerElement = sceneViewerMap[targetViewerId];

                if (targetViewerElement) {
                    targetViewerElement.style.display = 'block';
                    console.log(`Switched to scene viewer: ${targetViewerElement.id}`);
                    // TODO: Add logic here to initialize/load content for the specific viewer if needed
                    // For example, if targetViewerElement.id === 'scene-viewer-threejs' and it's the first time, init Three.js
                }
            });
        }
    });

    // Set initial active button and viewer for Scene Panel
    if (sceneType3dtileBtn && sceneViewer3dtile) { // Assuming 3D Tile is default
        sceneType3dtileBtn.classList.add('active');
        // sceneViewer3dtile.style.display = 'block'; // Already set by inline style in HTML
    }
    // --- End Scene Panel Viewer Logic ---

    // Calls to initializeOpenLayersMap() and initializeOpenGlobus() moved to later in the script,
    // after all function definitions are complete.

    // --- Tile Selection & User Layer Core Logic Functions (from reference) ---
function updateInteractionModeUI(mode) { // Now only updates cursor
    console.log(`UPDATE_UI_DEBUG: Called with mode: ${mode} to update cursor. interactionModeBtn exists: ${!!interactionModeBtn}`);
    if (state.olMap && state.olMap.getTargetElement()) {
        state.olMap.getTargetElement().style.cursor = (mode === 'selectTiles' || mode === 'boxselect') ? 'crosshair' : 'grab';
        console.log(`UPDATE_UI_DEBUG: Cursor set for mode: ${mode}`);
    } else {
        console.log(`UPDATE_UI_DEBUG: olMap or target element not ready, cursor not set for mode: ${mode}`);
    }
    // Button text is now static "Pan/Select" in HTML, no longer set here.
    // console.log(`UI updated for interaction mode: ${mode}`); // Original log can be kept or removed
}
    function getTileId(tileCoord) { return `${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}`; }

    function toggleTileSelection(tileCoord) {
        // Ensure selectionSource, selectedLayerId, and userLayers are available (likely initialized in initializeOpenLayersMap)
        if (!state.olMap || !selectionSource || !window.selectedLayerId || !window.userLayers) { // Use state.olMap
             console.warn("toggleTileSelection: OpenLayers map or selection variables not ready.");
             return;
        }
        const tileId = getTileId(tileCoord);
        const existingFeature = selectionSource.getFeatureById(tileId);
        const targetSource = window.userLayers[window.selectedLayerId].layer.getSource();
        const existingFeaturesInLayer = targetSource.getFeatures();
        const isTileSaved = existingFeaturesInLayer.some(f => f.get('tileId') === tileId);

        let selectionChanged = false;
        if (existingFeature) {
            console.log(`toggleTileSelection: Removing feature ${tileId} from selectionSource.`);
            selectionSource.removeFeature(existingFeature);
            selectionChanged = true;
            console.log(`toggleTileSelection: Feature ${tileId} removed. selectionSource count: ${selectionSource.getFeatures().length}`);
        } else if (!isTileSaved) {
            // Clear any existing group selection before selecting an individual tile
            if (window.highlightedGlobeGroupId) {
                console.log(`toggleTileSelection: Clearing group selection ${window.highlightedGlobeGroupId} before individual tile select.`);
                window.highlightedGlobeGroupId = null;
                if (typeof highlightListItem === 'function') {
                    highlightListItem(null); // Clear UI list highlight
                }
                // Remove group features from selectionSource
                const groupFeaturesInSelection = selectionSource.getFeatures().filter(f => f.get('isGroupSelection'));
                groupFeaturesInSelection.forEach(f => selectionSource.removeFeature(f));
                console.log(`toggleTileSelection: Removed ${groupFeaturesInSelection.length} group features from selectionSource.`);
            }

            const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
            const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
            newFeature.setId(tileId);
            newFeature.set('isIndividualSelection', true); // Mark as temporary selection
            selectionSource.addFeature(newFeature);
            selectionChanged = true;
        }
        updateSelectedTileCountDisplay();

        // If the selection changed and the globe layer exists, clear it to force redraw
        if (selectionChanged && window.ogSavedTilesetsLayer && typeof window.ogSavedTilesetsLayer.clear === 'function') {
            window.ogSavedTilesetsLayer.clear();
        } else if (selectionChanged) {
        }
    }

    function addTileToSelection(tileCoord) {
        if (!state.olMap || !selectionSource || !window.selectedLayerId || !window.userLayers) { // Use state.olMap
            console.warn("addTileToSelection: OpenLayers map or selection variables not ready.");
            return;
        }
        const tileId = getTileId(tileCoord);
        const existingSelectionFeature = selectionSource.getFeatureById(tileId);
        if (!existingSelectionFeature) {
            const targetSource = window.userLayers[window.selectedLayerId].layer.getSource();
            const existingFeaturesInLayer = targetSource.getFeatures();
            const isTileSaved = existingFeaturesInLayer.some(f => f.get('tileId') === tileId);
            if (!isTileSaved) {
                const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
                newFeature.setId(tileId);
                newFeature.set('isIndividualSelection', true);
                selectionSource.addFeature(newFeature);
            }
        }
    }
function updateCesiumTerrainProvider(terrainType) {
    if (!olcsMapPanel) {
        console.warn("updateCesiumTerrainProvider: OLCesium panel not initialized. Cannot update terrain.");
        return;
    }
    const scene = olcsMapPanel.getCesiumScene();
    if (!scene) {
        console.error("updateCesiumTerrainProvider: Cesium scene not available. Cannot update terrain.");
        return;
    }

    console.log(`INIT_OLCS: updateCesiumTerrainProvider called with type: '${terrainType}'`);

    // Ensure a base state (Ellipsoid) before attempting to set a new one.
    if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
        scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
        console.log("INIT_OLCS: Terrain provider temporarily reset to Ellipsoid before switching.");
    }

    if (terrainType === 'cesium_ion_ellipsoid') {
        console.log("INIT_OLCS: Setting terrain to 'Cesium Ion / Ellipsoid Fallback'.");
        if (typeof Cesium.createWorldTerrainAsync === 'function') {
            console.log("INIT_OLCS: Cesium.createWorldTerrainAsync found. Attempting to set Cesium World Terrain.");
            Cesium.createWorldTerrainAsync({
                requestWaterMask: true, 
                requestVertexNormals: true 
            }).then(function(terrainProvider) {
                scene.terrainProvider = terrainProvider;
                console.log("INIT_OLCS: Cesium World Terrain successfully set via createWorldTerrainAsync. Provider:", scene.terrainProvider);
            }).catch(function(error) {
                console.error("INIT_OLCS: Error creating Cesium World Terrain with createWorldTerrainAsync:", error);
                console.log("INIT_OLCS: Falling back to EllipsoidTerrainProvider due to createWorldTerrainAsync error.");
                if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                    try {
                        scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                        console.log("INIT_OLCS: Successfully set EllipsoidTerrainProvider as fallback.");
                    } catch (e) {
                         console.error("INIT_OLCS: Error instantiating EllipsoidTerrainProvider as fallback:", e);
                    }
                } else {
                    console.error("INIT_OLCS: EllipsoidTerrainProvider class not available for fallback.");
                }
            });
        } else if (typeof Cesium.createWorldTerrain === 'function') { 
            console.warn("INIT_OLCS: Cesium.createWorldTerrainAsync NOT found. Falling back to synchronous Cesium.createWorldTerrain.");
            try {
                scene.terrainProvider = Cesium.createWorldTerrain({
                     requestWaterMask: true,
                     requestVertexNormals: true
                });
                console.log("INIT_OLCS: Cesium World Terrain set via synchronous createWorldTerrain. Provider:", scene.terrainProvider);
            } catch (error) {
                console.error("INIT_OLCS: Error creating Cesium World Terrain (synchronous):", error);
                if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                   scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                   console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback after sync createWorldTerrain error.");
                }
            }
        } else {
            console.error("INIT_OLCS: Neither Cesium.createWorldTerrainAsync nor Cesium.createWorldTerrain is available.");
            if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                console.log("INIT_OLCS: Set EllipsoidTerrainProvider as a final fallback (no createWorldTerrain methods found).");
            } else {
                 console.error("INIT_OLCS: CRITICAL - EllipsoidTerrainProvider also not available. No terrain can be set.");
            }
        }
    // Removed 'arcgis_elevation' case as it was problematic
    } else if (terrainType === 'arcgis_elevation') {
        console.log("INIT_OLCS: Setting terrain to 'ArcGIS World Elevation'.");
        if (typeof Cesium.ArcGISTiledElevationTerrainProvider === 'function') {
            console.log("INIT_OLCS: Cesium.ArcGISTiledElevationTerrainProvider class found.");
            let arcgisTerrainProviderInstance;
            try {
                const arcGisTerrainUrl = 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer';
                arcgisTerrainProviderInstance = new Cesium.ArcGISTiledElevationTerrainProvider({
                    url: arcGisTerrainUrl
                });
                console.log("INIT_OLCS: ArcGISTiledElevationTerrainProvider instantiated:", arcgisTerrainProviderInstance);

                if (!arcgisTerrainProviderInstance) { // Should not happen if constructor doesn't throw
                    console.error("INIT_OLCS: ArcGISTiledElevationTerrainProvider instantiation returned null/undefined. Falling back.");
                    throw new Error("ArcGIS provider instantiation failed silently.");
                }

                if (arcgisTerrainProviderInstance.ready === true) { // Check synchronous readiness
                    console.log("INIT_OLCS: ArcGIS Terrain Provider is ALREADY READY. Setting directly.");
                    scene.terrainProvider = arcgisTerrainProviderInstance;
                } else if (arcgisTerrainProviderInstance.readyPromise && typeof arcgisTerrainProviderInstance.readyPromise.then === 'function') {
                    console.log("INIT_OLCS: ArcGIS: readyPromise found and is a promise. Waiting...");
                    arcgisTerrainProviderInstance.readyPromise.then(() => {
                        if (arcgisTerrainProviderInstance.ready) {
                            scene.terrainProvider = arcgisTerrainProviderInstance;
                            console.log("INIT_OLCS: ArcGIS Terrain Provider is ready (via promise) and set.");
                        } else {
                            console.error("INIT_OLCS: ArcGIS Terrain Provider readyPromise resolved, but provider not ready. Falling back.");
                            if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                                scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                                console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback (ArcGIS not ready after promise).");
                            }
                        }
                    }).catch(function(error) {
                        console.error("INIT_OLCS: ArcGIS Terrain Provider readyPromise failed:", error);
                        if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                            scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                            console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback after ArcGIS readyPromise error.");
                        }
                    });
                } else {
                    console.error("INIT_OLCS: ArcGIS: readyPromise not valid or provider not ready sync. Falling back. readyPromise type:", typeof arcgisTerrainProviderInstance.readyPromise, "provider.ready:", arcgisTerrainProviderInstance.ready);
                    if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                        scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                        console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback (ArcGIS no valid readyPromise/not ready).");
                    }
                }
            } catch (error) {
                console.error("INIT_OLCS: Error during ArcGISTiledElevationTerrainProvider instantiation or setup:", error);
                if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                    scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                    console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback after ArcGIS instantiation error.");
                }
            }
        } else {
            console.error("INIT_OLCS: Cesium.ArcGISTiledElevationTerrainProvider class is not available. Falling back.");
            if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                console.log("INIT_OLCS: Set EllipsoidTerrainProvider as a final fallback (ArcGIS provider class missing).");
            }
        }
    } else if (terrainType === 'maptiler_terrain') {
        console.log("INIT_OLCS: Setting terrain to 'MapTiler Terrain'.");
        if (typeof Cesium.MapTilerTerrainProvider === 'function') {
            console.log("INIT_OLCS: Cesium.MapTilerTerrainProvider class found.");
            let mapTilerInstance;
            try {
                if (typeof mapTilerKey === 'undefined' || !mapTilerKey) {
                    console.error("INIT_OLCS: mapTilerKey is not defined or empty. Cannot use MapTilerTerrainProvider. Falling back.");
                    throw new Error("MapTiler API key not available for terrain.");
                }
                mapTilerInstance = new Cesium.MapTilerTerrainProvider({
                    url: 'https://api.maptiler.com/tiles/terrain-quantized-mesh-v2/',
                    apiKey: mapTilerKey
                });
                console.log("INIT_OLCS: MapTilerTerrainProvider instantiated:", mapTilerInstance);

                if (!mapTilerInstance) {
                     console.error("INIT_OLCS: MapTilerTerrainProvider instantiation returned null/undefined. Falling back.");
                     throw new Error("MapTiler provider instantiation failed silently.");
                }

                if (mapTilerInstance.ready === true) {
                    console.log("INIT_OLCS: MapTiler Terrain Provider is ALREADY READY. Setting directly.");
                    scene.terrainProvider = mapTilerInstance;
                } else if (mapTilerInstance.readyPromise && typeof mapTilerInstance.readyPromise.then === 'function') {
                    console.log("INIT_OLCS: MapTiler: readyPromise found. Waiting...");
                    mapTilerInstance.readyPromise.then(() => {
                        if (mapTilerInstance.ready) {
                            scene.terrainProvider = mapTilerInstance;
                            console.log("INIT_OLCS: MapTiler Terrain Provider is ready (via promise) and set.");
                        } else {
                            console.error("INIT_OLCS: MapTiler Terrain readyPromise resolved, but provider not ready. Falling back.");
                            if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                                scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                                console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback (MapTiler not ready after promise).");
                            }
                        }
                    }).catch(function(error) {
                        console.error("INIT_OLCS: MapTiler Terrain readyPromise failed:", error);
                        if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                            scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                            console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback after MapTiler readyPromise error.");
                        }
                    });
                } else {
                    console.error("INIT_OLCS: MapTiler: readyPromise not valid or provider not ready sync. Falling back. readyPromise type:", typeof mapTilerInstance.readyPromise, "provider.ready:", mapTilerInstance.ready);
                    if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                        scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                        console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback (MapTiler no valid readyPromise/not ready).");
                    }
                }
            } catch (error) {
                console.error("INIT_OLCS: Error during MapTilerTerrainProvider setup:", error);
                if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                    scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                    console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback after MapTiler error.");
                }
            }
        } else {
            console.error("INIT_OLCS: Cesium.MapTilerTerrainProvider class is not available. Falling back.");
            if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                console.log("INIT_OLCS: Set EllipsoidTerrainProvider as fallback (MapTiler class missing).");
            }
        }
    } else if (terrainType === 'custom_terrain') {
        console.log("INIT_OLCS: 'Custom Terrain URL' selected. This feature is not yet implemented. Defaulting to Ellipsoid.");
        if (typeof Cesium.EllipsoidTerrainProvider === 'function') { // Ensure Ellipsoid if custom not implemented
            scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
            console.log("INIT_OLCS: Set EllipsoidTerrainProvider for custom_terrain placeholder.");
        }
    } else if (terrainType === 'ellipsoid_only') {
        console.log("INIT_OLCS: Setting terrain to 'Ellipsoid Only'.");
        if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
            try {
                scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                console.log("INIT_OLCS: Successfully set scene.terrainProvider to new EllipsoidTerrainProvider.");
            } catch (e) {
                console.error("INIT_OLCS: Error instantiating EllipsoidTerrainProvider for 'ellipsoid_only':", e);
            }
        } else {
            console.error("INIT_OLCS: Cesium.EllipsoidTerrainProvider class is not available. Cannot set any terrain.");
        }
    } else {
        console.warn(`INIT_OLCS: Unknown terrain type: '${terrainType}'. Defaulting to Ellipsoid.`);
        if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
            scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
            console.log("INIT_OLCS: Set EllipsoidTerrainProvider as default for unknown type.");
        }
    }
}
    
    function updateSelectedTileCountDisplay() {
        if (!selectionSource || !selectedTileCountDisplay) return;
        const count = selectionSource.getFeatures().length;
        selectedTileCountDisplay.textContent = `Selected: ${count}`;
        updateSelectionActionsVisibility();
    }

    function updateSelectionActionsVisibility() {
        if (!selectionSource || !selectionActionsDiv || !clearSelectionBtn || !tilesetNameInput || !saveSelectionBtn || !selectedTileCountDisplay) return;
        const hasSelection = selectionSource.getFeatures().length > 0;
        selectionActionsDiv.style.display = hasSelection ? 'block' : 'none';
        clearSelectionBtn.style.display = hasSelection ? 'block' : 'none';
        tilesetNameInput.style.display = hasSelection ? 'block' : 'none';
        selectedTileCountDisplay.style.display = hasSelection ? 'block' : 'none';
    }

    // Event listener for the save selection button
    if (saveSelectionBtn) {
        saveSelectionBtn.addEventListener('click', () => {
            if (!selectionSource || selectionSource.getFeatures().length === 0) {
                alert("No tiles selected to save.");
                return;
            }
            if (!window.selectedLayerId || !window.userLayers[window.selectedLayerId]) {
                alert("No active layer selected to save into.");
                return;
            }
            const name = tilesetNameInput.value.trim();
            if (!name) {
                alert("Please enter a name for the tileset.");
                return;
            }

            const targetLayer = window.userLayers[window.selectedLayerId].layer;
            const targetSource = targetLayer.getSource();
            const clientGeneratedGroupId = `tileset-${Date.now()}`; // Used for client-side if backend fails or for immediate UI
            const selectedFeatures = selectionSource.getFeatures().slice(); // Clone array

            const zl21TileIds = selectedFeatures.map(feature => feature.getId()).filter(id => id); // Get "Z-X-Y" IDs

            if (zl21TileIds.length === 0) {
                alert("No valid tile IDs found in selection.");
                return;
            }

            // Default style properties for the new tileset
            const defaultColor = '#33CCFF';
            const defaultOpacity = 0.6;
            const defaultStrokeWidth = 1;

            const tilesetPayload = {
                name: name,
                zl21TileIds: zl21TileIds,
                metadata: { // Store other relevant details if needed by backend/Kart
                    // The backend will generate the canonical tilesetId (UUID)
                    clientGroupId: clientGeneratedGroupId, // Can be used for reconciliation or logging
                    color: defaultColor,
                    fillOpacity: defaultOpacity,
                    strokeWidth: defaultStrokeWidth,
                    // Add any other details from a future, more complex modal if needed
                }
            };

            // Send data to backend
            fetch('http://localhost:8765/api/kart/tilesets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tilesetPayload),
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || `HTTP error! status: ${response.status}`) });
                }
                return response.json();
            })
            .then(data => {
                console.log('Tileset saved via backend, response:', data);
                alert(`Tileset '${name}' submitted to backend. Kart ID: ${data.tileset?.id}`);

                const finalGroupId = data.tileset?.id || clientGeneratedGroupId; // Prefer backend ID

                // For immediate visual feedback, still add to local OpenLayers source.
                // This might be refactored later to fetch all tilesets from backend.
                selectedFeatures.forEach(feature => {
                    const clonedFeature = feature.clone();
                    clonedFeature.set('tilesetName', name);
                    clonedFeature.set('tilesetGroupId', finalGroupId);
                    clonedFeature.set('isVisible', true);
                    clonedFeature.set('color', defaultColor);
                    clonedFeature.set('fillOpacity', defaultOpacity);
                    clonedFeature.set('strokeWidth', defaultStrokeWidth);
                    clonedFeature.unset('isIndividualSelection');
                    clonedFeature.unset('isGroupSelection');
                    
                    const originalId = feature.getId(); // This is the Z-X-Y tileId
                    clonedFeature.setId(`${finalGroupId}-${originalId || feature.ol_uid}`); // Ensure unique feature ID in OL
                    clonedFeature.set('tileId', originalId); // Store the Z-X-Y tileId explicitly

                    targetSource.addFeature(clonedFeature);
                });
                
                window.userLayers[window.selectedLayerId].tilesetCount = (window.userLayers[window.selectedLayerId].tilesetCount || 0) + 1;

                selectionSource.clear();
                tilesetNameInput.value = '';
                populateTilesetList(window.selectedLayerId);
                updateSelectedTileCountDisplay();
                updateSelectionActionsVisibility();

                if (window.ogSavedTilesetsLayer) {
                    window.ogSavedTilesetsLayer.clear();
                }
                if (state.mapLibreMap) {
                    updateSavedTilesetsMapLibre();
                }
                console.log(`Tileset "${name}" (ID: ${finalGroupId}) added to layer "${window.userLayers[window.selectedLayerId].name}" for local display.`);
            })
            .catch((error) => {
                console.error('Error saving tileset via backend:', error);
                alert(`Failed to save tileset to backend: ${error.message}. Tileset saved locally only.`);
                // Fallback to local-only save if backend fails (original behavior)
                selectedFeatures.forEach(feature => {
                    const clonedFeature = feature.clone();
                    clonedFeature.set('tilesetName', name);
                    clonedFeature.set('tilesetGroupId', clientGeneratedGroupId); // Use client-generated ID
                    clonedFeature.set('isVisible', true);
                    clonedFeature.set('color', defaultColor);
                    clonedFeature.set('fillOpacity', defaultOpacity);
                    clonedFeature.set('strokeWidth', defaultStrokeWidth);
                    clonedFeature.unset('isIndividualSelection');
                    clonedFeature.unset('isGroupSelection');
                    const originalId = feature.getId();
                    clonedFeature.setId(`${clientGeneratedGroupId}-${originalId || feature.ol_uid}`);
                    clonedFeature.set('tileId', originalId);
                    targetSource.addFeature(clonedFeature);
                });
                window.userLayers[window.selectedLayerId].tilesetCount = (window.userLayers[window.selectedLayerId].tilesetCount || 0) + 1;
                selectionSource.clear();
                tilesetNameInput.value = '';
                populateTilesetList(window.selectedLayerId);
                updateSelectedTileCountDisplay();
                updateSelectionActionsVisibility();
                if (window.ogSavedTilesetsLayer) window.ogSavedTilesetsLayer.clear();
                if (state.mapLibreMap) updateSavedTilesetsMapLibre();
            });
        });
    }

    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', () => {
            clearMapSelectionAndDetails();
             if (state.mapLibreMap) {
                // If clearing selection also means clearing a temporary highlight on maplibre
                // For now, updateSavedTilesetsMapLibre might be too broad if it only redraws saved sets.
                // If selectionSource was used for temporary MapLibre features, that source would need clearing.
                // Assuming clearMapSelectionAndDetails handles OL, and ML will update on next full tileset refresh.
            }
        });
    }

function clearMapSelectionAndDetails() {
        if (selectionSource) {
            selectionSource.clear();
        }
        if (tilesetDetailsModal) {
            tilesetDetailsModal.style.display = 'none';
        }
        currentEditingGroupId = null;
window.highlightedGlobeGroupId = null; // Clear globe highlight
        if (window.ogSavedTilesetsLayer) {
            window.ogSavedTilesetsLayer.clear(); // Refresh globe to remove highlight
            // console.log("DEBUG: ogSavedTilesetsLayer cleared by clearMapSelectionAndDetails.");
        }
        if (typeof highlightListItem === 'function') {
            highlightListItem(null); // Clear list highlight
        }
        updateSelectionActionsVisibility(); // Hide/show selection action buttons
        updateSelectedTileCountDisplay(); // Reset tile count display
    }
function loadTestTilesetToLayer0() {
        if (!window.olMap || !layer0Source || !selectionTileGrid) {
            console.error("loadTestTilesetToLayer0: Prerequisites not met (olMap, layer0Source, or selectionTileGrid).");
            return;
        }

        const testTiles = [
            [TILE_SELECTION_ZOOM, 617234, 788670], // User specified tile (top-left)
            [TILE_SELECTION_ZOOM, 617235, 788670], // Top-right
            [TILE_SELECTION_ZOOM, 617234, 788671], // Bottom-left
            [TILE_SELECTION_ZOOM, 617235, 788671]  // Bottom-right
        ];
        // console.log(`Using original 2x2 Test Tileset SoL.`); // Optional log

        const tilesetGroupId = `test-tileset-${Date.now()}`;
        const tilesetName = "Test Tileset SoL"; // Original name
        const featuresToAdd = [];

        testTiles.forEach((tileCoord, index) => {
            const tileId = getTileId(tileCoord); // Uses [z,x,y] from tileCoord
            const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
            const feature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
            
            const featureId = `test-tile-${tilesetGroupId}-${index}`;
            feature.setId(featureId); // Unique ID for the feature itself
            feature.set('tilesetName', tilesetName);
            feature.set('tilesetGroupId', tilesetGroupId);
            feature.set('tileId', tileId); // Store the ZXY tileId string
            feature.set('isVisible', true);
            feature.set('color', '#FF6347'); // Tomato color for test
            feature.set('fillOpacity', 0.7);
            feature.set('strokeWidth', 1);
            featuresToAdd.push(feature);
        });

        if (featuresToAdd.length > 0) {
            layer0Source.addFeatures(featuresToAdd);
            if (window.olMap) { // Ensure map redraws to show new features
                window.olMap.render();
            }
            if (window.userLayers[layer0Id]) {
                window.userLayers[layer0Id].tilesetCount = (window.userLayers[layer0Id].tilesetCount || 0) + 1; // Increment if counting groups
            }
            
            // Store tile data for GLTF export and potentially Babylon.js view
            window.currentTilesetForGLTFExport = testTiles.map(tc => ({ z: tc[0], x: tc[1], y: tc[2] })); // Use testTiles
            // console.log("Updated window.currentTilesetForGLTFExport with Test Tileset SoL:", window.currentTilesetForGLTFExport.length);

            populateTilesetList(layer0Id); // Update UI list for Layer 0

            // Re-assert position of user-layers-panel after its content changes, as a debug measure
            const ulp = document.getElementById('user-layers-panel');
            if (ulp) {
                ulp.style.setProperty('top', '300px', 'important');
                ulp.style.setProperty('bottom', 'auto', 'important');
                console.warn('PANEL_DEBUG_REASSERT: Re-asserted #user-layers-panel top: 300px !important after populateTilesetList.');
            }


            if (state.mapLibreMap) {
                updateSavedTilesetsMapLibre(); // Refresh MapLibre to show the new test tileset
            }

            // Zoom OpenLayers map to the extent of the loaded test tiles
            if (window.olMap && featuresToAdd.length > 0) {
                const extent = ol.extent.createEmpty();
                featuresToAdd.forEach(feature => {
                    ol.extent.extend(extent, feature.getGeometry().getExtent());
                });
                if (!ol.extent.isEmpty(extent)) {
                    window.olMap.getView().fit(extent, {
                        padding: [50, 50, 50, 50], // Add some padding
                        maxZoom: TILE_SELECTION_ZOOM, // Zoom in to ZL21
                        duration: 1000 // Optional animation
                    });
                }
            }
            // Optionally, zoom to this test tileset
            // zoomToTilesetGroup(tilesetGroupId);
            // flyToTilesetGroupInGlobe(tilesetGroupId); // REVERTED: This was causing globe to go black
        }
    }

    // Example: Call this from console to load: loadTestTilesetToLayer0();
    // Or add a temporary button in index.html:
    // <button onclick="loadTestTilesetToLayer0()">Load Test Tileset</button>

    // Placeholder for other UI functions to be added later:
    // populateTilesetList, addLayerToList, selectLayerInList, openTilesetDetailsModal etc.
    // Event listeners for save, clear, mode buttons etc.

    // --- OpenLayers Map Initialization ---

    // Define style functions BEFORE they are needed by initializeOpenLayersMap
    const createTilesetStyle = (feature) => {
        const color = feature.get('color') || '#33CCFF'; // Brighter default: Bright Sky Blue
        const fillOpacity = feature.get('fillOpacity') === undefined ? 0.6 : feature.get('fillOpacity'); // Default fill opacity (more fill)
        const strokeWidth = feature.get('strokeWidth') === undefined ? 0.5 : feature.get('strokeWidth'); // Default stroke width (less stroke)

        // Convert hex color and opacity to rgba for fill
        let r = 0, g = 0, b = 0;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) {
            let c = color.substring(1).split('');
            if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
            c = '0x' + c.join('');
            r = (c >> 16) & 255;
            g = (c >> 8) & 255;
            b = c & 255;
        } else if (color.startsWith('rgba')) { // Handle if color is already rgba (e.g. from picker with alpha)
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
                // If an alpha is in the color string, it's ignored here as fillOpacity is separate
            }
        }
        const fillColorRgba = `rgba(${r},${g},${b},${fillOpacity})`;
        // Use the original color for stroke, but ensure full opacity for the stroke itself
        const strokeColorRgba = color.startsWith('rgba') ? `rgba(${r},${g},${b},1)` : color;

        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: strokeColorRgba,
                width: strokeWidth
            }),
            fill: new ol.style.Fill({
                color: fillColorRgba
            })
        });
    };

    const updateFeatureStyle = (feature) => {
         if (feature.get('isVisible') !== false) {
             feature.setStyle(createTilesetStyle(feature));
         } else {
             feature.setStyle(null); // Hide if not visible
         }
    };

    function initializeOpenLayersMap() {
        console.log("%cDEBUG: initializeOpenLayersMap function ENTERED.", "color: blue; font-weight: bold;");
        if (typeof ol === 'undefined') {
            console.error("%cFATAL ERROR: OpenLayers library (ol) is NOT DEFINED. Cannot initialize map.", "color: red; font-size: 1.2em; font-weight: bold;");
            return;
        }
        if (state.olMap) { // Check state.olMap
            console.warn("%cWARN: state.olMap object already exists. Skipping re-initialization.", "color: yellow; font-weight: bold;");
            // Ensure the existing map is targeted correctly if it lost its target
            const mapContainer = document.getElementById('map');
            if (mapContainer && state.olMap.getTarget() !== mapContainer) {
                console.log("DEBUG: Re-targeting existing state.olMap to 'map' div.");
                state.olMap.setTarget(mapContainer);
            }
// Placeholder for iTowns initialization
function initializeITowns() {
    console.log("ITOWNS_INIT: Placeholder initializeITowns() called.");
    const itownsContainer = document.getElementById('itowns-container');
    if (itownsContainer && !itownsContainer.dataset.initialized) {
        itownsContainer.innerHTML = '<p style="padding:20px; text-align:center; color: #fff; background-color: #444;">iTowns Globe View - Not Yet Implemented</p>';
        // Actual iTowns initialization code would go here:
        // 1. Create a new itowns.View(...)
        // 2. Add layers (Elevation, Color, etc.)
        // ...
        itownsContainer.dataset.initialized = 'true'; // Mark as "initialized"
        console.log("ITOWNS_INIT: iTowns placeholder content set.");
    } else if (itownsContainer && itownsContainer.dataset.initialized) {
        console.log("ITOWNS_INIT: iTowns already 'initialized' (placeholder).");
    } else {
        console.error("ITOWNS_INIT: itowns-container not found.");
    }
}
            if (state.olMap.getTarget()) { // Only update size if it has a target
                 state.olMap.updateSize();
            }
            return;
        }
        try {
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.error("%cFATAL ERROR: 'map' DIV not found in DOM. Cannot initialize OpenLayers map.", "color: red; font-size: 1.2em; font-weight: bold;");
                return;
            }
            console.log("DEBUG: 'map' DIV found:", mapElement);

            state.olMap = new ol.Map({ // Assign to state.olMap
                target: 'map',
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.XYZ({
                            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                            attributions: 'Tiles © Esri',
                            maxZoom: 19
                        }),
                        type: 'base'
                    })
                ],
                view: new ol.View({
                    center: ol.proj.fromLonLat([-74.0445, 40.6892]),
                    zoom: 18,
                    maxZoom: TILE_SELECTION_ZOOM + 1,
                    minZoom: 0
                })
            });
            console.log("%cDEBUG: ol.Map constructor SUCCEEDED. state.olMap object created.", "color: green; font-weight: bold;", state.olMap);

            // ZL21 Grid Setup for OpenLayers
            const gridStyleZ21 = new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 1)', width: 1 }) });
            const gridSourceZ21 = new ol.source.Vector();
            gridLayerZ21 = new ol.layer.Vector({ source: gridSourceZ21, style: gridStyleZ21, title: 'grid-z21', visible: false, zIndex: 1 });
            state.olMap.addLayer(gridLayerZ21); // Use state.olMap
            selectionTileGrid = ol.tilegrid.createXYZ({ maxZoom: TILE_SELECTION_ZOOM });

            // --- Grid and Selection Setup (from reference) ---
            selectionSource = new ol.source.Vector(); // Assign to higher-scoped variable
            const selectionStyle = new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(255, 255, 0, 0.5)' }), // Brighter: Semi-transparent Yellow
                stroke: new ol.style.Stroke({ color: 'rgba(255, 165, 0, 0.9)', width: 1.5 }) // Brighter: Orange stroke
            });
            const groupSelectionStyle = new ol.style.Style({ // For when a saved group is clicked and shown in selection layer
                fill: new ol.style.Fill({ color: 'rgba(0, 255, 255, 0.4)' }), // Slightly more opaque Cyan
                stroke: new ol.style.Stroke({ color: 'rgba(0, 200, 200, 0.9)', width: 1.5 })
            });
            selectionLayer = new ol.layer.Vector({
                source: selectionSource,
                style: function(feature) {
                    // If it's a group selection (highlighting a saved group), use groupSelectionStyle
                    // Otherwise (individual tile selection), use selectionStyle
                    return feature.get('isGroupSelection') ? groupSelectionStyle : selectionStyle;
                },
                title: 'selection',
                zIndex: 3
            });
            const highlightStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 0, 0.8)', width: 4 }),
                fill: new ol.style.Fill({ color: 'rgba(255, 255, 0, 0.2)' }), zIndex: 4
            });
            highlightSource = new ol.source.Vector(); // Assign to higher-scoped variable
            highlightLayer = new ol.layer.Vector({ source: highlightSource, style: highlightStyle, title: 'highlight' }); // Assign to higher-scoped variable
            
            state.olMap.addLayer(selectionLayer); // Use state.olMap
            state.olMap.addLayer(highlightLayer); // Use state.olMap
            console.log("DEBUG: Added selection and highlight layers to OpenLayers map.");

            // --- User Layers Setup (from reference) ---
            // const layer0Id = 'layer-0'; // Now defined at a higher scope
            const layer0Name = 'Layer 0';
            layer0Source = new ol.source.Vector(); // Assign to higher-scoped variable
            // Define a function to create the style based on feature properties
            // MOVED createTilesetStyle and updateFeatureStyle to higher scope (within DOMContentLoaded)

            // Apply the style function to the layer
            layer0Layer = new ol.layer.Vector({
                source: layer0Source,
                style: createTilesetStyle, // Use the function directly
                title: layer0Name,
                zIndex: 1, // Ensure it's above the base map but below selection/highlight
                visible: true
            });
            layer0Layer.set('userLayerName', layer0Name);
            window.userLayers = { [layer0Id]: { name: layer0Name, layer: layer0Layer, tilesetCount: 0, isPublic: true } }; // Attach to window for broader access if needed
            window.selectedLayerId = layer0Id; // Attach to window
            
            state.olMap.addLayer(layer0Layer); // Use state.olMap
            console.log("DEBUG: Added Layer 0 for user tilesets to OpenLayers map.");

            // Attach selectionSource listeners now that it's defined
            if (selectionSource) {
                selectionSource.on('addfeature', updateSelectedTileCountDisplay);
                selectionSource.on('removefeature', updateSelectedTileCountDisplay);
                console.log("DEBUG: Attached feature listeners to selectionSource inside initializeOpenLayersMap.");
            } else {
                console.warn("DEBUG: selectionSource is null, cannot attach feature listeners inside initializeOpenLayersMap.");
            }

            // Force map to re-render if panel was hidden and then shown
            setTimeout(() => {
                if (state.olMap && mapElement.offsetParent !== null) { // Check if panel is visible // Use state.olMap
                    state.olMap.updateSize(); // Use state.olMap
                    console.log("DEBUG: OpenLayers map size updated after a short delay.");
                }
                updateZ21GridOL(); // Initial grid draw
                
                // Add event listeners to update grid when map view changes
                state.olMap.on('moveend', updateZ21GridOL); // Use state.olMap
                state.olMap.on('change:resolution', updateZ21GridOL); // Use state.olMap
                console.log("DEBUG: Added map movement event listeners for grid updates");
            }, 250);

            // --- OpenLayers Map Interactions for Tile Selection (moved inside init) ---
            // Store drag pan interaction in the global variable
            state.olMap.getInteractions().forEach(interaction => { // Use state.olMap
                if (interaction instanceof ol.interaction.DragPan) {
                    dragPanInteraction = interaction;
                }
            });
            if (!dragPanInteraction) {
                console.warn("Could not find default DragPan interaction.");
            }

            const clickSelectHandler = function (evt) {
                console.log(`clickSelectHandler triggered. Current interaction mode: ${currentInteractionMode}`, evt.coordinate);
                // Rest of clickSelectHandler logic... (already present from previous diffs, ensure it uses the higher-scoped selectionSource etc.)
                // For brevity, not repeating the entire function here, but it should be the one defined earlier.
                // Make sure it correctly calls toggleTileSelection and updateSelectedTileCountDisplay
                 if (!state.olMap) return; // Use state.olMap
                const currentZoom = state.olMap.getView().getZoom(); // Use state.olMap
                if (currentZoom < GRID_VISIBILITY_MIN_ZOOM) {
                    clearMapSelectionAndDetails(); return;
                }
                const coordinate = evt.coordinate;
                let clickedSavedFeature = null;
                let clickedGroupId = null;
                const pixel = state.olMap.getEventPixel(evt.originalEvent); // Use state.olMap
                const targetLayer = window.selectedLayerId && window.userLayers ? window.userLayers[window.selectedLayerId]?.layer : null;
                if (targetLayer) {
                    state.olMap.forEachFeatureAtPixel(pixel, (feature, layer) => { // Use state.olMap
                        if (layer === targetLayer) {
                            const groupId = feature.get('tilesetGroupId');
                            if (groupId) {
                                clickedGroupId = groupId; clickedSavedFeature = feature; return true;
                            }
                        } return false;
                    }, { hitTolerance: 3 });
                }
                if (clickedSavedFeature && clickedGroupId) {
                    console.log(`clickSelectHandler: Clicked saved group ${clickedGroupId}. Comparing with currentEditingGroupId ('${currentEditingGroupId}')`);
                    // Check if this group is already selected and detailed
                    if (currentEditingGroupId === clickedGroupId && tilesetDetailsModal.style.display === 'block') {
                        console.log(`clickSelectHandler: Deselecting already active group ${clickedGroupId}`);
                        clearMapSelectionAndDetails(); // This will clear highlightedGlobeGroupId and refresh globe
                        return;
                    }

                    // If not already selected, or if details modal is hidden, proceed to select
                    clearMapSelectionAndDetails(); // Clear previous, including globe highlight
                    window.highlightedGlobeGroupId = clickedGroupId; // Set for globe highlighting
                    console.log(`clickSelectHandler: Set highlightedGlobeGroupId to: ${clickedGroupId}`);

                    const targetSource = window.userLayers[window.selectedLayerId].layer.getSource();
                    const groupFeatures = targetSource.getFeatures().filter(f => f.get('tilesetGroupId') === clickedGroupId);
                    const featuresToAdd = groupFeatures.map(f => {
                        const clone = f.clone();
                        clone.setId(`selection-${f.getId() || f.ol_uid}`);
                        clone.set('originalTileId', f.get('tileId'));
                        clone.set('isGroupSelection', true); return clone;
                    });

                    if (featuresToAdd.length > 0 && selectionSource) {
                        selectionSource.addFeatures(featuresToAdd);
                    }
                    
                    // Note: openTilesetDetailsModal is still commented out globally for black screen debugging
                    if (typeof openTilesetDetailsModal === 'function' && clickedSavedFeature) {
                       openTilesetDetailsModal(clickedSavedFeature);
                    } else {
                        console.log("clickSelectHandler: openTilesetDetailsModal not called (function or feature missing).");
                    }
                    // console.log("clickSelectHandler: SKIPPED openTilesetDetailsModal for debugging black screen."); // Keep this line if you want to skip for now
                    
                    // Note: zoomToTilesetGroup (and its internal flyToTilesetGroupInGlobe) is still globally neutered for black screen debugging
                    zoomToTilesetGroup(clickedGroupId);
                    highlightListItem(clickedGroupId); // Highlight in UI list

                    if (window.ogSavedTilesetsLayer) {
                        window.ogSavedTilesetsLayer.clear(); // Refresh globe for highlight
                        console.log("DEBUG: ogSavedTilesetsLayer cleared after map click group selection.");
                    }
                } else {
                    // This is the path for individual tile selection if no group was clicked
                    if (selectionSource) {
                        const isGroupCurrentlySelected = selectionSource.getFeatures().some(f => f.get('isGroupSelection'));
                        if (isGroupCurrentlySelected) clearMapSelectionAndDetails(); // Clear group selection if selecting individual tile
                    }
                    const tileCoord = selectionTileGrid.getTileCoordForCoordAndZ(coordinate, TILE_SELECTION_ZOOM);
                    if (typeof toggleTileSelection === 'function') {
                        toggleTileSelection(tileCoord); // This handles individual tile add/remove and calls ogSavedTilesetsLayer.clear()
                    } else {
                        console.error("clickSelectHandler: toggleTileSelection function is not defined!");
                    }
                }
                updateSelectedTileCountDisplay();
            };

            // Use the global dragBoxInteraction variable instead of creating a local one
            dragBoxInteraction = new ol.interaction.DragBox({
                condition: function(mapBrowserEvent) {
                    // This allows normal left-click drag, but you could modify to require a specific key
                    return ol.events.condition.primaryAction(mapBrowserEvent);
                }
            });
            state.olMap.addInteraction(dragBoxInteraction); // Use state.olMap
            dragBoxInteraction.setActive(false); // Will be activated by mode button
            if (dragPanInteraction) {
                dragPanInteraction.setActive(true); // Pan is default
            }
            
            // Track shift key state for multiple selections
            let isShiftKeyPressed = false;
            
            // Handle box start - clear selection unless shift key is pressed
            dragBoxInteraction.on('boxstart', function(event) {
                console.log("DragBox started.");
                if (!window.olMap || !selectionSource) return;
                
                // Check if shift key is pressed during drag start
                isShiftKeyPressed = ol.events.condition.shiftKeyOnly(event.mapBrowserEvent);
                console.log("Shift key pressed:", isShiftKeyPressed);
                
                // If shift key is not pressed, clear the existing selection
                // If shift key is pressed, keep the selection to add to it
                if (!isShiftKeyPressed) {
                    const isGroupCurrentlySelected = selectionSource.getFeatures().some(f => f.get('isGroupSelection'));
                    if (isGroupCurrentlySelected || selectionSource.getFeatures().length > 0) {
                        console.log("Clearing previous selection since shift key is not pressed.");
                        clearMapSelectionAndDetails();
                    }
                }
            });

            dragBoxInteraction.on('boxend', function() {
                console.log("DragBox ended.");
                const boxExtent = dragBoxInteraction.getGeometry().getExtent();
                if (!state.olMap || !selectionSource || !selectionTileGrid || !window.userLayers || !window.selectedLayerId) { // Check state.olMap
                    console.warn("DRAGBOX_BOXEND: Missing critical components, aborting.");
                    return;
                }
                
                // Don't clear selection here, it's already handled in boxstart
                const targetLayerId = window.selectedLayerId;
                console.log(`DRAGBOX_BOXEND: targetLayerId = ${targetLayerId}`);
                if (!window.userLayers[targetLayerId] || !window.userLayers[targetLayerId].layer) {
                    console.error(`DRAGBOX_BOXEND: window.userLayers[${targetLayerId}] or its layer is undefined.`);
                    return;
                }
                const targetSource = window.userLayers[targetLayerId].layer.getSource();
                if (!targetSource) {
                    console.error(`DRAGBOX_BOXEND: targetSource for layer ${targetLayerId} is undefined.`);
                    return;
                }
                const featuresInTargetLayer = targetSource.getFeatures();
                console.log(`DRAGBOX_BOXEND: Number of features in targetSource for ${targetLayerId}: ${featuresInTargetLayer.length}`);
                const existingTileIdsInLayer = new Set(featuresInTargetLayer.map(f => f.get('tileId')).filter(id => id));
                console.log(`DRAGBOX_BOXEND: Size of existingTileIdsInLayer for ${targetLayerId}: ${existingTileIdsInLayer.size}`);
                
                let tilesAdded = 0;
                selectionTileGrid.forEachTileCoord(boxExtent, TILE_SELECTION_ZOOM, function (tileCoord) {
                    const tileId = getTileId(tileCoord);
document.addEventListener('keydown', function(event) {
        // Toggle interaction mode with Ctrl key (ensure no other modifiers like Alt or Shift are pressed with it)
        if (event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            // Check for common input fields to avoid interference
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
                return; // Don't interfere with typing in inputs
            }

            event.preventDefault(); // Prevent default Ctrl key actions if any
            if (interactionModeBtn) {
                console.log("CTRL_KEY_DEBUG: Ctrl key pressed, simulating click on interactionModeBtn.");
                interactionModeBtn.click(); // Simulate a click on the button
            }
        }
    });
                    console.log(`DRAGBOX_BOXEND: Iterating for tileCoord: ${tileCoord}, tileId: ${tileId}`);
                    if (!existingTileIdsInLayer.has(tileId)) { // Only add if not already in the saved layer
                        console.log(`DRAGBOX_BOXEND: Tile ${tileId} not in saved layer, calling addTileToSelection.`);
                        addTileToSelection(tileCoord); // This function adds to selectionSource
                        tilesAdded++;
                    } else {
                        console.log(`DRAGBOX_BOXEND: Tile ${tileId} already in saved layer, skipping.`);
                    }
                });
                
                console.log(`Added ${tilesAdded} tiles to selection.`);
                updateSelectedTileCountDisplay();
            });
 
            // --- COMMENTED OUT: OpenLayers control for the Maps Menu (#layer-switcher) ---
            // This code was preventing draggability of the Maps menu panel by moving it
            // into the OpenLayers control container and changing its display settings.
            //
            // const layerSwitcherPanel = document.getElementById('layer-switcher');
            // const customControlsContainer = document.getElementById('ol-map-custom-controls-top-right');
            // console.log("ROO_DEBUG_OL_CTRL_CHECK: Checking prerequisites. layerSwitcherPanel:", layerSwitcherPanel, "customControlsContainer:", customControlsContainer, "state.olMap:", !!state.olMap);
            // if (layerSwitcherPanel && customControlsContainer && state.olMap) {
            //     console.log("DEBUG_VISIBILITY: Inside customControlsContainer check. Attempting to add test div.");
            //     const testDiv = document.createElement('div');
            //     testDiv.style.width = '20px';
            //     testDiv.style.height = '20px';
            //     testDiv.style.backgroundColor = 'blue';
            //     testDiv.style.position = 'absolute';
            //     testDiv.style.top = '5px';
            //     testDiv.style.left = '5px';
            //     testDiv.style.zIndex = '99999';
            //     testDiv.innerHTML = 'T';
            //     if (customControlsContainer) {
            //         customControlsContainer.appendChild(testDiv);
            //         console.log("DEBUG_VISIBILITY: Test div appended to customControlsContainer.", customControlsContainer);
            //     } else {
            //         console.error("DEBUG_VISIBILITY: customControlsContainer is null, cannot append test div.");
            //     }
            
            //     // Initially hide the main layerSwitcherPanel and ensure it's styled for popup behavior.
            //     layerSwitcherPanel.style.display = 'none';
            //     layerSwitcherPanel.classList.add('ol-maps-menu-popup');
                
            //     // Move panel to custom controls container
            //     if (layerSwitcherPanel.parentNode !== customControlsContainer) {
            //         customControlsContainer.appendChild(layerSwitcherPanel);
            //         console.log("DEBUG: #layer-switcher panel explicitly moved into custom controls container.");
            //     }
            // } else {
            //     console.warn("DEBUG: Could not create Maps Menu OL control. Prerequisites missing:",
            //         {panel: !!layerSwitcherPanel, container: !!customControlsContainer, map: !!state.olMap});
            // }
            // --- End commented out Maps Menu control ---

            state.olMap.on('singleclick', clickSelectHandler); // Use state.olMap
            console.log("DEBUG: OpenLayers map interactions (click, dragbox) initialized and attached.");
            // --- End OpenLayers Map Interactions ---

        } catch (e) {
            console.error("%cFATAL ERROR during OpenLayers map initialization:", "color: red; font-size: 1.2em; font-weight: bold;", e);
            window.olMap = null;
        }
    }
    console.log("DEBUG: initializeOpenLayersMap function defined.");

    // Initialize UI Interaction Mode toggle
    // Add keyboard shortcut for interaction mode toggle (B key)
    // Add keyboard shortcuts for interaction mode toggle
    document.addEventListener('keydown', function(event) {
        // Toggle mode with either 'B' key or Ctrl key
        if (event.key === 'b' || event.key === 'B' || event.ctrlKey) {
            if (interactionModeBtn && window.olMap) {
                interactionModeBtn.click(); // Simulate button click to toggle mode
                console.log("Mode toggled via keyboard: " + (event.ctrlKey ? "Ctrl key" : "B key"));
            }
        }
    });
    
    // Update cursor and button state based on mode
    function updateInteractionModeUI(mode) {
        if (!window.olMap) return; // This function primarily affects OpenLayers map UI
        const mapElement = document.getElementById('map');

        if (mode === 'boxselect') {
            if (interactionModeBtn) {
                interactionModeBtn.textContent = 'Mode: Box Select';
                interactionModeBtn.title = 'Click to switch to Pan mode. Drag to select an area. (Shortcut: B)';
                interactionModeBtn.classList.add('active'); // Visually indicate selection mode is active
            }
            if (mapElement) mapElement.style.cursor = 'crosshair';
            console.log("UI updated to: Box Select Mode");
        } else { // mode === 'pan'
            if (interactionModeBtn) {
                interactionModeBtn.textContent = 'Mode: Pan Map';
                interactionModeBtn.title = 'Click to switch to Box Select mode. Drag to pan. Click to select points. (Shortcut: B)';
                interactionModeBtn.classList.remove('active'); // Default state
            }
            if (mapElement) mapElement.style.cursor = 'grab';
            console.log("UI updated to: Pan Map Mode");
        }
    }

// --- XR Panel Logic ---
function setupXRPanelLogic() {
    console.log("DEBUG: setupXRPanelLogic called.");
    setTimeout(() => {
        const xrIframe = document.getElementById('xr-iframe');
        const xrEngineSelector = document.getElementById('xr-engine-selector');
        console.log("%cDEBUG (deferred): xrIframe element:", "color: purple", xrIframe);
        console.log("%cDEBUG (deferred): xrEngineSelector element:", "color: purple", xrEngineSelector);

        if (xrEngineSelector && xrIframe) {
            xrEngineSelector.addEventListener('click', (event) => {
                if (event.target.classList.contains('xr-engine-btn')) {
                    const engineButtons = xrEngineSelector.querySelectorAll('.xr-engine-btn');
                    engineButtons.forEach(btn => btn.classList.remove('active'));
                    event.target.classList.add('active');

                    const engine = event.target.dataset.engine;
                    let targetUrl = '';
                    console.log(`XR Engine selected: ${engine}`);

                    switch (engine) {
                        case 'janusweb':
                            targetUrl = 'xr_janus_wrapper.html'; // Load our wrapper
                            break;
                        case 'janusweb-preload':
                            targetUrl = '/mundial/january.html';
                            break;
                        case 'janusweb-fixed':
                            targetUrl = '/mundial/january-fixed.html';
                            break;
                        case 'babylonjs':
                            targetUrl = '/mundial/babylon_maplibre.html';
                            // alert("BabylonJS view not yet implemented."); // Alert removed
                            
                            // Add listener to send data after iframe loads
                            if (xrIframe) {
                                const sendDataToBabylonIframe = () => {
                                    if (xrIframe.contentWindow) {
                                        let initialView = null;
                                        if (window.olMap && window.olMap.getView()) {
                                            const view = window.olMap.getView();
                                            const center = ol.proj.toLonLat(view.getCenter()); // Convert to LonLat
                                            initialView = {
                                                center: center, // [lon, lat]
                                                zoom: view.getZoom()
                                            };
                                        }

                                        xrIframe.contentWindow.postMessage({
                                            type: 'initialSetup',
                                            tilesetData: window.currentTilesetForBabylon, // May be undefined if test tileset not loaded
                                            mapView: initialView
                                        }, '*'); // Consider a specific target origin for security in production
                                        console.log("Sent initialSetup data (tileset, mapView) to babylon_maplibre.html iframe.");
                                    } else {
                                        console.warn("Babylon iframe contentWindow not available to post message.");
                                    }
                                    xrIframe.removeEventListener('load', sendDataToBabylonIframe); // Clean up listener
                                };
                                xrIframe.addEventListener('load', sendDataToBabylonIframe);
                            }
                            break;
                        case 'aframe':
                            targetUrl = 'packages/aframe-vrmap/index.html';
                            console.log("A-Frame vrmap selected.");
                            break;
                        case 'thirdroom':
                            // For now, point to a placeholder or the Third Room project URL if it can be iframed.
                            // Actual integration will require passing Matrix room details, user tokens, etc.
                            // This might involve a wrapper HTML page similar to xr_janus_wrapper.html
                            // or direct embedding if Third Room supports it and can be configured via URL params/postMessage.
                            targetUrl = 'packages/thirdroom/index.html'; // Corrected path relative to mundial/index.html
                            // targetUrl = 'https://thirdroom.io/world/some-default-room'; // Example if pointing to a hosted instance
                            console.log("Third Room selected. Integration is a placeholder. Will require Matrix server and client setup.");
                            // xrIframe.contentWindow.postMessage({ type: 'configureThirdRoom', matrixServer: '...', roomAlias: '...' }, '*');
                            break;
                        // 'irengine' case has been removed.
                        default:
                            console.error(`Unknown XR engine: ${engine}`);
                            if(xrIframe) xrIframe.src='about:blank';
                            return;
                        case 'webxr':
                            targetUrl = 'packages/spatial-webxr/index.html';
                            console.log("Spatial WebXR selected.");
                            break;
                    }
                    if (targetUrl && xrIframe) {
                        console.log(`Setting XR iframe src to: ${targetUrl}`);
                        xrIframe.src = targetUrl;
                        xrIframe.dataset.currentEngine = engine; // Store current engine
                    }
                }
            });
        } else {
            console.error("XR panel elements (xr-engine-selector or xr-iframe) not found (deferred).");
        }
    }, 0); // setTimeout to ensure DOM elements are likely available
}
    if (interactionModeBtn) {
        // Set initial mode to 'pan' and update UI accordingly
        currentInteractionMode = 'pan';
        updateInteractionModeUI(currentInteractionMode);
        // Ensure initial OpenLayers interaction states match:
        // This should be handled in initializeOpenLayersMap: dragPan active, dragBox inactive.

        interactionModeBtn.addEventListener('click', function() {
            if (!window.olMap) return;
            
            if (currentInteractionMode === 'pan') {
                // Switch to Box Select mode
                currentInteractionMode = 'boxselect';
                if (dragPanInteraction) dragPanInteraction.setActive(false);
                if (dragBoxInteraction) dragBoxInteraction.setActive(true);
                console.log("Switched to Box Select mode (dragPan: off, dragBox: on)");
            } else { // currentInteractionMode was 'boxselect'
                // Switch to Pan mode
                currentInteractionMode = 'pan';
                if (dragBoxInteraction) dragBoxInteraction.setActive(false);
                if (dragPanInteraction) dragPanInteraction.setActive(true);
                console.log("Switched to Pan Map mode (dragPan: on, dragBox: off)");
            }
            
            updateInteractionModeUI(currentInteractionMode);
        });
    }
    // Attach boxend event handler for dragBoxInteraction
    if (dragBoxInteraction) { // Ensure dragBoxInteraction is initialized
        dragBoxInteraction.on('boxend', function() {
            console.log("DragBox ENDED - processing selected tiles in box area");

            if (!window.olMap || !selectionSource || !selectionTileGrid || !window.userLayers || !window.selectedLayerId || !dragBoxInteraction.getGeometry()) {
                console.warn("boxend: Missing critical components or geometry, aborting.");
                return;
            }
            const boxExtent = dragBoxInteraction.getGeometry().getExtent(); // Define boxExtent here

            // Logic for clearing previous group selection (inspired by reference code)
            // const isGroupCurrentlySelected = selectionSource.getFeatures().some(f => f.get('isGroupSelection'));
            // if (isGroupCurrentlySelected) {
            //     console.log("DragBox: Clearing previously selected group.");
            //     selectionSource.clear();
            //     // The following line was at the original position 477, commented out.
            //     // if (typeof highlightListItem === 'function') highlightListItem(null);
            // }
            
            const targetLayerId = window.selectedLayerId;
            // Add checks for targetLayerId and related objects
            if (!targetLayerId || !window.userLayers || !window.userLayers[targetLayerId] || !window.userLayers[targetLayerId].layer) {
                console.warn("boxend: targetLayerId or user layer is invalid for selection.");
                return;
            }
            const targetSource = window.userLayers[targetLayerId].layer.getSource();
            if (!targetSource) {
                console.warn("boxend: targetSource is invalid for selection.");
                return;
            }

            const existingFeaturesInLayer = targetSource.getFeatures();
            const existingTileIdsInLayer = new Set(existingFeaturesInLayer.map(f => f.get('tileId')).filter(id => id));

            selectionTileGrid.forEachTileCoord(boxExtent, TILE_SELECTION_ZOOM, function (tileCoord) {
                const tileId = `${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}`; // Simplified getTileId
                if (!existingTileIdsInLayer.has(tileId)) {
                    addTileToSelection(tileCoord);
                }
            });
            updateSelectedTileCountDisplay();
        });
    }

    if (window.olMap) {
        window.olMap.on('singleclick', clickSelectHandler);
    }

    // Make sure dragBoxInteraction is properly added to the map
    if (window.olMap && dragBoxInteraction) {
        // Remove it first in case it was already added
        window.olMap.removeInteraction(dragBoxInteraction);
        // Add it back
        window.olMap.addInteraction(dragBoxInteraction);
        console.log("Re-added dragBoxInteraction to ensure it's properly attached to the map");
    }

    // --- Event Listeners for Core Selection Action Buttons (from reference) ---
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', () => {
            clearMapSelectionAndDetails();
            console.log("Selection cleared via button.");
        });
    } else {
        console.warn("DEBUG: clearSelectionBtn not found, event listener not attached.");
    }

    // Second event listener for interactionModeBtn was removed to avoid conflicts

    // --- User Layer and Tileset List Management (from reference) ---
    let layerCounter = 1; // For naming new layers, ensure this is defined in a scope accessible by createLayerBtn
    let currentEditingGroupId = null; // For tileset details modal context

    function addLayerToList(layerId, layerName, isVisible) {
        if (!userLayerList) { console.warn("addLayerToList: userLayerList element not found."); return; }
        const itemDiv = document.createElement('div'); itemDiv.classList.add('layer-item'); itemDiv.dataset.layerId = layerId;
        const visibilityBtn = document.createElement('button');
        visibilityBtn.classList.add('visibility-btn', 'settings-btn-small');
        visibilityBtn.innerHTML = isVisible ? '👁️' : '👁️‍🗨️';
        visibilityBtn.title = `Toggle visibility of "${layerName}"`;
        const selectionIndicator = document.createElement('span');
        selectionIndicator.classList.add('selection-indicator');
        selectionIndicator.style.display = 'inline-block';
        selectionIndicator.style.width = '1.2em';
        selectionIndicator.style.textAlign = 'center';
        selectionIndicator.innerHTML = '';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = layerName;
        nameSpan.title = `Select layer "${layerName}"`;
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.flexGrow = '1';
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container'); // This will hold all action buttons

        // Visibility button is always present
        buttonContainer.appendChild(visibilityBtn);

        if (layerId !== layer0Id) { // Only add edit, privacy, delete for non-Layer0
            const editBtn = document.createElement('button'); editBtn.innerHTML = '✏️'; editBtn.classList.add('settings-btn-small'); editBtn.title = `Edit name for "${layerName}"`;
            const privacyBtn = document.createElement('button');
            privacyBtn.classList.add('settings-btn-small');
            const layerData = window.userLayers[layerId];
            // Default to private if isPublic is not explicitly defined (for safety, though new layers get it)
            const isPublic = layerData ? layerData.isPublic : false;

            if (isPublic) {
                privacyBtn.innerHTML = '🌐'; // Public icon
                privacyBtn.title = `Toggle privacy for "${layerName}" (Current: Public)`;
            } else {
                privacyBtn.innerHTML = '🔒'; // Private icon
                privacyBtn.title = `Toggle privacy for "${layerName}" (Current: Private)`;
            }
            const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '🗑️'; deleteBtn.classList.add('settings-btn-small'); deleteBtn.title = `Delete layer "${layerName}"`;
            
            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(privacyBtn);
            buttonContainer.appendChild(deleteBtn);
        }
        
        // New order of appending
        itemDiv.appendChild(selectionIndicator); // Indicator on the left
        itemDiv.appendChild(nameSpan);           // Name next
        itemDiv.appendChild(buttonContainer);    // All action buttons on the right
        const initialMsg = userLayerList.querySelector('small'); if (initialMsg) initialMsg.remove();
        userLayerList.appendChild(itemDiv);
    }

    function selectLayerInList(layerId) {
        if (!userLayerList || !window.userLayers || !window.olMap) {
            console.warn("selectLayerInList: Prerequisites not met (userLayerList, userLayers, or olMap).");
            return;
        }

        // Handle previously selected layer
        if (window.selectedLayerId && window.userLayers[window.selectedLayerId]) {
            const prevLayerData = window.userLayers[window.selectedLayerId];
            if (prevLayerData.layer) {
                prevLayerData.layer.setVisible(false); // Hide previous OL layer
            }
            const prevListItem = userLayerList.querySelector(`.layer-item[data-layer-id="${window.selectedLayerId}"]`);
            if (prevListItem) {
                const prevIndicator = prevListItem.querySelector('.selection-indicator');
                if (prevIndicator) prevIndicator.innerHTML = ''; // Clear selection indicator
                const prevVisibilityBtn = prevListItem.querySelector('.visibility-btn');
                if (prevVisibilityBtn) prevVisibilityBtn.innerHTML = '👁️‍🗨️'; // Update to hidden icon
            }
        }

        // Handle newly selected layer
        const newLayerData = window.userLayers[layerId];
        if (newLayerData && newLayerData.layer) {
            newLayerData.layer.setVisible(true); // Show new OL layer
            const newListItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
            if (newListItem) {
                const newIndicator = newListItem.querySelector('.selection-indicator');
                if (newIndicator) newIndicator.innerHTML = '✔️'; // Set selection indicator
                const newVisibilityBtn = newListItem.querySelector('.visibility-btn');
                if (newVisibilityBtn) newVisibilityBtn.innerHTML = '👁️'; // Update to visible icon
            }
        } else {
            console.warn(`selectLayerInList: New layer data or OL layer not found for ID ${layerId}`);
        }
        
        window.selectedLayerId = layerId; // Update the global selected layer ID
        populateTilesetList(layerId); // Populate tilesets for the new layer
        console.log(`Selected layer: ${layerId}. Visibility updated.`);
if (window.ogSavedTilesetsLayer) {
            window.ogSavedTilesetsLayer.clear(); // Force redraw of the globe layer
            console.log("DEBUG: ogSavedTilesetsLayer cleared after selecting new layer.");
        }
    }
    
    function editLayerName(layerId, nameSpanElement) {
        if (!window.userLayers || !window.userLayers[layerId]) return;
        const currentName = window.userLayers[layerId]?.name || '';
        const newName = prompt(`Enter new name for layer "${currentName}":`, currentName);
        if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
            const trimmedName = newName.trim(); window.userLayers[layerId].name = trimmedName; nameSpanElement.textContent = trimmedName;
            const listItem = nameSpanElement.closest('.layer-item');
            if (listItem) {
                listItem.querySelectorAll('button').forEach(btn => {
                    if (btn.title.includes('Edit name')) btn.title = `Edit name for "${trimmedName}"`;
                    if (btn.title.includes('Toggle privacy')) btn.title = btn.title.replace(/"(.*?)"/, `"${trimmedName}"`);
                    if (btn.title.includes('Delete layer')) btn.title = `Delete layer "${trimmedName}"`;
                });
                 const visibilityBtn = listItem.querySelector('.visibility-btn'); if (visibilityBtn) visibilityBtn.title = `Toggle visibility of "${trimmedName}"`;
                 nameSpanElement.title = `Select layer "${trimmedName}"`;
            }
        }
    }

    function toggleLayerPrivacy(layerId, buttonElement) {
        const layerData = window.userLayers?.[layerId];
        if (!layerData) return;

        const layerName = layerData.name || 'this layer';
        // Current state is from the data model, default to false (private) if undefined
        const currentIsPublic = layerData.isPublic === undefined ? false : layerData.isPublic;
        const newIsPublic = !currentIsPublic; // Toggle the state
        const newPrivacyText = newIsPublic ? 'Public' : 'Private';
        const newIcon = newIsPublic ? '🌐' : '🔒';

        if (confirm(`Change privacy for layer "${layerName}" to ${newPrivacyText}?`)) {
            layerData.isPublic = newIsPublic; // Update the data model
            buttonElement.innerHTML = newIcon;
            buttonElement.title = `Toggle privacy for "${layerName}" (Current: ${newPrivacyText})`;
            console.log(`Layer ${layerId} privacy set to ${newPrivacyText}`);
        }
    }

    function deleteLayer(layerId) {
        const layer0Id = 'layer-0'; // Ensure layer0Id is accessible
        if (layerId === layer0Id) { alert("Cannot delete the default layer."); return; }
        if (!window.userLayers || !window.userLayers[layerId] || !window.olMap) return;
        const layerInfo = window.userLayers[layerId];
        const layerName = layerInfo.name || 'Unnamed Layer';
        if (confirm(`Are you sure you want to delete layer "${layerName}" and all its tilesets? This cannot be undone.`)) {
            window.olMap.removeLayer(layerInfo.layer); delete window.userLayers[layerId];
            const listItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`); if (listItem) listItem.remove();
            if (window.selectedLayerId === layerId) { selectLayerInList(layer0Id); }
            if (userLayerList.children.length === 0) { userLayerList.innerHTML = '<small><i>No layers created yet.</i></small>'; }
            if (state.mapLibreMap) updateSavedTilesetsMapLibre(); // Update MapLibre view
        }
    }

    if (userLayerList) {
        userLayerList.addEventListener('click', (event) => {
            const target = event.target;
            const itemDiv = target.closest('.layer-item'); if (!itemDiv) return;
            const layerId = itemDiv.dataset.layerId; if (!layerId || !window.userLayers || !window.userLayers[layerId]) return;
            if (target.classList.contains('visibility-btn')) {
                const layer = window.userLayers[layerId].layer;
                const isCurrentlyVisible = layer.getVisible();
                layer.setVisible(!isCurrentlyVisible);
                target.innerHTML = !isCurrentlyVisible ? '👁️' : '👁️‍🗨️';
                if (state.mapLibreMap) updateSavedTilesetsMapLibre(); // Update MapLibre view
            } else if (target.tagName === 'SPAN' && target.closest('.layer-item') === itemDiv) {
                selectLayerInList(layerId);
            } else if (target.innerHTML === '✏️') {
                editLayerName(layerId, itemDiv.querySelector('span'));
            } else if (target.innerHTML === '🌐' || target.innerHTML === '🔒') {
                toggleLayerPrivacy(layerId, target);
            } else if (target.innerHTML === '🗑️') {
                deleteLayer(layerId);
            }
        });
    } else {
        console.warn("DEBUG: userLayerList not found, event listener not attached.");
    }

    if (createLayerBtn) {
        createLayerBtn.addEventListener('click', () => {
            console.log("DEBUG: createLayerBtn clicked. layerCounter:", layerCounter);
            const newLayerName = prompt("Enter name for new layer:", `Layer ${layerCounter}`);
            console.log("DEBUG: newLayerName from prompt:", newLayerName);

            if (newLayerName && newLayerName.trim() !== '' && window.olMap) {
                console.log("DEBUG: Conditions met to create new layer.");
                const trimmedName = newLayerName.trim();
                const newLayerId = `layer-${layerCounter++}`;
                console.log(`DEBUG: Creating layer: ID='${newLayerId}', Name='${trimmedName}'`);
                
                const newSource = new ol.source.Vector();
                const newLayer = new ol.layer.Vector({
                    source: newSource,
                    style: createTilesetStyle,
                    title: newLayerId,
                    zIndex: 2,
                    visible: true
                });
                newLayer.set('userLayerName', trimmedName);
                window.userLayers[newLayerId] = {
                    name: trimmedName,
                    layer: newLayer,
                    tilesetCount: 0,
                    isPublic: false // Default to private
                };
                window.olMap.addLayer(newLayer);
                console.log("DEBUG: New layer added to map and userLayers object.");

                addLayerToList(newLayerId, trimmedName, true);
                selectLayerInList(newLayerId);
                console.log("DEBUG: addLayerToList and selectLayerInList called for new layer.");
            } else {
                console.warn("DEBUG: Conditions NOT met to create new layer.", {
                    newLayerName: newLayerName,
                    trimmed: newLayerName ? newLayerName.trim() : null,
                    olMapExists: !!window.olMap
                });
            }
        });
    } else {
        console.warn("DEBUG: createLayerBtn not found, event listener not attached.");
    }
    
    function populateTilesetList(layerId) {
        state.populateListCallCounter++;
        console.log(`%cPOPULATE TILESET LIST #${state.populateListCallCounter} for layerId: ${layerId}`, "color: blue; font-weight: bold;");
        if (!tilesetListDiv || !window.userLayers || !window.userLayers[layerId]) {
            if(tilesetListDiv) tilesetListDiv.innerHTML = '<small><i>Invalid layer or no layer selected.</i></small>';
            console.warn("populateTilesetList: Prerequisites not met or invalid layerId.");
            return;
        }
        tilesetListDiv.innerHTML = ''; // Clear current list

        const layerInfo = window.userLayers[layerId];
        const source = layerInfo.layer.getSource();
        const features = source.getFeatures();
        console.log(`populateTilesetList: Found ${features.length} raw features in layer ${layerId}.`);
        
        const groupedTilesets = {};
        // First, group features by their tilesetGroupId
        features.forEach(feature => {
            const groupId = feature.get('tilesetGroupId');
            const name = feature.get('tilesetName') || 'Unnamed Tileset';
            if (groupId) { // Only process features that are part of a tileset group
                if (!groupedTilesets[groupId]) {
                    groupedTilesets[groupId] = {
                        name: name,
                        features: [],
                        // Determine visibility: if any feature in group is visible, group is visible. Default true.
                        isVisible: feature.get('isVisible') !== false,
                        color: feature.get('color') // Take color from first feature encountered for the group
                    };
                }
                groupedTilesets[groupId].features.push(feature);
                // If any feature in the group is explicitly set to visible, mark the group as visible
                if (feature.get('isVisible') !== false) { // Check for explicit false, otherwise assume visible or inherit
                    groupedTilesets[groupId].isVisible = true;
                }
                // Ensure a color is set for the group, taking the first available one.
                if (!groupedTilesets[groupId].color) {
                    groupedTilesets[groupId].color = feature.get('color');
                }
            }
        });

        if (Object.keys(groupedTilesets).length === 0) {
            tilesetListDiv.innerHTML = '<small><i>No tilesets saved in this layer.</i></small>';
            return;
        }

        // Now, create list items for each group
        Object.entries(groupedTilesets).forEach(([groupId, groupData]) => {
            const itemDiv = document.createElement('div');
console.log(`populateTilesetList: Creating list item for groupId: '${groupId}', name: '${groupData.name}'`);
            itemDiv.classList.add('layer-item', 'tileset-item'); // Added 'tileset-item' for specific styling/selection
            itemDiv.dataset.tilesetGroupId = groupId;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = groupData.isVisible; // Group visibility
            checkbox.title = `Toggle visibility of "${groupData.name}"`;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = groupData.name;
            nameSpan.title = `Zoom to "${groupData.name}"`; // Click name to zoom

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✏️'; // Pencil icon
            editBtn.classList.add('settings-btn-small');
            editBtn.title = `Edit details for "${groupData.name}"`;

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️'; // Trash icon
            deleteBtn.classList.add('settings-btn-small');
            deleteBtn.title = `Delete tileset "${groupData.name}"`;

            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(deleteBtn);

            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(nameSpan);
            itemDiv.appendChild(buttonContainer);
            tilesetListDiv.appendChild(itemDiv);
        });
console.log(`populateTilesetList: Generated ${Object.keys(groupedTilesets).length} groups. Group IDs:`, Object.keys(groupedTilesets));
        // After repopulating, re-apply highlight if a group is globally selected
        if (window.highlightedGlobeGroupId) {
            console.log(`populateTilesetList: Attempting to re-apply highlight for ${window.highlightedGlobeGroupId}`);
            highlightListItem(window.highlightedGlobeGroupId);
        } else {
            console.log("populateTilesetList: No highlightedGlobeGroupId to re-apply.");
        }
        console.log(`%cEND POPULATE TILESET LIST for layerId: ${layerId}`, "color: blue; font-weight: bold;");

        // Duplicated block removed. The first loop (lines 1038-1073) and
        // highlight re-application (lines 1076-1081) are sufficient.
            // Remainder of the duplicated forEach loop (and its closing '});') removed.
    }

    function highlightListItem(groupId) {
        console.log(`highlightListItem called with groupId: ${groupId}`);
        if (!tilesetListDiv) {
            console.log("highlightListItem: tilesetListDiv not found, returning.");
            return;
        }
        const currentlyHighlighted = tilesetListDiv.querySelector('.highlighted');
        if (currentlyHighlighted) {
            console.log("highlightListItem: Removing 'highlighted' class from previously selected item:", currentlyHighlighted);
            currentlyHighlighted.classList.remove('highlighted');
        }
        if (groupId) {
            const listItem = tilesetListDiv.querySelector(`.tileset-item[data-tileset-group-id="${groupId}"]`);
            if (listItem) {
                console.log("highlightListItem: Found listItem, adding 'highlighted' class:", listItem);
                listItem.classList.add('highlighted');
            } else {
                console.log(`highlightListItem: listItem NOT found for groupId: ${groupId}`);
            }
        } else {
            console.log("highlightListItem: groupId is null/undefined, so no new item will be highlighted.");
        }
    }
    
    function flyToTilesetGroupInGlobe(groupId) {
        // KNOWN ISSUE: Globe may go black if terrain service fails or if zoom is too aggressive for terrain capabilities.
        // Terrain service (e.g., b.terrain.openglobus.org) issues can cause this. Max native zoom for terrain is ZL17.
        console.log(`flyToTilesetGroupInGlobe: Attempting to fly to groupId: ${groupId}`);
        if (!window.globus || !window.globus.planet || !window.globus.planet.camera ||
            !window.selectedLayerId || !window.userLayers || !window.userLayers[window.selectedLayerId]) {
            console.warn("flyToTilesetGroupInGlobe: Globus or layer data not ready.");
            return;
        }

        if (!window.globus.planet.terrain || window.globus.planet.terrain.name === "EmptyTerrain") {
            console.warn(`flyToTilesetGroupInGlobe: Terrain not ready or is EmptyTerrain (current: ${window.globus.planet.terrain?.name}). Aborting flyTo.`);
            return;
        }

        const layer = window.userLayers[window.selectedLayerId].layer;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        console.log(`flyToTilesetGroupInGlobe: Found ${groupFeatures.length} features for group.`);

        if (groupFeatures.length > 0) {
            const groupExtentEPSG3857 = ol.extent.createEmpty();
            groupFeatures.forEach(f => {
                const geom = f.getGeometry();
                if (geom) {
                    ol.extent.extend(groupExtentEPSG3857, geom.getExtent());
                }
            });
            console.log(`flyToTilesetGroupInGlobe: EPSG:3857 extent: ${groupExtentEPSG3857}`);

            if (!ol.extent.isEmpty(groupExtentEPSG3857)) {
                const groupExtentEPSG4326 = ol.proj.transformExtent(groupExtentEPSG3857, 'EPSG:3857', 'EPSG:4326');
                console.log(`flyToTilesetGroupInGlobe: EPSG:4326 extent: ${groupExtentEPSG4326}`);
                
                const centerLon = ol.extent.getCenter(groupExtentEPSG4326)[0];
                const centerLat = ol.extent.getCenter(groupExtentEPSG4326)[1];
                
                const width = ol.extent.getWidth(groupExtentEPSG4326);
                const height = ol.extent.getHeight(groupExtentEPSG4326);
                const diagonal = Math.sqrt(width * width + height * height);
                
                // Adjust altitude calculation: Start with a base that works for single ZL21 tiles, then scale up.
                // A single ZL21 tile is very small.
                let altitude = 50000; // Fixed, conservative altitude for testing (50km)
                console.log(`flyToTilesetGroupInGlobe: Using FIXED TEST ALTITUDE: ${altitude}m`);
                console.log(`flyToTilesetGroupInGlobe: Altitude after MAX_ALTITUDE cap: ${altitude}m`);

                // Further safety: if terrain has maxNativeZoom, try to respect it.
                // This is a rough heuristic. Lower altitude means higher effective zoom.
                // ZL17 is ~76m/px at equator. ZL21 is ~4.7m/px.
                // A very rough estimate for altitude for a given zoom level.
                // This needs more refinement if terrain details are critical at max zoom.
                const terrainMaxNativeZoom = window.globus.planet.terrain?.maxNativeZoom || 17; // Default to 17 if not available
                // If trying to view ZL21 tiles (targetZoom = 21) with ZL17 terrain, we need to be higher up.
                const targetZoomForTiles = TILE_SELECTION_ZOOM; // Currently 21
                
                if (targetZoomForTiles > terrainMaxNativeZoom) {
                    // If we are trying to see details beyond what terrain supports, ensure altitude is not too low.
                    // This is a very conservative estimate.
                    const altitudeForTerrainMaxZoom = 5000 * Math.pow(2, (targetZoomForTiles - terrainMaxNativeZoom));
                    if (altitude < altitudeForTerrainMaxZoom) {
                        console.warn(`flyToTilesetGroupInGlobe: Calculated altitude ${altitude}m is too low for terrain maxNativeZoom ${terrainMaxNativeZoom} when viewing ZL${targetZoomForTiles}. Adjusting to ${altitudeForTerrainMaxZoom}m.`);
                        altitude = altitudeForTerrainMaxZoom;
                    }
                }


                console.log(`flyToTilesetGroupInGlobe: Flying to Lon: ${centerLon.toFixed(4)}, Lat: ${centerLat.toFixed(4)}, Alt: ${altitude.toFixed(0)} (Diagonal: ${diagonal.toFixed(6)} degrees, TerrainMaxZoom: ${terrainMaxNativeZoom})`);
                
                // Temporarily commented out to debug black screen issue
                // if (typeof window.globus.planet.camera.flyLonLat === 'function') {
                //     window.globus.planet.camera.flyLonLat(new og.LonLat(centerLon, centerLat, altitude), null, null, () => {
                //         console.log("flyToTilesetGroupInGlobe: FlyTo complete (TEMPORARILY DISABLED).");
                //     });
                // } else {
                //     console.warn("flyToTilesetGroupInGlobe: camera.flyLonLat not available (call skipped for debug).");
                // }
                console.log("flyToTilesetGroupInGlobe: Actual camera.flyLonLat call SKIPPED for debugging black screen.");
            } else {
                console.warn("flyToTilesetGroupInGlobe: Group extent is empty.");
            }
        } else {
            console.warn(`flyToTilesetGroupInGlobe: No features found for groupId ${groupId}.`);
        }
    }

    function zoomToTilesetGroup(groupId) {
        console.log(`zoomToTilesetGroup: Zooming to groupId: ${groupId}`);
        if (!window.selectedLayerId || !window.userLayers || !window.userLayers[window.selectedLayerId] || !window.olMap) {
            console.warn("zoomToTilesetGroup: Prerequisites not met.");
            return;
        }
        const layer = window.userLayers[window.selectedLayerId].layer;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        if (groupFeatures.length > 0) {
            const groupExtent = ol.extent.createEmpty();
            groupFeatures.forEach(f => ol.extent.extend(groupExtent, f.getGeometry().getExtent()));
            if (!ol.extent.isEmpty(groupExtent)) {
                console.log("zoomToTilesetGroup: Fitting OL map view.");
                window.olMap.getView().fit(groupExtent, { padding: [50, 50, 50, 50], duration: 500, maxZoom: 20 }); // Try maxZoom 20
                highlightListItem(groupId);
                // flyToTilesetGroupInGlobe(groupId); // Temporarily commented out to debug black screen
                console.log("zoomToTilesetGroup: SKIPPED call to flyToTilesetGroupInGlobe for debugging black screen.");
            } else {
                console.warn("zoomToTilesetGroup: Group extent is empty after processing features.");
            }
        }
    }
    
    function toggleTilesetGroupVisibility(groupId, isVisible) {
        if (!window.selectedLayerId || !window.userLayers[window.selectedLayerId]) return;
        const layer = window.userLayers[window.selectedLayerId].layer;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        groupFeatures.forEach(feature => {
            feature.set('isVisible', isVisible);
            if (isVisible) {
                const color = feature.get('color') || '#008080'; // Default if no color
                // Update style using the centralized function
                updateFeatureStyle(feature);
            } else { feature.setStyle(null); }
        });
        if (state.mapLibreMap) updateSavedTilesetsMapLibre(); // Update MapLibre view
    }

    function deleteTilesetGroup(groupId) {
        if (!window.selectedLayerId || !window.userLayers[window.selectedLayerId]) return;
        const layer = window.userLayers[window.selectedLayerId].layer;
        const source = layer.getSource();
        const featuresToRemove = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        if (featuresToRemove.length > 0) {
            const tilesetName = featuresToRemove[0].get('tilesetName') || 'Unnamed Tileset';
            if (confirm(`Are you sure you want to delete the tileset "${tilesetName}"?`)) {
                featuresToRemove.forEach(feature => source.removeFeature(feature));
                window.userLayers[window.selectedLayerId].tilesetCount = Math.max(0, (window.userLayers[window.selectedLayerId].tilesetCount || 0) - 1); // Decrement count
                populateTilesetList(window.selectedLayerId);
                if (window.ogSavedTilesetsLayer) {
                    window.ogSavedTilesetsLayer.clear(); // Force redraw of the globe layer
                    console.log("DEBUG: ogSavedTilesetsLayer cleared after deleting tileset group.");
                }
                if (state.mapLibreMap) updateSavedTilesetsMapLibre(); // Update MapLibre view
            }
        }
    }
    
    if (tilesetListDiv) {
        tilesetListDiv.addEventListener('click', (event) => {
            const target = event.target;
            const itemDiv = target.closest('.tileset-item'); if (!itemDiv) return;
            const groupId = itemDiv.dataset.tilesetGroupId; if (!groupId) return;

            // Check if the click was on the delete button or visibility checkbox
            if (target.innerHTML === '🗑️') {
                deleteTilesetGroup(groupId);
                return; // Action handled, no need to open modal
            }
            if (target.type === 'checkbox') {
                // Visibility is handled by the 'change' event listener, so do nothing here for click
                return;
            }

            // If the click was on the name (SPAN) or the edit button, or the itemDiv itself (but not buttons/checkbox)
            // then zoom and open details.
            if (target.tagName === 'SPAN' || target.innerHTML === '✏️' || target === itemDiv || itemDiv.contains(target) && !target.closest('button') && target.type !== 'checkbox') {
                console.log(`tilesetListDiv click: Item clicked. currentEditingGroupId: '${currentEditingGroupId}', clicked groupId: '${groupId}', modal display: '${tilesetDetailsModal.style.display}'`);
                // Check if this group is already selected and detailed
                if (currentEditingGroupId === groupId && tilesetDetailsModal.style.display === 'block') {
                    console.log(`tilesetListDiv click: Deselecting already active group ${groupId}`);
                    clearMapSelectionAndDetails();
                    return; // Stop further processing
                }

                // If not already selected, or if details modal is hidden, proceed to select
                zoomToTilesetGroup(groupId); // This will also fly the globe
                const layer = window.userLayers[window.selectedLayerId]?.layer;
                if (layer) {
                    // --- Add selection logic here ---
                    clearMapSelectionAndDetails();
window.highlightedGlobeGroupId = groupId; // Set for globe highlighting
console.log(`UI List Click: Setting highlightedGlobeGroupId to: ${window.highlightedGlobeGroupId}`);
                    const targetSource = layer.getSource();
                    const groupFeatures = targetSource.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
                    const featuresToAdd = groupFeatures.map(f => {
                        const clone = f.clone();
                        clone.setId(`selection-${f.getId() || f.ol_uid}`); // Ensure unique ID for selection layer
                        clone.set('originalTileId', f.get('tileId')); // Keep track of original if needed
                        clone.set('isGroupSelection', true);
                        return clone;
                    });
                    if (featuresToAdd.length > 0 && selectionSource) {
                        selectionSource.addFeatures(featuresToAdd);
                    }
                    updateSelectedTileCountDisplay(); // Update count after changing selection
                    // --- End selection logic ---

                    const firstFeature = groupFeatures.length > 0 ? groupFeatures[0] : null; // Use already filtered features
                    if (firstFeature) {
                        openTilesetDetailsModal(firstFeature); // This will set currentEditingGroupId
                    } else {
                        console.warn(`Could not find feature for groupId ${groupId} to open details modal.`);
                    }
                    if (window.ogSavedTilesetsLayer) {
                        window.ogSavedTilesetsLayer.clear(); // Refresh globe for highlight
                        // console.log("DEBUG: ogSavedTilesetsLayer cleared after UI list group selection.");
                    }
                }
            }
        });
        tilesetListDiv.addEventListener('change', (event) => {
            if (event.target.type === 'checkbox') {
                const itemDiv = event.target.closest('.tileset-item');
                if (itemDiv) { const groupId = itemDiv.dataset.tilesetGroupId; if (groupId) { toggleTilesetGroupVisibility(groupId, event.target.checked); } }
            }
        });
    } else {
        console.warn("DEBUG: tilesetListDiv not found, event listeners not attached.");
    }

    function openTilesetDetailsModal(feature) {
        // Ensure detailsFillOpacityInput and detailsStrokeWidthInput are defined, similar to other elements
        const detailsFillOpacityInput = document.getElementById('details-fill-opacity-input');
        const detailsStrokeWidthInput = document.getElementById('details-stroke-width-input');
        const detailsLocationInfoSpan = document.getElementById('details-location-info'); // Define the location info span

        if (!feature || !tilesetDetailsModal || !detailsTilesetNameInput || !detailsColorPicker ||
            !detailsFillOpacityInput || !detailsStrokeWidthInput ||
            !detailsTilesetImageUrlInput || !detailsTilesetLinkInput || !detailsTilesetTagsTextarea ||
            !detailsTilesetImage || !detailsTilesetCoordsSpan || !detailsLocationInfoSpan ) { // Add to check
            console.error("openTilesetDetailsModal: One or more required elements or feature is missing.");
            return;
        }
        const groupId = feature.get('tilesetGroupId');
        const name = feature.get('tilesetName') || 'Unnamed Tileset';
        const color = feature.get('color') || '#33CCFF'; // Use new brighter default
        const fillOpacity = feature.get('fillOpacity') === undefined ? 0.6 : feature.get('fillOpacity');
        const strokeWidth = feature.get('strokeWidth') === undefined ? 0.5 : feature.get('strokeWidth');
        const imageUrl = feature.get('imageUrl') || '';
        const linkUrl = feature.get('linkUrl') || '';
        const tags = feature.get('tags') || '';

        if (!groupId) { return; }
        currentEditingGroupId = groupId;
        detailsTilesetNameInput.value = name;
        detailsColorPicker.value = color;
        detailsFillOpacityInput.value = fillOpacity; // Populate new input
        detailsStrokeWidthInput.value = strokeWidth; // Populate new input
        detailsTilesetImageUrlInput.value = imageUrl;
        detailsTilesetLinkInput.value = linkUrl;
        detailsTilesetTagsTextarea.value = tags;
        if (imageUrl) {
            detailsTilesetImage.src = imageUrl;
            detailsTilesetImage.style.display = 'block';
        } else {
            detailsTilesetImage.style.display = 'none';
            detailsTilesetImage.src = '';
        }
        // Calculate coords/count
        const layer = window.userLayers[window.selectedLayerId]?.layer;
        let tileCount = 0; let coordsStr = 'N/A';
        if (layer) {
            const groupFeatures = layer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
            tileCount = groupFeatures.length;
            if (tileCount > 0 && selectionTileGrid) {
                 const firstTileId = groupFeatures[0].get('tileId');
                 if (firstTileId) {
                     const tileCoord = firstTileId.split('-').map(Number);
                     const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                     const center = ol.extent.getCenter(tileExtent);
                     const centerLonLat = ol.proj.toLonLat(center);
                     coordsStr = `~ ${centerLonLat[1].toFixed(4)}, ${centerLonLat[0].toFixed(4)}`;
                     // Placeholder for reverse geocoding call
                     if (detailsLocationInfoSpan) detailsLocationInfoSpan.textContent = 'Loading...';
                 }
            }
        }
        detailsTilesetCoordsSpan.textContent = coordsStr;
        if (detailsLocationInfoSpan) detailsLocationInfoSpan.textContent = 'Loading...'; // Set initial text
        tilesetDetailsModal.style.setProperty('display', 'block', 'important');
    }

    function applyGroupPropertyChange(propertyName, value, skipStyleUpdate = false) {
        if (!currentEditingGroupId || !window.selectedLayerId || !window.userLayers[window.selectedLayerId]) { return false; }
        const layer = window.userLayers[window.selectedLayerId].layer; const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);
        if (groupFeatures.length === 0) { return false; }
        groupFeatures.forEach(feature => {
             feature.set(propertyName, value);
             // Update style immediately if not skipped (e.g., for color, opacity, stroke changes)
             if (!skipStyleUpdate && feature.get('isVisible') !== false) {
                 updateFeatureStyle(feature); // This will update the OL feature style
             }
         });
         if (state.mapLibreMap && !skipStyleUpdate) updateSavedTilesetsMapLibre(); // Update MapLibre view
         // Trigger redraw for OpenGlobus layer if visual properties changed
        // Temporarily commented out to debug black screen issue when selecting from map
        // if (!skipStyleUpdate && window.ogSavedTilesetsLayer && typeof window.ogSavedTilesetsLayer.clear === 'function') {
        //      console.log("Triggering ogSavedTilesetsLayer.clear() due to property change for OpenGlobus (TEMPORARILY DISABLED).");
        //      window.ogSavedTilesetsLayer.clear(); // Use clear() for CanvasTiles
        // } else if (!skipStyleUpdate) {
        //      console.warn("Could not clear ogSavedTilesetsLayer - layer or clear function missing (call skipped for debug).");
        // }
        console.log("applyGroupPropertyChange: SKIPPED ogSavedTilesetsLayer.clear() for debugging black screen on map click selection.");
        return true;
    }

    if (closeTilesetDetailsModalBtn) {
        closeTilesetDetailsModalBtn.addEventListener('click', () => { if(tilesetDetailsModal) tilesetDetailsModal.style.display = 'none'; currentEditingGroupId = null; });
    }
    if (tilesetDetailsModal) { // Click outside to close
        window.addEventListener('click', (event) => { if (event.target === tilesetDetailsModal) { tilesetDetailsModal.style.display = 'none'; currentEditingGroupId = null; } });
    }
    if (detailsTilesetNameInput) {
        detailsTilesetNameInput.addEventListener('change', (event) => {
            const newName = event.target.value.trim(); if (newName === '') { alert("Tileset name cannot be empty."); return; }
            if (applyGroupPropertyChange('tilesetName', newName)) {
                populateTilesetList(window.selectedLayerId); // Repopulate to update name in list
            }
        });
    }
    if (detailsTilesetImageUrlInput) {
        detailsTilesetImageUrlInput.addEventListener('change', (event) => {
            const url = event.target.value.trim();
            if (applyGroupPropertyChange('imageUrl', url)) {
                if (url && detailsTilesetImage) { detailsTilesetImage.src = url; detailsTilesetImage.style.display = 'block'; }
                else if(detailsTilesetImage) { detailsTilesetImage.style.display = 'none'; detailsTilesetImage.src = ''; }
            }
        });
    }
    if (detailsTilesetLinkInput) {
        detailsTilesetLinkInput.addEventListener('change', (event) => { applyGroupPropertyChange('linkUrl', event.target.value.trim()); });
    }
    if (detailsTilesetTagsTextarea) {
        detailsTilesetTagsTextarea.addEventListener('change', (event) => { applyGroupPropertyChange('tags', event.target.value.trim()); });
    }
    // --- Enhanced Color Picker Event Listeners ---
    const detailsFillOpacityInput = document.getElementById('details-fill-opacity-input');
    const detailsStrokeWidthInput = document.getElementById('details-stroke-width-input');

    if (detailsColorPicker) {
        detailsColorPicker.addEventListener('input', (event) => {
            applyGroupPropertyChange('color', event.target.value);
        });
    }
    if (detailsFillOpacityInput) {
         detailsFillOpacityInput.addEventListener('input', (event) => {
             const opacity = parseFloat(event.target.value);
             if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                 applyGroupPropertyChange('fillOpacity', opacity);
             }
         });
    }
    if (detailsStrokeWidthInput) {
         detailsStrokeWidthInput.addEventListener('input', (event) => {
             const width = parseFloat(event.target.value);
if (viewTilesetInBabylonBtn) {
        viewTilesetInBabylonBtn.addEventListener('click', async () => {
            console.log("View 3D (Babylon) button clicked.");
            // Ensure currentEditingFeatureForModal is set when modal opens
            if (!currentEditingFeatureForModal) { 
                alert("No tileset is currently detailed. Please select/click a tileset from the list first.");
                console.warn("View 3D: currentEditingFeatureForModal is not set.");
                return;
            }

            const tilesetName = detailsTilesetNameInput.value || 'SelectedTileset';
            const groupId = currentEditingFeatureForModal.get('tilesetGroupId');

            if (!groupId) {
                alert("Could not get tileset group ID from the current feature. Cannot export.");
                console.warn("View 3D: groupId is not set on currentEditingFeatureForModal.");
                return;
            }

            const activeLayerId = window.selectedLayerId || layer0Id;
            const layerData = window.userLayers[activeLayerId];
            if (!layerData || !layerData.layer) {
                alert(`Layer ${activeLayerId} not found or invalid.`);
                console.warn(`View 3D: Layer ${activeLayerId} not found.`);
                return;
            }
            const layerSource = layerData.layer.getSource();
            if (!layerSource) {
                alert(`Layer source for ${activeLayerId} not found.`);
                console.warn(`View 3D: Layer source for ${activeLayerId} not found.`);
                return;
            }

            let tilesArray;
            const groupFeatures = layerSource.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);

            if (groupFeatures.length > 0) {
                tilesArray = groupFeatures.map(f => {
                    const tileId = f.get('tileId'); // Expected "z-x-y"
                    if (!tileId) return null;
                    const parts = tileId.split('-').map(Number);
                    return (parts.length === 3 && !parts.some(isNaN)) ? parts : null; // [z, x, y]
                }).filter(t => t !== null);
            } else if (tilesetName === "Test Tileset SoL" && groupId.startsWith("test-tileset-")) {
                // Fallback for the specific test tileset if features somehow aren't found by group ID
                // but the name and a pattern for test group ID match.
                console.warn("Using hardcoded 'Test Tileset SoL' coordinates for Babylon view.");
                tilesArray = [ 
                    [TILE_SELECTION_ZOOM, 617234, 788670], [TILE_SELECTION_ZOOM, 617235, 788670],
                    [TILE_SELECTION_ZOOM, 617234, 788671], [TILE_SELECTION_ZOOM, 617235, 788671]
                ];
            } else {
                 alert(`No individual tile features found for group ID ${groupId} in layer ${activeLayerId}. Cannot determine tile coordinates.`);
                 console.warn(`View 3D: No individual tile features for groupId ${groupId} in layer ${activeLayerId}.`);
                 return;
            }

            if (!tilesArray || tilesArray.length === 0) {
                alert("Could not extract valid tile coordinates for the selected tileset.");
                console.warn("View 3D: No valid tile coordinates extracted.");
                return;
            }

            let textureUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'; // Default
            if (baseLayerSelectOL) {
                const selectedBaseLayerValue = baseLayerSelectOL.value;
                if (selectedBaseLayerValue === 'osm') {
                    textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                } else if (selectedBaseLayerValue === 'satellite') {
                    textureUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                } else if (selectedBaseLayerValue === 'topo') {
                    textureUrl = 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png';
                } else if (selectedBaseLayerValue === 'terrarium') {
                    console.warn("Terrarium DEM selected as base layer, using OSM for texture in 3D export.");
                    textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                }
                const customLayerUrlVal = customLayerUrlInput ? customLayerUrlInput.value : '';
                if (selectedBaseLayerValue === 'add-custom' && customLayerUrlVal) {
                    textureUrl = customLayerUrlVal;
                }
            }

            const terrainUrl = 'https://terrain.openglobus.org/all/{z}/{x}/{y}.png';
            console.log(`Requesting GLTF export for: ${tilesetName}, ${tilesArray.length} tiles. Texture base: ${textureUrl}`);

            const originalButtonText = viewTilesetInBabylonBtn.textContent;
            viewTilesetInBabylonBtn.textContent = "Generating 3D...";
            viewTilesetInBabylonBtn.disabled = true;

            if (typeof window.exportTilesetToGLTF === 'function') {
                window.exportTilesetToGLTF(tilesArray, textureUrl, terrainUrl, tilesetName, (gltfJsonString, errorMsg) => {
                    viewTilesetInBabylonBtn.textContent = originalButtonText;
                    viewTilesetInBabylonBtn.disabled = false;

                    if (errorMsg) {
                        console.error("Error exporting tileset to GLTF:", errorMsg);
                        alert("Error generating 3D model: " + errorMsg);
                        return;
                    }
                    if (gltfJsonString) {
                        console.log("GLTF data received in main.js. Preparing to send to XR iframe.");
                        const xrIframe = document.getElementById('xr-iframe');
                        const xrPanel = document.getElementById('xr-panel'); // Ensure xrPanel is defined if used by switchToView
                        
                        if (!xrIframe) {
                            console.error("XR panel iframe not found.");
                            alert("XR panel iframe missing. Cannot display 3D model.");
                            return;
                        }

                        if (typeof switchToView !== 'function') {
                            console.error("switchToView function is not defined. Cannot switch to XR panel.");
                            alert("Error: UI navigation function missing.");
                            return;
                        }
                        switchToView('xr-view-btn'); // Ensure XR panel is visible and active
                        
                        const currentEngine = xrIframe.dataset.currentEngine;
                        console.log(`Current XR engine for GLTF export: ${currentEngine}`);

                        if (currentEngine === 'janusweb') {
                            // Ensure xr_janus_wrapper.html is loaded
                            if (!xrIframe.src || !xrIframe.src.includes('xr_janus_wrapper.html')) {
                                console.warn("JanusWeb engine selected, but wrapper not loaded. Attempting to click JanusWeb button.");
                                const janusEngineButton = document.querySelector('#xr-engine-selector .xr-engine-btn[data-engine="janusweb"]');
                                if (janusEngineButton) {
                                    janusEngineButton.click(); // This will set src to xr_janus_wrapper.html
                                    // Wait for iframe to load the wrapper then send message
                                    const janusWrapperLoadHandler = () => {
                                        console.log("JanusWeb wrapper loaded. Posting 'loadGLTFAsRoom' message.");
                                        if (xrIframe.contentWindow) {
                                            xrIframe.contentWindow.postMessage({
                                                type: 'loadGLTFAsRoom',
                                                gltfString: gltfJsonString,
                                                tilesetName: tilesetName // Pass tilesetName
                                            }, '*');
                                        } else {
                                            console.error("JanusWeb wrapper contentWindow not available after load.");
                                        }
                                        xrIframe.removeEventListener('load', janusWrapperLoadHandler);
                                    };
                                    xrIframe.addEventListener('load', janusWrapperLoadHandler);
                                } else {
                                    alert("Could not switch XR panel to JanusWeb wrapper automatically.");
                                    return;
                                }
                            } else if (xrIframe.contentWindow) {
                                console.log("Posting 'loadGLTFAsRoom' message to JanusWeb wrapper iframe.");
                                xrIframe.contentWindow.postMessage({
                                    type: 'loadGLTFAsRoom',
                                    gltfString: gltfJsonString,
                                    tilesetName: tilesetName
                                }, '*');
                            } else {
                                console.error("Cannot post message: JanusWeb wrapper iframe.contentWindow not available.");
                                alert("Error: Could not communicate with the JanusWeb view. It might still be loading.");
                            }
                        } else if (currentEngine === 'babylonjs') {
                            const babylonEngineButton = document.querySelector('#xr-engine-selector .xr-engine-btn[data-engine="babylonjs"]');
                            if (!babylonEngineButton) { console.error("Babylon engine button not found"); return; }

                            const needsSrcChangeForBabylon = !xrIframe.src || !xrIframe.src.includes('babylon_maplibre.html');
                            const sendMessageToBabylonIframe = () => {
                                if (xrIframe.contentWindow) {
                                    console.log("Posting 'loadGLTF' message to Babylon iframe.");
                                    xrIframe.contentWindow.postMessage({ type: 'loadGLTF', gltfString: gltfJsonString }, '*');
                                } else {
                                    console.error("Cannot post message: Babylon iframe.contentWindow not available.");
                                    alert("Error: Could not communicate with the Babylon 3D view iframe.");
                                }
                            };

                            if (needsSrcChangeForBabylon) {
                                console.log("Babylon engine selected, but iframe src incorrect. Clicking Babylon button.");
                                const babylonLoadHandler = () => {
                                    console.log("Babylon iframe loaded after src change. Sending GLTF.");
                                    sendMessageToBabylonIframe();
                                    xrIframe.removeEventListener('load', babylonLoadHandler);
                                };
                                xrIframe.addEventListener('load', babylonLoadHandler);
                                if (!babylonEngineButton.classList.contains('active')) {
                                     babylonEngineButton.click();
                                } else { // Already active, src should be correct, but iframe might need a moment
                                     setTimeout(sendMessageToBabylonIframe, 200);
                                }
                            } else {
                                console.log("Babylon engine already active and iframe src correct. Sending GLTF.");
                                setTimeout(sendMessageToBabylonIframe, 100); // Small delay
                            }
                        } else {
                            console.warn(`XR engine '${currentEngine}' not configured for GLTF loading from this button, or no engine selected.`);
                            // alert(`The current XR engine (${currentEngine || 'none'}) does not support this action.`);
                        }
                    }
                });
            } else {
                alert("Tileset exporter function (exportTilesetToGLTF) is not available.");
                console.error("window.exportTilesetToGLTF is not defined.");
/* START OLD viewTilesetInCesiumBtn LISTENER
if (viewTilesetInCesiumBtn) {
        viewTilesetInCesiumBtn.addEventListener('click', async () => {
            console.log("View in Scene (Cesium) button clicked.");
            if (!currentEditingFeatureForModal) { // currentEditingFeatureForModal is set in openTilesetDetailsModal
                alert("No tileset is currently detailed. Please select/click a tileset from the list first.");
                console.warn("View in Cesium: currentEditingFeatureForModal is not set.");
                return;
            }

            const tilesetName = detailsTilesetNameInput.value || 'SelectedTilesetForCesium';
            const groupId = currentEditingFeatureForModal.get('tilesetGroupId');

            if (!groupId) {
                alert("Could not get tileset group ID. Cannot export for Cesium.");
                console.warn("View in Cesium: groupId is not set on currentEditingFeatureForModal.");
                return;
            }

            const activeLayerId = window.selectedLayerId || layer0Id;
            const layerData = window.userLayers[activeLayerId];
            if (!layerData || !layerData.layer) {
                alert(`Layer ${activeLayerId} not found for Cesium export.`);
                console.warn(`View in Cesium: Layer ${activeLayerId} not found.`);
                return;
            }
            const layerSource = layerData.layer.getSource();
            if (!layerSource) {
                alert(`Layer source for ${activeLayerId} not found for Cesium export.`);
                console.warn(`View in Cesium: Layer source for ${activeLayerId} not found.`);
                return;
            }

            let tilesArray;
            const groupFeatures = layerSource.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);

            if (groupFeatures.length > 0) {
                tilesArray = groupFeatures.map(f => {
                    const tileId = f.get('tileId'); // Expected "z-x-y"
                    if (!tileId) return null;
                    const parts = tileId.split('-').map(Number);
                    return (parts.length === 3 && !parts.some(isNaN)) ? parts : null; // [z, x, y]
                }).filter(t => t !== null);
            } else if (tilesetName === "Test Tileset SoL" && groupId.startsWith("test-tileset-")) {
                console.warn("Using hardcoded 'Test Tileset SoL' coordinates for Cesium view as no features found by group ID.");
                tilesArray = [ 
                    [TILE_SELECTION_ZOOM, 617234, 788670], [TILE_SELECTION_ZOOM, 617235, 788670],
                    [TILE_SELECTION_ZOOM, 617234, 788671], [TILE_SELECTION_ZOOM, 617235, 788671]
                ];
            } else {
                 alert(`No individual tile features found for group ID ${groupId} in layer ${activeLayerId} for Cesium export.`);
                 console.warn(`View in Cesium: No individual tile features for groupId ${groupId} in layer ${activeLayerId}.`);
                 return;
            }

            if (!tilesArray || tilesArray.length === 0) {
                alert("Could not extract valid tile coordinates for Cesium export.");
                console.warn("View in Cesium: No valid tile coordinates extracted.");
                return;
            }

            let textureUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'; // Default
            if (baseLayerSelectOL) {
                const selectedBaseLayerValue = baseLayerSelectOL.value;
                if (selectedBaseLayerValue === 'osm') {
                    textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                } else if (selectedBaseLayerValue === 'satellite') {
                    textureUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                } else if (selectedBaseLayerValue === 'topo') {
                    textureUrl = 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png';
                } else if (selectedBaseLayerValue === 'terrarium') {
                    console.warn("Terrarium DEM selected as base layer, using OSM for texture in Cesium export.");
                    textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                }
                const customUrlVal = customLayerUrlInput ? customLayerUrlInput.value : ''; // Ensure customLayerUrlInput is defined
                if (selectedBaseLayerValue === 'add-custom' && customUrlVal) {
                    textureUrl = customUrlVal;
                }
            }

            const terrainUrl = 'https://terrain.openglobus.org/all/{z}/{x}/{y}.png';
            console.log(`Requesting GLTF for Cesium: ${tilesetName}, ${tilesArray.length} tiles. Texture base: ${textureUrl}`);

            const originalButtonText = viewTilesetInCesiumBtn.textContent;
            viewTilesetInCesiumBtn.textContent = "Generating GLTF...";
            viewTilesetInCesiumBtn.disabled = true;

            if (typeof window.exportTilesetToGLTF === 'function') {
                window.exportTilesetToGLTF(tilesArray, textureUrl, terrainUrl, tilesetName, (gltfJsonString, errorMsg) => {
                    viewTilesetInCesiumBtn.textContent = originalButtonText;
                    viewTilesetInCesiumBtn.disabled = false;

                    if (errorMsg) {
                        console.error("Error exporting tileset for Cesium:", errorMsg);
                        alert("Error generating 3D model for Cesium: " + errorMsg);
                        return;
                    }
                    if (gltfJsonString) {
                        console.log("GLTF ready, sending to Cesium iframe (scene-iframe).");
                        if (!sceneIframe || !scenePanel) { // sceneIframe is defined globally now
                            console.error("Scene panel or iframe not found for Cesium.");
                            alert("Scene panel components missing.");
                            return;
                        }
                        
                        if (typeof switchToView !== 'function') {
                             console.error("switchToView function is not defined. Cannot switch to Scene panel."); return;
                        }
                        switchToView('scene-btn'); // Ensure Scene panel is visible

                        const currentSrc = sceneIframe.getAttribute('src');
                        const needsSrcChange = !currentSrc || !currentSrc.includes('scene_cesium.html');

                        const sendMessageToCesiumIframe = () => {
                            if (sceneIframe.contentWindow) {
                                console.log("Posting 'loadGLTF' message to Cesium iframe.");
                                sceneIframe.contentWindow.postMessage({ type: 'loadGLTF', gltfString: gltfJsonString }, '*');
                            } else {
                                console.error("Cannot post message: sceneIframe.contentWindow not available.");
                                alert("Error: Could not communicate with the Cesium view iframe (contentWindow missing).");
                            }
                        };
                        
                        if (needsSrcChange) {
                            console.log("Setting scene-iframe src to scene_cesium.html");
                            const iframeLoadOnceHandler = () => {
                                console.log("Cesium iframe (scene-iframe) loaded scene_cesium.html.");
                                sendMessageToCesiumIframe();
                                sceneIframe.removeEventListener('load', iframeLoadOnceHandler);
                            };
                            sceneIframe.addEventListener('load', iframeLoadOnceHandler);
                            sceneIframe.setAttribute('src', 'scene_cesium.html');
                        } else {
                            console.log("scene-iframe already has scene_cesium.html or src is already set. Sending message.");
                            // If src is already correct, iframe might be loaded.
                            // A slight delay can help ensure contentWindow is ready if just switched.
                            setTimeout(sendMessageToCesiumIframe, 200); 
                        }
                    }
                });
            } else {
                alert("Tileset exporter function (exportTilesetToGLTF) is not available for Cesium.");
                console.error("window.exportTilesetToGLTF is not defined.");
                viewTilesetInCesiumBtn.textContent = originalButtonText;
                viewTilesetInCesiumBtn.disabled = false;
            }
        });
    }
    // End of viewTilesetInCesiumBtn listener logic
END OLD viewTilesetInCesiumBtn LISTENER */
// Helper function to load GLTF into the active OLCesium instance (Map Panel)
    let currentMapPanelOlcsGltfEntity = null; 
    function loadGltfIntoActiveOLCesium(gltfJsonString, tilesArray, tilesetName) {
        if (!olcsMapPanel || !olcsMapPanel.getEnabled()) {
            console.error("OLCesium (Map Panel) is not active or ready for GLTF loading.");
            alert("OLCesium 3D view in Map Panel is not active/ready. Please switch to 3D view in the Map Panel.");
            return;
        }
        const cesiumViewer = olcsMapPanel.getCesiumScene().viewer;
        if (!cesiumViewer) {
            console.error("Cesium viewer instance not found in OLCesium (Map Panel).");
            alert("Cesium viewer component missing in 3D Map Panel.");
            return;
        }

        if (currentMapPanelOlcsGltfEntity) {
            cesiumViewer.entities.remove(currentMapPanelOlcsGltfEntity);
            currentMapPanelOlcsGltfEntity = null;
            console.log("Removed previous GLTF model from OLCesium Map Panel.");
        }

        try {
            const blob = new Blob([gltfJsonString], { type: 'model/gltf+json' });
            const url = URL.createObjectURL(blob);

            let entityPosition;
            let calculatedCenter = null;
            // Calculate center from tilesArray using OpenLayers utilities
            if (tilesArray && tilesArray.length > 0 && window.ol && window.ol.extent && selectionTileGrid) {
                const extent = ol.extent.createEmpty();
                tilesArray.forEach(tc => { // tc is [z,x,y]
                    const tileGeoExtent = selectionTileGrid.getTileCoordExtent(tc);
                    ol.extent.extend(extent, tileGeoExtent);
                });
                const centerCoord = ol.extent.getCenter(extent); // This is in map projection (EPSG:3857)
                const lonLat = ol.proj.toLonLat(centerCoord);    // Convert to LonLat (EPSG:4326)
                calculatedCenter = { lon: lonLat[0], lat: lonLat[1], height: 0 }; // Height can be an average from terrain later
                entityPosition = Cesium.Cartesian3.fromDegrees(calculatedCenter.lon, calculatedCenter.lat, calculatedCenter.height);
                console.log(`Calculated GLTF center for OLCesium: Lon=${calculatedCenter.lon}, Lat=${calculatedCenter.lat}`);
            } else {
                // Fallback position if center calculation fails (e.g., near Statue of Liberty)
                entityPosition = Cesium.Cartesian3.fromDegrees(-74.0445, 40.6892, 100); // Added some height
                console.warn("Could not calculate tileset center for OLCesium GLTF, using fallback position (Statue of Liberty).");
            }
            
            currentMapPanelOlcsGltfEntity = cesiumViewer.entities.add({
                name: tilesetName || 'TilesetInOLCesium',
                position: entityPosition,
                model: { 
                    uri: url,
                    // minimumPixelSize: 32 // Example for visibility
                }
            });
            console.log(`Added GLTF model "${tilesetName}" to OLCesium Map Panel at`, entityPosition);

            cesiumViewer.flyTo(currentMapPanelOlcsGltfEntity)
                .then(() => {
                    console.log(`GLTF model "${tilesetName}" loaded and focused in OLCesium (Map Panel).`);
                })
                .catch(err => {
                    console.error("Error flying to GLTF in OLCesium (Map Panel):", err);
                });
            
            // Revoke blob URL after a delay to ensure Cesium has loaded it
            setTimeout(() => URL.revokeObjectURL(url), 7000);

        } catch (e) {
            console.error("Error loading GLTF into OLCesium (Map Panel):", e);
            alert("Error displaying 3D model in OLCesium Map Panel: " + e.message);
        }
    }

    // Listener for "View in Scene (Cesium)" button in the Tileset Details Modal
    // This now targets the OLCesium instance in the Map Panel.
    if (viewTilesetInCesiumBtn) {
        viewTilesetInCesiumBtn.addEventListener('click', async () => {
            console.log("Modal 'View in Scene (Cesium)' button clicked, targeting OLCesium in Map Panel.");
            if (!currentEditingFeatureForModal) {
                alert("No tileset is currently detailed. Please select/click a tileset from the list first.");
                console.warn("View in OLCesium: currentEditingFeatureForModal is not set.");
                return;
            }
            if (!olcsMapPanel || typeof olcsMapPanel.setEnabled !== 'function') {
                alert("OLCesium (3D Map View) is not ready. Attempting to initialize.");
                if (typeof initializeOLCesiumMapPanel === 'function' && !olcsMapPanel) {
                    initializeOLCesiumMapPanel(); // Try to init if not already
                }
                if (!olcsMapPanel) { // Check again after attempting init
                     alert("OLCesium (3D Map View) could not be initialized. Please ensure libraries are loaded and try toggling the 2D/3D map view."); return;
                }
            }

            const tilesetName = detailsTilesetNameInput.value || 'OLCesium_Tileset';
            const groupId = currentEditingFeatureForModal.get('tilesetGroupId');
            if (!groupId) {
                alert("Could not get tileset group ID for OLCesium export.");
                console.warn("View in OLCesium: groupId is not set.");
                return;
            }

            const activeLayerId = window.selectedLayerId || layer0Id;
            const layerData = window.userLayers[activeLayerId];
            if (!layerData || !layerData.layer) { alert(`Layer ${activeLayerId} not found.`); return; }
            const layerSource = layerData.layer.getSource();
            if (!layerSource) { alert(`Layer source for ${activeLayerId} not found.`); return; }

            let tilesArray;
            const groupFeatures = layerSource.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
            if (groupFeatures.length > 0) {
                tilesArray = groupFeatures.map(f => {
                    const tileId = f.get('tileId');
                    if (!tileId) return null;
                    const parts = tileId.split('-').map(Number);
                    return (parts.length === 3 && !parts.some(isNaN)) ? parts : null;
                }).filter(t => t !== null);
            } else if (tilesetName === "Test Tileset SoL" && groupId.startsWith("test-tileset-")) { // Check for specific test case
                console.warn("Using hardcoded 'Test Tileset SoL' coordinates for OLCesium view as no features found by group ID.");
                tilesArray = [
                    [TILE_SELECTION_ZOOM, 617234, 788670], [TILE_SELECTION_ZOOM, 617235, 788670],
                    [TILE_SELECTION_ZOOM, 617234, 788671], [TILE_SELECTION_ZOOM, 617235, 788671]
                ];
            } else {
                 alert(`No tile features found for group ID ${groupId}.`); 
                 console.warn(`View in OLCesium: No tile features for ${groupId}.`);
                 return;
            }

            if (!tilesArray || tilesArray.length === 0) {
                alert("Could not extract valid tile coordinates for OLCesium export."); return;
            }

            let textureUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'; // Default
            if (baseLayerSelectOL) {
                const val = baseLayerSelectOL.value;
                if (val === 'osm') textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                else if (val === 'topo') textureUrl = 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png';
                else if (val === 'terrarium') {
                     console.warn("Terrarium DEM selected, using OSM for texture in OLCesium export.");
                     textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                }
                const customUrl = customLayerUrlInput ? customLayerUrlInput.value : '';
                if (val === 'add-custom' && customUrl) textureUrl = customUrl;
            }
            const terrainUrl = 'https://terrain.openglobus.org/all/{z}/{x}/{y}.png'; // Using OpenGlobus terrain for consistency in export

            const originalButtonText = viewTilesetInCesiumBtn.textContent;
            viewTilesetInCesiumBtn.textContent = "Generating...";
            viewTilesetInCesiumBtn.disabled = true;

            if (typeof window.exportTilesetToGLTF === 'function') {
                window.exportTilesetToGLTF(tilesArray, textureUrl, terrainUrl, tilesetName, (gltfJsonString, errorMsg) => {
                    viewTilesetInCesiumBtn.textContent = originalButtonText; 
                    viewTilesetInCesiumBtn.disabled = false;

                    if (errorMsg) {
                        alert("Error generating 3D model for OLCesium: " + errorMsg); return;
                    }
                    if (gltfJsonString) {
                        console.log("GLTF ready for OLCesium view in Map Panel.");
                        
                        // Ensure Map Panel is in 3D OLCesium mode
                        if (!olcsMapPanel.getEnabled()) {
                            if (toggleMapCesiumViewBtn) {
                                console.log("Map panel not in 3D OLCesium mode. Clicking toggle button.");
                                toggleMapCesiumViewBtn.click(); // Simulate click to switch
                                // Wait a moment for the view to switch and OLCesium to enable
                                setTimeout(() => loadGltfIntoActiveOLCesium(gltfJsonString, tilesArray, tilesetName), 500);
                            } else {
                                alert("Please switch Map Panel to 3D View first."); return;
                            }
                        } else {
                            loadGltfIntoActiveOLCesium(gltfJsonString, tilesArray, tilesetName);
                        }
                    }
                });
            } else {
                alert("Tileset exporter function (exportTilesetToGLTF) is not available.");
                viewTilesetInCesiumBtn.textContent = originalButtonText;
                viewTilesetInCesiumBtn.disabled = false;
            }
        });
    }
    // End of refactored viewTilesetInCesiumBtn (now for OLCesium Map Panel) listener logic
                viewTilesetInBabylonBtn.textContent = originalButtonText;
                viewTilesetInBabylonBtn.disabled = false;
            }
        });
    }
    // End of viewTilesetInBabylonBtn listener logic
             if (!isNaN(width) && width >= 0) {
                 applyGroupPropertyChange('strokeWidth', width);
             }
         });
    }

    if (saveSelectionBtn && !state.saveSelectionListenerAttached) {
        console.log("%cSAVE SELECTION BTN: Attaching listener...", "color: blue; font-weight: bold;");
        saveSelectionBtn.addEventListener('click', () => {
            console.log("%cSAVE SELECTION BTN CLICKED", "color: red; font-weight: bold; background: yellow;");
            if (!window.selectedLayerId || !window.userLayers[window.selectedLayerId] || !selectionSource || !tilesetNameInput) {
                alert("Cannot save: Critical components missing."); return;
            }
            let tilesetName = tilesetNameInput.value.trim();
            const selectedFeatures = selectionSource.getFeatures();
            if (selectedFeatures.length === 0) { alert("No tiles selected to save."); return; }
            if (!tilesetName) {
                const currentLayerTilesetCount = window.userLayers[window.selectedLayerId].tilesetCount || 0;
                tilesetName = `Tileset ${currentLayerTilesetCount + 1}`;
            }
            const isSavingGroup = selectedFeatures.some(f => f.get('isGroupSelection'));
            if (isSavingGroup) {
                alert("Cannot save a selected tileset group. Please clear selection and select individual tiles."); return;
            }
            const targetSource = window.userLayers[window.selectedLayerId].layer.getSource();
            const existingFeaturesInLayer = targetSource.getFeatures();
            const existingTileIdsInLayer = new Set(existingFeaturesInLayer.map(f => f.get('tileId')).filter(id => id));
            let overlapFound = false;
            for (const selectedFeature of selectedFeatures) {
                const tileId = selectedFeature.getId();
                if (!tileId || !tileId.includes('-')) { alert("Error: Invalid selection data."); return; }
                if (existingTileIdsInLayer.has(tileId)) { overlapFound = true; break; }
            }
            if (overlapFound) {
                alert("Cannot save: Selection overlaps with an existing tileset in this layer."); return;
            }
            const featuresToAdd = [];
            const tilesetGroupId = `tileset-group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            let tilesetFeatureCounter = 0;
            selectedFeatures.forEach(feature => {
                const tileId = feature.getId();
                if (!tileId || !tileId.includes('-')) { return; }
                const clonedFeature = feature.clone();
                const featureId = `tileset-tile-${tilesetGroupId}-${tilesetFeatureCounter++}`;
                clonedFeature.setId(featureId);
                clonedFeature.set('tilesetName', tilesetName);
                clonedFeature.set('tilesetGroupId', tilesetGroupId);
                clonedFeature.set('tileId', tileId);
                clonedFeature.set('isVisible', true);
                const chosenColor = detailsColorPicker?.value;
                const lowerChosenColor = chosenColor ? chosenColor.toLowerCase() : "";
                const isBlack = lowerChosenColor === '#000000' || lowerChosenColor === 'black' || lowerChosenColor === 'rgb(0,0,0)' || lowerChosenColor.startsWith('rgba(0,0,0');
                clonedFeature.set('color', chosenColor && chosenColor !== "" && !isBlack ? chosenColor : '#90EE90');
                let opacityValue = detailsFillOpacityInput ? parseFloat(detailsFillOpacityInput.value) : 0.6;
                if (isNaN(opacityValue)) { opacityValue = 0.6; }
                clonedFeature.set('fillOpacity', opacityValue);
                clonedFeature.set('strokeWidth', detailsStrokeWidthInput ? parseFloat(detailsStrokeWidthInput.value) : 0.5);
                clonedFeature.unset('isIndividualSelection');
                featuresToAdd.push(clonedFeature);
            });

            if (featuresToAdd.length > 0) {
                targetSource.addFeatures(featuresToAdd);
                console.log(`%cSAVE HANDLER: Added ${featuresToAdd.length} features to targetSource.`, "color: green;");
                
                // Explicitly remove original features from temporary selection NOW
                // Note: selectedFeatures was defined earlier in this function
                if (selectedFeatures && selectionSource) {
                    selectedFeatures.forEach(originalFeature => {
                        originalFeature.unset('isIndividualSelection'); // Ensure flag is removed from original too
                        const featureId = originalFeature.getId();
                        if (featureId && selectionSource.getFeatureById(featureId)) {
                            selectionSource.removeFeature(originalFeature);
                        }
                    });
                    console.log("SAVE HANDLER: Unset isIndividualSelection and explicitly removed original features from selectionSource.");
                }

                window.userLayers[window.selectedLayerId].tilesetCount = (window.userLayers[window.selectedLayerId].tilesetCount || 0) + 1;
console.log("%cSAVE HANDLER: populateTilesetList has been called from save handler.", "color: green; font-weight: bold;");
                clearMapSelectionAndDetails(); // This will also call selectionSource.clear(), which is fine.
                populateTilesetList(window.selectedLayerId); // Call directly, remove setTimeout
                tilesetNameInput.value = '';

                if (window.ogSavedTilesetsLayer) {
                    window.ogSavedTilesetsLayer.clear();
                    console.log("DEBUG: ogSavedTilesetsLayer cleared after saving new tileset.");
                }
                // Fallback redraws (previously misplaced)
                // Note: .redraw() is often for specific layer types, .clear() is more general for CanvasTiles for full refresh
                // if (ogSavedTilesetsLayer && typeof ogSavedTilesetsLayer.redraw === 'function') {
                //     console.log("saveSelectionBtn: Calling ogSavedTilesetsLayer.redraw() after saving selection.");
                //     ogSavedTilesetsLayer.redraw();
                // } else if (window.globus && window.globus.renderer) {
                //     console.log("saveSelectionBtn: Calling globus.renderer.draw() as fallback redraw for saved tilesets.");
                //     window.globus.renderer.draw();
                // }
            }
        }); // End of addEventListener callback
        state.saveSelectionListenerAttached = true;
        console.log("Save selection listener ATTACHED.");
    } else if (saveSelectionBtn && state.saveSelectionListenerAttached) {
        console.log("Save selection listener ALREADY attached (not re-attaching).");
    } else {
        console.warn("DEBUG: saveSelectionBtn not found, event listener not attached.");
    }
    
    // Initial UI setup calls
    if (window.userLayers && window.userLayers[window.selectedLayerId] && userLayerList) { // Check if userLayers and selectedLayerId are ready
        addLayerToList(window.selectedLayerId, window.userLayers[window.selectedLayerId].name, true);
        selectLayerInList(window.selectedLayerId);
    }
    updateSelectionActionsVisibility(); // Initial state
    updateSelectedTileCountDisplay();   // Initial state

    // Set initial interaction mode button text and cursor
    // The following block was removed as it caused an inconsistent initial interaction state,
    // overriding the 'pan' mode that was set up earlier (around line 459).
    // The application now consistently starts in 'pan' mode, with OpenLayers interactions
    // (dragPan active, dragBox inactive) and UI correctly reflecting this initial state.
    // This ensures that single-click tile selection works as expected from the start.
    // ---- Removed block ----
    // if (interactionModeBtn) {
    //     // Initial mode is set based on OpenLayers interactions further down
    //     // interactionModeBtn.textContent = 'Mode: Select Tiles';
    // }
    // const mapElementOLRef = document.getElementById('map'); // Re-fetch for safety
    // if (mapElementOLRef) {
    //     mapElementOLRef.style.cursor = 'crosshair'; // Default to select cursor
    // }
    // currentInteractionMode = 'select'; // Ensure mode variable matches
    // if (dragPanInteraction) dragPanInteraction.setActive(false); // Start with pan off
    // if (dragBoxInteraction) dragBoxInteraction.setActive(true); // Start with drag box on
    // ---- End of removed block ----

    // --- End User Layer and Tileset List Management ---

    // --- OpenLayers Map Initialization ---
    let gridUpdateTimeoutOL;
    function updateZ21GridOL() {
        if (!state.olMap || !gridLayerZ21 || !selectionTileGrid) { // Use state.olMap
            console.warn("updateZ21GridOL: Map or grid components not ready");
            return;
        }
        const currentZoom = state.olMap.getView().getZoom(); // Use state.olMap
        const showGrid = currentZoom >= GRID_VISIBILITY_MIN_ZOOM;
        gridLayerZ21.setVisible(showGrid);
        const gridSourceZ21 = gridLayerZ21.getSource();
        if (!showGrid) {
            gridSourceZ21.clear();
            return;
        }
        clearTimeout(gridUpdateTimeoutOL);
        gridUpdateTimeoutOL = setTimeout(() => {
            console.time('updateZ21GridOL');
            console.log(`Grid update at zoom level: ${currentZoom.toFixed(2)}`);
            gridSourceZ21.clear();
            const view = state.olMap.getView(); // Use state.olMap
            const mapSize = state.olMap.getSize(); // Use state.olMap
            if (!mapSize || mapSize.some(s => s <= 0)) {
                console.warn("Map size not available or invalid for ZL21 grid update.");
                console.timeEnd('updateZ21GridOL');
                return;
            }
            const extent = view.calculateExtent(mapSize);
            const features = [];
            try {
                selectionTileGrid.forEachTileCoord(extent, TILE_SELECTION_ZOOM, function (tileCoord) {
                    const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                    features.push(new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) }));
                });
                gridSourceZ21.addFeatures(features);
            } catch (error) {
                console.error("Error generating ZL21 grid for OpenLayers:", error);
            } finally {
                console.timeEnd('updateZ21GridOL');
            }
        }, 150);
    }

    // --- Globe Click Handler for OpenGlobus (from reference) ---
    // Removed duplicate/older handleGlobeClick function.
    // The primary one is defined later and used by the event listener.

    // Attach Click Listener directly to OpenGlobus Canvas (after globus init)
    setTimeout(() => {
        if (window.globus && window.globus.renderer && window.globus.renderer.handler && window.globus.renderer.handler.canvas) {
            const canvas = window.globus.renderer.handler.canvas;
            canvas.addEventListener('click', (event) => {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const mouse = { x: x, y: y, event: event };
                handleGlobeClick(mouse, "Canvas DOM click");
            });
            console.log("DEBUG: Attached DOM click listener directly to OpenGlobus canvas.");
        } else {
            console.error("Could not find OpenGlobus canvas to attach click listener after delay (ran from DOMContentLoaded).");
        }
    }, 1500); // Increased delay to ensure globus is fully ready

    // --- OpenGlobus Initialization Variables ---
    let ogBaseLayers = {};
    let gridLayerOG = null;
    let ogSavedTilesetsLayer = null;
    // let selectedGlobeTiles = []; // Removed: Selection state is now unified in OpenLayers selectionSource
    let tileCubeLayer = null; // Layer for the ZL21 tile *indicator* cube on OpenGlobus
    let selectedTileCubeEntity = null; // The currently displayed indicator cube entity on OpenGlobus
    console.log("DEBUG: OpenGlobus related variables declared.");

    function initializeOpenGlobus() {
            console.log("%cDEBUG: initializeOpenGlobus function ENTERED.", "color: orange; font-weight: bold;");
    
            if (typeof og === 'undefined') {
                console.error("%cFATAL ERROR: OpenGlobus library (og) is NOT DEFINED. Cannot initialize globe.", "color: red; font-size: 1.2em; font-weight: bold;");
                return;
            }
            if (window.globus) {
                console.warn("%cWARN: window.globus object already exists. Skipping re-initialization.", "color: yellow; font-weight: bold;");
                return;
            }
    
            try {
                console.log("DEBUG: Attempting to create og.Globe instance...");
                window.ogBaseLayers = {};
    
                const osmOgLayer = new og.layer.XYZ("OpenStreetMap", {
                    isBaseLayer: true,
                    url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    visibility: false,
                    attribution: '© OpenStreetMap contributors'
                });
                const satelliteOgLayer = new og.layer.XYZ("Satellite", {
                    isBaseLayer: true,
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    visibility: true,
                    attribution: 'Tiles © ArcGIS'
                });
                const initialOgLayers = [osmOgLayer, satelliteOgLayer];
                window.ogBaseLayers['osm'] = osmOgLayer;
                window.ogBaseLayers['satellite'] = satelliteOgLayer;
                console.log("DEBUG: Base layers prepared for OpenGlobus.");
    
                // globusRgbTerrainInstance will be created inside setTimeout
                const globusContainerElement = document.getElementById('globusContainer');
                if (!globusContainerElement) {
                    console.error("%cFATAL ERROR: 'globusContainer' DIV not found in DOM. Cannot initialize globe.", "color: red; font-size: 1.2em; font-weight: bold;");
                    return;
                }
                console.log("DEBUG: 'globusContainer' DIV found:", globusContainerElement);
    
                // Set the resources URL for OpenGlobus
                if (window.OG_RESOURCES_PATH && og.webgl && og.webgl.Handler) {
                    og.webgl.Handler.RESOURCES_URL = window.OG_RESOURCES_PATH;
                    console.log(`DEBUG: Set OpenGlobus RESOURCES_URL to: ${og.webgl.Handler.RESOURCES_URL}`);
                } else {
                    console.warn("DEBUG: window.OG_RESOURCES_PATH or OpenGlobus handler not available to set resources URL.");
                }
// Removing current definition of updateCesiumZL21Grid to redefine it earlier.

                window.globus = new og.Globe({
                    target: globusContainerElement,
                    name: "OpenGlobus View",
                    layers: initialOgLayers,
// Misplaced updateCesiumZL21Grid function removed.
// It was inserted inside the new og.Globe options object.
                    terrain: new og.terrain.EmptyTerrain(), // Initialize with EmptyTerrain directly
                    lon: -74.0445,
                    lat: 40.6892,
                    alt: 3000, // Initial constructor altitude
                    resourcesSrc: "/packages/openglobus/res",
                    fontsSrc: "/packages/openglobus/res/fonts"
                }); // Correctly close new og.Globe call here
                    // controls: [new og.control.LayerSwitcher()] // Controls will be added later

            if (window.globus) {
                console.log("%cDEBUG: og.Globe constructor SUCCEEDED. window.globus object created.", "color: green; font-weight: bold;", window.globus);
                // LayerSwitcher is now added via constructor options.
                // const layerSwitcher = new og.control.LayerSwitcher({
                //     // Optionally, you can configure the LayerSwitcher here, e.g.,
                //     // autoActivate: true,
                //     // TIP: Check OpenGlobus documentation for LayerSwitcher options
                // });
                // window.globus.planet.addControl(layerSwitcher);
                // console.log("DEBUG: Added og.control.LayerSwitcher to the globe.");

            } else {
                console.error("%cFATAL ERROR: og.Globe constructor FAILED or did not assign to window.globus.", "color: red; font-size: 1.2em; font-weight: bold;");
                return;
            }

            if (window.globus.planet) {
                console.log("%cDEBUG: window.globus.planet object IS ACCESSIBLE.", "color: #28a745; font-weight: bold;", window.globus.planet);

                // The early explicit setTerrain call (previously here) is now moved to the setTimeout with renderer.resize
                // to align with the "working" version's timing.
                
                // Check initial terrain (will likely be 'empty' or undefined now, before the delayed setTerrain)
                if (window.globus.planet.terrain && window.globus.planet.terrain.name === 'GlobusEarthRgb') {
                    console.log("%cSUCCESS: Globe constructor correctly set GlobusRgbTerrain initially!", "color: green; font-weight: bold;");
                    const terrainCtrl = window.globus.planet.terrain;
                    console.log("%cTERRAIN CHECKPOINT 1 (Direct Init): Planet has 'GlobusEarthRgb'.", "color: #FF8C00; font-size: 1.1em; font-weight: bold;", terrainCtrl);
                    console.log("  URL:", terrainCtrl.url);
                    terrainCtrl.enabled = true; // Ensure enabled
                    console.log("  Enabled state:", terrainCtrl.enabled);

                    if (window.globus.planet.renderer && typeof window.globus.planet.renderer.frame === 'function') {
                        window.globus.planet.renderer.frame(); // Attempt to refresh view
                    }

                    // Optional: Add a small delay to check readiness if needed
                    setTimeout(() => {
                        if (window.globus && window.globus.planet && window.globus.planet.terrain && window.globus.planet.terrain.name === 'GlobusEarthRgb') {
                            const rt = window.globus.planet.terrain;
                            const isR = typeof rt.isReady === 'function' ? rt.isReady() : "N/A";
                            const isA = typeof rt.isActive === 'function' ? rt.isActive() : "N/A";
                            console.log(`%cTERRAIN CHECKPOINT 2 (Direct Init, 3s delay):`, "color: #FF8C00; font-size: 1.1em; font-weight: bold;");
                            console.log(`  Enabled: ${rt.enabled}, URL: ${rt.url}, Ready: ${isR}, Active: ${isA}`);
                            if(rt.enabled && isR === true && (isA === true || isA === "N/A" )) {
                                console.log("%cSUCCESS: GlobusRgbTerrain seems enabled and ready/active after direct init!", "color:green; font-weight:bold;");
                            } else {
                                console.warn("WARNING: GlobusRgbTerrain NOT fully enabled/ready/active after 3s (direct init). Check console for network errors for its URL.");
                            }
                        } else {
                             console.warn("TERRAIN CHECKPOINT 2 (Direct Init): GlobusRgbTerrain no longer active or planet/terrain missing after 3s.");
                        }
                    }, 3000);

                } else {
                    console.info("INFO: Globe constructor initialized with EmptyTerrain as per current strategy. Current terrain:", window.globus.planet.terrain);
                }
                // The old setTimeout for switching terrain is now removed.
                console.log("  DEBUG: typeof window.globus.planet.flyTo:", typeof window.globus.planet.flyTo); // Should be undefined
                console.log("  DEBUG: typeof window.globus.planet.setCamera:", typeof window.globus.planet.setCamera); // Should be undefined
                console.log("  DEBUG: typeof window.globus.planet.getViewpoint:", typeof window.globus.planet.getViewpoint); // Might be undefined or function

                if (window.globus.planet.camera) {
                    console.log("%c  DEBUG: window.globus.planet.camera object exists.", "color: #17a2b8;", window.globus.planet.camera);
                    console.log("    DEBUG: typeof window.globus.planet.camera.setPosition:", typeof window.globus.planet.camera.setPosition); // Undefined
                    console.log("    DEBUG: typeof window.globus.planet.camera.setLonLat:", typeof window.globus.planet.camera.setLonLat); // function
                    console.log("    DEBUG: typeof window.globus.planet.camera.setAltitude:", typeof window.globus.planet.camera.setAltitude); // function
                    console.log("    DEBUG: typeof window.globus.planet.camera.getAltitude:", typeof window.globus.planet.camera.getAltitude); // function
                    console.log("    DEBUG: typeof window.globus.planet.camera.flyLonLat:", typeof window.globus.planet.camera.flyLonLat); // function?
                    console.log("    DEBUG: typeof window.globus.planet.camera.setView:", typeof window.globus.planet.camera.setView); // function?
                    console.log("    DEBUG: typeof window.globus.planet.camera.update:", typeof window.globus.planet.camera.update); // function?

                    if(typeof window.globus.planet.camera.getAltitude === 'function'){
                        console.log("    DEBUG: Initial camera altitude after Globe creation:", window.globus.planet.camera.getAltitude());
                    }
                    // Skipping full camera method listing to avoid internal OpenGlobus errors from prototype walk
                    console.log("    DEBUG: (Skipping full camera method listing to avoid internal OpenGlobus errors)");
                } else {
                    console.warn("  DEBUG: window.globus.planet.camera is NULL or UNDEFINED post-initialization.");
                }
                
                try { // Listing methods on planet itself
                    const planetMethods = Object.getOwnPropertyNames(window.globus.planet)
                        .filter(prop => typeof window.globus.planet[prop] === 'function');
                    console.log("%c  DEBUG: Available direct methods on window.globus.planet:", "color: #007bff; font-weight: bold;", planetMethods);
                } catch (e) {
                    console.error("  Error getting direct methods from window.globus.planet:", e);
                }

console.log("%cDEBUG: PRE-INSTANTIATION of ogSavedTilesetsLayer", "color: yellow; font-weight: bold;");
                window.ogSavedTilesetsLayer = new og.layer.CanvasTiles("Saved Tilesets", {
                    visibility: true, // Make it visible by default
                    minZoom: 15, // Show from zoom level 15
                    maxZoom: 22, // Allow drawing up to a high zoom level
                    opacity: 0.9, // Increased opacity
                    drawTile: function (material, applyTexture) {
                        const canvas = document.createElement("canvas");
                        const size = 256;
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');

                        if (!ctx || !material.segment) {
                            applyTexture(canvas); return;
                        }

                        const tileZoom = material.segment.tileZoom;
                        const tileX = material.segment.tileX;
                        const tileY = material.segment.tileY;
                        const ogTileId = (typeof getTileId === 'function') ? getTileId([tileZoom, tileX, tileY]) : `${tileZoom}-${tileX}-${tileY}`;
                        
                        let drawn = false;
                        const TILE_SELECTION_ZOOM_CONST = 21; // Define TILE_SELECTION_ZOOM if not global

                        if (tileZoom >= this.minZoom && tileZoom < TILE_SELECTION_ZOOM_CONST) {
                            // New logic for rendering scaled ZL21 tiles onto overview tiles (ZL15-ZL20)
                            const overviewTileGeoExtent = material.segment.getExtent();

                            if (!(window.selectedLayerId && window.userLayers && window.userLayers[window.selectedLayerId])) {
                                return;
                            }
                            const olLayerSource = window.userLayers[window.selectedLayerId].layer.getSource();
                            if (!olLayerSource || olLayerSource.getFeatures().length === 0) {
                                return;
                            }
                            const zl21Features = olLayerSource.getFeatures();
                            let somethingWasDrawnOnOverview = false;

                            zl21Features.forEach(feature => {
                                const tileIdStr = feature.get('tileId');
                                if (!tileIdStr) return;
                                const parts = tileIdStr.split('-').map(Number);
                                if (parts.length !== 3 || parts[0] !== TILE_SELECTION_ZOOM_CONST) return;

                                const zl21TileX = parts[1];
                                const zl21TileY = parts[2];
                                const zl21FeatureGeoExtent = og.mercator.getTileExtent(zl21TileX, zl21TileY, TILE_SELECTION_ZOOM_CONST);
                                // console.log("OG DrawTile Overview: overviewTileGeoExtent type:", typeof overviewTileGeoExtent, overviewTileGeoExtent);
                                // console.log("OG DrawTile Overview: zl21FeatureGeoExtent type:", typeof zl21FeatureGeoExtent, zl21FeatureGeoExtent);
                                // console.log("OG DrawTile Overview: overviewTileGeoExtent.intersects exists:", typeof overviewTileGeoExtent?.intersects);

                                if (overviewTileGeoExtent && typeof overviewTileGeoExtent.intersects === 'function' && zl21FeatureGeoExtent && overviewTileGeoExtent.intersects(zl21FeatureGeoExtent)) {
                                    let tileColorToDraw = feature.get('color') || '#008080';
                                    let featureFillOpacity = feature.get('fillOpacity') === undefined ? 0.6 : feature.get('fillOpacity');
                                    if (tileColorToDraw.startsWith('#')) {
                                        let r = 0, g = 0, b = 0;
                                        let cVal = tileColorToDraw.substring(1).split('');
                                        if (cVal.length === 3) { cVal = [cVal[0], cVal[0], cVal[1], cVal[1], cVal[2], cVal[2]]; }
                                        cVal = '0x' + cVal.join('');
                                        r = (cVal >> 16) & 255; g = (cVal >> 8) & 255; b = cVal & 255;
                                        tileColorToDraw = `rgba(${r},${g},${b},${featureFillOpacity})`;
                                    } else if (tileColorToDraw.startsWith('rgba')) {
                                        tileColorToDraw = tileColorToDraw.replace(/[\d\.]+\)$/, `${featureFillOpacity})`);
                                    }
                                    ctx.fillStyle = tileColorToDraw;

                                    const zl21CenterLon = (zl21FeatureGeoExtent.southWest.lon + zl21FeatureGeoExtent.northEast.lon) / 2;
                                    const zl21CenterLat = (zl21FeatureGeoExtent.southWest.lat + zl21FeatureGeoExtent.northEast.lat) / 2;
                                    const pixelPos = material.segment.projectGeoToPixel(zl21CenterLon, zl21CenterLat, overviewTileGeoExtent);
                                    
                                    if (pixelPos) {
                                        const zoomDiff = TILE_SELECTION_ZOOM_CONST - tileZoom;
                                        const scaleFactor = Math.pow(2, zoomDiff);
                                        const scaledSize = Math.max(1, size / scaleFactor); // Ensure at least 1 pixel
                                        const rectX = pixelPos.x - scaledSize / 2;
                                        const rectY = pixelPos.y - scaledSize / 2;

                                        if (rectX < size && rectY < size && rectX + scaledSize > 0 && rectY + scaledSize > 0) {
                                             ctx.fillRect(rectX, rectY, scaledSize, scaledSize);
                                             somethingWasDrawnOnOverview = true;
                                        }
                                    }
                                }
                            });
                            if (somethingWasDrawnOnOverview) {
                                drawn = true;
                            }
                        } // Closes: if (tileZoom >= this.minZoom && tileZoom < TILE_SELECTION_ZOOM_CONST)
                        else if (tileZoom === TILE_SELECTION_ZOOM_CONST) {
                            // Existing logic for drawing exact ZL21 tiles
                            // 1. Check for temporary individual selections
                            let isSavedInCurrentUserLayer = false;
                            if (window.selectedLayerId && window.userLayers && window.userLayers[window.selectedLayerId]) {
                                const currentLayerSource = window.userLayers[window.selectedLayerId].layer.getSource();
                                if (currentLayerSource && currentLayerSource.getFeatures().some(f => f.get('tileId') === ogTileId)) {
                                    isSavedInCurrentUserLayer = true;
                                }
                            }

                            const tempSelectedFeature = selectionSource ? selectionSource.getFeatures().find(f => (f.getId() === ogTileId || f.get('tileId') === ogTileId) && f.get('isIndividualSelection') === true) : null;
                            
                            // Enhanced logging for the problematic tile
                            if (ogTileId === window.debugLastSavedTileIdByGlobe) { // window.debugLastSavedTileIdByGlobe would be set in saveSelectionToLayer
                                console.log(`%cOG DrawTile DEBUG for ${ogTileId}: isSavedInCurrentUserLayer = ${isSavedInCurrentUserLayer}, tempSelectedFeature exists = ${!!tempSelectedFeature}`, "color: magenta; font-weight: bold;");
                                if (tempSelectedFeature) console.log(`%cOG DrawTile DEBUG for ${ogTileId}: tempSelectedFeature.isIndividualSelection = ${tempSelectedFeature.get('isIndividualSelection')}`, "color: magenta;");
                            }

                            if (tempSelectedFeature && !isSavedInCurrentUserLayer) { // Only draw yellow if temporary AND not yet saved to current layer
                                ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
                                ctx.fillRect(0, 0, size, size);
                                ctx.strokeStyle = "rgba(255, 200, 0, 0.8)";
                                ctx.lineWidth = 3;
                                ctx.strokeRect(0, 0, size, size);
                                console.log(`%cOG DrawTile: Drawing TEMP INDIVIDUAL SELECTION ${ogTileId}`, "color: yellow; background: black;");
                                drawn = true;
                            }
                            // 2. Else, check for saved tilesets in the active layer (this will now also catch tiles that were tempSelected but are now saved)
                            else if (window.selectedLayerId && window.userLayers && window.userLayers[window.selectedLayerId]) {
                                const olLayerSource = window.userLayers[window.selectedLayerId].layer.getSource();
                                // console.log(`OG DrawTile ZL21: Searching for ogTileId='${ogTileId}'. Features in source:`, olLayerSource.getFeatures().map(f => f.get('tileId')));
                                const feature = olLayerSource.getFeatures().find(f => f.get('tileId') === ogTileId);

                                if (feature) {
                                    let tileColorStr = feature.get('color') || '#008080'; // Default saved color
                                let featureFillOpacity = feature.get('fillOpacity') === undefined ? 0.6 : feature.get('fillOpacity');
                                const featureGroupId = feature.get('tilesetGroupId');

                                // Convert hex to rgba with the feature's opacity
                                if (tileColorStr.startsWith('#')) {
                                    let r = 0, g = 0, b = 0;
                                    let cVal = tileColorStr.substring(1).split('');
                                    if (cVal.length === 3) { cVal = [cVal[0], cVal[0], cVal[1], cVal[1], cVal[2], cVal[2]]; }
                                    cVal = '0x' + cVal.join('');
                                    r = (cVal >> 16) & 255;
                                    g = (cVal >> 8) & 255;
                                    b = cVal & 255;
                                    tileColorStr = `rgba(${r},${g},${b},${featureFillOpacity})`;
                                } else if (tileColorStr.startsWith('rgba')) {
                                    tileColorStr = tileColorStr.replace(/[\d\.]+\)$/, `${featureFillOpacity})`);
                                }
                                
                                ctx.fillStyle = tileColorStr;
                                ctx.fillRect(0, 0, size, size);
                                // console.log(`OG DrawTile: Drawing SAVED ${ogTileId} from group ${featureGroupId} with color ${tileColorStr}`);
                                drawn = true;

                                // Highlight if it's part of the selected/highlighted group
                                // console.log(`OG DrawTile: Tile ${ogTileId}, GroupID: ${featureGroupId}, HighlightedGroupID: ${window.highlightedGlobeGroupId}`); // Verbose
                                if (featureGroupId && featureGroupId === window.highlightedGlobeGroupId) {
                                    // Apply a semi-transparent cyan fill for highlight, then the border
                                    const originalFill = ctx.fillStyle; // Save original fill
                                    ctx.fillStyle = "rgba(0, 220, 220, 0.5)"; // Increased opacity for cyan fill
                                    ctx.fillRect(0, 0, size, size);
                                    // ctx.fillStyle = originalFill; // Restore original fill if needed for other elements on same tile (not currently the case)

                                    ctx.strokeStyle = "rgba(0, 255, 255, 1.0)"; // Fully opaque cyan border
                                    ctx.lineWidth = 4; // Make border prominent
                                    ctx.strokeRect(0, 0, size, size);
                                    console.log(`%cOG DrawTile: HIGHLIGHTING group ${featureGroupId} for tile ${ogTileId}`, "color: cyan; background: black;");
                                } else if (featureGroupId) {
                                    // console.log(`OG DrawTile: Tile ${ogTileId} (group ${featureGroupId}) NOT highlighted. Current highlight: ${window.highlightedGlobeGroupId}`);
                                }
                            }
                        }
                        } // Closes: else if (tileZoom === TILE_SELECTION_ZOOM_CONST)

                        if (!drawn) {
                            ctx.clearRect(0, 0, size, size);
                        }
                        applyTexture(canvas);
                    }
                });
                window.globus.planet.addLayer(window.ogSavedTilesetsLayer);
                console.log("DEBUG: ogSavedTilesetsLayer added to planet. Layer object:", window.ogSavedTilesetsLayer);
                if (window.ogSavedTilesetsLayer) {
                    console.log(`DEBUG: ogSavedTilesetsLayer properties after add: _visibility=${window.ogSavedTilesetsLayer._visibility}, _planet exists=${!!window.ogSavedTilesetsLayer._planet}`);
console.log("%cDEBUG: POST-INSTANTIATION of ogSavedTilesetsLayer & addLayer call", "color: yellow; font-weight: bold;");
                }


                // Instantiate gridLayerOG properly BEFORE any check that might log it wasn't created
                // This ensures gridLayerOG is an object before the subsequent 'if (gridLayerOG)' check.
                window.gridLayerOG = new og.layer.CanvasTiles("ZL21 Grid", {
                    minZoom: 16,
                    maxZoom: 21,
                    visibility: true,
                    opacity: 1.0,
                    drawTile: function (material, applyTexture) {
                        const canvas = document.createElement("canvas");
                        const size = 256;
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');

                        if (!ctx) {
                            console.error("gridLayerOG: Failed to get 2D context");
                            applyTexture(canvas);
                            return;
                        }
                        if (!material.segment) {
                            console.warn("drawTile called with null material.segment for ZL21 Grid");
                            applyTexture(canvas);
                            return;
                        }

                        const currentTileZoom = material.segment.tileZoom;
                        const targetGridZoom = 21;

                        ctx.clearRect(0, 0, size, size);

                        // Check if this tile is selected in the OpenLayers selectionSource
                        if (selectionSource && typeof getTileId === 'function' && currentTileZoom === TILE_SELECTION_ZOOM) {
                            const tileX = material.segment.tileX;
                            const tileY = material.segment.tileY;
                            const tileId = getTileId([currentTileZoom, tileX, tileY]);
                            const selectedFeature = selectionSource.getFeatureById(tileId);
                            if (selectedFeature) {
                                ctx.fillStyle = 'rgba(255, 255, 0, 0.4)'; // Semi-transparent yellow for selection
                                ctx.fillRect(0, 0, size, size);
                            }
                        }

                        // Draw grid lines if within visible zoom range for the grid itself
                        if (currentTileZoom >= this.minZoom && currentTileZoom <= this.maxZoom) {
                            const lineWeight = (currentTileZoom === targetGridZoom) ? 2 : 1; // Thicker lines at target ZL21
                            ctx.lineWidth = lineWeight;
                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'; // Slightly transparent black for grid

                            const maxZoomDiff = 5; // Max zoom levels to show subgrids for
                            const zoomDiff = Math.min(targetGridZoom - currentTileZoom, maxZoomDiff);
                            
                            if (zoomDiff >= 0) { // Only draw grid if current zoom is <= targetGridZoom
                                const subdivisions = Math.pow(2, zoomDiff);
                                const step = size / subdivisions;

                                if (subdivisions > 1) {
                                    for (let i = 1; i < subdivisions; i++) {
                                        const x = i * step;
                                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
                                    }
                                    for (let j = 1; j < subdivisions; j++) {
                                        const y = j * step;
                                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
                                    }
                                }
                                // Draw border for the main tile canvas of this grid layer
                                ctx.beginPath(); ctx.rect(0, 0, size, size); ctx.stroke();
                            }
                        }
                        applyTexture(canvas);
                    }
                });
                console.log("DEBUG: gridLayerOG instantiated (CanvasTiles from reference).");
                window.globus.planet.addLayer(window.gridLayerOG);
                console.log("DEBUG: gridLayerOG added to planet.");

                // The following block (lines 265-293 in the previous state) was a duplicate instantiation and is now removed.
                // The primary instantiation of gridLayerOG is now handled by the block starting at line 231.
                // The if (gridLayerOG) check to add the layer will now use the correctly instantiated version.
                // console.log("DEBUG: All overlay layer additions (ogSavedTilesetsLayer, gridLayerOG) SKIPPED for isolation test."); // Commented out
        
                window.tileCubeLayer = new og.layer.Vector("Tile Cube Indicator", { 'pickingEnabled': false });
                if (window.globus && window.globus.planet) {
                    window.globus.planet.addLayer(window.tileCubeLayer);
                    console.log("DEBUG: Created and added tileCubeLayer to OpenGlobus.");
                } else {
                    console.warn("DEBUG: Could not add tileCubeLayer, globus or planet not ready.");
                }

                // Add controls here, matching mundial5-13 structure
                if (window.globus && window.globus.planet) {
                    window.globus.planet.addControl(new og.control.ZoomControl());
                    window.globus.planet.addControl(new og.control.LayerSwitcher());
                    console.log("DEBUG: OpenGlobus controls (Zoom, LayerSwitcher) added via addControl.");
                }
        
                setTimeout(() => {
                    if (window.globus && window.globus.planet && typeof window.globus.planet.setTerrain === 'function') {
                        console.log("%cAttempting to switch to GlobusRgbTerrain in setTimeout (restoring mundial5-13 logic)...", "color: orange; font-weight: bold;");
                        const globusRgbTerrainInstance = new og.terrain.GlobusRgbTerrain({
                            heightFactor: 1.0,
                            maxNativeZoom: 17 // Request 17
                        });

                        if (globusRgbTerrainInstance) {
                            console.log(`%cDEBUG: GlobusRgbTerrain created. Requested maxNativeZoom: 17, Actual from instance: ${globusRgbTerrainInstance.maxNativeZoom}`, "color: red; font-weight: bold;");
                            console.log("%cDEBUG: URL of GlobusRgbTerrain instance:", "color: orange; font-weight: bold;", globusRgbTerrainInstance.url);
                            
                            console.log("%cATTEMPTING EXPLICIT planet.setTerrain(GlobusRgbTerrain) (delayed)...", "color: #FF8C00; font-weight: bold;");
                            window.globus.planet.setTerrain(globusRgbTerrainInstance);
                            console.log("DEBUG: After DELAYED explicit setTerrain, planet.terrain is:", window.globus.planet.terrain);

                            if (window.globus.planet.terrain && window.globus.planet.terrain.maxNativeZoom < 15) { // Check the actual terrain set
                                console.warn(`WARNING: GlobusRgbTerrain maxNativeZoom is low (${window.globus.planet.terrain.maxNativeZoom}). Globe detail will be limited. Globe may appear black or unresponsive if zoomed too far.`);
                            }
                        } else {
                            console.error("ERROR: Failed to create GlobusRgbTerrain instance in setTimeout.");
                        }

                        // Resize renderer after attempting to set terrain
                        if (window.globus.planet.renderer && typeof window.globus.planet.renderer.resize === 'function') {
                            console.log("DEBUG: Performing resize of OpenGlobus renderer (after delayed terrain set).");
                            window.globus.planet.renderer.resize();
                        } else {
                            console.warn("DEBUG: Could not resize OpenGlobus renderer; renderer or resize method not ready in setTimeout.");
                        }
                    } else {
                        console.warn("DEBUG: Globus, planet, or setTerrain not ready for delayed terrain switch in setTimeout.");
                    }
                }, 200); // Match delay from mundial5-13/js/main.js

                if (window.globus && window.globus.planet && window.globus.planet.events) {
                    console.log("%cDEBUG: window.globus.planet.events object found. Attaching 'lclick' and 'rclick' event listeners.", "color: blue; font-weight: bold;", window.globus.planet.events);
                    window.globus.planet.events.on("lclick", (mouse) => handleGlobeClick(mouse, 'lclick'));
                    window.globus.planet.events.on("rclick", (mouse) => handleGlobeClick(mouse, 'rclick'));
                    console.log("DEBUG: OpenGlobus event listeners for lclick and rclick successfully attached.");
                } else {
                    console.error("CRITICAL ERROR: window.globus.planet.events is NOT DEFINED or planet/globus missing. Click listeners CANNOT be attached.",
                                  "globus:", window.globus,
                                  "planet:", window.globus ? window.globus.planet : "N/A",
                                  "events:", window.globus && window.globus.planet ? window.globus.planet.events : "N/A");
                }
                // console.log("DEBUG: Click listener attachment SKIPPED for isolation test."); // Commented out

                // Terrain Activation and Logging (Enhanced)
                // Terrain checkpoint logging simplified for this minimal test
                // Restore detailed Terrain Activation and Logging
                if (window.globus.planet.terrain) {
                // The main terrain checkpoint logging is now inside the delayed setTerrain logic for GlobusRgbTerrain
                // For EmptyTerrain, we just log its initial state from the constructor.
                if (window.globus.planet.terrain && window.globus.planet.terrain.name === 'empty') {
                     console.log("TERRAIN CHECK (Initial - EmptyTerrain): Name:", window.globus.planet.terrain.name, "Enabled:", window.globus.planet.terrain.enabled);
                } else if (window.globus.planet.terrain) {
                     console.warn("TERRAIN CHECK (Initial): Expected EmptyTerrain, but got:", window.globus.planet.terrain.name);
                } else {
                    console.error("CRITICAL ERROR: window.globus.planet.terrain is MISSING after constructor (Minimal Setup).");
                }
            }

            else {
                console.error("%cERROR: window.globus exists, but window.globus.planet is NULL or UNDEFINED post-initialization! Cannot add layers or controls.", "color: red; font-weight: bold;");
            }
            console.log("OpenGlobus initialization sequence completed in JS.");
        }
        } catch (e) {
            console.error("%cFATAL ERROR during OpenGlobus initialization (new og.Globe call or subsequent setup):", "color: red; font-size: 1.2em; font-weight: bold;", e);
            window.globus = null;
        }
    } // End function initializeOpenGlobus

    function handleGlobeClick(mouse, eventName) {
        console.log(`%cHANDLEGLOBECLICK: Event '${eventName}' received. Current interaction mode: ${currentInteractionMode}`, "color: magenta; font-size: 1.1em; font-weight: bold;", "Mouse data:", mouse);

        // Mode check removed: Globe single-click selection should always be active,
        // similar to OpenLayers map single-click selection.
        // The 'interactionModeBtn' will primarily control box-selection on the 2D map.

        // Process 'lclick' and 'Canvas DOM click' events for selection
        if (eventName === 'lclick' || eventName === 'Canvas DOM click') {
            console.log("HANDLEGLOBECLICK: Event name check passed, proceeding with click handling.");
        } else {
            console.log(`HANDLEGLOBECLICK: Event '${eventName}' is NOT 'lclick' or 'Canvas DOM click', ignoring for selection.`);
            return;
        }

        if (!window.globus || !window.globus.planet || !window.globus.planet.camera || !selectionTileGrid || !state.olMap) { // Check state.olMap
            console.error("HANDLEGLOBECLICK: Globus, planet, camera, selectionTileGrid or olMap not ready. Cannot process click.");
            return;
        }
        if (typeof og === 'undefined' || typeof og.mercator === 'undefined') {
            console.error("HANDLEGLOBECLICK: OpenGlobus 'og' or 'og.mercator' not defined. Cannot process click.");
            return;
        }
        if (typeof toggleTileSelection !== 'function') {
             console.error("HANDLEGLOBECLICK: toggleTileSelection function is not defined.");
             return;
        }
        console.log("HANDLEGLOBECLICK: Passed initial prerequisite checks.");

        // Get geographical coordinates from pixel coordinates
        const lonLat = window.globus.planet.getLonLatFromPixelTerrain(mouse, true);
        if (!lonLat) {
            console.warn("HANDLEGLOBECLICK: Could not get LonLat from pixel terrain. Cannot determine tile.");
            return;
        }
        console.log(`HANDLEGLOBECLICK: Clicked LonLat: ${lonLat.lon.toFixed(6)}, ${lonLat.lat.toFixed(6)}`);

        // Combined globe click logic:
        // 1. Determine clicked tile coordinates.
        // 2. Check if this tile is part of a saved tileset group.
        // 3. If YES: Select the entire group (cyan highlight).
        // 4. If NO: Toggle individual selection for this tile (yellow highlight).
        //    (toggleTileSelection should handle both selecting and deselecting)

        try {
            const tileX = og.mercator.getTileX(lonLat.lon, TILE_SELECTION_ZOOM);
            const tileY = og.mercator.getTileY(lonLat.lat, TILE_SELECTION_ZOOM);

            if (tileX === undefined || tileY === undefined) { // Check if coordinates are valid
                console.warn("HANDLEGLOBECLICK: og.mercator.getTileX/Y failed to return valid coordinates.");
                return;
            }
            const ogTileToProcess = [TILE_SELECTION_ZOOM, tileX, tileY];
            const tileIdToLookup = getTileId(ogTileToProcess);

            console.log(`HANDLEGLOBECLICK: Processing tile: ${tileIdToLookup} (Z${ogTileToProcess[0]})`);

            const targetLayer = window.userLayers[window.selectedLayerId]?.layer;
            let groupFoundAndSelected = false;

            if (targetLayer) {
                const source = targetLayer.getSource();
                const featuresAtTile = source.getFeatures().filter(f => f.get('tileId') === tileIdToLookup && f.get('tilesetGroupId'));

                if (featuresAtTile.length > 0) {
                    const clickedFeature = featuresAtTile[0];
                    const groupId = clickedFeature.get('tilesetGroupId');

                    if (window.highlightedGlobeGroupId === groupId) {
                        // Group is already selected, so deselect it
                        console.log(`HANDLEGLOBECLICK: Clicked group ${groupId} is already selected. Deselecting.`);
                        clearMapSelectionAndDetails(); // Clears selectionSource, hides modal, nullifies highlightedListItem
                        window.highlightedGlobeGroupId = null; // Clear globe highlight
                        // No need to call updateSelectedTileCountDisplay as clearMapSelectionAndDetails handles it.
                        // No need to call zoomToTilesetGroup or highlightListItem as we are deselecting.
                        groupFoundAndSelected = true; // Mark as handled
                    } else {
                        // Group is not currently selected, so select it
                        console.log(`HANDLEGLOBECLICK: Clicked tile ${tileIdToLookup} is part of saved group ${groupId}. Selecting group.`);
                        
                        clearMapSelectionAndDetails(); // Clear previous selections first
                        window.highlightedGlobeGroupId = groupId; // For globe layer drawing
                        
                        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
                    const featuresToAddForSelection = groupFeatures.map(f => {
                        const clone = f.clone();
                        clone.setId(`selection-${f.getId() || f.ol_uid}`);
                        clone.set('originalTileId', f.get('tileId'));
                        clone.set('isGroupSelection', true);
                        return clone;
                    });

                    if (featuresToAddForSelection.length > 0 && selectionSource) {
                        selectionSource.addFeatures(featuresToAddForSelection);
                    }
                    
                    updateSelectedTileCountDisplay();
                    if (typeof openTilesetDetailsModal === 'function') openTilesetDetailsModal(clickedFeature);
                    zoomToTilesetGroup(groupId);
                    highlightListItem(groupId);
                    
                    if (window.ogSavedTilesetsLayer) window.ogSavedTilesetsLayer.clear(); // Refresh globe
                    console.log("DEBUG: Group selected. Globe layer cleared for redraw.");
                    groupFoundAndSelected = true;
                    } // Closes the 'else' for selecting a new group
                } // Closes 'if (featuresAtTile.length > 0)'
            } // Closes 'if (targetLayer)'

            if (!groupFoundAndSelected) {
                console.log(`HANDLEGLOBECLICK: Tile ${tileIdToLookup} not in a group or no target layer. Proceeding with individual tile toggle.`);
                if (typeof toggleTileSelection === "function") {
                    toggleTileSelection(ogTileToProcess); // This function should handle select/deselect
                } else {
                    console.error("HANDLEGLOBECLICK: toggleTileSelection function is not defined!");
                }
                // Refresh globe layers to show individual selection/deselection
                if (window.ogSavedTilesetsLayer) window.ogSavedTilesetsLayer.clear();
                if (window.gridLayerOG) window.gridLayerOG.clear(); // If individual tiles use gridLayerOG
                console.log("DEBUG: Individual tile toggled. Globe layers cleared for redraw.");
            }

        } catch (e) {
            console.error("HANDLEGLOBECLICK: Error during globe click processing:", e);
        }
    }

    // --- UI Element References ---
    const viewToggleButtons = {
        'map-view-btn': document.getElementById('map-panel'),
        'globe-view-btn': document.getElementById('globe-panel'),
        'social-btn': document.getElementById('social-panel'),
        'profile-btn': document.getElementById('profile-panel'),
        'xr-view-btn': document.getElementById('xr-panel'),
        'layers-btn': document.getElementById('user-layers-panel'),
        'settings-btn': document.getElementById('settings-panel'),
        'assets-btn': document.getElementById('assets-panel'),
        'scene-btn': document.getElementById('scene-panel'), // Added scene button
        'editor-btn': document.getElementById('editor-panel') // Added editor button and panel
    };
    const controlPanels = [
        document.getElementById('layer-switcher'), // Make draggable
        document.getElementById('user-layers-panel'),
        document.getElementById('app-controls'),
        document.getElementById('settings-panel'),
        document.getElementById('tileset-details-modal'),
        document.getElementById('assets-panel'),
        document.getElementById('globe-switcher') // Make draggable
        // Note: #editor-panel is handled by viewToggleButtons for draggability
    ];
    // Main view panels (map and globe) should always stay visible
    const mainViewPanels = [
        document.getElementById('map-panel'),
        document.getElementById('globe-panel')
    ];
    
    // These panels should toggle independently without hiding map/globe
    const overlayPanels = [
        document.getElementById('social-panel'),
        document.getElementById('profile-panel'),
        document.getElementById('xr-panel')
    ];
    console.log("DEBUG: UI panel/button references obtained.");

    // --- Panel Management ---
    function applyDraggableToAllPanels() {
        Object.keys(viewToggleButtons).forEach(buttonId => {
            const panel = viewToggleButtons[buttonId];
            if (panel) {
                makeDraggable(panel);
            } else {
                console.error(`DRAG_ERROR: Panel for button ID '${buttonId}' not found in viewToggleButtons. Cannot make draggable.`);
            }
        });
        controlPanels.forEach((panel, index) => { // Added index for logging if panel is null
            if (panel) {
                // Re-enable makeDraggable for all controlPanels as per user request
                // The original skip for user-layers-panel was for testing a fixed position.
                makeDraggable(panel);
            } else {
                // To know which panel is null, we'd need to map controlPanels back to their intended IDs if possible,
                // The misplaced if (interactionModeBtn) block was here and has been removed.
                console.error(`DRAG_ERROR: A panel in controlPanels array (at index ${index}) is null. Cannot make draggable.`);
            }
        });
        console.log("DEBUG: Draggable behavior applied to panels.");
    }

    let currentMaxZIndex = 1020; // Initialize z-index for bringing panels to front

    console.log("DEBUG_VIEW_TOGGLE: Initializing toolbar button listeners...");
    Object.keys(viewToggleButtons).forEach(btnId => {
        const button = document.getElementById(btnId);
        const panel = viewToggleButtons[btnId];
        // console.log(`DEBUG_VIEW_TOGGLE: Processing buttonId: '${btnId}'. Button Element:`, button, "Panel Element:", panel); // Temporarily reduce noise
        if (button && panel) {
            // console.log(`DEBUG_VIEW_TOGGLE: Attaching listener to '${btnId}' for panel '${panel.id}'`); // Temporarily reduce noise
            button.addEventListener('click', function() {
                console.log(`DEBUG_VIEW_TOGGLE: Toolbar button '${btnId}' clicked! Toggling panel '${panel.id}'.`);
                this.classList.toggle('active');
                const isActiveAfterToggle = this.classList.contains('active');
                
                if (isActiveAfterToggle) {
                    panel.style.setProperty('display', 'block', 'important');
                    panel.style.zIndex = ++currentMaxZIndex; // Bring to front
                    // Positioning for user-layers-panel is now handled by CSS flexbox within #left-controls-container.
                    // The old JS positioning logic for it has been removed.
                } else {
                    panel.style.setProperty('display', 'none', 'important');
                }
                console.log(`Toggled panel ${panel.id} to ${isActiveAfterToggle ? 'block (important)' : 'none (important)'}. Button ${this.id} active: ${isActiveAfterToggle}`);
                // Log computed style for scene panel specifically
                if (panel.id === 'scene-panel') {
                    const computedStyle = window.getComputedStyle(panel);
                    console.log(`SCENE_PANEL_DEBUG: Computed display: ${computedStyle.display}, visibility: ${computedStyle.visibility}, z-index: ${computedStyle.zIndex}`);
                }
                // ... (rest of the logic for map-view-btn, globe/map resize) ...
                if (btnId === 'map-view-btn') {
                    const appControlsPanel = document.getElementById('app-controls');
                    const layerSwitcherPanel = document.getElementById('layer-switcher');
                    if (appControlsPanel) {
                        appControlsPanel.style.display = isActiveAfterToggle ? 'block' : 'none';
                    }
                    // if (layerSwitcherPanel) { // Now controlled by map panel header button
                    //     layerSwitcherPanel.style.display = isActiveAfterToggle ? 'block' : 'none';
                    // }
                }
                if (panel.id === 'globe-panel' && isActiveAfterToggle && window.globus?.planet?.renderer) {
                     setTimeout(() => { if (window.globus?.planet?.renderer?.resize) window.globus.planet.renderer.resize(); }, 50);
                }
                if (panel.id === 'map-panel' && isActiveAfterToggle && window.olMap) {
                    setTimeout(() => { if (window.olMap?.updateSize) window.olMap.updateSize(); }, 50);
                }
            });
        }
    });
    // Helper function to toggle panel display (block/none)
    function toggleRobustPanelDisplay(panelElement) { // Renamed for clarity and robustness
        if (panelElement) {
            const computedStyle = window.getComputedStyle(panelElement);
            if (computedStyle.display === 'none') {
                panelElement.style.setProperty('display', 'block', 'important');
                panelElement.style.zIndex = ++currentMaxZIndex; // Bring to front
            } else {
                panelElement.style.setProperty('display', 'none', 'important');
            }
        } else {
            console.warn("toggleRobustPanelDisplay: panelElement is null or undefined.");
        }
    }

    // Event listener for map panel's header button to toggle #layer-switcher
    const mapPanelToggleMapsMenuBtn = document.getElementById('map-panel-toggle-maps-menu-btn');
    const layerSwitcherPanelForToggle = document.getElementById('layer-switcher');
    if (mapPanelToggleMapsMenuBtn && layerSwitcherPanelForToggle) {
        console.log("DEBUG: Attaching listener to mapPanelToggleMapsMenuBtn for layerSwitcherPanelForToggle.", mapPanelToggleMapsMenuBtn, layerSwitcherPanelForToggle);
        mapPanelToggleMapsMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent panel drag if button is part of header
            console.log("DEBUG: map-panel-toggle-maps-menu-btn clicked. Current layerSwitcher display:", window.getComputedStyle(layerSwitcherPanelForToggle).display);
            toggleRobustPanelDisplay(layerSwitcherPanelForToggle);
            console.log("DEBUG: Toggled layer-switcher panel. New display:", window.getComputedStyle(layerSwitcherPanelForToggle).display);
        });
    } else {
        console.warn("Could not find map-panel-toggle-maps-menu-btn or layer-switcher panel for new toggle logic.");
    }

    // Event listener for globe panel's header button to toggle #globe-switcher
    const globePanelToggleGlobesMenuBtn = document.getElementById('globe-panel-toggle-globes-menu-btn');
    const globeSwitcherPanelForToggle = document.getElementById('globe-switcher');
    if (globePanelToggleGlobesMenuBtn && globeSwitcherPanelForToggle) {
        globePanelToggleGlobesMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent panel drag
            toggleRobustPanelDisplay(globeSwitcherPanelForToggle);
            console.log("DEBUG: Toggled globe-switcher panel via globe panel header button.");
        });
    } else {
        console.warn("Could not find globe-panel-toggle-globes-menu-btn or globe-switcher panel for new toggle logic.");
    }

    // Ensure layer-switcher starts hidden, overriding any other styles if necessary.
    setTimeout(() => {
        const lsPanel = document.getElementById('layer-switcher');
        if (lsPanel) {
            const currentDisplay = window.getComputedStyle(lsPanel).display;
            // Only force hide if it's not already 'none'.
            if (currentDisplay !== 'none') {
                lsPanel.style.setProperty('display', 'none', 'important');
                console.log("DEBUG: Forcefully hid layer-switcher on load because its computed display was:", currentDisplay);
            } else {
                console.log("DEBUG: layer-switcher already hidden on load as per computed style (no JS force needed).");
            }
        } else {
            console.warn("DEBUG: layer-switcher panel not found for initial hide check.");
        }
    }, 100); // Small delay to run after other initializations

    // Ensure both map and globe are active and visible by default
    const mapPanelElement = document.getElementById('map-panel');
    const mapViewButtonElement = document.getElementById('map-view-btn');
    const globeViewButtonElement = document.getElementById('globe-view-btn');
    const globePanelElement = document.getElementById('globe-panel');

    // Initial panel setup: Both Globe and Map visible at launch
    if (mapViewButtonElement) mapViewButtonElement.classList.add('active'); else console.error("Initial setup: map-view-btn not found");
    if (mapPanelElement) {
        mapPanelElement.style.setProperty('display', 'block', 'important');
        mapPanelElement.style.setProperty('width', 'calc(50% - 15px)', 'important');
        mapPanelElement.style.setProperty('height', 'calc(100% - 70px)', 'important');
        mapPanelElement.style.setProperty('top', '60px', 'important');
        mapPanelElement.style.setProperty('left', '10px', 'important');
        mapPanelElement.style.setProperty('background-color', 'rgba(50, 50, 50, 0.9)', 'important');
        mapPanelElement.style.setProperty('z-index', '1000', 'important');
        console.log("DEBUG: Forcing map-panel visibility with left-side positioning");
    } else {
        console.error("Initial setup: map-panel not found");
    }
    
    if (globeViewButtonElement) globeViewButtonElement.classList.add('active'); else console.error("Initial setup: globe-view-btn not found");
    if (globePanelElement) {
        globePanelElement.style.setProperty('display', 'block', 'important');
        globePanelElement.style.setProperty('width', 'calc(50% - 15px)', 'important');
        globePanelElement.style.setProperty('height', 'calc(100% - 70px)', 'important');
        globePanelElement.style.setProperty('top', '60px', 'important');
        globePanelElement.style.setProperty('right', '10px', 'important');
        globePanelElement.style.setProperty('left', 'auto', 'important');
        globePanelElement.style.setProperty('background-color', 'rgba(50, 50, 50, 0.9)', 'important');
        globePanelElement.style.setProperty('z-index', '1000', 'important');
        console.log("DEBUG: Forcing globe-panel visibility with right-side positioning");
    } else {
        console.error("Initial setup: globe-panel not found");
    }

    // Make Layers panel visible by default but respect its position under the map menu
    const layersButton = document.getElementById('layers-btn');
    const layersPanel = viewToggleButtons['layers-btn'];
    const layerSwitcherPanel = document.getElementById('layer-switcher');
    
    if (layersButton) {
        layersButton.classList.add('active'); // Make button active
    } else {
        console.error("Initial setup: layers-btn not found");
    }
    
    // Make sure layer switcher is visible and above map/globe panels
    if (layerSwitcherPanel) {
        layerSwitcherPanel.style.setProperty('display', 'block', 'important');
        layerSwitcherPanel.style.setProperty('z-index', '2000', 'important'); // Much higher z-index to be above all map/globe panels
        console.log("DEBUG: Ensuring layer-switcher (map menu) is visible and in front");
    }

    // Ensure app-controls is also visible by default if map panel is
    // const appControlsPanel = document.getElementById('app-controls'); // Already declared at higher scope
    if (window.appControlsPanel && mapPanelElement && mapPanelElement.style.display === 'block') { // Use window.appControlsPanel or ensure it's in scope
        window.appControlsPanel.style.setProperty('display', 'block', 'important');
        // z-index for app-controls is already set in CSS, typically lower than layer-switcher but above map
        console.log("DEBUG: Ensuring app-controls panel is visible with map panel");
    }
    
    if (layersPanel) {
        layersPanel.style.setProperty('display', 'block', 'important');
        layersPanel.style.setProperty('top', '160px', 'important'); // Position below layer-switcher per CSS
        layersPanel.style.setProperty('left', '10px', 'important');
        layersPanel.style.setProperty('z-index', '1900', 'important'); // Higher z-index to be above map/globe panels
        console.log("DEBUG: Making layers panel visible below the maps menu but in front of map view");
    } else {
        console.error("Initial setup: layersPanel (user-layers-panel) not found via viewToggleButtons['layers-btn']");
    }

    console.log("DEBUG: Default panel visibility set (Globe active; Map, Layers inactive). Check console for errors.");

    console.log("%cDEBUG: Right before calling initializeOpenGlobus()", "color: red; font-weight: bold;");
    initializeOpenGlobus();
    console.log("%cDEBUG: Right after calling initializeOpenGlobus()", "color: red; font-weight: bold;");
    initializeOpenLayersMap(); // Moved here, inside DOMContentLoaded
    applyDraggableToAllPanels();
    setupXRPanelLogic(); // Initialize XR panel logic

    // Check initial state of Scene button and panel
    console.log("%cINITIAL_STATE_CHECK: --- Checking Scene Button and Panel Initial State ---", "color: orange; font-weight: bold;");
    const initialSceneBtnCheck = document.getElementById('scene-btn');
    const initialScenePanelCheck = document.getElementById('scene-panel');
    if (initialSceneBtnCheck && initialScenePanelCheck) {
        console.log("INITIAL_STATE_CHECK: scene-btn element:", initialSceneBtnCheck);
        console.log("INITIAL_STATE_CHECK: scene-btn classList on load:", initialSceneBtnCheck.classList.toString());
        console.log("INITIAL_STATE_CHECK: scene-btn is active on load:", initialSceneBtnCheck.classList.contains('active'));
        console.log("INITIAL_STATE_CHECK: scene-panel computed display on load:", window.getComputedStyle(initialScenePanelCheck).display);
    } else {
        console.error("INITIAL_STATE_CHECK: Could not find scene-btn or scene-panel for initial state check.");
    }
    console.log("%cINITIAL_STATE_CHECK: --- End of Scene Button and Panel Initial State Check ---", "color: orange; font-weight: bold;");
    
    function flyToStatueOfLiberty() {
        console.log("%cflyToStatueOfLiberty function called", "color: magenta; font-weight: bold;");
        if (window.globus && window.globus.planet && window.globus.planet.camera) {
            console.log("Attempting to fly to Statue of Liberty: Lon -74.0445, Lat 40.6892, Alt 500");
            const lon = -74.0445;
            const lat = 40.6892;
            const alt = 500; 
            
// --- Map Panel OLCesium Toggle Button Listener (Logic REMOVED as per user request) ---
// The functionality for this button will be moved to an OpenLayers control.
// Original block was from ~line 3202 to ~line 3275.
// console.log("DEBUG: Skipping toggleMapCesiumViewBtn listener setup for now."); // Ensure it's fully skipped
            if (typeof window.globus.planet.camera.flyLonLat === 'function') {
                console.log(`Using camera.flyLonLat(new og.LonLat(${lon}, ${lat}, ${alt})) for Statue of Liberty.`);
                window.globus.planet.camera.flyLonLat(new og.LonLat(lon, lat, alt));
                console.log("DEBUG: camera.flyLonLat() called for Statue of Liberty.");
            } else if (typeof window.globus.planet.camera.setView === 'function') {
                console.warn("WARN: camera.flyLonLat is not a function. Trying camera.setView() for Statue of Liberty.");
                window.globus.planet.camera.setView(new og.LonLat(lon, lat, alt));
                console.log("DEBUG: camera.setView() called for Statue of Liberty.");
            } else if (typeof window.globus.planet.camera.setLonLat === 'function') {
                console.warn("WARN: camera.flyLonLat and setView not functions. Falling back to setLonLat/setAltitude for SoL.");
                window.globus.planet.camera.setLonLat(lon, lat);
                if (typeof window.globus.planet.camera.setAltitude === 'function') {
// --- Scene Panel Logic ---
    // --- Scene Panel Logic for 3D Tile Button ---
    console.log("SCENE_BTN_DEBUG: Checking elements for 3D Tile: sceneType3dtileBtn:", sceneType3dtileBtn, "sceneIframe:", sceneIframe, "scenePanel:", scenePanel);
    if (sceneType3dtileBtn && sceneIframe && scenePanel) { // Ensure scenePanel is also defined
        // The first event listener block was redundant and has been removed.
        // This is the main listener for the 3D Tile button.
        console.log("SCENE_BTN_DEBUG: Attaching listener to sceneType3dtileBtn");
        sceneType3dtileBtn.addEventListener('click', () => {
            console.log("Scene Panel: 3D Tile (Cesium) selected. Will load current tileset if available.");
            
            if (typeof switchToView === 'function') {
                switchToView('scene-btn'); // Ensure scene panel is visible
            } else if (scenePanel) {
                scenePanel.style.display = 'block';
            }

            // Highlight active button
            if(sceneTypeUsdBtn) sceneTypeUsdBtn.classList.remove('active');
            if(sceneTypeI3sBtn) sceneTypeI3sBtn.classList.remove('active');
            sceneType3dtileBtn.classList.add('active');

            const currentIframeSrc = sceneIframe.getAttribute('src');
            const needsToLoadCesiumHtml = !currentIframeSrc || !currentIframeSrc.includes('scene_cesium.html');

            const attemptGLTFExportAndSend = () => {
                if (!currentEditingFeatureForModal) {
                    console.warn("Scene Panel (3D Tile): No tileset detailed in modal. Standalone Cesium will be empty or show previous model.");
                    // If scene_cesium.html is already loaded, we don't need to do anything more.
                    // If it needs loading, it will be loaded without GLTF.
                    if (needsToLoadCesiumHtml) {
                        sceneIframe.setAttribute('src', 'scene_cesium.html');
                    }
                    return;
                }

                // Proceed with GLTF export for currentEditingFeatureForModal
                const tilesetName = detailsTilesetNameInput.value || 'DetailedTileset';
                const groupId = currentEditingFeatureForModal.get('tilesetGroupId');
                if (!groupId) { alert("No group ID for detailed tileset."); return; }

                const activeLayerId = window.selectedLayerId || layer0Id;
                const layerData = window.userLayers[activeLayerId];
                if (!layerData || !layerData.layer) { alert(`Layer ${activeLayerId} not found.`); return; }
                const layerSource = layerData.layer.getSource();
                if (!layerSource) { alert(`Layer source for ${activeLayerId} not found.`); return; }

                let tilesArray;
                const groupFeatures = layerSource.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
                if (groupFeatures.length > 0) {
                    tilesArray = groupFeatures.map(f => {
                        const tileId = f.get('tileId');
                        if (!tileId) return null;
                        const parts = tileId.split('-').map(Number);
                        return (parts.length === 3 && !parts.some(isNaN)) ? parts : null;
                    }).filter(t => t !== null);
                } else if (tilesetName === "Test Tileset SoL" && groupId.startsWith("test-tileset-")) {
                    tilesArray = [[TILE_SELECTION_ZOOM, 617234, 788670], [TILE_SELECTION_ZOOM, 617235, 788670], [TILE_SELECTION_ZOOM, 617234, 788671], [TILE_SELECTION_ZOOM, 617235, 788671]];
                } else {
                    alert(`No tile features for group ID ${groupId}. Standalone Cesium view might be empty.`);
                    if (needsToLoadCesiumHtml) sceneIframe.setAttribute('src', 'scene_cesium.html'); // Still load empty Cesium
                    return;
                }
                if (!tilesArray || tilesArray.length === 0) {
                    alert("No valid tile coordinates for export.");
                    if (needsToLoadCesiumHtml) sceneIframe.setAttribute('src', 'scene_cesium.html'); // Still load empty Cesium
                    return;
                }

                let textureUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                if (baseLayerSelectOL) {
                    const val = baseLayerSelectOL.value;
                    if (val === 'osm') textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                    else if (val === 'topo') textureUrl = 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png';
                    else if (val === 'terrarium') textureUrl = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                    const customUrl = customLayerUrlInput ? customLayerUrlInput.value : '';
                    if (val === 'add-custom' && customUrl) textureUrl = customUrl;
                }
                const terrainUrl = 'https://terrain.openglobus.org/all/{z}/{x}/{y}.png';
                
                const originalButtonText = sceneType3dtileBtn.textContent;
                sceneType3dtileBtn.textContent = "Loading...";
                sceneType3dtileBtn.disabled = true;

                window.exportTilesetToGLTF(tilesArray, textureUrl, terrainUrl, tilesetName, (gltfJsonString, errorMsg) => {
                    sceneType3dtileBtn.textContent = "3D Tile";
                    sceneType3dtileBtn.disabled = false;
                    if (errorMsg) { alert("Error generating GLTF: " + errorMsg); return; }
                    if (gltfJsonString) {
                        let calculatedCenter = null;
                        if (tilesArray.length > 0 && selectionTileGrid && ol && ol.extent && ol.proj) {
                            const extent = ol.extent.createEmpty();
                            tilesArray.forEach(tc => ol.extent.extend(extent, selectionTileGrid.getTileCoordExtent(tc)));
                            const centerCoord = ol.extent.getCenter(extent);
                            const lonLat = ol.proj.toLonLat(centerCoord);
                            calculatedCenter = { lon: lonLat[0], lat: lonLat[1], height: 0 };
                        }
                        
                        const gltfData = {
                            type: 'loadGLTF',
                            gltfString: gltfJsonString,
                            tilesetCenter: calculatedCenter,
                            tilesetName: tilesetName
                        };

                        // Function to send message to iframe
                        const sendMessageToSceneIframe = () => {
                            if (sceneIframe.contentWindow) {
                                console.log("Posting 'loadGLTF' message to scene-iframe (standalone Cesium).");
                                sceneIframe.contentWindow.postMessage(gltfData, '*');
                            } else {
                                console.error("Cannot post message: sceneIframe.contentWindow not available for standalone Cesium.");
                            }
                        };
                        
                        // If iframe is already loaded with scene_cesium.html and ready, send message.
                        // Otherwise, set src and send message on 'cesiumIframeReady'.
                        const handleIframeReadyAndSend = (event) => {
                            if (event.data && event.data.type === 'cesiumIframeReady' && event.source === sceneIframe.contentWindow) {
                                sendMessageToSceneIframe();
                                window.removeEventListener('message', handleIframeReadyAndSend);
                            }
                        };

                        if (needsToLoadCesiumHtml) {
                            window.addEventListener('message', handleIframeReadyAndSend);
                            sceneIframe.setAttribute('src', 'scene_cesium.html');
                        } else { // Already on scene_cesium.html, assume it might be ready or will send ready soon.
                            // It's safer to always wait for 'cesiumIframeReady' if possible,
                            // but if it's already loaded, it might have sent it already.
                            // For simplicity here, if not needsToLoadCesiumHtml, we try sending.
                            // A more robust solution would be for scene_cesium.html to resend 'ready' if it gets a message too early.
                            // Or, main.js could queue the message.
                            // For now, let's try sending directly if src is already correct,
                            // and also listen for 'cesiumIframeReady' as a fallback or for first load.
                            window.addEventListener('message', handleIframeReadyAndSend);
                            // If contentWindow is available, try a direct send, assuming it might be ready.
                            if(sceneIframe.contentWindow && sceneIframe.contentWindow.location.href.includes('scene_cesium.html')) {
                                 // Check if it's truly ready by a flag or just send.
                                 // scene_cesium.html should handle messages even if it gets them slightly early after a reload.
                                 sendMessageToSceneIframe();
                            }
                            // The 'cesiumIframeReady' listener will catch it if it wasn't ready.
                        }
                    }
                });
            }; // End of attemptGLTFExportAndSend

            attemptGLTFExportAndSend(); // Call the export/send logic
        });
    } // Closes if (sceneType3dtileBtn && sceneIframe && scenePanel)
    // --- End of Scene Panel Logic for 3D Tile Button ---

    console.log("SCENE_BTN_DEBUG: Checking elements for USD: sceneTypeUsdBtn:", sceneTypeUsdBtn, "sceneIframe:", sceneIframe, "scenePanel:", scenePanel);
    if (sceneTypeUsdBtn && sceneIframe && scenePanel) {
        console.log("SCENE_BTN_DEBUG: Attaching listener to sceneTypeUsdBtn");
        sceneTypeUsdBtn.addEventListener('click', () => {
            console.log("Scene type: USD selected (placeholder).");
            if (typeof switchToView === 'function') {
                switchToView('scene-btn');
            } else if(scenePanel) {
                scenePanel.style.display = 'block';
            }
            
            sceneIframe.setAttribute('src', 'about:blank'); // Placeholder
            alert("OpenUSD viewing/conversion is not yet implemented. This section would typically load a USD file or provide information on converting the current tileset's GLTF to USD.");
            if(sceneType3dtileBtn) sceneType3dtileBtn.classList.remove('active');
            if(sceneTypeI3sBtn) sceneTypeI3sBtn.classList.remove('active');
            sceneTypeUsdBtn.classList.add('active');
        });
    }

    console.log("SCENE_BTN_DEBUG: Checking elements for I3S: sceneTypeI3sBtn:", sceneTypeI3sBtn, "sceneIframe:", sceneIframe, "scenePanel:", scenePanel);
    if (sceneTypeI3sBtn && sceneIframe && scenePanel) {
        console.log("SCENE_BTN_DEBUG: Attaching listener to sceneTypeI3sBtn");
        sceneTypeI3sBtn.addEventListener('click', () => {
            console.log("Scene type: I3S selected (placeholder).");
            if (typeof switchToView === 'function') {
                switchToView('scene-btn');
            } else if(scenePanel) {
                scenePanel.style.display = 'block';
            }

            sceneIframe.setAttribute('src', 'about:blank'); // Placeholder
            alert("I3S viewing/conversion is not yet implemented. This section would typically load an I3S scene layer or provide information on converting the current tileset's data to I3S format.");
            if(sceneType3dtileBtn) sceneType3dtileBtn.classList.remove('active');
            if(sceneTypeUsdBtn) sceneTypeUsdBtn.classList.remove('active');
            sceneTypeI3sBtn.classList.add('active');
        });
    }
    // End of Scene Panel Logic
                    window.globus.planet.camera.setAltitude(alt);
                }
                if (typeof window.globus.planet.camera.update === 'function') {
                    window.globus.planet.camera.update();
                }
                if (window.globus.planet.renderer && typeof window.globus.planet.renderer.draw === 'function') {
                    window.globus.planet.renderer.draw();
                }
                console.log("DEBUG: Fallback setLonLat/setAltitude for SoL completed.");
            } else {
                console.error("Critical Navigation Error: No suitable camera navigation methods (flyLonLat, setView, setLonLat) found for Statue of Liberty.");
            }
        } else {
            console.error("flyToStatueOfLiberty: window.globus or window.globus.planet or camera is not initialized!");
        }
    }
    
    const appControls = document.querySelector('#app-controls .panel-content');
    if (appControls) {
        const testButton = document.createElement('button');
        testButton.id = "flyToStatueBtn";
        testButton.textContent = "Test: Fly to Statue of Liberty";
        testButton.style.width = "100%";
        testButton.style.marginTop = "5px";
        testButton.addEventListener('click', flyToStatueOfLiberty);
        appControls.appendChild(testButton);
        console.log("DEBUG: 'Fly to Statue of Liberty' test button added to UI.");
    } else {
        console.warn("DEBUG: #app-controls .panel-content not found, test button not added.");
    }

    // --- Settings Panel Logic ---
    function loadSettings() {
        console.log("DEBUG: loadSettings called.");
        const startLon = localStorage.getItem('setting_startLon');
        const startLat = localStorage.getItem('setting_startLat');
        const startZoom = localStorage.getItem('setting_startZoom');

        if (settingStartLonInput) {
            settingStartLonInput.value = startLon !== null ? startLon : "-74.0445"; 
        }
        if (settingStartLatInput) {
            settingStartLatInput.value = startLat !== null ? startLat : "40.6892"; 
        }
        if (settingStartZoomInput) {
            settingStartZoomInput.value = startZoom !== null ? startZoom : "18"; // Default zoom to 18
        }
        console.log(`DEBUG: Loaded/Defaulted settings - Lon: ${settingStartLonInput?.value}, Lat: ${settingStartLatInput?.value}, Zoom: ${settingStartZoomInput?.value}`);
        
        const gridVisible = localStorage.getItem('setting_gridVisible');
        const gridWeight = localStorage.getItem('setting_gridWeight');
        if (settingGridVisibleCheckbox) {
            settingGridVisibleCheckbox.checked = gridVisible !== null ? (gridVisible === 'true') : true; // Default true
        }
        if (settingGridWeightInput) {
            settingGridWeightInput.value = gridWeight !== null ? gridWeight : "0.5"; // Default 0.5
        }
    }

    function applyStartLocationSettings() {
        console.log("DEBUG: applyStartLocationSettings called.");
        if (!settingStartLonInput || !settingStartLatInput || !settingStartZoomInput) {
            console.error("applyStartLocationSettings ERROR: Critical settings input elements (Lon/Lat/Zoom) are missing from the DOM. Cannot apply start location.");
            return;
        }
        
        const lonStr = settingStartLonInput.value;
        const latStr = settingStartLatInput.value;
        const zoomStr = settingStartZoomInput.value;

        const lon = parseFloat(lonStr);
        const lat = parseFloat(latStr);
        const zoom = parseInt(zoomStr, 10);

        console.log(`DEBUG applyStartLocationSettings: Parsed - Lon: ${lon}, Lat: ${lat}, Zoom: ${zoom}`);

        if (!isNaN(lon) && !isNaN(lat)) { 
            if (window.globus && window.globus.planet && window.globus.planet.camera && document.getElementById('globe-panel').style.display !== 'none') {
                console.log(`Applying start location: Lon ${lon}, Lat ${lat}, Zoom ${zoom}`);
                // For zoom 18, target altitude around 190m. Let's try a slightly higher default like 600m for a less "too close" initial view.
                // The flyToStatueOfLiberty button uses 500m.
                const calculatedAlt = !isNaN(zoom) ? (50000000 / Math.pow(2, zoom)) : 600;
                const alt = (zoom === 18 && calculatedAlt < 500) ? 500 : calculatedAlt; // Ensure zoom 18 is not excessively close.
                console.log(`Calculated altitude for zoom ${zoom} is ${calculatedAlt}, using ${alt}`);


                if (typeof window.globus.planet.camera.flyLonLat === 'function') {
                    console.log(`Using camera.flyLonLat(new og.LonLat(${lon}, ${lat}, ${alt})) for start location.`);
                    window.globus.planet.camera.flyLonLat(new og.LonLat(lon, lat, alt));
                    // REMOVED: initializeOLCesiumMapPanel(); - This should not be called here.
                    console.log("DEBUG: camera.flyLonLat() called for start location.");
                } else if (typeof window.globus.planet.camera.setView === 'function') {
                    console.warn("WARN: camera.flyLonLat is not a function. Trying camera.setView() for start location.");
                    window.globus.planet.camera.setView(new og.LonLat(lon, lat, alt));
                     console.log("DEBUG: camera.setView() called for start location.");
                } else if (typeof window.globus.planet.camera.setLonLat === 'function') {
                    console.warn("WARN: camera.flyLonLat and setView not functions. Falling back to setLonLat/setAltitude for start location.");
                    window.globus.planet.camera.setLonLat(lon, lat);
                    if (typeof window.globus.planet.camera.setAltitude === 'function') {
                        window.globus.planet.camera.setAltitude(alt);
                    }
                    if (typeof window.globus.planet.camera.update === 'function') {
                        window.globus.planet.camera.update();
                    }
                    if (window.globus.planet.renderer && typeof window.globus.planet.renderer.draw === 'function') {
                        window.globus.planet.renderer.draw();
                    }
                    console.log("DEBUG: Fallback setLonLat/setAltitude for start location completed.");
                } else {
                    console.error("All primary navigation methods (camera.flyLonLat, setView, setLonLat) failed or are unavailable for start location.");
                }
            } else {
                console.log("applyStartLocationSettings: Globe not visible or not initialized, or camera missing. Skipping.");
            }
        } else {
            console.warn("applyStartLocationSettings: Invalid lon/lat values from settings after parsing.");
        }
    }

     function applyGridSettings() {
        console.log("DEBUG: applyGridSettings called.");
        const isVisible = settingGridVisibleCheckbox ? settingGridVisibleCheckbox.checked : true; 
        if (window.gridLayerOG) { // Explicitly check window.gridLayerOG
            window.gridLayerOG.setVisibility(isVisible);
            console.log(`DEBUG: Grid layer visibility set to ${isVisible}`);
        } else {
            console.warn("DEBUG: gridLayerOG not initialized on first attempt in applyGridSettings. Will retry once.");
            // Retry once after a short delay, in case initializeOpenGlobus was still finishing up.
            setTimeout(() => {
                if (window.gridLayerOG) {
                    window.gridLayerOG.setVisibility(isVisible);
                    console.log(`DEBUG: Grid layer visibility set to ${isVisible} on retry.`);
                } else {
                    console.error("DEBUG: gridLayerOG still not initialized on retry. Grid settings not applied.");
                }
            }, 500); // Shorter delay for the retry
        }
    }

    // Store original configurations for switching back to Earth
    let originalOpenLayersBaseLayerSource = null;
    let originalOpenLayersViewConfig = null;
    // For OpenGlobus, initializeOpenGlobus() will be used to restore Earth.

    function updateActiveGlobeButton(activeButtonId) {
        const globeButtons = [
            settingGlobeEarthBtn, // Use new var names
            settingGlobeMoonBtn,
            settingGlobeMarsBtn,
            settingGlobeMetaverseBtn,
            settingGlobeCustomBtn
        ];
        globeButtons.forEach(button => {
            if (button) { // Check if button exists
                if (button.id === activeButtonId) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }

    function switchToEarthView() {
        console.log("Switching to Earth view...");
        if (!state.olMap) {
            console.warn("OpenLayers Map not initialized. Cannot switch to Earth.");
            return;
        }

        // Restore OpenLayers
        if (originalOpenLayersBaseLayerSource && originalOpenLayersViewConfig && state.olMap) {
            const baseLayer = state.olMap.getLayers().getArray().find(layer => layer.get('type') === 'base');
            if (baseLayer) {
                baseLayer.setSource(originalOpenLayersBaseLayerSource);
            }
            state.olMap.setView(new ol.View({
                center: originalOpenLayersViewConfig.center,
                zoom: originalOpenLayersViewConfig.zoom,
                projection: originalOpenLayersViewConfig.projection || 'EPSG:3857',
                maxZoom: originalOpenLayersViewConfig.maxZoom,
                minZoom: originalOpenLayersViewConfig.minZoom
            }));
            console.log("OpenLayers switched to Earth.");
        } else {
            console.warn("Original OpenLayers Earth configuration not found or olMap not ready. Re-initializing OpenLayers.");
             if (state.olMap && typeof state.olMap.dispose === 'function') {
                state.olMap.dispose();
             }
             state.olMap = null;
             initializeOpenLayersMap();
        }

        // Restore OpenGlobus for Earth
        if (state.globus && typeof state.globus.planet?.remove === 'function') {
            state.globus.planet.remove();
            state.globus = null;
        }
        initializeOpenGlobus(); // This re-initializes OpenGlobus for Earth
        const itownsContainer = document.getElementById('itowns-container');
        const globusContainer = document.getElementById('globusContainer');
        if (itownsContainer) itownsContainer.style.display = 'none';
        if (globusContainer) globusContainer.style.display = 'block'; // Ensure OpenGlobus container is visible
        state.activeGlobeLibrary = 'openglobus';
        console.log("OpenGlobus switched to Earth.");
        updateActiveGlobeButton('setting-globe-earth');
    }

    function switchToMoonView() {
        console.log("Switching to Moon view...");
        const itownsContainer = document.getElementById('itowns-container');
        const globusContainer = document.getElementById('globusContainer');
        if (itownsContainer) itownsContainer.style.display = 'none';
        if (globusContainer) globusContainer.style.display = 'block'; // Ensure OpenGlobus container is visible
        state.activeGlobeLibrary = 'openglobus';

        if (!state.olMap) {
            console.warn("OpenLayers Map not initialized. Cannot switch to Moon.");
            return;
        }
        if (typeof og === 'undefined' || typeof ol === 'undefined') {
            console.error("OpenGlobus (og) or OpenLayers (ol) library not loaded.");
            return;
        }

        // Store original OL config if not already stored
        if (!originalOpenLayersBaseLayerSource && state.olMap && state.olMap.getLayers().getArray().length > 0) {
            const baseLayer = state.olMap.getLayers().getArray().find(layer => layer.get('type') === 'base');
            if (baseLayer && baseLayer.getSource()) {
                originalOpenLayersBaseLayerSource = baseLayer.getSource();
            }
            const view = state.olMap.getView();
            if (view) {
                originalOpenLayersViewConfig = {
                    center: view.getCenter(),
                    zoom: view.getZoom(),
                    projection: view.getProjection().getCode(),
                    maxZoom: view.getMaxZoom(),
                    minZoom: view.getMinZoom()
                };
            }
        }

        // OpenLayers Moon Setup
        const moonOLSource = new ol.source.XYZ({
            url: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png',
            attributions: 'Moon basemap © OPM Builder, CartoDB',
            maxZoom: 10
        });
        const olBaseLayer = state.olMap.getLayers().getArray().find(layer => layer.get('type') === 'base');
        if (olBaseLayer) {
            olBaseLayer.setSource(moonOLSource);
        }
        state.olMap.setView(new ol.View({
            center: ol.proj.fromLonLat([0, 0], 'EPSG:4326'), // Ensure center is in view projection
            zoom: 2,
            projection: 'EPSG:4326',
            maxZoom: 10
        }));
        console.log("OpenLayers switched to Moon.");

        // OpenGlobus Moon Setup
        if (state.globus && typeof state.globus.planet?.remove === 'function') {
            state.globus.planet.remove();
            state.globus = null;
        }

        const moonSatLayer = new og.layer.XYZ("moon-base-sat", {
            isBaseLayer: true,
            url: "https://{s}.terrain.openglobus.org/moon/sat/{z}/{x}/{y}.png",
            visibility: true,
            maxNativeZoom: 10,
            attribution: "LRO Global Morphology Mosaic 100m",
            diffuse: [1.1, 1.1, 1.3],
            ambient: [0.01, 0.01, 0.02],
        });

        const lunarQuickMapLayer = new og.layer.XYZ("Lunar QuickMap", {
            isBaseLayer: true,
            url: "https://lroc-tiles.quickmap.io/tiles/wac_nac_nacroi/lunar-fulleqc/{z}/{x}/{y}.jpg",
            visibility: false,
            attribution: '<a href="https://lunar.quickmap.io">Lunar QuickMap</a>, NASA, ASU & ACT Corp.',
            diffuse: [1.1, 1.1, 1.3],
            ambient: [0.01, 0.01, 0.02],
            urlRewrite: (s) => `https://lroc-tiles.quickmap.io/tiles/wac_nac_nacroi/lunar-fulleqc/${s.tileZoom + 1}/${s.tileX}/${s.tileY}.jpg`
        });
        
        const appoloSatLayer = new og.layer.XYZ("APPOLO_SAT_Moon", {
            isBaseLayer: false,
            url: "https://{s}.terrain.openglobus.org/moon/sat_appolo/{z}/{x}/{y}.png",
            visibility: true,
            maxNativeZoom: 12,
            extent: [[19.9771, 30.4294], [20.3639, 30.9162]] // Corrected extent to [minLon, minLat], [maxLon, maxLat]
        });

        const moonTerrain = new og.terrain.RgbTerrain(null, {
            geoidSrc: null,
            maxZoom: 7,
            url: "https://{s}.terrain.openglobus.org/moon/dem/{z}/{x}/{y}.png",
            heightFactor: 0.5,
            minHeight: -20000,
            resolution: 0.1021,
            gridSizeByZoom: [64, 32, 16, 16, 32, 64, 64, 32, 16, 8, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2]
        });
        
        state.globus = new og.Globe({
            target: "globusContainer",
            name: "Moon",
            ellipsoid: og.ellipsoid.moon,
            quadTreeStrategyPrototype: og.quadTreeStrategyType.equi,
            maxAltitude: 5841727,
            terrain: moonTerrain,
            layers: [moonSatLayer, lunarQuickMapLayer, appoloSatLayer],
            nightTextureSrc: null,
            specularTextureSrc: null,
            atmosphereEnabled: false,
            gamma: 1.25,
            exposure: 2.195,
        });

        if (state.globus.planet) {
            if (og.control && og.control.TimelineControl) state.globus.planet.addControl(new og.control.TimelineControl());
            if (og.control && og.control.LayerSwitcher) state.globus.planet.addControl(new og.control.LayerSwitcher());
            
            if (state.globus.planet.renderer && state.globus.planet.renderer.controls.SimpleSkyBackground) {
                state.globus.planet.renderer.controls.SimpleSkyBackground.colorOne = "rgb(0, 0, 0)";
                state.globus.planet.renderer.controls.SimpleSkyBackground.colorTwo = "rgb(0, 0, 0)";
            }
        }
        
        console.log("OpenGlobus switched to Moon.");
        updateActiveGlobeButton('setting-globe-moon'); // Use new ID
    }

    if (settingSetStartLocationBtn) {
        settingSetStartLocationBtn.addEventListener('click', () => {
            console.log("DEBUG: 'Set Current View as Start' button clicked.");
            let currentLon, currentLat, currentZoom;
            if (window.globus && window.globus.planet && window.globus.planet.camera && typeof window.globus.planet.camera.getViewpoint === 'function' && document.getElementById('globe-panel').style.display !== 'none') { 
                const viewpoint = window.globus.planet.camera.getViewpoint(); // getViewpoint is usually on camera
                if (viewpoint) {
                    currentLon = viewpoint.lonLat.lon; // Assuming viewpoint has lonLat property
                    currentLat = viewpoint.lonLat.lat;
                    currentZoom = Math.round(Math.log2(50000000 / viewpoint.altitude)); // Assuming viewpoint has altitude
                    console.log(`DEBUG: Current viewpoint for saving: Lon ${currentLon}, Lat ${currentLat}, Alt ${viewpoint.altitude} (Zoom ~${currentZoom})`);
                } else {
                    console.warn("DEBUG: camera.getViewpoint() returned null or undefined.");
                }
            } else {
                 console.warn("DEBUG: Cannot get current viewpoint; globe/planet/camera not ready or getViewpoint not a function.");
            }

            if (currentLon !== undefined && settingStartLonInput) settingStartLonInput.value = currentLon.toFixed(6);
            if (currentLat !== undefined && settingStartLatInput) settingStartLatInput.value = currentLat.toFixed(6);
            if (currentZoom !== undefined && settingStartZoomInput) settingStartZoomInput.value = Math.round(currentZoom);
            
            if (currentLon !== undefined) localStorage.setItem('setting_startLon', currentLon.toFixed(6));
            if (currentLat !== undefined) localStorage.setItem('setting_startLat', currentLat.toFixed(6));
            if (currentZoom !== undefined) localStorage.setItem('setting_startZoom', Math.round(currentZoom).toString());
            
            if (currentLon !== undefined) {
                alert("Start location saved!");
            } else {
                alert("Could not determine current location to save.");
            }
        });
    } else {
        console.warn("DEBUG: settingSetStartLocationBtn not found, event listener not attached.");
    }

    if (settingGridVisibleCheckbox) {
        settingGridVisibleCheckbox.addEventListener('change', () => {
            localStorage.setItem('setting_gridVisible', settingGridVisibleCheckbox.checked.toString());
            applyGridSettings();
        });
    } else {
        console.warn("DEBUG: settingGridVisibleCheckbox not found, event listener not attached.");
    }

    if (settingGridWeightInput) {
        settingGridWeightInput.addEventListener('change', () => {
            localStorage.setItem('setting_gridWeight', settingGridWeightInput.value);
            if (gridLayerOG) gridLayerOG.redraw(); 
            console.log("DEBUG: Grid weight changed, redrawing gridLayerOG.");
        });
    } else {
        console.warn("DEBUG: settingGridWeightInput not found, event listener not attached.");
    }

    // --- MapLibre Integration ---
    function destroyMapLibreMap() {
        if (state.mapLibreMap) {
            state.mapLibreMap.remove();
            state.mapLibreMap = null;
            console.log("MapLibre map destroyed.");
        }
    }

    function updateMapLibreBasemap(basemapValue) {
        if (!state.mapLibreMap) {
            console.warn("updateMapLibreBasemap called but MapLibre map instance does not exist.");
            return;
        }

        let newTilesUrl;
        let newAttribution;
        let newMaxZoom = 19; // Default max zoom

        switch (basemapValue) {
            case 'satellite':
                newTilesUrl = [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${mapTilerKey}`];
                newAttribution = `&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://www.maxar.com/">Maxar</a>`;
                newMaxZoom = 20;
                break;
            case 'topo':
                newTilesUrl = ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png', 'https://b.tile.opentopomap.org/{z}/{x}/{y}.png', 'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'];
                newAttribution = '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
                newMaxZoom = 17;
                break;
            case 'terrarium':
                console.warn("Terrarium DEM for MapLibre not directly supported as raster tile layer, defaulting to OSM.");
                // Fallthrough to OSM
            case 'osm':
            default:
                newTilesUrl = ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'];
                newAttribution = '&copy; OpenStreetMap Contributors';
                newMaxZoom = 19;
                break;
        }

        const currentStyle = state.mapLibreMap.getStyle();
        const newStyleSources = { ...currentStyle.sources };
        newStyleSources['base-raster-source'] = {
            type: 'raster',
            tiles: newTilesUrl,
            tileSize: 256,
            attribution: newAttribution,
            maxzoom: newMaxZoom
        };
        
        let newStyleLayers = currentStyle.layers.filter(layer => layer.id !== 'base-raster-layer');
        newStyleLayers.unshift({ // Add to the beginning to ensure it's a base layer
             id: 'base-raster-layer',
             type: 'raster',
             source: 'base-raster-source'
        });

        const newStyle = {
            ...currentStyle,
            sources: newStyleSources,
            layers: newStyleLayers
        };
        
        console.log("MapLibre: Applying new style for basemap:", basemapValue, newStyle);
        state.mapLibreMap.setStyle(newStyle);
        console.log(`MapLibre basemap updated to: ${basemapValue}`);
    }

    function addMapLibre3DTerrain() {
        if (!state.mapLibreMap || !state.mapLibreMap.isStyleLoaded()) {
            console.warn("addMapLibre3DTerrain: MapLibre map or style not ready.");
            if (state.mapLibreMap && !state.mapLibreMap.isStyleLoaded()) {
                state.mapLibreMap.once('styledata', addMapLibre3DTerrain); // Try again once style data is processed
                console.log("addMapLibre3DTerrain: Style not loaded, deferring terrain setup.");
            }
            return;
        }
        console.log("Attempting to add MapLibre 3D terrain...");
        try {
            if (!state.mapLibreMap.getSource('mapTilerTerrainSource')) {
                state.mapLibreMap.addSource('mapTilerTerrainSource', {
                    type: 'raster-dem',
                    url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${mapTilerKey}`,
                    tileSize: 256,
                    maxzoom: 14 // Terrain-RGB v2 typically goes up to zoom 14
                });
                console.log("MapLibre terrain source 'mapTilerTerrainSource' added.");
            }
            state.mapLibreMap.setTerrain({ source: 'mapTilerTerrainSource', exaggeration: 1.5 });
            console.log("MapLibre terrain set.");

            if (!state.mapLibreMap.getLayer('sky')) {
                state.mapLibreMap.addLayer({
                    id: 'sky',
                    type: 'sky',
                    paint: {
                        'sky-type': 'atmosphere',
                        'sky-atmosphere-sun': [0.0, 0.0],
                        'sky-atmosphere-sun-intensity': 15
                    }
                });
                console.log("MapLibre sky layer added.");
            }
            // state.mapLibreMap.setPitch(60); // Set pitch when terrain is toggled by user perhaps
        } catch (error) {
            console.error("Error adding MapLibre 3D terrain:", error);
        }
    }

    function initMapLibreMap() {
        if (state.mapLibreMap) {
            console.log("MapLibre map already initialized. Resizing.");
            state.mapLibreMap.resize();
            return;
        }
        
        const mapContainer = document.getElementById('maplibre-map-container');
        if (!mapContainer) {
            console.error("MapLibre container 'maplibre-map-container' not found.");
            return;
        }
        console.log("Initializing MapLibre map in container:", mapContainer, `OffsetWidth: ${mapContainer.offsetWidth}, OffsetHeight: ${mapContainer.offsetHeight}`);


        let initialCenter = [-74.0445, 40.6892]; // Fallback default: Statue of Liberty
        let initialZoom = 15;
        let initialPitch = 45;
        let initialBearing = 0;

        // Attempt to center on the "Test Tileset SoL" for debugging
        if (typeof ol !== 'undefined' && selectionTileGrid) {
            try {
                const testTile1Extent = selectionTileGrid.getTileCoordExtent([21, 617234, 788670]);
                const testTile4Extent = selectionTileGrid.getTileCoordExtent([21, 617235, 788671]);
                const combinedExtent3857 = ol.extent.createEmpty();
                ol.extent.extend(combinedExtent3857, testTile1Extent);
                ol.extent.extend(combinedExtent3857, testTile4Extent);
                const center3857 = ol.extent.getCenter(combinedExtent3857);
                initialCenter = ol.proj.transform(center3857, 'EPSG:3857', 'EPSG:4326');
                initialZoom = 19; // Zoom in close to ZL21 tiles
                initialPitch = 0; // Start flat for easier debugging of 2D tiles
                initialBearing = 0;
                console.log(`DEBUG: Forcing MapLibre initial view to Test Tileset SoL: Center=${initialCenter}, Zoom=${initialZoom}`);
            } catch (e) {
                console.error("DEBUG: Error calculating Test Tileset SoL center:", e);
                // Fallback to Statue of Liberty if calculation fails
                initialCenter = [-74.0445, 40.6892];
                initialZoom = 15;
            }
        } else {
             console.warn("DEBUG: ol or selectionTileGrid not available for Test Tileset SoL centering. Using other defaults.");
             // Fallback logic using globeView or olView will proceed if this block is skipped.
             const globeView = state.globus && state.globus.planet && state.globus.planet.camera ? state.globus.planet.camera : null;
             const olView = state.olMap ? state.olMap.getView() : null;

             if (globeView && typeof globeView.getLonLat === 'function') {
                 const globeLonLat = globeView.getLonLat();
                 if (globeLonLat && typeof globeLonLat.lon === 'number' && typeof globeLonLat.lat === 'number') {
                     initialCenter = [globeLonLat.lon, globeLonLat.lat];
                     const altitude = globeView.getAltitude ? globeView.getAltitude() : 500000;
                     if (altitude > 20000000) initialZoom = 1;
                     else if (altitude > 10000000) initialZoom = 3;
                     else if (altitude > 5000000) initialZoom = 5;
                     else if (altitude > 1000000) initialZoom = 7;
                     else if (altitude > 500000) initialZoom = 9;
                     else if (altitude > 100000) initialZoom = 11;
                     else if (altitude > 50000) initialZoom = 13;
                     else initialZoom = 15;
                     initialZoom = Math.min(Math.max(initialZoom, 0), 22);
                     initialPitch = globeView.getPitch ? Math.abs(globeView.getPitch()) : 45;
                     initialPitch = Math.min(initialPitch, 85);
                     initialBearing = globeView.getHeading ? globeView.getHeading() : 0;
                     console.log(`MapLibre init from Globe: Center=${initialCenter}, Zoom=${initialZoom} (from alt ${altitude}), Pitch=${initialPitch}, Bearing=${initialBearing}`);
                 }
             } else if (olView && typeof olView.getCenter === 'function' && typeof olView.getZoom === 'function') {
                 const olCenter = olView.getCenter();
                 if (olCenter) {
                     try {
                         initialCenter = ol.proj.transform(olCenter, 'EPSG:3857', 'EPSG:4326');
                     } catch (e) { console.error("Error transforming OL center for ML:", e); }
                 }
                 initialZoom = olView.getZoom() || 12;
                 initialPitch = 45;
                 initialBearing = 0;
                 console.log(`MapLibre init from OpenLayers: Center=${initialCenter}, Zoom=${initialZoom}, Pitch=${initialPitch}, Bearing=${initialBearing}`);
             } else {
                 console.log(`MapLibre init using hardcoded defaults (Statue of Liberty): Center=${initialCenter}, Zoom=${initialZoom}, Pitch=${initialPitch}, Bearing=${initialBearing}`);
             }
        }
        
        const globeView = state.globus && state.globus.planet && state.globus.planet.camera ? state.globus.planet.camera : null;
        const olView = state.olMap ? state.olMap.getView() : null;

        if (globeView && typeof globeView.getLonLat === 'function') {
            const globeLonLat = globeView.getLonLat();
            if (globeLonLat && typeof globeLonLat.lon === 'number' && typeof globeLonLat.lat === 'number') {
                initialCenter = [globeLonLat.lon, globeLonLat.lat];
                // Altitude to zoom conversion is complex. Placeholder logic:
                // Higher altitude = lower zoom. This needs a proper formula or calibration.
                const altitude = globeView.getAltitude ? globeView.getAltitude() : 500000;
                if (altitude > 20000000) initialZoom = 1;
                else if (altitude > 10000000) initialZoom = 3;
                else if (altitude > 5000000) initialZoom = 5;
                else if (altitude > 1000000) initialZoom = 7;
                else if (altitude > 500000) initialZoom = 9;
                else if (altitude > 100000) initialZoom = 11;
                else if (altitude > 50000) initialZoom = 13;
                else initialZoom = 15;
                // Cap zoom for MapLibre
                initialZoom = Math.min(Math.max(initialZoom, 0), 22);


                initialPitch = globeView.getPitch ? Math.abs(globeView.getPitch()) : 45; // MapLibre pitch is 0-85
                initialPitch = Math.min(initialPitch, 85);
                
                // OpenGlobus heading: 0 is North, positive clockwise. MapLibre bearing is similar.
                initialBearing = globeView.getHeading ? globeView.getHeading() : 0;
                console.log(`MapLibre init from Globe: Center=${initialCenter}, Zoom=${initialZoom} (from alt ${altitude}), Pitch=${initialPitch}, Bearing=${initialBearing}`);
            }
        } else if (olView && typeof olView.getCenter === 'function' && typeof olView.getZoom === 'function') {
            const olCenter = olView.getCenter();
            if (olCenter) {
                try {
                    initialCenter = ol.proj.transform(olCenter, 'EPSG:3857', 'EPSG:4326');
                } catch (e) { console.error("Error transforming OL center for ML:", e); }
            }
            initialZoom = olView.getZoom() || 12;
            // MapLibre zoom is often +1 from OL for similar view, but this can be style-dependent.
            // For now, use OL zoom directly or add a small fixed offset if desired.
            // initialZoom +=1;
            initialPitch = 45; // Default pitch for a 2D map source
            initialBearing = 0;
            console.log(`MapLibre init from OpenLayers: Center=${initialCenter}, Zoom=${initialZoom}, Pitch=${initialPitch}, Bearing=${initialBearing}`);
        } else {
            // This 'else' now means neither Globe nor OL view was available, so hardcoded defaults (Statue of Liberty) will be used.
            initialCenter = [-74.0445, 40.6892]; // Statue of Liberty
            initialZoom = 15;
            initialPitch = 45;
            initialBearing = 0;
            console.log(`MapLibre init using hardcoded defaults (Statue of Liberty): Center=${initialCenter}, Zoom=${initialZoom}, Pitch=${initialPitch}, Bearing=${initialBearing}`);
        }


        try {
            state.mapLibreMap = new maplibregl.Map({
                container: mapContainer, // Use the obtained mapContainer variable
                style: {
                    version: 8,
                    sources: {}, // Initial empty sources, basemap added by updateMapLibreBasemap
                    layers: []  // Initial empty layers
                },
                center: initialCenter,
                zoom: initialZoom,
                pitch: initialPitch,
                bearing: initialBearing
            });

            state.mapLibreMap.on('load', () => {
                console.log("MapLibre map 'load' event triggered.");
                state.mapLibreMap.addControl(new maplibregl.NavigationControl(), 'top-right');
                
                // Add ZL21 Grid Source and Layer for MapLibre
                if (!state.mapLibreMap.getSource('maplibre-grid-source')) {
                    state.mapLibreMap.addSource('maplibre-grid-source', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });
                }
                if (!state.mapLibreMap.getLayer('maplibre-grid-layer')) {
                    state.mapLibreMap.addLayer({
                        id: 'maplibre-grid-layer',
                        type: 'line',
                        source: 'maplibre-grid-source',
                        paint: {
                            'line-color': 'rgba(0,0,0,1)', // Match OL grid
                            'line-width': 1
                        },
                        minzoom: GRID_VISIBILITY_MIN_ZOOM - 1.5 // Adjusted threshold
                    });
                }

                // Add Saved Tilesets Source and Layer for MapLibre
                if (!state.mapLibreMap.getSource('maplibre-tilesets-source')) {
                    state.mapLibreMap.addSource('maplibre-tilesets-source', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });
                }
                if (!state.mapLibreMap.getLayer('maplibre-tilesets-layer')) {
                    state.mapLibreMap.addLayer({
                        id: 'maplibre-tilesets-layer',
                        type: 'fill',
                        source: 'maplibre-tilesets-source',
                        paint: {
                            'fill-color': ['get', 'color'],
                            'fill-opacity': ['get', 'fillOpacity'],
                            // For stroke on fill layers, MapLibre often requires a separate line layer.
                            // Or, use fill-outline-color if the style supports it well.
                            // For simplicity, we'll add a line layer for strokes.
                        }
                    });
                    state.mapLibreMap.addLayer({ // Separate layer for strokes
                        id: 'maplibre-tilesets-stroke-layer',
                        type: 'line',
                        source: 'maplibre-tilesets-source',
                        paint: {
                            'line-color': ['get', 'color'], // Use the same base color for stroke
                            'line-width': ['get', 'strokeWidth'],
                            'line-opacity': 1 // Strokes are typically fully opaque
                        }
                    });
                }

                if (baseLayerSelect) {
                    updateMapLibreBasemap(baseLayerSelect.value); // This will trigger 'styledata'
                } else {
                    console.warn("baseLayerSelect element not found, cannot set initial MapLibre basemap.");
                }
                
                // moveend/zoomend listeners for grid updates remain
                state.mapLibreMap.on('moveend', updateZ21GridMapLibre);
                state.mapLibreMap.on('zoomend', updateZ21GridMapLibre);

                // Ensure resize observer is attached after map is loaded
                if (mapContainer && !mapContainer._resizeObserverAttached) {
                    new ResizeObserver(() => {
                        if (state.mapLibreMap && mapContainer.offsetParent !== null) {
                            state.mapLibreMap.resize();
                        }
                    }).observe(mapContainer);
                    mapContainer._resizeObserverAttached = true;
                }
            });

            state.mapLibreMap.on('styledata', () => {
                // This event fires after setStyle completes and the style is fully processed.
                // Good place to add sources/layers that depend on the new style, and terrain.
                console.log('MapLibre styledata event fired. Updating dynamic layers and terrain.');
                if (state.mapLibreMap.isStyleLoaded()) { // Double check if style is truly loaded
                    updateZ21GridMapLibre();
                    updateSavedTilesetsMapLibre();
                    addMapLibre3DTerrain();
                } else {
                    console.warn("MapLibre 'styledata' event fired, but isStyleLoaded() is false. Deferring layer/terrain updates.");
                    // Potentially add a one-time 'idle' or 'render' listener to try again
                    state.mapLibreMap.once('render', () => {
                         console.log("MapLibre 'render' after 'styledata'. Retrying layer/terrain updates.");
                         if (state.mapLibreMap.isStyleLoaded()){
                            updateZ21GridMapLibre();
                            updateSavedTilesetsMapLibre();
                            addMapLibre3DTerrain();
                         }
                    });
                }
            });

            state.mapLibreMap.on('error', (e) => {
                console.error('MapLibre map error:', e.error ? e.error.message : e);
            });

        } catch (error) {
            console.error("Failed to initialize MapLibre:", error);
        }
    }

    // --- ZL21 Grid for MapLibre ---
    function updateZ21GridMapLibre() {
        if (!state.mapLibreMap || !state.mapLibreMap.isStyleLoaded() || !selectionTileGrid) {
            // console.warn("updateZ21GridMapLibre: MapLibre map, style, or OL selectionTileGrid not ready.");
            return;
        }

        const currentZoom = state.mapLibreMap.getZoom();
        // MapLibre zoom levels are typically offset. If GRID_VISIBILITY_MIN_ZOOM is 16 for OL, try 15 for ML.
        const showGrid = currentZoom >= (GRID_VISIBILITY_MIN_ZOOM - 1.5); // Use a slightly lower threshold to ensure visibility around the target OL zoom

        if (state.mapLibreMap.getLayer('maplibre-grid-layer')) {
            state.mapLibreMap.setLayoutProperty('maplibre-grid-layer', 'visibility', showGrid ? 'visible' : 'none');
        }

        const gridSource = state.mapLibreMap.getSource('maplibre-grid-source');
        if (!showGrid) {
            if (gridSource) {
                gridSource.setData({ type: 'FeatureCollection', features: [] });
            }
            return;
        }

        clearTimeout(gridUpdateTimeoutML);
        gridUpdateTimeoutML = setTimeout(() => {
            if (!state.mapLibreMap || !state.mapLibreMap.isStyleLoaded()) return; // Re-check in timeout
            // console.time('updateZ21GridMapLibre');

            const bounds = state.mapLibreMap.getBounds();
            const mapExtentLngLat = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
            
            let olExtent3857;
            try {
                olExtent3857 = ol.proj.transformExtent(mapExtentLngLat, 'EPSG:4326', 'EPSG:3857');
            } catch (e) {
                console.error("Error transforming extent for MapLibre grid:", e);
                // console.timeEnd('updateZ21GridMapLibre');
                return;
            }

            const features = [];
            try {
                selectionTileGrid.forEachTileCoord(olExtent3857, TILE_SELECTION_ZOOM, function(tileCoord) {
                    const tileExtent3857 = selectionTileGrid.getTileCoordExtent(tileCoord);
                    const tileExtent4326 = ol.proj.transformExtent(tileExtent3857, 'EPSG:3857', 'EPSG:4326');
                    
                    const coords = [
                        [tileExtent4326[0], tileExtent4326[1]], // minLng, minLat
                        [tileExtent4326[2], tileExtent4326[1]], // maxLng, minLat
                        [tileExtent4326[2], tileExtent4326[3]], // maxLng, maxLat
                        [tileExtent4326[0], tileExtent4326[3]], // minLng, maxLat
                        [tileExtent4326[0], tileExtent4326[1]]  // minLng, minLat (close loop)
                    ];
                    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} });
                });
            } catch (error) {
                console.error("Error in forEachTileCoord for MapLibre grid:", error);
            }
            
            if (gridSource) {
                gridSource.setData({ type: 'FeatureCollection', features: features });
            }
            // console.timeEnd('updateZ21GridMapLibre');
        }, 250); // Slightly longer timeout for MapLibre grid to avoid excessive updates during fast pans/zooms
    }

    // --- Saved Tilesets for MapLibre ---
    function updateSavedTilesetsMapLibre() {
        if (!state.mapLibreMap || !state.mapLibreMap.isStyleLoaded() || !window.userLayers || typeof ol === 'undefined') {
            // console.warn("updateSavedTilesetsMapLibre: Prerequisites not met.");
            return;
        }

        const tilesetSource = state.mapLibreMap.getSource('maplibre-tilesets-source');
        if (!tilesetSource) {
            console.warn("MapLibre tileset source 'maplibre-tilesets-source' not found.");
            return;
        }

        const features = [];
        for (const layerId in window.userLayers) {
            const userLayer = window.userLayers[layerId];
            if (userLayer && userLayer.layer) {
                const olFeatures = userLayer.layer.getSource().getFeatures();
                olFeatures.forEach(olFeature => {
                    if (olFeature.get('isVisible') === false) return; // Skip non-visible tilesets

                    const geometry = olFeature.getGeometry();
                    if (geometry && typeof geometry.getExtent === 'function') {
                        try {
                            // Assuming features are groups of tiles (polygons)
                            // We need to transform each coordinate of the polygon
                            const olCoords3857 = geometry.getCoordinates()[0]; // Get outer ring
                            if (!olCoords3857 || olCoords3857.length === 0) {
                                console.warn("Feature has no coordinates:", olFeature);
                                return; // Skip if no coordinates
                            }
                            const mlCoords4326 = olCoords3857.map(coord => ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326'));
                            
                            if (mlCoords4326 && mlCoords4326.length > 0) {
                                features.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Polygon',
                                        coordinates: [mlCoords4326] // GeoJSON Polygon expects array of rings
                                    },
                                    properties: {
                                        tilesetGroupId: olFeature.get('tilesetGroupId') || 'unknown',
                                        tilesetName: olFeature.get('tilesetName') || 'Unnamed Tileset',
                                        color: olFeature.get('color') || '#33CCFF',
                                        fillOpacity: Number(olFeature.get('fillOpacity') === undefined ? 0.6 : olFeature.get('fillOpacity')),
                                        strokeWidth: Number(olFeature.get('strokeWidth') === undefined ? 1 : olFeature.get('strokeWidth')),
                                    }
                                });
                            }
                        } catch (e) {
                            console.error("Error transforming feature for MapLibre:", olFeature.getId(), e);
                        }
                    }
                });
            }
        }
        tilesetSource.setData({ type: 'FeatureCollection', features: features });
        // console.log(`MapLibre tilesets updated. ${features.length} features rendered.`);
    }


    if (mapLibrarySelect) {
        mapLibrarySelect.addEventListener('change', function() {
            const selectedLibrary = this.value;
            console.log(`Map library toggled to: ${selectedLibrary}`);

            const olMapContainer = document.getElementById('map');
            const leafletMapContainer = document.getElementById('leaflet-map-container');
            // mapLibreMapContainerElement is already defined globally in this script

            // Hide all map containers and their specific toggles initially
            if (olMapContainer) olMapContainer.style.display = 'none';
            if (mapLibreMapContainerElement) mapLibreMapContainerElement.style.display = 'none';
            if (leafletMapContainer) leafletMapContainer.style.display = 'none';
            if (olCesiumToggleBtn) olCesiumToggleBtn.style.display = 'none';
            if (mapLibreToggleBtn) mapLibreToggleBtn.style.display = 'none';


            // Detach OpenLayers map if it exists and we are switching away
            if (selectedLibrary !== 'openlayers' && state.olMap && typeof state.olMap.setTarget === 'function') {
                state.olMap.setTarget(null);
                console.log("OpenLayers map detached.");
            }
            // Proper cleanup for MapLibre if switching away
            if (selectedLibrary !== 'maplibre' && state.mapLibreMap) {
                destroyMapLibreMap(); // Assumes destroyMapLibreMap handles state.mapLibreMap = null;
                console.log("MapLibre map destroyed.");
            }
            // Proper cleanup for Leaflet if switching away
            if (selectedLibrary !== 'leaflet' && state.leafletMap && typeof state.leafletMap.remove === 'function') {
                state.leafletMap.remove();
                state.leafletMap = null;
                console.log("Leaflet map removed.");
            }


            if (selectedLibrary === 'maplibre') {
                if (mapLibreMapContainerElement) mapLibreMapContainerElement.style.display = 'block';
                if (mapLibreToggleBtn) mapLibreToggleBtn.style.display = 'block';

                if (!state.mapLibreMap) {
                    initMapLibreMap();
                } else {
                    state.mapLibreMap.resize(); // Ensure it resizes if container was hidden
                    if (state.mapLibreMap.isStyleLoaded()) {
                        updateSavedTilesetsMapLibre();
                        updateZ21GridMapLibre();
                    } else {
                        state.mapLibreMap.once('style.load', () => {
                           updateSavedTilesetsMapLibre();
                           updateZ21GridMapLibre();
                        });
                    }
                }
                state.activeMapLibrary = 'maplibre';
                if (baseLayerSelectElement && state.mapLibreMap && state.mapLibreMap.isStyleLoaded()) {
                    updateMapLibreBasemap(baseLayerSelectElement.value);
                } else if (baseLayerSelectElement && state.mapLibreMap) {
                    console.log("MapLibre style not loaded yet, basemap update deferred to 'load' event.");
                }

            } else if (selectedLibrary === 'openlayers') {
                if (olMapContainer) olMapContainer.style.display = 'block';
                if (olCesiumToggleBtn) olCesiumToggleBtn.style.display = 'block';

                if (!state.olMap) { // If no map instance, or it was previously detached and nulled
                    initializeOpenLayersMap(); // This should create and target the map
                } else { // Instance exists, just ensure it's targeted and updated
                    state.olMap.setTarget(olMapContainer);
                    state.olMap.updateSize();
                    console.log("OpenLayers map re-attached and size updated.");
                }
                // Ensure data is fresh on OL map
                updateSavedTilesetsOL();
                updateZ21GridOL();
                state.activeMapLibrary = 'openlayers';

            // } else if (selectedLibrary === 'leaflet') {
            //     if (leafletMapContainer) leafletMapContainer.style.display = 'block';
            //     // No specific 3D toggle for Leaflet in this setup

            //     if (!state.leafletMap) {
            //         // initLeafletMap(); // Commented out
            //     } else {
            //         state.leafletMap.invalidateSize(); // Important for when container was hidden
            //         // TODO: Add functions to update Z21 grid and saved tilesets for Leaflet
            //         // updateSavedTilesetsLeaflet(); // Commented out
            //         // updateZ21GridLeaflet(); // Commented out
            //         console.log("Leaflet map size invalidated. TODO: Implement data updates for Leaflet.");
            //     }
            //     state.activeMapLibrary = 'leaflet';
            //     // Initial basemap set for Leaflet when library is switched
            //     if (baseLayerSelectElement && state.leafletMap) {
            //          // updateLeafletBasemap(baseLayerSelectElement.value); // Commented out
            //     }
            }
        });
    }

    // Leaflet Map Initialization
    /*
    function initLeafletMap() {
        console.log("Initializing Leaflet map...");
        if (state.leafletMap) {
            console.log("Leaflet map already initialized, ensuring it's visible and sized.");
            state.leafletMap.invalidateSize();
            return;
        }

        const leafletMapContainer = document.getElementById('leaflet-map-container');
        if (!leafletMapContainer) {
            console.error("Leaflet map container 'leaflet-map-container' not found.");
            return;
        }
         // Ensure container is visible before initializing map to avoid size issues
        if (leafletMapContainer.style.display === 'none') {
            console.warn("Leaflet container was hidden, map might not initialize with correct size. Forcing display block for init.");
            // leafletMapContainer.style.display = 'block'; // Temporarily show for init, though ideally it's shown by the select handler
        }


        // Basic Leaflet map setup
        state.leafletMap = L.map('leaflet-map-container').setView([state.currentLat || 0, state.currentLon || 0], state.currentZoom || 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(state.leafletMap);

        console.log("Leaflet map initialized.");

        // Event listener for map movement to update state (similar to OpenLayers)
        state.leafletMap.on('moveend', function() {
            const center = state.leafletMap.getCenter();
            state.currentLat = center.lat;
            state.currentLon = center.lng;
            state.currentZoom = state.leafletMap.getZoom();
            // console.log(`Leaflet map moved to: Lat ${state.currentLat}, Lon ${state.currentLon}, Zoom ${state.currentZoom}`);
            // updateZ21GridLeaflet(); // Update grid on moveend // Commented out
        });

        // updateZ21GridLeaflet(); // Initial grid draw for Leaflet // Commented out
        // updateSavedTilesetsLeaflet(); // Initial draw for saved tilesets // Commented out

        // Click listener for tile info and selection
        state.leafletMap.on('click', function(e) {
            if (!selectionTileGrid) {
                console.warn("Leaflet click: selectionTileGrid (OpenLayers utility) not available.");
                return;
            }
            if (currentInteractionMode !== 'selectTiles') { // Only select if in 'selectTiles' mode
                // console.log("Leaflet click: Not in selectTiles mode.");
                return;
            }

            const latlng = e.latlng;
            // Convert Leaflet LatLng to an OL-compatible coordinate for selectionTileGrid
            // selectionTileGrid likely uses EPSG:3857
            const pointEPSG4326 = [latlng.lng, latlng.lat];
            try {
                const pointEPSG3857 = ol.proj.fromLonLat(pointEPSG4326); // ol.proj.transform(pointEPSG4326, 'EPSG:4326', 'EPSG:3857');
                
                // Use OL's tileGrid to find the ZL21 tile coordinate
                const tileCoordZL21 = selectionTileGrid.getTileCoordForCoordAndZ(pointEPSG3857, TILE_SELECTION_ZOOM);
                
                const finalTileCoord = [TILE_SELECTION_ZOOM, tileCoordZL21[1], tileCoordZL21[2]];
                
                console.log(`Leaflet clicked tile (ZL${TILE_SELECTION_ZOOM}): X=${finalTileCoord[1]}, Y=${finalTileCoord[2]}`);
                
                if (typeof toggleTileSelection === "function") {
                    toggleTileSelection(finalTileCoord);
                    // updateLeafletSelectionLayer(); // Update Leaflet's own selection highlight // Commented out
                } else {
                    console.error("toggleTileSelection function is not defined!");
                }

            } catch (error) {
                console.error("Error processing Leaflet map click for tile selection:", error);
            }
        });
        console.log("Leaflet map click listener for tile selection added.");
    }
    */

    /*
    function updateZ21GridLeaflet() {
        if (!state.leafletMap || !selectionTileGrid) { // selectionTileGrid is from OL, used for calculations
            // console.warn("updateZ21GridLeaflet: Leaflet map or OL selectionTileGrid not ready.");
            return;
        }

        clearTimeout(gridUpdateTimeoutLeaflet);
        gridUpdateTimeoutLeaflet = setTimeout(() => {
            // console.time('updateZ21GridLeaflet');
            const currentZoom = state.leafletMap.getZoom();

            if (state.leafletGridLayer) {
                state.leafletGridLayer.clearLayers();
            } else {
                // state.leafletGridLayer = L.featureGroup().addTo(state.leafletMap); // Commented out
            }

            if (currentZoom < GRID_VISIBILITY_MIN_ZOOM) {
                // console.log(`Leaflet zoom ${currentZoom.toFixed(2)} < ${GRID_VISIBILITY_MIN_ZOOM}, grid hidden.`);
                // console.timeEnd('updateZ21GridLeaflet');
                return;
            }

            const mapBounds = state.leafletMap.getBounds();
            const olExtentEPSG4326 = [
                mapBounds.getWest(), mapBounds.getSouth(),
                mapBounds.getEast(), mapBounds.getNorth()
            ];

            let olExtentForGrid;
            try {
                olExtentForGrid = ol.proj.transformExtent(olExtentEPSG4326, 'EPSG:4326', 'EPSG:3857');
            } catch (e) {
                console.error("Error transforming extent for Leaflet grid calculation:", e);
                // console.timeEnd('updateZ21GridLeaflet');
                return;
            }
            
            const gridStyle = {
                color: '#888',
                weight: 0.5,
                opacity: 0.7,
                fillOpacity: 0.0
            };

            selectionTileGrid.forEachTileCoord(olExtentForGrid, TILE_SELECTION_ZOOM, function(tileCoord) {
                const tileExtent3857 = selectionTileGrid.getTileCoordExtent(tileCoord);
                const tileExtent4326 = ol.proj.transformExtent(tileExtent3857, 'EPSG:3857', 'EPSG:4326');
                
                const bounds = L.latLngBounds([
                    [tileExtent4326[1], tileExtent4326[0]],
                    [tileExtent4326[3], tileExtent4326[2]]
                ]);
                // L.rectangle(bounds, gridStyle).addTo(state.leafletGridLayer); // Commented out
            });
            // console.timeEnd('updateZ21GridLeaflet');
        }, 250); // Debounce
    }
    */

    /*
    function updateSavedTilesetsLeaflet() {
        if (!state.leafletMap || !window.selectedLayerId || !window.userLayers || !window.userLayers[window.selectedLayerId] || !selectionTileGrid) {
            // console.warn("updateSavedTilesetsLeaflet: Prerequisites not met.");
            return;
        }

        const currentLayerData = window.userLayers[window.selectedLayerId];
        if (!currentLayerData || !currentLayerData.layer) {
            // console.warn("updateSavedTilesetsLeaflet: No active layer data found.");
            return;
        }
        const olSource = currentLayerData.layer.getSource();
        if (!olSource || typeof olSource.getFeatures !== 'function') {
            // console.warn("updateSavedTilesetsLeaflet: Active layer has no OL source or getFeatures method.");
            return;
        }

        if (state.leafletSavedTilesetsLayerGroup) {
            state.leafletSavedTilesetsLayerGroup.clearLayers();
        } else {
            // state.leafletSavedTilesetsLayerGroup = L.featureGroup().addTo(state.leafletMap); // Commented out
        }

        const olFeatures = olSource.getFeatures();
        const tilesetGroups = {}; // To group tiles by tilesetGroupId

        olFeatures.forEach(olFeature => {
            const groupId = olFeature.get('tilesetGroupId');
            const tileId = olFeature.get('tileId'); // Assuming this is "Z-X-Y"

            if (groupId && tileId) {
                if (!tilesetGroups[groupId]) {
                    tilesetGroups[groupId] = {
                        features: [],
                        name: olFeature.get('tilesetName') || 'Unnamed Tileset',
                        color: olFeature.get('color') || '#3388ff', // Default Leaflet blue
                        fillOpacity: olFeature.get('fillOpacity') === undefined ? 0.2 : olFeature.get('fillOpacity'),
                        strokeWidth: olFeature.get('strokeWidth') === undefined ? 1 : olFeature.get('strokeWidth'),
                    };
                }
                tilesetGroups[groupId].features.push(olFeature);
            }
        });

        for (const groupId in tilesetGroups) {
            const group = tilesetGroups[groupId];
            group.features.forEach(olFeature => {
                const tileId = olFeature.get('tileId');
                const tileCoordString = tileId.split('-'); // Z, X, Y
                if (tileCoordString.length === 3) {
                    const tileCoord = tileCoordString.map(Number);
                     try {
                        const tileExtent3857 = selectionTileGrid.getTileCoordExtent(tileCoord);
                        const tileExtent4326 = ol.proj.transformExtent(tileExtent3857, 'EPSG:3857', 'EPSG:4326');
                        
                        const bounds = L.latLngBounds([
                            [tileExtent4326[1], tileExtent4326[0]], // South-West
                            [tileExtent4326[3], tileExtent4326[2]]  // North-East
                        ]);

                        const style = {
                            color: group.color,
                            weight: group.strokeWidth,
                            opacity: 0.8, // Stroke opacity
                            fillColor: group.color,
                            fillOpacity: group.fillOpacity
                        };
                        // L.rectangle(bounds, style).addTo(state.leafletSavedTilesetsLayerGroup); // Commented out
                    } catch (e) {
                        console.error(`Error processing tile ${tileId} for Leaflet display:`, e);
                    }
                }
            });
        }
        // console.log("Leaflet saved tilesets updated.");
    }
    */

    // let leafletSelectionLayer = null; // Commented out
    /*
    function updateLeafletSelectionLayer() {
        if (!state.leafletMap || !selectionSource) { // selectionSource is the OL source
            // console.warn("updateLeafletSelectionLayer: Leaflet map or OL selectionSource not ready.");
            return;
        }

        if (leafletSelectionLayer) {
            leafletSelectionLayer.clearLayers();
        } else {
            // leafletSelectionLayer = L.featureGroup().addTo(state.leafletMap); // Commented out
        }

        const selectedOlFeatures = selectionSource.getFeatures();
        if (selectedOlFeatures.length === 0 && leafletSelectionLayer) {
            return;
        }
        
        const selectionStyle = {
            color: '#FFFF00',
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.3,
            fillColor: '#FFFF00'
        };

        selectedOlFeatures.forEach(olFeature => {
            const tileId = olFeature.getId();
            if (tileId && selectionTileGrid) {
                const tileCoordString = tileId.split('-');
                if (tileCoordString.length === 3) {
                    const tileCoord = tileCoordString.map(Number);
                    try {
                        const tileExtent3857 = selectionTileGrid.getTileCoordExtent(tileCoord);
                        const tileExtent4326 = ol.proj.transformExtent(tileExtent3857, 'EPSG:3857', 'EPSG:4326');
                        
                        const bounds = L.latLngBounds([
                            [tileExtent4326[1], tileExtent4326[0]],
                            [tileExtent4326[3], tileExtent4326[2]]
                        ]);
                        // L.rectangle(bounds, selectionStyle).addTo(leafletSelectionLayer); // Commented out
                    } catch (e) {
                        console.error(`Error processing selected tile ${tileId} for Leaflet highlight:`, e);
                    }
                }
            }
        });
    }
    */


    if (mapLibreToggleBtn) {
        // This block should contain logic for mapLibreToggleBtn, not Leaflet
        // The Leaflet logic was duplicated here.
        // The original mapLibreToggleBtn logic (if any) needs to be restored or verified.
        // For now, I am removing the duplicated Leaflet code.
        // The correct mapLibrarySelect event listener should end at line 4434.
        // The initLeafletMap function is correctly placed after that.
    }

    // The if (mapLibreToggleBtn) block below (starting around original line 4645)
    // contains the actual event listener for mapLibreToggleBtn.
    // This duplicated initLeafletMap function is being removed.
    // The original initLeafletMap function (ending around original line 4587) is correct.

    if (mapLibreToggleBtn) {
        mapLibreToggleBtn.addEventListener('click', () => {
            if (state.mapLibreMap) {
                const currentPitch = state.mapLibreMap.getPitch();
                if (currentPitch > 0) {
                    state.mapLibreMap.easeTo({ pitch: 0, duration: 500 });
                    mapLibreToggleBtn.textContent = '3D';
                } else {
                    state.mapLibreMap.easeTo({ pitch: 60, duration: 500 }); // Default 3D pitch
                    mapLibreToggleBtn.textContent = '2D';
                }
            }
        });
    }
    // --- End MapLibre Integration ---

    // --- Base Layer Selection Logic ---
    const baseLayerSelectElement = document.getElementById('base-layer-select'); // Renamed
    const customLayerInputsDivElement = document.getElementById('custom-layer-inputs');
    const customLayerNameInputElement = document.getElementById('custom-layer-name');
    const customLayerUrlInputElement = document.getElementById('custom-layer-url');
    const addCustomLayerBtnElement = document.getElementById('add-custom-layer-btn');
// --- Cesium Terrain Selection Logic ---
    const cesiumTerrainSelectElement = document.getElementById('cesium-terrain-select');
    if (cesiumTerrainSelectElement) {
        // Load preference from localStorage
        const savedTerrainPreference = localStorage.getItem('cesiumTerrainPreference');
        if (savedTerrainPreference) {
            cesiumTerrainSelectElement.value = savedTerrainPreference;
            // Note: This only sets the dropdown. The actual terrain provider is set
            // during initializeOLCesiumMapPanel or when the 3D view is toggled on.
        }

        cesiumTerrainSelectElement.addEventListener('change', function() {
            const selectedTerrainType = this.value;
            console.log(`Cesium terrain selection changed to: ${selectedTerrainType}`);
            localStorage.setItem('cesiumTerrainPreference', selectedTerrainType);
            
            // Call updateCesiumTerrainProvider if OLCesium is initialized and active
            // and the active map panel is the main one (not a secondary viewer)
            if (state.activeMapLibrary === 'openlayers' && olcsMapPanel && olcsMapPanel.getEnabled()) {
                updateCesiumTerrainProvider(selectedTerrainType);
            } else if (state.activeMapLibrary === 'openlayers' && olcsMapPanel && !olcsMapPanel.getEnabled()) {
                // If OLCesium is initialized but not active, the terrain will be applied when it's next enabled.
                console.log("Cesium view (OLCesium) not active, terrain preference saved and will apply when 3D view is enabled.");
            }
            // If another map library is active, this change will be picked up if/when OLCesium is re-initialized or enabled.
        });
    }
    // --- End Cesium Terrain Selection Logic ---

    const olBaseLayers = {
        'satellite': { source: () => new ol.source.XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attributions: 'Tiles © Esri', maxZoom: 19 }) },
        'osm': { source: () => new ol.source.OSM({ attributions: '© OpenStreetMap contributors', maxZoom: 19 }) },
        'topo': { source: () => new ol.source.XYZ({ url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', attributions: '© OpenTopoMap (CC-BY-SA)', maxZoom: 17 }) },
        'terrarium': { source: () => new ol.source.XYZ({ url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', attributions: '© Mapzen, OpenStreetMap, and SRTM', maxZoom: 15, tileGrid: ol.tilegrid.createXYZ({maxZoom: 15}) }) } // Terrarium has specific needs
    };

    /*
    const leafletBaseLayers = {
        'satellite': { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', options: { attribution: 'Tiles © Esri', maxZoom: 19 } },
        'osm': { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options: { attribution: '© OpenStreetMap contributors', maxZoom: 19 } },
        'topo': { url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', options: { attribution: '© OpenTopoMap (CC-BY-SA)', maxZoom: 17 } },
        // Terrarium might need specific handling for Leaflet if it's not a standard XYZ, or a different source.
        // For now, let's assume it's XYZ compatible for Leaflet or skip it.
        // 'terrarium': { url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', options: { attribution: '© Mapzen, OpenStreetMap, and SRTM', maxZoom: 15 } }
    };
    */
    // let currentLeafletBaseLayer = null; // To keep track of the current Leaflet base layer // Commented out

    const ogBaseLayerMappings = { // Renamed to avoid conflict
        'satellite': 'Satellite', // Name of the OG layer defined in initializeOpenGlobus
        'osm': 'OpenStreetMap'  // Name of the OG layer defined in initializeOpenGlobus
        // Add OpenGlobus equivalents for topo/terrarium if they are set up in initializeOpenGlobus
    };

    if (baseLayerSelectElement) { // Use renamed variable
        baseLayerSelectElement.addEventListener('change', function() {
            const selectedValue = this.value;
            if (customLayerInputsDivElement) customLayerInputsDivElement.style.display = 'none'; // Hide custom inputs by default

            if (selectedValue === 'add-custom') {
                if (customLayerInputsDivElement) customLayerInputsDivElement.style.display = 'block';
                return;
            }

            if (state.activeMapLibrary === 'openlayers') {
                if (state.olMap) {
                    const currentBaseLayer = state.olMap.getLayers().getArray().find(layer => layer.get('isBaseLayer'));
                    if (currentBaseLayer) {
                        state.olMap.removeLayer(currentBaseLayer);
                    }
                    if (olBaseLayers[selectedValue]) {
                        const newSource = olBaseLayers[selectedValue].source();
                        const newBaseLayerOL = new ol.layer.Tile({ source: newSource, isBaseLayer: true }); // Tag it
                        state.olMap.getLayers().insertAt(0, newBaseLayerOL);
                        console.log(`OpenLayers basemap switched to: ${selectedValue}`);
                    } else {
                        console.warn(`OpenLayers definition for ${selectedValue} not found.`);
                    }
                } else {
                    console.warn("OpenLayers map not initialized when trying to change basemap.");
                }
            } else if (state.activeMapLibrary === 'maplibre') {
                if (state.mapLibreMap && state.mapLibreMap.isStyleLoaded()) {
                    updateMapLibreBasemap(selectedValue);
                } else if (state.mapLibreMap) {
                     console.log("MapLibre style not loaded, deferring basemap update to map 'load' event or next interaction.");
                } else {
                    console.warn("MapLibre map not initialized when trying to change basemap.");
                }
            // } else if (state.activeMapLibrary === 'leaflet') { // Commented out Leaflet block
                // if (state.leafletMap) {
                    // updateLeafletBasemap(selectedValue); // Commented out
                // } else {
                    // console.warn("Leaflet map not initialized when trying to change basemap.");
                // }
            }
 
            // Sync OpenGlobus basemap if applicable
            if (window.globus && window.globus.planet && ogBaseLayerMappings[selectedValue]) {
                 const ogLayerName = ogBaseLayerMappings[selectedValue];
                 if (window.globus.planet.layers[ogLayerName]) {
                    window.globus.planet.setBaseLayer(window.globus.planet.layers[ogLayerName]);
                    console.log(`OpenGlobus basemap synced to: ${ogLayerName}`);
                 } else {
                    console.warn(`OpenGlobus layer named '${ogLayerName}' for basemap '${selectedValue}' not found.`);
                 }
            }
        });
    }

    if (addCustomLayerBtnElement && customLayerNameInputElement && customLayerUrlInputElement && baseLayerSelectElement && customLayerInputsDivElement) { // Use renamed variable
        addCustomLayerBtnElement.addEventListener('click', () => {
            const name = customLayerNameInputElement.value.trim();
            const url = customLayerUrlInputElement.value.trim();
            if (!name || !url) {
                alert("Please enter both a name and a URL for the custom layer.");
                return;
            }
            if (state.activeMapLibrary === 'openlayers') {
                if (state.olMap) {
                    const currentBaseLayer = state.olMap.getLayers().getArray().find(layer => layer.get('isBaseLayer'));
                    if (currentBaseLayer) {
                        state.olMap.removeLayer(currentBaseLayer);
                    }
                    const newCustomSource = new ol.source.XYZ({ url: url, attributions: name });
                    const newCustomLayerOL = new ol.layer.Tile({ source: newCustomSource, isBaseLayer: true }); // Tag it
                    state.olMap.getLayers().insertAt(0, newCustomLayerOL);

                    const optionId = `custom-${name.replace(/\s+/g, '-')}`;
                    const existingOption = baseLayerSelectElement.querySelector(`option[value="${optionId}"]`); // Use renamed variable
                    if (existingOption) existingOption.remove();
                    
                    const newOption = document.createElement('option');
                    newOption.value = optionId;
                    newOption.textContent = `Custom: ${name}`;
                    newOption.selected = true;
                    baseLayerSelectElement.insertBefore(newOption, baseLayerSelectElement.querySelector('option[value="add-custom"]')); // Use renamed variable
                    customLayerInputsDivElement.style.display = 'none';
                    customLayerNameInputElement.value = '';
                    customLayerUrlInputElement.value = '';
                } else {
                     console.warn("OpenLayers map not initialized, cannot add custom layer.");
                }
            } else if (state.activeMapLibrary === 'maplibre') {
                console.warn(`Add custom layer for MapLibre: Name: ${name}, URL: ${url}. UI for this is not fully implemented for MapLibre.`);
                alert("Adding custom layers to MapLibre via this UI is not fully implemented yet.");
                // Optionally hide inputs after attempt
                customLayerInputsDivElement.style.display = 'none';
                customLayerNameInputElement.value = '';
                customLayerUrlInputElement.value = '';
            }
            // Note: Custom XYZ layers are not automatically added to OpenGlobus here.
        });
    }

    /*
    function updateLeafletBasemap(layerKey) {
        if (!state.leafletMap || !leafletBaseLayers[layerKey]) {
            console.warn(`Leaflet map not ready or layer key "${layerKey}" not found in leafletBaseLayers.`);
            // If OSM is the default and layerKey is not found, ensure OSM is shown
            if (state.leafletMap && !leafletBaseLayers[layerKey] && leafletBaseLayers['osm'] && (!currentLeafletBaseLayer || currentLeafletBaseLayer.options.attribution !== leafletBaseLayers['osm'].options.attribution)) {
                 if (currentLeafletBaseLayer) {
                    state.leafletMap.removeLayer(currentLeafletBaseLayer);
                }
                // currentLeafletBaseLayer = L.tileLayer(leafletBaseLayers['osm'].url, leafletBaseLayers['osm'].options).addTo(state.leafletMap); // Commented out
                console.log("Leaflet basemap defaulted to OSM due to missing key:", layerKey);
            }
            return;
        }

        if (currentLeafletBaseLayer) {
            state.leafletMap.removeLayer(currentLeafletBaseLayer);
        }
        // currentLeafletBaseLayer = L.tileLayer(leafletBaseLayers[layerKey].url, leafletBaseLayers[layerKey].options).addTo(state.leafletMap); // Commented out
        console.log(`Leaflet basemap switched to: ${layerKey}`);
    }
    */
    // --- End Base Layer Selection Logic ---
 
    // Apply settings on load
    setTimeout(() => {
        console.log("%cAttempting to apply initial settings after 1s delay...", "color: blue;");
        loadSettings();
        if (window.globus && window.globus.planet) { 
            applyStartLocationSettings();
        } else {
            console.warn("Initial applyStartLocationSettings skipped: globus.planet not ready after 1s delay.");
        }
        applyGridSettings();
        
        // Initialize OpenLayers and OpenGlobus maps
        initializeOpenLayersMap();
        initializeOpenGlobus();
        
        // Load the test tileset (SoL 2x2 grid) after maps are initialized
        if (typeof loadTestTilesetToLayer0 === 'function') {
            console.log("Attempting to load test tileset on startup...");
            loadTestTilesetToLayer0();
        } else {
            console.warn("loadTestTilesetToLayer0 function is not defined, cannot load test data.");
        }
        
        // Load the test tileset after maps are initialized
        if (typeof loadTestTilesetToLayer0 === "function") {
            loadTestTilesetToLayer0();
        }

        // Final update for MapLibre tilesets after all initializations
        if (state.mapLibreMap && state.mapLibreMap.isStyleLoaded()) {
            updateSavedTilesetsMapLibre();
        } else if (state.mapLibreMap) {
            state.mapLibreMap.once('style.load', updateSavedTilesetsMapLibre); // Or 'load' if style might not be set yet
        }
 
        // // Programmatic test: Fly to Statue of Liberty and select a tile
        // console.log("%cPROGRAMMATIC TEST: Initiating flyToStatueOfLiberty...", "color: #FFD700; font-weight: bold;");
        // if (window.globus && window.globus.planet) {
        //     flyToStatueOfLiberty();
        //
        //     setTimeout(() => {
        //         console.log("%cPROGRAMMATIC TEST: Attempting to select tile at Statue of Liberty after camera flight.", "color: #FFD700; font-weight: bold;");
        //         if (typeof og !== 'undefined' && og.mercator && window.globus && window.globus.planet) {
        //             const STATUE_OF_LIBERTY_LON = -74.0445;
        //             const STATUE_OF_LIBERTY_LAT = 40.6892;
        //
        //             try {
        //                 // const tileCoordsArr = og.mercator.lonLatToTile(new og.LonLat(STATUE_OF_LIBERTY_LON, STATUE_OF_LIBERTY_LAT), TILE_SELECTION_ZOOM); // Original
        //                 const lonLatSoL = new og.LonLat(STATUE_OF_LIBERTY_LON, STATUE_OF_LIBERTY_LAT);
        //                 const tileXSoL = og.mercator.getTileX(lonLatSoL.lon, TILE_SELECTION_ZOOM);
        //                 const tileYSoL = og.mercator.getTileY(lonLatSoL.lat, TILE_SELECTION_ZOOM);
        //                 const tileZSoL = TILE_SELECTION_ZOOM;
        //                 const tileCoordsArr = [tileXSoL, tileYSoL, tileZSoL]; // Simulate original array structure
        //                 if (tileCoordsArr && tileCoordsArr.length === 3) {
        //                     const targetTile = { z: tileCoordsArr[2], x: tileCoordsArr[0], y: tileCoordsArr[1] };
        //
        //                     // Ensure it's not already selected (though unlikely for a fresh load programmatic selection)
        //                     // const existingIndex = selectedGlobeTiles.findIndex( // selectedGlobeTiles is not defined
        //                     //     t => t.x === targetTile.x && t.y === targetTile.y && t.z === targetTile.z
        //                     // );
        //
        //                     // if (existingIndex === -1) {
        //                         // selectedGlobeTiles.push(targetTile); // selectedGlobeTiles is not defined
        //                         // console.log(`%cPROGRAMMATIC TEST: Selected Z${TILE_SELECTION_ZOOM} tile at Statue of Liberty: X:${targetTile.x}, Y:${targetTile.y}. Total selected: ${selectedGlobeTiles.length}`, "color: #00FF00; font-weight: bold;");
        //                     // } else {
        //                         // console.log(`%cPROGRAMMATIC TEST: Tile at Statue of Liberty was already selected. X:${targetTile.x}, Y:${targetTile.y}`, "color: #FFFF00;");
        //                     // }
        //
        //                     if (gridLayerOG) {
        //                         gridLayerOG.clear(); // This will trigger a redraw with the new selection
        //                         console.log("PROGRAMMATIC TEST: gridLayerOG cleared to reflect selection.");
        //                     } else {
        //                         console.warn("PROGRAMMATIC TEST: gridLayerOG is null, cannot refresh to show selection.");
        //                     }
        //                 } else {
        //                     console.error("PROGRAMMATIC TEST: og.mercator.lonLatToTile did not return valid coordinates for Statue of Liberty.", tileCoordsArr);
        //                 }
        //             } catch (e) {
        //                 console.error("PROGRAMMATIC TEST: Error during tile conversion or selection for Statue of Liberty:", e);
        //             }
        //         } else {
        //             console.error("PROGRAMMATIC TEST: OpenGlobus (og, og.mercator, window.globus.planet) not fully available for tile selection.");
        //         }
        //     }, 3000); // Delay to allow camera to fly
        // } else {
        //     console.error("PROGRAMMATIC TEST: Globe not ready, cannot fly to Statue of Liberty or select tile.");
        // }

    }, 1000);

    // Initialize maps and globes now that all their functions should be defined
    if (typeof initializeOpenLayersMap === 'function') {
        initializeOpenLayersMap();
    } else {
        console.error("initializeOpenLayersMap function is not defined! Maps may not work.");
    }
    if (typeof initializeOpenGlobus === 'function') {
        initializeOpenGlobus();
    } else {
        console.error("initializeOpenGlobus function is not defined! Globe may not work.");
    }

// --- Minimize/Restore Panel Logic ---
    const minimizeButtons = document.querySelectorAll('.control-panel .minimize-btn');
    minimizeButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent click from bubbling to panel drag logic if header is draggable
            const panel = this.closest('.control-panel');
            if (panel) {
                // Hide the entire panel.
                // The main toolbar buttons for "Maps" or "Globes" will show it again.
                panel.style.display = 'none';
                // No need to change button text or class since the button will be hidden.
                // The title "Toggle Panel" on the button is still generally accurate.
            }
        });
    });
    // --- End Minimize/Restore Panel Logic ---
    // Event Listeners for Globe Buttons
    if (settingGlobeEarthBtn) { // Use new var name
        settingGlobeEarthBtn.addEventListener('click', switchToEarthView);
    }
    if (settingGlobeMoonBtn) { // Use new var name
        settingGlobeMoonBtn.addEventListener('click', switchToMoonView);
    }
    if (settingGlobeMarsBtn) { // Use new var name
        settingGlobeMarsBtn.addEventListener('click', () => {
            console.log("Mars globe button clicked - functionality not yet implemented.");
            updateActiveGlobeButton('setting-globe-mars'); // Use new ID
            // Potentially call switchToMarsView(); in the future
        });
    }
    if (settingGlobeMetaverseBtn) { // Use new var name
        settingGlobeMetaverseBtn.addEventListener('click', () => {
            console.log("Metaverse globe button clicked - functionality not yet implemented.");
            updateActiveGlobeButton('setting-globe-metaverse'); // Use new ID
        });
    }
    if (settingGlobeCustomBtn) { // Use new var name
        settingGlobeCustomBtn.addEventListener('click', () => {
            console.log("Custom globe button clicked - functionality not yet implemented.");
            updateActiveGlobeButton('setting-globe-custom'); // Use new ID
        });
    }
    if (settingGlobeITownsBtn) {
        settingGlobeITownsBtn.addEventListener('click', () => {
            console.log("iTowns globe button clicked.");
            const itownsContainer = document.getElementById('itowns-container');
            const globusContainer = document.getElementById('globusContainer');

            if (globusContainer) globusContainer.style.display = 'none';
            if (itownsContainer) itownsContainer.style.display = 'block';
            
            // Consider if OpenGlobus needs explicit destruction or pausing
            if (state.globus && typeof state.globus.planet?.pause === 'function') {
                 state.globus.planet.pause(); // Example: pause OpenGlobus rendering
                 console.log("OpenGlobus rendering paused.");
            } else if (state.globus && typeof state.globus.planet?.destroy === 'function') {
                // Or destroy if it won't be used again soon and re-init is cheap
                // state.globus.planet.destroy(); state.globus = null;
                // console.log("OpenGlobus instance destroyed.");
            }

            if (!state.itownsView) {
                initITownsView(); // initITownsView should handle making its container visible
            } else {
                // If iTowns view exists, ensure it's sized correctly
                if (typeof state.itownsView.resize === 'function') { // iTowns typically uses view.mainLoop.gfxEngine.renderer.setSize or view.camera.resize
                    state.itownsView.camera.resize(itownsContainer.clientWidth, itownsContainer.clientHeight);
                    state.itownsView.notifyChange(true);
                } else if (typeof state.itownsView.notifyChange === 'function') { // Fallback if no specific resize
                     state.itownsView.notifyChange(true); // Force redraw
                }
                console.log("iTowns view already initialized. Resized/Notified change.");
            }
            state.activeGlobeLibrary = 'itowns';
            updateActiveGlobeButton('setting-globe-itowns');

            if (globusContainer) globusContainer.style.display = 'none';
            if (itownsContainer) itownsContainer.style.display = 'block';
            
            if (state.globus && typeof state.globus.planet?.destroy === 'function') {
                // state.globus.planet.destroy(); // Consider if OpenGlobus needs explicit destruction
                // state.globus = null;
                console.log("OpenGlobus instance would be paused or destroyed here if necessary.");
            }

            if (!state.itownsView) {
                initITownsView();
            } else {
                // May need to call a resize or update function for iTowns if it exists
                console.log("iTowns view already initialized. TODO: Implement update/resize if needed.");
            }
            state.activeGlobeLibrary = 'itowns';
            updateActiveGlobeButton('setting-globe-itowns');
        });
    }

    updateActiveGlobeButton('setting-globe-earth'); // Set Earth as active by default, use new ID
    // Set Earth as active by default on load, after maps are initialized
    // This might be better placed after initializeOpenGlobus and initializeOpenLayersMap calls
    // For now, it's here, assuming buttons are ready.
    // Removed misplaced conditional initialization block.
    // Initialization calls are moved earlier.
    // updateActiveSphereButton will be called after event listeners are set.
    
    // --- Sign In Button Logic ---
    const signinBtn = document.getElementById('signin-btn');
    console.log("%cSIGN_IN_BTN_DEBUG: 'signin-btn' DOM element:", "color: red; font-weight: bold;", signinBtn);
    if (signinBtn) {
        console.log("%cSIGN_IN_BTN_DEBUG: Attaching onclick to 'signin-btn'.", "color: red; font-weight: bold;");
        signinBtn.onclick = () => {
            console.log("%cSIGN_IN_BTN_DEBUG: 'signin-btn' clicked!", "color: red; font-weight: bold;");
            window.location.href = 'auth.html';
        };
    } else {
        console.error("%cSIGN_IN_BTN_ERROR: 'signin-btn' element not found!", "color: red; font-weight: bold;");
    }
    // --- End Sign In Button Logic ---
            

    // Initial UI setup calls for Layer 0
    if (window.userLayers && typeof window.userLayers === 'object' &&
        window.selectedLayerId === layer0Id &&
        window.userLayers[layer0Id] &&
        typeof window.userLayers[layer0Id].name === 'string' &&
        document.getElementById('user-layer-list')) { // Assuming userLayerList refers to this element
        
        console.log(`DEBUG: Adding Layer 0 to list. ID: ${layer0Id}, Name: ${window.userLayers[layer0Id].name}`);
        // Ensure addLayerToList and selectLayerInList are defined before this block if they are called here
        if (typeof addLayerToList === 'function' && typeof selectLayerInList === 'function') {
            addLayerToList(layer0Id, window.userLayers[layer0Id].name, true);
            selectLayerInList(layer0Id);
            console.log("DEBUG: Layer 0 added and selected in UI list.");
        } else {
            console.warn("DEBUG: addLayerToList or selectLayerInList not defined when trying to add Layer 0.");
        }
    } else {
        console.warn("DEBUG: Conditions NOT met to add Layer 0 to UI list initially. Check userLayers, selectedLayerId, layer0Id, and 'user-layer-list' element.");
    }
// Removed updateCesiumTerrainProvider function for debugging syntax error
// Erroneous block removed. This logic for adding Layer 0 to UI list
// should exist elsewhere, typically within the main DOMContentLoaded listener
// after userLayers and userLayerList are confirmed to be initialized.
// Misplaced block of DOMContentLoaded code removed.
// The actual initializeOLCesiumMapPanel function should follow.
function initializeOLCesiumMapPanel() {
    console.log("INIT_OLCS: Entered initializeOLCesiumMapPanel.");
    if (typeof olcs === 'undefined' || typeof Cesium === 'undefined') {
        console.error("INIT_OLCS_FAIL: OLCesium or Cesium library not loaded.");
        if (olCesiumToggleBtn) olCesiumToggleBtn.disabled = true;
        return;
    }
    console.log("INIT_OLCS: OLCesium and Cesium libraries seem loaded.");

    if (!state.olMap) {
        console.error("INIT_OLCS_FAIL: OpenLayers map (state.olMap) not initialized.");
        if (olCesiumToggleBtn) olCesiumToggleBtn.disabled = true;
        return;
    }
    console.log("INIT_OLCS: state.olMap seems initialized.");

// --- Initial Panel Layout Function ---
    function layoutLeftPanelsInitial() {
        // const layerSwitcher = document.getElementById('layer-switcher'); // No longer used for this layout
        const userLayersPanel = document.getElementById('user-layers-panel');
        const appControls = document.getElementById('app-controls');
        const mainToolbar = document.getElementById('toolbar-main'); // Assuming toolbar has this ID

        if (userLayersPanel && appControls && mainToolbar) {
            console.log("LAYOUT_DEBUG: Adjusting Layers and Controls panels...");
            
            userLayersPanel.offsetHeight; // force reflow
            appControls.offsetHeight;
            mainToolbar.offsetHeight;

            const tbRect = mainToolbar.getBoundingClientRect();
            const acRect = appControls.getBoundingClientRect(); // app-controls is bottom-aligned by CSS initially (top: calc(...))
            
            const panelLeft = '10px'; // Standard left offset
            const panelWidth = getComputedStyle(userLayersPanel).width || '230px'; // Use CSS width or default
            const gap = 8; // px

            // MODIFIED: Panel layout to respect CSS !important rules
            // We're still calculating the values but only logging them, not setting them
            // This allows the CSS !important rules to control the actual positioning

            // Only log the calculated values but don't set them
            const userLayersTop = tbRect.bottom + gap;
            console.log(`LAYOUT_DEBUG: userLayersPanel calculated top=${userLayersTop}px (not setting)`);
            console.log(`LAYOUT_DEBUG: userLayersPanel calculated left=${panelLeft}, width=${panelWidth} (not setting)`);
            
            // For app controls, also just log
            console.log(`LAYOUT_DEBUG: appControls calculated left=${panelLeft}, width=${panelWidth} (not setting)`);

            // Just calculate height for logging, don't set it
            appControls.offsetHeight; // reflow
            const acTopActual = appControls.getBoundingClientRect().top;
            const userLayersHeight = acTopActual - userLayersTop - gap;
            const minHeight = parseFloat(getComputedStyle(userLayersPanel).minHeight || '100');
            
            console.log(`LAYOUT_DEBUG: userLayersPanel calculated height=${userLayersHeight}px or ${minHeight}px minimum (not setting)`);
            console.log(`LAYOUT_DEBUG: userLayersPanel final: top=${userLayersPanel.style.top}, height=${userLayersPanel.style.height}, left=${userLayersPanel.style.left}, width=${userLayersPanel.style.width}`);
            console.log(`LAYOUT_DEBUG: appControls final: top=${appControls.style.top}, left=${appControls.style.left}, width=${appControls.style.width}`);

        } else {
            console.warn("LAYOUT_DEBUG: userLayersPanel, appControls, or mainToolbar not found for initial layout.");
        }
    }

    // Call this after a brief delay to allow CSS to apply and elements to render
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        setTimeout(layoutLeftPanelsInitial, 150);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(layoutLeftPanelsInitial, 150));
    }
    if (!cesiumMapContainer) {
        console.error("INIT_OLCS_FAIL: Cesium container div (cesium-map-container) not found.");
        if (olCesiumToggleBtn) olCesiumToggleBtn.disabled = true;
        return;
    }
    console.log("INIT_OLCS: cesiumMapContainer found.");

    // Ensure the Cesium container is visible before OLCesium instantiation
    if (cesiumMapContainer) {
        console.log("INIT_OLCS: Temporarily ensuring cesiumMapContainer is display:block for OLCesium init.");
        cesiumMapContainer.style.display = 'block';
    }

    try {
        console.log("INIT_OLCS: Attempting 'new olcs.OLCesium(...)'");
        olcsMapPanel = new olcs.OLCesium({
            map: state.olMap,
            target: 'cesium-map-container',
        });
        console.log("INIT_OLCS: 'new olcs.OLCesium(...)' SUCCEEDED. olcsMapPanel:", olcsMapPanel);
        
        const scene = olcsMapPanel.getCesiumScene();
        if (scene) {
            // Terrain provider logic moved to updateCesiumTerrainProvider function
            const savedTerrainPreference = localStorage.getItem('cesiumTerrainPreference') || 'cesium_ion_ellipsoid'; // Default
            console.log(`INIT_OLCS: Initial terrain preference: ${savedTerrainPreference}`);
            if (typeof updateCesiumTerrainProvider === 'function') {
                updateCesiumTerrainProvider(savedTerrainPreference);
            } else {
                console.error("INIT_OLCS: updateCesiumTerrainProvider function is not defined. Cannot set initial terrain.");
                // Fallback to simple ellipsoid if update function is missing
                if (typeof Cesium.EllipsoidTerrainProvider === 'function') {
                    try {
                        scene.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
                        console.log("INIT_OLCS: Set EllipsoidTerrainProvider as emergency fallback (update function missing).");
                    } catch (e) {
                        console.error("INIT_OLCS: Error setting emergency EllipsoidTerrainProvider:", e);
                    }
                }
            }
            console.log("INIT_OLCS: CHECKPOINT XYZ - Immediately before scene.globe.enableLighting log. Terrain provider status should have been logged before this.");

            // Cesium ZL21 Grid logic temporarily removed to ensure stability.
// Removing orphaned catch block

            if (scene.globe) {
                scene.globe.enableLighting = true;
                console.log("INIT_OLCS: scene.globe.enableLighting set to true.");
            } else {
                console.warn("INIT_OLCS: scene.globe is null or undefined. Cannot enable lighting.");
            }
        } else {
            console.error("INIT_OLCS_ERROR: olcsMapPanel.getCesiumScene() returned null or undefined.");
        }
        // Cesium.GridImageryProvider removed as per user request.
        olcsMapPanel.setEnabled(false);
        cesiumMapContainer.style.display = 'none';
        if (mapElementForOL) mapElementForOL.style.display = 'block';

        console.log("INIT_OLCS: OLCesium for map panel initialized and setEnabled(false) by default.");
        if (olCesiumToggleBtn) {
            olCesiumToggleBtn.disabled = false;
            olCesiumToggleBtn.textContent = "3D View";
        }
        console.log("INIT_OLCS: initializeOLCesiumMapPanel completed successfully.");
    } catch (error) {
        // Print the full error object for better diagnostics
        console.error("INIT_OLCS_ERROR: Error during OLCesium initialization. Full error object:", error);
        if (olCesiumToggleBtn) olCesiumToggleBtn.disabled = true;
        olcsMapPanel = null;
        alert("Failed to initialize 3D Map View (OLCesium). Check console for INIT_OLCS_ERROR and full error object.");
    }
}

    // --- OLCesium Toggle Button Listener (Moved here for late binding) ---
    const olCesiumToggleBtn_LateBound = document.getElementById('map-view-toggle-btn'); // Re-fetch just in case
    console.error("OLCESIUM_DEBUG_PRE_LISTEN: Checking olCesiumToggleBtn_LateBound. Element:", olCesiumToggleBtn_LateBound, "Disabled:", olCesiumToggleBtn_LateBound ? olCesiumToggleBtn_LateBound.disabled : 'N/A');
    if (olCesiumToggleBtn_LateBound) {
        olCesiumToggleBtn_LateBound.addEventListener('click', (event) => {
            console.error("OLCESIUM_DEBUG_CLICKED: map-view-toggle-btn was clicked!");
            // console.error("OLCESIUM_DEBUG: olCesiumToggleBtn_LateBound CLICKED. Current olcsMapPanel:", olcsMapPanel, "Event Target:", event.target); // More detailed log
            if (!olcsMapPanel && typeof initializeOLCesiumMapPanel === 'function') {
                console.error("OLCESIUM_DEBUG: OLCesium not initialized by this button yet, calling initializeOLCesiumMapPanel().");
                initializeOLCesiumMapPanel();
            }

            if (olcsMapPanel) {
                const cesiumIsEnabled = olcsMapPanel.getEnabled();
                olcsMapPanel.setEnabled(!cesiumIsEnabled);
                console.log(`OLCESIUM_TOGGLE: OLCesium setEnabled to ${!cesiumIsEnabled}.`);

                if (!cesiumIsEnabled) { // Means we are ENABLING Cesium (3D mode)
                    olCesiumToggleBtn.textContent = "2D View";
                    if (cesiumMapContainer) cesiumMapContainer.style.display = 'block';
                    if (mapElementForOL) mapElementForOL.style.display = 'none';

                    // Set initial camera view for Cesium when enabling
                    const scene = olcsMapPanel.getCesiumScene();
                    if (scene) {
                        // Fly Cesium camera to a fixed, very high overview to ensure "globe view"
                        const camera = scene.camera;
                        // Use stored start lat/lon if available, otherwise a global default. Altitude is fixed high.
                        const initialLon = parseFloat(localStorage.getItem('setting_startLon')) || 0; // Default to 0 longitude
                        const initialLat = parseFloat(localStorage.getItem('setting_startLat')) || 0;  // Default to 0 latitude
                        const overviewAltitude = 25000000; // 25,000 km altitude

                        camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(initialLon, initialLat, overviewAltitude),
                            orientation: {
                                heading: Cesium.Math.toRadians(0.0),
                                pitch: Cesium.Math.toRadians(-90.0), // Look straight down
                                roll: 0.0
                            },
                            duration: 0 // Fly immediately
                        });
                        console.log(`OLCESIUM_TOGGLE: Flown Cesium camera to fixed overview (Alt: ${overviewAltitude}m).`);
                    }

                    try {
                        if (olcsMapPanel.getCesiumScene() && olcsMapPanel.getCesiumScene().canvas) {
                            const viewer = olcsMapPanel.getCesiumViewer();
                            if (viewer && typeof viewer.resize === 'function') {
                                viewer.resize();
                            } else if (viewer && viewer.scene && typeof viewer.scene.canvas.dispatchEvent === 'function') {
                                viewer.scene.canvas.dispatchEvent(new Event('resize'));
                            }
                        }
                    } catch(e) { console.warn("OLCESIUM_TOGGLE: Error trying to resize Cesium viewer", e); }
                } else { // Means we are DISABLING Cesium (going to 2D OL mode)
                    olCesiumToggleBtn.textContent = "3D View";
                    if (cesiumMapContainer) cesiumMapContainer.style.display = 'none';
                    if (mapElementForOL) mapElementForOL.style.display = 'block';
                    if (state.olMap) state.olMap.updateSize();
                }
            } else {
                console.error("OLCESIUM_TOGGLE: olcsMapPanel is still not available after initialization attempt.");
                alert("3D map view (OLCesium) could not be initialized. Check console.");
            }
        });
         console.error("OLCESIUM_DEBUG: Listener ATTACHED to olCesiumToggleBtn (late binding).");
    } else {
        console.warn("OLCESIUM_TOGGLE: olCesiumToggleBtn (map-view-toggle-btn) not found (late binding check).");
    }
    // --- End OLCesium Toggle Button Listener ---

    // --- Master 2D/3D Button Logic ---
    if (masterMapModeBtn) {
        // The HTML sets the text to "2D/3D", so no need to set it here initially.
        // If visual feedback for the current mode is desired, it should be done via class or other indicators.

        masterMapModeBtn.addEventListener('click', () => {
            state.masterMapModeIs3D = !state.masterMapModeIs3D;
            // Button text remains "2D/3D". Visual state can be handled by adding/removing an 'active' class if desired.
            // For example: masterMapModeBtn.classList.toggle('active', state.masterMapModeIs3D);
            console.log(`Master map mode toggled to: ${state.masterMapModeIs3D ? '3D' : '2D'}`);

            // Control active 2D map panel
            if (state.activeMapLibrary === 'openlayers') {
                console.log("Master Toggle: Handling OpenLayers view.");

                // Ensure OpenLayers map itself is initialized first
                if (!state.olMap && typeof initializeOpenLayersMap === 'function') {
                    console.log("Master Toggle: state.olMap not initialized, calling initializeOpenLayersMap().");
                    initializeOpenLayersMap();
                }
                
                // Now proceed with OLCesium initialization if needed
                console.log(`Master Toggle: typeof initializeOLCesiumMapPanel is ${typeof initializeOLCesiumMapPanel}. olcsMapPanel is ${olcsMapPanel ? 'defined' : 'null/undefined'}. state.olMap is ${state.olMap ? 'defined' : 'null/undefined'}.`);
                if (!olcsMapPanel && typeof initializeOLCesiumMapPanel === 'function') {
                    console.log("Master Toggle: OLCesium not initialized by master, calling initializeOLCesiumMapPanel().");
                    initializeOLCesiumMapPanel();
                }

                if (olcsMapPanel) {
                    const cesiumIsEnabled = olcsMapPanel.getEnabled();
                    if (state.masterMapModeIs3D && !cesiumIsEnabled) {
                        console.log("Master Toggle: Enabling OLCesium (3D).");
                        olcsMapPanel.setEnabled(true);
                        if (olCesiumToggleBtn) olCesiumToggleBtn.textContent = "2D View";
                        if (cesiumMapContainer) cesiumMapContainer.style.display = 'block';
                        if (mapElementForOL) mapElementForOL.style.display = 'none';
                        // try { // Resize logic - temporarily comment out due to getCesiumViewer error
                        //     if (olcsMapPanel.getCesiumScene() && olcsMapPanel.getCesiumScene().canvas) {
                        //         const viewer = olcsMapPanel.getCesiumViewer();
                        //         if (viewer && typeof viewer.resize === 'function') viewer.resize();
                        //         else if (viewer && viewer.scene && typeof viewer.scene.canvas.dispatchEvent === 'function') viewer.scene.canvas.dispatchEvent(new Event('resize'));
                        //     }
                        // } catch(e) { console.warn("Master Toggle: Error resizing Cesium viewer", e); }
                        console.log("Master Toggle: Cesium view enabled. Manual resize logic (getCesiumViewer) temporarily commented out.");
                    } else if (!state.masterMapModeIs3D && cesiumIsEnabled) {
                        console.log("Master Toggle: Disabling OLCesium (2D).");
                        olcsMapPanel.setEnabled(false);
                        if (olCesiumToggleBtn) olCesiumToggleBtn.textContent = "3D View";
                        if (cesiumMapContainer) cesiumMapContainer.style.display = 'none';
                        if (mapElementForOL) mapElementForOL.style.display = 'block';
                        if (state.olMap) state.olMap.updateSize();
                    } else {
                        console.log("Master Toggle: OLCesium already in desired state or no change needed.");
                    }
                } else {
                    console.warn("Master Toggle: olcsMapPanel still not available after master's initialization attempt for OpenLayers.");
                }
            } else if (state.activeMapLibrary === 'maplibre') {
                if (mapLibreToggleBtn && state.mapLibreMap) {
                    const currentPitch = state.mapLibreMap.getPitch();
                    if (state.masterMapModeIs3D && currentPitch === 0) {
                        mapLibreToggleBtn.click(); // Activate 3D (sets pitch to 60)
                    } else if (!state.masterMapModeIs3D && currentPitch > 0) {
                        mapLibreToggleBtn.click(); // Deactivate 3D (sets pitch to 0)
                    }
                }
            }

            // Control OpenGlobus panel (basic implementation)
            if (state.globus && state.globus.planet && state.globus.planet.camera) {
                const cam = state.globus.planet.camera;
                if (!state.masterMapModeIs3D) { // If master wants 2D
                    // Set to nadir view (straight down)
                    // OpenGlobus pitch: 0 is horizontal, -90 is nadir.
                    // Bearing 0 is North.
                    cam.setPitch(-Math.PI / 2);
                    cam.setBearing(0);
                    // cam.setRoll(0); // Ensure no roll
                    // Optionally disable some camera controls if API allows
                    // e.g., state.globus.planet.renderer.controls.mouseNavigation.deactivateRotation();
                    console.log("OpenGlobus: Set to approximate 2D view (nadir).");
                } else { // If master wants 3D
                    // Restore default/free camera interaction.
                    // This might involve re-enabling controls if they were disabled.
                    // For now, just ensure pitch isn't locked at nadir if it was.
                    // A specific "flyTo" to a default 3D view might be better.
                    if (cam.getPitch() === -Math.PI / 2) {
                         cam.setPitch(-Math.PI / 4); // Restore a more oblique view
                    }
                    console.log("OpenGlobus: Set to 3D view (restored oblique pitch if was nadir).");
                }
            }
        });
    }
    // --- End Master 2D/3D Button Logic ---

    // --- Enhanced MutationObserver for #user-layers-panel debugging ---
    const userLayersPanelForObserver = document.getElementById('user-layers-panel');
    if (userLayersPanelForObserver) {
        console.error('%cOBSERVER: Attempting to attach MutationObserver to #user-layers-panel.', 'color: blue; font-size: 14px;');
        const observer = new MutationObserver((mutationsList, obs) => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    if (mutation.attributeName === 'style') {
                        console.error('%c!!! USER-LAYERS-PANEL STYLE CHANGED !!!', 'color:red; font-size: 18px; font-weight:bold;',
                            'Panel ID:', userLayersPanelForObserver.id,
                            'New style.cssText:', userLayersPanelForObserver.style.cssText,
                            'Old value was:', mutation.oldValue,
                            'Stack:', new Error().stack
                        );
                    } else if (mutation.attributeName === 'class') {
                        console.error('%c!!! USER-LAYERS-PANEL CLASS CHANGED !!!', 'color:orange; font-size: 18px; font-weight:bold;',
                            'Panel ID:', userLayersPanelForObserver.id,
                            'New className:', userLayersPanelForObserver.className,
                            'Old value was:', mutation.oldValue,
                            'Stack:', new Error().stack
                        );
                    } else {
                        // Log other attribute changes too, just in case
                        console.warn('%cOBSERVER: #user-layers-panel attribute changed:', 'color:purple; font-size: 14px;',
                            mutation.attributeName,
                            'New value:', userLayersPanelForObserver.getAttribute(mutation.attributeName),
                            'Old value was:', mutation.oldValue,
                            'Stack (partial):', new Error().stack.substring(0,700)
                        );
                    }
                } else if (mutation.type === 'childList') {
                     console.error('%c!!! USER-LAYERS-PANEL CHILDLIST CHANGED !!!', 'color:green; font-size: 18px; font-weight:bold;',
                        'Panel ID:', userLayersPanelForObserver.id,
                        'Added:', mutation.addedNodes, 'Removed:', mutation.removedNodes,
                        'Stack:', new Error().stack
                    );
                }
            }
        });
        observer.observe(userLayersPanelForObserver, {
            attributes: true,       // Watch for attribute changes
            attributeOldValue: true, // Provide the old value of the attribute
            childList: true,        // Watch for changes to direct children
            subtree: true           // Watch for changes in all descendants
        });
        console.error('%cOBSERVER: Attached Enhanced MutationObserver to #user-layers-panel.', 'color: blue; font-size: 14px;');
    } else {
        console.error("OBSERVER_ERROR: #user-layers-panel not found for MutationObserver attachment.");
    }
    // --- End Enhanced MutationObserver ---

    // --- GunDB Chat Client Logic ---
    if (typeof Gun !== 'undefined') {
        const gunPeers = ['http://localhost:8765/gun']; // Ensure this matches your backend Gun server
        console.log("Attempting to connect to Gun peers:", gunPeers);
        const gunClient = Gun({ peers: gunPeers, radisk: false }); // radisk is false on client
        
        window.gun = gunClient; // Expose to window for debugging, optional
        console.log("Gun client initialized. Attempting to connect to:", gunPeers);

        const mundialChat = gunClient.get('mundial/chat');

        if (sendMessageBtn && chatInput && usernameInputForChat && chatMessagesDiv) {
            sendMessageBtn.addEventListener('click', () => {
                const user = usernameInputForChat.value.trim() || 'Anonymous';
                const text = chatInput.value.trim();
                if (text) {
                    const messageKey = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    mundialChat.get(messageKey).put({
                        user: user,
                        text: text,
                        timestamp: Gun.state() // Gun's server-side timestamp if connected, else local
                    }, (ack) => {
                        if (ack.err) {
                            console.error("Gun message send error:", ack.err);
                        } else {
                            console.log("Gun message sent, ack:", ack);
                        }
                    });
                    chatInput.value = '';
                }
            });

            const displayedMessageIds = new Set(); // Keep track of displayed messages

            mundialChat.map().on((messageData, messageId) => {
                // console.log("Gun chat message received:", messageId, messageData); // Debug all incoming
                if (messageData && messageData.text && messageData.user && messageData.timestamp) {
                    if (!displayedMessageIds.has(messageId)) { // Check if already displayed
                        const messageEl = document.createElement('div');
                        messageEl.id = messageId;
                        messageEl.classList.add('chat-message');
                        
                        const userEl = document.createElement('strong');
                        userEl.textContent = `${messageData.user}: `;
                        
                        const textEl = document.createElement('span');
                        textEl.textContent = messageData.text;
                        
                        const timeEl = document.createElement('em');
                        timeEl.style.fontSize = '0.8em';
                        timeEl.style.marginLeft = '10px';
                        timeEl.textContent = `(${new Date(messageData.timestamp).toLocaleTimeString()})`;

                        messageEl.appendChild(userEl);
                        messageEl.appendChild(textEl);
                        messageEl.appendChild(timeEl);
                        
                        chatMessagesDiv.appendChild(messageEl);
                        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
                        displayedMessageIds.add(messageId); // Add to set after displaying
                    }
                } else if (messageData === null && displayedMessageIds.has(messageId)) {
                    // Handle potential message deletion/nullification if needed
                    const elToRemove = document.getElementById(messageId);
                    if (elToRemove) {
                        elToRemove.remove();
                        displayedMessageIds.delete(messageId);
                        console.log("Gun: Removed nullified message", messageId);
                    }
                }
            });
        } else {
            console.warn("GunDB: Chat UI elements not all found, chat functionality disabled.");
        }
    } else {
        console.warn("Gun library not found, chat functionality disabled.");
    }
    // --- End GunDB Chat Client Logic ---

// Placeholder for iTowns View Initialization
    function initITownsView() {
        console.log("Initializing iTowns view...");
        if (state.itownsView) return; // Already initialized

        const itownsContainer = document.getElementById('itowns-container');
        if (!itownsContainer) {
            console.error("iTowns container 'itowns-container' not found.");
            return;
        }

        // Basic iTowns setup (example)
        // This is a very minimal setup and will need significant expansion
        // Refer to iTowns documentation for proper setup: https://itowns.github.io/itowns/
        try {
            const placement = {
                coord: new itowns.Coordinates('EPSG:4326', state.currentLon || 0, state.currentLat || 0),
                range: 25000000, // Initial viewing range
            };
            state.itownsView = new itowns.GlobeView(itownsContainer, placement);
            
            // Add a basic imagery layer
            itowns.Fetcher.json('../packages/itowns/examples/layers/JSONLayers/Ortho.json').then(function _(config) {
                config.source = new itowns.TMSSource(config.source);
                let layer = new itowns.ColorLayer('Ortho', config);
                state.itownsView.addLayer(layer);
            });

            // Add an elevation layer
            itowns.Fetcher.json('../packages/itowns/examples/layers/JSONLayers/WORLD_DTM.json').then(function _(config) {
                config.source = new itowns.WMTSSource(config.source);
                let layer = new itowns.ElevationLayer('DTM', config);
                state.itownsView.addLayer(layer);
            });

            console.log("iTowns view initialized (basic).");
            // Make sure to call view.notifyChange() if layers are added asynchronously after initial render
            state.itownsView.notifyChange(true);


        } catch (e) {
            console.error("Error initializing iTowns:", e);
            state.itownsView = null;
        }
        // TODO: Add event listeners for map movement to update state.currentLat/Lon/Zoom
        // TODO: Implement ZL21 grid display for iTowns
// --- Toggle for Maps Menu (#layer-switcher) via button in #map-panel header ---
    const mapPanelToggleMapsMenuBtn = document.getElementById('map-panel-toggle-maps-menu-btn');
    const layerSwitcherPanelForToggle = document.getElementById('layer-switcher');

    if (mapPanelToggleMapsMenuBtn && layerSwitcherPanelForToggle) {
        mapPanelToggleMapsMenuBtn.addEventListener('click', () => {
            const isVisible = layerSwitcherPanelForToggle.style.display === 'block';
            layerSwitcherPanelForToggle.style.display = isVisible ? 'none' : 'block';
            console.log(`Maps menu (#layer-switcher) visibility toggled to: ${layerSwitcherPanelForToggle.style.display}`);
        });
        console.log("DEBUG: Event listener for map panel's maps menu toggle button attached.");
    } else {
        console.warn("DEBUG: Could not find button or panel for map panel's maps menu toggle.", {
            btnExists: !!mapPanelToggleMapsMenuBtn,
            panelExists: !!layerSwitcherPanelForToggle
        });
    }
    // --- End Toggle for Maps Menu ---
        // TODO: Implement saved tileset display for iTowns
        // TODO: Implement click listener for tile info
    }

}); // End of DOMContentLoaded listener

// Initialize maps after DOM is ready
// initializeOpenGlobus(); // Redundant - already called within DOMContentLoaded
// initializeOpenLayersMap(); // Call to initialize OpenLayers map - MOVED

function createTestTileset() {
        console.log("Attempting to create test tileset... (FUNCTION BODY COMMENTED OUT FOR DEBUGGING GLOBE)");
        return; // Prevent execution for now
    } // End of createTestTileset function

    // Call after maps are initialized and DOM is fully ready
    // setTimeout(createTestTileset, 2000); // Delay to ensure everything else is set up (COMMENTED OUT FOR DEBUGGING)

// --- Globe View Switcher Logic ---
    const globeLibrarySelect = document.getElementById('globe-library-select');
    const openglobusContainer = document.getElementById('globusContainer'); // Corrected ID
    const itownsGlobeContainer = document.getElementById('itowns-container'); // New
    const radiogardenContainer = document.getElementById('radiogarden-container'); // New
    const radiogardenIframe = document.getElementById('radiogarden-iframe');

    const globeViewContainers = {
        'openglobus': openglobusContainer,
        'itowns': itownsGlobeContainer,
        'radiogarden': radiogardenContainer
    };

    function switchGlobeView(selectedGlobeValue) {
        console.log(`GLOBE_SWITCH: Switching to ${selectedGlobeValue}`);
        Object.values(globeViewContainers).forEach(container => {
            if (container) container.style.display = 'none';
        });

        const activeContainer = globeViewContainers[selectedGlobeValue];
        if (activeContainer) {
            activeContainer.style.display = 'block';
            console.log(`GLOBE_SWITCH: Displaying ${activeContainer.id}`);

            if (selectedGlobeValue === 'radiogarden') {
                if (radiogardenIframe && !radiogardenIframe.src) { // Load only once
                    radiogardenIframe.src = 'https://radio.garden/visit/paris/JqN8oJ3N'; // Example starting location
                    console.log("GLOBE_SWITCH: Radio Garden iframe src set.");
                }
            } else if (selectedGlobeValue === 'itowns') {
                // Placeholder for iTowns initialization
                if (typeof initITownsView === 'function') { // Corrected function name
                    initITownsView(); // Uncommented to call initialization
                    console.log("GLOBE_SWITCH: iTowns view selected. (Initialization pending).");
                } else {
                    console.warn("GLOBE_SWITCH: initializeITowns function not found.");
                    if(itownsGlobeContainer) itownsGlobeContainer.innerHTML = '<p style="padding:10px; color: #f00;">Error: iTowns initialization script not found.</p>';
                }
            }
            // OpenGlobus is assumed to be initialized by its existing logic
        } else {
            console.warn(`GLOBE_SWITCH: No container found for globe value: ${selectedGlobeValue}`);
        }
    }

    if (globeLibrarySelect && openglobusContainer && itownsGlobeContainer && radiogardenContainer && radiogardenIframe) {
        globeLibrarySelect.addEventListener('change', (event) => {
            switchGlobeView(event.target.value);
        });
        // Initial setup based on default selection
        switchGlobeView(globeLibrarySelect.value);
        console.log("GLOBE_SWITCH: Globe view switcher initialized.");
    } else {
        console.warn("GLOBE_SWITCH: Could not initialize globe view switcher. Missing one or more elements:", {
            select: !!globeLibrarySelect,
            og: !!openglobusContainer,
            it: !!itownsGlobeContainer,
            rg: !!radiogardenContainer,
            rgIframe: !!radiogardenIframe
        });
    }
    // --- End Globe View Switcher Logic ---
