import { supabase } from './auth_config.js';
import { login, checkSession } from './auth.js';

document.addEventListener('DOMContentLoaded', async function () {
    // Aktif oturum kontrolü, varsa direkt dashboard'a yönlendir
    const sessionActive = await checkSession();
    if (sessionActive) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = document.querySelector('button[type="submit"]');
    const formMessage = document.querySelector('.form-message') || document.createElement('div');

    // Form mesaj alanını oluştur (yoksa)
    if (!formMessage.classList.contains('form-message')) {
        formMessage.className = 'form-message';
        loginForm.prepend(formMessage);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Formu temizle ve yükleme durumunu göster
            clearFormMessages();
            showLoading(true);

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Basit doğrulama
            if (!validateForm(email, password)) {
                showLoading(false);
                return;
            }

            try {
                // Güvenli login fonksiyonunu çağır
                const authData = await login(email, password);

                if (authData.user) {
                    // Başarılı giriş
                    showSuccessMessage('Giriş başarılı. Yönlendiriliyorsunuz...');

                    // Güvenli şekilde kullanıcı profilini kaydet (hassas bilgiler hariç)
                    const userData = {
                        id: authData.user.id,
                        email: authData.user.email,
                        username: authData.user.user_metadata?.username || email.split('@')[0],
                        lastLogin: new Date().toISOString()
                    };

                    // Kullanıcıyı loading ekranına yönlendir
                    setTimeout(() => {
                        window.location.href = 'loading.html';
                    }, 1000);
                }
            } catch (error) {
                console.error('Giriş hatası:', error);

                // Kullanıcı dostu hata mesajları
                if (error.message.includes('Invalid login credentials')) {
                    showErrorMessage('Geçersiz e-posta veya şifre.');
                } else if (error.message.includes('Çok fazla başarısız giriş denemesi')) {
                    showErrorMessage(error.message);
                } else if (error.message.includes('Email not confirmed')) {
                    showErrorMessage('E-posta adresi onaylanmamış. Lütfen e-postanızı kontrol edin.');
                } else {
                    showErrorMessage(`Giriş sırasında bir hata oluştu: ${error.message}`);
                }
            } finally {
                showLoading(false);
            }
        });

        // "Şifremi Unuttum" bağlantısı
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();

                if (!email) {
                    showErrorMessage('Lütfen e-posta adresinizi girin.');
                    emailInput.focus();
                    return;
                }

                try {
                    showLoading(true);

                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password.html`,
                    });

                    if (error) throw error;

                    showSuccessMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
                } catch (error) {
                    console.error('Şifre sıfırlama hatası:', error);
                    showErrorMessage(`Şifre sıfırlama sırasında bir hata oluştu: ${error.message}`);
                } finally {
                    showLoading(false);
                }
            });
        }

        // Enter tuşu ve diğer kullanıcı dostu geliştirmeler
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitButton.click();
            }
        });
    }

    // Form doğrulama
    function validateForm(email, password) {
        let isValid = true;

        // E-posta doğrulama
        if (!email) {
            showErrorMessage('Lütfen e-posta adresinizi girin.');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
            isValid = false;
        }

        // Şifre doğrulama
        if (!password) {
            showErrorMessage('Lütfen şifrenizi girin.');
            isValid = false;
        }

        return isValid;
    }

    // Yükleme durumunu göster/gizle
    function showLoading(show) {
        if (show) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Giriş Yap';
        }
    }

    // Form mesajlarını temizle
    function clearFormMessages() {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
        emailInput.classList.remove('error');
        passwordInput.classList.remove('error');
    }

    // Hata mesajı göster
    function showErrorMessage(message) {
        formMessage.textContent = message;
        formMessage.className = 'form-message error';
    }

    // Başarı mesajı göster
    function showSuccessMessage(message) {
        formMessage.textContent = message;
        formMessage.className = 'form-message success';
    }
}); 