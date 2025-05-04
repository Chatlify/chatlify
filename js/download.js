// Download sayfası JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Ana içeriğin yüklenmesi animasyonu
    const main = document.querySelector('main');
    setTimeout(() => {
        main.classList.add('loaded');
    }, 300);

    // ID'ye göre sayfada belirli bir bölüme kaydırma
    const scrollToSection = (id) => {
        const section = document.querySelector(id);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    // CTA butonlarından download seçeneklerine kaydırma
    const ctaButton = document.querySelector('.cta .btn');
    if (ctaButton) {
        ctaButton.addEventListener('click', function (e) {
            e.preventDefault();
            scrollToSection('.download-options');
        });
    }

    // İndirme bildirimi görüntüleme
    const downloadButtons = document.querySelectorAll('.download-btn-large');
    const downloadNotification = document.querySelector('.download-notification');
    const closeNotificationBtn = document.querySelector('.notification-content .close-btn');
    const notificationText = document.querySelector('.notification-content span');

    // Sistem gereksinimleri tab sistemi
    initTabSystem();

    // Sistem gereksinimleri panellerinde hover efekti
    const reqItems = document.querySelectorAll('.req-item');
    reqItems.forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
            const icon = this.querySelector('.req-icon');
            icon.style.transform = 'scale(1.1)';
        });

        item.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            const icon = this.querySelector('.req-icon');
            icon.style.transform = 'scale(1)';
        });
    });

    // İndirme butonlarına tıklama işlevini bağla
    if (downloadButtons) {
        downloadButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();

                const version = this.getAttribute('data-version');
                let downloadMessage = '';

                switch (version) {
                    case 'windows':
                        downloadMessage = 'Windows için Chatlify indiriliyor...';
                        break;
                    case 'mac':
                        downloadMessage = 'macOS için Chatlify indiriliyor...';
                        break;
                    case 'linux':
                        downloadMessage = 'Linux için Chatlify indiriliyor...';
                        break;
                    case 'android':
                        downloadMessage = 'Android için Chatlify indiriliyor...';
                        break;
                    case 'ios':
                        downloadMessage = 'iOS için Chatlify indiriliyor...';
                        break;
                    default:
                        downloadMessage = 'Chatlify indiriliyor...';
                }

                showDownloadNotification(downloadMessage);

                // Simüle edilmiş indirme - gerçekte burada dosyayı indirme işlemi olacak
                setTimeout(() => {
                    window.location.href = '#';
                }, 1000);
            });
        });
    }

    // Bildirim kapatma butonuna tıklama işlevi
    if (closeNotificationBtn) {
        closeNotificationBtn.addEventListener('click', function () {
            hideDownloadNotification();
        });
    }

    // İndirme bildirimi gösterme fonksiyonu
    function showDownloadNotification(message) {
        if (downloadNotification && notificationText) {
            notificationText.textContent = message;
            downloadNotification.classList.add('show');

            // 5 saniye sonra otomatik kapat
            setTimeout(() => {
                hideDownloadNotification();
            }, 5000);
        }
    }

    // İndirme bildirimi gizleme fonksiyonu
    function hideDownloadNotification() {
        if (downloadNotification) {
            downloadNotification.classList.remove('show');
        }
    }

    // İndirme kartları animasyonu
    const downloadCards = document.querySelectorAll('.download-card');

    if (downloadCards) {
        downloadCards.forEach(card => {
            // Animasyon gecikmesi için
            const delay = parseFloat(getComputedStyle(card).animationDelay) * 1000;

            // Animasyon tamamlandığında hover efektini etkinleştir
            setTimeout(() => {
                card.classList.add('hover-ready');

                // Hover efektleri
                card.addEventListener('mouseenter', function () {
                    this.classList.add('hover-active');
                });

                card.addEventListener('mouseleave', function () {
                    this.classList.remove('hover-active');
                });
            }, delay + 1000); // Animasyon süresi + ek süre
        });
    }

    // Intersection Observer ile görünürlüğe göre animasyon
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Sekme sistemini başlat
    function initTabSystem() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const requirementPanels = document.querySelectorAll('.requirement-panel');

        if (tabButtons.length === 0 || requirementPanels.length === 0) return;

        // İlk sekmeyi varsayılan olarak göster
        requirementPanels[0].classList.add('active');

        // Her sekme düğmesine olay dinleyicisi ekle
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Aktif sekme düğmesini güncelle
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // İlgili paneli göster
                const targetTab = button.getAttribute('data-tab');
                requirementPanels.forEach(panel => {
                    panel.classList.remove('active');
                });

                const targetPanel = document.getElementById(`${targetTab}-panel`);
                if (targetPanel) {
                    targetPanel.classList.add('active');

                    // Panel içeriğine geçiş animasyonu
                    const content = targetPanel.querySelector('.panel-content');
                    if (content) {
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(20px)';

                        setTimeout(() => {
                            content.style.transition = 'all 0.5s ease';
                            content.style.opacity = '1';
                            content.style.transform = 'translateY(0)';
                        }, 50);
                    }
                }
            });
        });
    }

    // Kaydırma animasyonlarını başlat
    const systemRequirements = document.querySelector('.system-requirements');
    if (systemRequirements) {
        animateOnScroll.observe(systemRequirements);
    }
}); 