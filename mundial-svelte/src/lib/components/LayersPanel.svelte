<!-- mundial-svelte/src/lib/components/LayersPanel.svelte -->
<script lang="ts">
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action
  import { writable } from 'svelte/store'; // Import writable for store if needed, or use local state

  export let id = "layers-panel"; // New ID for the actual layers panel
  export let visible = true; // Start visible as per screenshot

  // --- Layer State ---
  interface UserLayer {
    layerId: string; // Unique ID for the layer
    name: string;
    isVisible: boolean;
    isPrivate: boolean; // Example property
    tilesets: any[]; // Placeholder for tileset data
  }

  let userLayers: UserLayer[] = []; // Local state for layers
  let nextLayerId = 0; // Simple counter for unique IDs

  // --- Function to create a new layer ---
  function createNewLayer() {
    const newLayer: UserLayer = {
      layerId: `layer-${nextLayerId++}`,
      name: `Layer ${nextLayerId - 1}`,
      isVisible: true,
      isPrivate: false, // Default to public
      tilesets: []
    };
    userLayers = [...userLayers, newLayer]; // Add to the array reactively
  }

  // TODO: Add functions for deleting, renaming, toggling visibility/privacy
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="control-panel layers-panel" use:draggable={{ handle: '.panel-header' }}> <!-- Add specific class -->
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4 style="flex-grow: 0; margin-right: 5px;">Layers</h4> <!-- Allow h4 to shrink -->
    <button on:click={createNewLayer} class="add-btn" title="Create New Layer">+</button> <!-- Add layer button -->
    <div style="flex-grow: 1;"></div> <!-- Spacer -->
    <button class="minimize-btn" title="Minimize/Expand">-</button>
  </div>
  <div class="panel-content">
    <!-- List of User Layers -->
    <div class="user-layer-list">
      {#if userLayers.length === 0}
        <small><i>No layers created yet. Click '+' to add one.</i></small>
      {:else}
        {#each userLayers as layer (layer.layerId)}
          <div class="layer-item">
              <input type="checkbox" bind:checked={layer.isVisible} title="Toggle Visibility">
              <span class="layer-name">{layer.name}</span>
              <div class="layer-controls">
                  <button title="Edit Name">✏️</button> <!-- TODO: Implement rename -->
                  <button title="Toggle Privacy">{layer.isPrivate ? '🔓' : '🔒'}</button> <!-- TODO: Implement privacy toggle -->
                  <button title="Delete Layer">🗑️</button> <!-- TODO: Implement delete -->
              </div>
          </div>
        {/each}
      {/if}
    </div>
    <hr>
    <h5>Tilesets in Layer:</h5> <!-- TODO: Show tilesets for SELECTED layer -->
    <div class="tileset-list">
        Select a layer above. <!-- Updated placeholder -->
    </div>
     <!-- Add controls for selected tilesets later -->
  </div>
</div>
{/if}

<style>
  /* Use similar panel styles, adjust positioning and specifics */
  .layers-panel { /* Specific class */
    position: absolute;
    top: 90px; /* Position below minimized BaseMapPanel header (60px + 30px) */
    left: 10px; /* Align with BaseMapPanel left */
    width: 250px; /* Match BaseMapPanel width */
    max-height: calc(100vh - 80px); /* Limit height */
    background: rgba(50, 50, 50, 0.9);
    border: 1px solid #555;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    box-sizing: border-box;
    z-index: 1001; /* Slightly above BaseMapPanel */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    resize: both;
  }

  .panel-header {
    display: flex; /* Use flexbox */
    align-items: center; /* Align items vertically */
    padding: 5px 10px; background-color: rgba(60, 60, 60, 0.95);
    border-bottom: 1px solid #555; cursor: move; height: 30px;
    box-sizing: border-box; flex-shrink: 0;
  }
  .panel-header h4 { margin: 0; font-weight: bold; /* Removed flex-grow */ font-size: 0.9em; }
  .panel-header button { /* General button style */
     font-size: 14px; font-weight: bold; padding: 0 6px;
     flex-shrink: 0; background-color: #555; color: #eee;
     border: 1px solid #777; border-radius: 3px; cursor: pointer;
     margin-left: 5px; /* Add margin to all buttons */
  }
  .panel-header button.add-btn { /* Specific style for add button */
      font-size: 18px; /* Make '+' bigger */
      padding: 0 8px;
      margin-left: 0; /* Remove default left margin */
      margin-right: 5px; /* Add right margin */
  }
   .panel-header button:hover { background-color: #666; }

  .panel-content { padding: 10px; overflow-y: auto; flex-grow: 1; }
  .panel-content h5 { margin-top: 10px; margin-bottom: 5px; }

  .user-layer-list {
      margin-bottom: 10px;
      max-height: 150px; /* Limit height */
      overflow-y: auto;
      border: 1px solid #555;
      padding: 5px;
      background: #444;
  }
  .layer-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding: 4px;
      background-color: rgba(70,70,70,0.5); /* Slight background for item */
      border-radius: 3px;
  }
   .layer-item input[type="checkbox"] { margin-right: 8px; }
   .layer-name { flex-grow: 1; margin-right: 10px; }
   .layer-controls button {
       background: none; border: none; color: #ccc; cursor: pointer;
       padding: 2px 4px; font-size: 0.9em; margin-left: 3px;
   }
    .layer-controls button:hover { color: #fff; background-color: #666; }

   hr { border: none; border-top: 1px solid #444; margin: 10px 0; }

   .tileset-list {
       font-style: italic;
       color: #aaa;
       padding: 10px;
       background-color: rgba(0,0,0,0.2);
       border-radius: 3px;
       min-height: 50px; /* Example min height */
   }

</style>