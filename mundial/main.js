document.addEventListener('DOMContentLoaded', () => {


    // --- Draggable Panels ---
    function makeDraggable(elmnt) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      // Use the header if available, otherwise the element itself
      const dragHandle = elmnt.querySelector('.panel-header') || elmnt.querySelector('h2') || elmnt;

      if (dragHandle) {
        dragHandle.style.cursor = 'move';
        dragHandle.onmousedown = dragMouseDown;
      } else {
        // Fallback if no header found (less ideal)
        elmnt.style.cursor = 'move';
        elmnt.onmousedown = dragMouseDown;
      }

      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position:
        // Ensure element stays within viewport bounds (simple check)
        const newTop = Math.max(0, Math.min(window.innerHeight - elmnt.offsetHeight, elmnt.offsetTop - pos2));
        const newLeft = Math.max(0, Math.min(window.innerWidth - elmnt.offsetWidth, elmnt.offsetLeft - pos1));
        elmnt.style.top = newTop + "px";
        elmnt.style.left = newLeft + "px";
        // Clear bottom/right if setting top/left
        elmnt.style.bottom = '';
        elmnt.style.right = '';
      }

      function closeDragElement() {
        // Stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
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
    let baseLayers = [osmLayer, satelliteLayer, topoLayer];
    let previouslySelectedLayerValue = 'satellite';

    // --- Grid and Selection Setup ---
    const TILE_SELECTION_ZOOM = 21;
    const GRID_VISIBILITY_MIN_ZOOM = 16;
    const selectionStyle = new ol.style.Style({ fill: new ol.style.Fill({ color: 'rgba(200, 200, 200, 0.5)' }) }); // Style for temp selection
    const selectionSource = new ol.source.Vector();
    const selectionLayer = new ol.layer.Vector({ source: selectionSource, style: selectionStyle, title: 'selection', zIndex: 3 });

    // --- Highlight Layer Setup ---
    const highlightStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 0, 0.8)', width: 4 }), // Bright yellow, slightly thicker
        fill: new ol.style.Fill({ color: 'rgba(255, 255, 0, 0.2)' }), // Semi-transparent yellow fill
        zIndex: 4 // Ensure highlight is above selection and tilesets
    });
    const highlightSource = new ol.source.Vector();
    const highlightLayer = new ol.layer.Vector({
        source: highlightSource,
        style: highlightStyle,
        title: 'highlight'
    });

    const gridStyleZ21 = new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 1)', width: 1 }) });
    const gridSourceZ21 = new ol.source.Vector();
    const gridLayerZ21 = new ol.layer.Vector({ source: gridSourceZ21, style: gridStyleZ21, title: 'grid-z21', visible: false, zIndex: 1 });
    const selectionTileGrid = ol.tilegrid.createXYZ({ maxZoom: TILE_SELECTION_ZOOM });

    // --- User Layers Setup ---
    const layer0Id = 'layer-0';
    const layer0Name = 'Layer0 (Default)';
    const layer0Source = new ol.source.Vector();
     // Style for saved *tileset features* within a user layer
     const tilesetFeatureStyle = new ol.style.Style({
         stroke: new ol.style.Stroke({ color: 'rgba(0, 128, 128, 0.9)', width: 3 }), // Teal border, thicker
     });


    const layer0Layer = new ol.layer.Vector({
        source: layer0Source,
        style: tilesetFeatureStyle, // Use the default tileset style
        title: layer0Id,
        zIndex: 2, // Ensure it's above base layers but below selection
        visible: true // Default layer should be visible initially (visibility controlled by zoom anyway)
    });
    layer0Layer.set('userLayerName', layer0Name); // Store the display name

    const userLayers = { // Store user layers: { layerId: { name: 'Layer Name', layer: ol.layer.Vector, tilesetCount: number }, ... }
       [layer0Id]: { name: layer0Name, layer: layer0Layer, tilesetCount: 0 }
    };

    // Initialize the map
    const map = new ol.Map({
        target: 'map',
        layers: [ ...baseLayers, layer0Layer, gridLayerZ21, selectionLayer, highlightLayer ], // Add highlight layer
        view: new ol.View({ center: ol.proj.fromLonLat([-74.0060, 40.7128]), zoom: 10, maxZoom: TILE_SELECTION_ZOOM + 1, minZoom: 0 }),
        controls: [], // Remove default controls (like zoom buttons)
    });
    const mapElement = document.getElementById('map'); // Get map DOM element

    // --- UI Element References ---
    const baseLayerSelect = document.getElementById('base-layer-select');
    const customLayerInputsDiv = document.getElementById('custom-layer-inputs');
    const customLayerNameInput = document.getElementById('custom-layer-name');
    const customLayerUrlInput = document.getElementById('custom-layer-url');
    const addCustomLayerBtn = document.getElementById('add-custom-layer-btn');
    const userLayersPanel = document.getElementById('user-layers-panel');
    const userLayerList = document.getElementById('user-layer-list'); // Changed from userLayerSelect
    const createLayerBtn = document.getElementById('create-layer-btn'); // The '+' button
    const tilesetListDiv = document.getElementById('tileset-list');
    const selectionActionsDiv = document.getElementById('selection-actions');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const saveSelectionBtn = document.getElementById('save-selection-btn');
    const tilesetNameInput = document.getElementById('tileset-name-input');
    const appControlsPanel = document.getElementById('app-controls');
    const interactionModeBtn = document.getElementById('interaction-mode-btn');
    const selectedTileCountDisplay = document.getElementById('selected-tile-count-display');
    // Removed references for old inline color picker


    // --- Tileset Details Modal Element References ---
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
    const detailsSaveBtn = document.getElementById('details-save-btn'); // Reference kept for removal check
    const detailsMoreSettingsBtn = document.getElementById('details-more-settings-btn'); // Reference kept for removal check


    // --- Tileset Details Modal Logic ---
    let currentEditingFeatureId = null; // Track which feature is being edited in the modal

    function openTilesetDetailsModal(feature) {
        if (!feature) return;
        currentEditingFeatureId = feature.getId(); // Store the ID of the feature being edited

        // Populate fields
        detailsTilesetNameInput.value = feature.get('tilesetName') || '';
        detailsColorPicker.value = feature.get('color') || '#008080'; // Default to teal
        detailsTilesetImageUrlInput.value = feature.get('imageUrl') || '';
        detailsTilesetLinkInput.value = feature.get('linkUrl') || '';
        detailsTilesetTagsTextarea.value = feature.get('tags') || '';

        // Display image if URL exists
        if (detailsTilesetImageUrlInput.value) {
            detailsTilesetImage.src = detailsTilesetImageUrlInput.value;
            detailsTilesetImage.style.display = 'block';
        } else {
            detailsTilesetImage.style.display = 'none';
            detailsTilesetImage.src = '';
        }

        // Calculate and display center coordinates
        const extent = feature.getGeometry().getExtent();
        const center = ol.extent.getCenter(extent);
        const centerLonLat = ol.proj.toLonLat(center); // Convert to Lon/Lat
        detailsTilesetCoordsSpan.textContent = `${centerLonLat[1].toFixed(6)}, ${centerLonLat[0].toFixed(6)}`; // Lat, Lon format

        // Placeholder for location info (requires reverse geocoding API)
        detailsLocationInfoSpan.textContent = 'Lookup not implemented';

        // Show the modal
        tilesetDetailsModal.style.display = 'block';
    }

    // Close modal logic
    closeTilesetDetailsModalBtn.addEventListener('click', () => {
        tilesetDetailsModal.style.display = 'none';
        currentEditingFeatureId = null; // Clear the editing state
    });
    // Close modal if clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === tilesetDetailsModal) {
            tilesetDetailsModal.style.display = 'none';
            currentEditingFeatureId = null; // Clear the editing state
        }
    });

    // Save changes from modal (REMOVED - Now handled by color picker input)
    // detailsSaveBtn.addEventListener('click', () => { ... });

    // Update image preview when URL changes
    detailsTilesetImageUrlInput.addEventListener('change', () => {
        const url = detailsTilesetImageUrlInput.value.trim();
        if (url) {
            detailsTilesetImage.src = url;
            detailsTilesetImage.style.display = 'block';
        } else {
            detailsTilesetImage.style.display = 'none';
            detailsTilesetImage.src = '';
        }
    });

    // --- Instant Color Update Logic ---
    detailsColorPicker.addEventListener('input', (event) => {
        if (!currentEditingFeatureId || !selectedLayerId || !userLayers[selectedLayerId]) {
            console.warn("Cannot update color: No feature or layer context.");
            return;
        }
        const layer = userLayers[selectedLayerId].layer;
        const feature = layer.getSource().getFeatureById(currentEditingFeatureId);

        if (!feature) {
            console.warn("Cannot update color: Feature not found.");
            return;
        }

        const newColor = event.target.value;
        feature.set('color', newColor); // Store the color on the feature

        // Update style immediately if visible
        if (feature.get('isVisible') !== false) {
            feature.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({ color: newColor, width: 3 }),
                // Add fill using the same color but with some transparency
                fill: new ol.style.Fill({ color: ol.color.asString([...ol.color.asArray(newColor).slice(0, 3), 0.2]) })
            }));
        }
        // Optionally refresh the list item style if needed, though populateTilesetList on close/save handles this too
        // populateTilesetList(selectedLayerId); // Could cause flicker on every input change
        console.log(`Updated color for ${currentEditingFeatureId} to ${newColor}`);
    });


    // --- Global State ---
    // let currentSettingsFeatureId = null; // Defined above with modal logic

    const settingsBtn = document.getElementById('settings-btn');

    // --- Base Layer Switcher Logic ---
    function switchBaseLayer(selectedValue) { baseLayers.forEach(layer => layer.setVisible(layer.get('title') === selectedValue)); }
    baseLayerSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue === 'add-custom') {
            customLayerInputsDiv.style.display = 'block'; this.value = previouslySelectedLayerValue;
        } else {
            customLayerInputsDiv.style.display = 'none'; switchBaseLayer(selectedValue); previouslySelectedLayerValue = selectedValue;
        }
    });
    baseLayerSelect.value = 'satellite';

    // --- Add Custom Base Layer Logic ---
    addCustomLayerBtn.addEventListener('click', function() {
        const name = customLayerNameInput.value.trim(); const url = customLayerUrlInput.value.trim();
        const title = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!name || !url || !url.includes('{z}') || !url.includes('{x}') || !url.includes('{y}')) { alert('Invalid name or URL template.'); return; }
        const allLayerTitles = map.getLayers().getArray().map(l => l.get('title'));
        const reservedTitles = ['add-custom', 'selection', 'grid-z21'];
        if (reservedTitles.includes(title) || allLayerTitles.includes(title)) { alert(`Title "${title}" reserved or exists.`); return; }
        console.log(`Adding custom base layer: Name="${name}", Title="${title}"`);
        const newLayer = new ol.layer.Tile({ source: new ol.source.XYZ({ url: url, attributions: `Custom: ${name}` }), visible: false, title: title });
        map.getLayers().insertAt(baseLayers.length, newLayer); baseLayers.push(newLayer);
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
        const currentZoom = Math.floor(map.getView().getZoom()); // Use Math.floor
        const showUserLayers = currentZoom >= GRID_VISIBILITY_MIN_ZOOM;
        // console.log(`Updating user layer visibility: Zoom=${currentZoom}, Show=${showUserLayers}`); // Optional debug log
        Object.values(userLayers).forEach(layerInfo => {
            // Check if the layer itself exists before setting visibility
            if (layerInfo && layerInfo.layer) {
                 layerInfo.layer.setVisible(showUserLayers);
            }
        });
    }

    map.on('moveend', () => {
        const currentZoom = Math.floor(map.getView().getZoom()); // Use Math.floor
        const showGridAndSelection = currentZoom >= GRID_VISIBILITY_MIN_ZOOM;

        // Control grid, selection, and user layer visibility based on zoom (using floored zoom)
        gridLayerZ21.setVisible(showGridAndSelection);
        selectionLayer.setVisible(showGridAndSelection);
        updateUserLayerVisibility(); // Handles user layers based on the same logic internally

        // Update grid content if visible
        if (showGridAndSelection) {
            updateZ21Grid();
        } else {
            gridSourceZ21.clear(); // Clear grid source when hidden
            selectionSource.clear(); // Clear temporary selection when zooming out
        }
    });
    // Initial calls
    updateZ21Grid();
    updateUserLayerVisibility();
    // Ensure selection layer visibility matches initial state
    selectionLayer.setVisible(Math.floor(map.getView().getZoom()) >= GRID_VISIBILITY_MIN_ZOOM); // Use Math.floor

    // --- Tile Selection Interaction Logic ---
    let currentInteractionMode = 'select'; // 'select' or 'pan'
    function getTileId(tileCoord) { return `${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}`; }
    function toggleTileSelection(tileCoord) {
        const tileId = getTileId(tileCoord); const existingFeature = selectionSource.getFeatureById(tileId);
        if (existingFeature) { selectionSource.removeFeature(existingFeature); } else {
            // Check if tile is already part of a saved tileset on the current layer
            if (selectedLayerId && userLayers[selectedLayerId]) {
                const targetSource = userLayers[selectedLayerId].layer.getSource();
                const existingTilesets = targetSource.getFeatures();
                for (const tileset of existingTilesets) {
                    const existingIds = tileset.get('tileIds');
                    if (existingIds && existingIds.includes(tileId)) {
                        // alert(`Tile already belongs to tileset "${tileset.get('tilesetName') || 'Unnamed Tileset'}" on this layer.`);
                        return; // Prevent selection
                    }
                }
            }
            // Selection limit removed
            const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
            const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
            newFeature.setId(tileId); selectionSource.addFeature(newFeature);
        }
    }
    const clickSelectHandler = function (evt) {
        if (currentInteractionMode !== 'select' || Math.floor(map.getView().getZoom()) < GRID_VISIBILITY_MIN_ZOOM) return;

        let clickedExistingTileset = false;
        // Check if click hit an existing tileset feature on the active layer
        map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            if (clickedExistingTileset) return; // Process only the first hit tileset

            // Check if the feature belongs to the currently selected user layer
            if (layer && layer.get('title') === selectedLayerId && feature.get('tilesetName')) {
                clickedExistingTileset = true;
                const featureId = feature.getId();
                const featureName = feature.get('tilesetName');
                console.log(`Clicked existing tileset: ${featureName} (ID: ${featureId})`);

                // Highlight the clicked feature
                highlightSource.clear(); // Clear previous highlight
                const highlightFeature = new ol.Feature(feature.getGeometry().clone()); // Use cloned geometry
                highlightSource.addFeature(highlightFeature);

                // Open the new details modal instead of the inline picker
                openTilesetDetailsModal(feature);
                // currentEditingFeatureId is now set inside openTilesetDetailsModal

                // Old inline picker logic removed
            }
        }, {
            layerFilter: (layer) => layer === userLayers[selectedLayerId]?.layer, // Only check the active user layer
            hitTolerance: 3 // Adjust tolerance as needed
        });

        // If an existing tileset was clicked, don't proceed with individual tile selection
        if (clickedExistingTileset) {
            return;
        }

         // If no existing tileset was clicked, clear highlight, hide picker, and proceed with tile selection/deselection
         highlightSource.clear();
         // inlineColorPickerContainer.style.display = 'none'; // No longer needed here, modal handles its own state
         // currentSettingsFeatureId = null; // No longer needed here, modal handles its own state (currentEditingFeatureId)
         const tileCoord = selectionTileGrid.getTileCoordForCoordAndZ(evt.coordinate, TILE_SELECTION_ZOOM);
         toggleTileSelection(tileCoord);
    };
    map.on('click', clickSelectHandler);
    const dragBoxInteraction = new ol.interaction.DragBox({
        // Style the drag box itself to match the selection fill
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(200, 200, 200, 0.5)' // Match selectionStyle fill
            }),
            stroke: new ol.style.Stroke({ // Add a subtle stroke for visibility
                 color: 'rgba(100, 100, 100, 0.8)',
                 width: 1
            })
        })
    });
    // Removed console logs
    dragBoxInteraction.setActive(currentInteractionMode === 'select'); map.addInteraction(dragBoxInteraction);
    // Removed console logs

    dragBoxInteraction.on('boxend', function () {
        if (currentInteractionMode !== 'select' || Math.floor(map.getView().getZoom()) < GRID_VISIBILITY_MIN_ZOOM) return; // Use Math.floor for robust check
        const extent = dragBoxInteraction.getGeometry().getExtent(); const featuresToAdd = [];
        try {
            selectionTileGrid.forEachTileCoord(extent, TILE_SELECTION_ZOOM, function (tileCoord) {
                const tileId = getTileId(tileCoord); if (!selectionSource.getFeatureById(tileId)) {
                     const tileExtent = selectionTileGrid.getTileCoordExtent(tileCoord);
                     const newFeature = new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(tileExtent) });
                     newFeature.setId(tileId); featuresToAdd.push(newFeature);
                }
            });

            // Filter out features whose tiles are already in a saved tileset on this layer
            let filteredFeaturesToAdd = featuresToAdd;
            if (selectedLayerId && userLayers[selectedLayerId]) {
                const targetSource = userLayers[selectedLayerId].layer.getSource();
                const existingTilesets = targetSource.getFeatures();
                const allExistingTileIds = new Set();
                existingTilesets.forEach(tileset => {
                    const ids = tileset.get('tileIds');
                    if (ids && Array.isArray(ids)) {
                        ids.forEach(id => allExistingTileIds.add(id));
                    }
                });

                if (allExistingTileIds.size > 0) {
                    filteredFeaturesToAdd = featuresToAdd.filter(feature => !allExistingTileIds.has(feature.getId()));
                    // Optional: Alert if some were filtered out?
                    // if (filteredFeaturesToAdd.length < featuresToAdd.length) {
                    //     alert('Some tiles were not selected because they already belong to a saved tileset on this layer.');
                    // }
                }
            }

            // Add the filtered features
            if (filteredFeaturesToAdd.length > 0) {
                selectionSource.addFeatures(filteredFeaturesToAdd);
            }
        } catch (error) { console.error("Error drag box:", error); }
    });

    // --- User Layer and Tileset Management ---

    function updateSelectionActionsVisibility() {
        const hasSelection = selectionSource.getFeatures().length > 0;
        const userLayerSelected = selectedLayerId !== null; // Use the tracked selectedLayerId
        selectionActionsDiv.style.display = hasSelection && userLayerSelected ? 'block' : 'none';
        tilesetNameInput.style.display = hasSelection && userLayerSelected ? 'block' : 'none';
        saveSelectionBtn.disabled = !(hasSelection && userLayerSelected);

        // Pre-fill default tileset name if layer is selected
        if (userLayerSelected && userLayers[selectedLayerId]) {
            const currentCount = userLayers[selectedLayerId].tilesetCount || 0;
            tilesetNameInput.value = `Tileset ${currentCount + 1}`;
        } else {
            tilesetNameInput.value = ''; // Clear if no layer selected
        }

        // clearSelectionBtn visibility/disabled state is now handled by updateSelectedTileCountDisplay
    } // End of updateSelectionActionsVisibility

    function updateSelectedTileCountDisplay() {
        const count = selectionSource.getFeatures().length;
        const MAX_SELECTION_SIZE = 1000; // Reuse the constant or define globally if preferred
        if (selectedTileCountDisplay) { // Check if element exists
            // Update text content
            selectedTileCountDisplay.textContent = `Selected: ${count} / ${MAX_SELECTION_SIZE}`;
            // Update color based on limit
            selectedTileCountDisplay.style.color = count >= MAX_SELECTION_SIZE ? 'red' : '';
            // Show or hide counter and clear button based on whether any tiles are selected
            const hasSelection = count > 0;
            selectedTileCountDisplay.style.display = hasSelection ? 'block' : 'none';
            if (clearSelectionBtn) { // Check if button exists
                clearSelectionBtn.style.display = hasSelection ? 'block' : 'none';
                clearSelectionBtn.disabled = !hasSelection;
            }
        }
    }
    // Removed extra closing brace
    function populateTilesetList(layerId) {
        tilesetListDiv.innerHTML = '';
        if (!layerId || !userLayers[layerId]) {
            tilesetListDiv.innerHTML = '<small><i>Select a layer above.</i></small>'; return;
        }
        const targetSource = userLayers[layerId].layer.getSource();
        const tilesetFeatures = targetSource.getFeatures();
        if (tilesetFeatures.length === 0) {
            tilesetListDiv.innerHTML = '<small><i>No tilesets saved.</i></small>'; return;
        }
        tilesetFeatures.forEach(feature => {
            const tilesetName = feature.get('tilesetName') || 'Unnamed Tileset';
            const featureId = feature.getId();

            // Apply style based on visibility and color
            const isVisible = feature.get('isVisible') !== false; // Default to true if undefined
            if (isVisible) {
                const customColor = feature.get('color');
                if (customColor) {
                    feature.setStyle(new ol.style.Style({
                         stroke: new ol.style.Stroke({ color: customColor, width: 2 })
                    }));
                } else {
                     // Apply default layer style (tilesetFeatureStyle)
                     feature.setStyle(tilesetFeatureStyle); // Explicitly set default style
                }
            } else {
                 // Feature is not visible, set style to null
                 feature.setStyle(null);
            }

            const listItem = document.createElement('div');
            listItem.dataset.featureId = featureId;
            listItem.style.display = 'flex'; // Use flexbox for alignment
            listItem.style.alignItems = 'center';
            // listItem.style.justifyContent = 'space-between'; // Removed for left alignment

            // Checkbox for visibility
            const visibilityCheckbox = document.createElement('input');
            visibilityCheckbox.type = 'checkbox';
            visibilityCheckbox.checked = isVisible; // Use the isVisible property
            visibilityCheckbox.title = `Toggle visibility of "${tilesetName}"`;
            visibilityCheckbox.classList.add('tileset-visibility-toggle'); // Add class for event listener
            visibilityCheckbox.dataset.featureId = featureId; // Link checkbox to feature
            visibilityCheckbox.style.marginRight = '5px'; // Add margin after checkbox
            // visibilityCheckbox.style.marginLeft = '5px'; // Removed
            // listItem.appendChild(visibilityCheckbox); // Append later

            // Span for the name (to allow clicking for zoom)
            const nameSpan = document.createElement('span');
            nameSpan.textContent = tilesetName;
            nameSpan.title = `Click to zoom to "${tilesetName}"`;
            nameSpan.style.cursor = 'pointer'; // Indicate clickable
            nameSpan.style.flexGrow = '1'; // Allow name to take up space
            nameSpan.addEventListener('click', () => {
                const clickedFeature = targetSource.getFeatureById(featureId);
                if (clickedFeature) {
                    map.getView().fit(clickedFeature.getGeometry().getExtent(), { padding: [50, 50, 50, 50], duration: 500 });
                }
            });

            // --- Define Buttons ---
            // Add Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️'; // Pencil icon
            editBtn.classList.add('settings-btn-small'); // Reuse style
            editBtn.title = `Edit name for \"${tilesetName}\"`;
            editBtn.style.marginLeft = '5px'; // Space after name
            editBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent zoom
                editTilesetName(featureId, nameSpan); // Call new function
            });

            // Add Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️'; // Trash can icon
            deleteBtn.classList.add('settings-btn-small'); // Use existing style if available
            deleteBtn.title = `Delete tileset \"${tilesetName}\"`;
            deleteBtn.style.marginLeft = '5px'; // Space after edit button
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent zoom or other parent actions
                // Confirmation dialog before deleting
                if (confirm(`Are you sure you want to delete the tileset \"${tilesetName}\"?`)) {
                    deleteTileset(featureId); // Call the delete function
                }
            });

            // --- Append Elements in Order ---
            // Append Name First
            listItem.appendChild(nameSpan);
            // Append Edit Button Second
            listItem.appendChild(editBtn);
            // Append Delete Button Third
            listItem.appendChild(deleteBtn);
            // Append Checkbox Fourth
            listItem.appendChild(visibilityCheckbox);
            // Append the completed list item to the main list div
            tilesetListDiv.appendChild(listItem);
        }); // End of tilesetFeatures.forEach loop
    } // End of populateTilesetList


    // --- Tileset Name Editing ---
    // --- Tileset Name Editing ---
    function editTilesetName(featureId, nameSpanElement) {
        const layer = userLayers[selectedLayerId]?.layer;
        if (!layer) return;
        const feature = layer.getSource().getFeatureById(featureId);
        if (!feature) return;

        const currentName = feature.get('tilesetName') || 'Unnamed Tileset';
        const newName = prompt(`Enter new name for tileset \"${currentName}\":`, currentName);

        if (newName && newName.trim() !== '' && newName !== currentName) {
            const trimmedName = newName.trim();
            feature.set('tilesetName', trimmedName);
            nameSpanElement.textContent = trimmedName; // Update the list item text
            nameSpanElement.title = `Click to zoom to \"${trimmedName}\"`; // Update tooltip
            // If this tileset is currently selected for color editing, update that too
            if (currentEditingFeatureId === featureId && detailsTilesetNameInput) { // Check if modal element exists
                detailsTilesetNameInput.value = trimmedName; // Update modal name input too
            }
            console.log(`Renamed tileset ${featureId} to \"${trimmedName}\"`);
        } else if (newName === '') {
            alert("Tileset name cannot be empty.");
        }
    }

    // --- Tileset Actions ---

    function deleteTileset(featureId) {
        console.log(`Attempting to delete tileset ${featureId}`);
        if (!selectedLayerId || !userLayers[selectedLayerId]) {
            console.error("Cannot delete tileset: No layer selected or layer not found.");
            alert("Error: Please select the layer containing the tileset first.");
            return;
        }

        const targetLayer = userLayers[selectedLayerId].layer;
        const targetSource = targetLayer.getSource();
        const featureToDelete = targetSource.getFeatureById(featureId);

        if (featureToDelete) {
            try {
                targetSource.removeFeature(featureToDelete);
                console.log(`Tileset ${featureId} removed successfully from layer ${selectedLayerId}.`);
                // Decrement tileset count for the layer
                if (userLayers[selectedLayerId].tilesetCount > 0) {
                     userLayers[selectedLayerId].tilesetCount--;
                }
                // Refresh the list to show the change
                populateTilesetList(selectedLayerId);
                 // Also clear highlight and color picker if the deleted feature was highlighted
                 if (currentEditingFeatureId === featureId) {
                     highlightSource.clear();
                     // inlineColorPickerContainer.style.display = 'none'; // Old picker removed
                     tilesetDetailsModal.style.display = 'none'; // Close details modal too
                     currentEditingFeatureId = null;
                 }
            } catch (error) {
                console.error(`Error removing feature ${featureId}:`, error);
                alert("An error occurred while trying to delete the tileset.");
            }
        } else {
            console.warn(`Could not find tileset ${featureId} on layer ${selectedLayerId} to delete.`);
            populateTilesetList(selectedLayerId); // Refresh list anyway
        }
    }

    // --- Tileset Visibility Toggle Logic ---
    tilesetListDiv.addEventListener('click', (event) => {
        const target = event.target;
        if (target.type === 'checkbox' && target.classList.contains('tileset-visibility-toggle')) {
            const featureId = target.dataset.featureId;
            const isVisible = target.checked;
            const currentLayerId = selectedLayerId; // Use the currently selected layer

            if (!currentLayerId || !userLayers[currentLayerId] || !featureId) {
                console.error("Could not toggle tileset visibility: Missing layer or feature ID.");
                return;
            }

            const targetSource = userLayers[currentLayerId].layer.getSource();
            const feature = targetSource.getFeatureById(featureId);

            if (feature) {
                // Update the feature's stored visibility state
                feature.set('isVisible', isVisible);

                if (isVisible) {
                    // Make visible: Apply original style (default or custom color)
                    const customColor = feature.get('color');
                    if (customColor) {
                        // Apply custom color style
                        feature.setStyle(new ol.style.Style({
                            stroke: new ol.style.Stroke({ color: customColor, width: 3 }) // Increased width
                        }));
                    } else {
                        // Apply default layer style (tilesetFeatureStyle)
                        // Setting null might work if the layer has a default style set,
                        // but explicitly setting the default style is safer.
                        feature.setStyle(tilesetFeatureStyle);
                    }
                    console.log(`Tileset ${featureId} made visible.`);
                } else {
                    // Make invisible: Set style to null
                    feature.setStyle(null);
                    console.log(`Tileset ${featureId} made invisible.`);
                }
            } else {
                console.error(`Could not find feature ${featureId} in layer ${currentLayerId} to toggle visibility.`);
            }
        }
    });

    selectionSource.on(['addfeature', 'removefeature', 'clear'], () => {
        updateSelectionActionsVisibility();
        updateSelectedTileCountDisplay(); // Call the new function too
    });

    let selectedLayerId = layer0Id; // Track the currently selected layer ID, default to Layer0

    // Function to add a layer item to the list UI
    function addLayerToList(layerId, layerName, isVisible) {
        // Remove the initial 'No layers' message if present
        const initialMsg = userLayerList.querySelector('small');
        if (initialMsg) initialMsg.remove();

        const layerItem = document.createElement('div');
        layerItem.classList.add('layer-item');
        layerItem.dataset.layerId = layerId;

        // Checkbox first for alignment
        const visibilityCheckbox = document.createElement('input');
        visibilityCheckbox.type = 'checkbox';
        visibilityCheckbox.checked = isVisible;
        visibilityCheckbox.title = 'Toggle layer visibility';
        // Add margin for spacing
        visibilityCheckbox.style.marginRight = '5px';
        layerItem.appendChild(visibilityCheckbox);

        // Then the name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = layerName;
        nameSpan.style.flexGrow = '1'; // Allow name to take space
        layerItem.appendChild(nameSpan);

        // Add settings button only for non-default layers
        if (layerId !== layer0Id) {
            const settingsBtn = document.createElement('button');
            settingsBtn.textContent = '⚙️';
            settingsBtn.classList.add('settings-btn-small');
            settingsBtn.title = `Settings for layer "${layerName}"`;
            settingsBtn.style.marginLeft = '5px'; // Add some space
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent layer selection when clicking button
                openLayerSettingsModal(layerId);
            });
            layerItem.appendChild(settingsBtn);
        }

        userLayerList.appendChild(layerItem);
    }

    // Function to visually select a layer in the list
    function selectLayerInList(layerId) {
        // Remove 'selected' class from all items
        userLayerList.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('selected');
        });
        // Add 'selected' class to the target item
        const targetItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
        if (targetItem) {
            targetItem.classList.add('selected');
        }
    }

    // Event listener for the user layer list
    userLayerList.addEventListener('click', (event) => {
        const targetItem = event.target.closest('.layer-item');
        if (!targetItem) return; // Clicked outside an item

        const layerId = targetItem.dataset.layerId;

        // Handle checkbox click separately
        if (event.target.type === 'checkbox') {
            const isVisible = event.target.checked;
            if (userLayers[layerId]) {
                 // Check if the layer itself exists before setting visibility
                 if (userLayers[layerId].layer) {
                     userLayers[layerId].layer.setVisible(isVisible);
                     console.log(`Layer ${layerId} visibility set to ${isVisible}`);
                 } else {
                     console.warn(`Layer object not found for layer ID: ${layerId}`);
                 }
            }
            return; // Don't process as layer selection
        }

        // Handle settings button click (already handled by its own listener)
        if (event.target.classList.contains('settings-btn-small')) {
            return;
        }

        // Otherwise, handle layer selection
        if (layerId && layerId !== selectedLayerId) {
            console.log(`Selected layer: ${layerId}`);
            selectedLayerId = layerId;
            selectLayerInList(layerId); // Update UI selection
            populateTilesetList(layerId); // Update tileset list for the new layer
            updateSelectionActionsVisibility(); // Update save button state
            highlightSource.clear(); // Clear highlight when switching layers
            // inlineColorPickerContainer.style.display = 'none'; // Old picker removed
            tilesetDetailsModal.style.display = 'none'; // Close details modal too
            currentEditingFeatureId = null; // Clear tracked feature
        }
    });

    // --- Create New User Layer Logic ---
    let layerCounter = 1; // Start counter for unique IDs
    createLayerBtn.addEventListener('click', () => {
        const newLayerName = prompt("Enter name for the new layer:", `Layer ${layerCounter}`);
        if (!newLayerName) return; // User cancelled

        const newLayerId = `layer-${layerCounter++}`;
        const newSource = new ol.source.Vector();
        const newLayer = new ol.layer.Vector({
            source: newSource,
            style: tilesetFeatureStyle, // Use the default tileset style
            title: newLayerId,
            zIndex: 2, // Same zIndex as other user layers
            visible: true // New layers are visible by default
        });
        newLayer.set('userLayerName', newLayerName); // Store display name

        userLayers[newLayerId] = { name: newLayerName, layer: newLayer, tilesetCount: 0 };
        map.addLayer(newLayer);
        addLayerToList(newLayerId, newLayerName, true); // Add to UI list

        // Automatically select the newly created layer
        selectedLayerId = newLayerId;
        selectLayerInList(newLayerId);
        populateTilesetList(newLayerId);
        updateSelectionActionsVisibility();
        highlightSource.clear(); // Clear highlight
        // inlineColorPickerContainer.style.display = 'none'; // Old picker removed
        tilesetDetailsModal.style.display = 'none'; // Close details modal too
        currentEditingFeatureId = null; // Clear tracked feature

        console.log(`Created and selected new layer: ${newLayerName} (ID: ${newLayerId})`);
    });

    // --- Save Selection Logic ---
    let tilesetFeatureCounter = 0; // Global counter for unique feature IDs

    saveSelectionBtn.addEventListener('click', () => {
        const selectedFeatures = selectionSource.getFeatures();
        if (selectedFeatures.length === 0) { alert("No tiles selected."); return; }
        if (!selectedLayerId || !userLayers[selectedLayerId]) { alert("No user layer selected."); return; }

        const tilesetName = tilesetNameInput.value.trim() || `Tileset ${userLayers[selectedLayerId].tilesetCount + 1}`;
        const targetSource = userLayers[selectedLayerId].layer.getSource();

        // Combine geometries of selected tiles into one MultiPolygon
        const geometries = selectedFeatures.map(f => f.getGeometry());
        // Simple union approach (might be slow for many features, consider turf.js for complex cases)
        let combinedGeometry = geometries[0]; // Start with the first geometry
        for (let i = 1; i < geometries.length; i++) {
            // This basic approach just takes the last geometry's extent for simplicity.
            // A true geometric union is more complex. For visualization, often just
            // storing the individual tile IDs is enough.
            // For now, we'll just use the extent of all selected features.
        }
        // Calculate the bounding extent of all selected features
        const combinedExtent = ol.extent.createEmpty();
        selectedFeatures.forEach(f => ol.extent.extend(combinedExtent, f.getGeometry().getExtent()));
        const combinedPolygon = ol.geom.Polygon.fromExtent(combinedExtent);


        // Store the individual tile IDs
        const tileIds = selectedFeatures.map(f => f.getId());

        // Create a single feature representing the tileset
        const tilesetFeature = new ol.Feature({
            geometry: combinedPolygon, // Use the combined extent polygon
            tilesetName: tilesetName,
            tileIds: tileIds, // Store the IDs of the included tiles
            isVisible: true, // Tilesets are visible by default
            color: null // Default color (will use layer style)
        });

        // Assign a unique ID to the tileset feature itself
        const featureId = `tileset-${tilesetFeatureCounter++}`;
        tilesetFeature.setId(featureId);

        targetSource.addFeature(tilesetFeature);
        userLayers[selectedLayerId].tilesetCount = (userLayers[selectedLayerId].tilesetCount || 0) + 1; // Increment counter

        selectionSource.clear(); // Clear the temporary selection
        populateTilesetList(selectedLayerId); // Refresh the list
        updateSelectionActionsVisibility(); // Hide save controls etc.
        tilesetNameInput.value = ''; // Clear input

        console.log(`Saved ${tileIds.length} tiles as "${tilesetName}" (ID: ${featureId}) to layer ${selectedLayerId}`);
    });


    // --- Clear Selection Logic ---
    clearSelectionBtn.addEventListener('click', () => {
        selectionSource.clear();
        highlightSource.clear(); // Also clear highlight
        // inlineColorPickerContainer.style.display = 'none'; // Old picker removed
        tilesetDetailsModal.style.display = 'none'; // Close details modal too
        currentEditingFeatureId = null; // Clear tracked feature
    });

    // --- Interaction Mode Switching ---
    interactionModeBtn.addEventListener('click', () => {
        if (currentInteractionMode === 'select') {
            currentInteractionMode = 'pan';
            interactionModeBtn.textContent = 'Mode: Pan Map';
            dragBoxInteraction.setActive(false);
            map.removeInteraction(dragBoxInteraction); // Completely remove to ensure panning works
            if (mapElement) mapElement.style.cursor = 'grab'; // Change cursor - FIXED
            console.log("Switched to Pan mode");
        } else {
            currentInteractionMode = 'select';
            interactionModeBtn.textContent = 'Mode: Select Tiles';
            map.addInteraction(dragBoxInteraction); // Re-add interaction
            dragBoxInteraction.setActive(true);
            if (mapElement) mapElement.style.cursor = 'crosshair'; // Change cursor back - FIXED
            console.log("Switched to Select mode");
        }
    });

    // --- Old Inline Color Picker Logic Removed ---

    // --- Layer Settings Modal Logic (Placeholder/Example) ---
    function openLayerSettingsModal(layerId) {
        const layerInfo = userLayers[layerId];
        if (!layerInfo) return;

        // Example: Simple prompt for renaming
        const newName = prompt(`Enter new name for layer "${layerInfo.name}":`, layerInfo.name);
        if (newName && newName.trim() !== layerInfo.name) {
            layerInfo.name = newName.trim();
            layerInfo.layer.set('userLayerName', layerInfo.name); // Update internal property if needed

            // Update the name in the UI list
            const listItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
            if (listItem) {
                const nameSpan = listItem.querySelector('span');
                if (nameSpan) nameSpan.textContent = layerInfo.name;
                // Update settings button title too
                const settingsBtn = listItem.querySelector('.settings-btn-small');
                if (settingsBtn) settingsBtn.title = `Settings for layer "${layerInfo.name}"`;
            }
            console.log(`Renamed layer ${layerId} to "${layerInfo.name}"`);
        }

        // Example: Simple confirm for deletion
        if (confirm(`Are you sure you want to delete layer "${layerInfo.name}"? This cannot be undone.`)) {
            // Remove layer from map
            map.removeLayer(layerInfo.layer);
            // Remove from internal tracking
            delete userLayers[layerId];
            // Remove from UI list
            const listItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
            if (listItem) listItem.remove();

            // If the deleted layer was selected, select the default layer
            if (selectedLayerId === layerId) {
                selectedLayerId = layer0Id;
                selectLayerInList(layer0Id);
                populateTilesetList(layer0Id);
                updateSelectionActionsVisibility();
                highlightSource.clear();
                // inlineColorPickerContainer.style.display = 'none'; // Old picker removed
                tilesetDetailsModal.style.display = 'none'; // Close details modal too
                currentEditingFeatureId = null;
            }

            // Add back the 'No layers' message if the list is now empty (excluding default)
            if (Object.keys(userLayers).length === 1 && userLayers[layer0Id]) {
                 const existingSmall = userLayerList.querySelector('small');
                 if (!existingSmall) {
                     const noLayersMsg = document.createElement('small');
                     noLayersMsg.innerHTML = '<i>No layers created yet.</i>';
                     userLayerList.appendChild(noLayersMsg);
                 }
            }


            console.log(`Deleted layer ${layerId} ("${layerInfo.name}")`);
        }
    }


    // --- Initial UI Setup ---
    addLayerToList(layer0Id, layer0Name, true); // Add default layer to list
    selectLayerInList(layer0Id); // Select default layer visually
    populateTilesetList(layer0Id); // Populate tilesets for default layer
    updateSelectionActionsVisibility(); // Initial state for save controls
    updateSelectedTileCountDisplay(); // Initial state for counter/clear button
    if (mapElement) mapElement.style.cursor = 'crosshair'; // Initial cursor for select mode - FIXED


    // --- Helper to find the feature being edited ---
    function findCurrentFeature() {
        if (!selectedLayerId || !userLayers[selectedLayerId] || !currentEditingFeatureId) {
            return null;
        }
        const source = userLayers[selectedLayerId].layer.getSource();
        return source.getFeatureById(currentEditingFeatureId);
    }


    // --- Make Panels Draggable --- (Moved to end)
    makeDraggable(document.getElementById('layer-switcher'));
    makeDraggable(document.getElementById('user-layers-panel'));
    makeDraggable(document.getElementById('app-controls'));
    makeDraggable(document.getElementById('tileset-details-modal')); // Make the details panel draggable too

    // --- Minimize/Expand Panel Logic --- (Moved to end)
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('minimize-btn')) {
            const panel = event.target.closest('.control-panel'); // Find the parent panel
            if (panel) {
                panel.classList.toggle('minimized');
                // Change button text based on state
                event.target.textContent = panel.classList.contains('minimized') ? '+' : '-';
                event.target.title = panel.classList.contains('minimized') ? 'Expand' : 'Minimize';
            }
        }
    });


}); // End DOMContentLoaded
