import { supabase } from './auth_config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.btn-text');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');

    // Hata ve başarı mesajları için elementler
    const formMessage = document.createElement('div');
    formMessage.className = 'form-message'; // Genel stil için
    loginForm.prepend(formMessage); // Formun başına ekle

    // URL'den e-posta doğrulama durumunu kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        formMessage.textContent = 'E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.';
        formMessage.classList.add('success');
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Formun varsayılan gönderimini engelle

        // Butonu yükleniyor durumuna getir
        buttonText.style.display = 'none';
        loadingSpinner.style.display = 'block';
        submitButton.disabled = true;
        formMessage.textContent = ''; // Önceki mesajları temizle
        formMessage.className = 'form-message'; // Stili sıfırla

        // Form verilerini al
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const email = emailInput.value;
        const password = passwordInput.value;

        // Supabase ile giriş yap
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Supabase Giriş Hatası:', error);
                if (error.message.includes('Invalid login credentials')) {
                    formMessage.textContent = 'Geçersiz e-posta veya şifre.';
                } else if (error.message.includes('Email not confirmed')) {
                    formMessage.textContent = 'Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın.';
                } else {
                    formMessage.textContent = `Giriş başarısız: ${error.message}`;
                }
                formMessage.classList.add('error');
            } else if (data.user) {
                console.log('Giriş Başarılı:', data.user);
                // Başarılı girişte dashboard'a yönlendir
                window.location.href = 'dashboard.html';
            } else {
                formMessage.textContent = 'Giriş sırasında bir hata oluştu.';
                formMessage.classList.add('error');
            }

        } catch (err) {
            console.error('Beklenmedik Hata:', err);
            formMessage.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
            formMessage.classList.add('error');
        } finally {
            // Butonu tekrar aktif et
            buttonText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
            submitButton.disabled = false;
        }
    });
}); 