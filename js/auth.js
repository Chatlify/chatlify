// Auth0 Entegrasyonu
let auth0 = null;

// Auth0 konfigürasyonu
const configureAuth0 = async () => {
    auth0 = await createAuth0Client({
        domain: 'dev-vf6ksnhxltpvgpfb.us.auth0.com', // Auth0 Dashboard'dan alınacak
        client_id: 'KIVdq6ojwl8Vzf6NeG8hUUGrnhYQDhgE', // Auth0 Dashboard'dan alınacak
        redirect_uri: 'https://chatlifyapp.com/dashboard.html',
        cacheLocation: 'localstorage'
    });

    // Sayfa yüklendiğinde URL'de auth0 callback bilgisi varsa
    if (window.location.search.includes("code=")) {
        // Callback işlemi
        await auth0.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
        updateUI();
    }
};

// UI Güncelleme
const updateUI = async () => {
    try {
        const isAuthenticated = await auth0.isAuthenticated();

        if (isAuthenticated) {
            // Kullanıcı giriş yapmışsa
            const user = await auth0.getUser();

            // Giriş bilgilerini local storage'a kaydetme
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(user));

            // Kullanıcıyı dashboard'a yönlendirme
            if (window.location.pathname.includes('/login.html') ||
                window.location.pathname.includes('/register.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Kullanıcı giriş yapmamışsa
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
        }
    } catch (err) {
        console.log('Auth0 Error:', err);
    }
};

// Giriş yap fonksiyonu
const login = async (e) => {
    if (e) e.preventDefault();
    await auth0.loginWithRedirect({
        redirect_uri: 'https://chatlifyapp.com/dashboard.html'
    });
};

// Kayıt ol fonksiyonu
const signup = async (e) => {
    if (e) e.preventDefault();
    await auth0.loginWithRedirect({
        redirect_uri: 'https://chatlifyapp.com/dashboard.html',
        screen_hint: 'signup'
    });
};

// Çıkış yap fonksiyonu
const logout = () => {
    auth0.logout({
        returnTo: 'https://chatlifyapp.com/index.html'
    });
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
};

// Sayfaya göre işlem yapma
document.addEventListener('DOMContentLoaded', async () => {
    await configureAuth0();

    // Kayıt sayfası için
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', signup);
    }

    // Giriş sayfası için
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }

    // Çıkış butonu için
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    updateUI();
});
