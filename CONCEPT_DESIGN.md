conc# Mundial Map - Concept Design Details

## Tileset Details Enhancements
-   **Tile Count:** Ensure the tile count displayed in the "Tileset Details" modal is accurate.
-   **Automated Tileset Image:**
    -   The image in "Tileset Details" should be an automated satellite view snapshot of the tileset's extent.
-   **Tileset Linking/Addressing:**
    -   The "Hyperlink" field should point to a unique, shareable address for the tileset.
    -   Consider a system like `#z21/uuid` (e.g., `#z21/bb61e9d2-4f39-437b-b2f4-3fe876e21f22`) for addressing tilesets.
    -   This can integrate with a Kart geospatial server.
    -   Tilesets can be defined by their centermost tile or a unique ID.
-   **Kart Integration:**
    -   Kart will store tiles and tilesets in a Git-like organizational structure.
    -   Enable users to "fork" tilesets from others.

## Asset Market & Economy
-   **Buy/Sell Tilesets:** Implement functionality for buying and selling tilesets in an "Asset Market."
-   **Value Proposition:** Value is in custom/unique tilesets, not the land itself (as users can create new layers).
-   **Private vs. Public Layers:**
    -   Only tilesets from *private* layers can be sold.
    -   Tilesets from *public* layers can be forked.

## Layer 0 Gamification (Main Public Layer)
-   **Merit-Based Display:** Tilesets displayed on Layer 0 are based on popularity (most shared or forked).
-   **Weekly Check:** Popularity check occurs weekly.
-   **Displacement:** If a tileset on another layer becomes more popular than one on Layer 0, it can displace the existing one.

## Globe Functionality Parity with Map
-   **General Goal:** Everything that works in the map view should work similarly on the globe view.
-   **Tile Selection & Info:**
    -   Implement tile selection on the globe.
    -   Clicking a tile on the globe should display its coordinate and tile ID.
-   **Tileset Display Sync:**
    -   Display saved tilesets from map view on the globe.
    -   Sync tileset visibility and changes between map and globe.
-   **Tileset Saving on Globe:** Allow selection and saving of new tilesets directly on the globe.

## XR View Integration
-   **Terrain Data for XR:**
    -   Extract terrain data for the tiles within each tileset.
    -   Send this terrain data to the XR view.
-   **VR Room/Instance Creation:**
    -   Use tileset terrain data as a base for creating VR rooms or instances.
    -   Users can customize these spaces with 3D modeling and assets.
-   **Technology Considerations:**
    -   Previous attempts with Babylon.js and MapLibre (file might be lost).
    -   Consider Turf.js for geospatial data processing.

## UI/UX Notes
-   **Tile Cube Indicator (Globe):** Should be ZL21 map tile polygons, not cubes (cubes were a test).
