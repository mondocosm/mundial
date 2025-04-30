// Import Cesium if using modules locally, otherwise it's available globally from the script tag
// import * as Cesium from 'cesium'; // Use this if you install Cesium via npm

// Ensure Cesium is loaded (it should be global from the script tag in index.html)
if (typeof Cesium === 'undefined') {
    console.error("Cesium library not loaded. Ensure the script tag in index.html is correct.");
} else {
    // Use OpenStreetMap imagery provider
    const osmImageryProvider = new Cesium.OpenStreetMapImageryProvider({
        url : 'https://a.tile.openstreetmap.org/' // Standard OSM tile server
        // You can add attributions here if needed
    });

    // Use Ellipsoid terrain provider (no external data needed)
    const ellipsoidTerrainProvider = new Cesium.EllipsoidTerrainProvider();

    // Initialize the Cesium Viewer
    const viewer = new Cesium.Viewer('cesiumContainer', {
        // Use the providers defined above
        imageryProvider: osmImageryProvider,
        terrainProvider: ellipsoidTerrainProvider,

        // Disable features that rely heavily on Cesium Ion by default
        baseLayerPicker: false, // Hides the base layer picker
        geocoder: false, // Hides the geocoder search bar
        homeButton: false, // Hides the home button
        sceneModePicker: true, // Keep scene mode picker (2D/3D/Columbus)
        navigationHelpButton: false, // Hides the navigation help button
        animation: false, // Hides the animation widget
        timeline: false, // Hides the timeline widget
        fullscreenButton: false, // Hides the fullscreen button
        infoBox: true, // Keep the info box for feature details
        // vrButton: false, // Hides the VR button if present

        // Optional: Set a default starting view
        // camera: { ... }
    });

    // Optional: Add Cesium OSM Buildings (requires Ion access or self-hosting)
    // If you have self-hosted OSM Buildings tileset:
    // const osmBuildings = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
    //   url: 'URL_TO_YOUR_OSM_BUILDINGS_TILESET'
    // }));
    // viewer.flyTo(osmBuildings);

    // Optional: Add other data sources or functionality here

    console.log("Cesium Viewer initialized without default Ion token usage.");
}