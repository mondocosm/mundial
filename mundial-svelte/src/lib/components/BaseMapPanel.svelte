<!-- mundial-svelte/src/lib/components/BaseMapPanel.svelte -->
<script lang="ts">
  import { olMapInstance, globusInstance } from '$lib/stores/mapStore';
  import TileLayer from 'ol/layer/Tile'; // Import TileLayer for OpenLayers
  import XYZ from 'ol/source/XYZ'; // Import XYZ source for OpenLayers
  import type BaseLayer from 'ol/layer/Base'; // OpenLayers BaseLayer type
  import { XYZ as GlobusXYZ } from '@openglobus/og'; // Corrected import for OpenGlobus XYZ
  import type { Layer } from '@openglobus/og'; // Corrected import for OpenGlobus Layer type
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action

  export let id = "base-map-panel"; // New ID
  export let visible = true; // Start visible as per last screenshot

  // State for minimize/expand
  let isMinimized = true; // Start minimized

  // Reactive variables to hold layers from map/globe instances
  let olLayers: BaseLayer[] = [];
  let globusLayers: Layer[] = [];

  // Reactively update layer lists when map/globe instances change
  $: if ($olMapInstance) {
    olLayers = $olMapInstance.getLayers().getArray();
  } else {
    olLayers = [];
  }

  $: if ($globusInstance) {
    globusLayers = $globusInstance.planet.layers;
  } else {
    globusLayers = [];
  }

  // --- Base Map Definitions ---
  const baseMaps = [
    // OpenLayers Options
    { name: 'OSM', url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors', type: 'ol', maxZoom: 19 },
    { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles © Esri', type: 'ol', maxZoom: 19 }, // Added Satellite for OL consistency
    { name: 'Topographic', url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)', type: 'ol', maxZoom: 17 }, // Added Topo
    { name: 'Terrarium', url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', attribution: '© Mapzen, OpenStreetMap, and others', type: 'ol', maxZoom: 15 }, // Added Terrarium (Note: Check attribution/terms)
    { name: 'Stamen Terrain', url: 'https://stamen-tiles-{a-d}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors', type: 'ol', maxZoom: 18 }, // Adjusted ext placeholder
    { name: 'Stamen Toner Lite', url: 'https://stamen-tiles-{a-d}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors', type: 'ol', maxZoom: 18 }, // Adjusted ext placeholder
    // OpenGlobus Options
    { name: 'OSM (Globus)', url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors', type: 'globus', maxNativeZoom: 19 },
    { name: 'Satellite (Globus)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles © Esri', type: 'globus', maxNativeZoom: 19 }, // Added Satellite for Globus
    { name: 'OpenTopoMap', url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)', type: 'globus', maxNativeZoom: 17 },
    // Terrarium might not work well directly in OpenGlobus as a base layer without specific terrain handling
  ];

  // Default to Satellite for OL as per original index.html setup in MapPanel
  let selectedOlBaseMap = baseMaps.find(m => m.name === 'Satellite' && m.type === 'ol')?.name || 'OSM';
  let selectedGlobusBaseMap = baseMaps.find(m => m.type === 'globus')?.name || 'OpenTopoMap'; // Default Globus selection

  // --- Function to set the OpenLayers Base Map ---
  function setOlBaseMap(name: string) {
    const mapConfig = baseMaps.find(m => m.name === name && m.type === 'ol');
    if (!$olMapInstance || !mapConfig) return;

    selectedOlBaseMap = name;
    const layers = $olMapInstance.getLayers().getArray();
    const currentBaseLayer = layers.find(l => l.get('isBaseLayer') === true) as TileLayer<XYZ>;

    if (currentBaseLayer) {
      const newSource = new XYZ({
        url: mapConfig.url,
        attributions: mapConfig.attribution,
        maxZoom: mapConfig.maxZoom || 19 // Use maxZoom from config or default
      });
      currentBaseLayer.setSource(newSource);
      currentBaseLayer.set('name', mapConfig.name); // Update name property
    } else {
      console.warn("No existing base layer found with 'isBaseLayer' property set to true.");
      // Optionally create a new one if none exists
       const newBaseLayer = new TileLayer({
         source: new XYZ({
           url: mapConfig.url,
           attributions: mapConfig.attribution,
           maxZoom: mapConfig.maxZoom || 19 // Use maxZoom from config or default
         }),
         properties: { isBaseLayer: true, name: mapConfig.name } // Mark as base layer and set name
       });
       $olMapInstance.getLayers().insertAt(0, newBaseLayer); // Add at the bottom
    }
  }

  // --- Function to set the OpenGlobus Base Map ---
  function setGlobusBaseMap(name: string) {
    const mapConfig = baseMaps.find(m => m.name === name && m.type === 'globus');
    if (!$globusInstance || !mapConfig) return;

    selectedGlobusBaseMap = name;
    const planet = $globusInstance.planet;

    // Remove existing base layer(s) marked with isBaseLayer
    const existingBaseLayers = planet.layers.filter(l => l.isBaseLayer);
    existingBaseLayers.forEach(l => planet.removeLayer(l));

    // Create and add the new base layer
    const newBaseLayer = new GlobusXYZ(mapConfig.name, { // Use name as layer ID - Assuming constructor takes name first
        isBaseLayer: true,
        url: mapConfig.url,
        visibility: true,
        attribution: mapConfig.attribution,
        maxNativeZoom: mapConfig.maxNativeZoom || 18, // Use from config or default
        maxZoom: mapConfig.maxZoom || 20 // Use from config or default (maxZoom might differ from maxNativeZoom)
    });
    planet.addLayer(newBaseLayer);

    // Ensure it's at the bottom (optional, depends on desired layer order)
    // planet.layers.sort((a, b) => (a.isBaseLayer ? -1 : 1) - (b.isBaseLayer ? -1 : 1));
    // planet.updateVisibleLayers(); // May be needed
 }


  // --- Functions to toggle layer visibility ---
  function toggleOlLayerVisibility(layer: BaseLayer, event: Event) {
    const target = event.target as HTMLInputElement;
    if (layer) {
      layer.setVisible(target.checked);
    }
  }

  function toggleGlobusLayerVisibility(layer: Layer, event: Event) {
    const target = event.target as HTMLInputElement;
    if (layer) {
      layer.setVisibility(target.checked);
    }
  }

  // Dragging logic is handled by the 'draggable' action imported above

  function toggleMinimize() {
    isMinimized = !isMinimized;
  }

</script>

{#if visible}
<!-- Apply the draggable action to the main panel div -->
<!-- Conditionally apply a higher z-index when not minimized -->
<div {id} class="control-panel" use:draggable={{ handle: '.panel-header' }} style={`z-index: ${isMinimized ? 1000 : 1002};`}>
  <!-- The draggable action now handles the mousedown and accessibility on the header -->
  <div class="panel-header">
    <h4>Base Maps & Grids</h4> <!-- Changed Title -->
    <!-- Update button to toggle minimize state -->
    <button class="minimize-btn" title={isMinimized ? "Expand" : "Minimize"} on:click={toggleMinimize}>
      {isMinimized ? '+' : '-'}
    </button>
  </div>
  <!-- Conditionally render content based on isMinimized state -->
  {#if !isMinimized}
  <div class="panel-content">
    <!-- OpenLayers Base Map Selection -->
    {#if $olMapInstance}
      <h5>Map Base Layer (OpenLayers)</h5>
      <div class="base-map-selection">
        {#each baseMaps.filter(m => m.type === 'ol') as map (map.name)}
          <label>
            <input
              type="radio"
              name="olBaseMap"
              value={map.name}
              bind:group={selectedOlBaseMap}
              on:change={() => setOlBaseMap(map.name)}
            />
            {map.name}
          </label>
        {/each}
      </div>
      <hr /> <!-- Separator -->
    {/if}

     <!-- OpenLayers Overlay Layers -->
    {#if olLayers.length > 0}
      <h5>Map Overlays (OpenLayers)</h5>
      <ul>
        {#each olLayers as layer (layer.get('name') || layer)}
          {@const layerName = layer.get('name') || 'Unnamed Layer'}
          {@const layerVisible = layer.getVisible()}
          {@const isBase = layer.get('isBaseLayer') === true}
          <!-- Only show toggle for non-base layers with a name -->
          {#if layerName !== 'Unnamed Layer' && !isBase}
            <li>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisible}
                  on:change={(e) => toggleOlLayerVisibility(layer, e)}
                />
                {layerName}
              </label>
            </li>
          {/if}
        {/each}
      </ul>
    {:else if $olMapInstance}
      <p>Map not initialized or no overlay layers.</p>
    {/if}

    <hr /> <!-- Separator -->

    <!-- OpenGlobus Base Map Selection -->
    {#if $globusInstance}
      <h5>Globe Base Layer (OpenGlobus)</h5>
       <div class="base-map-selection">
         {#each baseMaps.filter(m => m.type === 'globus') as map (map.name)}
           <label>
             <input
               type="radio"
               name="globusBaseMap"
               value={map.name}
               bind:group={selectedGlobusBaseMap}
               on:change={() => setGlobusBaseMap(map.name)}
             />
             {map.name}
           </label>
         {/each}
       </div>
       <hr /> <!-- Separator -->
    {/if}

    <!-- OpenGlobus Overlay Layers -->
    {#if globusLayers.length > 0}
      <h5>Globe Overlays (OpenGlobus)</h5>
      <ul>
         {#each globusLayers as layer (layer.name || layer)}
           {@const layerName = layer.name || 'Unnamed Layer'}
           {@const layerVisible = layer.getVisibility()}
           <!-- Correctly access the boolean property for OpenGlobus layers -->
           {@const isBase = layer.isBaseLayer}
            <!-- Only show toggle for non-base layers with a name -->
           {#if layerName !== 'Unnamed Layer' && !isBase}
             <li>
               <label>
                 <input
                   type="checkbox"
                   checked={layerVisible}
                   on:change={(e) => toggleGlobusLayerVisibility(layer, e)}
                 />
                 {layerName}
               </label>
             </li>
           {/if}
         {/each}
      </ul>
    {:else if $globusInstance}
       <p>Globe not initialized or no overlay layers.</p>
    {/if}
  </div>
  {/if} <!-- End of !isMinimized block -->
</div>
{/if}

<style>
  /* Use similar panel styles, adjust positioning */
  .control-panel {
    position: absolute; top: 60px; left: 10px; width: 250px;
    max-height: calc(100vh - 80px); background: rgba(50, 50, 50, 0.9);
    border: 1px solid #555; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    box-sizing: border-box; z-index: 1000; display: flex;
    flex-direction: column; overflow: hidden; resize: both; /* Allow resize */
    /* Adjust height when minimized */
    height: auto; /* Allow shrinking */
  }
  .panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 10px; background-color: rgba(60, 60, 60, 0.95);
    border-bottom: 1px solid #555; cursor: move; height: 30px;
    box-sizing: border-box; flex-shrink: 0;
  }
  .panel-header h4 { margin: 0; font-weight: bold; flex-grow: 1; font-size: 0.9em; }
  .panel-header button {
     font-size: 14px; font-weight: bold; padding: 0 6px; margin-left: 5px;
     flex-shrink: 0; background-color: #555; color: #eee;
     border: 1px solid #777; border-radius: 3px; cursor: pointer;
  }
   .panel-header button:hover { background-color: #666; }
  .panel-content { padding: 10px; overflow-y: auto; flex-grow: 1; }
  .panel-content h5 { margin-top: 10px; margin-bottom: 5px; border-bottom: 1px solid #666; padding-bottom: 3px; font-size: 0.85em; }
  .panel-content h5:first-child { margin-top: 0; } /* Remove top margin for the first heading */
  .panel-content ul { list-style: none; padding: 0; margin: 0 0 10px 0; }
  .panel-content li { margin-bottom: 5px; }
  .panel-content label { display: flex; align-items: center; cursor: pointer; font-size: 0.9em; margin-bottom: 3px; }
  .panel-content input[type="checkbox"], .panel-content input[type="radio"] { margin-right: 8px; }
  .base-map-selection { margin-bottom: 10px; }
  .panel-content hr { border: none; border-top: 1px solid #555; margin: 15px 0; }
</style>