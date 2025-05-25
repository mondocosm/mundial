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
    populateListCallCounter: 0
};
// userLayers and selectedLayerId are already on window object from previous steps
// mundial/main.js - Full version with OpenGlobus focus

document.addEventListener('DOMContentLoaded', () => {

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
        const newTop = Math.max(0, Math.min(window.innerHeight - elmnt.offsetHeight, elmnt.offsetTop - pos2));
        const newLeft = Math.max(0, Math.min(window.innerWidth - elmnt.offsetWidth, elmnt.offsetLeft - pos1));
        elmnt.style.top = newTop + "px"; elmnt.style.left = newLeft + "px";
        elmnt.style.bottom = ''; elmnt.style.right = '';
      }
      function closeDragElement() {
        document.onmouseup = null; document.onmousemove = null;
      }
    }

    // --- XR Panel Logic ---
// Removed duplicate setupXRPanelLogic function

    // --- UI Element References (from reference code) ---
    const baseLayerSelectOL = document.getElementById('base-layer-select'); // Renamed to avoid conflict if an OG one exists
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
    // const detailsLocationInfoSpan = document.getElementById('details-location-info'); // Already defined in settings
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
    const toggleMapCesiumViewBtn = document.getElementById('toggle-map-cesium-view-btn');
    const cesiumMapContainer = document.getElementById('cesium-map-container');
    const mapElementForOL = document.getElementById('map'); // Already used, ensure it's consistently referenced
    console.log("DEBUG: toggleMapCesiumViewBtn DOM element:", toggleMapCesiumViewBtn); // Added log

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

    // DEBUG: Check Scene Panel related elements immediately after declaration
    console.log("%cSCENE_ELEMENT_CHECK:", "color: purple; font-weight: bold;", {
        sceneType3dtileBtn_Exists: !!sceneType3dtileBtn,
        sceneTypeUsdBtn_Exists: !!sceneTypeUsdBtn,
        sceneTypeI3sBtn_Exists: !!sceneTypeI3sBtn,
        sceneIframe_Exists: !!sceneIframe,
        scenePanel_Exists: !!scenePanel
    });
    // END DEBUG

    // Calls to initializeOpenLayersMap() and initializeOpenGlobus() moved to later in the script,
    // after all function definitions are complete.

    // --- Tile Selection & User Layer Core Logic Functions (from reference) ---
    let currentInteractionMode = 'pan'; // Initial mode is 'pan'

    function getTileId(tileCoord) { return `${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}`; }

    function toggleTileSelection(tileCoord) {
        // Ensure selectionSource, selectedLayerId, and userLayers are available (likely initialized in initializeOpenLayersMap)
        if (!window.olMap || !selectionSource || !window.selectedLayerId || !window.userLayers) {
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
        if (!window.olMap || !selectionSource || !window.selectedLayerId || !window.userLayers) {
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

        const tilesetGroupId = `test-tileset-${Date.now()}`;
        const tilesetName = "Test Tileset SoL";
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
            
            // Store tile data for Babylon.js view
            window.currentTilesetForBabylon = testTiles.map(tc => ({ z: tc[0], x: tc[1], y: tc[2] })); // Store Z,X,Y

            populateTilesetList(layer0Id); // Update UI list for Layer 0

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
        if (window.olMap) {
            console.warn("%cWARN: window.olMap object already exists. Skipping re-initialization.", "color: yellow; font-weight: bold;");
            return;
        }
        try {
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.error("%cFATAL ERROR: 'map' DIV not found in DOM. Cannot initialize OpenLayers map.", "color: red; font-size: 1.2em; font-weight: bold;");
                return;
            }
            console.log("DEBUG: 'map' DIV found:", mapElement);

            window.olMap = new ol.Map({
                target: 'map',
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.XYZ({
                            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                            attributions: 'Tiles © Esri',
                            maxZoom: 19
                        }),
                        type: 'base' // Mark this as a base layer
                    })
                    // Graticule removed, will be replaced by ZL21 grid
                ],
                view: new ol.View({
                    center: ol.proj.fromLonLat([-74.0445, 40.6892]), // Default to Statue of Liberty
                    zoom: 18, // Zoom closer for ZL21 grid visibility
                    maxZoom: TILE_SELECTION_ZOOM + 1,
                    minZoom: 0
                })
            });
            console.log("%cDEBUG: ol.Map constructor SUCCEEDED. window.olMap object created.", "color: green; font-weight: bold;", window.olMap);

            // ZL21 Grid Setup for OpenLayers
            const gridStyleZ21 = new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 1)', width: 1 }) });
            const gridSourceZ21 = new ol.source.Vector();
            gridLayerZ21 = new ol.layer.Vector({ source: gridSourceZ21, style: gridStyleZ21, title: 'grid-z21', visible: false, zIndex: 1 });
            window.olMap.addLayer(gridLayerZ21);
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
            
            window.olMap.addLayer(selectionLayer);
            window.olMap.addLayer(highlightLayer);
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
            
            window.olMap.addLayer(layer0Layer);
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
                if (window.olMap && mapElement.offsetParent !== null) { // Check if panel is visible
                    window.olMap.updateSize();
                    console.log("DEBUG: OpenLayers map size updated after a short delay.");
                }
                updateZ21GridOL(); // Initial grid draw
                
                // Add event listeners to update grid when map view changes
                window.olMap.on('moveend', updateZ21GridOL);
                window.olMap.on('change:resolution', updateZ21GridOL);
                console.log("DEBUG: Added map movement event listeners for grid updates");
            }, 250);

            // --- OpenLayers Map Interactions for Tile Selection (moved inside init) ---
            // Store drag pan interaction in the global variable
            window.olMap.getInteractions().forEach(interaction => {
                if (interaction instanceof ol.interaction.DragPan) {
                    dragPanInteraction = interaction;
                }
            });
            if (!dragPanInteraction) {
                console.warn("Could not find default DragPan interaction.");
            }

            const clickSelectHandler = function (evt) {
                console.log("clickSelectHandler triggered via singleclick", evt.coordinate);
                // Rest of clickSelectHandler logic... (already present from previous diffs, ensure it uses the higher-scoped selectionSource etc.)
                // For brevity, not repeating the entire function here, but it should be the one defined earlier.
                // Make sure it correctly calls toggleTileSelection and updateSelectedTileCountDisplay
                 if (!window.olMap) return;
                const currentZoom = window.olMap.getView().getZoom();
                if (currentZoom < GRID_VISIBILITY_MIN_ZOOM) {
                    clearMapSelectionAndDetails(); return;
                }
                const coordinate = evt.coordinate;
                let clickedSavedFeature = null;
                let clickedGroupId = null;
                const pixel = window.olMap.getEventPixel(evt.originalEvent);
                const targetLayer = window.selectedLayerId && window.userLayers ? window.userLayers[window.selectedLayerId]?.layer : null;
                if (targetLayer) {
                    window.olMap.forEachFeatureAtPixel(pixel, (feature, layer) => {
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
            window.olMap.addInteraction(dragBoxInteraction);
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
                if (!window.olMap || !selectionSource || !selectionTileGrid || !window.userLayers || !window.selectedLayerId) return;
                
                // Don't clear selection here, it's already handled in boxstart
                const targetLayerId = window.selectedLayerId;
                const targetSource = window.userLayers[targetLayerId].layer.getSource();
                const existingTileIdsInLayer = new Set(targetSource.getFeatures().map(f => f.get('tileId')).filter(id => id));
                
                let tilesAdded = 0;
                selectionTileGrid.forEachTileCoord(boxExtent, TILE_SELECTION_ZOOM, function (tileCoord) {
                    const tileId = getTileId(tileCoord); // Use existing getTileId
                    if (!existingTileIdsInLayer.has(tileId)) {
                        addTileToSelection(tileCoord);
                        tilesAdded++;
                    }
                });
                
                console.log(`Added ${tilesAdded} tiles to selection.`);
                updateSelectedTileCountDisplay();
            });

            window.olMap.on('singleclick', clickSelectHandler);
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
                        // 'irengine' case has been removed.
                        default: 
                            console.error(`Unknown XR engine: ${engine}`); 
                            if(xrIframe) xrIframe.src='about:blank'; 
                            return;
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

