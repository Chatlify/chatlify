console.log("auth.js loaded"); // Log 1

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired"); // Log 2

    // ---- Credentials ----
    const AUTH0_DOMAIN = 'dev-vf6ksnhxltpvgpfb.us.auth0.com';
    const AUTH0_CLIENT_ID = 'KIVdq6ojwl8Vzf6NeG8hUUGrnhYQDhgE';
    const LOGOUT_REDIRECT_URL = window.location.origin + '/index.html'; // Redirect after logout
    const LOGIN_PAGE = window.location.origin + '/login.html';
    const PROTECTED_PAGES = ['/dashboard.html', '/settings.html']; // Korumalı sayfalar

    // ---- Helper Functions ----
    const isAuthenticated = () => !!localStorage.getItem('accessToken');
    const getUserProfile = () => JSON.parse(localStorage.getItem('profile'));

    // ---- Lock Configuration ----
    const lockOptions = {
        auth: {
            redirectUrl: window.location.origin + '/dashboard.html', // Redirect after successful login/signup
            responseType: 'token id_token',
            audience: 'https://' + AUTH0_DOMAIN + '/userinfo',
            params: {
                scope: 'openid profile email'
            }
        },
        theme: {
            logo: '/images/favicon.svg', // Use root-relative path
            primaryColor: '#6a11cb'
        },
        languageDictionary: {
            title: "Chatlify"
        },
        allowSignUp: true, // Allow users to sign up
        // Set initial screen based on the current page
        initialScreen: window.location.pathname.includes('/register.html') ? 'signUp' : 'login'
    };

    //---- Lock Instance ----
    let lock;
    try {
        lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, lockOptions);
        console.log("Auth0 Lock instance:", lock); // Log 3
    } catch (error) {
        console.error("Failed to initialize Auth0 Lock:", error);
        return; // Stop execution if Lock fails to initialize
    }

    // ---- App state ----
    // You might want to use a more robust state management approach later
    // let userProfile = JSON.parse(localStorage.getItem('profile')) || null;
    // let accessToken = localStorage.getItem('accessToken') || null;
    // let idToken = localStorage.getItem('idToken') || null;

    // ---- Helper Functions ----
    const saveAuthResult = (authResult) => {
        return new Promise((resolve, reject) => {
            lock.getUserInfo(authResult.accessToken, (error, profile) => {
                if (error) {
                    console.error('Error getting user info:', error);
                    return reject(error);
                }
                console.log("User profile:", profile);
                localStorage.setItem('accessToken', authResult.accessToken);
                localStorage.setItem('idToken', authResult.idToken);
                localStorage.setItem('profile', JSON.stringify(profile));
                resolve(profile);
                // Redirect is handled by Auth0 Lock config, but trigger UI update just in case
                updateUserUI();
            });
        });
    };

    const clearSession = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('profile');
        // Clear any other session-related data
    };

    // ---- UI Update Function ----
    const updateUserUI = () => {
        const loggedIn = isAuthenticated();
        const profile = getUserProfile();

        // Genel Header/Nav Butonları (Varsa)
        // Örnek: Header'daki login/signup/logout butonlarını yönet
        const headerLoginBtn = document.querySelector('header .login-btn'); // Adjust selector if needed
        const headerSignupBtn = document.querySelector('header .signup-btn'); // Adjust selector if needed (assuming separate signup)
        const headerUserSection = document.querySelector('header .user-section'); // Placeholder for logged-in user info
        const headerLogoutBtn = document.querySelector('header #headerLogoutBtn'); // Needs to be added to header if desired

        if (loggedIn) {
            // Hide login/signup buttons in header
            if (headerLoginBtn) headerLoginBtn.style.display = 'none';
            if (headerSignupBtn) headerSignupBtn.style.display = 'none';

            // Show user info/logout button in header (if applicable)
            if (headerUserSection) headerUserSection.style.display = 'block'; // Or flex, etc.
            if (headerLogoutBtn) headerLogoutBtn.style.display = 'block';
            // Populate header user info (Example)
            // if (profile && headerUserSection) {
            //     headerUserSection.innerHTML = `<img src="${profile.picture}" alt="${profile.name}"><span>${profile.nickname || profile.name}</span>`;
            // }

            // Dashboard User Panel Güncelleme
            const userPanel = document.querySelector('.dm-user-panel');
            if (userPanel && profile) {
                const userNameEl = userPanel.querySelector('.dm-user-name');
                const userTagEl = userPanel.querySelector('.dm-user-tag');
                const userAvatarEl = userPanel.querySelector('.dm-user-avatar img');
                const userStatusEl = userPanel.querySelector('.dm-user-avatar .dm-user-status'); // Example status update
                const logoutIconEl = userPanel.querySelector('#qsLogoutBtn');

                if (userNameEl) userNameEl.textContent = profile.nickname || profile.name || 'User';
                if (userTagEl) userTagEl.textContent = profile.sub ? `#${profile.sub.split('|')[1].substring(0, 4)}` : '#0000'; // Example tag from sub
                if (userAvatarEl) userAvatarEl.src = profile.picture || 'https://via.placeholder.com/100/2ecc71/ffffff?text=U';
                if (userStatusEl) userStatusEl.className = 'dm-user-status online'; // Set status to online
                if (logoutIconEl) logoutIconEl.style.display = 'flex'; // Ensure logout icon is visible

                userPanel.style.display = 'flex'; // Show the panel
            } else if (userPanel) {
                userPanel.style.display = 'none'; // Hide panel if no profile (edge case)
            }

        } else {
            // Show login/signup buttons in header
            if (headerLoginBtn) headerLoginBtn.style.display = 'block'; // Or flex, etc.
            if (headerSignupBtn) headerSignupBtn.style.display = 'block';

            // Hide user info/logout button in header
            if (headerUserSection) headerUserSection.style.display = 'none';
            if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';

            // Dashboard User Panel Gizleme
            const userPanel = document.querySelector('.dm-user-panel');
            if (userPanel) {
                userPanel.style.display = 'none';
            }
        }
    };

    // ---- Route Guard ----
    const handleRouteChange = () => {
        const isProtected = PROTECTED_PAGES.some(page => window.location.pathname.endsWith(page));
        if (isProtected && !isAuthenticated()) {
            console.log('Access denied. Redirecting to login.');
            // Redirect to login page if trying to access protected route without authentication
            window.location.href = LOGIN_PAGE;
            return false; // Stop further execution if redirected
        }
        return true; // Allow execution to continue
    };

    // ---- Event Handlers ----
    lock.on('authenticated', async (authResult) => {
        console.log("Authentication successful!", authResult);
        try {
            await saveAuthResult(authResult);
            // Redirect is handled by Lock config, UI update called in saveAuthResult
            // No need to call updateUserUI() here again unless specific post-login logic needed before redirect
        } catch (error) {
            alert('Login/Signup failed. Could not retrieve user profile.');
        }
    });

    lock.on('authorization_error', (error) => {
        console.error('Authentication error:', error);
        alert(`Error: ${error.error} (${error.errorDescription}). Check the console for further details.`);
        clearSession(); // Clear session on auth error
        updateUserUI(); // Update UI to reflect logged-out state
    });

    // ---- Logout Function ----
    const logout = () => {
        clearSession();
        updateUserUI(); // Update UI immediately after clearing session
        // Redirect to Auth0 logout endpoint
        lock.logout({
            returnTo: LOGOUT_REDIRECT_URL,
            clientID: AUTH0_CLIENT_ID
        });
    };

    // ---- UI Initialization ----
    const initializeAuthUI = () => {
        if (!handleRouteChange()) return; // Execute route guard first

        const loginButton = document.getElementById('qsLoginBtn'); // Button on login/register pages
        console.log("Login button element:", loginButton); // Log 4
        const logoutButton = document.getElementById('qsLogoutBtn'); // Button in dashboard user panel
        const headerLogoutButton = document.getElementById('headerLogoutBtn'); // Button in header (if added)

        if (loginButton) {
            console.log("Attaching click listener to login button"); // Log 5
            loginButton.addEventListener('click', (e) => {
                console.log("Login button clicked!"); // Log 6
                e.preventDefault();
                if (lock) {
                    console.log("Calling lock.show()"); // Log 7
                    lock.show();
                } else {
                    console.error("Lock instance is not available!");
                }
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        if (headerLogoutButton) {
            headerLogoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        // Update UI based on initial login state
        updateUserUI();
    };

    // Run initialization
    initializeAuthUI();

    // Optional: Handle back/forward navigation potentially causing state mismatch
    window.addEventListener('pageshow', function (event) {
        // If the page was loaded from the cache (e.g., back button)
        // Re-check auth state and update UI
        if (event.persisted) {
            console.log('Page loaded from cache. Re-validating UI.');
            if (handleRouteChange()) {
                updateUserUI();
            }
        }
    });

    // --- Potentially expose functions needed globally (optional) ---
    // window.auth = {
    //   logout: logout,
    //   isAuthenticated: () => !!localStorage.getItem('accessToken'),
    //   getUserProfile: () => JSON.parse(localStorage.getItem('profile'))
    // };

}); // End DOMContentLoaded
