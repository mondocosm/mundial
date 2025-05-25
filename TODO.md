# TODO List for Mundial App

## High Priority / Blocking Issues

1.  **JanusWeb `clamp` Error & GLTF Loading in XR Panel:**
    *   `Uncaught TypeError: Cannot read properties of undefined (reading 'clamp')` at `janusweb.js:92194` prevents JanusWeb from initializing correctly in the XR panel (`mundial/janus_client_local/media/index.html`).
    *   This blocks loading GLTF tilesets into the JanusWeb XR view.
    *   **Status**: Multiple attempts to fix via polyfills and script path adjustments in `media/index.html` have been unsuccessful. This likely points to an issue with the specific JanusWeb library version being served/accessed or a deeper server-side configuration/build problem for JanusWeb in that context.
    *   **Next Step**: Requires investigation beyond client-side `media/index.html` modifications.

2.  **Layers Not Saving/Displaying in List:** (Existing - Priority Unchanged)
    *   Debug why newly created layers do not appear in the `#user-layer-list`.
    *   Use console logs added to `addLayerToList` and layer creation logic in `main.js`.
    *   Investigate `saveUserLayersToGun()` and `loadSavedLayers()` for persistence issues with Gun.js.
    *   Ensure Layer 0 and its default tileset (if any, like `loadTestTilesetToLayer0`) display correctly.

3.  **Tileset List Duplication:** (Existing - Priority Unchanged)
    *   Debug why tilesets are appearing doubled in the `#tileset-list` when a layer is selected or a new tileset is saved.
    *   Analyze console logs from `populateTilesetList` to see if the source OpenLayers features are duplicated or if the grouping logic is flawed.

4.  **OLCesium Globe View Issues:** (Existing - Priority Unchanged)
    *   Investigate why saved tilesets (vector features) are not appearing on the OLCesium globe view.
    *   Investigate why the ZL21 grid is not showing in the OLCesium globe view.

5.  **Pan/Select & Ctrl-Toggle for Map Interactions:** (Existing - Priority Unchanged)
    *   Debug why OpenLayers map interactions are not working correctly.
    *   Compare interaction setup with known working versions.

6.  **PolygonJS Editor Integration:** (Existing - Priority Unchanged)
    *   Resolve issues loading PolygonJS library and initializing the editor.
    *   Address potential `THREE is not defined` errors post-integration.

## UI/UX & Feature Enhancements

1.  **Globe View Default to Daytime:**
    *   **Issue**: OpenGlobus currently initializes in a "night time" mode.
    *   **Task**: Modify `initializeOpenGlobus` in `main.js` to set a default daytime sky/lighting configuration.

2.  **"Scene Window" (Three.js Viewer) Enhancements:**
    *   **Default Engine**: The main 3D viewing panel (distinct from the JanusWeb XR panel, likely `#scene-panel`) should default to using a standard Three.js renderer, not "3D Tiles" or other experimental renderers initially.
    *   **Auto-load GLTF**: When a tileset is selected (e.g., from the tileset list), its GLTF representation should automatically load into this Three.js scene window (similar to how it loads in the thumbnail). This will likely involve adapting `initThumbnailViewer` logic or creating a new function for this panel.

3.  **Map and Globe View Sync:**
    *   **Feature**: Implement two-way synchronization between the 2D map view (OpenLayers/MapLibre) and the 3D globe view (OpenGlobus/OLCesium). Changes in one view (pan, zoom, location) should reflect in the other.

4.  **Satellite Image for Tileset Bounding Box in Details Menu:**
    *   **Feature**: In the tileset details modal, display a satellite imagery snapshot corresponding to the bounding box of the selected tileset. This may involve using a static map API or generating an image from one of the map libraries.

5.  **OpenGlobus ZL21 Grid Issue:**
    *   **Bug**: The OpenGlobus globe view is showing lower zoom level grids in addition to the ZL21 grid.
    *   **Task**: Investigate the `gridLayerOG` (`CanvasTiles` layer) in `initializeOpenGlobus` to ensure it only renders the ZL21 grid or respects visibility zoom levels correctly.

6.  **Scene Panel - Verify Functionality:** (Existing - Lowered priority until GLTF loading is stable)
    *   Confirm the main "Scene" toolbar button (`#scene-btn`) correctly opens/closes the `#scene-panel`.
    *   Confirm the `#scene-panel` is correctly centered and responsively sized.
    *   Confirm the Three.js viewer initializes within the panel.

7.  **Basemap Switch for OLCesium:** (Existing - Priority Unchanged)
    *   Implement JS for `#cesium-basemap-select` visibility and functionality.

8.  **WRLDS.ID Link Format:** (Existing - Priority Unchanged)
    *   Update `updateTilesetDetailsModal` for correct `wrlds.id/ULID` format.

9.  **Implement JS for New Settings Panel Options:** (Existing - Priority Unchanged)
    *   Default Globe View.
    *   3D Model Data Source Switch.

## Technical Debt / Future Enhancements

*   **Multiple Three.js Instances Warning (JanusWeb):** (Existing)
*   **HTML Validator Warnings (Inline Styles):** (Existing)
*   **3D Tiles Direct Rendering (NASA 3DTilesRendererJS):** (Existing)
*   **Download Options (OBJ/FBX):** (Existing)

---
*Self-correction: The user mentioned "3d tile usd and i3s buttons need to be removed" again. I applied a CSS fix for this. If they are still visible, the HTML structure or CSS selectors need re-verification.*
