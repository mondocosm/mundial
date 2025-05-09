<!-- mundial-svelte/src/lib/components/TilesetDetailsModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Feature } from 'ol';
  import type Polygon from 'ol/geom/Polygon';
  import { toLonLat } from 'ol/proj.js';
  import { getCenter } from 'ol/extent.js';
  import { createXYZ } from 'ol/tilegrid.js';

  // Props
  export let visible = false;
  export let feature: Feature<Polygon> | null = null;
  export let tilesetGroupId: string | null = null;
  export let tilesetName: string = '';
  export let tilesetColor: string = '#008080'; // Default teal color
  export let tilesetImageUrl: string = '';
  export let tilesetLinkUrl: string = '';
  export let tilesetTags: string = '';
  export let tileCount: number = 0;
  export let coordinates: string = 'N/A';

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Derived values
  $: hasImage = tilesetImageUrl && tilesetImageUrl.trim().length > 0;

  // Close the modal
  function closeModal() {
    visible = false;
    dispatch('close');
  }

  // Save changes
  function saveChanges() {
    if (!tilesetGroupId) {
      console.error("Cannot save changes: No tileset group ID provided");
      return;
    }

    dispatch('save', {
      groupId: tilesetGroupId,
      name: tilesetName,
      color: tilesetColor,
      imageUrl: tilesetImageUrl,
      linkUrl: tilesetLinkUrl,
      tags: tilesetTags
    });

    closeModal();
  }

  // Calculate coordinates from feature if provided
  $: if (feature && !coordinates) {
    try {
      const geometry = feature.getGeometry();
      if (geometry) {
        const extent = geometry.getExtent();
        const center = getCenter(extent);
        const lonLat = toLonLat(center);
        coordinates = `~ ${lonLat[1].toFixed(4)}, ${lonLat[0].toFixed(4)}`; // Lat, Lon
      }
    } catch (error) {
      console.error("Error calculating coordinates:", error);
    }
  }

  // Calculate tile count if feature is provided and count is 0
  $: if (feature && tileCount === 0) {
    const tileId = feature.get('tileKey');
    if (tileId) {
      tileCount = 1; // At minimum, this feature represents one tile
    }
  }
</script>

{#if visible}
<div class="modal-backdrop">
  <div class="modal-container">
    <div class="modal-header">
      <h3>Tileset Details</h3>
      <button class="close-btn" on:click={closeModal}>×</button>
    </div>
    <div class="modal-content">
      <div class="form-group">
        <label for="tileset-name">Name:</label>
        <input type="text" id="tileset-name" bind:value={tilesetName} placeholder="Enter tileset name">
      </div>
      
      <div class="form-group">
        <label for="tileset-color">Color:</label>
        <input type="color" id="tileset-color" bind:value={tilesetColor}>
      </div>
      
      <div class="form-group">
        <label for="tileset-image-url">Image URL:</label>
        <input type="text" id="tileset-image-url" bind:value={tilesetImageUrl} placeholder="Enter image URL">
      </div>
      
      {#if hasImage}
        <div class="image-preview">
          <img src={tilesetImageUrl} alt="Tileset preview" on:error={() => tilesetImageUrl = ''}>
        </div>
      {/if}
      
      <div class="form-group">
        <label for="tileset-link">Link URL:</label>
        <input type="text" id="tileset-link" bind:value={tilesetLinkUrl} placeholder="Enter link URL">
      </div>
      
      <div class="form-group">
        <label for="tileset-tags">Tags:</label>
        <textarea id="tileset-tags" bind:value={tilesetTags} placeholder="Enter tags (comma separated)"></textarea>
      </div>
      
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">Coordinates:</span>
          <span class="info-value">{coordinates}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tile Count:</span>
          <span class="info-value">{tileCount}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Location:</span>
          <span class="info-value">Loading...</span>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="cancel-btn" on:click={closeModal}>Cancel</button>
      <button class="save-btn" on:click={saveChanges}>Save Changes</button>
    </div>
  </div>
</div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }
  
  .modal-container {
    background-color: #333;
    border-radius: 5px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #444;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    border-bottom: 1px solid #555;
  }
  
  .modal-header h3 {
    margin: 0;
    color: #fff;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #ccc;
    font-size: 24px;
    cursor: pointer;
  }
  
  .close-btn:hover {
    color: #fff;
  }
  
  .modal-content {
    padding: 15px;
    overflow-y: auto;
    flex-grow: 1;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    color: #ccc;
  }
  
  .form-group input, .form-group textarea {
    width: 100%;
    padding: 8px;
    background-color: #444;
    border: 1px solid #555;
    border-radius: 3px;
    color: #fff;
  }
  
  .form-group textarea {
    height: 80px;
    resize: vertical;
  }
  
  .image-preview {
    margin: 10px 0;
    text-align: center;
  }
  
  .image-preview img {
    max-width: 100%;
    max-height: 200px;
    border: 1px solid #555;
  }
  
  .info-section {
    margin-top: 20px;
    padding: 10px;
    background-color: #444;
    border-radius: 3px;
  }
  
  .info-item {
    margin-bottom: 5px;
  }
  
  .info-label {
    font-weight: bold;
    color: #ccc;
    margin-right: 10px;
  }
  
  .info-value {
    color: #fff;
  }
  
  .modal-footer {
    padding: 10px 15px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    border-top: 1px solid #555;
  }
  
  .cancel-btn, .save-btn {
    padding: 8px 15px;
    border-radius: 3px;
    cursor: pointer;
  }
  
  .cancel-btn {
    background-color: #555;
    color: #fff;
    border: 1px solid #666;
  }
  
  .save-btn {
    background-color: #2a5885;
    color: #fff;
    border: 1px solid #3a6895;
  }
  
  .cancel-btn:hover {
    background-color: #666;
  }
  
  .save-btn:hover {
    background-color: #3a6895;
  }
</style>