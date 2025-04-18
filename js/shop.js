document.addEventListener('DOMContentLoaded', function () {
    // Sayfa ilk açıldığında modalın gösterilmemesi için başlangıçta kontrol ediyoruz
    const modal = document.getElementById('purchaseModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
    }

    // Aylık/Yıllık geçişi
    const billingToggle = document.getElementById('billingToggle');
    if (billingToggle) {
        billingToggle.addEventListener('change', function () {
            const toggleLabels = document.querySelectorAll('.toggle-label');
            if (this.checked) {
                toggleLabels[0].classList.remove('active');
                toggleLabels[1].classList.add('active');
            } else {
                toggleLabels[0].classList.add('active');
                toggleLabels[1].classList.remove('active');
            }
        });
    }

    // SSS bölümü
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', function () {
                const currentlyActive = document.querySelector('.faq-item.active');
                if (currentlyActive && currentlyActive !== item) {
                    currentlyActive.classList.remove('active');
                }
                item.classList.toggle('active');
            });
        });
    }

    // Animasyon efektleri
    const animateElements = function () {
        // AOS yerine basit bir animasyon sistemi
        const animateUpElements = document.querySelectorAll('[data-aos="fade-up"]');
        animateUpElements.forEach((element, index) => {
            const delay = element.getAttribute('data-aos-delay') || 0;
            setTimeout(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    element.style.transition = 'all 0.5s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 100);
            }, delay);
        });
    };

    // Sayfa yüklendiğinde animasyonları başlat
    setTimeout(animateElements, 100);

    // Satın Al butonlarına tıklama işlemi
    const buyButtons = document.querySelectorAll('.buy-btn');
    if (buyButtons.length > 0) {
        buyButtons.forEach(button => {
            button.addEventListener('click', function () {
                const productType = this.getAttribute('data-product');
                let productName, productPrice;

                const isYearly = document.getElementById('billingToggle') && document.getElementById('billingToggle').checked;

                switch (productType) {
                    case 'nova':
                        productName = 'Nova Ultimate';
                        productPrice = isYearly ? '$224.88/yr' : '$24.99/mo';
                        break;
                    case 'blaze':
                        productName = 'Blaze Premium';
                        productPrice = isYearly ? '$134.88/yr' : '$14.99/mo';
                        break;
                    case 'spark':
                        productName = 'Spark Starter';
                        productPrice = isYearly ? '$71.88/yr' : '$7.99/mo';
                        break;
                }

                openPurchaseModal(productName, productPrice);
            });
        });
    }

    // Satın Alma Modalını Açma Fonksiyonu
    function openPurchaseModal(productName, productPrice) {
        const modal = document.getElementById('purchaseModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');

        if (modal && modalTitle && modalDesc) {
            modalTitle.textContent = 'Buy ' + productName;
            modalDesc.textContent = 'You will be charged ' + productPrice + ' for the ' + productName + ' package.';

            modal.style.display = 'flex';
            modal.style.visibility = 'visible';

            // Animasyon için kısa bir gecikme
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.classList.add('active');
            }, 10);
            document.body.style.overflow = 'hidden'; // Sayfayı kaydırmayı engelle
        }
    }

    // Satın Alma Modalını Kapatma Fonksiyonu
    function closePurchaseModal() {
        const modal = document.getElementById('purchaseModal');
        modal.classList.remove('active');
        modal.style.opacity = '0';

        // Animasyon tamamlandıktan sonra gizle
        setTimeout(() => {
            modal.style.visibility = 'hidden';
            modal.style.display = 'none';
        }, 300); // Geçiş animasyonu için bekleme süresi
        document.body.style.overflow = 'auto'; // Sayfayı kaydırmayı etkinleştir
    }

    // Modal Kapatma İşlemi
    const closeModalBtn = document.querySelector('.close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePurchaseModal);
    }

    // Modal dışına tıklanınca kapat
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('purchaseModal');
        if (event.target === modal) {
            closePurchaseModal();
        }
    });

    // Satın Alma İşlemi
    const confirmPurchaseBtn = document.getElementById('confirmPurchase');
    if (confirmPurchaseBtn) {
        confirmPurchaseBtn.addEventListener('click', function () {
            const paymentOptions = document.querySelectorAll('input[name="payment"]');
            let selectedPayment = '';

            paymentOptions.forEach(option => {
                if (option.checked) {
                    selectedPayment = option.id;
                }
            });

            // Yükleniyor animasyonu
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
            this.disabled = true;

            // API çağrısı simülasyonu
            setTimeout(() => {
                closePurchaseModal();
                showSuccessNotification();

                // Butonu sıfırla
                setTimeout(() => {
                    this.innerHTML = 'Ödemeye Geç';
                    this.disabled = false;
                }, 1000);
            }, 2000);
        });
    }

    // Başarılı işlem bildirimi
    function showSuccessNotification() {
        // Mevcut bildirim varsa temizle
        const existingNotification = document.querySelector('.success-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Bildirim elementi oluştur
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="notification-content">
                <h4>Purchase Successful!</h4>
                <p>Your premium package has been activated. Enjoy the experience!</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Sayfaya ekle
        document.body.appendChild(notification);

        // Bildirim stili
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: 'rgba(30, 30, 46, 0.95)',
            borderLeft: '4px solid #4CAF50',
            padding: '15px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(120%)',
            transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: '1000',
            maxWidth: '400px',
            backdropFilter: 'blur(10px)'
        });

        // İkon stili
        const notificationIcon = notification.querySelector('.notification-icon');
        Object.assign(notificationIcon.style, {
            marginRight: '15px',
            fontSize: '24px',
            color: '#4CAF50'
        });

        // İçerik stili
        const notificationContent = notification.querySelector('.notification-content');
        Object.assign(notificationContent.style, {
            flex: '1'
        });

        // Başlık stili
        const notificationTitle = notification.querySelector('h4');
        Object.assign(notificationTitle.style, {
            margin: '0 0 5px 0',
            color: 'white',
            fontSize: '16px'
        });

        // Metin stili
        const notificationText = notification.querySelector('p');
        Object.assign(notificationText.style, {
            margin: '0',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px'
        });

        // Kapatma butonu stili
        const closeBtn = notification.querySelector('.notification-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '5px',
            marginLeft: '10px',
            transition: 'color 0.2s ease'
        });

        // Göster
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Otomatik kapanma
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);

        // Kapatma butonuna tıklama
        closeBtn.addEventListener('click', function () {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                notification.remove();
            }, 500);
        });
    }

    // Ürün kartları animasyonu
    function animateProducts() {
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach((card, index) => {
            // Kart animasyonu için gecikme
            setTimeout(() => {
                card.classList.add('animated');
            }, 100 * (index + 1));

            // Hover efektleri
            card.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-10px) scale(1.02)';
                this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                this.style.zIndex = '1';

                // Önce :before ele al
                this.classList.add('hover-glow');
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = '';
                this.style.boxShadow = '';
                this.style.zIndex = '';

                this.classList.remove('hover-glow');
            });
        });
    }

    // Tablo satırlarına hover efektleri
    const comparisonRows = document.querySelectorAll('.comparison-row:not(.header)');
    comparisonRows.forEach(row => {
        row.addEventListener('mouseenter', function () {
            this.style.backgroundColor = 'rgba(40, 40, 60, 0.8)';
        });

        row.addEventListener('mouseleave', function () {
            this.style.backgroundColor = '';
        });
    });

    // CSS stillerini ekle
    addStyles();

    function addStyles() {
        const styles = `
            .success-notification {
        position: fixed;
                bottom: 30px;
                right: 30px;
                background: rgba(30, 30, 46, 0.95);
                border-left: 4px solid #59E6A2;
                padding: 15px 20px;
                border-radius: 8px;
        display: flex;
        align-items: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                transform: translateX(120%);
                transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 1000;
                max-width: 400px;
                backdrop-filter: blur(10px);
            }
            
            .success-notification.show {
                transform: translateX(0);
            }
            
            .notification-icon {
                margin-right: 15px;
                font-size: 24px;
                color: #59E6A2;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-content h4 {
                margin: 0 0 5px 0;
                color: white;
                font-size: 16px;
            }
            
            .notification-content p {
        margin: 0;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
    }
    
            .notification-close {
        background: none;
        border: none;
                color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
                padding: 5px;
                margin-left: 10px;
                transition: color 0.2s ease;
            }
            
            .notification-close:hover {
                color: white;
            }
            
            .payment-options {
                margin-bottom: 20px;
            }
            
            .payment-option {
                background: rgba(30, 30, 46, 0.5);
                border-radius: 8px;
                padding: 12px 15px;
        margin-bottom: 10px;
        transition: all 0.2s ease;
    }
    
            .payment-option:hover {
                background: rgba(40, 40, 60, 0.8);
            }
            
            .payment-option input {
                display: none;
            }
            
            .payment-option label {
                display: flex;
                align-items: center;
                cursor: pointer;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .payment-option i {
                font-size: 20px;
                margin-right: 10px;
                width: 30px;
                text-align: center;
            }
            
            .payment-option input:checked + label {
                color: white;
            }
            
            .product-card.hover-glow::before {
                opacity: 1;
            }
            
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(140, 82, 255, 0.7);
                }
                
                70% {
                    box-shadow: 0 0 0 10px rgba(140, 82, 255, 0);
                }
                
                100% {
                    box-shadow: 0 0 0 0 rgba(140, 82, 255, 0);
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
    }

    // Sayfa kaydırma animasyonları
    const smoothScroll = function (target, duration) {
        const targetElement = document.querySelector(target);
        if (!targetElement) return;

        const targetPosition = targetElement.offsetTop - 100;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        const animation = function (currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        // Easing fonksiyonu
        const ease = function (t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        requestAnimationFrame(animation);
    };

    // Tüm kaydırma bağlantılarını bul
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    scrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            smoothScroll(target, 1000);
        });
    });

    // Ürünleri tıklandığında satın alma modalını açan fonksiyon
    function openPurchaseModal(productId, productTitle, productPrice, productImage) {
        const modal = document.getElementById('purchaseModal');
        const productTitleElement = document.getElementById('productTitle');
        const productImageElement = document.getElementById('productImage');
        const productPriceElement = document.getElementById('productPrice');
        const productIdInput = document.getElementById('productIdInput');

        if (modal && productTitleElement && productPriceElement && productImageElement && productIdInput) {
            productTitleElement.textContent = productTitle;
            productImageElement.src = productImage;
            productPriceElement.textContent = productPrice;
            productIdInput.value = productId;

            modal.style.display = 'flex';
            modal.style.visibility = 'visible';

            setTimeout(() => {
                modal.style.opacity = '1';
                modal.classList.add('active');
            }, 10);
            document.body.style.overflow = 'hidden';
        }
    }

    // Satın alma modalını kapatan fonksiyon
    function closePurchaseModal() {
        const modal = document.getElementById('purchaseModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.opacity = '0';

            setTimeout(() => {
                modal.style.visibility = 'hidden';
                modal.style.display = 'none';
            }, 300); // Geçiş efekti için gecikme
            document.body.style.overflow = 'auto';
        }
    }

    // Ürün kartlarına tıklama olayını ekleyerek modalı açan kod
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', function () {
            const productId = this.dataset.productId;
            const productTitle = this.querySelector('.product-title').textContent;
            const productPrice = this.querySelector('.product-price').textContent;
            const productImage = this.querySelector('.product-image').src;

            openPurchaseModal(productId, productTitle, productPrice, productImage);
        });
    });

    // Modal kapatma butonuna tıklanınca modalı kapatan kod
    const closeModalButton = document.querySelector('.close-modal');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function (e) {
            e.preventDefault();
            closePurchaseModal();
        });
    }

    // Modal dışına tıklanınca modalı kapatan kod
    const modalOverlay = document.getElementById('purchaseModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function (e) {
            if (e.target === this) {
                closePurchaseModal();
            }
        });
    }
});