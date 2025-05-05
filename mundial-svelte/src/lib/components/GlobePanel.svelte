<!-- mundial-svelte/src/lib/components/GlobePanel.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { globusInstance } from '$lib/stores/mapStore'; // Import the store
  // Type definition for Globe needed for internal variable
  import type { Globe as IGlobe } from '@openglobus/og';
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action

  export let id = "globe-panel";
  export let visible = true;

  let globeElement: HTMLDivElement;
  let globusInstanceInternal: IGlobe | null = null; // Use internal variable with type

  onMount(() => {
    let initialized = false; // Flag to prevent double initialization
    let _globusInstanceInternal: IGlobe | null = null; // Local copy for cleanup

    const initGlobe = async () => {
        if (initialized || !globeElement) return;
        initialized = true;

        // Dynamically import OpenGlobus only on the client
        const { Globe, XYZ, GlobusTerrain, CanvasTiles, LonLat, control } = await import('@openglobus/og');

        // Define base layers - Pass name as first argument
        const osmLayerOG = new XYZ("OpenStreetMap", {
            isBaseLayer: true,
            url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            visibility: false, // Start hidden
            attribution: 'Data @ OpenStreetMap contributors, ODbL'
            // Removed incorrect 'name' property from options
        });
        const satelliteLayerOG = new XYZ("Satellite", {
            isBaseLayer: true,
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            visibility: true, // Start visible
            attribution: 'Tiles © ArcGIS',
            maxZoom: 19
            // Removed incorrect 'name' property from options
        });

        // Define ZL21 Grid Layer - Pass name as first argument
        const gridLayerOG = new CanvasTiles("ZL21 Grid", {
            minZoom: 16,
            maxZoom: 21,
            visibility: true,
            opacity: 0.6,
            // Removed incorrect 'name' property from options
            drawTile: function (material, applyTexture) {
                const canvas = document.createElement("canvas");
                const size = 256; // Standard tile size
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // Add null check for ctx
                if (!ctx) {
                    console.error("Failed to get 2D context for grid tile canvas");
                    applyTexture(canvas); // Apply empty canvas
                    return;
                }

                // Add null check for material.segment (as seen in original code)
                if (!material.segment) {
                    console.warn("drawTile called with null material.segment for ZL21 Grid");
                    applyTexture(canvas); // Apply empty canvas
                    return;
                }

                ctx.clearRect(0, 0, size, size);

                const currentTileZoom = material.segment.tileZoom;
                const targetGridZoom = 21; // The target zoom level for the finest grid

                // Only draw if the current tile zoom is within the layer's range
                // Access minZoom/maxZoom directly from the gridLayerOG instance
                if (currentTileZoom >= gridLayerOG.minZoom && currentTileZoom <= gridLayerOG.maxZoom) {
                    // Increase line weight for better visibility
                    const lineWeight = 1; // Increased from 0.5
                    ctx.lineWidth = lineWeight;
                    // Make grid fully opaque black
                    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';

                    // --- Optimization: Limit subdivisions to prevent freezing ---
                    const maxZoomDiff = 5; // Limit subdivisions to 2^5 = 32x32 grid max per tile
                    const zoomDiff = Math.min(targetGridZoom - currentTileZoom, maxZoomDiff);
                    const subdivisions = Math.pow(2, zoomDiff);
                    // --- End Optimization ---

                    const step = size / subdivisions;

                    ctx.beginPath();
                    // Draw vertical lines
                    for (let i = 1; i < subdivisions; i++) {
                        const x = i * step;
                        // Ensure lines are drawn sharply
                        ctx.moveTo(Math.round(x) + lineWeight / 2, 0);
                        ctx.lineTo(Math.round(x) + lineWeight / 2, size);
                    }
                    // Draw horizontal lines
                    for (let i = 1; i < subdivisions; i++) {
                        const y = i * step;
                        // Ensure lines are drawn sharply
                        ctx.moveTo(0, Math.round(y) + lineWeight / 2);
                        ctx.lineTo(size, Math.round(y) + lineWeight / 2);
                    }
                    ctx.stroke();

                    // Optional: Draw tile border (can be helpful for debugging)
                    // ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                    // ctx.lineWidth = 1;
                    // ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
                }
                // If outside minZoom/maxZoom, canvas remains clear

                applyTexture(canvas);
            }
        });

        // Initialize Globe - Remove the 'controls' option entirely
        // to allow default controls (including input handlers) to initialize.
        _globusInstanceInternal = new Globe({
            target: globeElement,
            name: "Mundial Globe",
            terrain: new GlobusTerrain(),
            layers: [ osmLayerOG, satelliteLayerOG, gridLayerOG ]
            // Removed resourcesSrc and fontsSrc options as they cause 404s in SvelteKit
            // No 'controls' option specified here
        });

        // Default controls (including ZoomControl, CompassControl, etc.) will now be added automatically.
        // We might need to hide them with CSS later if they cause the gray area.
        // _globusInstanceInternal.planet.addControl(new control.ZoomControl());

        // No need to add ZoomControl separately anymore
        // _globusInstanceInternal.planet.addControl(new control.ZoomControl());
        // No need to attempt removal of defaults anymore

        // Set initial view after initialization
        requestAnimationFrame(() => {
            if (_globusInstanceInternal) {
                _globusInstanceInternal.planet.viewLonLat(new LonLat(-74.0445, 40.6892, 300));
            }
        });

        // Update the store and the component's internal variable
        globusInstanceInternal = _globusInstanceInternal;
        globusInstance.set(globusInstanceInternal);

        // Re-add resize trigger using renderer.resize() as seen in main.js
        setTimeout(() => {
            if (_globusInstanceInternal && _globusInstanceInternal.planet && _globusInstanceInternal.planet.renderer) {
                 try {
                     console.log("Attempting renderer.resize()...");
                     _globusInstanceInternal.planet.renderer.resize();
                     console.log("renderer.resize() called successfully.");
                 } catch (e) {
                     console.error("Failed to call renderer.resize():", e);
                     // Fallback: Dispatch window resize event if renderer.resize fails
                     console.log("Falling back to dispatching window resize event...");
                     window.dispatchEvent(new Event('resize'));
                 }
            }
        }, 100); // Delay in milliseconds
    };

    // Run initialization logic
    initGlobe();

    // Return the cleanup function synchronously
    return () => {
      if (globusInstanceInternal) { // Use the component's variable for cleanup check
        globusInstance.set(null);
        globusInstanceInternal.destroy();
        globusInstanceInternal = null;
        _globusInstanceInternal = null; // Also clear local copy
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
    <h4>3D Globe View</h4>
    <button class="maximize-btn" title="Maximize/Restore">□</button>
    <button class="minimize-btn" title="Minimize/Expand">-</button>
  </div>
  <!-- Bind this div to the globeElement variable -->
  <div bind:this={globeElement} id="globusContainer" class="globe-container"></div>
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
    /* Position Globe Panel on the right */
    left: calc(50% + 5px); /* Occupy right half, leaving space in middle */
    right: 10px; /* Space on right */
    /* Removed fixed width */
  }
  .panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 10px; background-color: rgba(60, 60, 60, 0.95);
    border-bottom: 1px solid #555; cursor: move; height: 30px;
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
  .globe-container {
    position: absolute; top: 30px; left: 0; bottom: 0; right: 0;
    width: 100%; height: calc(100% - 30px); overflow: hidden;
    /* Ensure no internal padding/margin causes issues */
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }
  /* Removed CSS overrides for canvas */

  /* Position default controls as overlays */
  :global(.og-compass-control) {
      position: absolute !important;
      top: 10px !important; /* Adjust as needed */
      right: 10px !important; /* Adjust as needed */
      transform: scale(0.7); /* Keep it slightly smaller */
      transform-origin: top right;
  }
  :global(.og-zoom-control) {
      position: absolute !important;
      bottom: 50px !important; /* Adjust as needed */
      right: 10px !important; /* Adjust as needed */
  }
   :global(.og-coordinates-control) {
       position: absolute !important;
       bottom: 10px !important; /* Adjust as needed */
       left: 10px !important; /* Adjust as needed */
       background: rgba(50, 50, 50, 0.7) !important; /* Optional: Add background for readability */
       padding: 2px 5px !important;
       border-radius: 3px !important;
       color: white !important;
   }
   /* Hide scale control if not desired */
   :global(.og-scale-control) {
       display: none !important;
   }
</style>