# C3 XRUI Protocol (Command, Control, Communication Mixed Reality User Interface)

## 1. Introduction

### 1.1 Purpose
This document defines the core principles, patterns, and guidelines for the Command, Control, and Communication Mixed Reality User Interface (C3 XRUI) within the Mondocosm platform. The goal is to ensure consistent, intuitive, and effective interaction across all C3-related features, with a primary focus on Mixed Reality (MR), encompassing Augmented Reality (AR) and Virtual Reality (VR) environments.

### 1.2 Scope
This protocol applies primarily to XR user interfaces (VR/AR) and interactions involving:
- Issuing commands to the system or other entities (users, NPCs, agents) within an XR environment.
- Controlling objects, avatars, or system parameters using XR input methods.
- Communicating status, alerts, and messages spatially or via XR UI elements.
While some principles may apply to desktop/mobile, the focus is on XR.

### 1.3 Guiding Principles
- **Clarity:** Interactions should be unambiguous. Users must understand the commands they issue and the feedback they receive.
- **Efficiency:** C3 tasks should be achievable with minimal effort and cognitive load.
- **Consistency:** Similar actions should have similar interaction patterns across the platform.
- **Feedback:** The system must provide timely and informative feedback for all C3 actions.
- **Context-Awareness:** Interactions should adapt appropriately to the user's current context (e.g., device - VR/AR/Mobile/Desktop, physical location, virtual location, task).
- **Immersion:** UI elements and interactions should minimize disruption to the user's sense of presence in the XR environment.
- **Ergonomics:** Interactions, especially gestural ones, should be comfortable and minimize physical strain.

## 2. Command Input

### 2.1 Input Methods
- **Direct Manipulation (XR):** (e.g., Grabbing/moving virtual objects with controllers/hands, interacting with spatial UI panels) - *Define standards for affordances, hover states, grab points, haptic feedback, hit targets in 3D space.*
- **Ray/Pointer Input (XR):** (e.g., Pointing with controllers/gaze to select/activate) - *Define pointer visuals, target highlighting, activation methods (trigger press, dwell time).*
- **Gestural Input (XR):** (e.g., VR/AR hand tracking specific gestures like pinch, grab, point) - *Define standard gesture library, recognition tolerances, visual/haptic feedback.*
- **Voice Commands (XR):** (If applicable) - *Define activation methods suitable for XR, command structure, spatial audio feedback.*
- **Physical Input Mapping (XR):** (e.g., Mapping controller buttons/joysticks to commands) - *Define standard mappings.*
- **Textual Commands (XR):** (e.g., Virtual keyboard, voice-to-text in XR) - *Define efficient input methods and UI presentation.*
- **Node-Based Input (XR):** (Via Nodesque editor, potentially visualized spatially) - *Define how nodes trigger commands and represent C3 actions in XR.*

### 2.2 Command Structure & Syntax
- *Define standard formats for commands across different input methods.*
- *Specify parameter handling, optional arguments, etc.*

## 3. Control Mechanisms

### 3.1 Object Selection & Manipulation
- *Define standard methods for selecting single/multiple objects using XR inputs (raycasting, grabbing, volume selection).*
- *Specify controls for 6DoF translation, rotation, scaling using controllers/hands.*
- *Define visual indicators (outlines, bounding boxes, shaders) for selected/controlled objects in 3D space.*

### 3.2 Viewport & Camera Control
- *Define standard controls for locomotion (teleport, smooth movement) and camera manipulation (orbiting, zooming) specifically for VR/AR contexts.*

### 3.3 Parameter Adjustment
- *Define standard spatial UI elements (world-space or head-locked) for adjusting parameters (e.g., spatial sliders, radial menus, virtual panels with buttons/toggles).*

## 4. Visual Feedback

### 4.1 Action Confirmation
- *Define visual and potentially haptic/audio cues (e.g., controller vibration, spatial sound effect, highlighting, animations, temporary spatial icons) to confirm a command has been received or initiated in XR.*

### 4.2 Status Indicators
- *Define standard ways to display status in XR (e.g., spatial progress bars, status icons attached to objects or UI panels, changes in object appearance/color).*

### 4.3 Error & Alert Messaging
- *Define standard formats and placements for error messages, warnings, and critical alerts within the XR environment (e.g., head-up display messages, spatial panels, audio cues).*
- *Specify use of color, icons, text, and potentially spatial audio.*

### 4.4 Highlighting & Focus
- *Define how focus (hover) and selection are visually indicated for both spatial UI elements and 3D objects within the XR scene (e.g., highlighting, outlines, scaling changes).*

## 5. Communication Channels

### 5.1 System Messages & Notifications
- *Define types of system messages (e.g., info, success, warning, error).*
- *Specify delivery methods suitable for XR (e.g., spatial notifications, HUD messages, message panels anchored in the world or to the user).*
- *Define persistence, user dismissal methods (e.g., gaze-and-commit, hand gesture), and prioritization in XR.*

### 5.2 User-to-User Communication
- (If applicable within C3 context, e.g., sending commands/requests to other users)
- *Define integration with primary communication systems (e.g., Matrix/Element).*

### 5.3 Agent/NPC Communication
- *Define how users interact with and receive information from AI agents or NPCs.*

## 6. Standard Interaction Patterns

### 6.1 Command Invocation
- *Document common sequences for issuing commands using XR inputs (e.g., Point -> Trigger, Grab -> Action, Gesture -> Command).*

### 6.2 Context Menus
- *Define standards for accessing and structuring context-sensitive actions in XR (e.g., radial menus attached to controllers/hands, spatial context menus appearing near objects).*

### 6.3 Tool Activation & Modes
- *Define how users activate specific tools or enter different interaction modes in XR (e.g., selecting tools from a virtual palette, using specific controller buttons, performing gestures).*

## 7. Data Structures (Conceptual)

### 7.1 Command Representation
- *Outline the conceptual structure for representing commands internally (e.g., command ID, target(s), parameters).*

### 7.2 Status & Feedback Messages
- *Outline the conceptual structure for status updates and feedback messages.*

*(Note: Detailed technical specifications for data formats should reside in relevant backend/API documentation, but conceptual alignment is defined here.)*

## 8. Accessibility Considerations

- *Outline requirements specific to XR accessibility, such as adjustable UI scale/distance, alternative input mappings, haptic/audio feedback options, color blindness considerations, support for seated/standing modes, etc.*

## 9. Revision History

| Version | Date       | Author      | Changes                                      |
|---------|------------|-------------|----------------------------------------------|
| 0.1     | YYYY-MM-DD | [Your Name] | Initial draft creation.                      |
| 0.2     | 2025-04-04 | Roo         | Refocused protocol on C3 XRUI (Extended Reality) based on user feedback. Added XR-specific considerations throughout. |
| 0.3     | 2025-04-04 | Roo         | Clarified XRUI definition to "Mixed Reality User Interface" per user feedback. |