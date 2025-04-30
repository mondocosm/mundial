// Ensure OpenGlobus (og) is loaded globally from the script tag
if (typeof og === 'undefined') {
    console.error("OpenGlobus library (og) not loaded. Check script tag in index.html.");
} else {

    // Define a custom layer using CanvasTiles
    class GridCanvasTiles extends og.layer.CanvasTiles {
        constructor(name, options) {
            super(name, options);
            this.minZoom = options.minZoom || 16; // Only show grid at higher zoom levels
            this.maxZoom = options.maxZoom || 21;
        }

        drawTile(material, applyTexture) {
            const canvas = this.createCanvas(material.segment.tileZoom); // Use internal method
            const ctx = canvas.getContext('2d');
            const size = canvas.width; // Assuming square tiles

            // Clear canvas (optional, good practice)
            ctx.clearRect(0, 0, size, size);

            // Draw simple grid lines (center horizontal and vertical)
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; // Red grid lines
            ctx.lineWidth = 1; // Adjust line width as needed

            // Center vertical line
            ctx.beginPath();
            ctx.moveTo(size / 2, 0);
            ctx.lineTo(size / 2, size);
            ctx.stroke();

            // Center horizontal line
            ctx.beginPath();
            ctx.moveTo(0, size / 2);
            ctx.lineTo(size, size / 2);
            ctx.stroke();

            // Optionally draw tile coordinates for debugging
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = '10px Arial';
            ctx.fillText(`Z:${material.segment.tileZoom}`, 5, 15);
            ctx.fillText(`X:${material.segment.tileX}`, 5, 30);
            ctx.fillText(`Y:${material.segment.tileY}`, 5, 45);


            // Apply the drawn canvas as a texture
            applyTexture(canvas);
        }
    }

    // Initialize the Globe
    const globus = new og.Globe({
        target: "globus",
        name: "OpenGlobus Grid Example",
        // Specify the path to OpenGlobus resources relative to the server root
        resourcesSrc: "/packages/openglobus/res",
        // Use a standard base layer like OpenStreetMap
        layers: [
            new og.layer.XYZ("OpenStreetMap", {
                isBaseLayer: true,
                url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                visibility: true,
                attribution: 'Data @ OpenStreetMap contributors, ODbL'
            })
        ],
        // Use GlobusTerrain provider (uses openglobus.org tiles)
        terrain: new og.terrain.GlobusTerrain(),
        // Optional: Set initial view
        viewExtent: [ -180, -90, 180, 90 ] // Full globe view initially
    });

    // Create and add the custom grid layer
    const gridLayer = new GridCanvasTiles("Grid Layer", {
        minZoom: 16, // Start showing grid at zoom level 16
        maxZoom: 21,
        visibility: true
    });

    globus.planet.addLayer(gridLayer);

    console.log("OpenGlobus initialized with CanvasTiles grid layer.");

    // Optional: Add controls
    globus.planet.addControl(new og.control.ZoomControl());
    globus.planet.addControl(new og.control.LayerSwitcher());
    // globus.planet.addControl(new og.control.KeyboardNavigation()); // Requires focus

}