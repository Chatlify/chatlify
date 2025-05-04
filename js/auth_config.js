import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase Proje Bilgileri
const supabaseUrl = 'https://omyoobepjyyyvemovyim.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9teW9vYmVwanl5eXZlbW92eWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxNjIyNDksImV4cCI6MjA1MDczODI0OX0.-aNn51tjlgKLE9GssA0H4WvuCTYS3SMWIsJ4pz-PxqQ'

// Supabase istemcisini oluştur ve dışa aktar
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Netlify Functions ile kimlik doğrulama işlemlerini yönetecek yardımcı sınıf
export class AuthService {
    constructor() {
        this.apiUrl = '/.netlify/functions';
        this.currentUser = null;
        this.tokenKey = 'chatlify_user_token';

        // Oturumu kontrol et
        this.checkSession();
    }

    // Kullanıcı kaydı işlemi
    async register(email, password, username) {
        try {
            const response = await fetch(`${this.apiUrl}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'signup',
                    email,
                    password,
                    username
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Kayıt sırasında bir hata oluştu');
            }

            return data;
        } catch (error) {
            console.error('Kayıt hatası:', error);
            throw error;
        }
    }

    // Kullanıcı girişi işlemi
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Giriş sırasında bir hata oluştu');
            }

            // Token'i sakla
            this.saveSession(data.data.session);
            this.currentUser = data.data.user;

            return data;
        } catch (error) {
            console.error('Giriş hatası:', error);
            throw error;
        }
    }

    // Çıkış işlemi
    async logout() {
        try {
            const response = await fetch(`${this.apiUrl}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Çıkış sırasında bir hata oluştu');
            }

            // Oturum bilgilerini temizle
            this.clearSession();
            this.currentUser = null;

            return data;
        } catch (error) {
            console.error('Çıkış hatası:', error);
            throw error;
        }
    }

    // Oturum bilgilerini sakla
    saveSession(session) {
        localStorage.setItem(this.tokenKey, JSON.stringify(session));
    }

    // Oturum bilgilerini temizle
    clearSession() {
        localStorage.removeItem(this.tokenKey);
    }

    // Oturum durumunu kontrol et
    checkSession() {
        const sessionStr = localStorage.getItem(this.tokenKey);
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                // Token süresini kontrol et
                const expiry = new Date(session.expires_at);
                if (expiry > new Date()) {
                    this.currentUser = session.user;
                    return true;
                } else {
                    this.clearSession();
                }
            } catch (e) {
                this.clearSession();
            }
        }
        return false;
    }

    // Kullanıcının giriş yapıp yapmadığını kontrol et
    isLoggedIn() {
        return this.checkSession();
    }

    // Mevcut kullanıcıyı getir
    getCurrentUser() {
        return this.currentUser;
    }
}

// Auth servisini oluştur ve dışa aktar
export const authService = new AuthService(); 