import { supabase } from './auth_config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Animasyonlu giriş efektleri
    animateOnScroll();
    initFaqAccordion();
    setupContactForm();
    setupNotificationToast();

    // Formu ayarla ve dinleyicileri ekle
    function setupContactForm() {
        const contactForm = document.getElementById('contactForm');

        if (!contactForm) return;

        const formGroups = document.querySelectorAll('.form-group');

        // Form grup elemanlarına animasyon için index ekle
        formGroups.forEach((group, index) => {
            group.style.setProperty('--item-index', index);
        });

        const submitBtn = document.querySelector('.submit-btn');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Formu doğrula
            if (!validateForm(contactForm)) return;

            // Form gönderme animasyonunu göster
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Gönderiliyor...';

            try {
                await submitContactForm(contactForm);

                // Bildirim göster
                showNotification('Mesajınız başarıyla gönderildi!', 'success');

                // Formu temizle
                contactForm.reset();

            } catch (error) {
                console.error('Form gönderme hatası:', error);
                showNotification('Mesajınız gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
            } finally {
                // Butonu normale çevir
                submitBtn.disabled = false;
                submitBtn.textContent = 'Gönder';
            }
        });
    }

    // Form alanları doğrulama
    function validateForm(form) {
        const nameInput = form.querySelector('#name');
        const emailInput = form.querySelector('#email');
        const subjectSelect = form.querySelector('#subject');
        const messageTextarea = form.querySelector('#message');
        const privacyCheckbox = form.querySelector('#privacy');

        let isValid = true;

        // Şu anki hata mesajlarını temizle
        clearValidationErrors();

        // Ad kontrol
        if (!nameInput.value.trim()) {
            showValidationError(nameInput, 'Lütfen adınızı giriniz');
            isValid = false;
        }

        // Email kontrol
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
            showValidationError(emailInput, 'Lütfen geçerli bir e-posta adresi giriniz');
            isValid = false;
        }

        // Konu kontrol
        if (subjectSelect.value === '') {
            showValidationError(subjectSelect, 'Lütfen bir konu seçiniz');
            isValid = false;
        }

        // Mesaj kontrol
        if (!messageTextarea.value.trim() || messageTextarea.value.trim().length < 10) {
            showValidationError(messageTextarea, 'Lütfen en az 10 karakter içeren bir mesaj giriniz');
            isValid = false;
        }

        // Gizlilik politikası kontrol
        if (!privacyCheckbox.checked) {
            showValidationError(privacyCheckbox, 'Devam etmek için gizlilik politikasını kabul etmelisiniz');
            isValid = false;
        }

        return isValid;
    }

    // Validasyon hatası gösterme
    function showValidationError(inputElement, errorMessage) {
        const formGroup = inputElement.closest('.form-group');

        // Hata mesajı ekle
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.textContent = errorMessage;

        // Eğer hata mesajı yoksa ekle
        if (!formGroup.querySelector('.validation-error')) {
            formGroup.appendChild(errorElement);
        }

        // Input'a hata stili ekle
        inputElement.classList.add('error');

        // Checkbox için özel işleme
        if (inputElement.type === 'checkbox') {
            inputElement.parentElement.classList.add('checkbox-error');
        }
    }

    // Hata mesajlarını temizleme
    function clearValidationErrors() {
        // Hata mesajlarını kaldır
        document.querySelectorAll('.validation-error').forEach(el => el.remove());

        // Hata stillerini kaldır
        document.querySelectorAll('input.error, textarea.error, select.error').forEach(el => {
            el.classList.remove('error');
        });

        // Checkbox hata stilini kaldır
        document.querySelectorAll('.checkbox-error').forEach(el => {
            el.classList.remove('checkbox-error');
        });
    }

    // Form verilerini Supabase'e gönderme
    async function submitContactForm(form) {
        const formData = new FormData(form);

        const formPayload = {
            name: sanitizeInput(formData.get('name')),
            email: sanitizeInput(formData.get('email')),
            subject: sanitizeInput(formData.get('subject')),
            message: sanitizeInput(formData.get('message')),
            created_at: new Date().toISOString()
        };

        // Supabase'e gönder
        const { data, error } = await supabase
            .from('contact_messages')
            .insert([formPayload]);

        if (error) {
            console.error('Supabase hata:', error);
            throw new Error('Mesaj kaydedilirken bir hata oluştu');
        }

        return data;
    }

    // XSS koruması için input temizleme
    function sanitizeInput(input) {
        if (!input) return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Bildirim toast'u ayarları
    function setupNotificationToast() {
        const closeBtn = document.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideNotification);
        }
    }

    // Bildirim gösterme
    function showNotification(message, type = 'success') {
        const toast = document.getElementById('notificationToast');
        const messageElement = toast.querySelector('.notification-message');
        const iconElement = toast.querySelector('.notification-icon i');

        messageElement.textContent = message;

        // İkonu tipi değiştir
        iconElement.className = type === 'success'
            ? 'fas fa-check-circle'
            : 'fas fa-exclamation-circle';

        // Toast tipi
        toast.className = 'notification-toast ' + type;

        // Göster
        toast.classList.add('show');

        // 5 saniye sonra otomatik kapat
        setTimeout(() => {
            hideNotification();
        }, 5000);
    }

    // Bildirimi gizle
    function hideNotification() {
        const toast = document.getElementById('notificationToast');
        toast.classList.remove('show');
    }

    // Scroll animasyonu
    function animateOnScroll() {
        const infoCards = document.querySelectorAll('.info-card');

        // Bilgi kartlarına animasyon için index ekle
        infoCards.forEach((card, index) => {
            card.style.setProperty('--item-index', index);
        });

        // FAQ öğelerine animasyon için index ekle
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach((item, index) => {
            item.style.setProperty('--item-index', index);
        });
    }

    // SSS akordiyon işlevselliği
    function initFaqAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            question.addEventListener('click', () => {
                // Aktif/pasif durumunu değiştir
                const isActive = item.classList.toggle('active');

                // Açık/kapalı durumuna göre yüksekliği ayarla
                if (isActive) {
                    const answerHeight = answer.scrollHeight;
                    answer.style.height = answerHeight + 'px';
                } else {
                    answer.style.height = '0';
                }

                // Diğer açık FAQ öğelerini kapat
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-answer').style.height = '0';
                    }
                });
            });
        });
    }

    // Mobil menü açma/kapatma
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
}); 