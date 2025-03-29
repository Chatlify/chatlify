document.addEventListener('DOMContentLoaded', function () {
    // Form elements
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.querySelector('.success-message');
    const newMessageBtn = document.getElementById('newMessageBtn');

    // Form submission
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Form validation
        if (!validateForm()) {
            return;
        }

        // Form submission simulation
        const formData = new FormData(contactForm);

        // Show loading animation
        showLoadingState();

        // API submission simulation (1.5 seconds)
        setTimeout(() => {
            // Show success message
            showSuccessMessage();

            // Reset form
            contactForm.reset();

            // Reset any expanded textareas
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.style.height = 'auto';
            });
        }, 1500);
    });

    // When new message button is clicked
    newMessageBtn.addEventListener('click', function () {
        // Hide success message
        hideSuccessMessage();
    });

    // Form validation function
    function validateForm() {
        let isValid = true;

        // Reset all error messages first
        document.querySelectorAll('.error-message').forEach(msg => {
            msg.style.display = 'none';
        });

        // Check name field
        const nameField = document.getElementById('name');
        if (!nameField.value.trim()) {
            isValid = false;
            document.getElementById('nameError').style.display = 'block';
            highlightErrorField(nameField);
        }

        // Check email field
        const emailField = document.getElementById('email');
        if (!emailField.value.trim()) {
            isValid = false;
            document.getElementById('emailError').style.display = 'block';
            highlightErrorField(emailField);
        } else if (!isValidEmail(emailField.value)) {
            isValid = false;
            document.getElementById('emailError').style.display = 'block';
            highlightErrorField(emailField);
        }

        // Check subject field
        const subjectField = document.getElementById('subject');
        if (!subjectField.value) {
            isValid = false;
            document.getElementById('subjectError').style.display = 'block';
            highlightErrorField(subjectField);
        }

        // Check message field
        const messageField = document.getElementById('message');
        if (!messageField.value.trim()) {
            isValid = false;
            document.getElementById('messageError').style.display = 'block';
            highlightErrorField(messageField);
        }

        // Check privacy checkbox
        const privacyCheckbox = document.getElementById('privacy');
        if (!privacyCheckbox.checked) {
            isValid = false;
            document.getElementById('privacyError').style.display = 'block';
            highlightErrorField(privacyCheckbox);
        }

        return isValid;
    }

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Highlight error field
    function highlightErrorField(field) {
        field.classList.add('error');

        // Remove error highlight after 3 seconds
        setTimeout(() => {
            removeErrorHighlight(field);
        }, 3000);
    }

    // Remove error highlight
    function removeErrorHighlight(field) {
        field.classList.remove('error');
    }

    // Show loading state
    function showLoadingState() {
        const submitBtn = contactForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').style.display = 'none';
        submitBtn.querySelector('.loading-spinner').style.display = 'block';
    }

    // Show success message
    function showSuccessMessage() {
        contactForm.style.display = 'none';
        successMessage.style.display = 'flex';

        // Smooth scroll to center the message
        const formContainer = document.querySelector('.contact-form-container');
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Hide success message
    function hideSuccessMessage() {
        contactForm.style.display = 'block';
        successMessage.style.display = 'none';

        // Reset submit button
        const submitBtn = contactForm.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').style.display = 'block';
        submitBtn.querySelector('.loading-spinner').style.display = 'none';
    }

    // Auto height adjustment for textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';

            // Hide error message when typing
            const errorMsg = document.getElementById('messageError');
            if (errorMsg) errorMsg.style.display = 'none';
        });
    });

    // Add input event listeners to hide error messages when user types
    document.getElementById('name').addEventListener('input', function () {
        document.getElementById('nameError').style.display = 'none';
        this.classList.remove('error');
    });

    document.getElementById('email').addEventListener('input', function () {
        document.getElementById('emailError').style.display = 'none';
        this.classList.remove('error');
    });

    document.getElementById('subject').addEventListener('change', function () {
        document.getElementById('subjectError').style.display = 'none';
        this.classList.remove('error');
    });

    document.getElementById('privacy').addEventListener('change', function () {
        document.getElementById('privacyError').style.display = 'none';
        this.classList.remove('error');
    });

    // Fix subject dropdown text color
    const subjectSelect = document.getElementById('subject');
    subjectSelect.style.color = '#ffffff';
    subjectSelect.addEventListener('change', function () {
        if (this.value) {
            this.style.color = '#ffffff';
        }
    });

    // Initial animations when page first loads
    function initAnimations() {
        // Fade-in animation for hero section
        document.querySelector('.contact-hero').classList.add('loaded');

        // Animation for info cards
        const infoCards = document.querySelectorAll('.info-card');
        infoCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('appear');
            }, 300 + (index * 100));
        });

        // Animation for form elements
        const formElements = document.querySelectorAll('.form-group');
        formElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('appear');
            }, 500 + (index * 100));
        });
    }

    // Scroll animations
    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scrolled');
                    // Stop observing once scrolled into view
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        // Elements to observe
        const sections = document.querySelectorAll('.map-section, .faq-preview');
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            document.querySelector('header').classList.add('scrolled');
        } else {
            document.querySelector('header').classList.remove('scrolled');
        }
    });

    // Start animations
    initAnimations();
    setupScrollAnimations();

    // Hide success message initially
    successMessage.style.display = 'none';
}); 