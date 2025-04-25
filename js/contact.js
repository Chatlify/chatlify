import { supabase } from './auth_config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Form elementlerini seç
    const contactForm = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const submitButton = document.getElementById('submitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Yükleme durumunu göster
            showLoading(true);

            // Form verilerini al ve doğrula
            const name = sanitizeInput(nameInput.value.trim());
            const email = sanitizeInput(emailInput.value.trim());
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
                        { name, email, message, created_at: new Date().toISOString() }
                    ]);

                if (error) throw error;

                // Başarılı mesaj
                showSuccessMessage('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.');

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
        const messageContainer = document.getElementById('formMessages') || createMessageContainer();
        messageContainer.innerHTML = `<div class="alert alert-success">${sanitizeInput(message)}</div>`;
        messageContainer.style.display = 'block';

        // 5 saniye sonra mesajı gizle
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }

    // Hata mesajını göster
    function showErrorMessage(message) {
        const messageContainer = document.getElementById('formMessages') || createMessageContainer();
        messageContainer.innerHTML = `<div class="alert alert-danger">${sanitizeInput(message)}</div>`;
        messageContainer.style.display = 'block';
    }

    // Mesaj konteynerini oluştur
    function createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'formMessages';
        container.className = 'message-container';
        contactForm.prepend(container);
        return container;
    }

    // Sayfadan ayrılırken form verilerini doğrula
    window.addEventListener('beforeunload', (event) => {
        if (nameInput.value || emailInput.value || messageInput.value) {
            event.preventDefault();
            return event.returnValue = 'Formu tamamlamadan sayfadan ayrılmak istediğinize emin misiniz?';
        }
    });
}); 