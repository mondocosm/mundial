// cosmicrete3d.js - Orchestration and interaction logic between Cosmicrete and the 3D (Babylon.js) scene.

// Import necessary modules or functions as needed
// import { getCosmicreteEditor } from './cosmicrete-editor.js';
import { getBabylonScene } from './babylon-scene.js'; // Need scene access
import { VideoTexture, StandardMaterial, Texture, Vector3 } from '@babylonjs/core'; // Import necessary Babylon classes
import { getPhysicsGliderObject } from './babylon-scene.js'; // Import getter for target object

console.log("Cosmicrete 3D bridge module loaded.");

// Example function (to be implemented later)
export function initializeCosmicrete3D() {
    console.log("Initializing Cosmicrete <-> 3D interactions...");
    // TODO: Setup listeners or mechanisms for nodes to affect the 3D scene
    // TODO: Setup mechanisms for the 3D scene to provide data to nodes
}

// Example: Function to be called by a Cosmicrete node to set object position
export function setObjectPositionFromNode(x, y, z) { // Removed objectId for now, assumes target is physicsGliderObject
    const scene = getBabylonScene();
    const targetObject = getPhysicsGliderObject(); // Get the main physics object

    if (!scene) {
        console.error("SetObjectPositionNode: Scene not available.");
        return;
    }
     if (!targetObject) {
        console.warn("SetObjectPositionNode: Target physics object not found.");
        return;
    }
    // Note: Input validation (x,y,z are numbers) happens in the node's data method

    const newPosition = new Vector3(x, y, z);

    if (targetObject.physicsImpostor) {
        // Use teleport for physics objects to avoid fighting the simulation
        console.log(`SetObjectPositionNode: Teleporting physics object '${targetObject.name}' to`, newPosition);
        // We might need to reset velocities as well after teleporting
        targetObject.physicsImpostor.setLinearVelocity(Vector3.Zero());
        targetObject.physicsImpostor.setAngularVelocity(Vector3.Zero());
        // Teleport takes position and optionally rotation quaternion
        targetObject.physicsImpostor.teleport(newPosition, targetObject.rotationQuaternion || undefined);
        // Ensure mesh position matches after teleport (sometimes needed)
        targetObject.position.copyFrom(newPosition);
    } else {
        // No physics, just set position directly
        targetObject.position = newPosition;
        console.log(`SetObjectPositionNode: Set position of non-physics object '${targetObject.name}' to`, newPosition);
    }
}



// --- Video Playback Bridge Functions ---

// Store video textures/elements managed by this bridge
const managedVideoPlayers = {}; // Key: meshName, Value: { videoElement, videoTexture, originalMaterial }

export function playVideoOnMesh(meshName, videoUrl) {
    const scene = getBabylonScene();
    if (!scene || !meshName || !videoUrl) {
        console.error("playVideoOnMesh: Missing scene, meshName, or videoUrl");
        return;
    }

    console.log(`Bridge: Attempting to play '${videoUrl}' on mesh '${meshName}'`);

    const targetMesh = scene.getMeshByName(meshName);
    if (!targetMesh) {
        console.error(`playVideoOnMesh: Mesh '${meshName}' not found.`);
        return;
    }

    // Check if already playing on this mesh
    if (managedVideoPlayers[meshName] && managedVideoPlayers[meshName].videoElement.src === videoUrl) {
        // If same video, just ensure it's playing
        managedVideoPlayers[meshName].videoElement.play().catch(e => console.error("Video play error:", e));
        console.log(`Resuming video on '${meshName}'`);
        return;
    }

    // If different video or no video, stop existing one first
    if (managedVideoPlayers[meshName]) {
        stopVideoOnMesh(meshName); // Clean up previous video on this mesh
    }

    // Create HTML Video Element (hidden)
    const videoElement = document.createElement('video');
    videoElement.id = `video-${meshName}`;
    videoElement.src = videoUrl;
    videoElement.crossOrigin = 'anonymous'; // Needed for textures from different origins
    videoElement.loop = true; // Optional: loop the video
    videoElement.preload = 'auto';
    videoElement.muted = true; // Mute to allow autoplay in most browsers
    videoElement.setAttribute('playsinline', ''); // Important for iOS
    // videoElement.style.display = 'none'; // Keep it hidden
    // document.body.appendChild(videoElement); // Append to body to ensure it's part of DOM

    // Create Video Texture
    const videoTexture = new VideoTexture(`videoTex-${meshName}`, videoElement, scene, true, true);
    videoTexture.vScale = -1; // Flip video vertically if needed

    // Create Material and apply texture
    const videoMaterial = new StandardMaterial(`videoMat-${meshName}`, scene);
    videoMaterial.diffuseTexture = videoTexture;
    videoMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // Make it emissive to see video clearly without external light

    // Store original material to restore later
    const originalMaterial = targetMesh.material;
    targetMesh.material = videoMaterial;

    // Store references
    managedVideoPlayers[meshName] = { videoElement, videoTexture, originalMaterial };

    // Attempt to play
    videoElement.play().then(() => {
        console.log(`Video playing on '${meshName}'`);
    }).catch(e => {
        console.error(`Video play error for '${meshName}':`, e);
        // Handle autoplay restrictions - might need user interaction to start
    });
}

export function pauseVideoOnMesh(meshName) {
    const scene = getBabylonScene();
     if (!scene || !meshName) {
        console.error("pauseVideoOnMesh: Missing scene or meshName");
        return;
    }
    console.log(`Bridge: Attempting to pause video on mesh '${meshName}'`);

    const playerInfo = managedVideoPlayers[meshName];
    if (playerInfo && playerInfo.videoElement) {
        playerInfo.videoElement.pause();
        console.log(`Video paused on '${meshName}'`);
    } else {
        console.warn(`pauseVideoOnMesh: No active video found for mesh '${meshName}'`);
    }
}

export function stopVideoOnMesh(meshName) {
     const scene = getBabylonScene();
     if (!scene || !meshName) {
        console.error("stopVideoOnMesh: Missing scene or meshName");
        return;
    }
    console.log(`Bridge: Attempting to stop video on mesh '${meshName}'`);

    const playerInfo = managedVideoPlayers[meshName];
    if (playerInfo) {
        if (playerInfo.videoElement) {
            playerInfo.videoElement.pause();
            // Optional: Remove video element from DOM if dynamically added
            // playerInfo.videoElement.remove();
        }
        if (playerInfo.videoTexture) {
            playerInfo.videoTexture.dispose();
        }
        // Restore original material if available
        const targetMesh = scene.getMeshByName(meshName);
        if (targetMesh && playerInfo.originalMaterial) {
            targetMesh.material = playerInfo.originalMaterial;
        } else if (targetMesh) {
            // Fallback: remove current material or set to default?
            // targetMesh.material = null; // Or a default scene material
        }

        delete managedVideoPlayers[meshName]; // Remove entry
        console.log(`Video stopped and resources cleaned for '${meshName}'`);
    } else {
        console.warn(`stopVideoOnMesh: No active video found for mesh '${meshName}'`);
    }
}

// --- End Video Playback Bridge Functions ---
// Add other bridge functions as needed...