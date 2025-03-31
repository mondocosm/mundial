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
});

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
const inlineColorPickerContainer = document.getElementById('inline-color-picker-container');
const inlineColorPicker = document.getElementById('inline-color-picker');
const inlineColorPickerName = document.getElementById('inline-color-picker-name');



// --- Global State ---
let currentSettingsFeatureId = null; // Store the ID of the feature being edited in settings modal

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
        layerInfo.layer.setVisible(showUserLayers);
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

            // Show inline color picker
            currentSettingsFeatureId = featureId; // Track the feature being edited
            inlineColorPicker.value = feature.get('color') || '#008080'; // Default to teal if no color set
            inlineColorPickerName.textContent = featureName;
            inlineColorPickerContainer.style.display = 'block';
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
     inlineColorPickerContainer.style.display = 'none'; // Hide picker
     currentSettingsFeatureId = null; // Clear tracked feature
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
        if (currentSettingsFeatureId === featureId && inlineColorPickerName) {
            inlineColorPickerName.textContent = trimmedName;
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
             if (currentSettingsFeatureId === featureId) {
                 highlightSource.clear();
                 inlineColorPickerContainer.style.display = 'none';
                 currentSettingsFeatureId = null;
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
        settingsBtn.onclick = (event) => {
            event.stopPropagation(); // Prevent layer selection
            // TODO: Implement openLayerSettingsModal(layerId, layerName);
            console.log(`Layer settings clicked for: ${layerId}`);
            alert('Layer settings not yet implemented.');
        };
        layerItem.appendChild(settingsBtn);
    }


    userLayerList.appendChild(layerItem);
}

// Function to visually select a layer in the list
function selectLayerInList(layerId) {
    // Remove selected class from all items
    userLayerList.querySelectorAll('.layer-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Add selected class to the target item
    const targetItem = userLayerList.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
    if (targetItem) {
        targetItem.classList.add('selected');
        selectedLayerId = layerId; // Update tracked selected layer
    } else {
        selectedLayerId = null; // Layer not found in list
    }
    // Update dependent UI
    populateTilesetList(selectedLayerId);
    updateSelectionActionsVisibility(); // Needs selectedLayerId now
}

// Event listener for the new user layer list (using delegation)
userLayerList.addEventListener('click', (event) => {
    const target = event.target;
    const layerItem = target.closest('.layer-item');
    if (!layerItem) return; // Clicked outside an item

    const layerId = layerItem.dataset.layerId;

    if (target.type === 'checkbox') {
        // Handle checkbox click (toggle visibility)
        const isVisible = target.checked;
        if (userLayers[layerId]) {
            userLayers[layerId].layer.setVisible(isVisible);
            console.log(`Layer ${layerId} visibility set to ${isVisible}`);
        }
    } else {
        // Handle click on the layer item itself (select layer)
        selectLayerInList(layerId);
        console.log(`Selected layer: ${layerId}`);
    }
});

// Removed old listener for userLayerSelect

createLayerBtn.addEventListener('click', function() { // The '+' button
    // Overlap check removed - belongs in saveSelectionBtn listener
    const layerName = prompt("Enter name for new layer:", "Layer " + (Object.keys(userLayers).length)); // Length is now correct as Layer0 exists
    if (!layerName) return;
    const layerId = layerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    // Prevent creating layer with ID 'layer-0' or the same name/ID as an existing one
    if (!layerId || layerId === layer0Id || userLayers[layerId] || map.getLayers().getArray().some(l => l.get('title') === layerId)) {
        alert(`Layer name/ID "${layerName}"/"${layerId}" is invalid, reserved, or already exists.`); return;
    }
    console.log(`Creating user layer: Name="${layerName}", ID="${layerId}"`);
    // Use the specific tileset style for the layer itself
    const newUserLayer = new ol.layer.Vector({ source: new ol.source.Vector(), style: tilesetFeatureStyle, title: layerId, zIndex: 2, visible: false }); // Initially hidden
    newUserLayer.set('userLayerName', layerName);
    const layers = map.getLayers(); let selectionLayerIndex = layers.getArray().findIndex(layer => layer === selectionLayer);
    if (selectionLayerIndex === -1) selectionLayerIndex = layers.getLength();
    layers.insertAt(selectionLayerIndex, newUserLayer); // Insert *before* selection layer
    userLayers[layerId] = { name: layerName, layer: newUserLayer, tilesetCount: 0 }; // Add tilesetCount

    // Add layer item to the new list div
    addLayerToList(layerId, layerName, true); // true for initially visible (controlled by zoom)

    // Select the new layer in the list
    selectLayerInList(layerId);

    // Update UI based on the new layer being selected
    populateTilesetList(layerId);
    updateSelectionActionsVisibility();
});

clearSelectionBtn.addEventListener('click', function() { selectionSource.clear(); });

saveSelectionBtn.addEventListener('click', function() {
    const selectedTileFeatures = selectionSource.getFeatures();
    // Save limit removed

    const targetLayerId = selectedLayerId; // Use the tracked selected layer ID
    const tilesetName = tilesetNameInput.value.trim();
    if (selectedTileFeatures.length === 0) { alert("No tiles selected."); return; }
    if (!targetLayerId || !userLayers[targetLayerId]) { alert("Select user layer."); return; }
    if (!tilesetName) { alert("Enter tileset name."); tilesetNameInput.focus(); return; }

    // Define targetSource *before* using it in the overlap check
    const targetSource = userLayers[targetLayerId].layer.getSource();

    // --- Check for overlap within the target layer ---
    const newTileIds = new Set(selectedTileFeatures.map(f => f.getId()));
    const existingTilesetFeatures = targetSource.getFeatures(); // Now targetSource is defined
    let overlapFound = false;
    for (const existingTileset of existingTilesetFeatures) {
        const existingTileIds = existingTileset.get('tileIds'); // Assumes tileIds are stored
        if (existingTileIds && Array.isArray(existingTileIds)) {
            for (const id of existingTileIds) {
                if (newTileIds.has(id)) {
                    overlapFound = true;
                    alert(`Overlap detected! One or more selected tiles are already part of the tileset "${existingTileset.get('tilesetName') || 'Unnamed Tileset'}" in this layer.`);
                    break; // Exit inner loop
                }
            }
        }
        if (overlapFound) break; // Exit outer loop
    }
    if (overlapFound) return; // Stop saving if overlap detected
    // --- End Overlap Check ---

    // targetSource is already defined above
    const geometries = selectedTileFeatures.map(f => f.getGeometry());
    const multiPolygon = new ol.geom.MultiPolygon(geometries.map(g => g.getCoordinates()));
    const tilesetFeature = new ol.Feature({
        geometry: multiPolygon,
        tilesetName: tilesetName,
        tileCount: selectedTileFeatures.length,
        tileIds: selectedTileFeatures.map(f => f.getId()),
        // Placeholders for future settings
        color: null, // Initialize color property
        notes: '',
        appearance: {}, // e.g., { color: '#ff0000', opacity: 0.5 }
        attributes: {}, // e.g., { type: 'residential', status: 'planned' }
        isVisible: true, // Add visibility property, default to true



        links: [],      // e.g., ['http://example.com/info']
        images: []      // e.g., ['images/tileset_preview.jpg']
    });
    tilesetFeature.setId(targetLayerId + '-' + Date.now());
    targetSource.addFeature(tilesetFeature);
    // Increment tileset count for the layer
    if (userLayers[targetLayerId]) {
        userLayers[targetLayerId].tilesetCount = (userLayers[targetLayerId].tilesetCount || 0) + 1;
    }

    console.log(`Saved tileset "${tilesetName}" to layer "${userLayers[targetLayerId].name}".`);
    selectionSource.clear(); tilesetNameInput.value = '';
    populateTilesetList(targetLayerId);




});


// --- Inline Color Picker Logic ---
if (inlineColorPicker) {
    inlineColorPicker.addEventListener('input', function() { // 'input' fires immediately
        if (!currentSettingsFeatureId) return; // No feature selected

        const newColor = this.value;
        const feature = findCurrentFeature(); // Use helper to get the feature

        if (feature) {
            // Update feature data
            feature.set('color', newColor);

            // Update feature style immediately (if visible)
            if (feature.get('isVisible') !== false) {
                 const featureStyle = new ol.style.Style({
                      stroke: new ol.style.Stroke({ color: newColor, width: 3 }) // Use updated width
                 });
                 feature.setStyle(featureStyle);
            }

            // Optional: Update highlight style to match
            const highlightFeature = highlightSource.getFeatures()[0]; // Assuming only one highlight feature
            if (highlightFeature) {
                 // Need ol.color functions for this
                 try {
                     const rgbaColor = ol.color.asArray(newColor);
                     const fillRgbaColor = rgbaColor.slice(0, 3).concat([0.3]); // Make fill transparent
                     highlightFeature.setStyle(new ol.style.Style({
                         stroke: new ol.style.Stroke({ color: newColor, width: 5 }), // Make highlight slightly thicker/different
                         fill: new ol.style.Fill({ color: ol.color.asString(fillRgbaColor) })
                     }));
                 } catch (e) {
                     console.error("Error processing color for highlight: ", e);
                     // Fallback if color conversion fails
                     highlightFeature.setStyle(new ol.style.Style({
                         stroke: new ol.style.Stroke({ color: newColor, width: 5 })
                     }));
                 }
            }

            console.log(`Updated color for ${currentSettingsFeatureId} to ${newColor}`);
        } else {
            console.error("Could not find feature to update color:", currentSettingsFeatureId);
        }
    });
} else {
    console.warn("Inline color picker element not found.");
}

// --- Interaction Mode Toggle ---
interactionModeBtn.addEventListener('click', function() {
    if (currentInteractionMode === 'select') {
        currentInteractionMode = 'pan'; this.textContent = 'Mode: Pan Map';
        dragBoxInteraction.setActive(false);
        map.getTargetElement().style.cursor = 'grab';
    } else {
        currentInteractionMode = 'select'; this.textContent = 'Mode: Select Tiles';
        dragBoxInteraction.setActive(true);
        map.getTargetElement().style.cursor = 'crosshair';
    }
});
// Set initial cursor (assuming select mode is default)
map.getTargetElement().style.cursor = 'crosshair';

// Initial UI state checks
selectLayerInList(layer0Id); // Select Layer0 initially in the UI list
updateSelectionActionsVisibility();
populateTilesetList(selectedLayerId); // Use the tracked ID


// --- Tileset Settings Modal Logic ---
// Variables will be defined inside DOMContentLoaded

// Helper to find feature (needed in multiple places)
function findCurrentFeature() {
    if (!currentSettingsFeatureId) return null;
    const layerId = selectedLayerId; // Use the globally tracked selected layer ID
    if (layerId && userLayers[layerId]) {
        return userLayers[layerId].layer.getSource().getFeatureById(currentSettingsFeatureId);
    }
    return null;
}

// Default layer is now created during initial setup
