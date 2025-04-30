# Mondocosm - Concept Design Outline V0.1

## 1. Core Philosophy & Origins

*   **Origins:** Evolved from **Geogesture** (mobile AR 3D stylus/graffiti using device sensors/camera, SLAM/PTAM, ARToolKit/WebXR) and **Terrallax** (AR/photogrammetry data capture for 2D/3D/4D world mapping).
*   **Decentralized & User-Owned:** Empower users to own, control, and version their geospatial data and creations.
*   **Gamified Collaboration:** Use game mechanics (Level 0/Strata, popularity) driven by version control (Kart) to foster community engagement and content curation.
*   **Extensible & Interoperable:** Build an open platform supporting diverse data types, visualization engines (including specialized geospatial ones like iTowns/VTS), and workflows, configurable via visual scripting (Nodesque).
*   **Multi-Paradigm Interaction:** Seamlessly integrate 2D map, 3D globe, VR, and AR views, potentially with smooth morphing transitions between map and globe.

## 2. Key Concepts

*   **World:** The overall container, including the public Level 0 and private user spaces.
*   **Level 0:** The primary public sphere where the most popular version (Strata) of a site is displayed. Open for adding content to unoccupied areas.
*   **Strata:** A user's personal branch/version of a Site or potentially a larger area, stored and managed by Kart. Users edit their Strata.
*   **Site/Scene:** A specific, version-controlled area (defined by Z21 tiles or other boundaries) containing geospatial data, 3D models, buildings, etc. The primary unit of content creation and competition.
*   **Collection:** A user-defined grouping of Sites/Scenes or Assets within their portfolio.
*   **Asset:** Individual data pieces (3D models, textures, point clouds, NeRFs, Gaussian Splats, building definitions, vector graphics, AR emojis, etc.).
*   **Data Pipeline:** Workflow for converting user imports (NeRF, Gaussian Splats) -> Point Clouds -> Octree Voxels -> Smooth Voxels -> Meshes.
*   **Nodesque:** The integrated visual node editor (Rete.js wrapping Node-RED, PolygonJS, BlackprintJS, n8n) for scripting, workflow automation, data processing (Turf.js, GDAL), and platform configuration. Potentially runs within os.js.
*   **Mundial Units (MU):** Feeless native cryptocurrency for transactions.
*   **Avatars:** User representation (Ready Player Me, Avatarify, MakeHuman, potentially Dust3D).
*   **Building Grid:** Z25 grid (16x16 subdivision of Z21 tiles) for structured building/editing within Sites, visible from Z19+.

## 3. User Experience Goals

*   **Intuitive Navigation:** Easy switching and potentially smooth morphing transitions between 2D map and 3D globe views (starting at Utupua Island: -11.26175, 166.52407). Synchronized view state. Integration with VR/AR views.
*   **Seamless Creation Workflow:**
    *   Simple tools to select areas and save them as Sites.
    *   Integrated Building Editor (stacked extrusion on Z25 grid).
    *   Integrated Voxel Editor.
    *   Integration with external/embedded modelers (Wings3D, Dust3D, Blender). Dust3D potentially used for map-view UI and avatars.
    *   Mobile AR tools (Geogesture 3D drawing, Geoscope asset placement) using device sensors/camera (ARToolKit/WebXR).
*   **Gamified Collaboration:**
    *   Clear visualization of Level 0 vs. personal Strata.
    *   Easy discovery, forking, and merging of Sites/Strata.
    *   Visible metrics for Strata popularity.
    *   Notifications for Level 0 promotions/demotions.
*   **Powerful Customization (Nodesque):** Allow users to automate tasks, process data, and customize interactions using a visual node editor. Make platform components editable via Nodesque where possible.
*   **Flexible Visualization:** Support for various map styles (MapLibre, Leaflet), globe engines (OpenGlobus, Cesium, WhirlyGlobe, iTowns, VTS), data formats (3D Tiles, i3s, OSG, NeRFs, Splats, etc.), and rendering modes (Stereo 3D, Voxels). Efficient streaming via VTS or iTowns. Default terrain ON for globe, OFF for map (toggleable per-site).
*   **Social Interaction:** Integrated chat (Element/Synapse), user profiles, avatars, friend system linked to Strata merging. ActivityPub support considered.
*   **Performant Experience:** Efficient streaming/rendering, responsive UI.
*   **Stable UI:** Consistent UI panel layout (docking/tabbing) and fixed element size regardless of browser zoom.

## 4. Core UI Components

*   **Main Viewport:** Displays Map/Globe/Engine/VR view (with potential morphing).
*   **Top Menu Bar:** Logo, File/Edit/View/Tools/Examples/Help menus, Login/Signup.
*   **Engine/View Menu:** Allows selection between different rendering engines/views.
*   **Examples Menu:** Access to loaded examples.
*   **Layer Switcher Panel:** Manage base maps, terrain, overlays.
*   **User Layers/Strata Panel:** Manage Collections, Strata, Sites. Includes tools for Fork, Merge, Split, Delete, Privacy. Displays popularity.
*   **Nodesque Panel:** Hosts the Rete.js node editor interface with its toolbar.
*   **Building/Voxel/Mesh Editor Panel(s):** Context-sensitive panels.
*   **Chat Panel:** Integrated communication.
*   **Site Details Panel:** Displays information about the selected Site/Strata.
*   **Asset Browser:** For managing assets.
*   **Mobile UI:** Adapted interface for AR features (Geogesture, Geoscope).