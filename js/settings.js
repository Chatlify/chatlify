// Settings page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Ana sayfa butonunu işlevsel hale getirme
    const homeButton = document.querySelector('.server-back-icon').parentElement;
    if (homeButton) {
        homeButton.addEventListener('click', function () {
            showNotification('Ana sayfaya yönlendiriliyorsunuz...', 'info');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }

    // Kapatma butonuna tıklama
    const closeButton = document.querySelector('.settings-close-btn');
    if (closeButton) {
        closeButton.addEventListener('click', function () {
            window.location.href = 'dashboard.html';
        });
    }

    // Ayar kategorilerini işlevsel hale getirme
    const settingsCategories = document.querySelectorAll('.settings-category');
    const settingsSections = document.querySelectorAll('.settings-section');

    settingsCategories.forEach(category => {
        category.addEventListener('click', function () {
            // Çıkış Yap kategorisini özel olarak işle
            if (category.querySelector('span').textContent === 'Çıkış Yap') {
                showNotification('Çıkış yapılıyor...', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                return;
            }

            // Aktif kategoriyi güncelle
            document.querySelector('.settings-category.active').classList.remove('active');
            category.classList.add('active');

            // İlgili bölümü göster
            const categoryText = category.querySelector('span').textContent;

            settingsSections.forEach(section => {
                section.classList.add('hidden');
            });

            // Kategori adına göre bölüm eşleştirme
            switch (categoryText) {
                case 'Hesabım':
                    document.getElementById('account-settings').classList.remove('hidden');
                    break;
                case 'Görünüm':
                    document.getElementById('appearance-settings').classList.remove('hidden');
                    break;
                default:
                    // Henüz oluşturulmamış bölümler için 
                    // İleri versiyonda ilgili bölümler eklenebilir
                    showNotification(`${categoryText} ayarları yakında eklenecek`, 'warning');
                    document.getElementById('account-settings').classList.remove('hidden');
            }
        });
    });

    // Tema kartları için işlevsellik
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.addEventListener('click', function () {
            document.querySelector('.theme-card.active').classList.remove('active');
            card.classList.add('active');

            const themeName = card.querySelector('.theme-name').textContent;
            showNotification(`${themeName} teması seçildi`, 'success');
        });
    });

    // Renk seçiciler için işlevsellik
    const colorItems = document.querySelectorAll('.color-item:not(.custom)');
    colorItems.forEach(item => {
        item.addEventListener('click', function () {
            document.querySelector('.color-item.active').classList.remove('active');
            item.classList.add('active');

            const color = getComputedStyle(item).getPropertyValue('--accent-color');
            showNotification(`Renk değiştirildi: ${color}`, 'success');
        });
    });

    // Özel renk seçici
    const customColorItem = document.querySelector('.color-item.custom');
    if (customColorItem) {
        customColorItem.addEventListener('click', function () {
            // Gerçek uygulamada burada bir renk seçiciyi açabilirsiniz
            showNotification('Özel renk seçici yakında eklenecek', 'info');
        });
    }

    // Kaydet butonları
    const saveButtons = document.querySelectorAll('.save-button');
    saveButtons.forEach(button => {
        button.addEventListener('click', function () {
            showNotification('Ayarlarınız başarıyla kaydedildi', 'success');
        });
    });

    // İptal butonları
    const cancelButtons = document.querySelectorAll('.cancel-button');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function () {
            showNotification('Değişiklikler iptal edildi', 'info');

            // Form değerlerini sıfırlama (gerçek uygulamada)
            // Burada formları sıfırlama kodu olabilir
        });
    });

    // Tehlikeli alan butonları
    const dangerButtons = document.querySelectorAll('.danger-button');
    dangerButtons.forEach(button => {
        button.addEventListener('click', function () {
            const action = button.textContent.trim();

            // Hesap silme butonu için onay isteyelim
            if (action === 'Hesabı Sil') {
                if (confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                    showNotification('Hesap silme işlemi başlatıldı', 'error');
                }
            } else if (action === 'Devre Dışı Bırak') {
                showNotification('Hesabınız devre dışı bırakıldı', 'warning');
            }
        });
    });

    // Yazı tipi boyutu değiştirici
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function () {
            const fontSize = fontSizeSlider.value;
            document.documentElement.style.fontSize = `${fontSize}px`;
        });
    }

    // Ayarlarda arama
    const settingsSearchInput = document.querySelector('.settings-search input');
    if (settingsSearchInput) {
        settingsSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();

            if (searchTerm.length < 2) {
                settingsCategories.forEach(category => {
                    category.style.display = 'flex';
                });
                return;
            }

            settingsCategories.forEach(category => {
                const categoryText = category.querySelector('span').textContent.toLowerCase();

                if (categoryText.includes(searchTerm)) {
                    category.style.display = 'flex';
                } else {
                    category.style.display = 'none';
                }
            });
        });
    }

    // Bildirim gösterme fonksiyonu
    function showNotification(message, type = 'info') {
        // dashboard.js'de tanımlanmış olan aynı fonksiyonu kullanabilmek için
        // o fonksiyon varsa onu kullan, yoksa burada tanımla
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    function getIconForType(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-times-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info':
            default: return 'fa-info-circle';
        }
    }

    // Animation toggle işlevselliği
    const animationToggle = document.querySelector('.appearance-option-group:nth-of-type(5) input[type="checkbox"]');
    if (animationToggle) {
        animationToggle.addEventListener('change', function () {
            const enableAnimations = this.checked;
            if (enableAnimations) {
                document.body.classList.remove('no-animations');
                showNotification('Animasyonlar etkinleştirildi', 'success');
            } else {
                document.body.classList.add('no-animations');
                showNotification('Animasyonlar devre dışı bırakıldı', 'info');
            }
        });
    }

    // Arka plan animasyonu toggle işlevselliği
    const bgAnimationToggle = document.querySelector('.appearance-option-group:nth-of-type(6) input[type="checkbox"]');
    if (bgAnimationToggle) {
        bgAnimationToggle.addEventListener('change', function () {
            const enableBgAnimation = this.checked;
            const bgAnimation = document.querySelector('.bg-animation');

            if (enableBgAnimation && bgAnimation) {
                bgAnimation.style.display = 'block';
                showNotification('Arka plan animasyonu etkinleştirildi', 'success');
            } else if (bgAnimation) {
                bgAnimation.style.display = 'none';
                showNotification('Arka plan animasyonu devre dışı bırakıldı', 'info');
            }
        });
    }

    // Yazı tipi seçici
    const fontSelect = document.querySelector('.settings-select');
    if (fontSelect) {
        fontSelect.addEventListener('change', function () {
            const selectedFont = this.value;
            document.documentElement.style.fontFamily = selectedFont;
            showNotification(`Yazı tipi ${selectedFont} olarak değiştirildi`, 'success');
        });
    }
}); 