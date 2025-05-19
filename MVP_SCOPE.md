# Mondocosm - Minimum Viable Product (MVP) Scope V1.0

This document defines the initial scope for the Mondocosm MVP, focusing on demonstrating the core value proposition: a collaborative, versioned geospatial platform.

## Overarching Goal

Deliver a functional baseline demonstrating the ability for users to view a shared geospatial world, claim/save personal "Sites" within it using basic persistence and versioning, and view these creations. Provide a glimpse into unique interaction paradigms (AR on mobile).

## 1. Backend MVP (Terrallax)

*   **Technology:** Node.js/Express.js (Central Orchestration API), Kart (Geospatial Asset Versioning), GunDB (Decentralized Graph Data), js-ipfs (Client-side IPFS interactions or for a dedicated IPFS node), Matrix Synapse (Federated Communication - run as a separate service).
*   **Features:**
    *   **Central API Server:** Basic REST API for core operations.
    *   **Kart Integration:**
        *   Basic Kart repository setup.
        *   API endpoints for storing/retrieving I3S assets and related metadata in Kart.
    *   **GunDB Integration (PoC):**
        *   Basic setup for P2P data sharing (e.g., simple shared state or asset discovery).
    *   **IPFS Integration (PoC):**
        *   Client-side (via js-ipfs) or server-side interaction with an IPFS node for storing/retrieving large assets (glTF, USD). CIDs managed via Kart/GunDB.
    *   **Matrix Synapse Setup (External):**
        *   Documentation and guidelines for setting up a separate Synapse homeserver.
        *   Central API may provide endpoints for basic interaction with Synapse (e.g., creating a room for a new tileset discussion), or client directly interacts.
    *   Placeholder user authentication.
*   **Out of Scope for MVP Backend:** Advanced Kart features (branching, merging, popularity-based metrics), full production-ready Synapse federation and complex bot/service integrations, deep Nodesque backend integration, full cryptocurrency integration.

## 2. Desktop MVP (Mundial - Web)

*   **Prerequisite:** ~~Fixed `mundial/main.js`~~. **DONE**
*   **Technology:** JavaScript Modules, OpenLayers (2D View), OpenGlobus (3D Globe View).
*   **Features:**
    *   **Core View:** OpenLayers for 2D map view and OpenGlobus for 3D globe view. Basic base map layers. Terrain rendering via OpenGlobus.
    *   **Site Display:** Fetch site list from `GET /api/sites` and display boundaries as vector outlines in OpenLayers and OpenGlobus views.
    *   **Site Creation:**
        *   Map interaction (e.g., click or drag-select) in OpenLayers/OpenGlobus to select one or more Z21 tiles.
        *   Simple UI form (e.g., in a panel) to name the selection.
        *   "Save Site" button triggers `POST /api/sites` with selected tile data/boundary and placeholder owner ID.
    *   **Basic UI Panels:** Draggable/minimizable panels for:
        *   Layer Switcher (functional base map toggle for OpenLayers/OpenGlobus).
        *   Site List (read-only display of site names fetched from backend).
    *   **View Toggling:** Functional switching between OpenLayers (2D map) and OpenGlobus (3D globe) views. Basic camera state synchronization (location/zoom) between views.
*   **Out of Scope:** iTowns, Babylon.js/Other engines (unless chosen for GLTF generation), advanced rendering (NeRF, Splats, Voxels), Building/Voxel/Mesh Editors, Nodesque editor integration, Avatars, VR, Stereoscopy, advanced UI (docking, scaling fix, chat), advanced gameplay (Strata, merging, popularity), MapLibre/DeckGL/Leaflet (unless chosen for specific ZL21 texture fetching), detailed Site management tools, full user authentication.

## 3. Tileset Definition and 3D Tiles to Multi-Format Conversion Pipeline

*   **Goal:** Enable users to define a "tileset" based on a ZL21 tile selection. For this selected area, fetch corresponding 3D Tiles data to serve as the terrain/geometry source. Convert this 3D Tiles data into glTF, I3S, and USD formats for download, use in other 3D environments, and display within the application.
*   **Tileset Definition:**
    *   Users select a group of ZL21 tiles using the existing map selection tools. This defines the "tileset footprint."
*   **Data Acquisition (3D Tiles as Primary Geometry Source):**
    *   For the selected ZL21 footprint, identify and fetch the corresponding 3D Tiles data. (This assumes a source/service for 3D Tiles mapped to geographic areas is available or will be mocked).
    *   This 3D Tiles data will provide the detailed geometry for the tileset area.
*   **Processing & Conversion Pipeline (3D Tiles to glTF, I3S, USD):**
    *   Parse the fetched 3D Tiles (e.g., `b3dm`, `i3dm`, `cmpt`).
    *   Extract and consolidate geometry, materials, and texture information.
    *   Construct a unified 3D representation for the tileset footprint.
    *   **glTF Conversion:** Convert this representation into a standard glTF format.
    *   **I3S Conversion/Packaging:** Convert/package the 3D Tiles/glTF data into I3S format. I3S will serve as an editable scene layer and a container for the glTF-derived terrain and other assets.
    *   **USD Conversion:** Convert the 3D Tiles/glTF data into USD format.
*   **User Interface for Export:**
    *   Button/option: "Generate & Download Tileset (glTF, I3S, USD)".
*   **Technology Considerations:**
    *   Identify/mock a source for 3D Tiles data.
    *   Select/integrate libraries for parsing 3D Tiles and for glTF, I3S, and USD generation (e.g., loaders.gl, THREE.js, Babylon.js, potentially server-side tools for I3S/USD if client-side is too complex).
    *   Initial PoC: Focus on 3D Tiles -> glTF for a single ZL21 tile. Subsequent PoCs for I3S and USD.

## 4. Asset Integration (glTF, I3S, USD) & Multi-View Display

*   **Goal:** Integrate the generated/converted tileset assets (primarily I3S containing glTF, and standalone glTF/USD) into various application views and create an "Assets" page for browsing.
*   **Scene Window:**
    *   This dedicated view will display the selected tileset (rendered from its I3S or glTF representation) as an isolated piece of land/model.
*   **JanusWeb Integration:**
    *   Load the *contents* of an I3S layer (which includes the glTF terrain and any associated assets) as a custom room in JanusWeb.
    *   Implement portal system for navigation between adjacent tileset rooms.
*   **Babylon.js View Integration:**
    *   Load and display generated glTF tileset models (or models extracted from I3S).
*   **Main Scene Panel Integration:**
    *   Update to support loading and viewing of generated I3S assets (and potentially glTF/USD directly).
*   **Assets Page:**
    *   Create a new "Assets" page/panel.
    *   List saved tileset assets (represented by their I3S container stored in Kart).
    *   For each asset, display a preview (e.g., using Three.js for glTF, or a suitable I3S viewer if available).
    *   Selecting an asset updates its display in the Scene Window and potentially other linked views.
*   **Synchronization & State Management:**
    *   Ensure selection of a tileset asset updates all relevant views.
*   **Persistence & Kart Integration:**
    *   **Kart:** Store source tile data (ZL21 selection, 3D Tiles references) and the generated I3S file (containing the glTF and other assets).
    *   Saved tilesets (I3S from Kart) populate the Assets page.
*   **Technology:** THREE.js for Assets page glTF preview, Kart for I3S storage.

## 5. Mobile MVP (Mundial - Web Responsive / PWA)

*   **Prerequisite:** ~~Fixed `mundial/main.js`~~. **DONE**
*   **Technology:** Responsive HTML/CSS, OpenLayers/OpenGlobus (adapted from Desktop), WebXR Device API, (Third Room for XR social view).
*   **Features:**
    *   **Core View:** OpenLayers/OpenGlobus view displaying globe/map, adapted for mobile screens.
    *   **Site Display:** View existing Site boundaries fetched from backend.
    *   **AR Mode (Geogesture PoC):**
        *   Button to request/enter AR session (WebXR).
        *   Display device camera feed as background.
        *   Allow user to draw simple 3D lines by moving the device (using WebXR pose tracking). Lines exist only within the AR session.
    *   **XR Window View Options (PoC):**
        *   Basic integration of JanusWeb as an XR view.
        *   Basic integration of Babylon.js as an XR view.
        *   Basic integration of Third Room as an XR view (leveraging the Synapse server).
*   **Out of Scope:** Saving AR drawings, placing assets in AR (Geoscope), advanced AR tracking (SLAM/ARToolKit), deep integration of desktop state into XR views beyond basic context, full feature parity for Third Room within MVP.

## Next Steps Post-MVP Definition

1.  ~~**Fix `mundial/main.js`:** Resolve the syntax errors to enable development.~~ **DONE**
2.  **Implement Backend MVP:** Set up API endpoints and basic Kart interaction.
3.  **Implement Desktop MVP:** Integrate OpenLayers/OpenGlobus, site display/creation UI, view toggling.
4.  **Begin PoC for 3D Tiles to glTF/I3S/USD Pipeline:**
    *   Focus on fetching/mocking 3D Tiles for a *single* ZL21 tile.
    *   Implement basic client-side parsing and conversion to glTF.
    *   Investigate and PoC I3S packaging (containing the glTF).
    *   Investigate and PoC USD conversion.
5.  **Develop Assets Page & Scene Window:**
    *   Basic structure for Assets page and Scene Window.
    *   Integrate viewer for glTF/I3S on Assets page and Scene Window.
6.  **Integrate I3S/glTF into JanusWeb and Babylon.js views as PoC.**
7.  **Kart Integration for I3S Storage PoC.**
8.  **Basic Leaflet Integration PoC:** Add Leaflet as a map view option with base map and ZL21 display.
9.  **Backend Services PoC:**
    *   Basic GunDB setup and data sync.
    *   Basic IPFS (js-ipfs) asset storage/retrieval.
    *   Document Synapse setup.
10. **Implement Mobile MVP:** Adapt UI, implement basic AR drawing feature.


## Future Enhancements / Post-MVP Considerations

*   **iTowns Integration:** Introduce iTowns as an advanced 3D globe/scene view option, leveraging its capabilities for 3D Tiles, point clouds, oblique imagery, etc.
*   **Rete.js Visual Coding Environment:**
    *   Implement a full visual coding window using Rete.js.
    *   Develop a comprehensive set of nodes for interacting with Mundial's data, views, and functionalities.
    *   Enable users to create complex custom behaviors, data processing pipelines, and interactive experiences.
*   **Third Room (Full Integration):** Full-featured integration of Third Room, including custom room creation based on tilesets, avatar customization, and advanced social features.
*   **Advanced Kart Features:** Full branching, merging, history, and popularity-based metrics for tilesets/sites.
*   **Full User Authentication & Authorization.**
*   **Full-Scale GunDB / Synapse / IPFS Integration:** Robust P2P data layers, real-time collaboration, federated communication, and decentralized storage solutions.
*   **Nodesque Backend & Editor Integration.**
*   **Advanced Rendering Techniques:** NeRF, Gaussian Splatting, Voxel rendering.
*   **In-World Building/Voxel/Mesh Editors.**
*   **Avatars & Social Features (Chat, Presence).**
*   **VR & Stereoscopy for immersive experiences.**
*   **Advanced UI/UX:** Docking panel system, comprehensive settings, theming.
*   **Gamification & Economy:** Strata, merging mechanics, expanded asset market.