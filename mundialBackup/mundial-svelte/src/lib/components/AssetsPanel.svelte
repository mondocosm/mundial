<!-- mundial-svelte/src/lib/components/AssetsPanel.svelte -->
<script lang="ts">
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action

  export let id = "assets-panel";
  export let visible = false; // Start hidden

  // TODO: Add asset management logic (upload, list, etc.)
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="view-panel assets-panel" use:draggable={{ handle: '.panel-header' }}>
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4>Assets</h4>
    <button class="maximize-btn" title="Maximize/Restore">□</button>
    <button class="minimize-btn" title="Minimize/Expand">-</button>
  </div>
  <div class="panel-content">
    <p>Asset management interface will go here.</p>
    <!-- Placeholder for asset list, upload button, etc. -->
    <button>Upload Asset</button>
    <ul>
        <li>Asset 1.glb</li>
        <li>Texture.png</li>
    </ul>
  </div>
</div>
{/if}

<style>
  /* Basic panel styles, adjust positioning */
  .assets-panel { /* Specific class */
    position: absolute;
    top: 140px; /* Example position */
    right: 320px; /* Example position */
    width: 350px; /* Example width */
    max-height: calc(100vh - 160px);
    background: rgba(45, 45, 45, 0.9);
    border: 1px solid #555;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    box-sizing: border-box;
    z-index: 992; /* Adjust z-index as needed */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    resize: both;
  }

  .panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 10px; background-color: rgba(55, 55, 55, 0.95);
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
    padding: 15px;
    overflow-y: auto;
    flex-grow: 1;
  }
   .panel-content button {
       margin-bottom: 10px;
       padding: 5px 10px;
   }
   .panel-content ul {
       list-style: none;
       padding: 0;
       margin: 0;
   }
    .panel-content li {
        padding: 3px 0;
        border-bottom: 1px solid #444;
    }
</style>