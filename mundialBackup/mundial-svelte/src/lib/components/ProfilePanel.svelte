<!-- mundial-svelte/src/lib/components/ProfilePanel.svelte -->
<script lang="ts">
  import { draggable } from '$lib/actions/draggable'; // Import the draggable action

  export let id = "profile-panel";
  export let visible = false; // Start hidden

  // TODO: Add profile display logic, auth integration
</script>

{#if visible}
<!-- Apply the draggable action -->
<div {id} class="view-panel profile-panel" use:draggable={{ handle: '.panel-header' }}>
  <!-- Draggable action handles header interaction -->
  <div class="panel-header">
    <h4>Profile</h4>
    <button class="maximize-btn" title="Maximize/Restore">□</button>
    <button class="minimize-btn" title="Minimize/Expand">-</button>
  </div>
  <div class="panel-content">
    <p>Profile details will go here.</p>
    <!-- Placeholder for profile picture, name, email, etc. -->
     <div class="profile-header">
         <div class="profile-picture-container">
             <!-- Changed alt text to be more descriptive -->
             <img id="profile-picture" alt="User's profile avatar" class="profile-picture" src="/placeholder-user.png"> <!-- Placeholder image -->
         </div>
         <h5 id="profile-name" class="profile-name">User Name</h5>
     </div>
     <hr>
     <div class="profile-details">
         <h6>Details</h6>
         <dl>
             <dt>Email:</dt>
             <dd id="profile-email">user@example.com</dd>
             <!-- Add more details -->
         </dl>
     </div>
  </div>
</div>
{/if}

<style>
  /* Basic panel styles, adjust positioning */
  .profile-panel { /* Specific class */
    position: absolute;
    top: 80px; /* Example position */
    right: 320px; /* Example position */
    width: 350px; /* Example width */
    max-height: calc(100vh - 100px);
    background: rgba(45, 45, 45, 0.9);
    border: 1px solid #555;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    box-sizing: border-box;
    z-index: 994; /* Adjust z-index as needed */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    resize: both;
  }

  .panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 10px; background-color: rgba(55, 55, 55, 0.95);
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
    padding: 15px;
    overflow-y: auto;
    flex-grow: 1;
  }

  /* Placeholder profile styles */
   .profile-header {
       display: flex;
       align-items: center;
       margin-bottom: 15px;
   }
   .profile-picture-container {
       width: 60px;
       height: 60px;
       border-radius: 50%;
       overflow: hidden;
       margin-right: 15px;
       background-color: #666; /* Placeholder bg */
       flex-shrink: 0;
   }
   .profile-picture {
       width: 100%;
       height: 100%;
       object-fit: cover;
   }
   .profile-name {
       margin: 0;
       font-size: 1.2em;
   }
   hr {
       border: none;
       border-top: 1px solid #555;
       margin: 10px 0;
   }
   .profile-details dt {
       font-weight: bold;
       margin-top: 8px;
   }
   .profile-details dd {
       margin-left: 0;
       color: #ccc;
   }

</style>