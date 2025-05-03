import { supabase } from './auth_config.js';

// *** Cloudinary Ayarları (Environment Variables'dan) ***
const CLOUDINARY_URL = process.env.CLOUDINARY_URL || null;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || null;

// API anahtarlarının kontrolü
if (!CLOUDINARY_URL || !CLOUDINARY_UPLOAD_PRESET) {
    console.error('Cloudinary ayarları bulunamadı! Environment variables kontrol edin.');
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    const usernameError = document.getElementById('username-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const confirmPasswordError = document.getElementById('confirm-password-error');
    const termsError = document.getElementById('terms-error');
    const togglePassword = document.getElementById('toggle-password');
    const toast = document.getElementById('toast');
    const toastMessage = document.querySelector('.toast-message');
    const successIcon = document.querySelector('.toast-icon.success');
    const errorIcon = document.querySelector('.toast-icon.error');

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // Validation functions
    const validateUsername = (username) => {
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    };

    const validateEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePassword = (password) => {
        // At least 8 characters, one uppercase, one lowercase, one number
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return re.test(password);
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

    // Password strength indicator
    const addPasswordStrengthIndicator = () => {
        // Create strength indicator elements
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';

        const strengthText = document.createElement('span');
        strengthText.className = 'strength-text';
        strengthText.textContent = 'Password strength:';

        const strengthBar = document.createElement('div');
        strengthBar.className = 'strength-bar';

        const strengthLevel = document.createElement('div');
        strengthLevel.className = 'strength-level';

        // Append elements
        strengthBar.appendChild(strengthLevel);
        strengthIndicator.appendChild(strengthText);
        strengthIndicator.appendChild(strengthBar);

        // Insert after password error message
        passwordError.parentNode.insertBefore(strengthIndicator, passwordError.nextSibling);

        // Add CSS for password strength indicator
        const style = document.createElement('style');
        style.textContent = `
            .password-strength {
                margin-top: 8px;
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .strength-text {
                display: block;
                margin-bottom: 5px;
            }
            
            .strength-bar {
                height: 5px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .strength-level {
                height: 100%;
                width: 0;
                background-color: var(--error-color);
                border-radius: 3px;
                transition: width 0.3s ease, background-color 0.3s ease;
            }
            
            .strength-weak { width: 25%; background-color: var(--error-color); }
            .strength-medium { width: 50%; background-color: #FFA000; }
            .strength-strong { width: 75%; background-color: #8BC34A; }
            .strength-very-strong { width: 100%; background-color: var(--success-color); }
        `;
        document.head.appendChild(style);

        // Update strength indicator on password input
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strengthLevel = document.querySelector('.strength-level');

            // Remove all classes
            strengthLevel.classList.remove('strength-weak', 'strength-medium', 'strength-strong', 'strength-very-strong');

            if (password.length === 0) {
                strengthLevel.style.width = '0';
            } else if (password.length < 6) {
                strengthLevel.classList.add('strength-weak');
            } else if (password.length < 10) {
                strengthLevel.classList.add('strength-medium');
            } else if (!validatePassword(password)) {
                strengthLevel.classList.add('strength-strong');
            } else {
                strengthLevel.classList.add('strength-very-strong');
            }
        });

        return strengthIndicator;
    };

    // Add password strength indicator
    if (passwordInput) {
        addPasswordStrengthIndicator();
    }

    // Form submission
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // Reset error messages
            usernameError.textContent = '';
            usernameError.classList.remove('show');
            emailError.textContent = '';
            emailError.classList.remove('show');
            passwordError.textContent = '';
            passwordError.classList.remove('show');
            confirmPasswordError.textContent = '';
            confirmPasswordError.classList.remove('show');
            termsError.textContent = '';
            termsError.classList.remove('show');

            // Validate username
            if (!usernameInput.value.trim()) {
                usernameError.textContent = 'Username is required';
                usernameError.classList.add('show');
                isValid = false;
            } else if (!validateUsername(usernameInput.value.trim())) {
                usernameError.textContent = 'Username must be 3-20 characters and contain only letters, numbers, and underscore';
                usernameError.classList.add('show');
                isValid = false;
            }

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
            } else if (!validatePassword(passwordInput.value)) {
                passwordError.textContent = 'Password must be at least 8 characters with uppercase, lowercase, and number';
                passwordError.classList.add('show');
                isValid = false;
            }

            // Validate confirm password
            if (confirmPasswordInput.value !== passwordInput.value) {
                confirmPasswordError.textContent = 'Passwords do not match';
                confirmPasswordError.classList.add('show');
                isValid = false;
            }

            // Validate terms
            if (!termsCheckbox.checked) {
                termsError.textContent = 'You must agree to the Terms of Service and Privacy Policy';
                termsError.classList.add('show');
                isValid = false;
            }

            // If form is valid, proceed with registration
            if (isValid) {
                registerUser(
                    usernameInput.value.trim(),
                    emailInput.value.trim(),
                    passwordInput.value
                );
            }
        });
    }

    // Simulated registration function - replace with actual API call
    const registerUser = (username, email, password) => {
        // Simulate API request with timeout
        const registerButton = document.querySelector('.auth-button');
        const originalButtonText = registerButton.innerHTML;

        // Show loading state
        registerButton.innerHTML = '<span>Creating account...</span> <i class="fas fa-spinner fa-spin"></i>';
        registerButton.disabled = true;

        setTimeout(() => {
            // Mock API response - in real app, this would be your API call
            // For demo purposes, we'll use a simple success check
            const isSuccess = true; // Simulate successful registration

            if (isSuccess) {
                showToast('Account created successfully! Redirecting...', true);

                // Save user session information (in a real app, this would be a token)
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('username', username);

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html'; // Change to your dashboard URL
                }, 1500);
            } else {
                // Reset button state
                registerButton.innerHTML = originalButtonText;
                registerButton.disabled = false;

                // Show error message
                showToast('Registration failed. Email may already be in use.', false);
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

    // Add CSS for terms container
    const style = document.createElement('style');
    style.textContent = `
        .terms-container {
            margin-bottom: 25px;
        }
        
        .terms-container label {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
        
        .terms-container a {
            text-decoration: underline;
        }
        
        .input-container {
            transition: transform 0.3s ease;
        }
        
        .input-container.focused {
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
}); 