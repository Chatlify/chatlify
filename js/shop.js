document.addEventListener('DOMContentLoaded', function () {
    // Sayfa ilk açıldığında modalın gösterilmemesi için başlangıçta kontrol ediyoruz
    const modal = document.getElementById('purchaseModal');
    modal.classList.remove('active'); // Yanlışlıkla aktif kalmış olabilecek modali kapatıyoruz

    // Ürün Kartı Animasyonları
    animateProducts();

    // Satın Al butonlarına tıklama işlemi
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productType = this.getAttribute('data-product');
            let productName, productPrice;

            switch (productType) {
                case 'nova':
                    productName = 'Nova Premium';
                    productPrice = '$7.99';
                    break;
                case 'blaze':
                    productName = 'Blaze Standart';
                    productPrice = '$4.99';
                    break;
                case 'spark':
                    productName = 'Spark Başlangıç';
                    productPrice = '$2.99';
                    break;
            }

            openPurchaseModal(productName, productPrice);
        });
    });

    // Satın Alma Modalını Açma Fonksiyonu
    function openPurchaseModal(productName, productPrice) {
        const modal = document.getElementById('purchaseModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');

        modalTitle.textContent = productName + ' Satın Al';
        modalDesc.textContent = productName + ' paketi için ' + productPrice + '/ay ödeme yapacaksınız.';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Sayfayı kaydırmayı engelle
    }

    // Modal Kapatma İşlemi
    const closeModalBtn = document.querySelector('.close-modal-btn');
    closeModalBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Event'i engelliyoruz
        e.stopPropagation(); // Event'in diğer elementlere yayılmasını engelliyoruz
        closeModal();
    });

    function closeModal() {
        const modal = document.getElementById('purchaseModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Sayfayı kaydırmayı etkinleştir
    }

    // Modal dışına tıklanınca kapat
    const modalOverlay = document.getElementById('purchaseModal');
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Satın Alma İşlemi
    const confirmPurchaseBtn = document.getElementById('confirmPurchase');
    confirmPurchaseBtn.addEventListener('click', function () {
        const selectedPayment = document.querySelector('input[name="payment"]:checked').id;

        // Yükleniyor animasyonu
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
        this.disabled = true;

        // API çağrısı simülasyonu
        setTimeout(() => {
            closeModal();
            showSuccessNotification();

            // Butonu sıfırla
            setTimeout(() => {
                this.innerHTML = 'Ödemeye Geç';
                this.disabled = false;
            }, 1000);
        }, 2000);
    });

    // Başarılı işlem bildirimi
    function showSuccessNotification() {
        // Bildirim elementi oluştur
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="notification-content">
                <h4>Satın Alma İşlemi Başarılı!</h4>
                <p>Paketiniz hesabınıza tanımlandı. İyi eğlenceler!</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Sayfaya ekle
        document.body.appendChild(notification);

        // Göster
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Otomatik kapanma
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);

        // Kapatma butonuna tıklama
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function () {
            notification.classList.remove('show');
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
}); 