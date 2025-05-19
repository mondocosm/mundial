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
-   **VR Room/Instance Creation & Viewing Options:**
    -   **JanusWeb:** Use tileset terrain data (glTF from I3S) as a base for creating VR rooms.
    -   **Babylon.js:** Can be used for custom 3D/VR scene rendering with loaded glTF tilesets.
    -   **Third Room:** Integrate as an XR window view option. Third Room is a web-based 3D social platform built on Matrix, allowing for collaborative experiences within rooms. It will utilize the project's Matrix Synapse server for communication and state.
    -   Users can customize these spaces with 3D modeling and assets.
-   **Technology Considerations:**
    -   Turf.js for geospatial data processing.
    -   Terrain data sourced from 3D Tilesets, converted to glTF, for detailed XR environments.
    -   Matrix Synapse for Third Room backend.

## 3D Tiles to Multi-Format Conversion Pipeline and Asset Integration

-   **Core Concept:** Users select a group of ZL21 tiles (a "tileset footprint"). The system fetches corresponding 3D Tiles data to represent the terrain and geometry for this footprint. This 3D Tiles data is then processed and converted into multiple standard formats: glTF, I3S (Indexed 3D Scene Layer), and USD (Universal Scene Description). These converted assets become shareable, viewable, and usable within the platform and for export.

-   **ZL21 Selection to 3D Tiles:**
    -   The existing ZL21 tile selection mechanism on the map will define the geographic extent.
    -   A mechanism (e.g., a service, or pre-defined knowledge of available 3D Tilesets) will be needed to identify and retrieve the relevant 3D Tiles that cover the selected ZL21 footprint. This assumes 3D Tiles are available as a primary source for detailed geometry.

-   **3D Tiles as Primary Geometry Source:**
    -   The fetched 3D Tiles will serve as the high-resolution geometry for the selected region.

-   **Conversion Pipeline (3D Tiles to glTF, I3S, USD):**
    -   A client-side or (for more complex operations) server-assisted pipeline will be developed to:
        -   Process the relevant 3D Tiles (e.g., `b3dm`, `i3dm`, `cmpt`).
        -   Extract geometry, materials, and texture data.
        -   Construct a unified 3D representation for the selected tileset footprint.
        -   **glTF Conversion:** Convert this representation into a standard glTF format. This glTF will be a primary portable asset.
        -   **I3S Conversion/Packaging:**
            -   Convert or package the 3D Tiles/glTF data into the I3S format.
            -   I3S will serve as an editable scene layer and a container for the glTF-derived terrain and potentially other user-added assets within that tileset.
        -   **USD Conversion:** Convert the 3D Tiles/glTF data into USD format for interoperability with Omniverse and other USD-based tools.
    -   This process generates multiple interoperable 3D representations of the selected terrain area.

-   **Asset Usage & Integration:**
    -   **Scene Window:** This dedicated view will display the selected tileset (derived from 3D Tiles, likely rendered from its glTF or I3S representation) as an isolated piece of land/model, allowing focused interaction.
    -   **JanusWeb:**
        -   The *contents* of an I3S layer (which includes the glTF terrain and any associated assets) will be loaded into JanusWeb as a custom room.
        -   Portals can be defined within these JanusWeb rooms to link to adjacent tileset rooms.
    -   **Babylon.js View:**
        -   Capable of loading and displaying the generated glTF tileset models.
    -   **Assets Page:**
        -   A new "Assets" page or section will list saved tilesets.
        -   Each tileset asset will be represented, potentially by its I3S container.
        -   A preview window (e.g., using Three.js or a suitable I3S/glTF viewer) will render the selected asset.
        -   Selecting an asset will update the model displayed in other views (Babylon.js, JanusWeb, Scene Window).
    -   The main "Scene" panel (currently for generic 3D Tiles, USD, I3S URLs) should also be able to load these generated/managed I3S or glTF assets.

-   **Synchronization and State Management:**
    -   Selection of a tileset asset will trigger updates across all relevant views to display the selected model.

-   **Persistence & Kart Integration:**
    -   **Kart:** Will be used to store the source tile data (ZL21 selection, 3D Tiles references) and the generated I3S file (which acts as a container for the glTF and other related assets).
    -   Saved tilesets (as I3S in Kart) will populate the Assets page.

## Core Map & Globe Libraries
-   **Primary 2D Map Views:** OpenLayers, MapLibre GL JS.
    -   These will be selectable options for the main 2D map panel.
    -   Functionality like ZL21 tile selection, tileset display, and base map switching should be supported across these libraries.
-   **Primary 3D Globe Views:** OpenGlobus.
    -   Primary globe for displaying ZL21 selections, tilesets, and global context.
-   **Additional Map/Globe View Options:**
    -   **Leaflet:** To be added as a 2D map view option in the map panel, alongside OpenLayers and MapLibre.
    -   **iTowns:** To be integrated as an alternative 3D globe/scene view option, selectable in the globe panel. iTowns offers advanced 3D geospatial visualization capabilities, including 3D Tiles, point clouds, and oblique imagery.

## Visual Coding Environment (Rete.js)
-   **Concept:** Implement a visual coding window using Rete.js (potentially `rete-engine` with `rete-render-utils` for custom rendering, or exploring `rete3d` concepts if applicable for 3D scene graph manipulation).
-   **Purpose:** Allow users to visually script interactions, data flows, or custom behaviors within the Mundial platform. This could involve:
    -   Processing geospatial data.
    -   Defining custom layer styles or behaviors.
    -   Orchestrating data exchange between different map views or components.
    -   Creating simple game logic or interactive experiences tied to map locations or tilesets.
-   **Integration:**
    -   The Rete.js editor will be presented in its own dedicated panel/window.
    -   Nodes within Rete could represent map layers, tileset data, user inputs, API calls, or specific functions (e.g., Turf.js operations, 3D model transformations).
    -   The output of Rete graphs could dynamically affect the map views, 3D scenes, or other application states.

## Backend Architecture & Services
-   **Multimodal Server Architecture:** The backend will adopt a multimodal approach, leveraging several technologies for different aspects of data storage, versioning, and real-time communication.
    -   **GunDB:** For decentralized, real-time graph database capabilities. Useful for P2P data synchronization, user profiles, and dynamic shared states.
    -   **Kart:** For version control of geospatial data, particularly tileset definitions, I3S assets, and potentially source 3D Tiles references. Provides a Git-like structure for managing geospatial assets.
    -   **IPFS (InterPlanetary File System):** For decentralized storage and addressing of larger assets, such as generated glTF models, USD files, or potentially the 3D Tiles themselves if not served from elsewhere. Content-addressing ensures data integrity and resilience.
    -   **Matrix Synapse:** A Matrix homeserver implementation for decentralized, federated real-time communication (chat, presence, custom events). This will power social features and potentially signaling for collaborative sessions. Synapse will run as a separate, dedicated server instance.
    -   **Central API Server (Node.js/Express.js):** A central server will still be necessary to orchestrate interactions between these services, handle business logic, manage user sessions (even if authentication is federated), and provide primary API endpoints for the client application. This server will interface with Kart, IPFS, and the Matrix Synapse server.

-   **Data Flow Example (Tileset Creation & Sharing):**
    1.  User defines a tileset footprint (ZL21 tiles) on the client.
    2.  Client requests 3D Tiles data for the footprint.
    3.  Client processes 3D Tiles into glTF, I3S, and USD.
    4.  The I3S (containing/referencing glTF and other metadata) and source data references are committed to a Kart repository via the central API server.
    5.  Large binary assets (glTF, USD, potentially source 3D Tiles if self-hosted) might be stored on IPFS, with their CIDs (Content Identifiers) stored in Kart or GunDB records.
    6.  Tileset availability/metadata could be announced or shared via GunDB or Matrix rooms.
    7.  Other users can discover/access these tilesets, fork them in Kart, and load them.

## UI/UX Notes
-   **Tile Cube Indicator (Globe):** Should be ZL21 map tile polygons, not cubes (cubes were a test).
