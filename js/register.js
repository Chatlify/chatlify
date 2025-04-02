import { supabase } from './auth_config.js';

// *** Cloudinary Ayarları (Kendi Bilgilerinizle Değiştirin) ***
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dabcbpznc/image/upload'; // Cloud Name güncellendi
const CLOUDINARY_UPLOAD_PRESET = 'chatlify_unsigned'; // İmzasız (unsigned) bir upload preset oluşturup adını buraya yazın

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const submitButton = document.getElementById('submitBtn'); // ID ile seç
    const buttonText = submitButton.querySelector('.btn-text');
    const loadingSpinner = submitButton.querySelector('.loading-spinner');
    const termsCheckbox = document.getElementById('terms');

    // Avatar Elements
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarPreviewImg = avatarPreview.querySelector('.avatar-preview-img');
    const avatarPreviewText = avatarPreview.querySelector('.avatar-preview-text');
    const avatarUploadIcon = avatarPreview.querySelector('.avatar-upload-icon');
    let avatarFile = null; // Seçilen dosyayı tutmak için

    // Şifre gücü elementleri
    const passwordInputForStrength = document.getElementById('password');
    const strengthValueSpan = document.getElementById('strengthValue');
    const strengthMeter = document.querySelector('.strength-meter'); // Meter container

    // Hata ve başarı mesajları için elementler
    const formMessage = document.createElement('div');
    formMessage.className = 'form-message';
    registerForm.prepend(formMessage);

    // --- Avatar Yükleme ve Önizleme İşlevi ---
    avatarPreview.addEventListener('click', () => {
        avatarInput.click(); // Gizli inputu tetikle
    });

    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Dosya tipi ve boyut kontrolü (isteğe bağlı)
            const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                displayAvatarError('Invalid file type. Please select PNG, JPG, or GIF.');
                avatarFile = null;
                return;
            }
            const maxSize = 5 * 1024 * 1024; // 5MB limit
            if (file.size > maxSize) {
                displayAvatarError('File size exceeds 5MB limit.');
                avatarFile = null;
                return;
            }

            avatarFile = file; // Seçilen dosyayı sakla
            const reader = new FileReader();
            reader.onload = function (e) {
                avatarPreviewImg.src = e.target.result;
                avatarPreviewImg.style.display = 'block';
                avatarPreviewText.style.display = 'none';
                avatarUploadIcon.style.display = 'none';
                clearAvatarError();
            }
            reader.readAsDataURL(file);
        } else {
            // Dosya seçilmedi veya iptal edildi
            avatarFile = null;
            avatarPreviewImg.style.display = 'none';
            avatarPreviewText.style.display = 'block';
            avatarUploadIcon.style.display = 'block';
            clearAvatarError();
        }
    });

    function displayAvatarError(message) {
        const avatarError = document.getElementById('avatarError');
        if (avatarError) avatarError.textContent = message;
    }
    function clearAvatarError() {
        displayAvatarError('');
    }
    // --- End Avatar ---    

    // --- Şifre Gücü Kontrolü ---
    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength += 1; // Uzunluk
        if (password.match(/[a-z]/)) strength += 1; // Küçük harf
        if (password.match(/[A-Z]/)) strength += 1; // Büyük harf
        if (password.match(/[0-9]/)) strength += 1; // Rakam
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1; // Özel karakter

        let strengthText = 'Very Weak';
        let strengthLevel = 0; // 0-4 arası seviye

        if (strength < 2) {
            strengthText = 'Weak';
            strengthLevel = 1;
        } else if (strength === 2) {
            strengthText = 'Medium';
            strengthLevel = 2;
        } else if (strength === 3 || strength === 4) {
            strengthText = 'Strong';
            strengthLevel = 3;
        } else if (strength >= 5) {
            strengthText = 'Very Strong';
            strengthLevel = 4;
        }

        if (password.length === 0) {
            strengthText = 'Weak'; // Boşsa default
            strengthLevel = 0;
        }

        // Update text
        if (strengthValueSpan) {
            strengthValueSpan.textContent = strengthText;
            // Optionally update class for color coding text
            strengthValueSpan.className = `strength-${strengthText.toLowerCase().replace(' ', '-')}`;
        }

        // Update meter segments
        if (strengthMeter) {
            const segments = strengthMeter.querySelectorAll('.strength-segment');
            segments.forEach((segment, index) => {
                if (index < strengthLevel) {
                    segment.classList.add('filled', `level-${strengthLevel}`);
                    segment.classList.remove('level-1', 'level-2', 'level-3'); // Remove other levels if changing
                    if (strengthLevel === 1) segment.classList.remove('level-2', 'level-3', 'level-4');
                    if (strengthLevel === 2) segment.classList.remove('level-1', 'level-3', 'level-4');
                    if (strengthLevel === 3) segment.classList.remove('level-1', 'level-2', 'level-4');
                    if (strengthLevel === 4) segment.classList.remove('level-1', 'level-2', 'level-3');
                    segment.classList.add(`level-${strengthLevel}`);

                } else {
                    segment.classList.remove('filled', 'level-1', 'level-2', 'level-3', 'level-4');
                }
            });
            // Add overall class to meter for potential styling
            strengthMeter.className = `strength-meter strength-${strengthLevel}`;
        }

    }

    if (passwordInputForStrength) {
        passwordInputForStrength.addEventListener('input', (event) => {
            checkPasswordStrength(event.target.value);
        });
        // Initial check in case of prefilled password (less common on register)
        checkPasswordStrength(passwordInputForStrength.value);
    }
    // --- End Şifre Gücü ---

    // --- Terms Checkbox Kontrolü ---
    termsCheckbox.addEventListener('change', () => {
        submitButton.disabled = !termsCheckbox.checked;
    });
    // --- End Terms ---    

    // --- Form Gönderme İşlevi ---
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!termsCheckbox.checked) { // Son bir kontrol
            formMessage.textContent = 'You must accept the Terms of Service.';
            formMessage.className = 'form-message error';
            return;
        }

        buttonText.style.display = 'none';
        loadingSpinner.style.display = 'block';
        submitButton.disabled = true; // Submit sırasında tekrar disable
        formMessage.textContent = '';
        formMessage.className = 'form-message';

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const usernameInput = document.getElementById('username');
        const email = emailInput.value;
        const password = passwordInput.value;
        const username = usernameInput.value;

        let avatarUrl = null; // Başlangıçta avatar URL'si null

        // --- Cloudinary Yükleme --- 
        if (avatarFile) {
            formMessage.textContent = 'Uploading avatar...'; // Kullanıcıya bilgi ver
            const formData = new FormData();
            formData.append('file', avatarFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            try {
                const response = await fetch(CLOUDINARY_URL, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (response.ok && data.secure_url) {
                    avatarUrl = data.secure_url; // Başarılı yükleme, URL'yi al
                    console.log('Avatar uploaded to Cloudinary:', avatarUrl);
                    formMessage.textContent = ''; // Upload mesajını temizle
                } else {
                    throw new Error(data.error?.message || 'Cloudinary upload failed');
                }
            } catch (uploadError) {
                console.error('Cloudinary Upload Error:', uploadError);
                formMessage.textContent = `Avatar upload failed: ${uploadError.message}. Continuing without avatar.`;
                formMessage.classList.add('error');
                // Hata olsa bile avatrsız devam etmeyi seçebiliriz veya işlemi durdurabiliriz.
                // Şimdilik devam ediyoruz, ama buton state'ini düzeltelim:
                buttonText.style.display = 'inline';
                loadingSpinner.style.display = 'none';
                // submitButton.disabled = !termsCheckbox.checked; // Butonu tekrar terms durumuna göre ayarla
                return; // Yükleme hatası durumunda kaydı durdur
            }
        }
        // --- End Cloudinary --- 

        // --- Supabase Kayıt --- 
        try {
            formMessage.textContent = 'Creating account...'; // Yeni mesaj
            const userData = {
                username: username,
                // Sadece avatarUrl varsa ekle
                ...(avatarUrl && { avatar_url: avatarUrl })
            };

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData, // username ve avatar_url içerir
                    emailRedirectTo: `${window.location.origin}/login.html?verified=true`
                }
            });

            if (error) {
                // Rate limit veya diğer hatalar
                throw error; // Hata bloğunda yakala
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                // E-posta zaten kullanımda olabilir
                throw new Error('This email address is already in use.');
            } else if (data.user) {
                // Başarılı
                console.log('Kayıt Başarılı:', data.user);
                formMessage.textContent = 'Kayıt başarılı! Lütfen e-posta adresinizi kontrol ederek hesabınızı doğrulayın.';
                formMessage.classList.add('success');
                registerForm.reset(); // Formu temizle
                avatarPreviewImg.style.display = 'none'; // Avatar önizlemeyi sıfırla
                avatarPreviewText.style.display = 'block';
                avatarUploadIcon.style.display = 'block';
                avatarFile = null;
                termsCheckbox.checked = false; // Checkbox'ı sıfırla
                submitButton.disabled = true; // Butonu tekrar disable yap
            } else {
                // E-posta doğrulaması kapalıysa veya beklenmedik durum
                formMessage.textContent = 'Kayıt işlemi tamamlandı. Giriş yapabilirsiniz.';
                formMessage.classList.add('success');
                registerForm.reset();
                avatarPreviewImg.style.display = 'none';
                avatarPreviewText.style.display = 'block';
                avatarUploadIcon.style.display = 'block';
                avatarFile = null;
                termsCheckbox.checked = false;
                submitButton.disabled = true;
            }

        } catch (err) {
            console.error('Supabase Kayıt Hatası veya Önceki Hata:', err);
            formMessage.textContent = `Kayıt başarısız: ${err.message}`;
            formMessage.classList.add('error');
        } finally {
            // Yükleme spinner'ını ve buton durumunu sadece Supabase işlemi bittiğinde ayarla
            buttonText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
            // Hata durumunda butonu tekrar aktif et, başarıda disable kalmalı (terms'e bağlı)
            if (!formMessage.classList.contains('success')) {
                submitButton.disabled = !termsCheckbox.checked;
            }
        }
        // --- End Supabase --- 
    });
    // --- End Form Submit ---
}); 