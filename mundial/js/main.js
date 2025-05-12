console.log("%cMAIN.JS SCRIPT EXECUTION STARTED - VERY TOP LINE", "color: green; font-size: 1.5em; font-weight: bold;");
// alert("MAIN.JS LOADED - TOP OF FILE"); // Removed after confirming script load
// alert("DEBUG: main.js SCRIPT EXECUTION STARTED. Click OK to continue."); // Removed debug alert
console.log("GLOBAL SCOPE: JavaScript is running in main.js (line 4 now)");
window.globus = null; // Declare globus in global scope and attach to window
window.olMap = null; // Declare olMap in global scope for OpenLayers map
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
let dragPanInteraction = null; // Define dragPanInteraction at top level
let dragBoxInteraction = null; // Define dragBoxInteraction at top level
// userLayers and selectedLayerId are already on window object from previous steps
// mundial/main.js - Full version with OpenGlobus focus

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded entered (alert removed).");

    // --- Settings Panel DOM Elements ---
    const settingStartLonInput = document.getElementById('setting-start-lon');
    const settingStartLatInput = document.getElementById('setting-start-lat');
    const settingStartZoomInput = document.getElementById('setting-start-zoom');
    const settingSetStartLocationBtn = document.getElementById('setting-set-start-location-btn');
    const settingGridVisibleCheckbox = document.getElementById('setting-grid-visible');
    const settingGridWeightInput = document.getElementById('setting-grid-weight');
    console.log("DEBUG: Settings panel DOM elements obtained.");

    // --- Draggable Panels ---
    function makeDraggable(elmnt) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const dragHandle = elmnt.querySelector('.panel-header') || elmnt.querySelector('h2') || elmnt;
      if (dragHandle) {
        dragHandle.style.cursor = 'move';
        dragHandle.onmousedown = dragMouseDown;
      } else {
        elmnt.style.cursor = 'move';
        elmnt.onmousedown = dragMouseDown;
      }
      function dragMouseDown(e) {
        e = e || window.event; e.preventDefault();
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
    console.log("DEBUG: makeDraggable function defined.");

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
    // settingsBtn and settingsPanel are already defined

    // Toolbar Buttons & Panels for View Toggling (already mostly handled, ensure all refs exist)
    const socialBtn = document.getElementById('social-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const globeViewBtn = document.getElementById('globe-view-btn');
    const layersBtn = document.getElementById('layers-btn');
    const signInBtn = document.getElementById('signin-btn');
    const profileBtn = document.getElementById('profile-btn');
    const xrViewBtn = document.getElementById('xr-view-btn');

    const socialPanel = document.getElementById('social-panel');
    const mapPanelOL = document.getElementById('map-panel'); // Renamed to avoid conflict
    const globePanelOG = document.getElementById('globe-panel'); // Renamed
    const layerSwitcherPanelOL = document.getElementById('layer-switcher'); // Renamed
    const profilePanel = document.getElementById('profile-panel');
    const xrPanel = document.getElementById('xr-panel');
    
    console.log("DEBUG: UI Element References obtained.");

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
            selectionSource.removeFeature(existingFeature);
            selectionChanged = true;
        } else if (!isTileSaved) {
            const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
            const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
            newFeature.setId(tileId);
            newFeature.set('isIndividualSelection', true);
            selectionSource.addFeature(newFeature);
            selectionChanged = true;
        }
        updateSelectedTileCountDisplay();

        // If the selection changed and the globe layer exists, redraw it to reflect selection highlights (if any)
        // or to clear highlights if a selected tile that was part of a saved set is deselected.
        // Note: The primary drawing of saved tilesets in OpenGlobus is based on features in userLayers,
        // but this ensures any temporary selection indicators on the globe are also updated.
        if (selectionChanged && ogSavedTilesetsLayer && typeof ogSavedTilesetsLayer.redraw === 'function') {
            console.log("toggleTileSelection: Triggering ogSavedTilesetsLayer redraw due to selection change.");
            ogSavedTilesetsLayer.redraw();
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

    // Placeholder for other UI functions to be added later:
    // populateTilesetList, addLayerToList, selectLayerInList, openTilesetDetailsModal etc.
    // Event listeners for save, clear, mode buttons etc.

    // --- OpenLayers Map Initialization ---
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
                            attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer">ArcGIS</a>'
                        })
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
            const selectionStyle = new ol.style.Style({ fill: new ol.style.Fill({ color: 'rgba(200, 200, 200, 0.5)' }) });
            selectionSource = new ol.source.Vector(); // Assign to higher-scoped variable
            const groupSelectionStyle = new ol.style.Style({ fill: new ol.style.Fill({ color: 'rgba(0, 255, 255, 0.5)' }) });  // Cyan fill for selected groups
            selectionLayer = new ol.layer.Vector({ // Assign to higher-scoped variable
                source: selectionSource,
                style: function(feature) {
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
            const layer0Id = 'layer-0';
            const layer0Name = 'Layer 0';
            layer0Source = new ol.source.Vector(); // Assign to higher-scoped variable
            // Define a function to create the style based on feature properties
            const createTilesetStyle = (feature) => {
                const color = feature.get('color') || '#008080'; // Default teal
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

            // Function to update a single feature's style
            const updateFeatureStyle = (feature) => {
                 if (feature.get('isVisible') !== false) {
                     feature.setStyle(createTilesetStyle(feature));
                 } else {
                     feature.setStyle(null); // Hide if not visible
                 }
            };

            // Apply the style function to the layer
            layer0Layer = new ol.layer.Vector({
                source: layer0Source,
                style: createTilesetStyle, // Use the function directly
                title: layer0Id,
                zIndex: 2,
                visible: true
            });
            layer0Layer.set('userLayerName', layer0Name);
            window.userLayers = { [layer0Id]: { name: layer0Name, layer: layer0Layer, tilesetCount: 0 } }; // Attach to window for broader access if needed
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
                    if (selectionSource) selectionSource.clear(); return;
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
                    if (selectionSource) selectionSource.clear();
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
                        // If a saved group is clicked on the map, zoom to it in both views
                        zoomToTilesetGroup(clickedGroupId);
                    }
                } else {
                    if (selectionSource) {
                        const isGroupCurrentlySelected = selectionSource.getFeatures().some(f => f.get('isGroupSelection'));
                        if (isGroupCurrentlySelected) selectionSource.clear();
                    }
                    const tileCoord = selectionTileGrid.getTileCoordForCoordAndZ(coordinate, TILE_SELECTION_ZOOM);
                    toggleTileSelection(tileCoord);
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
                        selectionSource.clear();
                        updateSelectedTileCountDisplay();
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
        if (!window.olMap) return;
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
            if (selectionSource) selectionSource.clear();
            // if (highlightSource) highlightSource.clear(); // If highlight is used for current selection
            // highlightListItem(null); // Requires highlightListItem function
            if (tilesetDetailsModal) tilesetDetailsModal.style.display = 'none'; // Assumes tilesetDetailsModal is defined
            // currentEditingGroupId = null; // Requires currentEditingGroupId
            console.log("Cleared current selection.");
            updateSelectedTileCountDisplay();
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
        buttonContainer.classList.add('button-container');
        const editBtn = document.createElement('button'); editBtn.innerHTML = '✏️'; editBtn.classList.add('settings-btn-small'); editBtn.title = `Edit name for "${layerName}"`;
        const privacyBtn = document.createElement('button'); privacyBtn.innerHTML = '🌐'; privacyBtn.classList.add('settings-btn-small'); privacyBtn.title = `Toggle privacy for "${layerName}" (Current: Public)`;
        const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '🗑️'; deleteBtn.classList.add('settings-btn-small'); deleteBtn.title = `Delete layer "${layerName}"`;
        buttonContainer.appendChild(editBtn); buttonContainer.appendChild(privacyBtn); buttonContainer.appendChild(deleteBtn);
        itemDiv.appendChild(selectionIndicator);
        itemDiv.appendChild(visibilityBtn);
        itemDiv.appendChild(nameSpan);
        itemDiv.appendChild(buttonContainer);
        const initialMsg = userLayerList.querySelector('small'); if (initialMsg) initialMsg.remove();
        userLayerList.appendChild(itemDiv);
    }

    function selectLayerInList(layerId) {
        if (!userLayerList || !window.userLayers) { console.warn("selectLayerInList: userLayerList or userLayers not ready."); return; }
        const currentSelectedItem = userLayerList.querySelector(`.layer-item[data-layer-id="${window.selectedLayerId}"]`);
        if (currentSelectedItem) {
            const prevIndicator = currentSelectedItem.querySelector('.selection-indicator');
            if (prevIndicator) prevIndicator.innerHTML = '';
        }
        const newItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
        if (newItem) {
            const newIndicator = newItem.querySelector('.selection-indicator');
            if (newIndicator) newIndicator.innerHTML = '✔️';
        }
        window.selectedLayerId = layerId;
        populateTilesetList(layerId);
        console.log(`Selected layer: ${layerId}`);
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
        if (!window.userLayers || !window.userLayers[layerId]) return;
        const isCurrentlyPublic = buttonElement.innerHTML === '🌐'; const newPrivacy = isCurrentlyPublic ? 'Private' : 'Public';
        const newIcon = isCurrentlyPublic ? '🔒' : '🌐'; const layerName = window.userLayers[layerId]?.name || 'this layer';
        if (confirm(`Change privacy for layer "${layerName}" to ${newPrivacy}?`)) {
            buttonElement.innerHTML = newIcon; buttonElement.title = `Toggle privacy for "${layerName}" (Current: ${newPrivacy})`;
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
            const newLayerName = prompt("Enter name for new layer:", `Layer ${layerCounter}`);
            if (newLayerName && newLayerName.trim() !== '' && window.olMap) {
                const trimmedName = newLayerName.trim(); const newLayerId = `layer-${layerCounter++}`;
                const newSource = new ol.source.Vector();
                // Use the same style function for newly created layers
                const newLayer = new ol.layer.Vector({
                    source: newSource,
                    style: createTilesetStyle, // Use the style function
                    title: newLayerId,
                    zIndex: 2,
                    visible: true
                });
                newLayer.set('userLayerName', trimmedName);
                window.userLayers[newLayerId] = { name: trimmedName, layer: newLayer, tilesetCount: 0 };
                window.olMap.addLayer(newLayer);
                addLayerToList(newLayerId, trimmedName, true);
                selectLayerInList(newLayerId);
            }
        });
    } else {
        console.warn("DEBUG: createLayerBtn not found, event listener not attached.");
    }
    
    function populateTilesetList(layerId) {
        if (!tilesetListDiv || !window.userLayers || !window.userLayers[layerId]) {
            if(tilesetListDiv) tilesetListDiv.innerHTML = '<small><i>Invalid layer or no layer selected.</i></small>';
            return;
        }
        tilesetListDiv.innerHTML = '';
        const layerInfo = window.userLayers[layerId];
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
            }
        });
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

    function highlightListItem(groupId) {
        if (!tilesetListDiv) return;
        const currentlyHighlighted = tilesetListDiv.querySelector('.highlighted');
        if (currentlyHighlighted) currentlyHighlighted.classList.remove('highlighted');
        if (groupId) {
            const listItem = tilesetListDiv.querySelector(`.tileset-item[data-tileset-group-id="${groupId}"]`);
            if (listItem) listItem.classList.add('highlighted');
        }
    }
    
    function flyToTilesetGroupInGlobe(groupId) {
        console.log(`flyToTilesetGroupInGlobe: Attempting to fly to groupId: ${groupId}`);
        if (!window.globus || !window.globus.planet || !window.globus.planet.camera ||
            !window.selectedLayerId || !window.userLayers || !window.userLayers[window.selectedLayerId]) {
            console.warn("flyToTilesetGroupInGlobe: Globus or layer data not ready.");
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
                let altitude;
                if (groupFeatures.length === 1 && diagonal < 0.001) { // Very small extent, likely single ZL21 tile
                    altitude = 300; // Zoom in close for single tiles
                } else {
                    altitude = Math.max(500, diagonal * 200000); // Increased factor for larger areas
                }
                altitude = Math.min(altitude, 10000000); // Max 10,000km altitude

                console.log(`flyToTilesetGroupInGlobe: Flying to Lon: ${centerLon.toFixed(4)}, Lat: ${centerLat.toFixed(4)}, Alt: ${altitude.toFixed(0)} (Diagonal: ${diagonal.toFixed(6)} degrees)`);
                
                if (typeof window.globus.planet.camera.flyLonLat === 'function') {
                    window.globus.planet.camera.flyLonLat(new og.LonLat(centerLon, centerLat, altitude), null, null, () => {
                        console.log("flyToTilesetGroupInGlobe: FlyTo complete.");
                    });
                } else {
                    console.warn("flyToTilesetGroupInGlobe: camera.flyLonLat not available.");
                }
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
                window.olMap.getView().fit(groupExtent, { padding: [50, 50, 50, 50], duration: 500, maxZoom: TILE_SELECTION_ZOOM });
                highlightListItem(groupId);
                flyToTilesetGroupInGlobe(groupId);
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
                zoomToTilesetGroup(groupId); // This will also fly the globe
                const layer = window.userLayers[window.selectedLayerId]?.layer;
                if (layer) {
                    const firstFeature = layer.getSource().getFeatures().find(f => f.get('tilesetGroupId') === groupId);
                    if (firstFeature) {
                        openTilesetDetailsModal(firstFeature);
                    } else {
                        console.warn(`Could not find feature for groupId ${groupId} to open details modal.`);
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

        if (!feature || !tilesetDetailsModal || !detailsTilesetNameInput || !detailsColorPicker ||
            !detailsFillOpacityInput || !detailsStrokeWidthInput || // Add new inputs to the check
            !detailsTilesetImageUrlInput || !detailsTilesetLinkInput || !detailsTilesetTagsTextarea ||
            !detailsTilesetImage || !detailsTilesetCoordsSpan ) {
            console.error("openTilesetDetailsModal: One or more required elements or feature is missing.");
            return;
        }
        const groupId = feature.get('tilesetGroupId');
        const name = feature.get('tilesetName') || 'Unnamed Tileset';
        const color = feature.get('color') || '#008080';
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
                 }
            }
        }
        detailsTilesetCoordsSpan.textContent = coordsStr;
        // detailsLocationInfoSpan.textContent = 'Loading...'; // If re-added
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
        if (!skipStyleUpdate && ogSavedTilesetsLayer && typeof ogSavedTilesetsLayer.redraw === 'function') {
             console.log("Triggering ogSavedTilesetsLayer redraw due to property change for OpenGlobus.");
             ogSavedTilesetsLayer.redraw();
        } else if (!skipStyleUpdate) {
             console.warn("Could not redraw ogSavedTilesetsLayer - layer or redraw function missing.");
        }
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
             if (!isNaN(width) && width >= 0) {
                 applyGroupPropertyChange('strokeWidth', width);
             }
         });
    }

    if (saveSelectionBtn) {
        saveSelectionBtn.addEventListener('click', () => {
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
            let tilesetFeatureCounter = 0; // Local counter for feature IDs within this save operation
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
                clonedFeature.set('color', detailsColorPicker ? detailsColorPicker.value : '#008080');
                clonedFeature.set('fillOpacity', detailsFillOpacityInput ? parseFloat(detailsFillOpacityInput.value) : 0.6); // Default to new fill opacity
                clonedFeature.set('strokeWidth', detailsStrokeWidthInput ? parseFloat(detailsStrokeWidthInput.value) : 0.5); // Default to new stroke width
                clonedFeature.unset('isIndividualSelection');
                featuresToAdd.push(clonedFeature);
            });
            if (featuresToAdd.length > 0) {
                targetSource.addFeatures(featuresToAdd);
                window.userLayers[window.selectedLayerId].tilesetCount = (window.userLayers[window.selectedLayerId].tilesetCount || 0) + 1;
                selectionSource.clear();
                setTimeout(() => { populateTilesetList(window.selectedLayerId); }, 100);
                updateSelectedTileCountDisplay();
                tilesetNameInput.value = '';

                // Trigger redraw of the OpenGlobus saved layer
                if (ogSavedTilesetsLayer && typeof ogSavedTilesetsLayer.redraw === 'function') {
                    console.log("saveSelectionBtn: Calling ogSavedTilesetsLayer.redraw() after saving selection.");
                    ogSavedTilesetsLayer.redraw();
                } else {
                    console.warn("saveSelectionBtn: Could not redraw ogSavedTilesetsLayer - layer or redraw function missing.");
                    if (window.globus && window.globus.renderer) { // Fallback if specific layer redraw isn't available
                        console.log("saveSelectionBtn: Calling globus.renderer.draw() as fallback redraw for saved tilesets.");
                        window.globus.renderer.draw();
                    }
                }
            }
        });
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
            ogBaseLayers = {}; 

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
            ogBaseLayers['osm'] = osmOgLayer;
            ogBaseLayers['satellite'] = satelliteOgLayer;
            console.log("DEBUG: Base layers prepared for OpenGlobus.");

            // Use default GlobusRgbTerrain provider as per user's working example insight
            // Create both terrain instances, like the example
            // const emptyTerrainInstance = new og.terrain.EmptyTerrain(); // Removed, will use GlobusRgbTerrain directly
            // console.log("%cDEBUG: Created emptyTerrainInstance.", "color: blue;", emptyTerrainInstance); // Removed

            const globusRgbTerrainInstance = new og.terrain.GlobusRgbTerrain({ heightFactor: 1.0 }); // Explicitly add heightFactor
            console.log("%cDEBUG: Created globusRgbTerrainInstance (default provider with heightFactor).", "color: orange; font-weight: bold;", globusRgbTerrainInstance);
            if (globusRgbTerrainInstance) {
                console.log("  DEBUG: globusRgbTerrainInstance.url (default provider):", globusRgbTerrainInstance.url);
            } else {
                console.error("CRITICAL ERROR: globusRgbTerrainInstance is NULL after instantiation.");
            }
            
            // const targetTerrain = globusRgbTerrainInstance; // Removed, globusRgbTerrainInstance used directly

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
                // terrain: globusRgbTerrainInstance, // Removed from constructor - will be set explicitly later
                lon: -74.0445,
                lat: 40.6892,
                alt: 3000, // Initial constructor altitude
                resourcesSrc: "/packages/openglobus/res", // Absolute path from working version
                fontsSrc: "/packages/openglobus/res/fonts" // Absolute path from working version
            });

            if (window.globus) {
                console.log("%cDEBUG: og.Globe constructor SUCCEEDED. window.globus object created.", "color: green; font-weight: bold;", window.globus);
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
                    console.error("ERROR: Globe constructor did NOT set GlobusRgbTerrain as expected. Current terrain:", window.globus.planet.terrain);
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

                ogSavedTilesetsLayer = new og.layer.CanvasTiles("Saved Tilesets", {
                    visibility: true, // Make it visible by default
                    minZoom: TILE_SELECTION_ZOOM, // Only draw at the target zoom, consistent with reference
                    maxZoom: TILE_SELECTION_ZOOM,
                    opacity: 0.7,
                    drawTile: function (material, applyTexture) {
                        const canvas = document.createElement("canvas");
                        const size = 256;
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        if (!ctx || !material.segment) {
                            applyTexture(canvas); // Apply empty if no context or segment
                            return;
                        }

                        const tileZoom = material.segment.tileZoom;
                        const tileX = material.segment.tileX;
                        const tileY = material.segment.tileY;
                        const tileId = `${tileZoom}-${tileX}-${tileY}`;

                        let isTileSaved = false;
                        let tileColor = null;
                        if (window.selectedLayerId && window.userLayers && window.userLayers[window.selectedLayerId]) {
                            const olLayerSource = window.userLayers[window.selectedLayerId].layer.getSource(); // Get OL source
                            const feature = olLayerSource.getFeatures().find(f => f.get('tileId') === tileId);
                            if (feature) {
                                isTileSaved = true;
                                tileColor = feature.get('color') || '#008080'; // Default to teal if no color
                            }
                        }

                        if (isTileSaved && tileZoom === TILE_SELECTION_ZOOM) {
                            ctx.fillStyle = tileColor;
                            ctx.fillRect(0, 0, size, size);
                        } else {
                            ctx.clearRect(0, 0, size, size); // Keep non-saved tiles transparent
                        }
                        applyTexture(canvas);
                    }
                });
                window.globus.planet.addLayer(ogSavedTilesetsLayer);
                console.log("DEBUG: ogSavedTilesetsLayer added to planet.");

                // Instantiate gridLayerOG properly BEFORE any check that might log it wasn't created
                // This ensures gridLayerOG is an object before the subsequent 'if (gridLayerOG)' check.
                if (!gridLayerOG) { // Instantiate only if not already done
                    gridLayerOG = new og.layer.CanvasTiles("ZL21 Grid", { // Name from working version
                        minZoom: 16, // From working version
                        maxZoom: 21, // From working version
                        visibility: true,
                        opacity: 1.0, // Match openglobus-direct.html
                        // transparentColor: [0.0, 0.0, 0.0], // Not in working version's grid for this layer
                        drawTile: function (material, applyTexture) {
                            const canvas = document.createElement("canvas");
                            const size = 256;
                            canvas.width = size;
                            canvas.height = size;
                            const ctx = canvas.getContext('2d');

                            if (!ctx) { // Added null check for context
                                console.error("gridLayerOG: Failed to get 2D context");
                                applyTexture(canvas); // Apply empty canvas
                                return;
                            }
                            if (!material.segment) {
                                console.warn("drawTile called with null material.segment for ZL21 Grid");
                                applyTexture(canvas);
                                return;
                            }

                            const currentTileZoom = material.segment.tileZoom;
                            // TILE_SELECTION_ZOOM is globally defined as 21
                            const targetGridZoom = 21; // Hardcode to 21 to match openglobus-direct.html

                            ctx.clearRect(0, 0, size, size);

                            // Logic from working version to draw contextual grid
                            if (currentTileZoom >= this.minZoom && currentTileZoom <= this.maxZoom) { // Use this.minZoom and this.maxZoom
                                const lineWeight = 2; // Match openglobus-direct.html
                                ctx.lineWidth = lineWeight;
                                ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // Black lines, same as openglobus-direct.html

                                const maxZoomDiff = 5; // Match openglobus-direct.html
                                const zoomDiff = Math.min(targetGridZoom - currentTileZoom, maxZoomDiff); // Match openglobus-direct.html
                                const subdivisions = Math.pow(2, zoomDiff); // Match openglobus-direct.html
                                const step = size / subdivisions; // Match openglobus-direct.html

                                // Draw vertical lines - Match openglobus-direct.html
                                if (subdivisions > 1) {
                                    for (let i = 1; i < subdivisions; i++) {
                                        const x = i * step; // Remove Math.round
                                        ctx.beginPath();
                                        ctx.moveTo(x, 0);
                                        ctx.lineTo(x, size);
                                        ctx.stroke();
                                    }
                                    // Draw horizontal lines - Match openglobus-direct.html
                                    for (let j = 1; j < subdivisions; j++) {
                                        const y = j * step; // Remove Math.round
                                        ctx.beginPath();
                                        ctx.moveTo(0, y);
                                        ctx.lineTo(size, y);
                                        ctx.stroke();
                                    }
                                }
                                
                                // Draw outer border - Match openglobus-direct.html
                                ctx.beginPath();
                                ctx.rect(0, 0, size, size);
                                ctx.stroke();
                                
                            }
                            applyTexture(canvas);
                        }
                    });
                    console.log("DEBUG: gridLayerOG instantiated with 'working version's grid logic (contextual grid Z16-21).");
                    window.globus.planet.addLayer(gridLayerOG); // Add the grid layer to the planet
                    console.log("DEBUG: gridLayerOG added to planet.");
                }

                // The following block (lines 265-293 in the previous state) was a duplicate instantiation and is now removed.
                // The primary instantiation of gridLayerOG is now handled by the block starting at line 231.
                // The if (gridLayerOG) check to add the layer will now use the correctly instantiated version.
                // console.log("DEBUG: All overlay layer additions (ogSavedTilesetsLayer, gridLayerOG) SKIPPED for isolation test."); // Commented out

                window.globus.planet.addControl(new og.control.ZoomControl());
                window.globus.planet.addControl(new og.control.LayerSwitcher());
                console.log("DEBUG: OpenGlobus controls (Zoom, LayerSwitcher) added.");
        
                // --- Initialize Tile Cube Layer for OpenGlobus (from reference) ---
                tileCubeLayer = new og.layer.Vector("Tile Cube Indicator", {
                    'pickingEnabled': false
                });
                if (window.globus && window.globus.planet) {
                    window.globus.planet.addLayer(tileCubeLayer);
                    console.log("DEBUG: Created and added tileCubeLayer to OpenGlobus.");
                } else {
                    console.warn("DEBUG: Could not add tileCubeLayer, globus or planet not ready.");
                }
        
                setTimeout(() => {
                    if (window.globus && window.globus.planet) {
                        // Set terrain here, similar to the working version's timing
                        if (globusRgbTerrainInstance && typeof window.globus.planet.setTerrain === 'function') {
                            console.log("%cATTEMPTING EXPLICIT planet.setTerrain(globusRgbTerrainInstance) (delayed)...", "color: #FF8C00; font-weight: bold;");
                            window.globus.planet.setTerrain(globusRgbTerrainInstance);
                            console.log("DEBUG: After DELAYED explicit setTerrain, planet.terrain is:", window.globus.planet.terrain);
                        } else {
                            console.error("CRITICAL (delayed): globusRgbTerrainInstance is null or planet.setTerrain is not a function, cannot explicitly set terrain!");
                        }

                        // Then resize renderer
                        if (window.globus.planet.renderer && typeof window.globus.planet.renderer.resize === 'function') {
                            console.log("DEBUG: Performing initial resize of OpenGlobus renderer (after delayed terrain set).");
                            window.globus.planet.renderer.resize();
                        } else {
                            console.warn("DEBUG: Could not resize OpenGlobus renderer on init; renderer or resize method not ready.");
                        }
                    } else {
                         console.warn("DEBUG: Could not set terrain or resize OpenGlobus renderer on init; globus or planet not ready in setTimeout.");
                    }
                }, 200); // Keep the 200ms delay, can be adjusted if needed

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

            } else {
                console.error("%cERROR: window.globus exists, but window.globus.planet is NULL or UNDEFINED post-initialization! Cannot add layers or controls.", "color: red; font-weight: bold;");
            }
            console.log("OpenGlobus initialization sequence completed in JS.");
        } catch (e) {
            console.error("%cFATAL ERROR during OpenGlobus initialization (new og.Globe call or subsequent setup):", "color: red; font-size: 1.2em; font-weight: bold;", e);
            window.globus = null;
        }
    } // End function initializeOpenGlobus

    function handleGlobeClick(mouse, eventName) {
        console.log(`%cHANDLEGLOBECLICK: Event '${eventName}' received.`, "color: magenta; font-size: 1.1em; font-weight: bold;", "Mouse data:", mouse);

        if (eventName !== 'lclick') {
            console.log("HANDLEGLOBECLICK: Not an lclick event, ignoring for selection.");
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

        const viewpoint = window.globus.planet.getViewpoint();
        if (!viewpoint) {
            console.warn("HANDLEGLOBECLICK: Could not get viewpoint from globe.");
            return;
        }
        const cameraZoom = Math.round(viewpoint.zoom);
        console.log(`HANDLEGLOBECLICK: Globe camera zoom level: ${cameraZoom}`);

        const lonLat = mouse.lonLat;
        if (!lonLat) {
            console.warn("HANDLEGLOBECLICK: mouse.lonLat is undefined from globe click. Cannot determine tile.");
            return;
        }
        console.log(`HANDLEGLOBECLICK: Clicked LonLat: ${lonLat.lon.toFixed(6)}, ${lonLat.lat.toFixed(6)}`);

        try {
            const mapCoordsEPSG3857 = ol.proj.fromLonLat([lonLat.lon, lonLat.lat]);
            console.log(`HANDLEGLOBECLICK: Transformed to EPSG:3857: ${mapCoordsEPSG3857[0].toFixed(2)}, ${mapCoordsEPSG3857[1].toFixed(2)}`);

            const tileCoord = selectionTileGrid.getTileCoordForCoordAndZ(mapCoordsEPSG3857, TILE_SELECTION_ZOOM);

            if (tileCoord) {
                 console.log(`HANDLEGLOBECLICK: Calculated OL TileCoord for ZL${TILE_SELECTION_ZOOM}: Z=${tileCoord[0]}, X=${tileCoord[1]}, Y=${tileCoord[2]}`);
                 toggleTileSelection(tileCoord); // This now also calls ogSavedTilesetsLayer.redraw()
                 
                 const tileId = getTileId(tileCoord);
                 const targetLayer = window.userLayers[window.selectedLayerId]?.layer;
                 if (targetLayer) {
                     const source = targetLayer.getSource();
                     const featuresAtTile = source.getFeatures().filter(f => f.get('tileId') === tileId && f.get('tilesetGroupId'));
                     if (featuresAtTile.length > 0) {
                         const clickedFeature = featuresAtTile[0];
                         const groupId = clickedFeature.get('tilesetGroupId');
                         console.log(`HANDLEGLOBECLICK: Clicked tile ${tileId} is part of saved group ${groupId}. Opening details and zooming.`);
                         openTilesetDetailsModal(clickedFeature);
                         // Do not call zoomToTilesetGroup here if the globe click itself is for selection,
                         // as it might fight with the user's current globe view.
                         // Zooming should primarily happen when selecting from the list or map's saved feature click.
                     } else {
                         console.log(`HANDLEGLOBECLICK: Clicked tile ${tileId} is not part of a saved group or no group ID found.`);
                     }
                 }
            } else {
                 console.warn("HANDLEGLOBECLICK: Could not calculate tileCoord from clicked location for ZL" + TILE_SELECTION_ZOOM);
            }
        } catch (e) {
            console.error("HANDLEGLOBECLICK: Error during tile coordinate conversion or selection toggle:", e);
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
        'assets-btn': document.getElementById('assets-panel')
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
        Object.values(viewToggleButtons).forEach(panel => {
            if (panel) makeDraggable(panel);
        });
        controlPanels.forEach(panel => {
            if (panel) makeDraggable(panel);
        });
        console.log("DEBUG: Draggable behavior applied to panels.");
    }

    Object.keys(viewToggleButtons).forEach(btnId => {
        const button = document.getElementById(btnId);
        const panel = viewToggleButtons[btnId];
        if (button && panel) {
            button.addEventListener('click', function() {
                const isActive = this.classList.contains('active');
                
                if (mainViewPanels.includes(panel)) {
                    // Handle main view panels (map and globe) - they replace each other
                    mainViewPanels.forEach(p => {
                        if (p !== panel) {
                            p.style.display = 'none';
                            const bId = p.id.replace('-panel', '-btn');
                            document.getElementById(bId)?.classList.remove('active');
                        }
                    });
                    
                    // Toggle this panel
                    if (isActive && panel.style.display === 'block') {
                        this.classList.remove('active');
                        panel.style.display = 'none';
                    } else {
                        this.classList.add('active');
                        panel.style.display = 'block';
                    }
                } else if (overlayPanels.includes(panel)) {
                    // Handle overlay panels (social, profile, xr) - they toggle independently
                    // without affecting map/globe visibility
                    this.classList.toggle('active');
                    panel.style.display = this.classList.contains('active') ? 'block' : 'none';
                    
                    console.log(`Toggled ${panel.id}: ${panel.style.display}`);
                } else {
                    // Handle other control panels
                    this.classList.toggle('active');
                    panel.style.display = this.classList.contains('active') ? 'block' : 'none';
                }

                if (panel.id === 'globe-panel' && panel.style.display === 'block' && window.globus && window.globus.planet && window.globus.planet.renderer) {
                     setTimeout(() => {
                        if (window.globus && window.globus.planet && window.globus.planet.renderer && typeof window.globus.planet.renderer.resize === 'function') {
                            window.globus.planet.renderer.resize();
                        }
                     }, 50);
                }
            });
        }
    });
    // document.getElementById('map-panel').style.display = 'none'; // Keep map panel visible
    // document.getElementById('map-view-btn').classList.remove('active'); // Keep map button active
    document.getElementById('globe-view-btn').classList.add('active'); // Ensure globe button is active
    document.getElementById('globe-panel').style.display = 'block';
    console.log("DEBUG: Default panel visibility set (globe active).");

    console.log("%cDEBUG: Right before calling initializeOpenGlobus()", "color: red; font-weight: bold;");
    initializeOpenGlobus(); 
    console.log("%cDEBUG: Right after calling initializeOpenGlobus()", "color: red; font-weight: bold;");
    applyDraggableToAllPanels();
    
    function flyToStatueOfLiberty() {
        console.log("%cflyToStatueOfLiberty function called", "color: magenta; font-weight: bold;");
        if (window.globus && window.globus.planet && window.globus.planet.camera) {
            console.log("Attempting to fly to Statue of Liberty: Lon -74.0445, Lat 40.6892, Alt 500");
            const lon = -74.0445;
            const lat = 40.6892;
            const alt = 500; 
            
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
        if (gridLayerOG) {
            gridLayerOG.setVisibility(isVisible); 
            console.log(`DEBUG: Grid layer visibility set to ${isVisible}`);
        } else {
            console.warn("DEBUG: gridLayerOG not initialized, cannot apply grid settings.");
        }
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

        // Programmatic test: Fly to Statue of Liberty and select a tile
        console.log("%cPROGRAMMATIC TEST: Initiating flyToStatueOfLiberty...", "color: #FFD700; font-weight: bold;");
        if (window.globus && window.globus.planet) {
            flyToStatueOfLiberty();

            setTimeout(() => {
                console.log("%cPROGRAMMATIC TEST: Attempting to select tile at Statue of Liberty after camera flight.", "color: #FFD700; font-weight: bold;");
                if (typeof og !== 'undefined' && og.mercator && window.globus && window.globus.planet) {
                    const STATUE_OF_LIBERTY_LON = -74.0445;
                    const STATUE_OF_LIBERTY_LAT = 40.6892;
                    
                    try {
                        // const tileCoordsArr = og.mercator.lonLatToTile(new og.LonLat(STATUE_OF_LIBERTY_LON, STATUE_OF_LIBERTY_LAT), TILE_SELECTION_ZOOM); // Original
                        const lonLatSoL = new og.LonLat(STATUE_OF_LIBERTY_LON, STATUE_OF_LIBERTY_LAT);
                        const tileXSoL = og.mercator.getTileX(lonLatSoL.lon, TILE_SELECTION_ZOOM);
                        const tileYSoL = og.mercator.getTileY(lonLatSoL.lat, TILE_SELECTION_ZOOM);
                        const tileZSoL = TILE_SELECTION_ZOOM;
                        const tileCoordsArr = [tileXSoL, tileYSoL, tileZSoL]; // Simulate original array structure
                        if (tileCoordsArr && tileCoordsArr.length === 3) {
                            const targetTile = { z: tileCoordsArr[2], x: tileCoordsArr[0], y: tileCoordsArr[1] };
                            
                            // Ensure it's not already selected (though unlikely for a fresh load programmatic selection)
                            const existingIndex = selectedGlobeTiles.findIndex(
                                t => t.x === targetTile.x && t.y === targetTile.y && t.z === targetTile.z
                            );

                            if (existingIndex === -1) {
                                selectedGlobeTiles.push(targetTile);
                                console.log(`%cPROGRAMMATIC TEST: Selected Z${TILE_SELECTION_ZOOM} tile at Statue of Liberty: X:${targetTile.x}, Y:${targetTile.y}. Total selected: ${selectedGlobeTiles.length}`, "color: #00FF00; font-weight: bold;");
                            } else {
                                console.log(`%cPROGRAMMATIC TEST: Tile at Statue of Liberty was already selected. X:${targetTile.x}, Y:${targetTile.y}`, "color: #FFFF00;");
                            }

                            if (gridLayerOG) {
                                gridLayerOG.clear(); // This will trigger a redraw with the new selection
                                console.log("PROGRAMMATIC TEST: gridLayerOG cleared to reflect selection.");
                            } else {
                                console.warn("PROGRAMMATIC TEST: gridLayerOG is null, cannot refresh to show selection.");
                            }
                        } else {
                            console.error("PROGRAMMATIC TEST: og.mercator.lonLatToTile did not return valid coordinates for Statue of Liberty.", tileCoordsArr);
                        }
                    } catch (e) {
                        console.error("PROGRAMMATIC TEST: Error during tile conversion or selection for Statue of Liberty:", e);
                    }
                } else {
                    console.error("PROGRAMMATIC TEST: OpenGlobus (og, og.mercator, window.globus.planet) not fully available for tile selection.");
                }
            }, 3000); // Delay to allow camera to fly
        } else {
            console.error("PROGRAMMATIC TEST: Globe not ready, cannot fly to Statue of Liberty or select tile.");
        }

    }, 1000);
            

    console.log("DEBUG: End of DOMContentLoaded listener.");

    // Initialize maps after DOM is ready
    initializeOpenGlobus();
    initializeOpenLayersMap(); // Call to initialize OpenLayers map

    function createTestTileset() {
        console.log("Attempting to create test tileset...");
        if (!window.olMap || !selectionSource || !selectionTileGrid || !window.userLayers || !layer0Id || !saveSelectionBtn) {
            console.warn("createTestTileset: Prerequisites not met. Cannot create test tileset.");
            return;
        }

        const testTileCoord = [21, 617234, 788670]; // From user image Z, X, Y
        const testTileId = getTileId(testTileCoord);
        const testTilesetName = "Test Single Tile";

        // Ensure Layer 0 is selected
        if (window.selectedLayerId !== layer0Id) {
            selectLayerInList(layer0Id);
        }
        
        const targetSource = window.userLayers[layer0Id].layer.getSource();
        const existingFeaturesInLayer = targetSource.getFeatures();
        const isTileSaved = existingFeaturesInLayer.some(f => f.get('tileId') === testTileId && f.get('tilesetName') === testTilesetName);

        if (isTileSaved) {
            console.log(`Test tileset "${testTilesetName}" with tile ID ${testTileId} already exists.`);
            // Optionally, select it and open details for testing
            const existingFeature = existingFeaturesInLayer.find(f => f.get('tileId') === testTileId && f.get('tilesetName') === testTilesetName);
            if (existingFeature) {
                const groupId = existingFeature.get('tilesetGroupId');
                if (groupId) {
                    console.log(`Found existing test tileset, opening details for group ${groupId}`);
                    openTilesetDetailsModal(existingFeature);
                    zoomToTilesetGroup(groupId);
                }
            }
            return;
        }

        console.log(`Creating test tileset: "${testTilesetName}" with tile ${testTileId}`);

        // Temporarily add the tile to selectionSource to use the saveSelectionBtn logic
        selectionSource.clear(); // Clear any current selection
        const tileExtent = selectionTileGrid.getTileCoordExtent(testTileCoord);
        const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
        newFeature.setId(testTileId);
        newFeature.set('isIndividualSelection', true);
        selectionSource.addFeature(newFeature);

        // Set the name for the tileset to be saved
        if (tilesetNameInput) {
            tilesetNameInput.value = testTilesetName;
        } else {
            console.warn("createTestTileset: tilesetNameInput not found. Cannot set name for programmatic save.");
            selectionSource.clear(); // Clean up
            return;
        }
        
        // Simulate save button click
        console.log("createTestTileset: Simulating saveSelectionBtn click.");
        saveSelectionBtn.click(); // This will use current color picker values

        // Clear selection and input after programmatic save
        selectionSource.clear();
        if (tilesetNameInput) tilesetNameInput.value = '';
        console.log("Test tileset created and saved.");

        // Optionally, immediately select and zoom to the newly created test tileset
        // Need to find its groupId after saving. This might require a slight delay or a callback.
        setTimeout(() => {
            const savedTestFeature = targetSource.getFeatures().find(f => f.get('tileId') === testTileId && f.get('tilesetName') === testTilesetName);
            if (savedTestFeature) {
                const groupId = savedTestFeature.get('tilesetGroupId');
                if (groupId) {
                    console.log(`Selecting and zooming to newly created test tileset, group ID: ${groupId}`);
                    openTilesetDetailsModal(savedTestFeature);
                    zoomToTilesetGroup(groupId);
                }
            }
        }, 500); // Delay to allow save operation to complete and list to populate
    }

    // Call after maps are initialized and DOM is fully ready
    setTimeout(createTestTileset, 2000); // Delay to ensure everything else is set up

}); // End of DOMContentLoaded
