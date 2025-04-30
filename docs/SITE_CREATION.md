# Site Creation Workflow

This document outlines the process for creating a new "Site" within the Mundial application. A Site represents a collection of selected geographic cells (currently Web Mercator Z21 tiles).

## Steps

1.  **Select Cells:**
    *   Navigate the map/globe view (currently OpenLayers map or iTowns view when enabled).
    *   Ensure the zoom level is sufficient for the Z21 grid to be visible (Zoom >= 16).
    *   Click on individual Z21 grid cells to add them to the current selection.
    *   Selected cells will be highlighted visually.
    *   The "Selection Details" panel will update to show the count of selected cells.

2.  **Name the Site:**
    *   Once cells are selected, the "Save Selection" controls will appear in the "Selection Details" panel.
    *   Enter a descriptive name for the new Site in the "Site Name" input field.

3.  **Save the Site:**
    *   Click the "Save Selection to Layer" button.
    *   The frontend will:
        *   Gather the selected cell features (currently represented as GeoJSON Polygons).
        *   Send a POST request to the backend API endpoint (`/api/sites`).
        *   The request body includes the chosen `name` and the `boundaryData` (GeoJSON FeatureCollection of the selected cell polygons).
    *   The backend (`kart-service.js`) will:
        *   Receive the request.
        *   Create a new Kart repository named after the site name (with a unique suffix).
        *   Store the provided `boundaryData.geojson` within the new repository.
        *   Return the details of the created site (including the `repoName` and `siteId`).

4.  **Confirmation:**
    *   The frontend receives the response from the backend.
    *   An alert confirms successful site creation.
    *   The selection is cleared from the map.
    *   The "Site List" panel is refreshed to include the newly created site.
    *   The boundary of the new site is displayed on the map (Layer 0).

## Backend Details

*   **API Endpoint:** `POST /api/sites`
*   **Request Body:** `{ "name": "string", "boundaryData": GeoJSON FeatureCollection }`
*   **Service Logic:** Located in `backend-server/kart-service.js` (`createSite` function).
*   **Storage:** Each site gets its own directory within `backend-server/kart-repos/`.

## Frontend Details

*   **Selection Logic:** Primarily in `mundial/map.js` (OpenLayers interactions) and potentially `mundial/itowns-view.js` (iTowns interactions). Selection state managed via `selectionSource`.
*   **UI Updates:** Handled in `mundial/main.js` (`updateSelectionUI` function).
*   **API Call:** Triggered by the "Save Selection" button listener in `mundial/main.js`.