const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');

function toggleForms() {
    if (signinForm.style.display === 'none') {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

// Add event listeners for form submissions (basic example)
// In a real application, you would handle form submission with AJAX/fetch
// to send data to a backend server for authentication and user creation.

signinForm.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission
    console.log('Sign In form submitted');
    // Add actual sign-in logic here (e.g., API call)
    alert('Sign In functionality not implemented yet.');
    // Redirect to profile page on successful sign-in
    // window.location.href = 'profile.html';
});

signupForm.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission
    console.log('Sign Up form submitted');
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return; // Stop submission if passwords don't match
    }
    // Add actual sign-up logic here (e.g., API call)
    alert('Sign Up functionality not implemented yet.');
     // Optionally, switch to sign-in form after successful sign-up
    // toggleForms();
});