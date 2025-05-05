import { writable } from 'svelte/store';

export type InteractionMode = 'pan' | 'select';

// Store for the current map interaction mode
export const interactionMode = writable<InteractionMode>('pan'); // Default to 'pan'

// Function to toggle the mode
export function toggleInteractionMode() {
  interactionMode.update(currentMode => {
    const newMode = currentMode === 'pan' ? 'select' : 'pan';
    console.log("Interaction Mode Toggled To:", newMode); // Keep log for debugging
    return newMode;
  });
}

// TODO: Add other shared UI states if needed (e.g., selected layer ID)