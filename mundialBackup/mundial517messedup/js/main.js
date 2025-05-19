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
    console.log("%cDOM_CONTENT_LOADED_START", "color: green; font-weight: bold;");

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
             console.log(`DRAG_DEBUG: Click on interactive element for ${elmnt.id}. Target:`, e.target, `. Is it a button? ${e.target.tagName === 'BUTTON'}. Closest button:`, e.target.closest('button'), " - NOT DRAGGING. Event default NOT prevented here.");
            return; // Default action (like button click) should proceed.
        }
        
        console.log(`DRAG_DEBUG: Proceeding with drag for ${elmnt.id}. Will call e.preventDefault().`);
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
    // console.log("DEBUG: toggleMapCesiumViewBtn DOM element:", toggleMapCesiumViewBtn); // Old button, removed
    // const newMapViewToggleBtn = document.getElementById('map-view-toggle-btn'); // TEMP COMMENT OUT FOR LAYOUT DEBUG
    // console.log("DEBUG: newMapViewToggleBtn DOM element:", newMapViewToggleBtn); // TEMP COMMENT OUT


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

    console.log("%cPRE_SCENE_ELEMENT_CHECK_LOG", "color: orange; font-weight: bold;");
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

/* initializeOLCesiumMapPanel function TEMP COMMENTED OUT FOR LAYOUT DEBUG
function initializeOLCesiumMapPanel() {
    // ... content of function ...
}
*/

    // ToggleCesiumViewControl class definition REMOVED.
    // Will be replaced by a direct HTML button and a global handler.

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

            // Instantiation of ToggleCesiumViewControl REMOVED.
            // Will be handled by a direct HTML button.

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
        if (!window.olMap || !gridLayerZ21 || !selectionTileGrid) {
            console.warn("updateZ21GridOL: Map or grid components not ready");
            return;
        }
        const currentZoom = window.olMap.getView().getZoom();
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
            const view = window.olMap.getView();
            const mapSize = window.olMap.getSize();
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
    
                window.globus = new og.Globe({
                    target: globusContainerElement,
                    name: "OpenGlobus View",
                    layers: initialOgLayers,
                    terrain: new og.terrain.EmptyTerrain(), // Initialize with EmptyTerrain directly
                    lon: -74.0445,
                    lat: 40.6892,
                    alt: 3000, // Initial constructor altitude
                    resourcesSrc: "/packages/openglobus/res",
                    fontsSrc: "/packages/openglobus/res/fonts"
                    // controls: [new og.control.LayerSwitcher()] // Controls will be added later
                });

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
function initializeOLCesiumMapPanel() {
    if (typeof olcs === 'undefined' || typeof Cesium === 'undefined') {
        console.error("OLCesium or Cesium library not loaded. Cannot initialize OLCesium map panel view.");
        if (toggleMapCesiumViewBtn) toggleMapCesiumViewBtn.disabled = true;
        return;
    }
    if (!window.olMap) {
        console.error("OpenLayers map (window.olMap) not initialized. Cannot initialize OLCesium map panel view.");
        if (toggleMapCesiumViewBtn) toggleMapCesiumViewBtn.disabled = true;
        return;
    }
    if (!cesiumMapContainer) { // cesiumMapContainer is the div for Cesium in map-panel
        console.error("Cesium container div (cesium-map-container) not found in DOM for OLCesium.");
        if (toggleMapCesiumViewBtn) toggleMapCesiumViewBtn.disabled = true;
        return;
    }

    try {
        console.log("Initializing OLCesium for map panel...");
        olcsMapPanel = new olcs.OLCesium({
            map: window.olMap,
            target: 'cesium-map-container', // ID of the div to host Cesium
        });
        
        const scene = olcsMapPanel.getCesiumScene();
        if (scene.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
            scene.terrainProvider = Cesium.createWorldTerrain({
                // requestWaterMask: true, 
                // requestVertexNormals: true 
            });
        }
        scene.globe.enableLighting = true;

        olcsMapPanel.setEnabled(false); 
        cesiumMapContainer.style.display = 'none'; 
        if (mapElementForOL) mapElementForOL.style.display = 'block'; 

        console.log("OLCesium for map panel initialized and disabled by default.");
        if (toggleMapCesiumViewBtn) {
            toggleMapCesiumViewBtn.disabled = false;
            toggleMapCesiumViewBtn.textContent = "3D View"; // Initial text
        }

    } catch (error) {
        console.error("Error initializing OLCesium for map panel:", error);
        if (toggleMapCesiumViewBtn) toggleMapCesiumViewBtn.disabled = true;
        alert("Failed to initialize 3D Map View (OLCesium). Check console.");
    }
}
            console.log("OpenGlobus initialization sequence completed in JS.");
        }
        } catch (e) {
            console.error("%cFATAL ERROR during OpenGlobus initialization (new og.Globe call or subsequent setup):", "color: red; font-size: 1.2em; font-weight: bold;", e);
            window.globus = null;
        }
    } // End function initializeOpenGlobus

    function handleGlobeClick(mouse, eventName) {
        console.log(`%cHANDLEGLOBECLICK: Event '${eventName}' received.`, "color: magenta; font-size: 1.1em; font-weight: bold;", "Mouse data:", mouse);

        // Process 'lclick' and 'Canvas DOM click' events for selection
        if (eventName === 'lclick' || eventName === 'Canvas DOM click') {
            console.log("HANDLEGLOBECLICK: Event name check passed, proceeding with click handling.");
        } else {
            console.log(`HANDLEGLOBECLICK: Event '${eventName}' is NOT 'lclick' or 'Canvas DOM click', ignoring for selection.`);
            return;
        }

        if (!window.globus || !window.globus.planet || !window.globus.planet.camera || !selectionTileGrid || !window.olMap) {
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
        'scene-btn': document.getElementById('scene-panel') // Added scene button
    };
    const controlPanels = [
        document.getElementById('layer-switcher'),
        document.getElementById('user-layers-panel'),
        document.getElementById('app-controls'),
        document.getElementById('settings-panel'),
        document.getElementById('tileset-details-modal'),
        document.getElementById('assets-panel')
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
                makeDraggable(panel);
            } else {
                // To know which panel is null, we'd need to map controlPanels back to their intended IDs if possible,
                // or log the index. For now, just a general error.
                console.error(`DRAG_ERROR: A panel in controlPanels array (at index ${index}) is null. Cannot make draggable.`);
            }
        });
        console.log("DEBUG: Draggable behavior applied to panels.");
    }

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
                    if (layerSwitcherPanel) {
                        layerSwitcherPanel.style.display = isActiveAfterToggle ? 'block' : 'none';
                    }
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
        mapPanelElement.style.setProperty('height', 'calc(100vh - 70px)', 'important'); /* Use vh for robustness */
        mapPanelElement.style.setProperty('top', '60px', 'important');
        mapPanelElement.style.setProperty('left', '10px', 'important');
        mapPanelElement.style.setProperty('background-color', 'rgba(50, 50, 50, 0.9)', 'important');
        mapPanelElement.style.setProperty('z-index', '1000', 'important');
        console.log("DEBUG: Forcing map-panel visibility and full styling via JS (height restored).");
    } else {
        console.error("Initial setup: map-panel not found");
    }
    
    if (globeViewButtonElement) globeViewButtonElement.classList.add('active'); else console.error("Initial setup: globe-view-btn not found");
    if (globePanelElement) {
        globePanelElement.style.setProperty('display', 'block', 'important');
        globePanelElement.style.setProperty('width', 'calc(50% - 15px)', 'important');
        globePanelElement.style.setProperty('height', 'calc(100vh - 70px)', 'important'); /* Use vh for robustness */
        globePanelElement.style.setProperty('top', '60px', 'important');
        globePanelElement.style.setProperty('right', '10px', 'important');
        globePanelElement.style.setProperty('left', 'auto', 'important');
        globePanelElement.style.setProperty('background-color', 'rgba(50, 50, 50, 0.9)', 'important');
        globePanelElement.style.setProperty('z-index', '1000', 'important');
        console.log("DEBUG: Forcing globe-panel visibility and full styling via JS (height restored).");
    } else {
        console.error("Initial setup: globe-panel not found");
    }

    // Make Layers panel visible by default but respect its position under the map menu
    const layersButton = document.getElementById('layers-btn');
    const layersPanel = viewToggleButtons['layers-btn'];

    // --- New Map View Toggle Button Listener ---
    // const newMapViewToggleBtn = document.getElementById('map-view-toggle-btn'); // REMOVED: Already declared earlier (around line 157)
    if (newMapViewToggleBtn) { // Uses the existing newMapViewToggleBtn declared earlier
        newMapViewToggleBtn.addEventListener('click', () => {
            console.log("New Map View Toggle Button clicked.");
            if (!window.olMap) {
                console.error("Map View Toggle: window.olMap not found.");
                return;
            }
            // Ensure OLCesium is initialized (it assigns to window.olcsMapPanel)
            if (!window.olcsMapPanel && typeof initializeOLCesiumMapPanel === 'function') {
                console.log("Map View Toggle: olcsMapPanel not initialized, attempting to initialize...");
                if (!initializeOLCesiumMapPanel()) { // initializeOLCesiumMapPanel now returns true/false
                    alert("3D map view components could not be initialized.");
                    console.error("Map View Toggle: initializeOLCesiumMapPanel failed.");
                    return;
                }
            }
            if (!window.olcsMapPanel) { // Check again after init attempt
                console.error("Map View Toggle: olcsMapPanel still not available after init attempt.");
                alert("3D map view components could not be initialized (post-check).");
                return;
            }

            const cesiumIsEnabled = !window.olcsMapPanel.getEnabled(); // Toggle: if currently disabled, will be enabled
            window.olcsMapPanel.setEnabled(cesiumIsEnabled);
            newMapViewToggleBtn.innerHTML = cesiumIsEnabled ? '2D' : '3D';
            
            const olMapDiv = document.getElementById('map');
            const cesiumDiv = document.getElementById('cesium-map-container');

            if (olMapDiv && cesiumDiv) {
                if (cesiumIsEnabled) {
                    olMapDiv.style.display = 'none';
                    cesiumDiv.style.display = 'block';
                    console.log("Map View Toggle: Switched to 3D (Cesium) view.");
                } else {
                    olMapDiv.style.display = 'block';
                    cesiumDiv.style.display = 'none';
                    console.log("Map View Toggle: Switched to 2D (OpenLayers) view.");
                }
            } else {
                console.error("Map View Toggle: OpenLayers map or Cesium container elements not found.");
            }
            
            if (window.olMap && !cesiumIsEnabled) { // If switching back to OL
                 setTimeout(() => window.olMap.updateSize(), 0); // Ensure OL map renders correctly
            }
            // Cesium scene should render automatically when its container is visible and it's enabled.
        });
    } else {
        console.warn("DEBUG: New map view toggle button ('map-view-toggle-btn') not found for listener attachment.");
    }
    // --- End New Map View Toggle Button Listener ---
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

    // --- New Map View Toggle Button Listener --- TEMP COMMENTED OUT FOR LAYOUT DEBUG
    /*
    // const newMapViewToggleBtn = document.getElementById('map-view-toggle-btn'); // REMOVED: Already declared earlier (around line 157)
    if (newMapViewToggleBtn) { // Uses the existing newMapViewToggleBtn declared earlier
        newMapViewToggleBtn.addEventListener('click', () => {
            console.log("New Map View Toggle Button clicked.");
            if (!window.olMap) {
                console.error("Map View Toggle: window.olMap not found.");
                return;
            }
            // Ensure OLCesium is initialized (it assigns to window.olcsMapPanel)
            if (!window.olcsMapPanel && typeof initializeOLCesiumMapPanel === 'function') {
                console.log("Map View Toggle: olcsMapPanel not initialized, attempting to initialize...");
                if (!initializeOLCesiumMapPanel()) { // initializeOLCesiumMapPanel now returns true/false
                    alert("3D map view components could not be initialized.");
                    console.error("Map View Toggle: initializeOLCesiumMapPanel failed.");
                    return;
                }
            }
            if (!window.olcsMapPanel) { // Check again after init attempt
                console.error("Map View Toggle: olcsMapPanel still not available after init attempt.");
                alert("3D map view components could not be initialized (post-check).");
                return;
            }

            const cesiumIsEnabled = !window.olcsMapPanel.getEnabled(); // Toggle: if currently disabled, will be enabled
            window.olcsMapPanel.setEnabled(cesiumIsEnabled);
            newMapViewToggleBtn.innerHTML = cesiumIsEnabled ? '2D' : '3D';
            
            const olMapDiv = document.getElementById('map');
            const cesiumDiv = document.getElementById('cesium-map-container');

            if (olMapDiv && cesiumDiv) {
                if (cesiumIsEnabled) {
                    olMapDiv.style.display = 'none';
                    cesiumDiv.style.display = 'block';
                    console.log("Map View Toggle: Switched to 3D (Cesium) view.");
                } else {
                    olMapDiv.style.display = 'block';
                    cesiumDiv.style.display = 'none';
                    console.log("Map View Toggle: Switched to 2D (OpenLayers) view.");
                }
            } else {
                console.error("Map View Toggle: OpenLayers map or Cesium container elements not found.");
            }
            
            if (window.olMap && !cesiumIsEnabled) { // If switching back to OL
                 setTimeout(() => window.olMap.updateSize(), 0); // Ensure OL map renders correctly
            }
            // Cesium scene should render automatically when its container is visible and it's enabled.
        });
    } else {
        // console.warn("DEBUG: New map view toggle button ('map-view-toggle-btn') not found for listener attachment."); // Already commented out
    }
    // --- End New Map View Toggle Button Listener ---
    */
    
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
            console.log("%cSCENE_BTN_CLICK: 3D Tile button CLICKED!", "color: green; font-weight: bold;");
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
            console.log("%cSCENE_BTN_CLICK: USD button CLICKED!", "color: green; font-weight: bold;");
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
            console.log("%cSCENE_BTN_CLICK: I3S button CLICKED!", "color: green; font-weight: bold;");
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
        initializeOpenGlobus();
        console.log("OpenGlobus switched to Earth.");
        updateActiveGlobeButton('setting-globe-earth'); // Use new ID
    }

    function switchToMoonView() {
        console.log("Switching to Moon view...");
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

    // --- Base Layer Selection Logic ---
    const baseLayerSelectOLElement = document.getElementById('base-layer-select');
    const customLayerInputsDivElement = document.getElementById('custom-layer-inputs');
    const customLayerNameInputElement = document.getElementById('custom-layer-name');
    const customLayerUrlInputElement = document.getElementById('custom-layer-url');
    const addCustomLayerBtnElement = document.getElementById('add-custom-layer-btn');

    const olBaseLayers = {
        'satellite': { source: () => new ol.source.XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attributions: 'Tiles © Esri', maxZoom: 19 }) },
        'osm': { source: () => new ol.source.OSM({ attributions: '© OpenStreetMap contributors', maxZoom: 19 }) },
        'topo': { source: () => new ol.source.XYZ({ url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', attributions: '© OpenTopoMap (CC-BY-SA)', maxZoom: 17 }) },
        'terrarium': { source: () => new ol.source.XYZ({ url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', attributions: '© Mapzen, OpenStreetMap, and SRTM', maxZoom: 15, tileGrid: ol.tilegrid.createXYZ({maxZoom: 15}) }) } // Terrarium has specific needs
    };

    const ogBaseLayerMappings = { // Renamed to avoid conflict
        'satellite': 'Satellite', // Name of the OG layer defined in initializeOpenGlobus
        'osm': 'OpenStreetMap'  // Name of the OG layer defined in initializeOpenGlobus
        // Add OpenGlobus equivalents for topo/terrarium if they are set up in initializeOpenGlobus
    };

    if (baseLayerSelectOLElement) {
        baseLayerSelectOLElement.addEventListener('change', function() {
            const selectedValue = this.value;
            if (customLayerInputsDivElement) customLayerInputsDivElement.style.display = 'none';

            if (selectedValue === 'add-custom') {
                if (customLayerInputsDivElement) customLayerInputsDivElement.style.display = 'block';
                return;
            }

            // Handle OpenLayers map
            if (window.olMap) {
                const currentBaseLayer = window.olMap.getLayers().getArray().find(layer => layer.get('type') === 'base');
                if (currentBaseLayer) {
                    window.olMap.removeLayer(currentBaseLayer);
                }
                if (olBaseLayers[selectedValue]) {
                    const newSource = olBaseLayers[selectedValue].source();
                    const newBaseLayerOL = new ol.layer.Tile({ source: newSource, type: 'base' });
                    window.olMap.getLayers().insertAt(0, newBaseLayerOL);
                } else {
                    console.warn(`OpenLayers definition for ${selectedValue} not found.`);
                }
            }
 
            // OpenGlobus basemap changes will be handled by its own UI, if present.
            // This dropdown now only controls the OpenLayers map.
        });
    }

    if (addCustomLayerBtnElement && customLayerNameInputElement && customLayerUrlInputElement && baseLayerSelectOLElement && customLayerInputsDivElement) {
        addCustomLayerBtnElement.addEventListener('click', () => {
            const name = customLayerNameInputElement.value.trim();
            const url = customLayerUrlInputElement.value.trim();
            if (!name || !url) {
                alert("Please enter both a name and a URL for the custom layer.");
                return;
            }
            if (window.olMap) {
                const currentBaseLayer = window.olMap.getLayers().getArray().find(layer => layer.get('type') === 'base');
                if (currentBaseLayer) {
                    window.olMap.removeLayer(currentBaseLayer);
                }
                const newCustomSource = new ol.source.XYZ({ url: url, attributions: name });
                const newCustomLayerOL = new ol.layer.Tile({ source: newCustomSource, type: 'base' });
                window.olMap.getLayers().insertAt(0, newCustomLayerOL);

                const optionId = `custom-${name.replace(/\s+/g, '-')}`;
                // Remove old custom option if it exists with the same ID to prevent duplicates
                const existingOption = baseLayerSelectOLElement.querySelector(`option[value="${optionId}"]`);
                if (existingOption) existingOption.remove();
                
                const newOption = document.createElement('option');
                newOption.value = optionId;
                newOption.textContent = `Custom: ${name}`;
                newOption.selected = true;
                baseLayerSelectOLElement.insertBefore(newOption, baseLayerSelectOLElement.querySelector('option[value="add-custom"]'));
                customLayerInputsDivElement.style.display = 'none';
                customLayerNameInputElement.value = '';
                customLayerUrlInputElement.value = '';
            }
            // Note: Custom XYZ layers are not automatically added to OpenGlobus here.
            // That would require creating a new og.layer.XYZ and adding it to the planet,
            // which is more involved if it's not pre-defined.
        });
    }
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
        userLayerList) {
        
        console.log(`DEBUG: Adding Layer 0 to list. ID: ${layer0Id}, Name: ${window.userLayers[layer0Id].name}`);
        addLayerToList(layer0Id, window.userLayers[layer0Id].name, true);
        selectLayerInList(layer0Id);
        console.log("DEBUG: Layer 0 added and selected in UI list.");
    } else {
        console.warn("DEBUG: Conditions NOT met to add Layer 0 to UI list initially. Check userLayers, selectedLayerId, layer0Id, and userLayerList.");
    }
// Load test tileset for debugging and verification
console.log("%cENTERED DOMContentLoaded LISTENER - START", "background: orange; color: black; font-size: 1.5em; font-weight: bold;");
if (typeof loadTestTilesetToLayer0 === 'function') {
    console.log("DEBUG: Calling loadTestTilesetToLayer0() on startup...");
    loadTestTilesetToLayer0();
} else {
    console.warn("DEBUG: loadTestTilesetToLayer0 function not found, cannot load test data.");
}

if (typeof setupXRPanelLogic === 'function') {
        console.log("DEBUG: Calling setupXRPanelLogic() from DOMContentLoaded.");
        setupXRPanelLogic();
    } else {
        console.warn("DEBUG: setupXRPanelLogic function not found, cannot set up XR panel.");
    }
console.log("DEBUG: End of DOMContentLoaded listener.");
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
