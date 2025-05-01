document.addEventListener('DOMContentLoaded', () => {
    // In a real application, you would fetch user data from a server
    // or retrieve it from local storage/session storage after login.
    const userData = {
        username: 'ExampleUser',
        email: 'user@example.com'
    };

    // Simulate loading user data
    setTimeout(() => {
        document.getElementById('profile-username').textContent = userData.username;
        document.getElementById('profile-email').textContent = userData.email;
    }, 500); // Simulate network delay

    const logoutButton = document.getElementById('logout-button');

    logoutButton.addEventListener('click', () => {
        console.log('Logout button clicked');
        // Add actual logout logic here (e.g., clear session/token, API call)
        alert('Logout functionality not implemented yet.');
        // Redirect back to the sign-in page
        window.location.href = 'auth.html';
    });
});