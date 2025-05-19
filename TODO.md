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
-   [ ] Integrate glTF models (derived from 3D Tiles) as terrain/rooms in XR views (e.g., for Babylon.js or JanusWeb).
-   [ ] **Third Room Integration:**
    -   [ ] Add "Third Room" as an XR view option in the XR panel.
    -   [ ] Implement logic to launch/embed Third Room, potentially passing context (e.g., room ID based on selected tileset or Matrix room associated with it).
    -   [ ] Ensure Third Room can connect to the project's Matrix Synapse server.

## 3D Tiles to Multi-Format Conversion Pipeline & Asset Integration
-   [ ] **Data Source:**
    -   [ ] Define how ZL21 tile selections map to specific 3D Tilesets (e.g., service, configuration for sourcing 3D Tiles).
    -   [ ] Implement fetching of 3D Tiles data based on ZL21 selection.
-   [ ] **Conversion Pipeline (3D Tiles to glTF, I3S, USD):**
    -   [ ] Research and select/implement libraries for parsing 3D Tile formats (b3dm, i3dm, etc.).
    -   [ ] Develop logic to extract geometry and textures from 3D Tiles.
    -   [ ] Implement mesh reconstruction for the selected tileset footprint.
    -   [ ] **glTF Export:** Implement glTF export of the reconstructed mesh.
    -   [ ] **I3S Export/Packaging:**
        -   [ ] Research and implement conversion/packaging of 3D Tiles/glTF data into I3S format.
        -   [ ] Define I3S as a container for the glTF terrain and other potential assets.
    -   [ ] **USD Export:**
        -   [ ] Research and implement conversion of 3D Tiles/glTF data into USD format.
-   [ ] **Assets Page & Scene Window:**
    -   [ ] Create HTML structure for the "Assets" page/panel.
    -   [ ] Implement listing of saved tileset assets (likely represented by their I3S container or primary glTF).
    -   [ ] Integrate a viewer (e.g., Three.js, or a dedicated I3S/glTF viewer) for asset previews on the Assets page.
    -   [ ] Implement logic to update the viewer when a different asset is selected.
    -   [ ] **Scene Window:** Ensure this window can display the selected tileset (I3S/glTF) as an isolated piece of land/model.
-   [ ] **View Integration:**
    -   [ ] **JanusWeb:**
        -   [ ] Implement dynamic loading of the *contents* of an I3S layer (including its glTF terrain and other assets) as a custom JanusWeb room.
        -   [ ] Develop a system for defining/managing portals between adjacent tileset rooms.
    -   [ ] **Babylon.js View:**
        -   [ ] Implement loading and display of generated glTF tileset models (or models extracted from I3S).
    -   [ ] **Main Scene Panel:**
        -   [ ] Update to load and display generated I3S/glTF tileset assets.
-   [ ] **Synchronization & State Management:**
    -   [ ] Ensure selection/loading of a tileset asset updates all relevant views (Assets, Babylon, Janus, Scene Window).
-   [ ] **Persistence & Kart Integration:**
    -   [ ] Implement saving of source tile data (ZL21 selection, 3D Tiles references) and the generated I3S file (containing glTF) to Kart.
    -   [ ] Ensure saved tilesets (from Kart) are listed on the Assets page.

## Visual Coding (Rete.js)
-   [ ] **Core Setup:**
    -   [ ] Integrate Rete.js library (and `rete-engine`, `rete-render-utils` or alternatives like `rete-react-render` if preferred).
    -   [ ] Create a dedicated panel/window for the Rete.js editor.
    -   [ ] Basic node definitions (e.g., input, output, simple math).
-   [ ] **Mundial Integration Nodes:**
    -   [ ] Develop Rete nodes to interact with Mundial state (e.g., get selected tileset, access map view properties).
    -   [ ] Nodes for geospatial operations (potentially wrapping Turf.js).
    -   [ ] Nodes for triggering actions (e.g., change layer style, load data).
-   [ ] **Example Use Cases:**
    -   [ ] Simple graph to change a layer's style based on a property.
    -   [ ] Graph to filter or process tileset data.

## Leaflet Integration
-   [ ] **Core Setup:**
    -   [ ] Integrate Leaflet library.
    -   [ ] Add "Leaflet" to the map library selection dropdown.
    -   [ ] Implement basic map initialization for Leaflet in the map panel.
-   [ ] **Feature Parity (MVP):**
    -   [ ] Base map layer display and switching.
    -   [ ] Display of ZL21 tile selections.
    -   [ ] Display of saved tileset boundaries.
    -   [ ] Basic ZL21 tile click/info display.

## iTowns Integration
-   [ ] **Core Setup:**
    -   [ ] Integrate iTowns library.
    -   [ ] Add "iTowns" to the globe/3D view selection options.
    -   [ ] Implement basic iTowns view initialization in the globe panel.
-   [ ] **Feature Parity (MVP):**
    -   [ ] Global view rendering.
    -   [ ] Display of ZL21 tile selections.
    -   [ ] Display of saved tileset boundaries (as 3D extents or features).
    -   [ ] Basic navigation and interaction.
-   [ ] **Advanced Features (Post-MVP):**
    -   [ ] Loading and rendering of 3D Tilesets directly in iTowns.
    -   [ ] Point cloud rendering.
    -   [ ] Oblique imagery.

## Backend Services Integration
-   [ ] **IPFS Integration:**
    -   [ ] Integrate js-ipfs library for client-side interactions or set up a dedicated IPFS node.
    -   [ ] Implement logic for storing and retrieving large assets (glTF, USD, 3D Tiles) on IPFS.
    -   [ ] Manage IPFS CIDs in Kart or GunDB records.
-   [ ] **Matrix Synapse Integration:**
    -   [ ] Document setup and configuration for a standalone Matrix Synapse homeserver.
    -   [ ] Integrate a Matrix client SDK into the backend or client for communication.
    -   [ ] Implement basic chat/messaging features using Matrix.
    -   [ ] Explore using Matrix for real-time collaboration or signaling.
-   [ ] **GunDB & Kart:**
    -   [ ] Continue integration of GunDB for decentralized data.
    -   [ ] Refine Kart integration for versioning geospatial assets (I3S, source data).
-   [ ] **Central API Server:**
    -   [ ] Develop/enhance API endpoints to orchestrate interactions between these backend services.

## Resolved
-   <span style="text-decoration: line-through;">**Tileset Save Color:** Tilesets are being saved with a black color, which is too dark.</span> (Now uses selected color)
-   <span style="text-decoration: line-through;">**Globe Not Loading / Layer 0 Not Showing.**</span> (Initial loading seems fixed)
-   <span style="text-decoration: line-through;">**Tileset List Duplication:** Tileset list items were duplicated.</span> (Fixed)
-   <span style="text-decoration: line-through;">**Syntax Errors in `main.js`:** Resolved various parsing errors, including for `ogSavedTilesetsLayer` definition.</span>

*(This list will be updated as we proceed.)*
