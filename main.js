// Wait for the DOM to be fully loaded before initializing the map
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');

    if (typeof ol === 'undefined') {
        console.error('CRITICAL: OpenLayers object (ol) not found.');
        return;
    } else {
        console.log('OpenLayers object (ol) found. Version:', ol.version);
    }

    // --- Base Layer ---
    const tileSource = new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © ArcGIS',
        crossOrigin: 'anonymous',
        // Add maxZoom to potentially help with tile requests
        maxZoom: 19
    });

    // Log tile loading events
    tileSource.on('tileloadstart', function() {
      console.log('Tile load start...');
    });
    tileSource.on('tileloadend', function() {
      console.log('Tile load end.');
    });
    tileSource.on('tileloaderror', function() {
      console.error('Tile load error.');
    });

    const baseLayer = new ol.layer.Tile({
        source: tileSource
    });

    // --- Map Initialization ---
    try {
        const map = new ol.Map({
            target: 'map',
            layers: [baseLayer],
            view: new ol.View({
                center: ol.proj.fromLonLat([0, 0]),
                zoom: 2
            }),
            interactions: ol.interaction.defaults()
        });

        console.log('Minimal map initialized inside DOMContentLoaded.');

        map.once('postrender', () => {
             console.log('Map postrender event fired.');
             map.updateSize(); // Ensure size is updated after first render
             console.log('Map size after postrender:', map.getSize());
        });

    } catch (e) {
        console.error('Minimal map initialization failed:', e);
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `<div style="color:red;padding:20px;">Map failed to initialize: ${e.message}</div>`;
        }
    }
});
