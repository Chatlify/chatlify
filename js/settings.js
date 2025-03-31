// Settings page JavaScript
document.addEventListener('DOMContentLoaded', function () {
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

            // Tüm bölümleri gizle
            settingsSections.forEach(section => {
                section.classList.add('hidden');
            });

            // Data-target özelliğine göre ilgili bölümü göster
            const targetSection = category.getAttribute('data-target');
            if (targetSection) {
                const sectionElement = document.getElementById(targetSection);
                if (sectionElement) {
                    sectionElement.classList.remove('hidden');
                    return;
                }
            }

            // Kategori adına göre bölüm eşleştirme (data-target olmayan durumlar için)
            const categoryText = category.querySelector('span').textContent;
            switch (categoryText) {
                case 'Hesabım':
                    document.getElementById('account-settings').classList.remove('hidden');
                    break;
                case 'Görünüm':
                    document.getElementById('appearance-settings').classList.remove('hidden');
                    break;
                case 'Dil & Bölge':
                    document.getElementById('language-region-settings').classList.remove('hidden');
                    break;
                default:
                    // Henüz oluşturulmamış bölümler için 
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

    // Dil ve Bölge Bölümü İşlevsellikleri
    document.addEventListener('DOMContentLoaded', function () {
        // Dil ve Bölge bölümü için gerekli elementleri seçme
        const regionItems = document.querySelectorAll('.region-item');
        const languageItems = document.querySelectorAll('.language-item');

        // Bölge öğelerine tıklama işlevselliği ekleme
        regionItems.forEach(item => {
            item.addEventListener('click', function () {
                // Aktif sınıfını tüm öğelerden kaldır
                regionItems.forEach(i => i.classList.remove('active'));
                // Mevcut öğeye aktif sınıfını ekle
                this.classList.add('active');

                // Mevcut göstergesini kaldır
                regionItems.forEach(i => {
                    const indicator = i.querySelector('.current-indicator');
                    if (indicator) {
                        i.removeChild(indicator);
                    }
                });

                // Seçilen öğeye mevcut göstergesini ekle
                const indicator = document.createElement('div');
                indicator.className = 'current-indicator';
                indicator.textContent = 'Mevcut';
                this.appendChild(indicator);

                // Dil değiştiğinde bildirim göster
                showNotification('Bölge değiştirildi: ' + this.querySelector('.region-name').textContent, 'success');
            });
        });

        // Dil öğelerine tıklama işlevselliği ekleme
        languageItems.forEach(item => {
            item.addEventListener('click', function () {
                // Aktif sınıfını tüm öğelerden kaldır
                languageItems.forEach(i => i.classList.remove('active'));
                // Mevcut öğeye aktif sınıfını ekle
                this.classList.add('active');

                // Mevcut göstergesini kaldır
                languageItems.forEach(i => {
                    const indicator = i.querySelector('.current-indicator');
                    if (indicator) {
                        i.removeChild(indicator);
                    }
                });

                // Seçilen öğeye mevcut göstergesini ekle
                const indicator = document.createElement('div');
                indicator.className = 'current-indicator';
                indicator.textContent = 'Mevcut';
                this.appendChild(indicator);

                // Dil değiştiğinde bildirim göster
                const langName = this.querySelector('.language-name').textContent;
                const nativeName = this.querySelector('.language-native').textContent;
                showNotification(`Dil değiştirildi: ${langName} (${nativeName})`, 'success');
            });
        });

        // Dil ve Bölge bölümündeki Değişiklikleri Kaydet butonuna tıklama
        const languageSettings = document.getElementById('language-region-settings');
        if (languageSettings) {
            const saveButton = languageSettings.querySelector('.save-button');
            const cancelButton = languageSettings.querySelector('.cancel-button');

            if (saveButton) {
                saveButton.addEventListener('click', function () {
                    // Normalde buraya seçilen dil ve bölgeyi kaydetme işlevi eklenir
                    // Şimdilik sadece bildirim gösteriyoruz
                    showNotification('Dil ve bölge değişiklikleri başarıyla kaydedildi!', 'success');
                });
            }

            if (cancelButton) {
                cancelButton.addEventListener('click', function () {
                    showNotification('Dil ve bölge değişiklikleri iptal edildi.', 'info');
                });
            }
        }
    });

    // Bildirimler için işlevsellik
    function initializeNotificationSettings() {
        const masterToggle = document.querySelector('.master-notification-toggle');
        const otherToggles = document.querySelectorAll('.notification-option input[type="checkbox"]:not(.master-notification-toggle)');

        if (masterToggle) {
            masterToggle.addEventListener('change', function () {
                const isChecked = this.checked;
                otherToggles.forEach(toggle => {
                    toggle.checked = isChecked;
                    toggle.disabled = !isChecked;
                });

                if (isChecked) {
                    showNotification('Tüm bildirimler etkinleştirildi', 'success');
                } else {
                    showNotification('Tüm bildirimler devre dışı bırakıldı', 'info');
                }
            });
        }

        // Rahatsız Etmeyin modu için zaman seçicileri
        const dndToggle = document.getElementById('dnd-toggle');
        const timeInputs = document.querySelectorAll('.dnd-times input[type="time"]');

        if (dndToggle) {
            dndToggle.addEventListener('change', function () {
                timeInputs.forEach(input => {
                    input.disabled = !this.checked;
                });

                if (this.checked) {
                    const startTime = document.getElementById('dnd-start-time').value;
                    const endTime = document.getElementById('dnd-end-time').value;
                    showNotification(`Rahatsız Etmeyin modu etkinleştirildi: ${startTime} - ${endTime}`, 'success');
                } else {
                    showNotification('Rahatsız Etmeyin modu devre dışı bırakıldı', 'info');
                }
            });
        }

        // Bildirim seçenekleri için tekil işlevsellik
        otherToggles.forEach(toggle => {
            toggle.addEventListener('change', function () {
                const optionName = this.closest('.notification-option').querySelector('.option-title').textContent;
                if (this.checked) {
                    showNotification(`"${optionName}" etkinleştirildi`, 'success');
                } else {
                    showNotification(`"${optionName}" devre dışı bırakıldı`, 'info');
                }

                // Ana toggle'ı kontrol et
                updateMasterToggle();
            });
        });

        function updateMasterToggle() {
            if (!masterToggle) return;

            const allChecked = Array.from(otherToggles).every(toggle => toggle.checked);
            masterToggle.checked = allChecked;
        }
    }

    // Ses ve Video ayarları için işlevsellik
    function initializeAudioVideoSettings() {
        // Ses ayarları
        const outputVolume = document.getElementById('output-volume');
        const inputVolume = document.getElementById('input-volume');
        const outputVolumeValue = document.querySelector('#output-volume + i + span');
        const inputVolumeValue = document.querySelector('#input-volume + i + span');
        const testMicBtn = document.querySelector('.test-mic-btn');
        const meterFill = document.querySelector('.meter-fill');

        if (outputVolume && outputVolumeValue) {
            outputVolume.addEventListener('input', function () {
                outputVolumeValue.textContent = this.value + '%';
            });
        }

        if (inputVolume && inputVolumeValue) {
            inputVolume.addEventListener('input', function () {
                inputVolumeValue.textContent = this.value + '%';
            });
        }

        if (testMicBtn && meterFill) {
            testMicBtn.addEventListener('click', function () {
                // Simüle edilmiş mikrofon testi
                showNotification('Mikrofon testi başlatıldı', 'info');

                let level = 0;
                const interval = setInterval(function () {
                    level = Math.min(100, level + Math.random() * 20);
                    meterFill.style.width = level + '%';

                    if (level >= 90) {
                        clearInterval(interval);
                        setTimeout(function () {
                            meterFill.style.width = '0%';
                            showNotification('Mikrofon testi tamamlandı', 'success');
                        }, 1000);
                    }
                }, 100);
            });
        }

        // Video ayarları
        const enableVideoBtn = document.querySelector('.enable-video');
        const testVideoBtn = document.querySelector('.test-video');
        const videoPlaceholder = document.querySelector('.video-placeholder');

        if (enableVideoBtn && testVideoBtn) {
            let videoEnabled = false;

            enableVideoBtn.addEventListener('click', function () {
                videoEnabled = !videoEnabled;

                if (videoEnabled) {
                    // Kamera açma simülasyonu
                    videoPlaceholder.innerHTML = `
                        <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #1a2036, #212842); display: flex; align-items: center; justify-content: center;">
                            <div style="width: 150px; height: 150px; border-radius: 50%; background-color: #3d68e7; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user" style="font-size: 80px; color: white;"></i>
                            </div>
                        </div>
                    `;

                    this.innerHTML = '<i class="fas fa-video-slash"></i><span>Kamerayı Kapat</span>';
                    testVideoBtn.removeAttribute('disabled');
                    showNotification('Kamera etkinleştirildi', 'success');
                } else {
                    // Kamera kapatma simülasyonu
                    videoPlaceholder.innerHTML = `
                        <i class="fas fa-video-slash"></i>
                        <span>Kamera kapalı</span>
                    `;

                    this.innerHTML = '<i class="fas fa-video"></i><span>Kamerayı Etkinleştir</span>';
                    testVideoBtn.setAttribute('disabled', 'disabled');
                    showNotification('Kamera devre dışı bırakıldı', 'info');
                }
            });

            testVideoBtn.addEventListener('click', function () {
                if (!videoEnabled) return;

                showNotification('Video testi başarılı', 'success');
            });
        }

        // Gelişmiş video ayarları
        const videoToggles = document.querySelectorAll('.video-settings .advanced-option input[type="checkbox"]');

        videoToggles.forEach(toggle => {
            toggle.addEventListener('change', function () {
                const optionName = this.closest('.advanced-option').querySelector('.option-title').textContent;
                if (this.checked) {
                    showNotification(`"${optionName}" etkinleştirildi`, 'success');
                } else {
                    showNotification(`"${optionName}" devre dışı bırakıldı`, 'info');
                }
            });
        });

        // Cihaz seçiciler
        const deviceSelectors = document.querySelectorAll('.device-selector select');

        deviceSelectors.forEach(selector => {
            selector.addEventListener('change', function () {
                const deviceType = this.closest('.device-selector').querySelector('label').textContent;
                const selectedDevice = this.options[this.selectedIndex].text;
                showNotification(`${deviceType}: ${selectedDevice} seçildi`, 'success');
            });
        });
    }

    // Sayfa yüklendikten sonra tüm işlevleri başlat
    document.addEventListener('DOMContentLoaded', function () {
        // Mevcut işlevler buraya...

        // Yeni işlevler
        initializeNotificationSettings();
        initializeAudioVideoSettings();

        // Şifre görünürlüğü için
        const togglePasswordButtons = document.querySelectorAll('.toggle-password');
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', function () {
                const passwordInput = this.previousElementSibling;
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordInput.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                }
            });
        });
    });
}); 