document.addEventListener('DOMContentLoaded', function () {
    // Form elemanları
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const newMessageBtn = document.getElementById('newMessageBtn');

    // Form gönderimi
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Form doğrulama
        if (!validateForm()) {
            return;
        }

        // Form gönderimi simülasyonu
        const formData = new FormData(contactForm);

        // Yükleme animasyonu gösterimi
        showLoadingState();

        // API'ye gönderim simülasyonu (1.5 saniye)
        setTimeout(() => {
            // Form başarılı mesajını göster
            showSuccessMessage();

            // Formu sıfırla
            contactForm.reset();
        }, 1500);
    });

    // Yeni mesaj butonuna tıklandığında
    newMessageBtn.addEventListener('click', function () {
        // Başarı mesajını gizle
        hideSuccessMessage();
    });

    // Form doğrulama fonksiyonu
    function validateForm() {
        let isValid = true;

        // Tüm gerekli alanları kontrol et
        const requiredFields = contactForm.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                highlightErrorField(field);
            } else {
                removeErrorHighlight(field);
            }
        });

        // E-posta doğrulama
        const emailField = document.getElementById('email');
        if (emailField.value && !isValidEmail(emailField.value)) {
            isValid = false;
            highlightErrorField(emailField, 'Lütfen geçerli bir e-posta adresi girin.');
        }

        return isValid;
    }

    // E-posta doğrulama fonksiyonu
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Hatalı alanı vurgulama
    function highlightErrorField(field, message) {
        field.classList.add('error');

        // Hata mesajı göster
        let errorElement = field.parentElement.querySelector('.error-message');

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentElement.appendChild(errorElement);
        }

        errorElement.textContent = message || 'Bu alan zorunludur.';

        // Hata vurgusunu 3 saniye sonra kaldır
        setTimeout(() => {
            removeErrorHighlight(field);
        }, 3000);
    }

    // Hata vurgusunu kaldırma
    function removeErrorHighlight(field) {
        field.classList.remove('error');

        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Yükleme durumu gösterimi
    function showLoadingState() {
        const submitBtn = contactForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
    }

    // Başarı mesajı gösterimi
    function showSuccessMessage() {
        formSuccess.classList.add('show');

        // Animasyon için scroll
        const formContainer = document.querySelector('.contact-form-container');
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Başarı mesajını gizleme
    function hideSuccessMessage() {
        formSuccess.classList.remove('show');

        // Submit butonunu sıfırla
        const submitBtn = contactForm.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'GÖNDER';
    }

    // Input ve textarea'lar için otomatik yükseklik ayarı
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });

    // Sayfa ilk yüklendiğinde animasyonlar
    function initAnimations() {
        // Hero bölümü için fade-in animasyonu
        document.querySelector('.contact-hero').classList.add('loaded');

        // Bilgi kartları için animasyon
        const infoCards = document.querySelectorAll('.info-card');
        infoCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('appear');
            }, 300 + (index * 100));
        });

        // Form elemanları için animasyon
        const formElements = document.querySelectorAll('.form-group');
        formElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('appear');
            }, 500 + (index * 100));
        });
    }

    // Scroll animasyonları
    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scrolled');
                    // Gözlemlemeyi durdur
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        // Gözlemlenecek elementler
        const sections = document.querySelectorAll('.map-section, .faq-preview');
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // Header scroll efekti
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            document.querySelector('header').classList.add('scrolled');
        } else {
            document.querySelector('header').classList.remove('scrolled');
        }
    });

    // Animasyonları başlat
    initAnimations();
    setupScrollAnimations();
}); 