import { supabase } from './auth_config.js';

// Oturum süresini ve token güvenliğini güçlendirecek sabitler
const SESSION_EXPIRY = 3600 * 24; // 24 saat (saniye cinsinden)
const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const LOGIN_ATTEMPTS_RESET_KEY = 'login_attempts_reset';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000; // 15 dakika (milisaniye cinsinden)

// Geçerli oturumu kontrol et
export async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Oturum kontrolü sırasında hata:', error.message);
            return false;
        }

        if (!session) {
            console.log('Aktif oturum bulunamadı');
            return false;
        }

        // Oturum süresi kontrolü
        const expiresAt = new Date(session.expires_at);
        const now = new Date();

        if (expiresAt <= now) {
            console.log('Oturum süresi dolmuş');
            await supabase.auth.signOut();
            return false;
        }

        console.log('Geçerli oturum bulundu');
        return true;
    } catch (error) {
        console.error('Oturum kontrolü sırasında beklenmeyen hata:', error);
        return false;
    }
}

// Güvenli giriş işlemi 
export async function login(email, password) {
    try {
        // Giriş denemelerini kontrol et
        if (isLoginLocked()) {
            throw new Error('Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.');
        }

        // Giriş işlemi
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        // Hata durumunda giriş denemesini kaydet
        if (error) {
            incrementLoginAttempts();
            throw error;
        }

        // Başarılı giriş: giriş denemelerini sıfırla
        resetLoginAttempts();

        // Token'ı güvenli bir şekilde sakla (httpOnly cookie)
        // Not: Bu front-end'de değil, back-end'de yapılmalıdır.

        return data;
    } catch (error) {
        console.error('Giriş sırasında hata:', error.message);
        throw error;
    }
}

// Giriş denemelerini sınırla
function incrementLoginAttempts() {
    let attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0');
    attempts += 1;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
        // Kilit zamanını ayarla
        localStorage.setItem(LOGIN_ATTEMPTS_RESET_KEY, (Date.now() + LOGIN_LOCKOUT_TIME).toString());
    }
}

// Giriş denemelerini sıfırla
function resetLoginAttempts() {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOGIN_ATTEMPTS_RESET_KEY);
}

// Giriş kilitli mi kontrol et
function isLoginLocked() {
    const resetTime = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_RESET_KEY) || '0');

    if (resetTime > Date.now()) {
        return true; // Hala kilitli
    }

    // Kilit süresi geçtiyse giriş denemelerini sıfırla
    if (resetTime > 0 && resetTime <= Date.now()) {
        resetLoginAttempts();
    }

    const attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0');
    return attempts >= MAX_LOGIN_ATTEMPTS;
}

// Güvenli çıkış işlemi
export async function logout() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Çıkış sırasında hata:', error.message);
            throw error;
        }

        // Yerel depolamaları temizle (güvenlik için)
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');

        return true;
    } catch (error) {
        console.error('Çıkış sırasında beklenmeyen hata:', error);
        throw error;
    }
}

// Şifre sıfırlama bağlantısı gönder
export async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`,
        });

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Şifre sıfırlama isteği sırasında hata:', error.message);
        throw error;
    }
}

// Tüm API isteklerini otantike etmek için interceptor
export function setupAuthInterceptor() {
    // JWT token'ı alıp her istekte otomatik olarak gönder
    document.addEventListener('DOMContentLoaded', async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // Tüm fetch isteklerini yakala ve JWT token'ı ekle
            const originalFetch = window.fetch;
            window.fetch = async function (url, options = {}) {
                // Auth istekleri hariç tüm isteklere token ekle
                if (!url.includes('supabase.co/auth')) {
                    options.headers = options.headers || {};
                    options.headers['Authorization'] = `Bearer ${session.access_token}`;
                }

                return originalFetch(url, options);
            };
        }
    });
}

// Kullanıcı profili bilgilerini getir
export async function getUserProfile() {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw userError || new Error('Kullanıcı bilgileri alınamadı');
        }

        // Ek profil bilgilerini veritabanından al
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            throw profileError;
        }

        return { ...user, profile };
    } catch (error) {
        console.error('Kullanıcı profili getirme hatası:', error.message);
        throw error;
    }
}

// Auth module'ünü başlat
setupAuthInterceptor(); 