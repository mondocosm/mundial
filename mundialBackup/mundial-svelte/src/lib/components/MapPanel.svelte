<!-- mundial-svelte/src/lib/components/MapPanel.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'ol/ol.css';
  import Map from 'ol/Map.js';
  import type { Map as OlMap } from 'ol'; // Use type import for type annotation if needed elsewhere
  import OSM from 'ol/source/OSM.js';
  import XYZ from 'ol/source/XYZ.js'; // Import XYZ for satellite
  import TileLayer from 'ol/layer/Tile.js';
  import Graticule from 'ol/layer/Graticule.js';
  import VectorLayer from 'ol/layer/Vector.js'; // Import VectorLayer for grid
  import VectorSource from 'ol/source/Vector.js'; // Import VectorSource for grid
  import Feature from 'ol/Feature.js'; // Import Feature
  import LineString from 'ol/geom/LineString.js'; // Import LineString geometry
  import Polygon from 'ol/geom/Polygon.js'; // Import Polygon geometry for highlighting
  import Style from 'ol/style/Style.js'; // Import Style
  import Fill from 'ol/style/Fill.js'; // Import Fill style for highlighting
  import View from 'ol/View.js';
  import Stroke from 'ol/style/Stroke.js';
  import { fromLonLat, get as getProjection } from 'ol/proj.js'; // Add getProjection
  import { defaults as defaultControls } from 'ol/control.js';
  import { createXYZ } from 'ol/tilegrid.js'; // Keep for tile grid calculations
  import { getWidth } from 'ol/extent.js'; // Import extent helper
  import { olMapInstance } from '$lib/stores/mapStore';
  import { draggable } from '$lib/actions/draggable';
  import { unByKey } from 'ol/Observable.js';
  // Store Imports
  import {
    mapInstanceStore,
    selectedLayerIdStore,
    addTilesetToLayer,
    userLayersStore, // Import userLayersStore to find the target source
    type Tileset,
    type UserLayer
  } from '$lib/stores/layerStore';
  import DragPan from 'ol/interaction/DragPan.js';
  import DoubleClickZoom from 'ol/interaction/DoubleClickZoom.js';
  import KeyboardPan from 'ol/interaction/KeyboardPan.js';
  import KeyboardZoom from 'ol/interaction/KeyboardZoom.js';
  import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
  import {defaults as defaultInteractions} from 'ol/interaction.js'; // Import defaults function

  export let id = "map-panel";
  export let visible = true;

  let mapElement: HTMLDivElement;
  let mapInstanceInternal: Map | null = null;
  let gridSourceOL: VectorSource | null = null; // Source for ZL21 grid lines
  let viewChangeListenerKey: any = null; // To store listener key
  let mapClickListenerKey: any = null; // To store map click listener key
  let selectionLayerSource: VectorSource | null = null; // Source for selected tile highlights
  let dragPanInteraction: DragPan | null = null; // To store DragPan interaction
  
  // Selection state
  let selectedTileCount = 0;
  let maxTileCount = 1000; // Maximum allowed tiles to select

  // --- Tileset Naming State ---
  let tilesetName = ''; // Add state for the tileset name
  let nextTilesetNumber = 1; // Counter for default sequential naming
  
  // Layer references for toggling
  let osmLayerOL: TileLayer | null = null;
  let satelliteLayerOL: TileLayer | null = null;
  let graticuleLayerOL: Graticule | null = null;
  
  // Drag selection variables
  let isDragging = false;
  let dragStartCoord: number[] | null = null;
  let dragBoxFeature: Feature | null = null;
  let dragBoxSource: VectorSource | null = null;
  let pointerMoveListenerKey: any = null;
  let pointerUpListenerKey: any = null;

  const TILE_SELECTION_ZOOM = 21; // Define ZL21 constant
  const GRID_VISIBILITY_MIN_ZOOM = 16; // Min zoom for ZL21 grid

  // --- Interaction State ---
  let interactionMode: 'pan' | 'select' = 'pan'; // Default mode is 'pan' for better initial experience
  // Remove selectedTiles Set - we'll manage features directly in the source

  // --- Function to update the ZL21 grid on the map ---
  function updateZ21GridOL() {
      if (!mapInstanceInternal || !gridSourceOL) return;

      const view = mapInstanceInternal.getView();
      const zoom = view.getZoom();
      gridSourceOL.clear(); // Clear previous lines

      if (zoom === undefined || zoom < GRID_VISIBILITY_MIN_ZOOM) {
          return; // Don't draw if zoomed out too far
      }

      const viewExtent = view.calculateExtent(mapInstanceInternal.getSize());
      const projection = view.getProjection();
      const tileGrid = createXYZ({ maxZoom: TILE_SELECTION_ZOOM }); // ZL21 grid

      const resolution = view.getResolution();
      if (!resolution) return;

      const tileRange = tileGrid.getTileRangeForExtentAndZ(viewExtent, TILE_SELECTION_ZOOM);
      const features = [];
      const tileResolution = tileGrid.getResolution(TILE_SELECTION_ZOOM);

      // Vertical lines
      for (let i = tileRange.minX; i <= tileRange.maxX; i++) {
          const tileCoord = [TILE_SELECTION_ZOOM, i, 0]; // Y doesn't matter for vertical line extent
          const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
          const x = tileExtent[0]; // Left edge of the tile
          const line = new LineString([[x, viewExtent[1]], [x, viewExtent[3]]]);
          features.push(new Feature(line));
          // Add right edge for the last tile column
          if (i === tileRange.maxX) {
              const xRight = tileExtent[2];
              const lineRight = new LineString([[xRight, viewExtent[1]], [xRight, viewExtent[3]]]);
              features.push(new Feature(lineRight));
          }
      }

      // Horizontal lines
      for (let j = tileRange.minY; j <= tileRange.maxY; j++) {
          const tileCoord = [TILE_SELECTION_ZOOM, 0, j]; // X doesn't matter for horizontal line extent
          const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
          const y = tileExtent[1]; // Bottom edge of the tile
          const line = new LineString([[viewExtent[0], y], [viewExtent[2], y]]);
          features.push(new Feature(line));
           // Add top edge for the last tile row
           if (j === tileRange.maxY) {
              const yTop = tileExtent[3];
              const lineTop = new LineString([[viewExtent[0], yTop], [viewExtent[2], yTop]]);
              features.push(new Feature(lineTop));
          }
      }
      gridSourceOL.addFeatures(features);
  }

  // --- Function to handle map clicks for tile selection ---
  function handleMapClick(event: any) { // Use 'any' for OL event type simplicity here
      console.log("handleMapClick function entered."); // DEBUG
      // Remove the check for interaction mode/DragPan state. Always attempt selection on click.
      if (!mapInstanceInternal) {
           console.log("Click ignored (map not ready)."); // DEBUG
           return;
      }

      const coordinate = event.coordinate;
      console.log("Click coordinate:", coordinate); // DEBUG
      const tileGrid = createXYZ({ maxZoom: TILE_SELECTION_ZOOM });
      // Call getTileCoordForCoordAndZ on the tileGrid instance
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, TILE_SELECTION_ZOOM);
      console.log("Calculated tile coord:", tileCoord); // DEBUG

      if (tileCoord && selectionLayerSource) {
          const tileKey = `${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}`; // z/x/y
          console.log("Calculated tile key:", tileKey); // DEBUG

          let featureFound = false;
          // Check if a feature with this tileKey already exists
          selectionLayerSource.forEachFeature((feature: Feature<Polygon>) => { // Add type Feature<Polygon>
              if (feature.get('tileKey') === tileKey) {
                  console.log("Found existing feature, removing:", tileKey); // DEBUG
                  selectionLayerSource?.removeFeature(feature);
                  selectedTileCount--;
                  featureFound = true;
                  return true; // Stop iteration
              }
              return false;
          });

          // If not found, add a new feature
          if (!featureFound) {
              // Check if we're at the maximum tile count
              if (selectedTileCount >= maxTileCount) {
                  console.warn(`Maximum tile count (${maxTileCount}) reached`);
                  alert(`Maximum tile count (${maxTileCount}) reached`);
                  return;
              }
              
              try {
                  const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
                  if (tileExtent) {
                      const minX = tileExtent[0];
                      const minY = tileExtent[1];
                      const maxX = tileExtent[2];
                      const maxY = tileExtent[3];
                      const polygonCoords = [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]];
                      const polygon = new Polygon(polygonCoords);
                      const newFeature = new Feature(polygon);
                      newFeature.set('tileKey', tileKey); // Store tileKey on the feature
                      console.log("Adding new feature:", tileKey); // DEBUG
                      selectionLayerSource.addFeature(newFeature);
                      selectedTileCount++;
                  } else {
                      console.warn("Could not get extent for tile coord:", tileCoord);
                  }
              } catch (e) {
                  console.error("Error creating feature for tile coord:", tileCoord, e);
              }
          }
          // No need to call updateSelectionVisuals anymore
      } else {
          console.log("No tile coordinate found for click or selectionLayerSource missing."); // DEBUG
      }
  }

  // --- Drag Selection Functions ---
  function handlePointerDown(event: any) {
    // Only proceed if we're in select mode and the map is initialized
    if (interactionMode !== 'select' || !mapInstanceInternal) {
      console.log(`Pointer down ignored - mode: ${interactionMode}`); // DEBUG
      return;
    }
    
    // Only start drag on left mouse button (button 0)
    if (event.originalEvent.button !== 0) return;
    
    console.log("Pointer down in select mode - starting drag selection"); // DEBUG
    
    // Prevent the event from being handled by other interactions (like DragPan)
    // These methods don't seem to work reliably in OpenLayers
    // event.stopPropagation();
    // event.preventDefault();
    
    // Instead, we'll manually disable the DragPan interaction when in select mode
    if (dragPanInteraction && dragPanInteraction.getActive()) {
      console.log("Temporarily disabling DragPan for drag selection"); // DEBUG
      dragPanInteraction.setActive(false);
    }
    
    isDragging = true;
    dragStartCoord = event.coordinate;
    
    // Create or clear the drag box source
    if (!dragBoxSource) {
      dragBoxSource = new VectorSource({ wrapX: false });
      const dragBoxLayer = new VectorLayer({
        source: dragBoxSource,
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 0, 0.2)'
          }),
          stroke: new Stroke({
            color: 'rgba(255, 255, 0, 0.8)',
            width: 2
          })
        }),
        zIndex: 10 // Above other layers
      });
      mapInstanceInternal.addLayer(dragBoxLayer);
    } else {
      dragBoxSource.clear();
    }
    
    // Add pointer move and up listeners - use correct event names from OpenLayers
    // TypeScript doesn't recognize these event names, but they do work in OpenLayers
    // @ts-ignore
    pointerMoveListenerKey = mapInstanceInternal.on('pointermove', handlePointerMove);
    // @ts-ignore
    pointerUpListenerKey = mapInstanceInternal.on('pointerup', handlePointerUp);
    
    // Prevent default to avoid starting pan
    event.preventDefault();
  }
  
  function handlePointerMove(event: any) {
    if (!isDragging || !dragStartCoord || !dragBoxSource) return;
    
    const currentCoord = event.coordinate;
    
    // Create box polygon from start and current coordinates
    const minX = Math.min(dragStartCoord[0], currentCoord[0]);
    const minY = Math.min(dragStartCoord[1], currentCoord[1]);
    const maxX = Math.max(dragStartCoord[0], currentCoord[0]);
    const maxY = Math.max(dragStartCoord[1], currentCoord[1]);
    
    const boxCoords = [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]];
    
    // Update or create the drag box feature
    if (dragBoxFeature) {
      dragBoxFeature.setGeometry(new Polygon(boxCoords));
    } else {
      dragBoxFeature = new Feature(new Polygon(boxCoords));
      dragBoxSource.addFeature(dragBoxFeature);
    }
  }
  
  function handlePointerUp(event: any) {
    if (!isDragging || !mapInstanceInternal || !dragBoxSource) return;
    
    console.log("Pointer up after drag"); // DEBUG
    
    // Re-enable DragPan if we're in pan mode
    if (interactionMode === 'pan' && dragPanInteraction) {
      console.log("Re-enabling DragPan after drag selection"); // DEBUG
      dragPanInteraction.setActive(true);
    }
    
    // Get the drag box extent
    if (dragBoxFeature) {
      const geometry = dragBoxFeature.getGeometry() as Polygon;
      const extent = geometry.getExtent();
      
      // Select all tiles that intersect with the box
      selectTilesInExtent(extent);
      
      // Clear the drag box
      dragBoxSource.clear();
      dragBoxFeature = null;
    }
    
    // Clean up
    isDragging = false;
    dragStartCoord = null;
    
    // Remove listeners
    if (pointerMoveListenerKey) {
      unByKey(pointerMoveListenerKey);
      pointerMoveListenerKey = null;
    }
    if (pointerUpListenerKey) {
      unByKey(pointerUpListenerKey);
      pointerUpListenerKey = null;
    }
  }
  
  function selectTilesInExtent(extent: number[]) {
    if (!mapInstanceInternal || !selectionLayerSource) return;
    
    console.log("Selecting tiles in extent:", extent); // DEBUG
    
    const tileGrid = createXYZ({ maxZoom: TILE_SELECTION_ZOOM });
    const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, TILE_SELECTION_ZOOM);
    
    console.log("Tile range:", tileRange); // DEBUG
    
    // Loop through all tiles in the range
    for (let x = tileRange.minX; x <= tileRange.maxX; x++) {
      for (let y = tileRange.minY; y <= tileRange.maxY; y++) {
        const tileCoord = [TILE_SELECTION_ZOOM, x, y];
        const tileKey = `${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}`; // z/x/y
        
        // Check if this tile is already selected
        let isAlreadySelected = false;
        selectionLayerSource.forEachFeature((feature: Feature<Polygon>) => { // Add type Feature<Polygon>
          if (feature.get('tileKey') === tileKey) {
            isAlreadySelected = true;
            return true; // Stop iteration
          }
          return false;
        });
        
        // If not already selected, add it
        if (!isAlreadySelected) {
          try {
            const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
            if (tileExtent) {
              const minX = tileExtent[0];
              const minY = tileExtent[1];
              const maxX = tileExtent[2];
              const maxY = tileExtent[3];
              const polygonCoords = [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]];
              const polygon = new Polygon(polygonCoords);
              const newFeature = new Feature(polygon);
              newFeature.set('tileKey', tileKey); // Store tileKey on the feature
              console.log("Adding new feature from drag:", tileKey); // DEBUG
              selectionLayerSource.addFeature(newFeature);
            }
          } catch (e) {
            console.error("Error creating feature for tile coord:", tileCoord, e);
          }
        }
      }
    }
  }

  // --- Toggle Interaction Mode ---
  function toggleInteractionMode() {
      console.log(`Toggling interaction mode from: ${interactionMode}`); // DEBUG
      // Switch logic: if currently 'select', switch to 'pan', otherwise switch to 'select'
      interactionMode = interactionMode === 'select' ? 'pan' : 'select';
      // Remove DragPan setActive logic for now, as we are using default interactions
      // if (dragPanInteraction) { ... }
      console.log(`Interaction mode changed to: ${interactionMode}`); // DEBUG
  }

  // Remove the updateSelectionVisuals function as it's no longer needed

  // --- Keyboard listeners for Ctrl key mode toggle ---
  let ctrlKeyPressed = false; // Track if Ctrl is currently held

  function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Control' && !ctrlKeyPressed) {
          ctrlKeyPressed = true;
          // Only switch to 'select' if currently in 'pan' mode
          if (interactionMode === 'pan') {
              console.log("Ctrl key pressed, switching to Select mode"); // DEBUG
              setInteractionMode('select');
          }
      }
  }

  function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Control') {
          ctrlKeyPressed = false;
          // Only switch back to 'pan' if currently in 'select' mode
          // (prevents overriding manual toggle via button)
          if (interactionMode === 'select') {
              console.log("Ctrl key released, switching back to Pan mode"); // DEBUG
              setInteractionMode('pan');
          }
      }
  }

  // Helper function to set mode and update DragPan
  function setInteractionMode(newMode: 'pan' | 'select') {
      // Only update if the mode is actually changing
      if (interactionMode === newMode) {
          console.log(`Mode already set to ${newMode}, no change needed`); // DEBUG
          return;
      }
      
      console.log(`Changing mode from ${interactionMode} to ${newMode}`); // DEBUG
      interactionMode = newMode;
      
      if (dragPanInteraction) {
          const shouldPanBeActive = interactionMode === 'pan';
          dragPanInteraction.setActive(shouldPanBeActive);
          console.log(`Set DragPan active: ${dragPanInteraction.getActive()}`); // DEBUG
      } else if (mapInstanceInternal) {
          // Try to find the DragPan interaction if we don't have it yet
          mapInstanceInternal.getInteractions().forEach((interaction: any) => { // Add type
              if (interaction instanceof DragPan) {
                  dragPanInteraction = interaction;
                  const shouldPanBeActive = interactionMode === 'pan';
                  dragPanInteraction.setActive(shouldPanBeActive);
                  console.log(`Found and set DragPan, active: ${dragPanInteraction.getActive()}`); // DEBUG
              }
          });
      }
  }


  onMount(() => {
    // Add keyboard listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    if (mapElement && !mapInstanceInternal) {
      // Define base layers
      osmLayerOL = new TileLayer({
          source: new OSM(),
          visible: false, // Start hidden
          properties: { name: 'OpenStreetMap' }
      });
      satelliteLayerOL = new TileLayer({
          source: new XYZ({
              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              attributions: 'Tiles © ArcGIS',
              maxZoom: 19 // Match original
          }),
          visible: true, // Start visible
          properties: { name: 'Satellite' }
      });
      // Define Graticule
      graticuleLayerOL = new Graticule({
          strokeStyle: new Stroke({
              color: 'rgba(255, 120, 0, 0.9)', // Orange color from screenshot
              width: 2, // Width looks like 2px in screenshot
              // lineDash: [0.5, 4], // No dash in screenshot
          }),
          showLabels: true, // Labels are visible in screenshot
          wrapX: false,
          properties: { name: 'Graticule' },
          visible: false // Keep hidden by default
      });
      // Define ZL21 Vector Grid Layer
      gridSourceOL = new VectorSource({ wrapX: false }); // Assign to component variable
      const gridLayerOL_Z21 = new VectorLayer({
          source: gridSourceOL,
          style: new Style({
              stroke: new Stroke({
                  color: 'rgba(0, 0, 0, 1)', // Black lines like screenshot
                  width: 1 // Thin lines
              })
          }),
          properties: { name: 'ZL21 Grid' },
          minZoom: GRID_VISIBILITY_MIN_ZOOM, // Use constant
          visible: true // Layer itself is visible, content depends on zoom
      });
      // --- Add Selection Layer ---
      selectionLayerSource = new VectorSource({ wrapX: false });
      const selectionLayerOL = new VectorLayer({
          source: selectionLayerSource,
          style: new Style({
              fill: new Fill({
                  color: 'rgba(255, 255, 0, 0.3)', // Semi-transparent yellow fill
              }),
              stroke: new Stroke({
                  color: 'rgba(200, 200, 0, 0.8)', // Slightly darker yellow border
                  width: 1,
              }),
          }),
          properties: { name: 'Selection Highlight' }, // Give it a name
          visible: true, // Always visible when map is visible
          zIndex: 1 // Render above grid but below potential future features
      });


      mapInstanceInternal = new Map({
        target: mapElement,
        layers: [ osmLayerOL, satelliteLayerOL, graticuleLayerOL, gridLayerOL_Z21, selectionLayerOL ], // Add selection layer
        view: new View({
          center: fromLonLat([-74.0445, 40.6892]), // Statue of Liberty
          zoom: 18, // Zoom level 18
          maxZoom: 22, // Match TILE_SELECTION_ZOOM + 1
          minZoom: 0
        }),
        controls: defaultControls({ attribution: false, zoom: false }), // Keep default controls removed
        // Use default interactions
        // interactions: [], // Remove this line
      });

      // Remove explicitly added interactions
      // dragPanInteraction = new DragPan();
      // mapInstanceInternal.addInteraction(dragPanInteraction);
      // mapInstanceInternal.addInteraction(new DoubleClickZoom());
      // mapInstanceInternal.addInteraction(new KeyboardPan());
      // mapInstanceInternal.addInteraction(new KeyboardZoom());
      // mapInstanceInternal.addInteraction(new MouseWheelZoom());

      // Set the store value for the global map instance
      mapInstanceStore.set(mapInstanceInternal);

      // Find the default DragPan interaction
      mapInstanceInternal.getInteractions().forEach((interaction: any) => { // Add type
          if (interaction instanceof DragPan) {
              dragPanInteraction = interaction;
              // Set initial state based on current mode
              const shouldPanBeActive = interactionMode === 'pan';
              dragPanInteraction.setActive(shouldPanBeActive);
              console.log(`Found default DragPan interaction. Set active: ${dragPanInteraction.getActive()}`); // DEBUG
          }
      });


      // Initial grid draw and set up listener
      updateZ21GridOL();
      viewChangeListenerKey = mapInstanceInternal.getView().on('change:resolution', updateZ21GridOL);
      // Also listen for moveend to catch panning without zoom change
      mapInstanceInternal.on('moveend', updateZ21GridOL);
      // Add map click listener using an anonymous function to ensure current scope
      mapClickListenerKey = mapInstanceInternal.on('click', (event: any) => { // Add type
          handleMapClick(event); // Call the handler, ensuring it uses the current interactionMode
      });
      
      // Add pointer down listener for drag selection
      // @ts-ignore - TypeScript doesn't recognize this event name, but it works in OpenLayers
      mapInstanceInternal.on('pointerdown', handlePointerDown);

    }

    // Handle component destruction
    return () => {
      // Remove keyboard listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      if (mapInstanceInternal) {
        // Unregister listeners using unByKey
        if (viewChangeListenerKey) {
            unByKey(viewChangeListenerKey); // Use imported unByKey
        }
         mapInstanceInternal.un('moveend', updateZ21GridOL);
         // Remove map click listener using unByKey
         if (mapClickListenerKey) {
             unByKey(mapClickListenerKey); // Use imported unByKey
         }
         
         // Clean up drag selection listeners if they exist
         if (pointerMoveListenerKey) {
             unByKey(pointerMoveListenerKey);
         }
         if (pointerUpListenerKey) {
             unByKey(pointerUpListenerKey);
         }
  
        // Clear the store value
        mapInstanceStore.set(null);
        // olMapInstance.set(null); // Remove old store usage if applicable
  
        if (mapInstanceInternal) {
            mapInstanceInternal.setTarget(undefined);
            mapInstanceInternal = null;
        }
       gridSourceOL = null; // Clear source reference
       selectionLayerSource = null; // Clear selection source reference
      }
    };
  });

  // Panel state
  let isPanelMinimized = false;
  let isBasemapsMinimized = false;

  function toggleMinimize() {
    isPanelMinimized = !isPanelMinimized;
  }
  
  function toggleBasemapsMinimize() {
    isBasemapsMinimized = !isBasemapsMinimized;
    console.log("Basemaps minimized:", isBasemapsMinimized);
  }
  
  // --- Selection management functions ---
  function saveTileset() {
    const currentSelectedLayerId = get(selectedLayerIdStore); // Use get from svelte/store
    const layers = get(userLayersStore); // Use get from svelte/store

    if (!selectionLayerSource) {
      console.warn("Save attempt failed: selectionLayerSource is null.");
      return;
    }
    if (!currentSelectedLayerId) {
        alert("Please select a layer in the Layers panel before saving.");
        console.warn("Save attempt failed: No layer selected in store.");
        return;
    }

    // Find the target layer and its source from the store
    const targetLayer = layers.find(l => l.layerId === currentSelectedLayerId);
    if (!targetLayer || !targetLayer.olSource) {
        alert(`Error: Could not find the target layer source for "${currentSelectedLayerId}".`);
        console.error(`Save attempt failed: Target layer or source not found for ID: ${currentSelectedLayerId}`);
        return;
    }
    const targetSource = targetLayer.olSource;

    const selectedFeatures = selectionLayerSource.getFeatures();
    if (selectedFeatures.length === 0) {
      alert("No tiles selected to save.");
      return;
    }

    let nameToSave = tilesetName.trim();
    if (!nameToSave) {
      // Generate sequential default name
      nameToSave = `Tileset ${nextTilesetNumber}`;
      console.log(`No name entered, using default: "${nameToSave}"`);
      // Increment the counter for the next default name *after* using it
      nextTilesetNumber++;
    }

    const tilesetGroupId = `tileset-group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Saving selection as Tileset: "${nameToSave}", GroupID: ${tilesetGroupId}`);

    selectedFeatures.forEach((feature: Feature<Polygon>) => { // Add type Feature<Polygon>
      feature.set('tilesetName', nameToSave);
      feature.set('tilesetGroupId', tilesetGroupId);
      feature.set('isSaved', true); // Mark feature as saved
      // We might want to change the style or move to another layer later
      console.log(`Marked tile ${feature.get('tileKey')} as saved in group ${tilesetGroupId}`);
    });

    // TODO: Update the LayersPanel list with the new tileset group
    // This likely requires dispatching an event or updating a shared store

    console.log(`Saved ${selectedFeatures.length} tiles as "${nameToSave}"`);
    alert(`Saved ${selectedFeatures.length} tiles as "${nameToSave}"`);

    // Clear the current selection and name input after saving
    clearSelection(); // Call the updated clear function
    // Reset the name input specifically (clearSelection handles the state variable)
    // No, clearSelection already handles resetting the tilesetName state variable.
  }

  function clearSelection() { // Renamed from clearSelections
    if (!selectionLayerSource) return;

    selectionLayerSource.clear();
    selectedTileCount = 0; // Reset count in the component state
    tilesetName = ''; // Clear the input field as well
    console.log("Cleared current selection and tileset name input.");
    // Note: selectedTileCount should update reactively now
  }

  // Reactive statement to update selectedTileCount whenever features change
  // Let's make sure this works correctly after manual clear
  $: if (selectionLayerSource) {
      selectedTileCount = selectionLayerSource.getFeatures().length;
      // Clear name if selection becomes empty
      if (selectedTileCount === 0) {
          tilesetName = '';
      }
  } else {
      selectedTileCount = 0;
  }
  
  // Basemap toggle functions
  function setBasemap(type: 'osm' | 'satellite') {
    if (!osmLayerOL || !satelliteLayerOL) return;
    
    if (type === 'osm') {
      osmLayerOL.setVisible(true);
      satelliteLayerOL.setVisible(false);
    } else {
      osmLayerOL.setVisible(false);
      satelliteLayerOL.setVisible(true);
    }
  }
  
  function toggleGraticule(visible: boolean) {
    if (graticuleLayerOL) {
      graticuleLayerOL.setVisible(visible);
    }
  }
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="view-panel" use:draggable={{ handle: '.panel-header' }} class:minimized={isPanelMinimized}>
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4>2D Map View</h4>
    <!-- Mode Toggle Button with visual feedback -->
    <button
      on:click={() => setInteractionMode(interactionMode === 'select' ? 'pan' : 'select')}
      title="Toggle Interaction Mode"
      class="mode-toggle-btn"
      class:select-mode={interactionMode === 'select'}
      class:pan-mode={interactionMode === 'pan'}>
        {interactionMode === 'select' ? 'Mode: Select' : 'Mode: Pan'}
    </button>
    <button class="maximize-btn" title="Maximize/Restore">□</button>
    <button class="minimize-btn" on:click={toggleMinimize} title="Minimize/Expand">-</button>
  </div>
  <!-- Bind this div to the mapElement variable -->
  <div bind:this={mapElement} id="map" class="map-container" class:hidden={isPanelMinimized}></div>
  
  <!-- Basemaps control panel -->
  <div class="basemaps-panel" class:minimized={isBasemapsMinimized}>
    <div class="basemaps-header">
      <h5>Basemaps</h5>
      <button class="minimize-btn" on:click={toggleBasemapsMinimize} title="Minimize/Expand">-</button>
    </div>
    <div class="basemaps-content" class:hidden={isBasemapsMinimized}>
      <!-- Basemap options would go here -->
      <div class="basemap-option">
        <input type="radio" id="satellite" name="basemap" checked on:change={() => setBasemap('satellite')}>
        <label for="satellite">Satellite</label>
      </div>
      <div class="basemap-option">
        <input type="radio" id="osm" name="basemap" on:change={() => setBasemap('osm')}>
        <label for="osm">OpenStreetMap</label>
      </div>
      <div class="basemap-option">
        <input type="checkbox" id="graticule" name="overlay" on:change={(e: Event) => toggleGraticule((e.currentTarget as HTMLInputElement).checked)}>
        <label for="graticule">Graticule</label>
      </div>
    </div>
  </div>
  
  <!-- Selection controls -->
  <div class="selection-controls">
    <div id="selected-tile-count-display">Selected: {selectedTileCount} / {maxTileCount}</div>
    <!-- Conditionally show input and buttons only when tiles are selected -->
    {#if selectedTileCount > 0}
      <input type="text" bind:value={tilesetName} placeholder="Enter tileset name..." class="tileset-name-input">
      <button on:click={clearSelection} class="clear-btn">Clear Selection</button>
      <button on:click={saveTileset} class="save-btn">Save Tileset</button>
    {/if}
  </div>
</div>
{/if}

<style>
  /* Adjusted styles for side-by-side layout */
  .view-panel {
    position: absolute;
    top: 60px; /* Below toolbar */
    bottom: 10px; /* Space at bottom */
    background: rgba(50, 50, 50, 0.9);
    border: 1px solid #555;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    box-sizing: border-box;
    /* overflow: auto; */ /* Let map/globe container handle overflow */
    overflow: hidden; /* Prevent scrollbars on the panel itself */
    resize: both; /* Keep resize */
    min-width: 200px;
    min-height: 150px;
    z-index: 990; /* Base z-index for view panels */
    /* Position Map Panel on the left */
    left: 270px; /* Space for control panels */
    right: calc(50% + 5px); /* Occupy left half, leaving space in middle */
    /* Removed fixed width */
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    background-color: rgba(60, 60, 60, 0.95);
    border-bottom: 1px solid #555;
    cursor: move;
    height: 30px;
    box-sizing: border-box;
  }
  .panel-header h4 {
    margin: 0; font-weight: bold; flex-grow: 1;
    font-size: 0.9em; line-height: 1.2;
  }
  .panel-header button {
     font-size: 14px; font-weight: bold; padding: 0 6px;
     margin-left: 5px; flex-shrink: 0; background-color: #555;
     color: #eee; border: 1px solid #777; border-radius: 3px;
     cursor: pointer;
  }
   .panel-header button:hover { background-color: #666; }
  .map-container {
    position: absolute; top: 30px; left: 0; bottom: 0; right: 0;
    width: 100%; height: calc(100% - 30px); overflow: hidden;
  }
  
  /* Minimized states */
  .minimized {
    height: auto !important;
    min-height: unset;
  }
  
  .hidden {
    display: none;
  }
  
  /* Basemaps panel */
  .basemaps-panel {
    position: absolute;
    top: 40px;
    right: 10px;
    width: 150px;
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid #555;
    border-radius: 5px;
    z-index: 1000;
  }
  
  .basemaps-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    border-bottom: 1px solid #555;
  }
  
  .basemaps-header h5 {
    margin: 0;
    font-size: 0.9em;
  }
  
  .basemaps-content {
    padding: 10px;
  }
  
  .basemap-option {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
  }
  
  .basemap-option label {
    margin-left: 5px;
    font-size: 0.9em;
  }
  
  /* Selection controls */
  .selection-controls {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid #555;
    border-radius: 5px;
    padding: 10px;
    z-index: 1000;
  }
  
  #selected-tile-count-display {
    margin-bottom: 5px;
    font-weight: bold;
    text-align: center;
  }
  
  .tileset-name-input {
    width: calc(100% - 12px); /* Account for padding/border */
    padding: 6px;
    margin-top: 8px; /* Add space above input */
    margin-bottom: 8px; /* Space below input */
    border: 1px solid #666;
    background-color: #333;
    color: #eee;
    border-radius: 3px;
    box-sizing: border-box;
  }

  .clear-btn, .save-btn {
    width: 100%;
    margin-top: 5px;
    padding: 5px;
    background-color: #444;
    color: white;
    border: 1px solid #666;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .clear-btn:hover, .save-btn:hover {
    background-color: #555;
  }
  
  .save-btn {
    background-color: #2a5885;
  }
  
  .save-btn:hover {
    background-color: #3a6895;
  }
</style>