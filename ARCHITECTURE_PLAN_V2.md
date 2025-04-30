# Mondocosm Architectural Refinement Plan (V2)

This plan outlines the proposed architectural changes to improve maintainability and prepare the `mondocosm` project for future features, incorporating Kart for data management and GunDB for UI synchronization.

## 1. Naming Conventions

*   **Frontend Application:** `mundial` (Directory: `../mondocosm/mundial/`)
*   **Backend Service:** `terrallax` (Directory: `../mondocosm/backend-server/`)
*   **Data Concepts:**
    *   User Layers -> `Collections`
    *   Tilesets -> `Scenes`

## 2. Backend (`terrallax`) Design

*   **Primary Data Store:** Kart will manage the core persistent and versioned data.
*   **Kart Data Hierarchy:** Portfolio (User Root) -> DGGS -> World -> Collection -> Scene -> Asset.
*   **Kart Responsibilities:** Storage and versioning of Portfolios, DGGS definitions (Web Mercator, H3, S2, Custom), Worlds (Public/Private), Collections, Scenes (Geometry, i3s/3D Tiles data pointers), Assets, Map Layer definitions, 3D Terrain data.
*   **GunDB Role:** Manage transient UI/UX state (e.g., temporary selections, collaborative pointers, real-time notifications). Data path to be configured correctly within the `terrallax` directory (`file: 'radata'`).
*   **Kart Interface:** Develop backend functions/API endpoints for CRUD operations on Kart-managed data types and versioning.
*   **Permissions:** Implement logic for public/private Worlds/Scenes and invitations (likely stored alongside data in Kart or a separate permissions model).
*   **API:** Define a clear API (likely REST/HTTP for Kart operations, WebSocket/GunDB for real-time sync) for communication between `terrallax` and `mundial`.

## 3. Frontend (`mundial`) Refactoring

*   **Modularity:** Refactor the monolithic `mundial/main.js` into smaller, focused ES Modules:
    *   `map.js`: OpenLayers setup, map-specific interactions.
    *   `globe.js`: OpenGlobus setup, globe-specific interactions (including Shift+Drag).
    *   `ui.js`: Management of UI panels (DOM manipulation, event listeners for UI elements).
    *   `state.js`: Centralized management of transient application state (current view, selected items, cached data).
    *   `backend.js`: Handles all communication with the `terrallax` backend API (Kart ops via HTTP/WS, UI sync via GunDB).
    *   `sync.js`: Logic for synchronizing map/globe views and OL/OG layer representations.
    *   `main.js`: Main entry point, imports and orchestrates modules.
*   **UI Updates:** Adapt UI components to use new terminology (Collections, Scenes) and reflect the data hierarchy. Implement necessary UI for new concepts (Portfolios, Worlds, DGGS, Permissions).
*   **Scene Handling:**
    *   Implement "Save Selection" to create `Scenes` via the `terrallax` API.
    *   Develop Scene isolation viewport feature.
    *   Integrate Turf.js for client-side analysis.
    *   Plan JanusWeb integration using Scene data (i3s).
*   **OGC Compliance:** Review data formats and interactions for OGC standard alignment where practical.

## 4. Conceptual Diagram

```mermaid
graph LR
    subgraph Frontend (mundial - Browser)
        UI(UI Components/Panels) <--> StateMgmt(UI State / Transient Data)
        MapGlobeView(Map/Globe View - OL/OG) <--> StateMgmt
        MapGlobeView <--> InteractionHandlers(Click/Drag Handlers)
        InteractionHandlers --> BackendComm(Backend Communication)
        UI <--> BackendComm
        StateMgmt <--> BackendComm

        BackendComm -- GunDB (UI Sync) --> Terrallax
        BackendComm -- API (HTTP/WS for Kart Ops) --> Terrallax
        MapGlobeView -- Loads --> Terrallax(Map/Terrain Data via Kart)
        MapGlobeView -- Uses --> TurfJS(Turf.js)
        MapGlobeView -- Integrates --> JanusWeb(JanusWeb Rooms)
    end

    subgraph Backend (terrallax - Node.js)
        TerrallaxAPI[API (HTTP/WS)] <--> KartInterface(Kart Interface)
        TerrallaxAPI <--> GunDB[GunDB (UI Sync)]

        KartInterface -- Manages --> KartRepos[Kart Repositories]
        KartRepos --> DataModel[Data Model (Portfolio -> DGGS -> World -> Collection -> Scene -> Asset, Layers, Terrain, Permissions)]


        GunDB --> TransientData[(UI/Session State)]
    end

    style Frontend fill:#lightblue,stroke:#333,stroke-width:2px
    style Backend fill:#lightgreen,stroke:#333,stroke-width:2px
```

## 5. Implementation Priorities (Initial)

1.  Fix `terrallax` backend GunDB path error.
2.  Begin frontend modularization (`mundial/main.js` refactor).
3.  Define and implement the Kart Interface and data structures in `terrallax`.