// mundial/cosmicRete-nodes.js - Custom CosmicRete (Rete.js fork) nodes for Mundial

import { ClassicPreset, Control } from 'rete'; // Import Control
import { getMap } from './map.js'; // To access map functions
import { proj } from 'ol/proj'; // Import proj directly if needed
import { Vector3 } from '@babylonjs/core'; // Import Babylon Vector3
import { getPhysicsGliderObject } from './babylon-scene.js'; // Import getter for target object
import { getCurrentViewMode, setCurrentViewMode } from './state.js'; // Import state functions
import { getCurrentViewMode } from './state.js'; // Import state function
import { playVideoOnMesh, pauseVideoOnMesh, stopVideoOnMesh } from './cosmicRete3d.js'; // Import bridge functions (Updated filename)

// --- Get Map Center Node ---

// Define a custom socket type for coordinates (e.g., [lon, lat])
// Using a generic 'any' socket for simplicity now, can refine later
const coordinateSocket = new ClassicPreset.Socket('Coordinate');

const numberSocket = new ClassicPreset.Socket('Number');

const stringSocket = new ClassicPreset.Socket('String');
const booleanSocket = new ClassicPreset.Socket('Boolean');
const triggerSocket = new ClassicPreset.Socket('Trigger'); // For play/pause actions

const anySocket = new ClassicPreset.Socket('Any'); // Generic socket for any data type


// --- Custom Button Control ---
// Basic implementation - rendering might need framework-specific integration later
class ButtonControl extends Control {
    constructor(label, onClick) {
        super(); // Call parent constructor if needed (might depend on Rete version/plugins)
        this.label = label;
        this.onClick = onClick; // Callback function when button is clicked
    }
    // Rete typically needs methods to get/set value, but for a button,
    // we might just need the click handler. The rendering part is usually
    // handled by a rendering plugin (like rete-react-plugin, rete-vue-plugin).
    // Since we don't have one set up, this control won't render visually yet
    // without further integration work in the editor setup.
    // We store the onClick handler to be called by the node.
}

export class GetMapCenterNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Get Map Center' }) {
        super(initial.label || 'Get Map Center');

        // Define an output socket named 'coords' that uses our coordinateSocket
        const out = new ClassicPreset.Output(coordinateSocket, 'Center Coords');
        this.addOutput('coords', out);

        // Add a read-only control to display the current center (optional)
        this.addControl('display', new ClassicPreset.InputControl('text', { initial: 'N/A', readonly: true }));
    }

    // This method is called by the CosmicRete engine to compute the node's output
    // For a simple data source node like this, we might not need complex execution logic,
    // but we can update the display control here.
    async data(inputs) {
        const map = getMap();
        let centerCoordsText = 'N/A';
        let centerCoordsLonLat = null;

        if (map) {
            try {
                const view = map.getView();
                const center = view.getCenter(); // Gets center in map projection (e.g., EPSG:3857)
                if (center) {
                    // Convert to LonLat (EPSG:4326) for output and display
                    centerCoordsLonLat = proj.toLonLat(center);
                    centerCoordsText = `Lon: ${centerCoordsLonLat[0].toFixed(4)}, Lat: ${centerCoordsLonLat[1].toFixed(4)}`;
                }
            } catch (error) {
                console.error("Error getting map center:", error);
                centerCoordsText = 'Error';
            }
        }

        // Update the display control
        const displayControl = this.controls['display'];
        if (displayControl instanceof ClassicPreset.InputControl) {
             displayControl.setValue(centerCoordsText);
             // Force area update if control value changes visually
             // This might require access to the AreaPlugin instance if not automatic
             // window.reteArea?.update('control', displayControl.id); // Example if needed
        }


        // The actual output value for the 'coords' socket
        return {
            coords: centerCoordsLonLat // Output LonLat array [lon, lat] or null
        };
    }
}



// --- Set Object Position Node ---

export class SetObjectPositionNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Set Object Position' }) {
        super(initial.label || 'Set Object Position');

        // Define input sockets for coordinates
        const inputX = new ClassicPreset.Input(numberSocket, 'X');
        const inputY = new ClassicPreset.Input(numberSocket, 'Y');
        const inputZ = new ClassicPreset.Input(numberSocket, 'Z');

        // Add controls for direct input (optional, but useful)
        inputX.addControl(new ClassicPreset.InputControl('number', { initial: 0 }));
        inputY.addControl(new ClassicPreset.InputControl('number', { initial: 5 })); // Default Y higher
        inputZ.addControl(new ClassicPreset.InputControl('number', { initial: 0 }));

        this.addInput('x', inputX);
        this.addInput('y', inputY);
        this.addInput('z', inputZ);

        // No output needed for this action node
    }

    // This method is called by the CosmicRete engine when inputs change
    async data(inputs) {
        const targetObject = getPhysicsGliderObject();
        if (!targetObject) {
            console.warn("SetObjectPositionNode: Target object not found.");
            return;
        }

        // Get coordinates from inputs (use control value if socket not connected)
        const x = (inputs.x && inputs.x[0] !== undefined) ? inputs.x[0] : this.inputs.x?.control?.value ?? 0;
        const y = (inputs.y && inputs.y[0] !== undefined) ? inputs.y[0] : this.inputs.y?.control?.value ?? 0;
        const z = (inputs.z && inputs.z[0] !== undefined) ? inputs.z[0] : this.inputs.z?.control?.value ?? 0;

        // Validate inputs
        if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
            console.warn("SetObjectPositionNode: Invalid input coordinates.");
            return;
        }

        const newPosition = new Vector3(x, y, z);

        // Update position - Handle physics impostor carefully
        if (targetObject.physicsImpostor) {
            // Direct position setting fights physics. Teleporting is better if needed.
            // For now, let's just log and maybe disable physics temporarily?
            console.log(`SetObjectPositionNode: Attempting to set position of physics object '${targetObject.name}' to`, newPosition);
            // Option 1: Teleport (if available and desired)
            // targetObject.physicsImpostor.teleport(newPosition, targetObject.rotationQuaternion || undefined);

            // Option 2: Disable physics, move, re-enable (can be glitchy)
            // targetObject.physicsImpostor.dispose();
            // targetObject.position = newPosition;
            // Recreate impostor - complex

            // Option 3: Just set position directly (will likely be overridden by physics immediately)
             targetObject.position = newPosition;

        } else {
            // No physics, just set position
            targetObject.position = newPosition;
            console.log(`SetObjectPositionNode: Set position of non-physics object '${targetObject.name}' to`, newPosition);
        }

        // Action nodes typically don't return data for outputs
        return {};
    }
}


// --- Video Playback Node (Bino Inspired) ---

export class VideoPlaybackNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Video Player' }) {
        super(initial.label || 'Video Player');

        // Define inputs
        const videoUrlInput = new ClassicPreset.Input(stringSocket, 'Video URL');
        const targetMeshInput = new ClassicPreset.Input(stringSocket, 'Target Mesh Name');
        const playInput = new ClassicPreset.Input(triggerSocket, 'Play'); // Use trigger for action
        const pauseInput = new ClassicPreset.Input(triggerSocket, 'Pause'); // Use trigger for action

        // Add controls for direct input
        videoUrlInput.addControl(new ClassicPreset.InputControl('text', { initial: '' }));
        targetMeshInput.addControl(new ClassicPreset.InputControl('text', { initial: 'tardisBox' })); // Default to the TARDIS

        this.addInput('url', videoUrlInput);
        this.addInput('target', targetMeshInput);
        this.addInput('play', playInput);
        this.addInput('pause', pauseInput);

        // Could add outputs for status (e.g., 'isPlaying', 'currentTime') later
    }

    // This method is called by the CosmicRete engine when inputs change or triggers fire
    async data(inputs) {
        const videoUrl = (inputs.url && inputs.url[0] !== undefined) ? inputs.url[0] : this.inputs.url?.control?.value ?? '';
        const targetMeshName = (inputs.target && inputs.target[0] !== undefined) ? inputs.target[0] : this.inputs.target?.control?.value ?? 'tardisBox';

        // Check for triggers (Play/Pause)
        // Note: Rete trigger handling might need specific setup depending on connection plugin
        // For now, just log the intent based on input presence (a simple proxy)
        const shouldPlay = inputs.play?.length > 0; // Check if play input is connected/triggered
        const shouldPause = inputs.pause?.length > 0; // Check if pause input is connected/triggered

        console.log(`VideoPlaybackNode: URL='${videoUrl}', Target='${targetMeshName}', PlayTriggered=${shouldPlay}, PauseTriggered=${shouldPause}`);

        // Call bridge functions based on triggers
        if (shouldPlay) {
            playVideoOnMesh(targetMeshName, videoUrl);
        }
        if (shouldPause) {
            pauseVideoOnMesh(targetMeshName);
        }
        // TODO: Add a 'Stop' trigger input and call stopVideoOnMesh if needed

        return {}; // Action node
    }
}


// --- Debug Log Node (Node-RED Inspired) ---

export class DebugLogNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Debug Log' }) {
        super(initial.label || 'Debug Log');

        // Define a generic input socket
        const input = new ClassicPreset.Input(anySocket, 'Input');
        this.addInput('input', input);

        // Add a control to display the last logged value (optional)
        this.addControl('display', new ClassicPreset.InputControl('text', { initial: '(No input yet)', readonly: true }));
    }

    // This method is called by the CosmicRete engine when the input changes
    async data(inputs) {
        const inputValue = inputs.input ? inputs.input[0] : undefined;

        console.log('--- CosmicRete Debug Log ---');
        console.log(inputValue);
        console.log('----------------------------');

        // Update display control
        const displayControl = this.controls['display'];
        if (displayControl instanceof ClassicPreset.InputControl) {
            try {
                // Attempt to stringify for display, handle complex objects/errors
                const displayValue = JSON.stringify(inputValue, null, 2) ?? '(undefined)';
                 // Limit display length if needed
                 const maxLength = 50;
                 displayControl.setValue(displayValue.length > maxLength ? displayValue.substring(0, maxLength) + '...' : displayValue);
            } catch (e) {
                displayControl.setValue('(Cannot display)');
            }
        }

        // This node doesn't produce output, it's a sink
        return {};
    }
    
// Removed incorrectly placed ButtonControl definition from inside DebugLogNode
}


// --- Inject Node (Node-RED Inspired) ---

export class InjectNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Inject' }) {
        super(initial.label || 'Inject');

        // Define an output socket
        const out = new ClassicPreset.Output(anySocket, 'Output');
        this.addOutput('output', out);

        // Use the custom ButtonControl
        // The onClick handler will call the node's triggerInject method
        this.addControl('trigger', new ButtonControl('Inject Now', () => this.triggerInject())); // Uses ButtonControl defined above

        // Store the value to inject (e.g., timestamp)
        this.payload = Date.now();
    }

    // This data method defines WHAT to output, but isn't triggered by the control yet.
    // Triggering logic needs to be added separately, likely in the editor/UI layer.
    async data(inputs) {
        // Update payload just before potential emission
        this.payload = Date.now();
        console.log("InjectNode data called - Payload:", this.payload);
        return {
            output: this.payload
        };
    }

    // We might need a method like this to be called by the button click handler later
    triggerInject() {
        this.payload = Date.now();
        console.log("InjectNode triggered! Payload:", this.payload);
        // How to force emission? This depends on the engine/plugin setup.
        // Might need to manually trigger downstream node processing.
        // For now, just update the payload.
        // We might need access to the editor's dataflow engine here.
    }
}


// --- Get Object Position Node ---

export class GetObjectPositionNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Get Object Position' }) {
        super(initial.label || 'Get Object Position');

        // Define output sockets for coordinates
        const outX = new ClassicPreset.Output(numberSocket, 'X');
        const outY = new ClassicPreset.Output(numberSocket, 'Y');
        const outZ = new ClassicPreset.Output(numberSocket, 'Z');

        this.addOutput('x', outX);
        this.addOutput('y', outY);
        this.addOutput('z', outZ);

        // Add controls to display current position (optional)
        this.addControl('displayX', new ClassicPreset.InputControl('text', { initial: 'N/A', readonly: true }));
        this.addControl('displayY', new ClassicPreset.InputControl('text', { initial: 'N/A', readonly: true }));
        this.addControl('displayZ', new ClassicPreset.InputControl('text', { initial: 'N/A', readonly: true }));

        // No inputs needed for this data source node
    }

    // This method is called by the CosmicRete engine to compute the node's output
    async data(inputs) {
        const targetObject = getPhysicsGliderObject();
        let posX = 0, posY = 0, posZ = 0;

        if (targetObject) {
            posX = targetObject.position.x;
            posY = targetObject.position.y;
            posZ = targetObject.position.z;
        } else {
            console.warn("GetObjectPositionNode: Target object not found.");
        }

        // Update display controls (optional)
        const displayXControl = this.controls['displayX'];
        const displayYControl = this.controls['displayY'];
        const displayZControl = this.controls['displayZ'];
        if (displayXControl instanceof ClassicPreset.InputControl) {
            displayXControl.setValue(posX.toFixed(2));
        }
        if (displayYControl instanceof ClassicPreset.InputControl) {
            displayYControl.setValue(posY.toFixed(2));
        }
        if (displayZControl instanceof ClassicPreset.InputControl) {
            displayZControl.setValue(posZ.toFixed(2));
        }

        // Return the position components on separate outputs
        return {
            x: posX,
            y: posY,
            z: posZ
        };
    }
}


// --- Get Current Mode Node ---

export class GetCurrentModeNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Get Current Mode' }) {
        super(initial.label || 'Get Current Mode');

        // Define an output socket for the mode string
        const out = new ClassicPreset.Output(stringSocket, 'Mode');
        this.addOutput('mode', out);

        // Add a control to display the current mode (optional)
        this.addControl('display', new ClassicPreset.InputControl('text', { initial: 'N/A', readonly: true }));

        // No inputs needed
    }

    // This method is called by the CosmicRete engine to compute the node's output
    async data(inputs) {
        const currentMode = getCurrentViewMode();

        // Update display control (optional)
        const displayControl = this.controls['display'];
        if (displayControl instanceof ClassicPreset.InputControl) {
            displayControl.setValue(currentMode);
        }

        // Return the current mode string
        return {
            mode: currentMode
        };
    }
}


// --- Set Current Mode Node ---

export class SetCurrentModeNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Set Current Mode' }) {
        super(initial.label || 'Set Current Mode');

        // Define an input socket for the mode string
        const input = new ClassicPreset.Input(stringSocket, 'Mode');
        // Add control for direct input
        input.addControl(new ClassicPreset.InputControl('text', { initial: 'map' }));
        this.addInput('mode', input);

        // No output needed for this action node
    }

    // This method is called by the CosmicRete engine when the input changes
    async data(inputs) {
        // Get mode from input socket or control
        const targetMode = (inputs.mode && inputs.mode[0] !== undefined) ? inputs.mode[0] : this.inputs.mode?.control?.value ?? 'map';

        // Validate (basic check)
        if (typeof targetMode === 'string' && ['map', 'globe', 'babylon', 'itowns'].includes(targetMode)) {
            // Call the state function to attempt to set the mode
            // Note: The actual view switching logic is likely in main.js or ui.js
            // This node just updates the central state.
            setCurrentViewMode(targetMode);
            console.log(`SetCurrentModeNode: Attempted to set mode to '${targetMode}'`);
        } else {
            console.warn(`SetCurrentModeNode: Invalid target mode received: ${targetMode}`);
        }

        return {}; // Action node
    }
}
// --- TODO: Add more custom nodes ---
// - ToggleLayerVisibilityNode (Input: Layer ID/Name, Action Trigger?)
// - GetZoomLevelNode
// - SetCenterNode (Input: Coordinates)


// --- Translate Text Node (WasmEdge Backend) ---

export class TranslateTextNode extends ClassicPreset.Node {
    constructor(initial = { label: 'Translate Text' }) {
        super(initial.label || 'Translate Text');

        // Define inputs
        const textInput = new ClassicPreset.Input(stringSocket, 'Text');
        const langInput = new ClassicPreset.Input(stringSocket, 'Target Language');

        // Add controls for direct input
        textInput.addControl(new ClassicPreset.InputControl('text', { initial: 'Hello' }));
        langInput.addControl(new ClassicPreset.InputControl('text', { initial: 'es' })); // Default to Spanish

        this.addInput('text', textInput);
        this.addInput('lang', langInput);

        // Define output
        const out = new ClassicPreset.Output(stringSocket, 'Translated Text');
        this.addOutput('translated', out);

        // Add control to display result (optional)
        this.addControl('display', new ClassicPreset.InputControl('text', { initial: '', readonly: true }));
    }

    // This method is called by the CosmicRete engine when inputs change
    async data(inputs) {
        const inputText = (inputs.text && inputs.text[0] !== undefined) ? inputs.text[0] : this.inputs.text?.control?.value ?? '';
        const targetLang = (inputs.lang && inputs.lang[0] !== undefined) ? inputs.lang[0] : this.inputs.lang?.control?.value ?? 'es';

        let translatedText = '(Error)'; // Default error value

        if (inputText && targetLang) {
            try {
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: inputText, targetLanguage: targetLang }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (result.success && result.translatedText) {
                    translatedText = result.translatedText;
                } else {
                    console.error('Translation API did not return success or text:', result);
                    translatedText = `(API Error: ${result.error || 'Unknown'})`;
                }
            } catch (error) {
                console.error('Error calling translation API:', error);
                translatedText = `(Fetch Error: ${error.message})`;
            }
        } else {
            translatedText = '(Missing Input)';
        }

        // Update display control
        const displayControl = this.controls['display'];
        if (displayControl instanceof ClassicPreset.InputControl) {
            displayControl.setValue(translatedText);
        }

        // Return the translated text
        return {
            translated: translatedText
        };
    }
}
// - AddMarkerNode (Input: Coordinates, Label?)