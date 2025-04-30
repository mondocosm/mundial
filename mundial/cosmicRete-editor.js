// cosmicRete-editor.js - CosmicRete (Rete.js fork) setup and node editor logic

import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin'; // Import AreaExtensions
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { GetMapCenterNode, SetObjectPositionNode, VideoPlaybackNode, DebugLogNode, InjectNode, GetObjectPositionNode, GetCurrentModeNode, SetCurrentModeNode, TranslateTextNode } from './cosmicRete-nodes.js'; // Import custom nodes (Updated filename)

let editor = null;
let area = null; // Make area accessible for toolbar actions

export async function initializeCosmicReteEditor(container) { // Renamed function
    if (editor) {
        console.warn("CosmicRete editor already initialized.");
        return editor;
    }
    if (!container) {
        console.error("CosmicRete editor container not found.");
        return null;
    }

    console.log("Initializing CosmicRete editor...");
    editor = new NodeEditor();
    area = new AreaPlugin(container); // Assign to the outer scope variable
    const connection = new ConnectionPlugin();

    // Add presets
    connection.addPreset(ConnectionPresets.classic.setup());

    editor.use(area);
    area.use(connection);

    // Simple example nodes (Keep for initial testing)
    const nodeA = new ClassicPreset.Node('Node A');
    nodeA.addControl('a', new ClassicPreset.InputControl('text', { initial: 'Hello' }));
    nodeA.addOutput('a', new ClassicPreset.Output(new ClassicPreset.Socket('socket')));
    await editor.addNode(nodeA);

    const nodeB = new ClassicPreset.Node('Node B');
    nodeB.addInput('b', new ClassicPreset.Input(new ClassicPreset.Socket('socket')));
    nodeB.addControl('b', new ClassicPreset.InputControl('text', { initial: 'World' }));
    await editor.addNode(nodeB);

    await area.translate(nodeA.id, { x: 100, y: 100 });
    await area.translate(nodeB.id, { x: 400, y: 100 });

    // Add connection example
    await editor.addConnection(new ClassicPreset.Connection(nodeA, 'a', nodeB, 'b'));

    // Zoom at origin
    AreaExtensions.zoomAt(area, editor.getNodes());

    // --- Toolbar Functionality ---
    // Get new UI elements
    const nodeSelect = document.getElementById('cosmicRete-node-select'); // Updated ID assumption
    const addSelectedNodeButton = document.getElementById('cosmicRete-add-selected-btn'); // Updated ID assumption
    const arrangeButton = document.getElementById('cosmicRete-arrange-btn'); // Updated ID assumption
    const triggerInjectButton = document.getElementById('cosmicRete-trigger-inject-btn'); // Added Inject Trigger button

    // Map node type names (from dropdown value) to their classes
    const nodeTypeMap = {
        GetMapCenterNode,
        SetObjectPositionNode,
        GetObjectPositionNode,
        VideoPlaybackNode,
        DebugLogNode,
        InjectNode,
        GetCurrentModeNode,
        SetCurrentModeNode,
        TranslateTextNode // Added TranslateTextNode
        // Add other imported node classes here (Ensure keys match option values in HTML)
    };

    if (addSelectedNodeButton && nodeSelect) {
        addSelectedNodeButton.addEventListener('click', async () => {
            if (!editor || !area) return;

            const selectedNodeTypeName = nodeSelect.value;
            const NodeTypeClass = nodeTypeMap[selectedNodeTypeName];

            if (!NodeTypeClass) {
                console.error(`Selected node type '${selectedNodeTypeName}' not found in map.`);
                return;
            }

            console.log(`Adding ${selectedNodeTypeName}...`);
            try {
                const newNode = new NodeTypeClass(); // Instantiate the selected node type
                await editor.addNode(newNode);
                // Place the new node near the center of the current view
                const { x, y } = area.area.pointer; // Get current pointer position in graph space
                await area.translate(newNode.id, { x: x || 200, y: y || 200 }); // Place near pointer or default
            } catch (error) {
                console.error(`Error adding ${selectedNodeTypeName} CosmicRete node:`, error);
            }
        });
    } else {
        console.warn("CosmicRete 'Add Selected Node' button or select dropdown not found.");
    }

    if (arrangeButton) { // Keep arrange functionality
        arrangeButton.addEventListener('click', async () => {
            if (!editor || !area) return;
            console.log("Arranging nodes...");
            try {
                await AreaExtensions.arrangeNodes(area, editor);
                await AreaExtensions.zoomAt(area, editor.getNodes()); // Re-zoom after arranging
            } catch (error) {
                console.error("Error arranging CosmicRete nodes:", error);
            }
        });
    } else {
        console.warn("CosmicRete 'Arrange' button not found.");
    }

    if (triggerInjectButton) {
        triggerInjectButton.addEventListener('click', () => {
            if (!editor) return;
            console.log("Triggering all Inject Nodes...");
            const allNodes = editor.getNodes();
            allNodes.forEach(node => {
                // Check if the node is an instance of InjectNode
                // Note: Direct instanceof check might be tricky depending on imports/bundling.
                // Checking the label or a custom property might be more robust if needed.
                if (node instanceof InjectNode) {
                    // Call the custom trigger method we defined on the node
                    node.triggerInject();
                    // Manually triggering the downstream processing might be needed here
                    // This depends heavily on the dataflow engine setup (e.g., rete-engine)
                    // which isn't fully implemented.
                    // Example: engine.process(node.id); // If using rete-engine
                }
            });
        });
    } else {
         console.warn("CosmicRete 'Trigger Inject' button not found.");
    }
    // --- End Toolbar Functionality ---


    // Make editor available globally for debugging (optional)
    window.cosmicReteEditor = editor; // Renamed global variable
    window.cosmicReteArea = area;     // Renamed global variable

    console.log("CosmicRete editor initialized.");
    return { editor, area }; // Keep internal return names for now unless specified
}

// Function to get the editor instance
export function getCosmicReteEditor() { // Renamed function
    return editor;
}