# TODO List for Mundial App

## High Priority / Blocking Issues

1.  **Layers Not Saving/Displaying in List:**
    *   Debug why newly created layers do not appear in the `#user-layer-list`.
    *   Use console logs added to `addLayerToList` and layer creation logic in `main.js`.
    *   Investigate `saveUserLayersToGun()` and `loadSavedLayers()` for persistence issues with Gun.js.
    *   Ensure Layer 0 and its default tileset (if any, like `loadTestTilesetToLayer0`) display correctly.

2.  **Tileset List Duplication:**
    *   Debug why tilesets are appearing doubled in the `#tileset-list` when a layer is selected or a new tileset is saved.
    *   Analyze console logs from `populateTilesetList` (especially `[POPULATE_DEBUG] Grouped tilesets...`) to see if the source OpenLayers features are duplicated or if the grouping logic is flawed on subsequent calls.
    *   Verify the fix that removed one `populateTilesetList` call was sufficient or if the underlying data in the OL layer source is the issue.

3.  **OLCesium Globe View Issues:**
    *   Investigate why saved tilesets (vector features) are not appearing on the OLCesium globe view. Check how features are synchronized or added to the Cesium scene by OLCesium.
    *   Investigate why the ZL21 grid is not showing in the OLCesium globe view. Check the `updateCesiumZL21Grid` function and Cesium data source management.

4.  **Pan/Select & Ctrl-Toggle for Map Interactions:**
    *   Debug why OpenLayers map interactions (pan, single-click select, drag-box select) are not working correctly in `wrlds/js/main.js`.
    *   Console logs indicate mode switching logic is firing, but visual map behavior doesn't match.
    *   Compare interaction setup (`dragPanInteraction`, `dragBoxInteraction`, event listeners for `interaction-mode-btn`, Ctrl key, `singleclick`, `boxstart`, `boxend`) with the working version in `/home/jeome/mondocosm/mundial517/js/main.js`.
    *   Ensure OpenLayers interaction instances are correctly initialized, added to the map, and that their `setActive()` calls are effective.

5.  **PolygonJS Editor Integration:**
    *   Resolve issues loading PolygonJS library (`all.js` or `example.js`) in `wrlds/index.html` and `wrlds/js/main.js`.
    *   Ensure `POLYGONJS.Editor` is correctly initialized and accessible.
    *   Investigate `SyntaxError: Unexpected token 'export'` if it reappears, potentially related to server MIME types or the PolygonJS build itself.
    *   Address `THREE is not defined` errors for OrbitControls/GLTFExporter after PolygonJS is working, possibly by using PolygonJS's internal Three.js instance or re-introducing a global Three.js if necessary and compatible.

6.  **Scene Panel - Verify Functionality:**
    *   Confirm the main "Scene" toolbar button (`#scene-btn`) correctly opens/closes the `#scene-panel`.
    *   Confirm the `#scene-panel` is correctly centered and responsively sized as per CSS.
    *   Confirm the Three.js viewer initializes within the panel.
    *   Test if clicking the "3D Tile" button (inside `#scene-panel`, now using feature's `glbUrl` or heightmap fallback) successfully loads a model.

## UI/UX & Feature Enhancements

5.  **Scene Panel - Auto-load Selected Tileset (New UX):**
    *   Per-tileset "View 3D", "Edit", and "Delete" buttons have been removed from the tileset list items in `populateTilesetList` (main.js).
    *   **Implement:** When a tileset item in the `#tileset-list` is clicked:
        *   The Scene Panel (`#scene-panel`) should open automatically if it's closed.
        *   The 3D representation of the selected tileset should load into the Three.js viewer within the Scene Panel. (Initially, this can use the test path in `generateAndShowTilesetInThreeJS` which calls `initiateTilesetConversionToGltf` with a sample `tileset.json`. Later, it will use the actual selected tileset's data, potentially involving I3S or on-the-fly `tileset.json` generation).

6.  **Basemap Switch for OLCesium:**
    *   Implement JavaScript logic to show the `#cesium-basemap-select` dropdown (in "Maps" menu / `#layer-switcher`) only when "OL-Cesium" is the active globe library.
    *   Implement JavaScript to handle the `change` event on `#cesium-basemap-select` to update the active OLCesium instance's imagery provider.

7.  **WRLDS.ID Link Format:**
    *   Review and update the `updateTilesetDetailsModal` function in `main.js` to ensure the `tileset-wrlds-link` href is formatted as `wrlds.id/ULID` (e.g., `wrlds.id/01ARZ3NDEKTSV4RRFFQ69G5FAV`) instead of `wrlds.id/...` when a ULID is available.

8.  **Implement JS for New Settings Panel Options:**
    *   **Default Globe View:** Implement JS for the "Set as Default" button in the Globes menu. Save the selected globe library (from `#globe-library-select`) to `localStorage` and load this preference on startup. Update the `default-globe-set-indicator` paragraph.
    *   **3D Model Data Source Switch:** Implement JS for the "Terrain Sampling vs. Direct Mesh" radio buttons in the Settings panel. Save the preference (e.g., to `localStorage`) and use this setting in `main.js` (within `sceneType3dtileBtn` listener / `generateAndShowTilesetInThreeJS`) to determine the default `dataSourceType` if not overridden by feature-specific data.

## Technical Debt / Future Enhancements

9.  **Multiple Three.js Instances Warning:**
    *   Investigate the "WARNING: Multiple instances of Three.js being imported" (from JanusWeb). Determine if JanusWeb can use the globally provided Three.js instance or if a strategy to manage/isolate instances is needed to prevent potential conflicts.

10. **HTML Validator Warnings (Inline Styles):**
    *   Perform a pass over `mundial/index.html` to move inline styles identified by `html-validate` into appropriate CSS classes in `mundial/css/style.css` to improve maintainability and adherence to best practices.

11. **3D Tiles Direct Rendering (NASA 3DTilesRendererJS):**
    *   Evaluate integrating `NASA-AMMOS/3DTilesRendererJS` as suggested by the user for direct rendering of 3D Tilesets within the Three.js view in the Scene Panel. This would be an alternative or enhancement to the current GLB loading / heightmap generation.

12. **Download Options (OBJ/FBX):**
    *   Implement OBJ and FBX export functionality for the Download modal. This will require integrating `THREE.OBJExporter` and potentially an FBX exporter library if one is suitable for client-side use, or a server-side conversion step.

---
*Self-correction: The user mentioned "3d tile usd and i3s buttons need to be removed" again. I applied a CSS fix for this. If they are still visible, the HTML structure or CSS selectors need re-verification.*
