# Mondocosm - Minimum Viable Product (MVP) Scope V1.0

This document defines the initial scope for the Mondocosm MVP, focusing on demonstrating the core value proposition: a collaborative, versioned geospatial platform.

## Overarching Goal

Deliver a functional baseline demonstrating the ability for users to view a shared geospatial world, claim/save personal "Sites" within it using basic persistence and versioning, and view these creations. Provide a glimpse into unique interaction paradigms (AR on mobile).

## 1. Backend MVP (Terrallax)

*   **Technology:** Node.js, Express.js, Kart (basic CLI integration or library).
*   **Features:**
    *   Functional REST API server.
    *   Basic Kart repository setup.
    *   API Endpoint: `POST /api/sites` (Requires: owner ID [placeholder], site name, boundary data [e.g., Z21 tile IDs/GeoJSON]). Stores data in Kart.
    *   API Endpoint: `GET /api/sites` (Returns list of sites, potentially filterable).
    *   API Endpoint: `GET /api/sites/:siteId` (Returns details of a specific site).
    *   Placeholder user authentication (e.g., hardcoded user ID passed via header).
*   **Out of Scope:** GunDB, Synapse, IPFS, advanced Kart (branching/merging/popularity), full authentication, cryptocurrency, Nodesque backend integration.

## 2. Desktop MVP (Mundial - Web)

*   **Prerequisite:** Fixed `mundial/main.js`.
*   **Technology:** JavaScript Modules, iTowns (primary view), Parcel.
*   **Features:**
    *   **Core View:** iTowns rendering a 3D globe by default, centered on Utupua Island (-11.26175, 166.52407). Basic base map layer. Basic terrain if easily configurable in iTowns, otherwise flat globe.
    *   **Site Display:** Fetch site list from `GET /api/sites` and display boundaries as simple vector outlines in the iTowns view.
    *   **Site Creation:**
        *   Map interaction (e.g., Ctrl+Click) to select one or more Z21 tiles.
        *   Simple UI form (e.g., in a panel) to name the selection.
        *   "Save Site" button triggers `POST /api/sites` with selected tile data/boundary and placeholder owner ID.
    *   **Basic UI Panels:** Draggable/minimizable panels for:
        *   Layer Switcher (functional base map toggle).
        *   Site List (read-only display of site names fetched from backend).
    *   **View Toggling:** Functional 2D/3D switch using iTowns `view.select()` (or equivalent) to toggle between `globe` and `planar` projections. Basic camera state synchronization (location/zoom) between views. No animation required.
*   **Out of Scope:** Babylon.js/Other engines, OpenLayers/OpenGlobus (unless kept for basic 2D), advanced rendering (NeRF, Splats, Voxels), Building/Voxel/Mesh Editors, Nodesque editor integration, Avatars, VR, Stereoscopy, advanced UI (docking, scaling fix, chat), advanced gameplay (Strata, merging, popularity), MapLibre/DeckGL/Leaflet, detailed Site management tools, full user authentication.

## 3. Mobile MVP (Mundial - Web Responsive / PWA)

*   **Prerequisite:** Fixed `mundial/main.js`.
*   **Technology:** Responsive HTML/CSS, iTowns, WebXR Device API.
*   **Features:**
    *   **Core View:** iTowns view displaying globe/map, adapted for mobile screens.
    *   **Site Display:** View existing Site boundaries fetched from backend.
    *   **AR Mode (Geogesture PoC):**
        *   Button to request/enter AR session (WebXR).
        *   Display device camera feed as background.
        *   Allow user to draw simple 3D lines by moving the device (using WebXR pose tracking). Lines exist only within the AR session.
*   **Out of Scope:** Saving AR drawings, placing assets in AR (Geoscope), advanced AR tracking (SLAM/ARToolKit), integration with desktop state beyond viewing sites.

## Next Steps Post-MVP Definition

1.  **Fix `mundial/main.js`:** Resolve the syntax errors to enable development.
2.  **Implement Backend MVP:** Set up API endpoints and basic Kart interaction.
3.  **Implement Desktop MVP:** Integrate iTowns, site display/creation UI, basic view toggling.
4.  **Implement Mobile MVP:** Adapt UI, implement basic AR drawing feature.