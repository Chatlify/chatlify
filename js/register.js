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

    // Varsayılan avatar dosya isimleri (images/ altında olmalı)
    const defaultAvatarFiles = [
        'chatlifyprofile1.png',
        'chatlifyprofile2.png',
        'chatlifyprofile3.png'
    ];

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
                displayAvatarError('Geçersiz dosya türü. Lütfen PNG, JPG veya GIF seçin.');
                avatarFile = null;
                // Önizlemeyi sıfırla
                avatarPreviewImg.style.display = 'none';
                avatarPreviewText.style.display = 'block';
                avatarUploadIcon.style.display = 'block';
                return;
            }
            const maxSize = 5 * 1024 * 1024; // 5MB limit
            if (file.size > maxSize) {
                displayAvatarError('Dosya boyutu 5MB sınırını aşıyor.');
                avatarFile = null;
                // Önizlemeyi sıfırla
                avatarPreviewImg.style.display = 'none';
                avatarPreviewText.style.display = 'block';
                avatarUploadIcon.style.display = 'block';
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
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(); // Önceki hataları temizle

        // Alanlardan değerleri al ve doğrula
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        let isValid = true;
        if (!validateUsername(username)) isValid = false;
        if (!validateEmail(email)) isValid = false;
        if (!validatePassword(password)) isValid = false;
        if (!validateConfirmPassword(password, confirmPassword)) isValid = false;

        if (!termsCheckbox.checked) { // Terms kontrolü
            displayError(registerForm.querySelector('.form-error'), 'Kullanım koşullarını kabul etmelisiniz.');
            isValid = false;
        }

        if (!isValid) return;

        // Butonu yükleniyor durumuna getir
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kayıt Olunuyor...';

        let finalAvatarUrl = null; // Kaydedilecek son avatar URL'si

        try {
            // 1. Adım: Kullanıcı kendi avatarını yükledi mi?
            if (avatarFile) {
                console.log(' Kendi avatarı yükleniyor...');
                // *** BURAYA MEVCUT AVATAR YÜKLEME KODUNUZ GELMELİ ***
                // Örneğin Cloudinary'ye yükleme yapılıyorsa:
                formMessage.textContent = 'Avatar yükleniyor...';
                const formData = new FormData();
                formData.append('file', avatarFile);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                try {
                    const response = await fetch(CLOUDINARY_URL, {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await response.json();
                    if (response.ok && uploadData.secure_url) {
                        finalAvatarUrl = uploadData.secure_url; // Başarılı yükleme
                        console.log(' Kendi avatarı başarıyla yüklendi:', finalAvatarUrl);
                        formMessage.textContent = ''; // Mesajı temizle
                    } else {
                        throw new Error(uploadData.error?.message || 'Cloudinary yüklemesi başarısız');
                    }
                } catch (uploadError) {
                    console.error('Avatar Yükleme Hatası:', uploadError);
                    displayError(registerForm.querySelector('.form-error'), `Avatar yüklenemedi: ${uploadError.message}. Varsayılan avatar kullanılacak.`);
                    // Yükleme başarısız olursa finalAvatarUrl null kalacak ve aşağıda varsayılan atanacak
                }
            }

            // 2. Adım: Eğer kullanıcı avatar yüklemediyse VEYA yükleme başarısız olduysa, rastgele varsayılan ata
            if (!finalAvatarUrl) {
                const randomIndex = Math.floor(Math.random() * defaultAvatarFiles.length);
                const randomAvatarName = defaultAvatarFiles[randomIndex];
                finalAvatarUrl = `images/${randomAvatarName}`; // Doğru yolu kullan: images/
                console.log(' Varsayılan avatar atandı:', finalAvatarUrl);
            }

            // 3. Adım: Supabase'e kayıt ol (username ve belirlenen avatar URL'si ile)
            formMessage.textContent = 'Hesap oluşturuluyor...';
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        avatar: finalAvatarUrl // Kendi yüklediği veya varsayılan avatar
                    }
                    // emailRedirectTo: `${window.location.origin}/login.html?verified=true` // Gerekliyse ekle
                }
            });

            if (error) {
                console.error('Supabase Kayıt Hatası:', error);
                if (error.message.includes('already registered')) {
                    displayError(emailError, 'Bu e-posta adresi zaten kayıtlı.');
                } else if (error.message.includes('Password should be at least')) {
                    displayError(passwordError, 'Şifre en az 6 karakter olmalıdır.');
                } else {
                    displayError(registerForm.querySelector('.form-error'), `Kayıt sırasında bir hata oluştu: ${error.message}`);
                }
                throw error;
            }

            // Kayıt başarılı
            console.log('Kayıt başarılı:', data);
            registerForm.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <h2>Kayıt Başarılı!</h2>
                    <p>Hesabınızı doğrulamak için lütfen e-posta adresinize gönderilen onay bağlantısına tıklayın.</p>
                    <p>E-posta gelmediyse spam klasörünüzü kontrol etmeyi unutmayın.</p>
                </div>
            `;

        } catch (err) {
            console.error('Genel Kayıt Hatası:', err);
            // Hata mesajı zaten displayError ile gösterilmiş olmalı
            // Butonu tekrar eski haline getir
            if (document.contains(submitButton)) {
                submitButton.disabled = !termsCheckbox.checked; // Terms durumuna göre ayarla
                submitButton.innerHTML = 'Kayıt Ol';
            }
        } finally {
            // Başarı durumunda form içeriği değiştiği için butona tekrar erişmek gereksiz.
            // Sadece hata durumunda buton eski haline getirilir (yukarıdaki catch bloğunda yapıldı).
        }
    });
    // --- End Form Submit ---    

    // --- Yardımcı Fonksiyonlar (Hata Gösterme vb.) ---
    // ... (clearErrors, displayError, validateUsername, validateEmail, etc.) ...

}); 