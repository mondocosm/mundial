// mundial/main.js - Reconstructed FINAL for Side-by-Side View

document.addEventListener('DOMContentLoaded', () => {

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
    const selectionLayer = new ol.layer.Vector({ source: selectionSource, style: selectionStyle, title: 'selection', zIndex: 3 });
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
    const tilesetFeatureStyle = new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'rgba(0, 128, 128, 0.9)', width: 3 }) });
    const layer0Layer = new ol.layer.Vector({ source: layer0Source, style: tilesetFeatureStyle, title: layer0Id, zIndex: 2, visible: true });
    layer0Layer.set('userLayerName', layer0Name);
    const userLayers = { [layer0Id]: { name: layer0Name, layer: layer0Layer, tilesetCount: 0 } };

    // --- Initialize OpenLayers Map ---
    const map = new ol.Map({
        target: 'map',
        layers: [ ...baseLayers, layer0Layer, gridLayerZ21, selectionLayer, highlightLayer ],
        view: new ol.View({ center: ol.proj.fromLonLat([-74.0060, 40.7128]), zoom: 17, maxZoom: TILE_SELECTION_ZOOM + 1, minZoom: 0 }),
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
    let globus = null;
    let ogBaseLayers = {};
    let gridLayerOG = null;
    const globusElement = document.getElementById('globusContainer'); // OpenGlobus container

    function initializeOpenGlobus() {
        if (!globus && typeof og !== 'undefined') {
            try {
                // Define Grid Layer Class
                class GridCanvasTiles extends og.layer.CanvasTiles {
                    constructor(name, options) {
                        super(name, options);
                        this.minZoom = options.minZoom === undefined ? 16 : options.minZoom;
                        this.maxZoom = options.maxZoom === undefined ? 21 : options.maxZoom;
                    }
                    // Define drawTile as a prototype method
                    drawTile(material, applyTexture) {
                        const canvas = this.createCanvas(material.segment.tileZoom); // Use base class method
                        const ctx = canvas.getContext('2d');
                        const size = canvas.width;
                        if (material.segment.tileZoom >= this.minZoom && material.segment.tileZoom <= this.maxZoom) {
                            ctx.clearRect(0, 0, size, size);
                            ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(0, 0); ctx.lineTo(size, 0); ctx.moveTo(size, 0); ctx.lineTo(size, size);
                            ctx.moveTo(size, size); ctx.lineTo(0, size); ctx.moveTo(0, size); ctx.lineTo(0, 0);
                            ctx.stroke();
                        } else { ctx.clearRect(0, 0, size, size); }
                        applyTexture(canvas);
                    }
                }

                // Create OG base layers
                ogBaseLayers = {};
                const initialOgLayers = [];
                baseLayers.forEach(olLayer => {
                    const title = olLayer.get('title');
                    const source = olLayer.getSource();
                    let url = '';
                    if (source instanceof ol.source.OSM) { url = "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"; }
                    else if (source instanceof ol.source.XYZ) { url = source.getUrls()[0].replace(/\{[abc]\}/, '{s}'); }
                    if (title && url) {
                        const isVisible = (title === previouslySelectedLayerValue);
                        const ogLayer = new og.layer.XYZ(title, {
                            isBaseLayer: true, url: url, visibility: isVisible,
                            attribution: source.getAttributions() ? source.getAttributions()({}) : '',
                            maxZoom: source.getTileGrid() ? source.getTileGrid().getMaxZoom() : 21
                        });
                        ogBaseLayers[title] = ogLayer; initialOgLayers.push(ogLayer);
                        console.log(`Created OG layer: ${title}, Visible: ${isVisible}`);
                    } else { console.warn(`Could not create OG layer for OL layer with title: ${title}`); }
                });

                // Initialize Globe
                globus = new og.Globe({
                    target: "globusContainer", name: "OpenGlobus View",
                    layers: initialOgLayers,
                    terrain: new og.terrain.EmptyTerrain(), // Use EmptyTerrain
                    viewExtent: [ -180, -90, 180, 90 ]
                });

                // Add grid layer
                gridLayerOG = new GridCanvasTiles("ZL21 Grid", { minZoom: 16, maxZoom: 21, visibility: true });
                globus.planet.addLayer(gridLayerOG);

                // Add controls
                globus.planet.addControl(new og.control.ZoomControl());
                globus.planet.addControl(new og.control.LayerSwitcher());

                console.log("OpenGlobus initialized.");

                // Trigger initial resize
                setTimeout(() => {
                    if (globus && globus.planet && globus.planet.renderer) {
                         // Use the renderer's resize method
                         globus.planet.renderer.resize();
                         console.log("Triggered initial OpenGlobus resize.");
                    }
                }, 100);

            } catch (error) { console.error("Error initializing OpenGlobus:", error); alert("Failed to initialize 3D view."); }
        }
    }

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

    // --- Tileset Details Modal Logic ---
    let currentEditingGroupId = null;
    function openTilesetDetailsModal(firstFeatureOfGroup) {
        if (!firstFeatureOfGroup) return;
        const groupId = firstFeatureOfGroup.get('tilesetGroupId');
        if (!groupId) { console.warn("Cannot open modal: Feature is not part of a group."); return; }
        currentEditingGroupId = groupId;
        const layer = userLayers[selectedLayerId]?.layer;
        if (!layer) return;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        const tileCount = groupFeatures.length;
        if (tileCount === 0) { console.warn(`No features found for group ${groupId} when opening modal.`); currentEditingGroupId = null; return; }
        detailsTilesetNameInput.value = firstFeatureOfGroup.get('tilesetName') || '';
        detailsColorPicker.value = firstFeatureOfGroup.get('color') || '#008080';
        detailsTilesetImageUrlInput.value = firstFeatureOfGroup.get('imageUrl') || '';
        detailsTilesetLinkInput.value = firstFeatureOfGroup.get('linkUrl') || '';
        detailsTilesetTagsTextarea.value = firstFeatureOfGroup.get('tags') || '';
        if (detailsTilesetImageUrlInput.value) { detailsTilesetImage.src = detailsTilesetImageUrlInput.value; detailsTilesetImage.style.display = 'block'; }
        else { detailsTilesetImage.style.display = 'none'; detailsTilesetImage.src = ''; }
        const groupExtent = ol.extent.createEmpty();
        groupFeatures.forEach(f => ol.extent.extend(groupExtent, f.getGeometry().getExtent()));
        if (!ol.extent.isEmpty(groupExtent)) {
            const center = ol.extent.getCenter(groupExtent); const centerLonLat = ol.proj.toLonLat(center);
            detailsTilesetCoordsSpan.textContent = `${centerLonLat[1].toFixed(6)}, ${centerLonLat[0].toFixed(6)}`;
        } else { detailsTilesetCoordsSpan.textContent = 'N/A'; }
        const tileCountSpan = document.getElementById('details-tileset-tile-count');
        if (tileCountSpan) { tileCountSpan.textContent = tileCount; }
        detailsLocationInfoSpan.textContent = 'Lookup not implemented';
        tilesetDetailsModal.style.display = 'block';
    }
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
    let selectedLayerId = layer0Id;
    let tilesetFeatureCounter = 0;
    function populateTilesetList(layerId) {
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
                userLayers[selectedLayerId].tilesetCount = Math.max(0, (userLayers[selectedLayerId].tilesetCount || 1) - 1);
                populateTilesetList(selectedLayerId);
                console.log(`Deleted tileset group ${groupId} ("${tilesetName}")`);
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
        if (target.tagName === 'SPAN') { zoomToTilesetGroup(groupId); }
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
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = isVisible; checkbox.title = `Toggle visibility of "${layerName}"`;
        const nameSpan = document.createElement('span'); nameSpan.textContent = layerName; nameSpan.title = `Select layer "${layerName}"`;
        const buttonContainer = document.createElement('div'); buttonContainer.classList.add('button-container');
        const editBtn = document.createElement('button'); editBtn.innerHTML = '✏️'; editBtn.classList.add('settings-btn-small'); editBtn.title = `Edit name for "${layerName}"`;
        const privacyBtn = document.createElement('button'); privacyBtn.innerHTML = '🌐'; privacyBtn.classList.add('settings-btn-small'); privacyBtn.title = `Toggle privacy for "${layerName}" (Current: Public)`;
        const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '🗑️'; deleteBtn.classList.add('settings-btn-small'); deleteBtn.title = `Delete layer "${layerName}"`;
        buttonContainer.appendChild(editBtn); buttonContainer.appendChild(privacyBtn); buttonContainer.appendChild(deleteBtn);
        itemDiv.appendChild(checkbox); itemDiv.appendChild(nameSpan); itemDiv.appendChild(buttonContainer);
        const initialMsg = userLayerList.querySelector('small'); if (initialMsg) initialMsg.remove();
        userLayerList.appendChild(itemDiv);
    }
    function selectLayerInList(layerId) {
        const currentSelected = userLayerList.querySelector('.selected'); if (currentSelected) currentSelected.classList.remove('selected');
        const newItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`); if (newItem) newItem.classList.add('selected');
        selectedLayerId = layerId; populateTilesetList(layerId); console.log(`Selected layer: ${layerId}`);
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
                 const checkbox = listItem.querySelector('input[type="checkbox"]'); if (checkbox) checkbox.title = `Toggle visibility of "${trimmedName}"`;
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
        const target = event.target; const itemDiv = target.closest('.layer-item'); if (!itemDiv) return;
        const layerId = itemDiv.dataset.layerId; if (!layerId) return;
        if (target.tagName === 'SPAN') { selectLayerInList(layerId); }
        else if (target.innerHTML === '✏️') { editLayerName(layerId, itemDiv.querySelector('span')); }
        else if (target.innerHTML === '🌐' || target.innerHTML === '🔒') { toggleLayerPrivacy(layerId, target); }
        else if (target.innerHTML === '🗑️') { deleteLayer(layerId); }
    });
    userLayerList.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const itemDiv = event.target.closest('.layer-item');
            if (itemDiv) {
                const layerId = itemDiv.dataset.layerId;
                if (layerId && userLayers[layerId]) {
                    const isVisible = event.target.checked; userLayers[layerId].layer.setVisible(isVisible);
                    console.log(`Layer ${layerId} visibility set to ${isVisible}`);
                }
            }
        }
    });
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
        });
        if (featuresToAdd.length > 0) {
            targetSource.addFeatures(featuresToAdd); userLayers[selectedLayerId].tilesetCount = (userLayers[selectedLayerId].tilesetCount || 0) + 1;
            selectionSource.clear(); // Clear selection after successful save
            populateTilesetList(selectedLayerId);
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
    addLayerToList(layer0Id, layer0Name, true);
    selectLayerInList(layer0Id);
    populateTilesetList(layer0Id);
    updateSelectionActionsVisibility();
    updateSelectedTileCountDisplay();
    // Initial mode is 'select', but DragPan is active and DragBox is inactive by default.
    // Click handler works, DragBox needs mode switch.
    // Let's set the initial cursor based on the initial state (DragPan active).
    if (mapElementOL) mapElementOL.style.cursor = 'grab'; // Initial cursor matches initial DragPan state
    interactionModeBtn.textContent = 'Mode: Pan Map'; // Initial button text reflects initial state
    currentInteractionMode = 'pan'; // Set initial mode state variable correctly

    initializeOpenGlobus(); // Initialize Globus early but keep hidden

    // --- Helper to find features being edited ---
    function findCurrentGroupFeatures() {
        if (!selectedLayerId || !userLayers[selectedLayerId] || !currentEditingGroupId) { return []; }
        const source = userLayers[selectedLayerId].layer.getSource();
        return source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);
    }

    // --- Map/Globe Toggle Button (Sync on Toggle) ---
    const layerSwitcherPanel = document.getElementById('layer-switcher');
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
    const mapPanel = document.getElementById('map-panel');
    if (mapPanel) {
        const resizeObserver = new ResizeObserver(() => {
            map.updateSize(); console.log("Map panel resized, updated OL map size.");
        });
        resizeObserver.observe(mapPanel);
    } else { console.error("Could not find map panel for resize observer."); }

    // Explicitly update OL map size after initial setup
    setTimeout(() => map.updateSize(), 100);

    // --- Make Panels Draggable ---
    makeDraggable(document.getElementById('layer-switcher'));
    makeDraggable(document.getElementById('user-layers-panel'));
    makeDraggable(document.getElementById('app-controls'));
    makeDraggable(document.getElementById('tileset-details-modal'));
    makeDraggable(document.getElementById('map-panel'));
    makeDraggable(document.getElementById('globe-panel'));

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
                    if (panel.id === 'globe-panel' && globus && globus.planet.renderer) globus.planet.renderer.resize();
                }, 50); // Delay slightly for CSS transition
            }
        }
    });

}); // End DOMContentLoaded
