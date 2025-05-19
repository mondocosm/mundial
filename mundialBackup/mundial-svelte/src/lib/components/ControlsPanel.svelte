<!-- mundial-svelte/src/lib/components/ControlsPanel.svelte -->
<script lang="ts">
  import { draggable } from '$lib/actions/draggable'; // Import draggable action
  import { interactionMode, toggleInteractionMode } from '$lib/stores/uiStore'; // Import shared state

  export let id = "app-controls"; // Match original ID
  export let visible = true; // Assume visible by default for now

  // Subscribe to the store value for button text
  let currentMode: 'pan' | 'select';
  interactionMode.subscribe(value => {
    currentMode = value;
  });

</script>

{#if visible}
<!-- Apply draggable action -->
<div {id} class="control-panel" use:draggable={{ handle: '.panel-header' }}>
  <div class="panel-header">
    <h4>Controls</h4>
    <button class="minimize-btn" title="Minimize/Expand">-</button> <!-- TODO: Implement minimize -->
  </div>
  <div class="panel-content">
    <!-- Interaction Mode Button -->
    <button on:click={toggleInteractionMode} title="Toggle Interaction Mode" class="mode-button">
        Mode: {currentMode === 'pan' ? 'Pan' : 'Select'}
    </button>
    <!-- Add other controls later -->
  </div>
</div>
{/if}

<style>
  /* Basic panel styles, similar to others */
  .control-panel {
    position: absolute;
    bottom: 10px; /* Position at bottom */
    left: 10px; /* Position left */
    width: 250px; /* Match BaseMapPanel width */
    /* max-height: calc(100vh - 80px); */ /* Let content determine height for now */
    background: rgba(50, 50, 50, 0.9);
    border: 1px solid #555;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    box-sizing: border-box;
    z-index: 1001; /* Above BaseMapPanel */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    resize: both;
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

  .panel-content {
    padding: 10px;
    /* overflow-y: auto; */ /* Not needed for single button yet */
    flex-grow: 1;
  }

  .mode-button {
      width: 100%;
      padding: 8px;
      text-align: center;
      background-color: #444;
      color: #eee;
      border: 1px solid #666;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.9em;
  }
  .mode-button:hover {
      background-color: #555;
  }
</style>