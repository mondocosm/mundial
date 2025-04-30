# Master Integration Plan

This document tracks planned future integrations, architectural changes, and container compositing strategies for the Mondocosm/Mundial project.

## Planned Integrations & Features

*   **Cosmicrete (Rete.js Fork):**
    *   [ ] Develop nodes for 3D scene interaction (e.g., SetPosition, ApplyForce).
    *   [ ] Develop nodes for controlling physics profiles.
    *   [ ] Investigate nodes for IoT data input/output.
    *   [ ] Goal: Use Cosmicrete as an orchestration layer similar to vvvv/Max/Grasshopper.

*   **Radio.garden / vradio.garden UGC:**
    *   [ ] Define specific requirements (stream browsing, UGC upload, location association?).
    *   [ ] Design UI integration (map interaction, dedicated panel?).
    *   [ ] Determine backend needs (database, storage, API endpoints).
    *   [ ] *Reference Links:* (Add relevant GitHub links here when available)

*   **Pueo Flight Simulation:**
    *   [ ] Refine physics profiles (Default, Buoyant, Archaeopteryx, Custom).
    *   [ ] Implement launch/land mechanics.
    *   [ ] Improve camera follow logic.
    *   [ ] Implement "Horus-type" controls/physics (details TBD).
    *   **X-Mundial Game Demo:**
        *   [ ] Concept: Hike & Fly paragliding race based on Red Bull X-Alps rules.
        *   [ ] Implement basic race structure (start/end points, turnpoints).
        *   [ ] Implement hiking mechanic (if applicable).
        *   [ ] Refine flight physics for paragliding feel.
        *   [ ] Integrate Paragliding Earth data (sites, KML?).
        *   [ ] Integrate Leonardo flight track data (IGC/GPX parsing & visualization?).

*   **Asset Management:**
    *   [ ] Establish clear workflow for adding/managing assets (`.glb`, images).
    *   [ ] Consider dedicated asset library (e.g., separate Git repo, UI).


*   **Amphibious Entities (Avatars/Vehicles):**
    *   [ ] Design physics/control switching based on environment (air, land, water).
    *   [ ] Implement environment detection.
    *   [ ] Define physics profiles for different mediums.

*   **Synesthetic Feedback:**
    *   [ ] Design mappings between simulation data (speed, collision, state) and sensory output (sound, visuals).
    *   [ ] Implement using Cosmicrete nodes to connect data sources and outputs.
    *   [ ] Integrate sound generation/playback.
    *   [ ] Integrate visual effect generation.
*   **(Add other planned features/integrations here)**

## Architectural Refinements

*   **Modularization:**
    *   [ ] Refactor `mundial/main.js` into smaller, focused modules.
    *   [ ] Improve separation of concerns between UI, state, map, 3D scene logic.

*   **Parametric Component Visual Node Coder Architecture:**
    *   [ ] Define component structure.
    *   [ ] Link node parameters to component properties.

## Container Compositing Strategy

*   **Backend Server (`backend-server/`):**
    *   [x] Basic Dockerfile created.
    *   [ ] Define environment variables needed.
    *   [ ] Define volume mounts needed (e.g., for `kart-repos`).
    *   [ ] Create ARM64 variant for edge devices (Target: Nvidia Jetson AGX Xavier - "johnny5 prototype v1").
    *   [ ] Consider multi-stage builds for smaller production images.
    *   [ ] Define Docker Compose setup for local development/testing.

*   **Mundial Frontend (`mundial/` - "Paracropolis"):**
    *   [ ] Create Dockerfile using multi-stage build (Node build stage + Nginx/Caddy serve stage).
    *   [ ] Define configuration options (e.g., backend API URL).
*   **Noesis Oasis:**
    *   [ ] Define component function, technology stack, and architecture.
    *   [ ] Create Dockerfile once defined.
*   **(Add strategies for other potential containers here)**