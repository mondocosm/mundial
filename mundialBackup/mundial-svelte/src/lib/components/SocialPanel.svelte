<!-- mundial-svelte/src/lib/components/SocialPanel.svelte -->
<script lang="ts">
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action

  export let id = "social-panel";
  export let visible = false; // Start hidden

  // TODO: Add Gun.js logic for chat and auth
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="view-panel" use:draggable={{ handle: '.panel-header' }}>
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4>Social Feed</h4>
    <button class="maximize-btn" title="Maximize/Restore">□</button>
    <button class="minimize-btn" title="Minimize/Expand">-</button>
  </div>
  <div class="panel-content">
    <!-- Gun.js Chat Interface -->
    <div id="chat-messages" class="chat-messages">
      <!-- Messages will appear here -->
      <p style="color: #888;">Chat not connected...</p>
    </div>
    <div class="chat-input-area">
      <input type="text" id="chat-input" placeholder="Type message..." class="chat-input">
      <button id="send-message-btn" class="send-button">Send</button>
    </div>

    <!-- User Authentication (Simplified) -->
    <div id="auth-section" class="auth-section">
      <input type="text" id="username-input" placeholder="Username" class="auth-input">
      <input type="password" id="password-input" placeholder="Password" class="auth-input">
      <div class="auth-buttons">
          <button id="signup-btn" class="auth-button">Sign Up</button>
          <button id="login-btn" class="auth-button">Log In</button>
      </div>
      <button id="logout-btn" class="auth-button logout-button" style="display: none;">Log Out</button>
      <div id="auth-status" class="auth-status">Status: Not logged in</div>
    </div>
  </div>
</div>
{/if}

<style>
  /* Scoped styles for Social Panel */
  .view-panel {
    position: absolute;
    top: 100px; /* Example position, adjust as needed */
    right: 10px;
    width: 300px;
    max-height: calc(100vh - 120px);
    background: rgba(40, 40, 40, 0.9); /* Slightly different background */
    border: 1px solid #555;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    box-sizing: border-box;
    z-index: 995; /* Below layers panel, above map/globe */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    resize: both;
  }

  .panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 10px; background-color: rgba(50, 50, 50, 0.95);
    border-bottom: 1px solid #555; cursor: move; height: 30px;
    box-sizing: border-box; flex-shrink: 0;
  }
  .panel-header h4 { margin: 0; font-weight: bold; flex-grow: 1; font-size: 0.9em; }
  .panel-header button {
     font-size: 14px; font-weight: bold; padding: 0 6px; margin-left: 5px;
     flex-shrink: 0; background-color: #555; color: #eee;
     border: 1px solid #777; border-radius: 3px; cursor: pointer;
  }
  .panel-header button:hover { background-color: #666; }

  .panel-content {
    padding: 10px;
    overflow-y: auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .chat-messages {
    height: 200px; /* Fixed height for chat */
    overflow-y: scroll;
    border: 1px solid #555;
    margin-bottom: 10px;
    padding: 5px;
    background: #333;
    flex-shrink: 0; /* Prevent shrinking */
  }

  .chat-input-area {
    display: flex;
    margin-bottom: 15px;
    flex-shrink: 0;
  }

  .chat-input {
    flex-grow: 1;
    margin-right: 5px;
    padding: 6px;
    background-color: #444; color: #eee; border: 1px solid #666; border-radius: 3px;
  }
  .chat-input::placeholder { color: #aaa; }

  .send-button {
    padding: 6px 10px;
    background-color: #007bff; color: white; border: 1px solid #0056b3;
    border-radius: 3px; cursor: pointer;
  }
  .send-button:hover { background-color: #0056b3; }

  .auth-section {
    margin-top: auto; /* Push auth to bottom */
    padding-top: 10px;
    border-top: 1px solid #555;
    flex-shrink: 0;
  }

  .auth-input {
    width: calc(50% - 5px);
    margin-bottom: 5px;
    padding: 6px;
    background-color: #444; color: #eee; border: 1px solid #666; border-radius: 3px;
  }
  .auth-input:first-of-type { margin-right: 5px; }
  .auth-input::placeholder { color: #aaa; }

  .auth-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
  }

  .auth-button {
      width: calc(50% - 3px); /* Adjust width for spacing */
      padding: 6px;
      background-color: #555; color: #eee; border: 1px solid #777;
      border-radius: 3px; cursor: pointer;
  }
  .auth-button:hover { background-color: #666; }

  .logout-button {
      width: 100%;
      margin-top: 5px;
      background-color: #dc3545; /* Red for logout */
      border-color: #bd2130;
  }
   .logout-button:hover { background-color: #c82333; }


  .auth-status {
    margin-top: 8px;
    font-size: 0.9em;
    color: #aaa;
  }
</style>