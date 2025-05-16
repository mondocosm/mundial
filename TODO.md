# Mundial Map Application TODO List

## Tileset Selection & Details
-   [ ] **Deselect on Click / Hide Details:**
    -   [X] Clicking a selected tileset on the map deselects it and hides details.
    -   [X] Clicking a selected tileset in the list deselects it and hides details.
    -   [ ] Ensure `tilesetDetailsModal` hides if `selectionSource` is cleared by other means (e.g., "Clear Selection" button, new box select).
-   [ ] **Zoom to Tileset Level:** Adjust "zoom to tileset" to ZL19 or ZL20 for OpenLayers map. (Globe fly-to behavior to be reviewed).
-   [ ] **Globe goes black when zooming to a tileset.** (May be related to terrain issues or if ZL21 tiles aren't rendering due to overview logic errors).
-   [ ] **Color Picker Type:** Change the color picker to swatches.
-   [ ] **Independent Stroke/Fill Color:** Allow stroke and fill colors to be set separately.
-   [ ] **Color Picker Default Color:** The default color *shown in the color picker itself* could be different from selected tile/tileset colors.
-   [X] **Tilesets on Globe (ZL21):** Tilesets are visible and render correctly on the globe at ZL21 (when overview logic doesn't interfere).
-   [ ] **Tilesets on Globe (Overview ZL15-ZL20):**
    -   [ ] **FIX:** Current attempt at complex rendering (scaled ZL21 tiles) for ZL15-ZL20 causes `TypeError: overviewTileGeoExtent.intersects is not a function`. This prevents overview tiles from drawing and might affect ZL21 rendering if not handled.
    -   [ ] (If fix is too complex now) Revert to stable placeholder rendering (e.g., faint tint if layer has features) for ZL15-ZL20.
    -   [ ] (Lower Priority, after fix/revert) Implement performant and accurate complex rendering (scaled ZL21 tiles) for ZL15-ZL20.
-   [ ] **Globe Tile Selection:** Make tiles on the OpenGlobus globe selectable (e.g., via click) to show details, similar to OpenLayers map.

## General UI & Functionality
-   [X] **Toggle in Top Buttons (Map/Globe Independent Visibility):** Map and globe panels toggle independently.
-   [ ] **Panel Width Consistency:** Profile, Tileset Details, Social panels same width.
-   [ ] **Map Options Not Changing Style:** Base map options in "Maps" panel don't change map style.
-   [ ] **Terrain Loading:** OpenGlobus `GlobusRgbTerrain` shows many 404 errors and has a low `maxNativeZoom` (6). Investigate if a better terrain source or configuration is needed for improved globe appearance.

## XR Panel Integration
-   [ ] Add XR panel HTML structure to `index.html`.
-   [ ] Add JavaScript logic for XR panel button and functionality to `main.js`.

## Resolved
-   <span style="text-decoration: line-through;">**Tileset Save Color:** Tilesets are being saved with a black color, which is too dark.</span> (Now uses selected color)
-   <span style="text-decoration: line-through;">**Globe Not Loading / Layer 0 Not Showing.**</span> (Initial loading seems fixed)
-   <span style="text-decoration: line-through;">**Tileset List Duplication:** Tileset list items were duplicated.</span> (Fixed)
-   <span style="text-decoration: line-through;">**Syntax Errors in `main.js`:** Resolved various parsing errors, including for `ogSavedTilesetsLayer` definition.</span>

*(This list will be updated as we proceed.)*
