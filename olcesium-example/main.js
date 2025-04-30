// Ensure OpenLayers (ol), Cesium, and OlCesium (olcs) are loaded globally
if (typeof ol === 'undefined' || typeof Cesium === 'undefined' || typeof olcs === 'undefined') {
    console.error("Required libraries (OpenLayers, Cesium, OlCesium) not loaded. Check script tags in index.html.");
} else {
    // 1. Create OpenLayers Map with a non-Ion base layer
    const osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM() // Standard OpenStreetMap
    });

    const map = new ol.Map({
        layers: [osmLayer],
        target: 'map',
        view: new ol.View({
            center: ol.proj.fromLonLat([0, 0]), // Center on [0, 0]
            zoom: 2
        })
    });

    // 2. Create OlCesium instance
    // Pass configuration to the underlying Cesium Scene during initialization
    const ol3d = new olcs.OLCesium({
        map: map,
        // Explicitly set the terrain provider for the Cesium Scene
        // to avoid potential defaults that might require Ion.
        createOptions: {
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            // OlCesium usually syncs the OL base layer for imagery,
            // so explicitly setting imageryProvider here might be redundant,
            // but ensures it doesn't fall back to an Ion default if sync fails.
            // imageryProvider: new Cesium.OpenStreetMapImageryProvider({
            //     url : 'https://a.tile.openstreetmap.org/'
            // }),

            // Disable Cesium widgets that might rely on Ion
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            infoBox: true, // Keep infoBox if needed
        }
    });

    // 3. Enable 3D mode
    ol3d.setEnabled(true);

    // Optional: Access the underlying Cesium Scene if needed
    // const scene = ol3d.getCesiumScene();
    // scene.globe.enableLighting = true; // Example: Enable lighting

    console.log("OlCesium initialized, attempting to use non-Ion sources.");

    // Add a button to toggle between 2D and 3D (optional)
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = 'Toggle 2D/3D';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '10px';
    toggleButton.style.left = '10px';
    toggleButton.style.zIndex = '1000'; // Ensure button is visible
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.onclick = () => {
        ol3d.setEnabled(!ol3d.getEnabled());
    };
    document.body.appendChild(toggleButton);
}