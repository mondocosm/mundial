// mundial514/js/main.js - Reconstructed Skeleton
"use strict";

console.log("MAIN.JS SCRIPT EXECUTION STARTED - VERY TOP LINE");

// Global-like variables (many will need proper initialization elsewhere or passed as params)
let olMap = null;
let globus = null; 
let selectionSource = null; 
let userLayers = {};
let selectedLayerId = null;
let currentInteractionMode = 'pan'; 
const TILE_SELECTION_ZOOM = 21; // Critical for tile selection logic

// --- Helper Function Stubs (to be fully implemented) ---
if (typeof getTileId === 'undefined') {
    function getTileId(tileCoord) { 
        if (!Array.isArray(tileCoord) || tileCoord.length < 3) return 'invalid-tileCoord';
        return `${tileCoord[0]}-${tileCoord[1]}-${tileCoord[2]}`; 
    }
}
if (typeof toggleTileSelectionOL === 'undefined') {
    function toggleTileSelectionOL(tileCoord, isIndividualSelection) { 
        console.warn("toggleTileSelectionOL needs full implementation. Coords:", tileCoord, "Individual:", isIndividualSelection); 
    }
}
// Add other necessary global helper function stubs here if they are called directly by the init functions

// --- OpenGlobus Initialization (Simplified & Structurally Sound) ---
function initializeOpenGlobus() {
    console.log("%cDEBUG: initializeOpenGlobus function ENTERED (Simplified Version).", "color: orange; font-weight: bold;");

    return new Promise((resolveOpenGlobusInitialized, rejectOpenGlobusInitialized) => {
        if (typeof og === 'undefined') {
            console.error("%cFATAL ERROR: OpenGlobus library (og) is NOT DEFINED. Cannot initialize globe.", "color: red; font-size: 1.2em; font-weight: bold;");
            rejectOpenGlobusInitialized(new Error("OpenGlobus library (og) not defined."));
            return;
        }
        if (window.globus) {
            console.warn("%cWARN: window.globus object already exists. Skipping re-initialization.", "color: yellow; font-weight: bold;");
            resolveOpenGlobusInitialized(); 
            return;
        }

        try {
            console.log("DEBUG: Attempting to create og.Globe instance (Simplified)...");
            window.ogBaseLayers = {};

            const osmOgLayer = new og.layer.XYZ("OpenStreetMap", {
                isBaseLayer: true, url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                visibility: false, attribution: '© OpenStreetMap contributors'
            });
            const satelliteOgLayer = new og.layer.XYZ("Satellite", {
                isBaseLayer: true, url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                visibility: true, attribution: 'Tiles © ArcGIS'
            });
            window.ogBaseLayers['osm'] = osmOgLayer;
            window.ogBaseLayers['satellite'] = satelliteOgLayer;
            
            const globusContainerElement = document.getElementById('globusContainer');
            if (!globusContainerElement) {
                console.error("%cFATAL ERROR: 'globusContainer' DIV not found.", "color: red;");
                rejectOpenGlobusInitialized(new Error("'globusContainer' DIV not found."));
                return;
            }

            window.globus = new og.Globe({
                target: globusContainerElement, name: "OpenGlobus View", layers: [osmOgLayer, satelliteOgLayer],
                terrain: new og.terrain.EmptyTerrain(), 
                lon: -74.0445, lat: 40.6892, alt: 3000000, 
                resourcesSrc: "/packages/openglobus/res", fontsSrc: "/packages/openglobus/res/fonts"
            });

            if (!window.globus || !window.globus.planet) {
                console.error("%cFATAL ERROR: og.Globe constructor FAILED or planet not created.", "color: red;");
                rejectOpenGlobusInitialized(new Error("og.Globe constructor failed."));
                return;
            }
            console.log("%cDEBUG: og.Globe constructor SUCCEEDED.", "color: green;");

            const TILE_SELECTION_ZOOM_FOR_DRAW = TILE_SELECTION_ZOOM; 
            window.ogSavedTilesetsLayer = new og.layer.CanvasTiles("Saved Tilesets", {
                visibility: true, minZoom: 1, maxZoom: 22, opacity: 0.7,
                drawTile: function (material, applyTexture) {
                    const canvas = document.createElement("canvas"); const size = 256;
                    canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d');
                    if (!ctx || !material.segment) { applyTexture(canvas); return; }
                    const { tileZoom, tileX, tileY } = material.segment;
                    const ogTileId = getTileId([tileZoom, tileX, tileY]);
                    let drawn = false;

                    if (tileZoom === TILE_SELECTION_ZOOM_FOR_DRAW) {
                        const tempSelFeat = window.selectionSource && typeof window.selectionSource.getFeatures === 'function' ? window.selectionSource.getFeatures().find(f => (f.getId() === ogTileId || f.get('tileId') === ogTileId) && f.get('isIndividualSelection') === true) : null;
                        if (tempSelFeat) {
                            ctx.fillStyle = "rgba(255, 255, 0, 0.5)"; ctx.fillRect(0, 0, size, size);
                            ctx.strokeStyle = "rgba(255, 200, 0, 0.8)"; ctx.lineWidth = 3; ctx.strokeRect(0, 0, size, size);
                            drawn = true;
                        } else if (window.selectedLayerId && window.userLayers && window.userLayers[window.selectedLayerId]) {
                            const olSrc = window.userLayers[window.selectedLayerId].layer.getSource();
                            const feat = olSrc && typeof olSrc.getFeatures === 'function' ? olSrc.getFeatures().find(f => f.get('tileId') === ogTileId) : null;
                            if (feat) {
                                let color = feat.get('color') || '#008080';
                                let opacity = feat.get('fillOpacity') === undefined ? 0.6 : feat.get('fillOpacity');
                                if (color.startsWith('#')) {
                                    let r = 0, g = 0, b = 0; let c = color.substring(1).split('');
                                    if (c.length === 3) { c = [c[0],c[0],c[1],c[1],c[2],c[2]]; }
                                    c = '0x'+c.join(''); r=(c>>16)&255; g=(c>>8)&255; b=c&255;
                                    color = `rgba(${r},${g},${b},${opacity})`;
                                } else if (color.startsWith('rgba')) { color = color.replace(/[\d\.]+\)$/, `${opacity})`); }
                                ctx.fillStyle = color; ctx.fillRect(0, 0, size, size);
                                drawn = true;
                            }
                        }
                    }
                    if (drawn) { applyTexture(canvas); } else { ctx.clearRect(0,0,size,size); applyTexture(canvas); }
                }
            });
            window.globus.planet.addLayer(window.ogSavedTilesetsLayer);
            console.log("DEBUG: ogSavedTilesetsLayer added.");

            const TILE_GRID_MIN_ZOOM_OG = 20;
            window.gridLayerOG = new og.layer.CanvasTiles("ZL21 Grid OG", {
                visibility: true, minZoom: TILE_GRID_MIN_ZOOM_OG, maxZoom: 22, opacity: 0.6,
                drawTile: function (material, applyTexture) {
                    const canvas = document.createElement('canvas'); const size = 256;
                    canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d');
                    if (!ctx || !material.segment) { applyTexture(canvas); return; }
                    if (material.segment.tileZoom >= TILE_GRID_MIN_ZOOM_OG) {
                        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
                        ctx.lineWidth = (material.segment.tileZoom === TILE_SELECTION_ZOOM_FOR_DRAW) ? 2 : 1;
                        ctx.strokeRect(0,0,size,size);
                    }
                    applyTexture(canvas);
                }
            });
            window.globus.planet.addLayer(window.gridLayerOG);
            console.log("DEBUG: gridLayerOG added.");

            window.tileCubeLayer = new og.layer.Vector("Tile Cubes", {
                clampToGround: true, pickingEnabled: false, minZoom: 10, maxZoom: 22,
                style: {fillColor:"rgba(255,0,0,0)",lineColor:"rgba(255,255,0,0.8)",lineWidth:2,strokeColor:"rgba(255,255,0,1)",strokeWidth:1.5}
            });
            window.globus.planet.addLayer(window.tileCubeLayer);
            console.log("DEBUG: tileCubeLayer added.");

            window.globus.planet.addControl(new og.control.ZoomControl());
            window.globus.planet.addControl(new og.control.EarthCoordinates());
            window.globus.planet.addControl(new og.control.KeyboardNavigation());
            console.log("DEBUG: Basic OpenGlobus controls added.");
            
            window.globus.planet.events.on("lclick", function (mouse) {
                if (currentInteractionMode === 'selectTiles' && window.globus.planet.getViewpoint().zoom >= TILE_SELECTION_ZOOM_FOR_DRAW -1) {
                    let coords = window.globus.planet.getLonLatFromPixelTerrain(mouse, true);
                    if (coords) {
                        let tileCoordsZL21 = og.mercator.getTileCoordinate(coords.lon, coords.lat, TILE_SELECTION_ZOOM_FOR_DRAW);
                        let ogTile = [tileCoordsZL21.zoom, tileCoordsZL21.x, tileCoordsZL21.y];
                        if (typeof toggleTileSelectionOL === "function") { toggleTileSelectionOL(ogTile, true); }
                    }
                }
            });
            console.log("DEBUG: Simplified OpenGlobus lclick listener attached.");

            setTimeout(() => {
                if (window.globus && window.globus.planet) {
                    const globusRgbTerrainInstance = new og.terrain.GlobusRgbTerrain({ url: "//{s}.terrain.openglobus.org/all/{z}/{x}/{y}.png", maxNativeZoom: 17 });
                    window.globus.planet.setTerrain(globusRgbTerrainInstance);
                    console.log("DEBUG: Attempted to set GlobusRgbTerrain after delay.");
                    if (window.globus.planet.renderer) { window.globus.planet.renderer.frame(); }
                }
            }, 1000);

            console.log("%cOpenGlobus initialization sequence completed (Simplified Version).", "color: green; font-weight: bold;");
            resolveOpenGlobusInitialized();

        } catch (error) {
            console.error("Error initializing OpenGlobus (Simplified Version):", error);
            rejectOpenGlobusInitialized(error);
        }
    });
}

// --- OpenLayers Map Initialization (Skeleton) ---
function initializeOpenLayersMap() {
    console.log("DEBUG: initializeOpenLayersMap function ENTERED (Skeleton).");
    return new Promise((resolve, reject) => { // Added reject
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error("OpenLayers map element 'map' not found!");
            return reject(new Error("OpenLayers map element 'map' not found!"));
        }
        try {
            // Minimal OpenLayers setup - replace with your actual full setup
            // window.olMap = new ol.Map({
            //     target: 'map',
            //     layers: [ new ol.layer.Tile({ source: new ol.source.OSM() }) ],
            //     view: new ol.View({ center: ol.proj.fromLonLat([-74.0445, 40.6892]), zoom: 10 })
            // });
            // window.selectionSource = new ol.source.Vector();
            // const selectionLayer = new ol.layer.Vector({ source: window.selectionSource });
            // window.olMap.addLayer(selectionLayer);
            console.warn("OpenLayers Map initialized (SUPER SKELETON - needs full implementation).");
            resolve();
        } catch (e) {
            console.error("Error in initializeOpenLayersMap skeleton:", e);
            reject(e);
        }
    });
}

// --- XR Panel Logic ---
function setupXRPanelLogic() {
    console.log("DEBUG: setupXRPanelLogic called.");
    setTimeout(() => {
        const xrIframe = document.getElementById('xr-iframe');
        const xrEngineSelector = document.getElementById('xr-engine-selector');
        console.log("%cDEBUG (deferred): xrIframe element:", "color: purple", xrIframe);
        console.log("%cDEBUG (deferred): xrEngineSelector element:", "color: purple", xrEngineSelector);

        if (xrEngineSelector && xrIframe) {
            xrEngineSelector.addEventListener('click', (event) => {
                if (event.target.classList.contains('xr-engine-btn')) {
                    const engineButtons = xrEngineSelector.querySelectorAll('.xr-engine-btn');
                    engineButtons.forEach(btn => btn.classList.remove('active'));
                    event.target.classList.add('active');

                    const engine = event.target.dataset.engine;
                    let targetUrl = '';
                    console.log(`XR Engine selected: ${engine}`);

                    switch (engine) {
                        case 'janusweb': targetUrl = '/packages/janusweb/build/1.5.42/index.html'; break;
                        case 'streetsgl': 
                            targetUrl = 'about:blank'; 
                            alert("Streets.gl is currently unavailable due to external tile server certificate issues.");
                            break;
                        case 'babylonjs': targetUrl = 'about:blank'; alert("BabylonJS view not yet implemented."); break;
                        case 'irengine': targetUrl = 'about:blank'; alert("IR-Engine view not yet implemented."); break;
                        default: console.error(`Unknown XR engine: ${engine}`); if(xrIframe) xrIframe.src='about:blank'; return;
                    }
                    if (targetUrl && xrIframe) { xrIframe.src = targetUrl; }
                }
            });
        } else {
            console.error("XR panel elements (xr-engine-selector or xr-iframe) not found (deferred).");
        }
    }, 0);
}

// --- UI Event Listeners (Skeleton) ---
function setupUIEventListeners() {
    console.log("DEBUG: setupUIEventListeners called (Skeleton - needs full implementation).");
    // Restore all your UI event listeners here (toolbar, panels, modals, etc.)
    // Example:
    // const mapViewBtn = document.getElementById('map-view-btn');
    // if (mapViewBtn) mapViewBtn.addEventListener('click', () => { /* ... */ });
    
    setupXRPanelLogic(); // XR panel logic is part of UI setup
}

// --- Main Application Initialization ---
function initializeApp() {
    console.log("DEBUG: initializeApp() called.");
    // Initialize OpenLayers Map first, then OpenGlobus
    initializeOpenLayersMap()
        .then(() => {
            console.log("DEBUG: OpenLayers Map promise resolved, now initializing OpenGlobus.");
            return initializeOpenGlobus();
        })
        .then(() => {
            console.log("DEBUG: Both OpenLayers Map and OpenGlobus initialized successfully.");
            setupUIEventListeners(); // Setup other UI interactions
            // Any other post-initialization logic
        })
        .catch(error => {
            console.error("FATAL: Error during application initialization chain:", error);
            // Display a user-friendly error message on the page if appropriate
            const body = document.querySelector('body');
            if (body) {
                body.innerHTML = `<div style="padding: 20px; text-align: center; background-color: #333; color: white; font-family: sans-serif;">
                                    <h1>Application Initialization Failed</h1>
                                    <p>A critical error occurred while starting the application. Please check the console for details.</p>
                                    <p>Error: ${error.message || 'Unknown error'}</p>
                                  </div>`;
            }
        });
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired. Starting application initialization.");
    initializeApp();
});

console.log("MAIN.JS SCRIPT EXECUTION FINISHED - VERY BOTTOM LINE");
