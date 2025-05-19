<!-- mundial-svelte/src/lib/components/LayersPanel.svelte -->
<script lang="ts">
  import { draggable } from '$lib/actions/draggable';
  import { createEventDispatcher } from 'svelte';

  // --- Local Interfaces (matching layout) ---
  // (Alternatively, create a shared types file)
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
    // olSource is managed by parent, not needed here
  }

  // --- Props ---
  export let id = "layers-panel";
  export let visible = true;
  export let layers: UserLayer[] = []; // Receive layers as prop
  export let selectedLayerId: string | null = null; // Receive selected ID as prop

  // --- Event Dispatcher ---
  const dispatch = createEventDispatcher();

  // --- Derived State ---
  // Find the full selected layer object based on the ID prop
  $: selectedLayer = layers.find(layer => layer.layerId === selectedLayerId) || null;

  // --- Event Handlers ---
  function handleAddLayerClick() {
    dispatch('addlayer'); // Dispatch simple event, parent handles creation
  }

  function handleLayerClick(layerId: string) {
    dispatch('selectlayer', { layerId }); // Dispatch ID in detail
  }

  // Add type MouseEvent
  function handleZoomClick(event: MouseEvent, groupId: string) {
      event.stopPropagation(); // Prevent layer selection when clicking button
      dispatch('zoomtotileset', { groupId }); // Dispatch group ID in detail
  }

  // TODO: Dispatch events for rename, privacy, delete, visibility toggle
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="control-panel layers-panel" use:draggable={{ handle: '.panel-header' }}> <!-- Add specific class -->
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4 style="flex-grow: 0; margin-right: 5px;">Layers</h4>
    <button on:click={handleAddLayerClick} class="add-btn" title="Create New Layer">+</button> <!-- Dispatch addlayer event -->
    <div style="flex-grow: 1;"></div> <!-- Spacer -->
    <button class="minimize-btn" title="Minimize/Expand">-</button> <!-- TODO: Implement minimize -->
  </div>
  <div class="panel-content">
    <!-- List of User Layers (Uses props) -->
    <div class="user-layer-list">
      {#if layers.length === 0}
        <small><i>No layers available.</i></small>
      {:else}
        {#each layers as layer (layer.layerId)}
          <!-- Add selected class based on prop -->
          <div
            class="layer-item"
            class:selected={selectedLayerId === layer.layerId}
            on:click={() => handleLayerClick(layer.layerId)}
            role="button"
            tabindex="0"
            on:keydown={(e: KeyboardEvent) => e.key === 'Enter' && handleLayerClick(layer.layerId)}
          >
              <!-- TODO: Dispatch event for visibility toggle -->
              <input type="checkbox" checked={layer.isVisible} title="Toggle Visibility" on:click|stopPropagation>
              <span class="layer-name">{layer.name}</span>
              <div class="layer-controls">
                   <!-- TODO: Dispatch events for controls -->
                  <button title="Edit Name" on:click|stopPropagation>✏️</button>
                  <button title="Toggle Privacy" on:click|stopPropagation>{layer.isPrivate ? '🔓' : '🔒'}</button>
                  <button title="Delete Layer" on:click|stopPropagation>🗑️</button>
              </div>
          </div>
        {/each}
      {/if}
    </div>
    <hr>
    <!-- Display name of the selected layer -->
    <h5>Tilesets in: {selectedLayer ? selectedLayer.name : 'No Layer Selected'}</h5>
    <div class="tileset-list">
       {#if selectedLayer && selectedLayer.tilesets.length > 0}
         {#each selectedLayer.tilesets as tileset (tileset.groupId)}
           <div class="tileset-item">
             <span>{tileset.name}</span>
             <div class="tileset-controls">
                <!-- Dispatch zoom event -->
                <button title="Zoom to Tileset" on:click={(e: MouseEvent) => handleZoomClick(e, tileset.groupId)}>🔍</button>
                <button title="Delete Tileset" on:click|stopPropagation>🗑️</button> <!-- TODO: Dispatch delete event -->
             </div>
           </div>
         {/each}
       {:else if selectedLayer}
         <small><i>No tilesets saved in this layer yet.</i></small>
       {:else}
         <small><i>Select a layer above to view its tilesets.</i></small>
       {/if}
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
      background-color: rgba(70,70,70,0.5);
      border-radius: 3px;
      cursor: pointer; /* Indicate clickable */
      transition: background-color 0.2s ease;
  }
   .layer-item:hover {
       background-color: rgba(80,80,80,0.7);
   }
   .layer-item.selected {
       background-color: rgba(0, 100, 150, 0.6); /* Highlight selected layer */
       border: 1px solid rgba(0, 150, 200, 0.8);
   }
   .layer-item input[type="checkbox"] { margin-right: 8px; cursor: pointer; }
   .layer-name { flex-grow: 1; margin-right: 10px; pointer-events: none; }
   .layer-controls button {
       background: none; border: none; color: #ccc; cursor: pointer;
       padding: 2px 4px; font-size: 0.9em; margin-left: 3px;
   }
    .layer-controls button:hover { color: #fff; background-color: #666; }

   hr { border: none; border-top: 1px solid #444; margin: 10px 0; }

   .tileset-list {
       /* Keep existing styles */
       font-style: normal; /* Change from italic if needed */
       color: #ccc; /* Adjust color if needed */
       padding: 10px;
       background-color: rgba(0,0,0,0.2);
       border-radius: 3px;
       min-height: 50px;
       max-height: 200px; /* Limit height */
       overflow-y: auto;
   }
   /* Keep existing .tileset-item styles */
   .tileset-item {
       display: flex;
       justify-content: space-between;
       align-items: center;
       padding: 3px 5px;
       margin-bottom: 3px;
       background-color: rgba(80, 80, 80, 0.4);
       border-radius: 2px;
       font-size: 0.9em;
   }
   /* Keep existing .tileset-controls button styles */
   .tileset-controls button {
       background: none; border: none; color: #ccc; cursor: pointer;
       padding: 1px 3px; font-size: 0.8em; margin-left: 2px;
   }
    .tileset-controls button:hover { color: #fff; background-color: #666; }

</style>