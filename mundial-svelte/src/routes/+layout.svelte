<!-- mundial-svelte/src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount, setContext } from 'svelte'; // Import onMount and setContext
  import type { Map as OlMap, Feature } from 'ol'; // Import OL types
  import VectorSource from 'ol/source/Vector.js';
  import VectorLayer from 'ol/layer/Vector.js';
  import type Polygon from 'ol/geom/Polygon.js';
  import { createEmpty, extend } from 'ol/extent.js';
  import Toolbar from '$lib/components/Toolbar.svelte';
  // import MapPanel from '$lib/components/MapPanel.svelte';
  // import GlobePanel from '$lib/components/GlobePanel.svelte';
  // import BaseMapPanel from '$lib/components/BaseMapPanel.svelte';
  import SocialPanel from '$lib/components/SocialPanel.svelte';
  import ProfilePanel from '$lib/components/ProfilePanel.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import AssetsPanel from '$lib/components/AssetsPanel.svelte';
  import XRPanel from '$lib/components/XRPanel.svelte';
  // LayersPanel is now imported statically as it doesn't depend on client-side map libs directly
  import LayersPanel from '$lib/components/LayersPanel.svelte';
  import ControlsPanel from '$lib/components/ControlsPanel.svelte';
  import '../app.css';

  // Variables to hold dynamically imported components
  let MapPanelComponent: any = null;
  let GlobePanelComponent: any = null;
  let BaseMapPanelComponent: any = null;
  let panelsLoaded = false;

  onMount(async () => {
    MapPanelComponent = (await import('$lib/components/MapPanel.svelte')).default;
    GlobePanelComponent = (await import('$lib/components/GlobePanel.svelte')).default;
    BaseMapPanelComponent = (await import('$lib/components/BaseMapPanel.svelte')).default;
    panelsLoaded = true;
  });

  // --- Interfaces for Layer/Tileset Data ---
  interface Tileset {
    groupId: string;
    name: string;
  }

  interface UserLayer {
    layerId: string;
    name: string;
    isVisible: boolean;
    isPrivate: boolean;
    tilesets: Tileset[];
    olSource: VectorSource<Feature<Polygon>>; // Keep track of the source
    olLayer?: VectorLayer<VectorSource<Feature<Polygon>>>; // Optional reference to the layer itself
  }

  // --- Shared State Management ---
  let userLayers: UserLayer[] = []; // Initialize empty, will add default in onMount
  let selectedLayerId: string | null = null;
  let mapInstance: OlMap | null = null; // To hold the map instance
  let nextLayerIdCounter = 0; // Start counter at 0 for default layer

  // Initialize default layer 0 in onMount to ensure VectorSource is created client-side
  onMount(() => {
    handleAddLayer('Layer 0'); // Create default layer
    // Ensure the first layer is selected initially
    if (userLayers.length > 0 && !selectedLayerId) {
       selectedLayerId = userLayers[0].layerId;
    }
  });

  // --- Event Handlers ---

  // Called from LayersPanel '+' button
  function handleAddLayer(defaultName?: string) {
    const newLayerName = defaultName || `Layer ${nextLayerIdCounter}`;
    const newLayerId = `layer-${nextLayerIdCounter++}`;
    const newSource = new VectorSource<Feature<Polygon>>();
    const newOlLayer = new VectorLayer({
        source: newSource,
        // Add style if needed
        properties: { title: newLayerName } // Store name for potential lookup
    });

    const newLayer: UserLayer = {
      layerId: newLayerId,
      name: newLayerName,
      isVisible: true,
      isPrivate: false,
      tilesets: [],
      olSource: newSource,
      olLayer: newOlLayer // Store reference to the OL layer
    };

    userLayers = [...userLayers, newLayer];
    selectedLayerId = newLayerId; // Select the new layer

    // Add the new OpenLayers layer to the map if the map is ready
    if (mapInstance) {
        mapInstance.addLayer(newOlLayer);
        console.log(`Layout: Added OL layer "${newLayerName}" to map.`);
    } else {
         console.warn(`Layout: Map not ready when adding layer "${newLayerName}". Layer will be added when map is ready.`);
    }
  }

  // Called from LayersPanel layer item click
  function handleSelectLayer(event: CustomEvent<{ layerId: string }>) {
    selectedLayerId = event.detail.layerId;
    console.log("Layout: Selected layer ID:", selectedLayerId);
  }

  // Called from MapPanel when tileset is saved
  function handleTilesetSaved(event: CustomEvent<{ name: string; groupId: string; features: Feature<Polygon>[] }>) {
    const { name, groupId, features } = event.detail;
    console.log(`Layout: Received tilesetsaved event for group ${groupId} (${name}) with ${features.length} features.`);

    if (!selectedLayerId) {
      console.error("Layout: Cannot save tileset, no layer selected.");
      alert("Error: No layer selected to save the tileset to.");
      return;
    }

    const targetLayerIndex = userLayers.findIndex(l => l.layerId === selectedLayerId);
    if (targetLayerIndex === -1 || !userLayers[targetLayerIndex].olSource) {
      console.error(`Layout: Cannot save tileset, target layer ${selectedLayerId} or its source not found.`);
      alert(`Error: Could not find target layer ${selectedLayerId}.`);
      return;
    }

    // Add the features to the target OpenLayers source
    userLayers[targetLayerIndex].olSource.addFeatures(features);
    console.log(`Layout: Added ${features.length} features to OL source for layer ${userLayers[targetLayerIndex].name}`);

    // Update the metadata in the userLayers state array
    const newTileset: Tileset = { name, groupId };
    userLayers[targetLayerIndex].tilesets = [...userLayers[targetLayerIndex].tilesets, newTileset];
    userLayers = [...userLayers]; // Trigger reactivity

    console.log(`Layout: Updated tileset metadata for layer ${userLayers[targetLayerIndex].name}`);
  }

  // Called from LayersPanel zoom button click
  function handleZoomToTileset(event: CustomEvent<{ groupId: string }>) {
      const groupId = event.detail.groupId;
      console.log(`Layout: Received zoomtotileset event for group ${groupId}`);
      if (!mapInstance) {
          console.error("Layout: Cannot zoom, map instance not available.");
          return;
      }

      let targetFeatures: Feature<Polygon>[] = [];
      // Find features across all managed layer sources
      for (const layer of userLayers) {
          const featuresInSource = layer.olSource.getFeatures();
          // Add type annotation for f
          const matchingFeatures = featuresInSource.filter((f: Feature<Polygon>) => f.get('tilesetGroupId') === groupId);
          targetFeatures = targetFeatures.concat(matchingFeatures);
      }

      if (targetFeatures.length > 0) {
          const extent = createEmpty();
          targetFeatures.forEach(feature => {
              const geom = feature.getGeometry();
              if (geom) { extend(extent, geom.getExtent()); }
          });

          if (extent[0] === Infinity) {
               console.error("Layout: Could not calculate valid extent for zoom."); return;
          }
          console.log(`Layout: Zooming to extent for group ${groupId}:`, extent);
          mapInstance.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000, maxZoom: 21 });
      } else {
          console.warn(`Layout: No features found for tileset group ID: ${groupId} to zoom to.`);
          alert(`Could not find tileset group "${groupId}" on the map.`);
      }
  }

   // Called from MapPanel when map is ready
   function handleMapReady(event: CustomEvent<{ map: OlMap }>) {
       console.log("Layout: Map ready event received.");
       mapInstance = event.detail.map;
       // Add any layers that were created before the map was ready
       userLayers.forEach(layer => {
           if (layer.olLayer && !mapInstance?.getLayers().getArray().includes(layer.olLayer)) {
               mapInstance?.addLayer(layer.olLayer);
               console.log(`Layout: Added pre-existing OL layer "${layer.name}" to map.`);
           }
       });
   }

  // --- Panel Visibility State ---
  let showMap = true;
  let showGlobe = true;
  let showLayers = true; // Start visible
  let showSocial = false;
  let showProfile = false;
  let showSettings = false;
  let showAssets = false;
  let showXR = false; // Add state for XR
  let showBaseMap = true; // Add state for BaseMapPanel

  // Handlers to toggle visibility based on events from Toolbar
  function handleToggleMap() {
    showMap = !showMap;
  }

  function handleToggleGlobe() {
    showGlobe = !showGlobe;
  }

  function handleToggleLayers() { // Add handler for Layers
    showLayers = !showLayers;
  }

  function handleToggleSocial() { // Add handler for Social
    showSocial = !showSocial;
  }

  function handleToggleProfile() { // Add handler for Profile
    showProfile = !showProfile;
  }

  function handleToggleSettings() { // Add handler for Settings
    showSettings = !showSettings;
  }

   function handleToggleAssets() { // Add handler for Assets
    showAssets = !showAssets;
  }

  function handleToggleXR() { // Add handler for XR
    showXR = !showXR;
  }

  function handleToggleBaseMap() { // Add handler for BaseMap
    showBaseMap = !showBaseMap;
  }

</script>

<!-- Listen for custom events dispatched by Toolbar -->
<Toolbar
  on:toggleMap={handleToggleMap}
  on:toggleGlobe={handleToggleGlobe}
  on:toggleLayers={handleToggleLayers}
  on:toggleSocial={handleToggleSocial}
  on:toggleProfile={handleToggleProfile}
  on:toggleSettings={handleToggleSettings}
  on:toggleAssets={handleToggleAssets}
  on:toggleXR={handleToggleXR}
  on:toggleBaseMap={handleToggleBaseMap}
/>

<main>
  <!-- Render panels conditionally based on state AND if loaded -->
  {#if panelsLoaded}
    {#if MapPanelComponent}
      <!-- Pass layers down and listen for events -->
      <svelte:component
        this={MapPanelComponent}
        visible={showMap}
        layers={userLayers}
        on:mapready={handleMapReady}
        on:tilesetsaved={handleTilesetSaved}
      />
    {/if}
    {#if GlobePanelComponent}
      <svelte:component this={GlobePanelComponent} visible={showGlobe} />
    {/if}
    {#if BaseMapPanelComponent}
      <svelte:component this={BaseMapPanelComponent} visible={showBaseMap} />
    {/if}
    <SocialPanel visible={showSocial} />
    <ProfilePanel visible={showProfile} />
    <SettingsPanel visible={showSettings} />
    <AssetsPanel visible={showAssets} />
    <XRPanel visible={showXR} />
    <!-- Pass state down and listen for events -->
    <LayersPanel
       visible={showLayers}
       layers={userLayers}
       selectedLayerId={selectedLayerId}
       on:addlayer={handleAddLayer}
       on:selectlayer={handleSelectLayer}
       on:zoomtotileset={handleZoomToTileset}
    />
    <ControlsPanel visible={true} />
  {:else}
    <!-- Optional: Show a loading indicator -->
    <p>Loading map components...</p>
  {/if}

  <!-- Page content goes here -->
  <slot />
</main>

<style>
  main {
    position: relative; /* Keep relative for positioning context */
    padding-top: 50px; /* Match toolbar height */
    /* Remove fixed height and overflow: hidden */
    /* Let content determine height */
    min-height: calc(100vh - 50px); /* Ensure it fills viewport vertically */
    background-color: transparent; /* Make main background transparent */
    /* The body background from app.css will show through */
  }

  /* Remove the :global(main > *) rule, as the slot is now empty */

   /* Ensure panels are positioned correctly */
   :global(.view-panel), :global(.control-panel) {
       /* Keep z-index, positioning is handled in components */
       z-index: 10;
   }
   :global(.control-panel) {
        z-index: 1000;
   }
</style>