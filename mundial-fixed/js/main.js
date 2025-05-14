console.log("%cMAIN.JS SCRIPT EXECUTION STARTED - VERY TOP LINE", "color: green; font-size: 1.5em; font-weight: bold;");
console.log("GLOBAL SCOPE: JavaScript is running in main.js");

// Global variables
window.globus = null;
window.olMap = null;
const TILE_SELECTION_ZOOM = 21;
const GRID_VISIBILITY_MIN_ZOOM = 16;
let gridLayerZ21 = null;        // OL 2D grid
let selectionTileGrid = null;   // OL tile grid for selection logic
let selectionSource = null;     // Source for temporary tile selections (from mundial/js/main.js)
let selectionLayer = null;      // Layer for temporary tile selections (from mundial/js/main.js)
let highlightSource = null;     // For highlighting features
let highlightLayer = null;      // For highlighting features
let layer0Source = null;        // Source for user's saved Layer 0 tilesets on OL map
let layer0Layer = null;         // Layer for user's saved Layer 0 tilesets on OL map
let dragPanInteraction = null;  // Default OL pan
let dragBoxInteraction = null;  // OL drag box for tile selection (from mundial/js/main.js)
let ogSavedTilesetsLayer = null;// OpenGlobus layer for saved tilesets (from mundial5-13)
let gridLayerOG = null;         // OpenGlobus grid layer (from mundial5-13)

window.userLayers = window.userLayers || {};
window.selectedLayerId = window.selectedLayerId || 'layer-0'; // Default to layer-0
let currentInteractionMode = 'pan'; // For OL map: 'pan' or 'tileSelect' (from mundial/js/main.js)

document.addEventListener('DOMContentLoaded', () => {
    // Set OpenGlobus resource path immediately.
    if (typeof og !== 'undefined') {
        og.RESOURCES_PATH = "/packages/openglobus/res/";
        console.log("DEBUG: OpenGlobus RESOURCES_PATH set to:", og.RESOURCES_PATH);
    } else {
        console.warn("DEBUG: OpenGlobus (og) object not defined when trying to set RESOURCES_PATH.");
    }

    console.log("DEBUG: DOMContentLoaded entered");

    // --- UI Element References ---
    // (Assuming these are consistent with mundial-fixed/index.html)
    const settingStartLonInput = document.getElementById('setting-start-lon');
    const settingStartLatInput = document.getElementById('setting-start-lat');
    const settingStartZoomInput = document.getElementById('setting-start-zoom');
    const settingSetStartLocationBtn = document.getElementById('setting-set-start-location-btn');
    const settingGridVisibleCheckbox = document.getElementById('setting-grid-visible');
    const settingGridWeightInput = document.getElementById('setting-grid-weight');
    const baseLayerSelectOL = document.getElementById('base-layer-select');
    const customLayerInputsDiv = document.getElementById('custom-layer-inputs');
    const customLayerNameInput = document.getElementById('custom-layer-name');
    const customLayerUrlInput = document.getElementById('custom-layer-url');
    const addCustomLayerBtn = document.getElementById('add-custom-layer-btn');
    const userLayerList = document.getElementById('user-layer-list');
    const createLayerBtn = document.getElementById('create-layer-btn');
    const tilesetListDiv = document.getElementById('tileset-list');
    const selectionActionsDiv = document.getElementById('selection-actions');
    const interactionModeBtn = document.getElementById('interaction-mode-btn');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const saveSelectionBtn = document.getElementById('save-selection-btn');
    const tilesetNameInput = document.getElementById('tileset-name-input');
    const selectedTileCountDisplay = document.getElementById('selected-tile-count-display');
    const tilesetDetailsModal = document.getElementById('tileset-details-modal');
    const closeTilesetDetailsModalBtn = document.getElementById('close-tileset-details-modal');
    const detailsTilesetNameInput = document.getElementById('details-tileset-name');
    const detailsTilesetCoordsSpan = document.getElementById('details-tileset-coords');
    const detailsTilesetImage = document.getElementById('details-tileset-image');
    const detailsTilesetImageUrlInput = document.getElementById('details-tileset-image-url');
    const detailsTilesetLinkInput = document.getElementById('details-tileset-link');
    const detailsTilesetTagsTextarea = document.getElementById('details-tileset-tags');
    const detailsColorPicker = document.getElementById('details-color-picker');
    const detailsTilesetTileCount = document.getElementById('details-tileset-tile-count');
    const detailsLocationInfoSpan = document.getElementById('details-location-info');
    const socialBtn = document.getElementById('social-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const globeViewBtn = document.getElementById('globe-view-btn');
    const layersBtn = document.getElementById('layers-btn');
    const profileBtn = document.getElementById('profile-btn');
    const xrViewBtn = document.getElementById('xr-view-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const assetsBtn = document.getElementById('assets-btn');
    const socialPanel = document.getElementById('social-panel');
    const mapPanelOL = document.getElementById('map-panel');
    const globePanelOG = document.getElementById('globe-panel');
    const layerSwitcherPanelOL = document.getElementById('layer-switcher');
    const profilePanel = document.getElementById('profile-panel');
    const xrPanel = document.getElementById('xr-panel');
    const settingsPanel = document.getElementById('settings-panel');
    const assetsPanel = document.getElementById('assets-panel');
    const appControlsPanel = document.getElementById('app-controls'); // Added for completeness

    // --- Draggable Panels (from mundial5-13) ---
    function makeDraggable(elmnt) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const dragHandle = elmnt.querySelector('.panel-header') || elmnt.querySelector('h2') || elmnt;
      if (dragHandle) { dragHandle.style.cursor = 'move'; dragHandle.onmousedown = dragMouseDown; } 
      else { elmnt.style.cursor = 'move'; elmnt.onmousedown = dragMouseDown; }
      function dragMouseDown(e) { e = e || window.event; e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; }
      function elementDrag(e) { e = e || window.event; e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; const newTop = Math.max(0, Math.min(window.innerHeight - elmnt.offsetHeight, elmnt.offsetTop - pos2)); const newLeft = Math.max(0, Math.min(window.innerWidth - elmnt.offsetWidth, elmnt.offsetLeft - pos1)); elmnt.style.top = newTop + "px"; elmnt.style.left = newLeft + "px"; elmnt.style.bottom = ''; elmnt.style.right = ''; }
      function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
    }

    // --- Tile ID Helper ---
    function getTileId(tileCoord) { return `${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}`; }

    // --- Tile Selection Logic (FROM mundial/js/main.js) ---
    function toggleTileSelection(tileCoord) {
        if (!window.olMap || !selectionSource || !window.selectedLayerId || !window.userLayers || !selectionTileGrid) {
             console.warn("toggleTileSelection: Prerequisites not met."); return;
        }
        const tileId = getTileId(tileCoord);
        const existingFeature = selectionSource.getFeatureById(tileId);
        const targetLayer = window.userLayers[window.selectedLayerId]?.layer;
        if (!targetLayer || !targetLayer.getSource) { console.error("toggleTileSelection: Target layer invalid."); return; }
        const isTileSaved = targetLayer.getSource().getFeatures().some(f => f.get('tileId') === tileId && f.get('tilesetGroupId'));

        if (existingFeature) { // If in current selection, remove it
            selectionSource.removeFeature(existingFeature);
        } else if (!isTileSaved) { // If not saved and not in current selection, add it
            const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
            const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
            newFeature.setId(tileId); // Use tileId as feature ID for easy lookup
            newFeature.set('tileId', tileId); // Also store as property if needed elsewhere
            newFeature.set('isIndividualSelection', true);
            selectionSource.addFeature(newFeature);
        }
        updateSelectedTileCountDisplay();
    }

    function addTileToSelection(tileCoord) { // For drag-box selection
        if (!window.olMap || !selectionSource || !window.selectedLayerId || !window.userLayers || !selectionTileGrid) { return; }
        const tileId = getTileId(tileCoord);
        if (selectionSource.getFeatureById(tileId)) return; // Already in current selection
        const targetLayer = window.userLayers[window.selectedLayerId]?.layer;
        if (!targetLayer || !targetLayer.getSource) return;
        const isTileSaved = targetLayer.getSource().getFeatures().some(f => f.get('tileId') === tileId && f.get('tilesetGroupId'));
        if (isTileSaved) return; // Don't add if already saved

        const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
        const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
        newFeature.setId(tileId);
        newFeature.set('tileId', tileId);
        newFeature.set('isIndividualSelection', true);
        selectionSource.addFeature(newFeature);
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

    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', () => { if (selectionSource) selectionSource.clear(); });
    }

    // --- Style function for saved tilesets (from mundial5-13) ---
    function createTilesetStyle(feature) {
        const color = feature.get('color') || '#008080';
        const fillOpacity = feature.get('fillOpacity') === undefined ? 0.6 : feature.get('fillOpacity');
        const strokeWidth = feature.get('strokeWidth') === undefined ? 0.5 : feature.get('strokeWidth');
        let r = 0, g = 0, b = 0;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) { let c = color.substring(1).split(''); if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]]; c = '0x' + c.join(''); r = (c >> 16) & 255; g = (c >> 8) & 255; b = c & 255; }
        else if (color.startsWith('rgba')) { const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/); if (match) { r = parseInt(match[1]); g = parseInt(match[2]); b = parseInt(match[3]); }}
        const fillColorRgba = `rgba(${r},${g},${b},${fillOpacity})`;
        const strokeColorRgba = color.startsWith('rgba') ? `rgba(${r},${g},${b},1)` : color;
        return new ol.style.Style({ stroke: new ol.style.Stroke({ color: strokeColorRgba, width: strokeWidth }), fill: new ol.style.Fill({ color: fillColorRgba }) });
    }
    window.createTilesetStyle = createTilesetStyle;

    function updateFeatureStyle(feature) {
         if (!feature) return;
         if (feature.get('isVisible') !== false) { feature.setStyle(createTilesetStyle(feature)); } 
         else { feature.setStyle(null); }
    }
    window.updateFeatureStyle = updateFeatureStyle;

    // Save Selection Button (logic from mundial5-13, ensures styling and globe update)
    if (saveSelectionBtn && tilesetNameInput) {
        saveSelectionBtn.addEventListener('click', () => {
            if (!selectionSource || !window.selectedLayerId || !window.userLayers) { alert("Cannot save: components not ready."); return; }
            const selectedFeatures = selectionSource.getFeatures();
            if (selectedFeatures.length === 0) { alert("No tiles selected."); return; }
            const tilesetName = tilesetNameInput.value.trim() || `Tileset ${Date.now()}`;
            const targetLayer = window.userLayers[window.selectedLayerId]?.layer;
            if (!targetLayer || !targetLayer.getSource) { alert("Target layer invalid."); return; }
            const targetSource = targetLayer.getSource();
            const groupId = `group-${Date.now()}`;

            const featuresToAdd = selectedFeatures.map(feature => {
                const clone = feature.clone(); // Clone the geometry
                clone.setId(feature.getId()); // Retain tileId as main ID
                clone.set('tileId', feature.getId()); // Ensure tileId property is also set
                clone.set('tilesetGroupId', groupId);
                clone.set('tilesetName', tilesetName);
                clone.set('layerId', window.selectedLayerId);
                clone.set('isIndividualSelection', undefined); // No longer a temp selection
                clone.set('isVisible', true);
                clone.set('color', detailsColorPicker?.value || '#008080');
                clone.set('fillOpacity', 0.6); 
                clone.set('strokeWidth', 0.5);
                clone.setStyle(createTilesetStyle(clone));
                return clone;
            });
            targetSource.addFeatures(featuresToAdd);
            if(window.userLayers[window.selectedLayerId]) { window.userLayers[window.selectedLayerId].tilesetCount = (window.userLayers[window.selectedLayerId].tilesetCount || 0) + 1; }
            selectionSource.clear();
            tilesetNameInput.value = '';
            populateTilesetList(window.selectedLayerId);
            if (typeof populateGlobePolygonsForLayer === 'function') populateGlobePolygonsForLayer(window.selectedLayerId);
        });
    }

    // --- OL Map 2D Grid (from mundial5-13) ---
    function updateZ21GridOL() {
        if (!window.olMap || !gridLayerZ21 || !selectionTileGrid || !settingGridVisibleCheckbox || !settingGridWeightInput) return;
        const view = window.olMap.getView();
        const zoom = view.getZoom();
        const gridSource = gridLayerZ21.getSource();
        gridSource.clear();
        if (zoom >= GRID_VISIBILITY_MIN_ZOOM && settingGridVisibleCheckbox.checked) {
            gridLayerZ21.setVisible(true);
            gridLayerZ21.setStyle(new ol.style.Style({stroke: new ol.style.Stroke({color: 'rgba(0,0,0,1)', width: parseFloat(settingGridWeightInput.value) || 0.5 })}));
            const extent = view.calculateExtent(window.olMap.getSize());
            const gridFeatures = [];
            try { selectionTileGrid.forEachTileCoord(extent, TILE_SELECTION_ZOOM, tc => gridFeatures.push(new ol.Feature(ol.geom.Polygon.fromExtent(selectionTileGrid.getTileCoordExtent(tc))))); gridSource.addFeatures(gridFeatures); }
            catch (e) { console.error("Error in forEachTileCoord (updateZ21GridOL):", e); }
        } else { gridLayerZ21.setVisible(false); }
    }
    window.updateZ21GridOL = updateZ21GridOL;

    // --- OpenLayers Map Initialization ---
    function initializeOpenLayersMap() {
        if (typeof ol === 'undefined') { console.error("FATAL: OpenLayers (ol) NOT DEFINED."); return; }
        if (window.olMap) { console.warn("WARN: window.olMap already exists."); return; }
        const mapElement = document.getElementById('map');
        if (!mapElement) { console.error("FATAL: 'map' DIV not found."); return; }

        window.olMap = new ol.Map({
            target: 'map',
            layers: [ new ol.layer.Tile({ source: new ol.source.XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attributions: 'Tiles © ArcGIS'}), type: 'base' }) ],
            view: new ol.View({ center: ol.proj.fromLonLat([-74.0445, 40.6892]), zoom: 18, maxZoom: TILE_SELECTION_ZOOM + 1, minZoom: 0 }) // Allow slightly more zoom for selection
        });

        // OL 2D Grid (from mundial5-13)
        const gridSourceZ21 = new ol.source.Vector();
        gridLayerZ21 = new ol.layer.Vector({ source: gridSourceZ21, style: new ol.style.Style({stroke: new ol.style.Stroke({color: 'rgba(0,0,0,1)', width: 0.5})}), title: 'grid-z21', visible: false, zIndex: 1 });
        window.olMap.addLayer(gridLayerZ21);
        selectionTileGrid = ol.tilegrid.createXYZ({ maxZoom: TILE_SELECTION_ZOOM }); // Crucial for tile selection logic

        // Selection Layer for temporary selections (from mundial/js/main.js)
        selectionSource = new ol.source.Vector();
        const selectionStyle = new ol.style.Style({ fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.4)' }), stroke: new ol.style.Stroke({ color: 'rgba(200,200,200,0.8)', width: 1 }) });
        selectionLayer = new ol.layer.Vector({ source: selectionSource, style: selectionStyle, title: 'selection', zIndex: 3 });
        window.olMap.addLayer(selectionLayer);
        selectionSource.on('addfeature', updateSelectedTileCountDisplay);
        selectionSource.on('removefeature', updateSelectedTileCountDisplay);

        // Layer 0 for saved user tilesets (structure from mundial5-13)
        layer0Source = new ol.source.Vector();
        layer0Layer = new ol.layer.Vector({ source: layer0Source, style: createTilesetStyle, title: 'layer-0', zIndex: 2, visible: true });
        layer0Layer.set('userLayerName', 'Layer 0');
        window.userLayers['layer-0'] = { name: 'Layer 0', layer: layer0Layer, tilesetCount: 0 };
        window.olMap.addLayer(layer0Layer);

        // Map update and grid listeners
        setTimeout(() => { if (window.olMap && mapElement.offsetParent !== null) window.olMap.updateSize(); updateZ21GridOL(); }, 250);
        window.olMap.on('moveend', updateZ21GridOL);
        window.olMap.on('change:resolution', updateZ21GridOL);

        // --- Tile Selection Interactions (FROM mundial/js/main.js) ---
        window.olMap.getInteractions().forEach(interaction => { if (interaction instanceof ol.interaction.DragPan) dragPanInteraction = interaction; });

        const clickSelectHandler = function (evt) {
            if (!window.olMap || !selectionTileGrid) return;
            const currentZoom = window.olMap.getView().getZoom();
            if (currentZoom < GRID_VISIBILITY_MIN_ZOOM) { if (selectionSource) selectionSource.clear(); return; }
            const coordinate = evt.coordinate;
            let clickedSavedFeature = null;
            const pixel = window.olMap.getEventPixel(evt.originalEvent);
            const targetUserLayer = window.userLayers[window.selectedLayerId]?.layer;

            if (targetUserLayer) { // Check for click on a saved feature first
                window.olMap.forEachFeatureAtPixel(pixel, (feature, layer) => {
                    if (layer === targetUserLayer && feature.get('tilesetGroupId')) {
                        clickedSavedFeature = feature; return true; // Found a saved feature
                    } return false;
                }, { hitTolerance: 3 });
            }

            if (clickedSavedFeature) { // A saved tileset was clicked
                if (selectionSource) selectionSource.clear(); // Clear any temporary individual tile selection
                openTilesetDetailsModal(clickedSavedFeature); // Open details for the group
                // Optionally, highlight the group in selectionLayer
                const groupId = clickedSavedFeature.get('tilesetGroupId');
                const groupFeatures = targetUserLayer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
                const highlightClones = groupFeatures.map(f => { const c = f.clone(); c.set('isGroupSelection', true); return c; });
                selectionSource.addFeatures(highlightClones);
                return; 
            }

            if (currentInteractionMode === 'tileSelect') { // If no saved feature clicked, and in tileSelect mode
                const tileCoord = selectionTileGrid.getTileCoordForCoordAndZ(coordinate, TILE_SELECTION_ZOOM);
                toggleTileSelection(tileCoord);
            }
        };
        window.olMap.on('singleclick', clickSelectHandler);

        dragBoxInteraction = new ol.interaction.DragBox({ condition: ol.events.condition.platformModifierKeyOnly });
        window.olMap.addInteraction(dragBoxInteraction);
        dragBoxInteraction.on('boxend', function() {
            if (currentInteractionMode !== 'tileSelect' || !selectionTileGrid) return;
            const boxExtent = dragBoxInteraction.getGeometry().getExtent();
            selectionTileGrid.forEachTileCoord(boxExtent, TILE_SELECTION_ZOOM, tileCoord => addTileToSelection(tileCoord));
        });
        dragBoxInteraction.setActive(false); // Start with pan mode active

        // Interaction Mode UI (from mundial/js/main.js)
        function updateInteractionModeUI(mode) {
            if (!interactionModeBtn) return;
            if (mode === 'pan') {
                interactionModeBtn.textContent = "Mode: Pan Map";
                if (window.olMap) window.olMap.getViewport().style.cursor = 'grab';
                if (dragPanInteraction) dragPanInteraction.setActive(true);
                if (dragBoxInteraction) dragBoxInteraction.setActive(false);
            } else if (mode === 'tileSelect') {
                interactionModeBtn.textContent = "Mode: Select Tiles";
                if (window.olMap) window.olMap.getViewport().style.cursor = 'crosshair';
                if (dragPanInteraction) dragPanInteraction.setActive(false);
                if (dragBoxInteraction) dragBoxInteraction.setActive(true);
            }
        }
        window.updateInteractionModeUI = updateInteractionModeUI; // Make global for event listener

        if (interactionModeBtn) {
            interactionModeBtn.addEventListener('click', () => {
                currentInteractionMode = currentInteractionMode === 'pan' ? 'tileSelect' : 'pan';
                updateInteractionModeUI(currentInteractionMode);
                if (currentInteractionMode === 'pan' && selectionSource) selectionSource.clear(); // Clear selection when switching to pan
            });
        }
        updateInteractionModeUI(currentInteractionMode); // Set initial UI
    } // End initializeOpenLayersMap

    // --- Layer and Tileset UI Functions (from mundial5-13) ---
    // (addLayerToList, selectLayerInList, editLayerName, deleteLayer, populateTilesetList, etc.)
    // These are largely from mundial5-13, adapted slightly for consistency
    function addLayerToList(layerId, layerName, isVisible = true) {
        if (!userLayerList) return;
        if (userLayerList.querySelector('small')) userLayerList.innerHTML = '';
        const layerDiv = document.createElement('div'); layerDiv.className = 'layer-item'; layerDiv.dataset.layerId = layerId;
        const selInd = document.createElement('span'); selInd.className = 'selection-indicator'; selInd.innerHTML = (window.selectedLayerId === layerId) ? '✓' : ''; layerDiv.appendChild(selInd);
        const visBtn = document.createElement('button'); visBtn.className = 'visibility-btn'; visBtn.innerHTML = isVisible ? '👁️' : '👁️‍🗨️'; visBtn.title = isVisible ? 'Hide' : 'Show';
        visBtn.addEventListener('click', (e) => { e.stopPropagation(); const l = window.userLayers[layerId]?.layer; if(l){ l.setVisible(!l.getVisible()); visBtn.innerHTML = l.getVisible() ? '👁️' : '👁️‍🗨️'; if(window.ogSavedTilesetsLayer) populateGlobePolygonsForLayer(layerId);}});
        layerDiv.appendChild(visBtn);
        const nameSpan = document.createElement('span'); nameSpan.textContent = layerName; nameSpan.title = "Select/Dbl-Click Rename"; nameSpan.addEventListener('click', () => selectLayerInList(layerId)); nameSpan.addEventListener('dblclick', () => editLayerName(layerId, nameSpan)); layerDiv.appendChild(nameSpan);
        const btnCont = document.createElement('div'); btnCont.className = 'button-container';
        const renBtn = document.createElement('button'); renBtn.textContent = '✏️'; renBtn.title = 'Rename'; renBtn.className = 'settings-btn-small'; renBtn.addEventListener('click', (e) => { e.stopPropagation(); editLayerName(layerId, nameSpan); }); btnCont.appendChild(renBtn);
        if (layerId !== 'layer-0') { const delBtn = document.createElement('button'); delBtn.textContent = '🗑️'; delBtn.title = 'Delete'; delBtn.className = 'settings-btn-small'; delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteLayer(layerId); }); btnCont.appendChild(delBtn); }
        layerDiv.appendChild(btnCont); userLayerList.appendChild(layerDiv);
    }

    function selectLayerInList(layerId) {
        if (!userLayerList) return;
        userLayerList.querySelectorAll('.layer-item').forEach(item => { const isSel = item.dataset.layerId === layerId; item.classList.toggle('selected', isSel); const ind = item.querySelector('.selection-indicator'); if(ind) ind.innerHTML = isSel ? '✓' : ''; });
        window.selectedLayerId = layerId;
        populateTilesetList(layerId);
        if (selectionSource) selectionSource.clear(); // Clear temp selection
    }

    function editLayerName(layerId, nameSpan) { /* ... from mundial5-13, adapted ... */ 
        const currentName = nameSpan.textContent; const input = document.createElement('input'); input.type = 'text'; input.value = currentName; input.style.width = '100%';
        const submit = () => { const newName = input.value.trim(); if (newName && newName !== currentName) { window.userLayers[layerId].name = newName; window.userLayers[layerId].layer.set('userLayerName', newName); } nameSpan.textContent = window.userLayers[layerId].name; if(input.parentNode) input.parentNode.replaceChild(nameSpan, input); nameSpan.style.display = ''; };
        input.addEventListener('blur', submit); input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); else if (e.key === 'Escape') { if(input.parentNode) input.parentNode.replaceChild(nameSpan, input); nameSpan.style.display = ''; }});
        nameSpan.style.display = 'none'; nameSpan.parentNode.insertBefore(input, nameSpan); input.focus(); input.select();
    }

    function deleteLayer(layerId) { /* ... from mundial5-13, adapted ... */
        if (!window.userLayers[layerId] || layerId === 'layer-0') return; if (!confirm(`Delete "${window.userLayers[layerId].name}"?`)) return;
        window.olMap.removeLayer(window.userLayers[layerId].layer);
        if (window.ogSavedTilesetsLayer) { const entities = window.ogSavedTilesetsLayer.getEntities().filter(e => e.properties.layerId === layerId); entities.forEach(e => window.ogSavedTilesetsLayer.removeEntity(e)); window.ogSavedTilesetsLayer.redraw(); }
        delete window.userLayers[layerId]; if (window.selectedLayerId === layerId) window.selectedLayerId = 'layer-0';
        const item = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`); if (item) item.remove(); if (userLayerList.children.length === 0) userLayerList.innerHTML = '<small><i>No layers.</i></small>';
        selectLayerInList(window.selectedLayerId);
    }

    if (createLayerBtn) { /* ... from mundial5-13, adapted ... */
        createLayerBtn.addEventListener('click', () => { const name = prompt("New layer name:", `Layer ${Object.keys(window.userLayers).length}`); if (!name) return; const id = `layer-${Date.now()}`; const source = new ol.source.Vector(); const layer = new ol.layer.Vector({source: source, style: createTilesetStyle, title: id, zIndex: 2, visible: true}); layer.set('userLayerName', name); window.userLayers[id] = {name: name, layer: layer, tilesetCount: 0}; window.olMap.addLayer(layer); addLayerToList(id, name); selectLayerInList(id); });
    }

    function populateTilesetList(layerId) { /* ... from mundial5-13, adapted ... */
        if (!tilesetListDiv || !window.userLayers[layerId]) return;
        const source = window.userLayers[layerId].layer.getSource(); const features = source.getFeatures(); const tilesets = {};
        features.forEach(f => { const gid = f.get('tilesetGroupId'); if (gid) { if (!tilesets[gid]) tilesets[gid] = {name: f.get('tilesetName'), count:0, isVis: f.get('isVisible')!==false, repFeat: f}; tilesets[gid].count++; }});
        tilesetListDiv.innerHTML = Object.keys(tilesets).length === 0 ? '<small><i>No tilesets.</i></small>' : '';
        Object.entries(tilesets).forEach(([gid, ts]) => {
            const item = document.createElement('div'); item.className = 'tileset-item'; item.dataset.groupId = gid;
            const chk = document.createElement('input'); chk.type='checkbox'; chk.checked=ts.isVis; chk.addEventListener('change', ()=>toggleTilesetGroupVisibility(gid, chk.checked)); item.appendChild(chk);
            const span = document.createElement('span'); span.textContent=`${ts.name} (${ts.count})`; span.title="Zoom/Fly"; span.addEventListener('click', ()=>{zoomToTilesetGroup(gid); flyToTilesetGroupInGlobe(gid); highlightListItem(gid);}); item.appendChild(span);
            const btns = document.createElement('div'); btns.className='button-container';
            const edit = document.createElement('button'); edit.textContent='✏️'; edit.className='settings-btn-small'; edit.addEventListener('click', ()=>openTilesetDetailsModal(ts.repFeat)); btns.appendChild(edit);
            const del = document.createElement('button'); del.textContent='🗑️'; del.className='settings-btn-small'; del.addEventListener('click', ()=>deleteTilesetGroup(gid)); btns.appendChild(del);
            item.appendChild(btns); tilesetListDiv.appendChild(item);
        });
    }
    function highlightListItem(gid) { tilesetListDiv.querySelectorAll('.tileset-item').forEach(i => i.classList.toggle('highlighted', i.dataset.groupId === gid)); }
    function flyToTilesetGroupInGlobe(gid) { /* ... from mundial5-13, adapted for current structure ... */
        if (!window.globus || !window.userLayers[window.selectedLayerId]) return;
        const features = window.userLayers[window.selectedLayerId].layer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === gid);
        if (features.length === 0) return;
        const ext = ol.extent.createEmpty(); features.forEach(f => ol.extent.extend(ext, f.getGeometry().getExtent()));
        const centerLL = ol.proj.toLonLat(ol.extent.getCenter(ext));
        const viewZoom = window.olMap ? window.olMap.getView().getZoom() : 18;
        const alt = 20000000 / Math.pow(2, viewZoom); // Rough altitude
        window.globus.planet.flyTo(new og.LonLat(centerLL[0], centerLL[1], alt > 500 ? alt : 500), {duration:1.5});
     }
    function zoomToTilesetGroup(gid) { /* ... from mundial5-13, adapted ... */
        if (!window.olMap || !window.userLayers[window.selectedLayerId]) return;
        const features = window.userLayers[window.selectedLayerId].layer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === gid);
        if (features.length === 0) return;
        const ext = ol.extent.createEmpty(); features.forEach(f => ol.extent.extend(ext, f.getGeometry().getExtent()));
        window.olMap.getView().fit(ext, {padding:[50,50,50,50], duration:1000, maxZoom: TILE_SELECTION_ZOOM});
    }
    function toggleTilesetGroupVisibility(gid, isVis) { /* ... from mundial5-13, adapted ... */
        if (!window.userLayers[window.selectedLayerId]) return;
        const features = window.userLayers[window.selectedLayerId].layer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === gid);
        features.forEach(f => { f.set('isVisible', isVis); updateFeatureStyle(f); });
        if (window.ogSavedTilesetsLayer) populateGlobePolygonsForLayer(window.selectedLayerId);
    }
    function deleteTilesetGroup(gid) { /* ... from mundial5-13, adapted ... */
        if (!window.userLayers[window.selectedLayerId] || !confirm("Delete tileset group?")) return;
        const source = window.userLayers[window.selectedLayerId].layer.getSource();
        source.getFeatures().filter(f => f.get('tilesetGroupId') === gid).forEach(f => source.removeFeature(f));
        populateTilesetList(window.selectedLayerId);
        if (window.ogSavedTilesetsLayer) populateGlobePolygonsForLayer(window.selectedLayerId);
    }
    function openTilesetDetailsModal(feat) { /* ... from mundial5-13, adapted ... */
        if (!tilesetDetailsModal || !feat) return; const gid = feat.get('tilesetGroupId'); if (!gid) return;
        tilesetDetailsModal.dataset.groupId = gid; // Store for save
        detailsTilesetNameInput.value = feat.get('tilesetName') || ''; detailsColorPicker.value = feat.get('color') || '#008080';
        detailsTilesetLinkInput.value = feat.get('link') || ''; detailsTilesetImageUrlInput.value = feat.get('imageUrl') || '';
        detailsTilesetTagsTextarea.value = feat.get('tags') || '';
        const groupFeats = window.userLayers[window.selectedLayerId]?.layer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === gid);
        if (detailsTilesetTileCount && groupFeats) detailsTilesetTileCount.textContent = groupFeats.length;
        if (groupFeats && groupFeats.length > 0 && detailsTilesetCoordsSpan) { const ext = ol.extent.createEmpty(); groupFeats.forEach(f=>ol.extent.extend(ext, f.getGeometry().getExtent())); const minLL = ol.proj.toLonLat(ol.extent.getBottomLeft(ext)); const maxLL = ol.proj.toLonLat(ol.extent.getTopRight(ext)); detailsTilesetCoordsSpan.textContent = `Min:${minLL[0].toFixed(3)},${minLL[1].toFixed(3)} Max:${maxLL[0].toFixed(3)},${maxLL[1].toFixed(3)}`;}
        if (detailsTilesetImage) { const url = feat.get('imageUrl'); detailsTilesetImage.src = url || ''; detailsTilesetImage.style.display = url ? 'block' : 'none';}
        if (detailsLocationInfoSpan) detailsLocationInfoSpan.textContent = "N/A"; // Placeholder
        tilesetDetailsModal.style.display = 'block'; makeDraggable(tilesetDetailsModal); highlightListItem(gid);
    }
    function applyGroupPropertyChange(prop, val, skipStyleUpd = false) { /* ... from mundial5-13, adapted ... */
        const gid = tilesetDetailsModal.dataset.groupId; if (!gid || !window.userLayers[window.selectedLayerId]) return;
        const feats = window.userLayers[window.selectedLayerId].layer.getSource().getFeatures().filter(f => f.get('tilesetGroupId') === gid);
        feats.forEach(f => { f.set(prop, val); if (!skipStyleUpd) updateFeatureStyle(f); });
        if (window.ogSavedTilesetsLayer && !skipStyleUpd) populateGlobePolygonsForLayer(window.selectedLayerId);
        if (prop === 'tilesetName') populateTilesetList(window.selectedLayerId);
    }
    if (closeTilesetDetailsModalBtn) closeTilesetDetailsModalBtn.addEventListener('click', () => tilesetDetailsModal.style.display = 'none');
    if (detailsTilesetNameInput) detailsTilesetNameInput.addEventListener('change', () => applyGroupPropertyChange('tilesetName', detailsTilesetNameInput.value));
    if (detailsColorPicker) detailsColorPicker.addEventListener('input', () => applyGroupPropertyChange('color', detailsColorPicker.value));
    if (detailsTilesetLinkInput) detailsTilesetLinkInput.addEventListener('change', () => applyGroupPropertyChange('link', detailsTilesetLinkInput.value, true));
    if (detailsTilesetImageUrlInput) detailsTilesetImageUrlInput.addEventListener('change', () => { const url = detailsTilesetImageUrlInput.value; applyGroupPropertyChange('imageUrl', url, true); if (detailsTilesetImage) { detailsTilesetImage.src = url || ''; detailsTilesetImage.style.display = url ? 'block' : 'none';}});
    if (detailsTilesetTagsTextarea) detailsTilesetTagsTextarea.addEventListener('change', () => applyGroupPropertyChange('tags', detailsTilesetTagsTextarea.value, true));

    // --- Globe Polygon Visualization (from mundial5-13) ---
    function populateGlobePolygonsForLayer(layerId) {
        if (!window.globus || !window.userLayers[layerId] || !window.ogSavedTilesetsLayer) return;
        const existing = window.ogSavedTilesetsLayer.getEntities().filter(e => e.properties.layerId === layerId);
        existing.forEach(e => window.ogSavedTilesetsLayer.removeEntity(e));
        const features = window.userLayers[layerId].layer.getSource().getFeatures().filter(f => f.get('isVisible') !== false && f.get('tilesetGroupId'));
        features.forEach(f => {
            const ext = f.getGeometry().getExtent(); const bl = ol.proj.toLonLat([ext[0],ext[1]]); const tr = ol.proj.toLonLat([ext[2],ext[3]]);
            const coords = [[bl[0],bl[1]], [bl[0],tr[1]], [tr[0],tr[1]], [tr[0],bl[1]]];
            const color = f.get('color') || '#008080'; const opac = f.get('fillOpacity') || 0.6;
            const ent = new og.Entity({ polygon: { coordinates: [coords], style: { fillColor: color, fillOpacity: opac, lineColor: color, lineWidth: 0.5 }}, properties: { layerId: layerId, tilesetGroupId: f.get('tilesetGroupId'), name: f.get('tilesetName') }});
            window.ogSavedTilesetsLayer.addEntity(ent);
        });
        window.ogSavedTilesetsLayer.redraw();
    }
    window.populateGlobePolygonsForLayer = populateGlobePolygonsForLayer;

    // --- OpenGlobus Initialization (from mundial5-13, with RESOURCES_PATH check) ---
    function initializeOpenGlobus() {
        if (typeof og === 'undefined') { console.error("FATAL: OpenGlobus (og) NOT DEFINED."); return; }
        if (og.RESOURCES_PATH) console.log("DEBUG: initializeOpenGlobus - og.RESOURCES_PATH is:", og.RESOURCES_PATH); else { console.warn("DEBUG: initializeOpenGlobus - og.RESOURCES_PATH not set! Setting fallback."); og.RESOURCES_PATH = "/packages/openglobus/res/";}
        if (window.globus) { console.warn("WARN: window.globus already exists."); return; }
        const container = document.getElementById('globusContainer'); if (!container) { console.error("FATAL: 'globusContainer' DIV not found."); return; }
        const osm = new og.layer.XYZ("OSM", {isBaseLayer:true, url:"https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png", visibility:false});
        const sat = new og.layer.XYZ("Satellite", {isBaseLayer:true, url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", visibility:true, attributions:'Tiles © Esri'});
        window.globus = new og.Globe({target:container, name:"Earth", terrain:new og.terrain.GlobusTerrain(), layers:[osm, sat], autoActivate:true});
        window.ogSavedTilesetsLayer = new og.layer.CanvasTiles("Saved Tilesets OG", {visibility:true, isBaseLayer:false, zIndex:10000}); window.globus.addLayer(window.ogSavedTilesetsLayer);
        window.gridLayerOG = new og.layer.CanvasTiles("Globe Grid OG", {visibility:true, isBaseLayer:false, zIndex:9999,
            drawTile: function(mat, apply) { const seg=mat.segment; const z=seg.tileZoom; const canv=mat.canvas; const ctx=canv.getContext('2d'); ctx.clearRect(0,0,256,256); if(z>=GRID_VISIBILITY_MIN_ZOOM && settingGridVisibleCheckbox.checked){ ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=parseFloat(settingGridWeightInput.value)||0.5; const zd=TILE_SELECTION_ZOOM-z; const nc=Math.pow(2,zd); const cs=256/nc; for(let i=0;i<=nc;i++){ctx.beginPath();ctx.moveTo(i*cs,0);ctx.lineTo(i*cs,256);ctx.stroke(); ctx.beginPath();ctx.moveTo(0,i*cs);ctx.lineTo(256,i*cs);ctx.stroke();}} apply(canv); }
        }); window.globus.addLayer(window.gridLayerOG);
        window.globus.planet.viewExtent(new og.Extent(new og.LonLat(-180,-90), new og.LonLat(180,90))); // Default view
        window.globus.planet.events.on("lclick", function(e){ if(currentInteractionMode==='tileSelect'){ const ll=window.globus.planet.getLonLatFromPixelTerrain(e); if(ll){ const olc=ol.proj.fromLonLat([ll.lon,ll.lat]); if(selectionTileGrid){const tc=selectionTileGrid.getTileCoordForCoordAndZ(olc,TILE_SELECTION_ZOOM); toggleTileSelection(tc); if(window.olMap)window.olMap.getView().setCenter(olc);}}}});
    }

    // --- Panel UI Management (from mundial5-13) ---
    const viewToggleButtons = { socialBtn: socialPanel, mapViewBtn: mapPanelOL, globeViewBtn: globePanelOG, layersBtn: layerSwitcherPanelOL, profileBtn: profilePanel, xrViewBtn: xrPanel, settingsBtn: settingsPanel, assetsBtn: assetsPanel };
    Object.entries(viewToggleButtons).forEach(([btnId, panel]) => { const btn = document.getElementById(btnId); if(btn && panel){ const isActive = panel.style.display !== 'none'; btn.classList.toggle('active', isActive); btn.addEventListener('click', ()=>{ const newActive = !panel.classList.contains('visible-panel'); panel.style.display = newActive ? 'block' : 'none'; panel.classList.toggle('visible-panel', newActive); btn.classList.toggle('active', newActive); if(newActive){if(panel===mapPanelOL && window.olMap)setTimeout(()=>window.olMap.updateSize(),50); if(panel===globePanelOG && window.globus)setTimeout(()=>window.globus.renderer.draw(),50);}});}});
    document.querySelectorAll('.minimize-btn').forEach(btn => { const p = btn.closest('.view-panel, .control-panel, .modal'); if(p) btn.addEventListener('click', ()=>{ p.classList.toggle('minimized'); btn.textContent = p.classList.contains('minimized')?'+':'-'; if(!p.classList.contains('minimized') && (p===mapPanelOL||p===globePanelOG)) setTimeout(()=>{if(p===mapPanelOL&&window.olMap)window.olMap.updateSize(); if(p===globePanelOG&&window.globus)window.globus.renderer.draw();},50);});});
    document.querySelectorAll('.maximize-btn').forEach(btn => { const p = btn.closest('.view-panel'); if(p) btn.addEventListener('click', ()=>{ p.classList.toggle('maximized'); btn.textContent = p.classList.contains('maximized')?'❐':'□'; if(p===mapPanelOL&&window.olMap)setTimeout(()=>window.olMap.updateSize(),50); if(p===globePanelOG&&window.globus)setTimeout(()=>window.globus.renderer.draw(),50);});});
    const allPanels = [socialPanel,mapPanelOL,globePanelOG,layerSwitcherPanelOL,profilePanel,xrPanel,settingsPanel,assetsPanel,userLayerList,appControlsPanel,tilesetDetailsModal].filter(Boolean);
    allPanels.forEach(p => makeDraggable(p));
    
    // --- Settings (from mundial5-13) ---
    function loadSettings() { try { const s=localStorage.getItem('mundialAppSettingsV2'); if(s){const ps=JSON.parse(s); if(ps.startLoc){settingStartLonInput.value=ps.startLoc.lon; settingStartLatInput.value=ps.startLoc.lat; settingStartZoomInput.value=ps.startLoc.zoom;} if(ps.grid){settingGridVisibleCheckbox.checked=ps.grid.vis!==false; settingGridWeightInput.value=ps.grid.w||0.5;} return ps;}}catch(e){} return {startLoc:{lon:-74.0445,lat:40.6892,zoom:18},grid:{vis:true,w:0.5}}; }
    function saveSettings(newS) { try {const c=loadSettings()||{}; localStorage.setItem('mundialAppSettingsV2',JSON.stringify({...c,...newS}));}catch(e){} }
    function applyStartLocationSettings(lon,lat,zoom) { if(window.olMap)window.olMap.getView().animate({center:ol.proj.fromLonLat([lon,lat]),zoom:zoom,duration:1000}); if(window.globus){const alt=30000000/Math.pow(2,zoom); window.globus.planet.flyTo(new og.LonLat(lon,lat,alt>100?alt:100),{duration:1.5});}}
    window.applyStartLocationSettings = applyStartLocationSettings; // Make global for settings panel
    function applyGridSettings() { const vis=settingGridVisibleCheckbox.checked; const w=parseFloat(settingGridWeightInput.value); if(gridLayerZ21){gridLayerZ21.setVisible(vis); gridLayerZ21.setStyle(new ol.style.Style({stroke:new ol.style.Stroke({color:'rgba(0,0,0,1)',width:w})})); updateZ21GridOL();} if(window.gridLayerOG){window.gridLayerOG.setVisibility(vis); window.gridLayerOG.redraw();} saveSettings({grid:{vis,w}}); }
    if(settingSetStartLocationBtn && window.olMap) settingSetStartLocationBtn.addEventListener('click',()=>{const v=window.olMap.getView(); const c=ol.proj.toLonLat(v.getCenter()); const z=Math.round(v.getZoom()); settingStartLonInput.value=c[0].toFixed(6); settingStartLatInput.value=c[1].toFixed(6); settingStartZoomInput.value=z; saveSettings({startLoc:{lon:c[0],lat:c[1],zoom:z}}); alert("Start location set.");});
    if(settingGridVisibleCheckbox) settingGridVisibleCheckbox.addEventListener('change', applyGridSettings);
    if(settingGridWeightInput) settingGridWeightInput.addEventListener('change', applyGridSettings);

    // --- Base Layer Selection (from mundial5-13) ---
    const baseLayersOLDefs = {'satellite':{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',att:'Tiles © Esri'}, 'osm':{sourceClass:ol.source.OSM,att:'© OSM contrib.'}};
    const baseLayersOGNames = {'satellite':'Satellite','osm':'OSM'};
    if(baseLayerSelectOL) baseLayerSelectOL.addEventListener('change', function(){ const v=this.value; if(v==='add-custom'){customLayerInputsDiv.style.display='block';return;} customLayerInputsDiv.style.display='none'; if(window.olMap){const c=window.olMap.getLayers().getArray().find(l=>l.get('type')==='base'); if(c)window.olMap.removeLayer(c); const d=baseLayersOLDefs[v]; if(d){let ns; if(d.sourceClass)ns=new d.sourceClass({attributions:d.att}); else ns=new ol.source.XYZ({url:d.url,attributions:d.att}); const nbl=new ol.layer.Tile({source:ns,type:'base'}); window.olMap.getLayers().insertAt(0,nbl);}} if(window.globus&&baseLayersOGNames[v])window.globus.planet.setBaseLayer(window.globus.planet.getLayerByName(baseLayersOGNames[v]));});
    if(addCustomLayerBtn) addCustomLayerBtn.addEventListener('click',()=>{const n=customLayerNameInput.value.trim(); const u=customLayerUrlInput.value.trim(); if(!n||!u)return; if(window.olMap){const cs=new ol.source.XYZ({url:u,attributions:n}); const cl=new ol.layer.Tile({source:cs,type:'base'}); const cb=window.olMap.getLayers().getArray().find(l=>l.get('type')==='base'); if(cb)window.olMap.removeLayer(cb); window.olMap.getLayers().insertAt(0,cl); const o=document.createElement('option');o.value=`custom-${n}`;o.text=`Custom:${n}`; baseLayerSelectOL.insertBefore(o,baseLayerSelectOL.querySelector('option[value="add-custom"]')); baseLayerSelectOL.value=o.value; customLayerInputsDiv.style.display='none';customLayerNameInput.value='';customLayerUrlInput.value='';}});
    
    // --- App Initialization ---
    function initializeApp() {
        console.log("Initializing application with refined combined logic...");
        const settings = loadSettings(); 

        initializeOpenLayersMap();    // Includes OL grid and tile selection interactions
        initializeOpenGlobus();       // Includes Globe grid and start view

        // Setup Layer 0 UI if not already present
        if (window.userLayers && window.userLayers['layer-0']) {
            addLayerToList('layer-0', window.userLayers['layer-0'].name || 'Layer 0', window.userLayers['layer-0'].layer.getVisible());
        } else if (layer0Layer) { // If OL init created it
             window.userLayers['layer-0'] = { name: 'Layer 0', layer: layer0Layer, tilesetCount: 0 };
             addLayerToList('layer-0', 'Layer 0', true);
        }
        selectLayerInList(window.selectedLayerId || 'layer-0');
        
        // Apply initial settings (start location and grid)
        if (settings.startLoc) {
            applyStartLocationSettings(settings.startLoc.lon, settings.startLoc.lat, settings.startLoc.zoom);
        } else { // Default if no settings
            applyStartLocationSettings(-74.0445, 40.6892, 18); // Statue of Liberty
        }
        applyGridSettings(); // Applies loaded or default grid settings to both OL and Globe grids

        console.log("Application initialization complete.");
    }

    initializeApp();
});