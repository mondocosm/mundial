<!-- mundial-svelte/src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'; // Import onMount
  import Toolbar from '$lib/components/Toolbar.svelte';
  // Remove static imports for panels that use client-side libraries
  // import MapPanel from '$lib/components/MapPanel.svelte';
  // import GlobePanel from '$lib/components/GlobePanel.svelte';
  // import BaseMapPanel from '$lib/components/BaseMapPanel.svelte';
  import SocialPanel from '$lib/components/SocialPanel.svelte';
  import ProfilePanel from '$lib/components/ProfilePanel.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import AssetsPanel from '$lib/components/AssetsPanel.svelte';
  import XRPanel from '$lib/components/XRPanel.svelte';
  import LayersPanel from '$lib/components/LayersPanel.svelte';
  import ControlsPanel from '$lib/components/ControlsPanel.svelte'; // Import ControlsPanel
  import '../app.css'; // Import global styles

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


  // Reactive state to control panel visibility
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
      <svelte:component this={MapPanelComponent} visible={showMap} />
    {/if}
    {#if GlobePanelComponent}
      <svelte:component this={GlobePanelComponent} visible={showGlobe} />
    {/if}
    {#if BaseMapPanelComponent}
      <svelte:component this={BaseMapPanelComponent} visible={showBaseMap} /> <!-- Correctly use showBaseMap -->
    {/if}
    <SocialPanel visible={showSocial} />
    <ProfilePanel visible={showProfile} />
    <SettingsPanel visible={showSettings} />
    <AssetsPanel visible={showAssets} />
    <XRPanel visible={showXR} />
    <LayersPanel visible={showLayers} />
    <ControlsPanel visible={true} /> <!-- Add ControlsPanel, always visible for now -->
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