# Mundial Map - Concept Design Details

## 1. Core User Experience: ZL21 Tilesets to Interactive 3D Scenes

The fundamental user workflow revolves around selecting ZL21 grid cells on a 2D map or 3D globe to define a "Tileset Footprint." This footprint is then transformed into a 3D Scene, primarily structured as an OGC I3S (Indexed 3D Scene Layer). This I3S Scene, managed via a backend system ("Kart") and utilizing IPFS for data storage, becomes a shareable, versionable, and extensible unit of geospatial 3D content.

-   **ZL21 Selection:** Users utilize map tools to select a collection of ZL21 tiles. This defines the geographic extent and the base 2D grid for their scene.
-   **3D Terrain GLTF Generation:** For the selected ZL21 footprint, the client application generates a 3D terrain model.
    -   **Height Data:** Elevation data is sourced from a configured DEM service (e.g., OpenGlobus terrain tiles, or other compatible heightmap sources).
    -   **Texture Data:** Visual texture is sourced from the currently active 2D basemap (e.g., OpenStreetMap, satellite imagery).
    -   **GLTF Output:** The client (using `tilesetExporter.js` and THREE.js) creates a textured 3D mesh representing the terrain for the ZL21 selection and exports it as a GLTF/GLB file. This is the foundational geometric asset of the scene.
-   **I3S Scene Creation:**
    -   The generated terrain GLTF, along with metadata (name, description, ZL21 footprint, ULID, thumbnail), is processed into an I3S Scene.
    -   This I3S Scene is the primary representation of a "saved tileset." It adheres to the OGC I3S specification.
    -   **Kart & Backend Role:** The client submits the GLTF (e.g., as an IPFS CID) and metadata to Kart (via API). Kart (or an associated backend service) is responsible for generating the I3S Scene Layer Package (`.slpk`) or setting up an I3S service endpoint. This I3S scene will reference the terrain GLTF.
-   **Scene Extensibility:** The I3S Scene is designed as a container. Users can (in future iterations) add other 3D assets (models, point clouds, annotations) to their scene, effectively building more complex environments. These additions would be managed as updates to the I3S scene via Kart.

## 2. Scene Management & Discovery

-   **Kart as Scene Registry:**
    -   Kart serves as the central database/registry for all I3S Scenes.
    -   It stores metadata for each scene:
        -   Unique ULID (see below).
        -   User-defined name and description.
        -   Geographic footprint (defined by the ZL21 tiles).
        -   Link/CID to the primary terrain GLTF (on IPFS).
        -   Link/CID to the I3S Scene Layer Package (`.slpk`) or service URL (on IPFS or served by Kart/backend).
        -   Link/CID to a satellite image thumbnail.
        -   Version history, ownership, sharing permissions.
-   **IPFS for Data Storage:**
    -   Large binary assets associated with scenes (terrain GLTFs/GLBs, I3S SLPKs, textures, other user-added 3D models) are stored on IPFS for decentralized and content-addressed storage.
    -   Kart stores the IPFS CIDs for these assets.
-   **ULID (Universally Unique Lexicographically Sortable Identifier) System:**
    -   Each I3S Scene is assigned a ULID upon creation.
    -   The ULID is generated based on the geographic location (e.g., centroid or a hash of the ZL21 tile coordinates) and potentially a timestamp, ensuring uniqueness and some geographic context.
    -   The ULID serves as a persistent, shareable link to the scene.
-   **Scene Menu & Thumbnails:**
    -   A "Scene Menu" in the UI lists discoverable I3S scenes, queried from Kart.
    -   Each list item displays the scene's name, a satellite image thumbnail of its bounding box, and other key details.
    -   Thumbnails are generated (client or server-side) when a scene is created/saved.
-   **Search & Navigation by ULID:**
    -   A search function allows users to input a scene's ULID.
    -   The application will query Kart for the scene, then navigate the main map/globe to its location and load its details/preview.

## 3. Multi-Format Viewing & Interaction

Users can interact with and view their scenes in multiple ways:

-   **THREE.js Preview (Client-Side):**
    -   An integrated modal window using THREE.js provides an immediate client-side preview of the generated terrain GLTF for a selected ZL21 tileset. This allows quick visualization before or alongside I3S processing.
-   **I3S Viewing:**
    -   The primary way to view fully structured scenes. Requires an I3S-capable client component (e.g., ArcGIS API for JavaScript, CesiumJS with I3S support, or other compatible viewers) integrated into the application. Scenes are loaded from their SLPK (via IPFS) or service URL (managed by Kart).
-   **USD (Universal Scene Description) Viewing:**
    -   The terrain GLTF (or I3S scene content) can be converted to USD format for interoperability with tools like NVIDIA Omniverse. This conversion might be a Kart/backend process or utilize client-side libraries if feasible. Viewing requires a USD-capable viewer.
-   **PolygonJS Integration (Editor Window):**
    -   The generated terrain GLTF from a scene can be loaded into an embedded PolygonJS editor instance.
    -   Users can modify the terrain, add procedural elements, or use it as a base for more complex 3D designs.
    -   Edited content can be saved back as new assets or updates associated with the I3S scene in Kart.

## 4. XR (Extended Reality) Integration

-   **I3S Scene as XR Room:** Each saved I3S Scene (with its terrain GLTF and any associated assets) forms the basis of a persistent XR "room" or environment.
-   **JanusWeb:**
    -   Dynamically loads the content of an I3S Scene to create a custom JanusWeb room.
    -   Portals can link adjacent scenes, creating a navigable web of XR spaces.
-   **ThirdRoom:**
    -   Integrates as an XR view option, leveraging the project's Matrix Synapse server for social interaction.
    -   ThirdRoom instances will be created based on the I3S Scene content, allowing users to meet and collaborate within their 3D environments.

## 5. Core Map & Globe Libraries

-   **2D Map Views:** OpenLayers (primary), MapLibre GL JS (alternative).
    -   Support ZL21 tile selection, display of scene boundaries, base map switching.
-   **3D Globe Views:** OpenGlobus (primary), OLCesium (alternative for Cesium ecosystem compatibility), iTowns (alternative for advanced 3D geospatial features).
    -   Support display of scene boundaries, global context, and potentially direct I3S rendering where capable.

## 6. Backend Architecture & Services (Overview)

-   **Kart:** Central for I3S Scene metadata, versioning, ULID management, IPFS CIDs, and potentially orchestrating I3S generation/packaging. Provides API for client.
-   **IPFS:** Stores large binary data (GLTFs, SLPKs, textures, other 3D assets).
-   **Matrix Synapse:** Dedicated server for real-time communication (ThirdRoom backend, chat, collaboration).
-   **Central API Server (Node.js/Express.js):** Orchestrates interactions, handles business logic, user sessions.
-   **GunDB:** Potential for P2P data synchronization aspects (e.g., live collaboration data, user presence), complementary to the Kart/IPFS/Matrix stack.

## 7. Tileset Details Panel (Legacy "Tileset Details")
This panel, when a ZL21 selection or a saved Scene is active, will show:
-   Scene Name (editable)
-   ULID (display only, copyable)
-   Tile Count (for ZL21 footprint)
-   Thumbnail image
-   Color (for 2D map representation of the ZL21 footprint)
-   Description (editable)
-   Buttons for: "View in THREE.js", "Download GLTF", "Export to I3S (triggers Kart process)", "View in I3S viewer", "Open in XR".

## 8. Asset Market & Gamification (Future Considerations)
-   Concepts of buying/selling scenes (I3S assets from private layers) and merit-based display on public layers can be built upon this I3S scene foundation.

*(This document outlines the high-level concepts. Specific implementation details will be refined in technical designs and the MVP scope.)*
