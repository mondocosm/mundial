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
    const layer0Name = 'Layer 0'; // Changed name
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
        view: new ol.View({ center: ol.proj.fromLonLat([166.523895, -11.261582]), zoom: 13, maxZoom: TILE_SELECTION_ZOOM + 1, minZoom: 0 }),
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
    const createLayerBtn = document.getElementById('create-layer-btn'); // The '+' button in Layers panel header
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
    const detailsOpacityInput = document.getElementById('details-tileset-opacity'); // Added reference for opacity input
    const detailsOpacityValueSpan = document.getElementById('details-tileset-opacity-value'); // Added reference for opacity value span
    const toggleColorModeBtn = document.getElementById('toggle-color-mode-btn'); // Added reference for toggle button
    const colorPickerLabel = document.getElementById('color-picker-label'); // Added reference for color picker label

    // Removed references for old buttons:
    // const detailsSaveBtn = document.getElementById('details-save-btn');
    // const detailsMoreSettingsBtn = document.getElementById('details-more-settings-btn');

    // --- State for Color Editing Mode ---
    let colorEditingMode = 'stroke'; // 'stroke' or 'fill'

    // Function to highlight a specific tileset group in the list (Moved here to be defined before use)
    function highlightListItem(groupId) {
        // Remove highlight from all items first
        tilesetListDiv.querySelectorAll('.tileset-item').forEach(item => {
            item.classList.remove('highlighted');
        });

        // Add highlight to the specific item
        const listItem = tilesetListDiv.querySelector(`.layer-item[data-tileset-group-id="${groupId}"]`);
        if (listItem) {
            listItem.classList.add('highlighted');
            // Optional: scroll into view
            listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }


    // --- Tileset Details Modal Logic ---
    let currentEditingGroupId = null; // Track which *group* is being edited in the modal

    function openTilesetDetailsModal(firstFeatureOfGroup) {
        if (!firstFeatureOfGroup) return;
        const groupId = firstFeatureOfGroup.get('tilesetGroupId');
        if (!groupId) {
            console.warn("Cannot open modal: Feature is not part of a group.");
            return;
        }
        currentEditingGroupId = groupId; // Store the GROUP ID

        // Find all features in the group
        const layer = userLayers[selectedLayerId]?.layer;
        if (!layer) return;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        const tileCount = groupFeatures.length; // Get the count

        if (tileCount === 0) {
             console.warn(`No features found for group ${groupId} when opening modal.`);
             currentEditingGroupId = null;
             return;
        }

        // Populate fields using the first feature's data (assuming consistency within group)
        detailsTilesetNameInput.value = firstFeatureOfGroup.get('tilesetName') || '';
        const strokeColor = firstFeatureOfGroup.get('color') || '#008080'; // Default to teal (stroke color)
        detailsColorPicker.value = strokeColor; // Set color picker to stroke color initially
        
        // Populate new Fill Color and Opacity controls
        // Make default fill color match stroke color if not set
        const fillColor = firstFeatureOfGroup.get('fillColor') || strokeColor;
        // Set default opacity to 0.25 if not set
        const opacity = firstFeatureOfGroup.get('opacity') !== undefined ? firstFeatureOfGroup.get('opacity') : 0.25;
        
        const detailsOpacityInput = document.getElementById('details-tileset-opacity');
        const detailsOpacityValueSpan = document.getElementById('details-tileset-opacity-value');

        // Note: Fill color input is removed from HTML, so no need to set its value here.

        if (detailsOpacityInput) detailsOpacityInput.value = opacity;
        if (detailsOpacityValueSpan) detailsOpacityValueSpan.textContent = opacity.toFixed(2);

        // Ensure color picker label is correct initially
        if (colorPickerLabel) colorPickerLabel.textContent = 'Stroke Color:';
        colorEditingMode = 'stroke'; // Reset mode to stroke when opening modal


        detailsTilesetImageUrlInput.value = firstFeatureOfGroup.get('imageUrl') || '';
        detailsTilesetLinkInput.value = firstFeatureOfGroup.get('linkUrl') || '';
        detailsTilesetTagsTextarea.value = firstFeatureOfGroup.get('tags') || '';

        // Display image if URL exists
        if (detailsTilesetImageUrlInput.value) {
            detailsTilesetImage.src = detailsTilesetImageUrlInput.value;
            detailsTilesetImage.style.display = 'block';
        } else {
            detailsTilesetImage.style.display = 'none';
            detailsTilesetImage.src = '';
        }

        // Calculate and display center coordinates of the *entire group*
        const groupExtent = ol.extent.createEmpty();
        groupFeatures.forEach(f => ol.extent.extend(groupExtent, f.getGeometry().getExtent()));
        if (!ol.extent.isEmpty(groupExtent)) {
            const center = ol.extent.getCenter(groupExtent);
            const centerLonLat = ol.proj.toLonLat(center); // Convert to Lon/Lat
            detailsTilesetCoordsSpan.textContent = `${centerLonLat[1].toFixed(6)}, ${centerLonLat[0].toFixed(6)}`; // Lat, Lon format
        } else {
             detailsTilesetCoordsSpan.textContent = 'N/A';
        }

        // Display Tile Count
        const tileCountSpan = document.getElementById('details-tileset-tile-count');
        if (tileCountSpan) {
            tileCountSpan.textContent = tileCount;
        }


        // Placeholder for location info (requires reverse geocoding API)
        detailsLocationInfoSpan.textContent = 'Lookup not implemented';

        // Show the modal
        tilesetDetailsModal.style.display = 'block';
    }

    // Close modal logic
    closeTilesetDetailsModalBtn.addEventListener('click', () => {
        tilesetDetailsModal.style.display = 'none';
        currentEditingGroupId = null; // Clear the editing state
    });
    // Close modal if clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === tilesetDetailsModal) {
            tilesetDetailsModal.style.display = 'none';
            currentEditingGroupId = null; // Clear the editing state
        }
    });

    // Save changes from modal (REMOVED - Now handled by color picker input)
    // detailsSaveBtn.addEventListener('click', () => { ... });

    // --- Modal Input Change Handlers (Apply to Group) ---

    function applyGroupPropertyChange(propertyName, value) {
        if (!currentEditingGroupId || !selectedLayerId || !userLayers[selectedLayerId]) {
            console.warn(`Cannot update ${propertyName}: No group or layer context.`);
            return false;
        }
        const layer = userLayers[selectedLayerId].layer;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);

        if (groupFeatures.length === 0) {
            console.warn(`Cannot update ${propertyName}: No features found for group ${currentEditingGroupId}.`);
            return false;
        }

        groupFeatures.forEach(feature => {
            feature.set(propertyName, value);
        });
        console.log(`Updated ${propertyName} for group ${currentEditingGroupId} to "${value}"`);
        return true;
    }

    // Update Name (also updates list item if successful)
    detailsTilesetNameInput.addEventListener('change', (event) => {
        const newName = event.target.value.trim();
        if (newName === '') {
            alert("Tileset name cannot be empty.");
            // Revert input to original name? Requires fetching original name again.
            // For simplicity, we'll just prevent empty save for now.
            return;
        }
        if (applyGroupPropertyChange('tilesetName', newName)) {
            // Update the name in the list UI as well
            const listItem = tilesetListDiv.querySelector(`.layer-item[data-tileset-group-id="${currentEditingGroupId}"]`);
            if (listItem) {
                const nameSpan = listItem.querySelector('span');
                if (nameSpan) nameSpan.textContent = newName;
                // Update button tooltips too
                listItem.querySelectorAll('button').forEach(btn => {
                     if (btn.title.includes('Edit name')) btn.title = `Edit name for "${newName}"`;
                     if (btn.title.includes('Delete tileset')) btn.title = `Delete tileset "${newName}"`;
                });
                 const checkbox = listItem.querySelector('input[type="checkbox"]');
                 if (checkbox) checkbox.title = `Toggle visibility of "${newName}"`;
            }
        }
    });


    // Update Image URL and Preview
    detailsTilesetImageUrlInput.addEventListener('change', (event) => {
        const url = event.target.value.trim();
        if (applyGroupPropertyChange('imageUrl', url)) {
            // Update preview
            if (url) {
                detailsTilesetImage.src = url;
                detailsTilesetImage.style.display = 'block';
            } else {
                detailsTilesetImage.style.display = 'none';
                detailsTilesetImage.src = '';
            }
        }
    });

    // Update Link URL
    detailsTilesetLinkInput.addEventListener('change', (event) => {
        applyGroupPropertyChange('linkUrl', event.target.value.trim());
    });

    // Update Tags
    detailsTilesetTagsTextarea.addEventListener('change', (event) => {
        applyGroupPropertyChange('tags', event.target.value.trim());
    });

    // Update Link URL
    detailsTilesetLinkInput.addEventListener('change', (event) => {
        applyGroupPropertyChange('linkUrl', event.target.value.trim());
    });

    // Update Tags
    detailsTilesetTagsTextarea.addEventListener('change', (event) => {
        applyGroupPropertyChange('tags', event.target.value.trim());
    });

    // --- Style Application Function ---
    function applyTilesetFeatureStyle(feature) {
        const strokeColor = feature.get('color') || '#008080'; // Default teal stroke
        // Use stroke color as default fill color if not set
        const fillColor = feature.get('fillColor') || strokeColor;
        // Set default opacity to 0.25 if not set
        const opacity = feature.get('opacity') !== undefined ? feature.get('opacity') : 0.25;

        // Convert fill color to RGBA array and apply opacity
        const fillColorArray = ol.color.asArray(fillColor);
        fillColorArray[3] = opacity; // Set the alpha channel

        feature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({ color: strokeColor, width: 3 }),
            fill: new ol.style.Fill({ color: ol.color.asString(fillColorArray) })
        }));
    }


    // --- Instant Color Update Logic (Stroke) ---
    detailsColorPicker.addEventListener('input', (event) => {
        if (!currentEditingGroupId || !selectedLayerId || !userLayers[selectedLayerId]) {
            console.warn("Cannot update color: No group or layer context.");
            return;
        }
        const layer = userLayers[selectedLayerId].layer;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);

        if (groupFeatures.length === 0) {
            console.warn(`Cannot update color: No features found for group ${currentEditingGroupId}.`);
            return;
        }

        const newColor = event.target.value;
        const propertyToUpdate = colorEditingMode === 'stroke' ? 'color' : 'fillColor';

        // Apply color and update style for all features in the group
        groupFeatures.forEach(feature => {
            feature.set(propertyToUpdate, newColor); // Store the color on the feature

            // Update style immediately only if the group (and thus the feature) is visible
            if (feature.get('isVisible') !== false) {
                 applyTilesetFeatureStyle(feature); // Re-apply style with updated color
            }
        });

        console.log(`Updated ${colorEditingMode} color for group ${currentEditingGroupId} to ${newColor}`);
    });


    // --- Instant Opacity Update Logic ---
    if (detailsOpacityInput && detailsOpacityValueSpan) {
        detailsOpacityInput.addEventListener('input', (event) => {
            if (!currentEditingGroupId || !selectedLayerId || !userLayers[selectedLayerId]) {
                console.warn("Cannot update opacity: No group or layer context.");
                return;
            }
            const layer = userLayers[selectedLayerId].layer;
            const source = layer.getSource();
            const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);

            if (groupFeatures.length === 0) {
                console.warn(`Cannot update opacity: No features found for group ${currentEditingGroupId}.`);
                return;
            }

            const newOpacity = parseFloat(event.target.value); // Get value as number

            // Update displayed value
            detailsOpacityValueSpan.textContent = newOpacity.toFixed(2);

            // Apply opacity and update style for all features in the group
            groupFeatures.forEach(feature => {
                feature.set('opacity', newOpacity); // Store the opacity on the feature

                // Update style immediately only if the group (and thus the feature) is visible
                if (feature.get('isVisible') !== false) {
                     applyTilesetFeatureStyle(feature); // Re-apply style with updated opacity
                }
            });

            console.log(`Updated opacity for group ${currentEditingGroupId} to ${newOpacity}`);
        });
    }

    // --- Toggle Color Editing Mode Logic ---
    if (toggleColorModeBtn && colorPickerLabel && detailsColorPicker) {
        toggleColorModeBtn.addEventListener('click', () => {
            if (!currentEditingGroupId || !selectedLayerId || !userLayers[selectedLayerId]) {
                console.warn("Cannot toggle color mode: No group or layer context.");
                return;
            }

            // Get the first feature to read current colors
            const layer = userLayers[selectedLayerId].layer;
            const source = layer.getSource();
            const firstFeatureOfGroup = source.getFeatures().find(f => f.get('tilesetGroupId') === currentEditingGroupId);

            if (!firstFeatureOfGroup) {
                 console.warn(`Cannot toggle color mode: No features found for group ${currentEditingGroupId}.`);
                 return;
            }


            if (colorEditingMode === 'stroke') {
                colorEditingMode = 'fill';
                colorPickerLabel.textContent = 'Fill Color:';
                // Set color picker to current fill color
                detailsColorPicker.value = firstFeatureOfGroup.get('fillColor') || '#ff0000'; // Default red fill
            } else {
                colorEditingMode = 'stroke';
                colorPickerLabel.textContent = 'Stroke Color:';
                // Set color picker to current stroke color
                detailsColorPicker.value = firstFeatureOfGroup.get('color') || '#008080'; // Default teal stroke
            }
            console.log(`Color editing mode toggled to: ${colorEditingMode}`);
        });
    }


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
                const existingTileFeatures = targetSource.getFeatures(); // Get all features (saved tiles)
                for (const existingFeature of existingTileFeatures) {
                    // Check if any existing feature has the same original tileId
                    if (existingFeature.get('tileId') === tileId) {
                        // Optional: alert or console log
                        // console.log(`Tile ${tileId} already belongs to tileset "${existingFeature.get('tilesetName') || 'Unnamed'}"`);
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
            
                // Function to highlight a specific tileset group in the list
                function highlightListItem(groupId) {
                    // Remove highlight from all items first
                    tilesetListDiv.querySelectorAll('.tileset-item').forEach(item => {
                        item.classList.remove('highlighted');
                    });
            
                    // Add highlight to the specific item
                    const listItem = tilesetListDiv.querySelector(`.layer-item[data-tileset-group-id="${groupId}"]`);
                    if (listItem) {
                        listItem.classList.add('highlighted');
                        // Optional: scroll into view
                        listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            
                const clickSelectHandler = function (evt) {
                    if (currentInteractionMode !== 'select' || Math.floor(map.getView().getZoom()) < GRID_VISIBILITY_MIN_ZOOM) return;
            
                let clickedExistingTilesetGroup = false;
                // Check if click hit an existing tileset feature on the active layer
                map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                    if (clickedExistingTilesetGroup) return; // Process only the first hit group
            
                    const groupId = feature.get('tilesetGroupId');
                    const tilesetName = feature.get('tilesetName');
            
                    // Check if the feature belongs to the currently selected user layer AND is part of a group
                    if (layer && layer.get('title') === selectedLayerId && groupId && tilesetName) {
                        clickedExistingTilesetGroup = true;
                        console.log(`Clicked tile belonging to group: ${tilesetName} (Group ID: ${groupId})`);
            
                        // Find all features belonging to this group
                        const source = layer.getSource();
                        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
            
                        // Highlight *all* features in the group
                        highlightSource.clear(); // Clear previous highlight
                        const highlightFeatures = groupFeatures.map(f => new ol.Feature(f.getGeometry().clone()));
                        if (highlightFeatures.length > 0) {
                            highlightSource.addFeatures(highlightFeatures);
                        }
            
                        // Open the details modal using the *first* feature of the group
                        // The modal logic will need to know it's editing a group.
                        // We'll pass the first feature, and the modal logic can retrieve the group ID from it.
                        if (groupFeatures.length > 0) {
                            openTilesetDetailsModal(groupFeatures[0]); // Pass the first feature
                            // currentEditingGroupId is set inside openTilesetDetailsModal
                            // highlightListItem(groupId); // Highlight the corresponding list item (Temporarily commented out to fix ReferenceError)
                        }
                    }
                }, {
                    layerFilter: (layer) => layer === userLayers[selectedLayerId]?.layer, // Only check the active user layer
                    hitTolerance: 3 // Adjust tolerance as needed
                }); // <-- Added missing parenthesis
            
                // If an existing tileset group was clicked, don't proceed with individual tile selection
                if (clickedExistingTilesetGroup) {
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
                const existingTileFeatures = targetSource.getFeatures(); // Get all saved tile features
                const allExistingOriginalTileIds = new Set(); // Store the *original* tile IDs from saved features

                existingTileFeatures.forEach(existingFeature => {
                    const originalTileId = existingFeature.get('tileId'); // Get the stored original tile ID
                    if (originalTileId) {
                        allExistingOriginalTileIds.add(originalTileId);
                    }
                });

                if (allExistingOriginalTileIds.size > 0) {
                    // Filter the featuresToAdd: keep only those whose ID is NOT in the set of existing original tile IDs
                    filteredFeaturesToAdd = featuresToAdd.filter(feature => !allExistingOriginalTileIds.has(feature.getId()));

                    // Optional: Alert if some were filtered out
                    if (filteredFeaturesToAdd.length < featuresToAdd.length) {
                         console.log(`${featuresToAdd.length - filteredFeaturesToAdd.length} tiles were not selected because they already belong to a saved tileset on this layer.`);
                        // alert('Some tiles were not selected because they already belong to a saved tileset on this layer.');
                    }
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
        // A layer must be selected (Layer 0 is selected by default)
        const userLayerSelected = selectedLayerId !== null;

        // Show selection actions if tiles are selected AND a layer is selected
        const showActions = hasSelection && userLayerSelected;
        selectionActionsDiv.style.display = showActions ? 'block' : 'none';
        tilesetNameInput.style.display = showActions ? 'block' : 'none';

        // Disable save button only if no selection or no layer selected
        saveSelectionBtn.disabled = !showActions;
        saveSelectionBtn.title = "Save selected tiles to the current layer"; // Reset title


        // Pre-fill default tileset name if actions are shown and layer exists
        if (showActions && userLayers[selectedLayerId]) {
            const currentCount = userLayers[selectedLayerId].tilesetCount || 0;
            tilesetNameInput.value = `Tileset ${currentCount + 1}`;
        } else {
            tilesetNameInput.value = ''; // Clear if actions not shown
        }

        // clearSelectionBtn visibility/disabled state is handled by updateSelectedTileCountDisplay
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
        tilesetListDiv.innerHTML = ''; // Clear existing list
        if (!layerId || !userLayers[layerId]) {
            tilesetListDiv.innerHTML = '<small><i>Select a layer above.</i></small>';
            return;
        }

        const targetSource = userLayers[layerId].layer.getSource();
        const allFeatures = targetSource.getFeatures();

        // Group features by tilesetGroupId
        const tilesetGroups = {}; // { groupId: { name: '...', features: [...] }, ... }
        allFeatures.forEach(feature => {
            const groupId = feature.get('tilesetGroupId');
            const tilesetName = feature.get('tilesetName');
            if (groupId && tilesetName) { // Only process features that are part of a group
                if (!tilesetGroups[groupId]) {
                    tilesetGroups[groupId] = { name: tilesetName, features: [] };
                }
                tilesetGroups[groupId].features.push(feature);
            }
        });

        if (Object.keys(tilesetGroups).length === 0) {
            tilesetListDiv.innerHTML = '<small><i>No tilesets saved.</i></small>';
            return;
        }

        // Create list items for each group
        Object.entries(tilesetGroups).forEach(([groupId, groupData]) => {
            const tilesetName = groupData.name;
            const groupFeatures = groupData.features;
            if (groupFeatures.length === 0) return; // Skip empty groups

            // Determine group visibility (visible if *any* feature in the group is visible)
            // Determine group color (use color of the first feature, assume they are the same)
            let isGroupVisible = groupFeatures.some(f => f.get('isVisible') !== false);
            let groupColor = groupFeatures[0].get('color'); // Use first feature's color

            // Apply style to all features in the group based on visibility/color
            groupFeatures.forEach(feature => {
                feature.set('isVisible', isGroupVisible); // Ensure consistency
                if (isGroupVisible) {
                    const styleColor = feature.get('color') || groupColor; // Use feature's own color if set, else group's
                    feature.setStyle(styleColor
                        ? new ol.style.Style({ stroke: new ol.style.Stroke({ color: styleColor, width: 3 }) }) // Use color
                        : tilesetFeatureStyle // Use default style
                    );
                } else {
                    feature.setStyle(null); // Hide feature
                }
            });


            const listItem = document.createElement('div');
            listItem.dataset.tilesetGroupId = groupId; // Store group ID
            listItem.style.display = 'flex';
            listItem.style.alignItems = 'center';

            // Span for the name (clickable for zoom)
            const nameSpan = document.createElement('span');
            nameSpan.textContent = tilesetName;
            nameSpan.title = `Click to zoom to "${tilesetName}"`;
            nameSpan.style.cursor = 'pointer';
            nameSpan.style.flexGrow = '1';
            nameSpan.addEventListener('click', () => {
                // 1. Highlight features on map
                highlightSource.clear(); // Clear previous highlight
                const highlightFeatures = groupFeatures.map(f => new ol.Feature(f.getGeometry().clone()));
                if (highlightFeatures.length > 0) {
                    highlightSource.addFeatures(highlightFeatures);
                }

                // 2. Open Details Modal
                if (groupFeatures.length > 0) {
                    openTilesetDetailsModal(groupFeatures[0]); // Pass the first feature
                }

                // 3. Highlight list item (call helper function)
                highlightListItem(groupId);

                // 4. Optionally zoom
                const groupExtent = ol.extent.createEmpty();
                groupFeatures.forEach(f => ol.extent.extend(groupExtent, f.getGeometry().getExtent()));
                if (!ol.extent.isEmpty(groupExtent)) {
                     map.getView().fit(groupExtent, { padding: [50, 50, 50, 50], duration: 500, maxZoom: TILE_SELECTION_ZOOM }); // Limit max zoom
                }
            });

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.classList.add('settings-btn-small');
            editBtn.title = `Edit name for "${tilesetName}"`;
            editBtn.style.marginLeft = '5px';
            editBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                // Pass groupId and nameSpan to the (modified) edit function
                editTilesetGroupName(groupId, nameSpan);
            });

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.classList.add('settings-btn-small');
            deleteBtn.title = `Delete tileset "${tilesetName}"`;
            deleteBtn.style.marginLeft = '5px';
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                if (confirm(`Are you sure you want to delete the tileset "${tilesetName}"?`)) {
                    // Pass groupId to the (modified) delete function
                    deleteTilesetGroup(groupId);

    // --- Tileset Group Actions (New) ---

    function editTilesetGroupName(groupId, nameSpanElement) {
        const layer = userLayers[selectedLayerId]?.layer;
        if (!layer) return;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);
        if (groupFeatures.length === 0) return;

        const currentName = groupFeatures[0].get('tilesetName') || 'Unnamed Tileset';
        const newName = prompt(`Enter new name for tileset group "${currentName}":`, currentName);

        if (newName && newName.trim() !== '' && newName !== currentName) {
            const trimmedName = newName.trim();
            groupFeatures.forEach(feature => {
                feature.set('tilesetName', trimmedName);
            });
            nameSpanElement.textContent = trimmedName; // Update the list item text
            nameSpanElement.title = `Click to zoom to "${trimmedName}"`; // Update tooltip

            // If this group is currently being edited in the modal, update the modal name
            const firstFeatureId = groupFeatures[0].getId();
            if (currentEditingFeatureId === firstFeatureId && detailsTilesetNameInput) {
                 detailsTilesetNameInput.value = trimmedName;
            }

            console.log(`Renamed tileset group ${groupId} to "${trimmedName}"`);
        } else if (newName === '') {
            alert("Tileset name cannot be empty.");
        }
    }

    function deleteTilesetGroup(groupId) {
        console.log(`Attempting to delete tileset group ${groupId}`);
        if (!selectedLayerId || !userLayers[selectedLayerId]) {
            console.error("Cannot delete tileset group: No layer selected or layer not found.");
            alert("Error: Please select the layer containing the tileset first.");
            return;
        }

        const targetLayer = userLayers[selectedLayerId].layer;
        const targetSource = targetLayer.getSource();
        const featuresToDelete = targetSource.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);

        if (featuresToDelete.length > 0) {
            try {
                featuresToDelete.forEach(feature => targetSource.removeFeature(feature));
                console.log(`Tileset group ${groupId} (${featuresToDelete.length} tiles) removed successfully from layer ${selectedLayerId}.`);

                // Decrement the main tileset count for the layer (used for default naming)
                if (userLayers[selectedLayerId].tilesetCount > 0) {
                     userLayers[selectedLayerId].tilesetCount--;
                }
                // Refresh the list to show the change
                populateTilesetList(selectedLayerId);

                 // Also clear highlight and modal if the deleted group was being edited
                 const firstFeatureId = featuresToDelete[0].getId(); // Check if the first feature was the one being edited
                 if (currentEditingFeatureId === firstFeatureId) {
                     highlightSource.clear();
                     tilesetDetailsModal.style.display = 'none';
                     currentEditingFeatureId = null;
                 }
            } catch (error) {
                console.error(`Error removing features for group ${groupId}:`, error);
                alert("An error occurred while trying to delete the tileset group.");
            }
        } else {
            console.warn(`Could not find any features for tileset group ${groupId} on layer ${selectedLayerId} to delete.`);
            populateTilesetList(selectedLayerId); // Refresh list anyway
        }
    }

    function toggleTilesetGroupVisibility(groupId, isVisible) {
        console.log(`Toggling visibility for group ${groupId} to ${isVisible}`);
        const layer = userLayers[selectedLayerId]?.layer;
        if (!layer) return;
        const source = layer.getSource();
        const groupFeatures = source.getFeatures().filter(f => f.get('tilesetGroupId') === groupId);

        if (groupFeatures.length > 0) {
            const groupColor = groupFeatures[0].get('color'); // Get color from first feature

            groupFeatures.forEach(feature => {
                feature.set('isVisible', isVisible); // Update stored visibility

                if (isVisible) {
                    // Make visible: Apply style (custom color or default)
                    const styleColor = feature.get('color') || groupColor; // Use feature's color or group's
                    feature.setStyle(styleColor
                        ? new ol.style.Style({ stroke: new ol.style.Stroke({ color: styleColor, width: 3 }) })
                        : tilesetFeatureStyle
                    );
                } else {
                    // Make invisible: Set style to null
                    feature.setStyle(null);
                }
            });
            console.log(`Visibility for group ${groupId} set to ${isVisible}`);
        } else {
             console.warn(`No features found for group ${groupId} to toggle visibility.`);
        }
        // No need to call populateTilesetList here, as the styles are updated directly.
    }


                }
            });

             // Visibility Checkbox
             const visibilityCheckbox = document.createElement('input');
             visibilityCheckbox.type = 'checkbox';
             visibilityCheckbox.checked = isGroupVisible;
             visibilityCheckbox.title = `Toggle visibility of "${tilesetName}"`;
             visibilityCheckbox.classList.add('tileset-visibility-toggle'); // Keep class for potential delegation

    // Function to highlight a specific tileset group in the list
    function highlightListItem(groupId) {
        // Remove highlight from all items first
        tilesetListDiv.querySelectorAll('.tileset-item').forEach(item => {
            item.classList.remove('highlighted');
        });
        // Add highlight to the target item
        const targetItem = tilesetListDiv.querySelector(`.tileset-item[data-tileset-group-id="${groupId}"]`);
        if (targetItem) {
            targetItem.classList.add('highlighted');
            // Optional: Scroll item into view
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }


             visibilityCheckbox.dataset.tilesetGroupId = groupId; // Link checkbox to group
             visibilityCheckbox.style.marginLeft = '5px'; // Add margin before checkbox
             visibilityCheckbox.addEventListener('change', (event) => {
                 const checked = event.target.checked;
                 const changedGroupId = event.target.dataset.tilesetGroupId;
                 toggleTilesetGroupVisibility(changedGroupId, checked);
             });


            // Append elements
            listItem.appendChild(nameSpan);
            listItem.appendChild(editBtn);
            listItem.appendChild(deleteBtn);
            listItem.appendChild(visibilityCheckbox); // Append checkbox last
            tilesetListDiv.appendChild(listItem);
        });
    } // End of populateTilesetList (Refactored)


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
    // --- Tileset Visibility Toggle Logic (Old - Handled by checkbox listener in populateTilesetList calling toggleTilesetGroupVisibility) ---
    /*
    tilesetListDiv.addEventListener('click', (event) => {
       // ... (old code for individual feature toggle) ...
    });
    */

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

        // Name Span (Append First)
        const nameSpan = document.createElement('span');
        nameSpan.textContent = layerName;
        nameSpan.style.flexGrow = '1'; // Allow name to take space
        layerItem.appendChild(nameSpan);

        // Add Edit/Delete/PublicToggle buttons *only* for non-default layers
        if (layerId !== layer0Id) {
            // Edit Button
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.classList.add('settings-btn-small');
            editBtn.title = `Edit name for layer "${layerName}"`;
            editBtn.style.marginLeft = '5px';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editLayerName(layerId, nameSpan);
            });
            layerItem.appendChild(editBtn);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.classList.add('settings-btn-small');
            deleteBtn.title = `Delete layer "${layerName}"`;
            deleteBtn.style.marginLeft = '5px';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteLayer(layerId);
            });
            layerItem.appendChild(deleteBtn);

            // Public/Private Toggle Button
            const privacyBtn = document.createElement('button');
            // Determine initial state (default to public for now)
            const isPublic = userLayers[layerId]?.isPublic !== false; // Assume public if not set
            privacyBtn.textContent = isPublic ? '🌐' : '🔒'; // Globe / Lock icons
            privacyBtn.classList.add('settings-btn-small', 'privacy-toggle-btn');
            privacyBtn.title = isPublic ? `Make layer "${layerName}" private` : `Make layer "${layerName}" public`;
            privacyBtn.style.marginLeft = '5px';
            privacyBtn.dataset.layerId = layerId; // Store layerId for listener
            // Listener is handled by delegation on userLayerList
            layerItem.appendChild(privacyBtn);
        } else {
             // For Layer0, add some padding to align with other rows that have buttons
             // Estimate width of 3 buttons + margins
             nameSpan.style.paddingRight = '80px'; // Adjust as needed
        }


        // Visibility Checkbox (Append Last for ALL layers)
        const visibilityCheckbox = document.createElement('input');
        visibilityCheckbox.type = 'checkbox';
        visibilityCheckbox.checked = isVisible;
        visibilityCheckbox.title = `Toggle visibility of "${layerName}"`;
        visibilityCheckbox.style.marginLeft = '5px';
        layerItem.appendChild(visibilityCheckbox);


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

    // --- Layer Edit/Delete Functions ---

    function editLayerName(layerId, nameSpanElement) {
        const layerInfo = userLayers[layerId];
        if (!layerInfo || layerId === layer0Id) {
            console.warn("Cannot edit name for non-existent or default layer:", layerId);
            return;
        }

        const currentName = layerInfo.name;
        const newName = prompt(`Enter new name for layer "${currentName}":`, currentName);

        if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
    // --- Layer Privacy Toggle Function ---
    function toggleLayerPrivacy(layerId, buttonElement) {
        const layerInfo = userLayers[layerId];
        if (!layerInfo || layerId === layer0Id) {
            console.warn("Cannot toggle privacy for non-existent or default layer:", layerId);
            return;
        }

        // Toggle the state (default to public if undefined)
        const currentIsPublic = layerInfo.isPublic !== false;
        const newIsPublic = !currentIsPublic;
        layerInfo.isPublic = newIsPublic; // Update internal state

        // Update button appearance and title
        buttonElement.textContent = newIsPublic ? '🌐' : '🔒';
        buttonElement.title = newIsPublic ? `Make layer "${layerInfo.name}" private` : `Make layer "${layerInfo.name}" public`;

        console.log(`Layer ${layerId} (${layerInfo.name}) set to ${newIsPublic ? 'Public' : 'Private'}`);
        // NOTE: Actual enforcement of public/private (e.g., during data saving/loading)
        // would need to be implemented elsewhere based on this 'isPublic' flag.
    }



            const trimmedName = newName.trim();
            // Update internal state
            layerInfo.name = trimmedName;
            layerInfo.layer.set('userLayerName', trimmedName);

            // Update UI list item
            nameSpanElement.textContent = trimmedName;
            const layerItem = nameSpanElement.closest('.layer-item');
            if (layerItem) {
                const editBtn = layerItem.querySelector('button[title*="Edit name"]');
                const deleteBtn = layerItem.querySelector('button[title*="Delete layer"]');
                const visibilityCheckbox = layerItem.querySelector('input[type="checkbox"]');
                if (editBtn) editBtn.title = `Edit name for layer "${trimmedName}"`;
                if (deleteBtn) deleteBtn.title = `Delete layer "${trimmedName}"`;
                if (visibilityCheckbox) visibilityCheckbox.title = `Toggle visibility of "${trimmedName}"`;
            }

            console.log(`Renamed layer ${layerId} to "${trimmedName}"`);
        } else if (newName === '') {
            alert("Layer name cannot be empty.");
        }
    }

    function deleteLayer(layerId) {
        const layerInfo = userLayers[layerId];
        if (!layerInfo || layerId === layer0Id) {
            console.warn("Cannot delete non-existent or default layer:", layerId);
            return;
        }

        if (confirm(`Are you sure you want to delete layer "${layerInfo.name}"? This will also delete all its tilesets and cannot be undone.`)) {
            try {
                // Remove layer from map
                map.removeLayer(layerInfo.layer);
                // Remove from internal tracking
                delete userLayers[layerId];
                // Remove from UI list
                const listItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
                if (listItem) listItem.remove();

                console.log(`Deleted layer ${layerId} ("${layerInfo.name}")`);

                // If the deleted layer was selected, select the default layer
                if (selectedLayerId === layerId) {
                    selectedLayerId = layer0Id; // Internal selection defaults to Layer0
                    // selectLayerInList(layer0Id); // Don't visually select Layer0
                    populateTilesetList(layer0Id); // Show Layer0's tilesets (likely none)
                    updateSelectionActionsVisibility();
                    highlightSource.clear();
                    tilesetDetailsModal.style.display = 'none';
                    currentEditingGroupId = null;
                    console.log("Selected layer deleted, defaulting to Layer0 internally.");
                }

                // Add back the 'No layers' message if the list is now empty
                if (userLayerList.querySelectorAll('.layer-item').length === 0) {
                    const existingSmall = userLayerList.querySelector('small');
                    if (!existingSmall) {
                        const noLayersMsg = document.createElement('small');
                        noLayersMsg.innerHTML = '<i>No layers created yet.</i>';
                        userLayerList.appendChild(noLayersMsg);
                    }
                }
            } catch (error) {
                console.error(`Error deleting layer ${layerId}:`, error);
                alert("An error occurred while deleting the layer.");
            }
        }
    }



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
        const featuresToAdd = [];
        const addedTileIds = []; // Keep track of added tile IDs

        // Generate a unique ID for this *group* of tiles being saved
        const tilesetGroupId = `tileset-group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        selectedFeatures.forEach(feature => {
            const tileId = feature.getId();
            // Clone the feature from the selection source
            const clonedFeature = feature.clone();
            // Assign a unique ID for the individual saved tile feature
            const featureId = `tileset-tile-${tilesetFeatureCounter++}`;
            clonedFeature.setId(featureId);

            // Set properties on the cloned feature
            clonedFeature.set('tilesetName', tilesetName);
            clonedFeature.set('tilesetGroupId', tilesetGroupId); // Add the group ID
            clonedFeature.set('tileId', tileId); // Store original tile ID if needed
            clonedFeature.set('isVisible', true); // Tilesets are visible by default
            clonedFeature.set('color', null); // Default color (will use layer style)
            // Remove properties specific to selection layer if any (optional)
            // clonedFeature.unset('selectionProperty');

            featuresToAdd.push(clonedFeature);
            addedTileIds.push(tileId);
        });

        if (featuresToAdd.length > 0) {
            targetSource.addFeatures(featuresToAdd); // Add all cloned features
            userLayers[selectedLayerId].tilesetCount = (userLayers[selectedLayerId].tilesetCount || 0) + 1; // Increment counter ONCE per save operation

            selectionSource.clear(); // Clear the temporary selection
            populateTilesetList(selectedLayerId); // Refresh the list
            updateSelectionActionsVisibility(); // Hide save controls etc.
            tilesetNameInput.value = ''; // Clear input

            console.log(`Saved ${featuresToAdd.length} tiles as "${tilesetName}" to layer ${selectedLayerId}`);
        } else {
            console.warn("No features were added during save operation.");
        }
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
    // --- Old Layer Settings Modal Logic (Removed - Replaced by inline Edit/Delete buttons) ---
    // --- Old Layer Settings Modal Logic (Removed) ---
    /* Functionality moved to inline buttons in addLayerToList */


    // --- Initial UI Setup ---
    addLayerToList(layer0Id, layer0Name, true); // Add default layer back to list visually
    selectLayerInList(layer0Id); // Select default layer visually
    populateTilesetList(layer0Id); // Populate tilesets for default layer
    updateSelectionActionsVisibility(); // Initial state for save controls
    updateSelectedTileCountDisplay(); // Initial state for counter/clear button
    if (mapElement) mapElement.style.cursor = 'crosshair'; // Initial cursor for select mode - FIXED


    // --- Helper to find the features being edited (by group ID) ---
    function findCurrentGroupFeatures() {
        if (!selectedLayerId || !userLayers[selectedLayerId] || !currentEditingGroupId) {
            return []; // Return empty array if no group context
        }
        const source = userLayers[selectedLayerId].layer.getSource();
        return source.getFeatures().filter(f => f.get('tilesetGroupId') === currentEditingGroupId);
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
