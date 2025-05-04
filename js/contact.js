import { supabase } from './auth_config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Form elementlerini seç
    const contactForm = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectSelect = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    const submitButton = document.getElementById('submitBtn');
    const formSuccess = document.getElementById('formSuccess');

    // Kaydırma animasyonlarını etkinleştir
    initScrollAnimations();

    // Mobil menü için event listener
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }

    // Form işleyici
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Yükleme durumunu göster
            showLoading(true);

            // Form verilerini al ve doğrula
            const name = sanitizeInput(nameInput.value.trim());
            const email = sanitizeInput(emailInput.value.trim());
            const subject = sanitizeInput(subjectSelect.value);
            const message = sanitizeInput(messageInput.value.trim());

            // Form doğrulama
            if (!validateForm(name, email, message)) {
                showLoading(false);
                return;
            }

            try {
                // Mesajı veritabanına kaydet
                const { data, error } = await supabase
                    .from('contact_messages')
                    .insert([
                        { name, email, subject, message, created_at: new Date().toISOString() }
                    ]);

                if (error) throw error;

                // Başarılı formu göster
                showSuccessForm();

                // Formu temizle
                contactForm.reset();

            } catch (error) {
                console.error('Mesaj gönderme hatası:', error);
                showErrorMessage('Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            } finally {
                showLoading(false);
            }
        });
    }

    // HTML özel karakterlerini escape ederek XSS'i önle
    function sanitizeInput(input) {
        if (!input) return '';

        const element = document.createElement('div');
        element.textContent = input;
        return element.innerHTML;
    }

    // Girişleri doğrula
    function validateForm(name, email, message) {
        let isValid = true;

        // İsim kontrolü
        if (!name || name.length < 2) {
            showInputError(nameInput, 'Lütfen geçerli bir isim girin.');
            isValid = false;
        } else {
            clearInputError(nameInput);
        }

        // E-posta kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showInputError(emailInput, 'Lütfen geçerli bir e-posta adresi girin.');
            isValid = false;
        } else {
            clearInputError(emailInput);
        }

        // Mesaj kontrolü
        if (!message || message.length < 10) {
            showInputError(messageInput, 'Mesajınız en az 10 karakter olmalıdır.');
            isValid = false;
        } else {
            clearInputError(messageInput);
        }

        return isValid;
    }

    // Hata mesajını göster
    function showInputError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message') || document.createElement('div');

        if (!errorElement.classList.contains('error-message')) {
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }

        errorElement.textContent = message;
        input.classList.add('error');

        // Input'u hafifçe titre
        input.classList.add('shake');
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }

    // Hata mesajını temizle
    function clearInputError(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');

        if (errorElement) {
            errorElement.textContent = '';
        }

        input.classList.remove('error');
    }

    // Yükleme durumunu göster/gizle
    function showLoading(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Gönder';
        }
    }

    // Başarı mesajını göster
    function showSuccessMessage(message) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-success';
        alertContainer.textContent = message;

        // Form üzerine ekle
        contactForm.prepend(alertContainer);

        // CSS animasyonu için timeout
        setTimeout(() => {
            alertContainer.style.opacity = '1';
        }, 10);

        // 5 saniye sonra mesajı kaldır
        setTimeout(() => {
            alertContainer.style.opacity = '0';
            setTimeout(() => {
                alertContainer.remove();
            }, 300);
        }, 5000);
    }

    // Hata mesajını göster
    function showErrorMessage(message) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-danger';
        alertContainer.textContent = message;

        // Form üzerine ekle
        contactForm.prepend(alertContainer);

        // CSS animasyonu için timeout
        setTimeout(() => {
            alertContainer.style.opacity = '1';
        }, 10);

        // 5 saniye sonra mesajı kaldır
        setTimeout(() => {
            alertContainer.style.opacity = '0';
            setTimeout(() => {
                alertContainer.remove();
            }, 300);
        }, 5000);
    }

    // Başarılı form gönderimi durumunda
    function showSuccessForm() {
        if (formSuccess) {
            // Form container'ı gizle ve başarı mesajını göster
            contactForm.style.opacity = '0';

            setTimeout(() => {
                contactForm.style.display = 'none';
                formSuccess.classList.add('show');
            }, 300);

            // 5 saniye sonra formu geri getir
            setTimeout(() => {
                formSuccess.classList.remove('show');
                setTimeout(() => {
                    contactForm.style.display = 'block';
                    setTimeout(() => {
                        contactForm.style.opacity = '1';
                    }, 10);
                }, 300);
            }, 5000);
        }
    }

    // Kaydırma animasyonları
    function initScrollAnimations() {
        const sections = [
            document.querySelector('.map-section'),
            document.querySelector('.faq-preview')
        ];

        const infoCards = document.querySelectorAll('.info-card');
        const formGroups = document.querySelectorAll('.form-group');

        // IntersectionObserver ile görünüm kontrolü
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scrolled');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        // Bölümleri gözlemle
        sections.forEach(section => {
            if (section) observer.observe(section);
        });
    }

    // Sayfadan ayrılırken form verilerini doğrula
    window.addEventListener('beforeunload', (event) => {
        if (nameInput.value || emailInput.value || messageInput.value) {
            event.preventDefault();
            return event.returnValue = 'Formu tamamlamadan sayfadan ayrılmak istediğinize emin misiniz?';
        }
    });

    // Harita bölümü için animasyon
    const mapSection = document.querySelector('.map-section');
    if (mapSection) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > mapSection.offsetTop - window.innerHeight / 1.5) {
                mapSection.classList.add('scrolled');
            }
        });
    }

    // SSS bölümü için animasyon
    const faqPreview = document.querySelector('.faq-preview');
    if (faqPreview) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > faqPreview.offsetTop - window.innerHeight / 1.5) {
                faqPreview.classList.add('scrolled');
            }
        });
    }
}); 