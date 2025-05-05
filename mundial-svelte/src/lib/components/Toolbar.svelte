<!-- mundial-svelte/src/lib/components/Toolbar.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // State to track active buttons
  let mapActive = true;
  let globeActive = true;
  let layersActive = false;
  let socialActive = false;
  let profileActive = false; // Add state for profile
  let settingsActive = false; // Add state for settings
  let assetsActive = false;
  let xrActive = false; // Add state for XR
  let baseMapActive = true; // Add state for BaseMap, matching layout initial state

  function toggleMap() {
    mapActive = !mapActive;
    dispatch('toggleMap');
  }

  function toggleGlobe() {
    globeActive = !globeActive;
    dispatch('toggleGlobe');
  }

  function toggleLayers() { // Add handler for layers button
    layersActive = !layersActive;
    dispatch('toggleLayers');
  }

  function toggleSocial() { // Add handler for social button
    socialActive = !socialActive;
    dispatch('toggleSocial');
  }

   function toggleProfile() { // Add handler for profile
    profileActive = !profileActive;
    dispatch('toggleProfile');
  }

   function toggleSettings() { // Add handler for settings
    settingsActive = !settingsActive;
    dispatch('toggleSettings');
  }

   function toggleAssets() { // Add handler for assets
    assetsActive = !assetsActive;
    dispatch('toggleAssets');
  }

  function toggleXR() { // Add handler for XR
    xrActive = !xrActive;
    dispatch('toggleXR');
  }

  function toggleBaseMap() { // Add handler for BaseMap button
    baseMapActive = !baseMapActive;
    dispatch('toggleBaseMap');
  }

  // TODO: Add handler for Sign In
</script>

<header class="top-toolbar">
  <div class="toolbar-left">
    <div class="toolbar-title">MUNDIAL</div>
    <div class="toolbar-center">
      <input type="text" class="toolbar-input" placeholder="Search or enter command...">
    </div>
  </div>
  <div class="toolbar-spacer"></div>
  <div class="toolbar-view-buttons">
    <button
      class="toolbar-button"
      id="social-btn"
      class:active={socialActive}
      on:click={toggleSocial}
    >
      Social
    </button>
    <button
      class="toolbar-button"
      id="map-view-btn"
      class:active={mapActive}
      on:click={toggleMap}
    >
      Map
    </button>
    <button
      class="toolbar-button"
      id="globe-view-btn"
      class:active={globeActive}
      on:click={toggleGlobe}
    >
      Globe
    </button>
    <button
      class="toolbar-button"
      id="xr-view-btn"
      class:active={xrActive}
      on:click={toggleXR}
    >
      XR
    </button>
    <button
      class="toolbar-button"
      id="basemap-btn"
      class:active={baseMapActive}
      on:click={toggleBaseMap}
    >
      BaseMap
    </button>
    <button
      class="toolbar-button"
      id="layers-btn"
      class:active={layersActive}
      on:click={toggleLayers}
    >
      Layers
    </button>
    <button
      class="toolbar-button"
      id="profile-btn"
      class:active={profileActive}
      on:click={toggleProfile}
    >
      Profile
    </button>
    <button
      class="toolbar-button"
      id="settings-btn"
      class:active={settingsActive}
      on:click={toggleSettings}
    >
      Settings
    </button>
    <button
      class="toolbar-button"
      id="assets-btn"
      class:active={assetsActive}
      on:click={toggleAssets}
    >
      Assets
    </button>
    <button class="toolbar-button" id="signin-btn">Sign In</button>
  </div>
</header>

<style>
  /* Styles remain the same */
  .top-toolbar {
    background-color: #333; color: #fff; padding: 5px 20px;
    display: flex; align-items: center; position: fixed;
    top: 0; left: 0; width: 100%; height: 50px;
    box-sizing: border-box; z-index: 1100;
  }
  .toolbar-left { display: flex; align-items: center; }
  .toolbar-title { font-weight: bold; margin-right: 20px; }
  .toolbar-center { /* Styles for search */ }
  .toolbar-input {
    padding: 5px; min-width: 200px; background-color: #444;
    color: #eee; border: 1px solid #666; border-radius: 3px;
  }
  .toolbar-input::placeholder { color: #aaa; }
  .toolbar-spacer { flex-grow: 1; }
  .toolbar-view-buttons button {
    margin-left: 5px; padding: 5px 8px; cursor: pointer;
    background-color: #555; color: #eee; border: 1px solid #777;
    border-radius: 3px;
  }
  .toolbar-view-buttons button:hover { background-color: #666; }
  .toolbar-view-buttons button.active {
    background-color: #007bff; border-color: #0056b3;
    font-weight: bold;
   }
</style>