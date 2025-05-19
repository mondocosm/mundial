<!-- mundial-svelte/src/lib/components/GlobePanel.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action

  export let id = "globe-panel";
  export let visible = true;

  // Path to our working OpenGlobus direct implementation
  const openGlobusDirectPath = '/openglobus-direct.html';
  
  let iframeElement: HTMLIFrameElement;
  
  onMount(() => {
    // No special initialization needed as the iframe will load the working implementation
    console.log("GlobePanel mounted with iframe approach");
    
    return () => {
      // No special cleanup needed
      console.log("GlobePanel unmounted");
    };
  });
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="view-panel" use:draggable={{ handle: '.panel-header' }}>
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4>3D Globe View</h4>
    <button class="maximize-btn" title="Maximize/Restore">□</button>
    <button class="minimize-btn" title="Minimize/Expand">-</button>
  </div>
  <!-- Use an iframe to load our working OpenGlobus implementation -->
  <div class="globe-container">
    <iframe 
      bind:this={iframeElement} 
      src={openGlobusDirectPath} 
      title="OpenGlobus Direct" 
      class="globe-iframe"
      frameborder="0"
      allow="fullscreen"
    ></iframe>
  </div>
</div>
{/if}

<style>
  /* Adjusted styles for side-by-side layout */
  /* Keep the original panel size */
  .view-panel {
    position: absolute;
    top: 60px; /* Below toolbar */
    bottom: 10px; /* Space at bottom */
    background: none; /* Remove background to eliminate gray area */
    border: 1px solid #555;
    border-radius: 5px;
    box-sizing: border-box;
    overflow: hidden; /* Prevent scrollbars on the panel itself */
    resize: both; /* Keep resize */
    min-width: 200px;
    min-height: 150px;
    z-index: 990; /* Base z-index for view panels */
    /* Position Globe Panel on the right */
    left: calc(50% + 5px); /* Occupy right half, leaving space in middle */
    right: 10px; /* Space on right */
  }
  .panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 10px; background-color: rgba(60, 60, 60, 0.7);
    border-bottom: 1px solid #555; cursor: move; height: 30px;
    box-sizing: border-box;
    position: absolute; /* Position header as overlay */
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000; /* Ensure it's above the globe */
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
  
  /* Make the globe container fill the panel completely */
  .globe-container {
    position: absolute;
    top: 30px; /* Below header */
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: calc(100% - 30px); /* Fill entire panel minus header */
    overflow: hidden;
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }
  
  /* Style for the iframe */
  .globe-iframe {
    width: 100%;
    height: 100%;
    border: none;
    margin: 0;
    padding: 0;
    display: block;
    background: transparent;
  }
</style>