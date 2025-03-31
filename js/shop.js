document.addEventListener('DOMContentLoaded', function () {
    // Butona tıklandığında efektler
    const buttons = document.querySelectorAll('.booster-button');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            // Butona tıklandığında basma animasyonu
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);

            const boosterType = this.classList.contains('nova-button') ? 'Nova' : 'Blaze';
            const price = boosterType === 'Nova' ? '$2.00' : '$1.00';

            // Satın alma onay modalı
            showPurchaseModal(boosterType, price);
        });
    });

    // Kartlar için hover efektleri
    const cards = document.querySelectorAll('.booster-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.2)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
    });

    // Satın alma onay modalı göster
    function showPurchaseModal(boosterType, price) {
        // Eğer zaten modal varsa kaldır
        const existingModal = document.querySelector('.purchase-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Modal oluştur
        const modal = document.createElement('div');
        modal.className = 'purchase-modal';

        // Modal içeriği
        modal.innerHTML = `
            <div class="modal-content ${boosterType.toLowerCase()}-modal">
                <div class="modal-header">
                    <h3>${boosterType} Güçlendirici Satın Al</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p><strong>${boosterType} Güçlendiriciyi</strong> ${price} karşılığında satın almak istediğinizden emin misiniz?</p>
                    <div class="payment-methods">
                        <div class="payment-method">
                            <input type="radio" name="payment" id="credit-card" checked>
                            <label for="credit-card">
                                <i class="fas fa-credit-card"></i> Kredi Kartı
                            </label>
                        </div>
                        <div class="payment-method">
                            <input type="radio" name="payment" id="paypal">
                            <label for="paypal">
                                <i class="fab fa-paypal"></i> PayPal
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-button">İptal</button>
                    <button class="confirm-button ${boosterType.toLowerCase()}-confirm">Satın Al</button>
                </div>
            </div>
        `;

        // Modalı sayfaya ekle
        document.body.appendChild(modal);

        // Modal animasyonu
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Modal kapatma işlevi
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        };

        // Kapatma butonuna tıklama
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('.cancel-button').addEventListener('click', closeModal);

        // Boş alana tıklama ile kapat
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Satın alma işlemi
        modal.querySelector('.confirm-button').addEventListener('click', function () {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
            this.disabled = true;

            // Satın alma simülasyonu
            setTimeout(() => {
                closeModal();
                showSuccessMessage(boosterType);

                // Bakiyeyi güncelle
                updateBalance(price);
            }, 1500);
        });
    }

    // Başarılı satın alma mesajı
    function showSuccessMessage(boosterType) {
        // Başarı mesajı göster
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div class="success-icon"><i class="fas fa-check-circle"></i></div>
            <div class="success-text">
                <h4>${boosterType} Güçlendirici Satın Alındı!</h4>
                <p>Güçlendirici hesabınıza tanımlandı. Hemen kullanmaya başlayabilirsiniz.</p>
            </div>
        `;

        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.classList.add('show');
        }, 10);

        // 5 saniye sonra mesajı kaldır
        setTimeout(() => {
            successMessage.classList.remove('show');
            setTimeout(() => {
                successMessage.remove();
            }, 300);
        }, 5000);
    }

    // Bakiyeyi güncelle
    function updateBalance(price) {
        const balanceElement = document.querySelector('.user-balance strong');
        const currentBalance = parseFloat(balanceElement.textContent.replace('$', ''));
        const purchaseAmount = parseFloat(price.replace('$', ''));

        // Yeni bakiyeyi hesapla
        const newBalance = (currentBalance - purchaseAmount).toFixed(2);

        // Bakiyeyi güncelle
        balanceElement.textContent = `$${newBalance}`;

        // Bakiye animasyonu
        balanceElement.classList.add('balance-updated');
        setTimeout(() => {
            balanceElement.classList.remove('balance-updated');
        }, 1000);
    }

    // Sayfa yüklendiğinde animasyonlar
    animateElements();

    function animateElements() {
        const novaCard = document.querySelector('.booster-card.nova');
        const blazeCard = document.querySelector('.booster-card.blaze');

        // Kartların animasyonla görünmesi
        setTimeout(() => {
            novaCard.style.opacity = '1';
            novaCard.style.transform = 'scale(1.05) translateY(0)';
        }, 300);

        setTimeout(() => {
            blazeCard.style.opacity = '1';
            blazeCard.style.transform = 'translateY(0)';
        }, 500);
    }

    // Yatay kaydırma devre dışı
    document.querySelector('.main-content').addEventListener('wheel', function (e) {
        e.preventDefault();
        this.scrollTop += e.deltaY;
    });
});

// CSS stil ekle
const style = document.createElement('style');
style.textContent = `
    .purchase-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .purchase-modal.show {
        opacity: 1;
    }
    
    .modal-content {
        background-color: var(--dm-bg);
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }
    
    .purchase-modal.show .modal-content {
        transform: scale(1);
    }
    
    .nova-modal {
        border-top: 5px solid var(--nova-primary);
    }
    
    .blaze-modal {
        border-top: 5px solid var(--blaze-primary);
    }
    
    .modal-header {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 20px;
        color: var(--text-color);
    }
    
    .modal-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 18px;
        cursor: pointer;
    }
    
    .modal-close:hover {
        color: var(--text-color);
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .modal-body p {
        margin-top: 0;
        color: var(--text-color);
    }
    
    .payment-methods {
        margin-top: 20px;
    }
    
    .payment-method {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
    }
    
    .payment-method input {
        margin-right: 10px;
    }
    
    .payment-method label {
        color: var(--text-color);
        cursor: pointer;
    }
    
    .payment-method i {
        margin-right: 8px;
    }
    
    .modal-footer {
        padding: 15px 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .cancel-button {
        background-color: rgba(255, 255, 255, 0.08);
        color: var(--text-color);
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .cancel-button:hover {
        background-color: rgba(255, 255, 255, 0.12);
    }
    
    .confirm-button {
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        color: white;
        transition: all 0.2s ease;
    }
    
    .nova-confirm {
        background: linear-gradient(135deg, var(--nova-primary), var(--nova-secondary));
    }
    
    .blaze-confirm {
        background: linear-gradient(135deg, var(--blaze-primary), var(--blaze-secondary));
    }
    
    .confirm-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    }
    
    .confirm-button:active {
        transform: translateY(0);
    }
    
    .booster-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease;
    }
    
    .booster-card.nova {
        transform: scale(1.05) translateY(20px);
    }
    
    .success-message {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        padding: 16px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        color: white;
        z-index: 1000;
        transform: translateX(120%);
        transition: transform 0.3s ease;
    }
    
    .success-message.show {
        transform: translateX(0);
    }
    
    .success-icon {
        font-size: 24px;
        margin-right: 15px;
    }
    
    .success-text h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
    }
    
    .success-text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
    }
    
    .balance-updated {
        animation: flash 1s;
    }
    
    @keyframes flash {
        0%, 100% { color: var(--text-color); }
        50% { color: #f1c40f; }
    }
    
    @media (max-width: 576px) {
        .modal-content {
            width: 95%;
        }
        
        .success-message {
            left: 20px;
            right: 20px;
            bottom: 20px;
            transform: translateY(120%);
        }
        
        .success-message.show {
            transform: translateY(0);
        }
    }
`;

document.head.appendChild(style); 