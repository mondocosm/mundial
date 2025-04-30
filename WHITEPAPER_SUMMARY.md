# Mondocosm Whitepaper Summary (V0.5)

**Vision:** A user-centric, decentralized, gamified metaverse platform focused on capturing, creating, managing, versioning, visualizing, and interacting with diverse geospatial data.

**Core Concept:** Users interact with a shared "Level 0" public world and personal "Strata" (forks of sites/scenes). Gameplay mechanics, driven by Kart version control (branching/merging) and community engagement (likes/merges), determine which user-created Strata become the canonical version on Level 0, fostering collaborative evolution and rewarding popular contributions.

**Architecture:**
*   **Mundial (Frontend):** Web application, likely built on a core engine (Babylon.js preferred, iTowns/VTS/Godot/O3DE considered). Integrates 2D maps (OpenLayers, MapLibre, etc.), 3D globes/scenes (OpenGlobus, CesiumJS, WhirlyGlobe, iTowns, VTS), VR (JanusWeb/WebXR), stereoscopic 3D, voxel rendering, and avatar systems. Hosts the "Nodesque" visual node editor and specialized editors (Building, Voxel, Mesh).
*   **Terrallax (Backend):** Node.js service managing data and logic. Uses Kart for versioning and gameplay mechanics, GunDB/WebSockets/Synapse for real-time sync/comms, IPFS for storage (planned). Provides REST APIs.
*   **MondocosmOS (Base):** Foundational layer, potentially integrating os.js.

**Key Features & Technologies:**
*   **Data:** Supports diverse formats (Vector, Raster, Point Clouds, Photogrammetry, NeRFs, Gaussian Splats, 3D Tiles, i3s, OSG, Voxels). Includes conversion pipelines.
*   **Versioning & Gameplay:** Kart powers versioning, branching (Strata), merging (social linking/popularity), and Level 0 promotion logic.
*   **Visualization:** Multiple map/globe engines, VR, stereoscopic 3D, voxel views.
*   **Nodesque:** Rete.js wrapping Node-RED, PolygonJS, BlackprintJS, n8n for visual workflow editing and platform configuration.
*   **Editing:** Stacked extrusion building editor (Z25 grid), Voxel editor, Wings3D/Dust3D/Blender integration.
*   **Decentralization:** Kart, GunDB, IPFS, Element/Synapse, "Mundial Units" (feeless Nano-clone currency), IOTA/Shimmer (NFTs/Smart Contracts).
*   **Avatars:** Ready Player Me, Avatarify, MakeHuman.
*   **UI/UX:** Docking/tabbing panels, fixed UI scaling, Login/Signup, Examples menu, Chat.

**Status & Next Steps:** The project has a broad, ambitious vision. Significant development is required across frontend, backend, gameplay logic, and various integrations. **Stabilizing the core frontend (`mundial/main.js`) is the critical prerequisite before implementing most planned features.**