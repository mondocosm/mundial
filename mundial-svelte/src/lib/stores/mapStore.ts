import { writable } from 'svelte/store';
import type Map from 'ol/Map'; // Import OpenLayers Map type
import type { Globe } from '@openglobus/og'; // Import OpenGlobus Globe type

// Create writable stores, initially null
export const olMapInstance = writable<Map | null>(null);
export const globusInstance = writable<Globe | null>(null);

// Optional: Add types for layers if needed later
// export interface LayerConfig {
//   id: string;
//   name: string;
//   type: 'osm' | 'xyz' | 'vector'; // etc.
//   visible: boolean;
//   opacity: number;
// }
// export const mapLayers = writable<LayerConfig[]>([]);