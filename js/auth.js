console.log("auth.js loaded"); // Log 1

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired"); // Log 2

    // ---- Credentials ----
    const AUTH0_DOMAIN = 'dev-vf6ksnhxltpvgpfb.us.auth0.com';
    const AUTH0_CLIENT_ID = 'KIVdq6ojwl8Vzf6NeG8hUUGrnhYQDhgE';
    const LOGOUT_REDIRECT_URL = 'https://chatlifyapp.com/index.html'; // Redirect after logout
    const LOGIN_PAGE = 'https://chatlifyapp.com/login.html';
    const PROTECTED_PAGES = ['/dashboard.html', '/settings.html']; // Korumalı sayfalar

    // ---- Helper Functions ----
    const isAuthenticated = () => !!localStorage.getItem('accessToken');
    const getUserProfile = () => JSON.parse(localStorage.getItem('profile'));

    // ---- Lock Configuration ----
    const lockOptions = {
        auth: {
            redirectUrl: window.location.origin + '/callback.html',
            responseType: 'token id_token',
            params: {
                scope: 'openid profile email'
            }
        },
        allowedConnections: ['Username-Password-Authentication'],
        container: 'auth0-lock-container',
        language: 'en',
        theme: {
            logo: 'img/logo.png',
            primaryColor: '#6a11cb',
            title: 'Chatlify',
            bodyText: '',
            labeledSubmitButton: true,
            authButtons: {
                "google-oauth2": {
                    displayName: "Google ile Giriş",
                    primaryColor: "#4285F4",
                    icon: "https://cdn.auth0.com/website/new-homepage/dark-favicon-2.png"
                },
                "facebook": {
                    displayName: "Facebook ile Giriş",
                    primaryColor: "#3b5998",
                    icon: "https://cdn.auth0.com/website/new-homepage/dark-favicon-2.png"
                }
            }
        },
        languageDictionary: {
            title: window.location.pathname.includes('register') ? 'Hesap Oluştur' : 'Giriş Yap',
            signUpTitle: 'Kaydol',
            loginTitle: 'Giriş Yap',
            signUpLabel: 'Kaydol',
            loginLabel: 'Giriş Yap',
            emailInputPlaceholder: 'E-posta adresiniz',
            passwordInputPlaceholder: 'Şifreniz',
            usernameOrEmailInputPlaceholder: 'E-posta adresiniz',
            forgotPasswordTitle: 'Şifrenizi mi unuttunuz?',
            forgotPasswordAction: 'Şifremi unuttum',
            signUpTerms: 'Kaydolarak, hizmet koşullarını ve gizlilik politikasını kabul etmiş olursunuz.',
            databaseEnterpriseAlternativeLoginInstructions: 'veya',
            databaseAlternativeSignUpInstructions: 'veya',
            separatorText: 'veya'
        },
        additionalSignUpFields: [{
            name: "full_name",
            placeholder: "Adınız ve Soyadınız"
        }],
        mustAcceptTerms: true,
        allowShowPassword: true,
        allowAutocomplete: true,
        closable: false,
        rememberLastLogin: true,
        usernameStyle: 'email',
        defaultDatabaseConnection: 'Username-Password-Authentication',
        avatar: {
            url: false // Gravatar gösterme
        },
        initialScreen: window.location.pathname.includes('register') ? 'signUp' : 'login',
        defaultADUsernameFromEmailPrefix: false,
        prefill: {
            email: '',
        },
        // Kayıt için database connection adını açıkça belirt
        signUpFieldsHandler: function (fields) {
            return {
                ...fields,
                connection: "Username-Password-Authentication"
            };
        }
    };

    // Login ve Register için ayrı Lock konfigürasyonları
    // Ana lockOptions'dan miras alacak şekilde bırakalım
    const loginLockOptions = {
        ...lockOptions,
        initialScreen: 'login'
    };

    const signupLockOptions = {
        ...lockOptions,
        initialScreen: 'signUp'
    };

    //---- Lock Instance ----
    let lock;
    try {
        lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, lockOptions);
        console.log("Auth0 Lock instance created:", lock); // Log for debugging

        // Auth0 widget'ını sayfaya göre hazırla
        if (document.getElementById('auth0-lock-container')) {
            lock.show();

            // Container sınıfı ekleyerek stil düzenlemelerini aktifleştir
            var lockContainer = document.getElementById('auth0-lock-container');
            lockContainer.classList.add('embedded-auth0');
        }
    } catch (error) {
        console.error("Failed to initialize Auth0 Lock:", error);
        return; // Stop execution if Lock fails to initialize
    }

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

            // Kullanıcı profil bilgilerini dashboard.html'de gösterme
            const userInfo = document.getElementById('user-info');
            if (userInfo && profile) {
                const userName = document.getElementById('user-name');
                const userEmail = document.getElementById('user-email');
                const userAvatar = document.getElementById('user-avatar');

                if (userName) userName.textContent = profile.name || profile.nickname || 'Misafir Kullanıcı';
                if (userEmail) userEmail.textContent = profile.email || 'Email bilgisi yok';
                if (userAvatar && profile.picture) userAvatar.src = profile.picture;
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
        }
    };

    // ---- Event Handlers ----
    // 1. Auth0 Lock event handlers
    lock.on('authenticated', (authResult) => {
        console.log('Authenticated:', authResult);
        saveAuthResult(authResult).then(profile => {
            console.log('Saved auth result and got profile:', profile);
            // Note: Redirect should already be handled by Lock config
        }).catch(err => {
            console.error('Error saving auth result:', err);
        });
    });

    lock.on('authorization_error', (error) => {
        console.error('Authentication error:', error);
        // Handle errors here, perhaps show a message to the user
    });

    // 2. Form button event handlers
    // Login form button
    const loginBtn = document.getElementById('qsLoginBtn');
    if (loginBtn) {
        console.log('Login button found');
        loginBtn.addEventListener('click', (e) => {
            console.log('Login button clicked');
            e.preventDefault();

            // Mevcut container'ı temizle
            let container = document.getElementById('auth0-lock-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'auth0-lock-container';
                document.body.appendChild(container);
            }

            // Login sayfasında ise sadece giriş ekranını göster
            lock.show(loginLockOptions);
            console.log('Lock.show called with login options');
        });
    }

    // Register form button
    const signUpBtn = document.getElementById('qsSignUpBtn');
    if (signUpBtn) {
        console.log('SignUp button found');
        signUpBtn.addEventListener('click', (e) => {
            console.log('SignUp button clicked');
            e.preventDefault();

            // Mevcut container'ı temizle
            let container = document.getElementById('auth0-lock-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'auth0-lock-container';
                document.body.appendChild(container);
            }

            // Register sayfasında ise sadece kayıt ekranını göster
            lock.show(signupLockOptions);
            console.log('Lock.show called with signup options');
        });
    }

    // Social login buttons for login and register
    // Login page social buttons - Sosyal login butonlarını gizle/devre dışı bırak
    const socialLoginButtons = document.querySelectorAll('.social-btn');
    socialLoginButtons.forEach(button => {
        button.style.display = 'none'; // Sosyal login butonlarını gizle
        // Alternatif: butonları devre dışı bırak 
        // button.disabled = true;
    });

    // 3. Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = LOGOUT_REDIRECT_URL;
        });
    }

    // 4. Protect routes on page load
    handleRouteChange();

    // 5. Initial UI update
    updateUserUI();

    // Geliştirici konsolu için global erişim
    window.auth0Lock = lock;
});
