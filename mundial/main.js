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
    const mapDiv = document.getElementById('map');

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
    const detailsOpacityInput = document.getElementById('details-tileset-opacity'); 
    const detailsOpacityValueSpan = document.getElementById('details-tileset-opacity-value'); 
    const toggleColorModeBtn = document.getElementById('toggle-color-mode-btn'); 
    const colorPickerLabel = document.getElementById('color-picker-label'); 

    // --- State Variables ---
    let selectedLayerId = layer0Id; // Track which layer is selected
    let currentInteractionMode = 'select'; // 'select' or 'draw'
    let selectedTiles = {}; // Track selected tiles: { 'z/x/y': true, ... }
    let selectedTileCount = 0; // Track count for UI display
    let colorEditingMode = 'stroke'; // 'stroke' or 'fill'
    let currentEditingGroupId = null; // Track which *group* is being edited in the modal

    // --- Base Layer Selection Logic ---
    baseLayerSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        
        if (selectedValue === 'add-custom') {
            // Show custom layer inputs
            customLayerInputsDiv.style.display = 'block';
            // Revert select to previous value
            baseLayerSelect.value = previouslySelectedLayerValue;
            return;
        }
        
        // Hide custom inputs if they were showing
        customLayerInputsDiv.style.display = 'none';
        
        // Update layer visibility
        baseLayers.forEach(layer => {
            layer.setVisible(layer.get('title') === selectedValue);
        });
        
        // Store the selected value for next time
        previouslySelectedLayerValue = selectedValue;
    });

    // --- Custom Layer Addition Logic ---
    addCustomLayerBtn.addEventListener('click', () => {
        const name = customLayerNameInput.value.trim();
        const url = customLayerUrlInput.value.trim();
        
        if (!name || !url) {
            alert('Please enter both a name and URL for the custom layer.');
            return;
        }
        
        // Create a new layer
        const newLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({ url: url }),
            visible: true,
            title: name.toLowerCase().replace(/\s+/g, '-') // Create a title from name
        });
        
        // Add to baseLayers array and map
        baseLayers.push(newLayer);
        map.addLayer(newLayer);
        
        // Hide other base layers
        baseLayers.forEach(layer => {
            if (layer !== newLayer) {
                layer.setVisible(false);
            }
        });
        
        // Add option to select
        const option = document.createElement('option');
        option.value = newLayer.get('title');
        option.textContent = name;
        
        // Insert before the "Add Custom" option
        const addCustomOption = baseLayerSelect.querySelector('option[value="add-custom"]');
        baseLayerSelect.insertBefore(option, addCustomOption);
        
        // Select the new layer
        baseLayerSelect.value = newLayer.get('title');
        previouslySelectedLayerValue = newLayer.get('title');
        
        // Clear and hide inputs
        customLayerNameInput.value = '';
        customLayerUrlInput.value = '';
        customLayerInputsDiv.style.display = 'none';
    });

    // --- Interaction Mode Toggle ---
    interactionModeBtn.addEventListener('click', () => {
        currentInteractionMode = currentInteractionMode === 'select' ? 'draw' : 'select';
        interactionModeBtn.textContent = `Mode: ${currentInteractionMode === 'select' ? 'Select Tiles' : 'Draw Selection'}`;
        
        // Clear any existing selection when changing modes
        selectionSource.clear();
        selectedTiles = {};
        selectedTileCount = 0;
        updateSelectedTileCountDisplay();
        updateSelectionActionsVisibility();
    });

    // --- Make Panels Draggable ---
    makeDraggable(document.getElementById('layer-switcher'));
    makeDraggable(document.getElementById('user-layers-panel'));
    makeDraggable(document.getElementById('app-controls'));
    makeDraggable(document.getElementById('tileset-details-modal'));

    // --- Panel Minimize/Expand Logic ---
    document.querySelectorAll('.minimize-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const panel = event.target.closest('.control-panel');
            if (panel) {
                panel.classList.toggle('minimized');
                // Change button text based on state
                event.target.textContent = panel.classList.contains('minimized') ? '+' : '-';
                event.target.title = panel.classList.contains('minimized') ? 'Expand' : 'Minimize';
            }
        });
    });

}); // End DOMContentLoaded
