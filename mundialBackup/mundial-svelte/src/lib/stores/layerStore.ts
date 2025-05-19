import { writable, get } from 'svelte/store'; // Import get
import Map from 'ol/Map.js'; // Use regular import
import VectorSource from 'ol/source/Vector.js'; // Use regular import
import Feature from 'ol/Feature.js'; // Use regular import
import Polygon from 'ol/geom/Polygon.js'; // Use regular import
import { createEmpty, extend, type Extent } from 'ol/extent.js';

// --- Interfaces ---
export interface Tileset {
  groupId: string;
  name: string;
  // We could store feature IDs or extent here later if needed
}

export interface UserLayer {
  layerId: string;
  name: string;
  isVisible: boolean;
  isPrivate: boolean;
  tilesets: Tileset[];
  // Store the actual OpenLayers source associated with this layer
  // Note: Storing complex objects like OL sources in stores can sometimes be tricky,
  // but let's try it for simplicity. Ensure it's not mutated directly outside store functions.
  olSource: VectorSource<Feature<Polygon>>;
}

// --- Stores ---

// Initialize with default Layer 0, including an OL source
const defaultLayer0Source = new VectorSource<Feature<Polygon>>();
const initialLayers: UserLayer[] = [
  {
    layerId: 'layer-0',
    name: 'Layer 0',
    isVisible: true,
    isPrivate: false,
    tilesets: [],
    olSource: defaultLayer0Source
  }
];

export const userLayersStore = writable<UserLayer[]>(initialLayers);
export const selectedLayerIdStore = writable<string | null>('layer-0');
export const mapInstanceStore = writable<Map | null>(null); // Store for the map instance

// --- Store Helper Functions ---

let nextLayerIdCounter = 1; // Start counter at 1
export function addLayer(name?: string) {
  const newLayerName = name || `Layer ${nextLayerIdCounter}`;
  const newLayerId = `layer-${nextLayerIdCounter++}`;
  const newSource = new VectorSource<Feature<Polygon>>(); // Create a new source for the layer
  const newLayer: UserLayer = {
    layerId: newLayerId,
    name: newLayerName,
    isVisible: true,
    isPrivate: false,
    tilesets: [],
    olSource: newSource // Assign the new source
  };
  userLayersStore.update(layers => [...layers, newLayer]);
  selectedLayerIdStore.set(newLayerId);
  // TODO: Need to add the corresponding VectorLayer to the actual Map instance
  // This might require accessing the map instance here or dispatching another event/action
  console.warn("Store: New layer added, but corresponding OL layer needs to be added to the map!");
}

// Adds tileset metadata to the correct layer in the store
export function addTilesetToLayer(layerId: string, tileset: Tileset) {
  userLayersStore.update(layers => {
    return layers.map(layer => {
      if (layer.layerId === layerId) {
        if (!layer.tilesets.some(ts => ts.groupId === tileset.groupId)) {
          console.log(`Store: Adding tileset metadata ${tileset.groupId} (${tileset.name}) to layer ${layerId}`);
          return { ...layer, tilesets: [...layer.tilesets, tileset] };
        } else {
          console.warn(`Store: Tileset metadata ${tileset.groupId} already exists in layer ${layerId}. Skipping add.`);
        }
      }
      return layer;
    });
  });
}

// Function to zoom the map to a specific tileset group
export function zoomToTilesetGroup(groupId: string) {
    const map = get(mapInstanceStore); // Use get() for non-reactive access
    const layers = get(userLayersStore); // Use get() for non-reactive access

    if (!map) {
        console.error("Zoom failed: Map instance not found in store.");
        return;
    }
    if (!layers || layers.length === 0) {
        console.error("Zoom failed: Layers not found in store.");
        return;
    }

    console.log(`Store: Attempting to zoom to tileset group: ${groupId}`);

    let targetFeatures: Feature<Polygon>[] = [];
    let foundLayer: UserLayer | null = null;

    // Find all features with the matching groupId across all layer sources
    for (const layer of layers) {
        if (layer.olSource) {
            const featuresInSource = layer.olSource.getFeatures();
            // Add explicit type for 'f' parameter
            const matchingFeatures = featuresInSource.filter((f: Feature<Polygon>) => f.get('tilesetGroupId') === groupId);
            if (matchingFeatures.length > 0) {
                targetFeatures = targetFeatures.concat(matchingFeatures);
                foundLayer = layer; // Store the layer where features were found
                // break; // Assuming groupId is unique across layers, we can stop searching
                       // Let's not assume uniqueness for now, collect all features
            }
        } else {
             console.warn(`Layer ${layer.name} has no olSource.`);
        }
    }


    if (targetFeatures.length > 0) {
        console.log(`Store: Found ${targetFeatures.length} features for group ${groupId} in layer ${foundLayer?.name}`);
        const extent = createEmpty();
        targetFeatures.forEach(feature => {
            const geom = feature.getGeometry();
            if (geom) {
                extend(extent, geom.getExtent());
            }
        });

        if (extent[0] === Infinity) {
             console.error("Zoom failed: Could not calculate valid extent for features.");
             return;
        }

        console.log(`Store: Calculated extent for group ${groupId}:`, extent);
        map.getView().fit(extent, {
            padding: [50, 50, 50, 50], // Add padding around the extent
            duration: 1000, // Animation duration in ms
            maxZoom: 21 // Optional: prevent zooming in too far
        });
    } else {
        console.warn(`Zoom failed: No features found for tileset group ID: ${groupId}`);
        alert(`Could not find tileset group "${groupId}" on the map.`);
    }
}

// TODO: Functions for delete, rename, toggle visibility (needs map interaction)