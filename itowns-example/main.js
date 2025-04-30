const globeDiv = document.getElementById('globeDiv');
const view = new itowns.GlobeView(globeDiv, {
    longitude: 3.0,
    latitude: 45.0,
    altitude: 25000000
});

// Add a WGS84 terrain layer
itowns.Fetcher.json('./layers/WGS84_PseudoMercator_terrain.json')
    .then(geojson => {
        const config = {
            source: new itowns.FileSource({
                fetchedData: geojson
            })
        };
        view.addLayer(new itowns.ColorLayer('WGS84_terrain', config));
    });

// Add a WGS84 imagery layer
itowns.Fetcher.json('./layers/WGS84_PseudoMercator_imagery.json')
    .then(geojson => {
        const config = {
            source: new itowns.FileSource({
                fetchedData: geojson
            })
        };
        view.addLayer(new itowns.ColorLayer('WGS84_imagery', config));
    });

// Add a tile selection UI (placeholder for now)
// This will be implemented in a later step
function addTileSelectionUI() {
    const uiDiv = document.createElement('div');
    uiDiv.style.position = 'absolute';
    uiDiv.style.top = '10px';
    uiDiv.style.left = '10px';
    uiDiv.style.background = 'white';
    uiDiv.style.padding = '10px';
    uiDiv.style.zIndex = '100';
    uiDiv.innerHTML = '<h2>Tile Selection UI</h2><p id="tile-info">Click on the globe to select a tile</p>';
    document.body.appendChild(uiDiv);

    const tileInfo = document.getElementById('tile-info');

    view.addEventListener(itowns.VIEW_EVENTS.POINTER_CLICK, (event) => {
        const pickingResult = view.pickObjectsAt(event.offsetX, event.offsetY);
        if (pickingResult.length > 0) {
            const tile = pickingResult[0].object.tile;
            if (tile) {
                tileInfo.innerHTML = `
                    <h2>Tile Information</h2>
                    <p>Layer: ${tile.layer.id}</p>
                    <p>Zoom: ${tile.level}</p>
                    <p>X: ${tile.tilecoord.x}</p>
                    <p>Y: ${tile.tilecoord.y}</p>
                `;
            } else {
                tileInfo.innerHTML = '<h2>Tile Selection UI</h2><p id="tile-info">Click on the globe to select a tile</p>';
            }
        } else {
             tileInfo.innerHTML = '<h2>Tile Selection UI</h2><p id="tile-info">Click on the globe to select a tile</p>';
        }
    });
}

addTileSelectionUI();