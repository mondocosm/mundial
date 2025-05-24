# Mundial Map - Minimum Viable Product (MVP) Scope V1.1 (I3S Focused)

This document defines the initial scope for the Mondocosm MVP, focusing on demonstrating the core value proposition: a collaborative, versioned geospatial platform where users can define geographic areas (from ZL21 tiles) and see them as basic 3D scenes, with a clear path towards richer I3S integration.

## Overarching Goal (MVP)

Deliver a functional baseline demonstrating the ability for users to:
1.  Select ZL21 tiles on a 2D map to define a "Tileset Footprint."
2.  Generate a 3D terrain GLTF model for this footprint using client-side processing and an available heightmap source.
3.  Preview this generated GLTF in an integrated THREE.js viewer.
4.  Register this as a "Scene" with a backend system (Kart), including metadata like a ULID and an IPFS link to the GLTF.
5.  View a list of these registered Scenes in a simple "Scene Menu."

## 1. Backend MVP (Terrallax - Supporting Scene Management)

*   **Technology:** Node.js/Express.js (Central API), Kart (Scene Metadata & Asset Versioning), IPFS (Asset Storage). (GunDB & Matrix Synapse setup are for broader, partially post-MVP goals).
*   **Features:**
    *   **Central API Server:**
        *   Endpoint for client to register a new "Scene":
            *   Input: ZL21 footprint data, user-defined name/description, client-generated ULID (or Kart assigns one), IPFS CID for the terrain GLTF, IPFS CID/URL for a thumbnail.
            *   Action: Stores this metadata in Kart.
        *   Endpoint to list available Scenes from Kart (providing name, ULID, thumbnail CID/URL, GLTF CID for the Scene Menu).
        *   Endpoint to retrieve full metadata for a specific Scene (by ULID).
    *   **Kart Integration:**
        *   Schema/structure in Kart for storing Scene metadata as described above.
        *   Basic versioning for scene metadata (if Kart supports it easily for MVP).
    *   **IPFS Integration (Conceptual for Client, Direct for Backend if applicable):**
        *   The client will need a way to get the GLTF onto IPFS. This could be:
            *   Client-side `js-ipfs` upload (more complex for MVP).
            *   Client uploads GLTF to a backend API endpoint, which then pins it to IPFS and returns the CID. (Simpler for client MVP).
        *   Kart will store these IPFS CIDs.
    *   Placeholder user authentication.
*   **Out of Scope for Backend MVP:** Direct I3S SLPK generation/hosting by Kart (Kart's role is metadata management; I3S generation is external or a future Kart feature); advanced Kart features (branching, merging); full GunDB/Matrix integration for scene data.

## 2. Desktop MVP (Mundial - Web Client)

*   **Technology:** JavaScript Modules, OpenLayers (2D View), OpenGlobus (3D Globe View), THREE.js (for GLTF preview).
*   **Features:**
    *   **Core Map/Globe Views:**
        *   OpenLayers: Base maps, ZL21 tile selection tools.
        *   OpenGlobus: Base maps, basic terrain.
        *   View toggling between 2D/3D.
    *   **ZL21 Tileset Footprint Definition:**
        *   [X] User selects ZL21 tiles on OpenLayers map.
        *   [X] UI to name and save this selection locally (current "Save Tileset" to a layer).
    *   **[NEW] 3D Terrain GLTF Generation (Client-Side):**
        *   **`tilesetExporter.js` (`exportTilesetToGLTF`):**
            *   [X] Takes ZL21 tile features (from a saved tileset group) as input.
            *   [X] Sources height data from a configured URL template (e.g., OpenGlobus terrain).
            *   [X] Sources texture data from current 2D basemap.
            *   [X] Generates a `THREE.Group` object representing the 3D terrain.
            *   [X] Can export this `THREE.Group` as GLTF data (JSON string or Blob).
    *   **[NEW] THREE.js Previewer Modal:**
        *   [X] HTML structure for modal exists.
        -   [ ] **CSS Styling:** Move inline styles for modal to `style.css`.
        *   [ ] Implement JS for THREE.js renderer, scene, camera, lights, orbit controls.
        *   [ ] "View in 3D" button (on saved tileset list items):
            *   Retrieves ZL21 features for the selected saved tileset.
            *   Calls `exportTilesetToGLTF` to get the `THREE.Group`.
            *   Displays this `THREE.Group` in the modal.
            *   Handles modal show/hide.
    *   **[NEW] Scene Registration Workflow (Client-Side Orchestration):**
        *   UI element (e.g., "Register Scene" button in Tileset Details or after GLTF preview).
        *   **ULID Generation:** Client generates a ULID (e.g., based on location/timestamp).
        *   **Thumbnail Generation:** Client captures a simple thumbnail from the OL map canvas for the tileset's extent.
        *   **GLTF to IPFS:**
            *   Option A (MVP simpler): User downloads GLTF, manually uploads to an IPFS gateway/node, pastes CID.
            *   Option B (MVP advanced): Client uploads GLTF blob to a backend endpoint that handles IPFS pinning and returns CID.
        *   **Kart API Call:** Client sends all metadata (name, ZL21 footprint, ULID, GLTF IPFS CID, thumbnail IPFS CID/URL) to the backend API for Kart registration.
    *   **[NEW] Scene Menu (Read-Only):**
        *   UI panel to list Scenes.
        *   Fetches scene list (name, ULID, thumbnail) from Kart API.
        *   Displays items. Clicking an item:
            *   Shows its details (name, ULID).
            *   Enables "View in 3D" button, which would fetch its GLTF (via IPFS CID from Kart metadata) and show in the THREE.js previewer.
    *   **Basic UI Panels:**
        *   [X] Layer Switcher (Maps panel).
        *   [X] Globe Switcher (Globes panel).
        *   [X] Hide/Show functionality for these panels.
*   **Out of Scope for Desktop MVP:** Direct I3S/USD viewing client-side (preview is GLTF only); editing I3S scenes; adding multiple assets to a scene; full ULID search-to-navigate; advanced 3D Tiles processing as a source; iTowns/OLCesium full functionality (focus on OpenLayers/OpenGlobus for core views, THREE.js for preview); PolygonJS integration; XR integration; advanced backend interactions beyond scene registration/listing.

## 3. Mobile MVP (Mundial - Web Responsive / PWA) - Deferred

*   Focus on Desktop Web MVP first. Mobile adaptation and specific AR features will be post-Desktop MVP.

## Next Steps for MVP Development

1.  **Backend:**
    *   Define and implement Kart schema for Scene metadata.
    *   Develop Central API endpoints for Scene registration and listing.
    *   Set up mechanism for GLTF-to-IPFS (either backend endpoint or documented manual process for user).
2.  **Client (Desktop Web):**
    *   Finalize `tilesetExporter.js` for robust GLTF generation from ZL21 selections + heightmap source.
    *   Implement the THREE.js previewer modal (JS rendering logic, controls, loading the `THREE.Group`).
    *   Implement the "View in 3D" button functionality on saved tileset list items.
    *   Implement the client-side workflow for "Scene Registration" (ULID, thumbnail, GLTF to IPFS, Kart API call).
    *   Implement the basic "Scene Menu" to list and preview scenes from Kart.
    *   Address critical OLCesium/iTowns initialization issues if they block core OpenGlobus/OpenLayers work or are simple fixes. (Currently, these are secondary to the GLTF/Scene MVP).
    *   Refine initial Cesium camera view.
3.  **Documentation:**
    *   [X] Update `TODO.md`, `CONCEPT_DESIGN.md`, `MVP_SCOPE.md` with this I3S-focused vision.

*(This MVP scope prioritizes establishing the core pipeline of user ZL21 selection -> client-generated 3D terrain GLTF -> preview -> registration as a "Scene" in a backend system (Kart) with IPFS storage for the GLTF -> and a basic menu to list/re-preview these scenes. Full I3S packaging and advanced features are subsequent phases.)*