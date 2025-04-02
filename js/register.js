import { supabase } from './auth_config.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const submitButton = registerForm.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.btn-text');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');

    // Hata ve başarı mesajları için elementler
    const formMessage = document.createElement('div');
    formMessage.className = 'form-message'; // Genel stil için
    registerForm.prepend(formMessage); // Formun başına ekle

    registerForm.addEventListener('submit', async (event) => {
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
        const usernameInput = document.getElementById('username');
        // Confirm password kontrolünü burada ekleyebilirsiniz, şimdilik geçiyorum.

        const email = emailInput.value;
        const password = passwordInput.value;
        const username = usernameInput.value;

        // Supabase ile kayıt ol
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username // Kullanıcı adını meta veri olarak ekle
                    },
                    // E-posta doğrulama linkinin yönlendireceği adres
                    emailRedirectTo: `${window.location.origin}/login.html?verified=true`
                }
            });

            if (error) {
                console.error('Supabase Kayıt Hatası:', error);
                formMessage.textContent = `Kayıt başarısız: ${error.message}`;
                formMessage.classList.add('error'); // Hata stili
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                // Bu durum bazen email zaten kullanımda ise oluşabilir (Supabase'in yeni sürümlerinde değişebilir)
                formMessage.textContent = 'Bu e-posta adresi zaten kullanımda.';
                formMessage.classList.add('error');
            } else if (data.user) {
                console.log('Kayıt Başarılı:', data.user);
                formMessage.textContent = 'Kayıt başarılı! Lütfen e-posta adresinizi kontrol ederek hesabınızı doğrulayın.';
                formMessage.classList.add('success'); // Başarı stili
                registerForm.reset(); // Formu temizle
            } else {
                // Beklenmedik durum (örneğin e-posta doğrulaması kapalıysa)
                formMessage.textContent = 'Kayıt işlemi tamamlandı. Giriş yapabilirsiniz.';
                formMessage.classList.add('success');
                registerForm.reset();
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