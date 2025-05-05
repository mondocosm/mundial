<!-- mundial-svelte/src/lib/components/MapPanel.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'ol/ol.css'; // Import OpenLayers CSS
  import Map from 'ol/Map.js';
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
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action
  // Remove incorrect import: import { getTileCoordForCoordAndZ } from 'ol/tilegrid.js';
  import { unByKey } from 'ol/Observable.js'; // Import unByKey

  export let id = "map-panel";
  export let visible = true;

  let mapElement: HTMLDivElement;
  let mapInstanceInternal: Map | null = null;
  let gridSourceOL: VectorSource | null = null; // Source for ZL21 grid lines
  let viewChangeListenerKey: any = null; // To store listener key
  let mapClickListenerKey: any = null; // To store map click listener key
  let selectionLayerSource: VectorSource | null = null; // Source for selected tile highlights

  const TILE_SELECTION_ZOOM = 21; // Define ZL21 constant
  const GRID_VISIBILITY_MIN_ZOOM = 16; // Min zoom for ZL21 grid

  // --- Interaction State ---
  let interactionMode: 'pan' | 'select' = 'pan'; // Default mode
  let selectedTiles = new Set<string>(); // Store selected tile coords as strings "z/x/y"

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
      console.log(`Map clicked. Interaction mode: ${interactionMode}`); // DEBUG
      if (interactionMode !== 'select' || !mapInstanceInternal) {
          console.log("Click ignored (not in select mode or map not ready)."); // DEBUG
          return;
      }

      const coordinate = event.coordinate;
      console.log("Click coordinate:", coordinate); // DEBUG
      const tileGrid = createXYZ({ maxZoom: TILE_SELECTION_ZOOM });
      // Call getTileCoordForCoordAndZ on the tileGrid instance
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, TILE_SELECTION_ZOOM);
      console.log("Calculated tile coord:", tileCoord); // DEBUG

      if (tileCoord) {
          const tileKey = `${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}`; // z/x/y
          console.log("Calculated tile key:", tileKey); // DEBUG
          if (selectedTiles.has(tileKey)) {
              selectedTiles.delete(tileKey);
          } else {
              // Optional: Add limit check here if needed (e.g., 1000 tiles)
              selectedTiles.add(tileKey);
          }
          selectedTiles = new Set(selectedTiles); // Trigger reactivity
          console.log("Selected Tile:", tileKey, "Total:", selectedTiles.size); // Log for debugging
          updateSelectionVisuals(); // Update visual representation
      } else {
          console.log("No tile coordinate found for click."); // DEBUG
      }
  }

  // --- Toggle Interaction Mode ---
  function toggleInteractionMode() {
      console.log(`Toggling interaction mode from: ${interactionMode}`); // DEBUG
      interactionMode = interactionMode === 'pan' ? 'select' : 'pan';
      // TODO: Update cursor style based on mode
      console.log(`Interaction mode changed to: ${interactionMode}`); // DEBUG
  }

  // --- Function to update selected tile visuals ---
  function updateSelectionVisuals() {
      if (!selectionLayerSource || !mapInstanceInternal) return;

      selectionLayerSource.clear(); // Clear previous highlights
      const tileGrid = createXYZ({ maxZoom: TILE_SELECTION_ZOOM });
      const features: Feature[] = [];

      selectedTiles.forEach(tileKey => {
          const parts = tileKey.split('/');
          if (parts.length === 3) {
              // Note: OpenLayers tile coords are [z, x, -y-1] for XYZ standard, but we store as z/x/y.
              // The getTileCoordForCoordAndZ in handleMapClick returns the standard XYZ coord.
              // We need to use the stored z/x/y directly with getTileCoordExtent.
              const tileCoord = [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
              try {
                  const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
                  if (tileExtent) {
                      // Correctly create polygon from extent coordinates
                      const minX = tileExtent[0];
                      const minY = tileExtent[1];
                      const maxX = tileExtent[2];
                      const maxY = tileExtent[3];
                      const polygonCoords = [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]];
                      const polygon = new Polygon(polygonCoords);
                      features.push(new Feature(polygon));
                  } else {
                      console.warn("Could not get extent for tile coord:", tileCoord);
                  }
              } catch (e) {
                  console.error("Error getting extent for tile coord:", tileCoord, e);
              }
          }
      });
      if (features.length > 0) {
           selectionLayerSource.addFeatures(features);
      }
  }


  onMount(() => {
    if (mapElement && !mapInstanceInternal) {
      // Define base layers
      const osmLayerOL = new TileLayer({
          source: new OSM(),
          visible: false, // Start hidden
          properties: { name: 'OpenStreetMap' }
      });
      const satelliteLayerOL = new TileLayer({
          source: new XYZ({
              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              attributions: 'Tiles © ArcGIS',
              maxZoom: 19 // Match original
          }),
          visible: true, // Start visible
          properties: { name: 'Satellite' }
      });
      // Define Graticule
      const graticuleLayerOL = new Graticule({
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
        controls: defaultControls({ attribution: false, zoom: false }), // Remove default controls
      });
      // Set the store value
      olMapInstance.set(mapInstanceInternal);

      // Initial grid draw and set up listener
      updateZ21GridOL();
      viewChangeListenerKey = mapInstanceInternal.getView().on('change:resolution', updateZ21GridOL);
      // Also listen for moveend to catch panning without zoom change
      mapInstanceInternal.on('moveend', updateZ21GridOL);
      // Add map click listener using an anonymous function to ensure current scope
      mapClickListenerKey = mapInstanceInternal.on('click', (event) => {
          handleMapClick(event); // Call the handler, ensuring it uses the current interactionMode
      });

    }

    // Handle component destruction
    return () => {
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

       olMapInstance.set(null);
       mapInstanceInternal.setTarget(undefined);
       mapInstanceInternal = null;
       gridSourceOL = null; // Clear source reference
       selectionLayerSource = null; // Clear selection source reference
      }
    };
  });

  // TODO: Add logic for minimize/maximize
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="view-panel" use:draggable={{ handle: '.panel-header' }}>
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4>2D Map View</h4>
    <!-- Temporary Mode Toggle Button -->
    <button on:click={toggleInteractionMode} title="Toggle Interaction Mode" style="margin-left: auto; margin-right: 5px; background-color: #444;">
        {interactionMode === 'pan' ? 'Mode: Pan' : 'Mode: Select'}
    </button>
    <button class="maximize-btn" title="Maximize/Restore">□</button>
    <button class="minimize-btn" title="Minimize/Expand">-</button>
  </div>
  <!-- Bind this div to the mapElement variable -->
  <div bind:this={mapElement} id="map" class="map-container"></div>
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
</style>