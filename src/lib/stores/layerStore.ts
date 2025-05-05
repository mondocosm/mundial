import { writable } from 'svelte/store';

export interface Tileset {
  groupId: string;
  name: string;
  // Add other properties like tile count, visibility, etc. later if needed
}

export interface UserLayer {
  layerId: string; // Unique ID for the layer
  name: string;
  isVisible: boolean;
  isPrivate: boolean;
  tilesets: Tileset[]; // Array to hold tileset info
}

// Initialize with default Layer 0
const initialLayers: UserLayer[] = [
  {
    layerId: 'layer-0',
    name: 'Layer 0',
    isVisible: true,
    isPrivate: false, // Default public
    tilesets: []
  }
];

// Writable store for the layers array
export const userLayersStore = writable<UserLayer[]>(initialLayers);

// Writable store for the currently selected layer ID
export const selectedLayerIdStore = writable<string | null>('layer-0'); // Default to Layer 0 selected

// --- Store Helper Functions ---

// Function to add a new layer
let nextLayerIdCounter = 1; // Start counter at 1 since Layer 0 exists
export function addLayer(name?: string) {
  const newLayerName = name || `Layer ${nextLayerIdCounter}`;
  const newLayerId = `layer-${nextLayerIdCounter++}`;
  const newLayer: UserLayer = {
    layerId: newLayerId,
    name: newLayerName,
    isVisible: true,
    isPrivate: false,
    tilesets: []
  };
  userLayersStore.update(layers => [...layers, newLayer]);
  selectedLayerIdStore.set(newLayerId); // Select the newly created layer
}

// Function to add a tileset to a specific layer
export function addTilesetToLayer(layerId: string, tileset: Tileset) {
  userLayersStore.update(layers => {
    return layers.map(layer => {
      if (layer.layerId === layerId) {
        // Avoid adding duplicate group IDs if somehow triggered twice
        if (!layer.tilesets.some(ts => ts.groupId === tileset.groupId)) {
           console.log(`Store: Adding tileset ${tileset.groupId} (${tileset.name}) to layer ${layerId}`);
           return { ...layer, tilesets: [...layer.tilesets, tileset] };
        } else {
           console.warn(`Store: Tileset ${tileset.groupId} already exists in layer ${layerId}. Skipping add.`);
        }
      }
      return layer;
    });
  });
}

// TODO: Add functions for deleting layers, renaming layers, deleting tilesets, etc.