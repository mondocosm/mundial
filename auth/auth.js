const loginForm = document.getElementById('login-form'); // Corrected ID, renamed for clarity
const signupForm = document.getElementById('signup-form');
const showLoginBtn = document.getElementById('show-login-btn');
const showSignupBtn = document.getElementById('show-signup-btn');

// Debug: Check if forms are found immediately
console.log("DEBUG auth.js: loginForm element:", loginForm);
console.log("DEBUG auth.js: signupForm element:", signupForm);
console.log("DEBUG auth.js: showLoginBtn element:", showLoginBtn);
console.log("DEBUG auth.js: showSignupBtn element:", showSignupBtn);

function showLoginForm() {
    if (loginForm && signupForm && showLoginBtn && showSignupBtn) {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        showLoginBtn.classList.add('active');
        showSignupBtn.classList.remove('active');
    } else {
        console.error("Auth form toggle elements not found for showLoginForm.");
    }
}

function showSignupForm() {
    if (loginForm && signupForm && showLoginBtn && showSignupBtn) {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        showLoginBtn.classList.remove('active');
        showSignupBtn.classList.add('active');
    } else {
        console.error("Auth form toggle elements not found for showSignupForm.");
    }
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', showLoginForm);
}
if (showSignupBtn) {
    showSignupBtn.addEventListener('click', showSignupForm);
}

// Ensure initial state matches button active class (login form visible by default)
if (loginForm && loginForm.style.display === 'none' && showLoginBtn && showLoginBtn.classList.contains('active')) {
    showLoginForm();
}


// Add event listeners for form submissions (basic example)
// In a real application, you would handle form submission with AJAX/fetch
// to send data to a backend server for authentication and user creation.

if (loginForm) { // Check if loginForm exists before adding listener
    loginForm.addEventListener('submit', (event) => { // Changed from querySelector('form')
    event.preventDefault(); // Prevent default form submission
    console.log('Sign In form submitted');
    // Add actual sign-in logic here (e.g., API call)
    alert('Sign In functionality not implemented yet.');
    // Redirect to profile page on successful sign-in
    // window.location.href = 'profile.html';
});
} // Closes the 'if (loginForm)' block

if (signupForm) { // Check if signupForm exists
    signupForm.addEventListener('submit', (event) => { // Changed from querySelector('form')
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
} // Closes the 'if (signupForm)' block