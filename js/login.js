document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const togglePassword = document.getElementById('toggle-password');
    const rememberCheckbox = document.getElementById('remember');
    const toast = document.getElementById('toast');
    const toastMessage = document.querySelector('.toast-message');
    const successIcon = document.querySelector('.toast-icon.success');
    const errorIcon = document.querySelector('.toast-icon.error');

    // Check if email is saved in localStorage
    if (localStorage.getItem('rememberedEmail')) {
        emailInput.value = localStorage.getItem('rememberedEmail');
        rememberCheckbox.checked = true;
    }

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // Validate email function
    const validateEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    // Show toast notification
    const showToast = (message, isSuccess = true) => {
        toastMessage.textContent = message;
        successIcon.style.display = isSuccess ? 'block' : 'none';
        errorIcon.style.display = isSuccess ? 'none' : 'block';
        toast.classList.add('show');

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // Reset error messages
            emailError.textContent = '';
            emailError.classList.remove('show');
            passwordError.textContent = '';
            passwordError.classList.remove('show');

            // Validate email
            if (!emailInput.value.trim()) {
                emailError.textContent = 'Email is required';
                emailError.classList.add('show');
                isValid = false;
            } else if (!validateEmail(emailInput.value.trim())) {
                emailError.textContent = 'Please enter a valid email address';
                emailError.classList.add('show');
                isValid = false;
            }

            // Validate password
            if (!passwordInput.value.trim()) {
                passwordError.textContent = 'Password is required';
                passwordError.classList.add('show');
                isValid = false;
            } else if (passwordInput.value.length < 6) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.classList.add('show');
                isValid = false;
            }

            // If form is valid, proceed with login
            if (isValid) {
                // Save email to localStorage if remember me is checked
                if (rememberCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', emailInput.value.trim());
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Here you would typically send the login request to your server
                // For this demo, we'll simulate a successful login
                loginUser(emailInput.value.trim(), passwordInput.value);
            }
        });
    }

    // Simulated login function - replace with actual API call
    const loginUser = (email, password) => {
        // Simulate API request with timeout
        const loginButton = document.querySelector('.auth-button');
        const originalButtonText = loginButton.innerHTML;

        // Show loading state
        loginButton.innerHTML = '<span>Signing in...</span> <i class="fas fa-spinner fa-spin"></i>';
        loginButton.disabled = true;

        setTimeout(() => {
            // Mock API response - in real app, this would be your API call
            // For demo purposes, we'll use a simple success check
            const isSuccess = true; // Simulate successful login

            if (isSuccess) {
                showToast('Login successful! Redirecting...', true);

                // Save user session information (in a real app, this would be a token)
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html'; // Change to your dashboard URL
                }, 1000);
            } else {
                // Reset button state
                loginButton.innerHTML = originalButtonText;
                loginButton.disabled = false;

                // Show error message
                showToast('Invalid email or password. Please try again.', false);
            }
        }, 1500); // Simulate network delay
    };

    // Input animations
    const inputs = document.querySelectorAll('.auth-form input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });

        // Check initial state (for browser autofill)
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });

    // Add CSS styles for input focus effect
    const style = document.createElement('style');
    style.textContent = `
        .input-container {
            transition: transform 0.3s ease;
        }
        
        .input-container.focused {
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
}); 