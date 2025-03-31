document.addEventListener('DOMContentLoaded', function () {
    // DM Group toggle
    const dmGroupHeaders = document.querySelectorAll('.dm-group-header');
    dmGroupHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const group = this.closest('.dm-group');
            group.classList.toggle('collapsed');
        });
    });

    // Chat Type selektörleri için event listeners
    const chatTypeBtns = document.querySelectorAll('.chat-type-btn');
    const friendsGroup = document.getElementById('friends-group');
    const groupMessages = document.getElementById('group-messages');

    // Sayfa yüklendiğinde Normal Sohbet aktif olsun ve sadece arkadaşlar kısmı gösterilsin
    if (friendsGroup && groupMessages) {
        friendsGroup.style.display = 'block';
        groupMessages.style.display = 'none';
    }

    chatTypeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Aktif sınıfını kaldır
            chatTypeBtns.forEach(b => b.classList.remove('active'));
            // Tıklanan butona aktif sınıfını ekle
            this.classList.add('active');

            // Normal Sohbet veya Grup Sohbeti göster/gizle
            if (this.textContent.trim() === 'Normal Sohbet') {
                friendsGroup.style.display = 'block';
                groupMessages.style.display = 'none';
            } else if (this.textContent.trim() === 'Grup Sohbeti') {
                friendsGroup.style.display = 'none';
                groupMessages.style.display = 'block';
            }
        });
    });

    // Server Tooltips konumu ayarla
    const serverItems = document.querySelectorAll('.server-item');
    serverItems.forEach(item => {
        const tooltip = item.querySelector('.server-tooltip');
        if (tooltip) {
            item.addEventListener('mouseenter', function () {
                const itemRect = item.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                // Eğer tooltip viewport'un dışına çıkacaksa konumunu ayarla
                if (itemRect.top + tooltip.offsetHeight > viewportHeight) {
                    tooltip.style.top = 'auto';
                    tooltip.style.bottom = '0';
                } else {
                    tooltip.style.top = '50%';
                    tooltip.style.bottom = 'auto';
                }
            });
        }
    });

    // Mesaj butonu işlevi
    const messageButtons = document.querySelectorAll('.friend-action.message, .message-btn');
    messageButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Mesaj gönderme işlemi burada gerçekleştirilecek
            // Bildirim kaldırıldı

            const friendCard = this.closest('.friend-card');
            if (friendCard) {
                const friendName = friendCard.querySelector('.friend-card-name')?.textContent || 'Arkadaş';
                console.log(`${friendName} kişisine mesaj gönderiliyor...`);

                // Animasyon efekti
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 300);
            }
        });
    });

    // Kabul Et ve Reddet butonları için event listeners
    const acceptButtons = document.querySelectorAll('.friend-action.accept');
    const declineButtons = document.querySelectorAll('.friend-action.decline');

    acceptButtons.forEach(button => {
        button.addEventListener('click', function () {
            const friendCard = this.closest('.friend-card');

            // Animasyon sonrası kaldır
            setTimeout(() => {
                friendCard.style.opacity = '0';
                friendCard.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    friendCard.remove();
                }, 300);
            }, 500);
        });
    });

    declineButtons.forEach(button => {
        button.addEventListener('click', function () {
            const friendCard = this.closest('.friend-card');

            // Animasyon sonrası kaldır
            setTimeout(() => {
                friendCard.style.opacity = '0';
                friendCard.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    friendCard.remove();
                }, 300);
            }, 500);
        });
    });

    // Logout butonu işlevi
    const logoutButton = document.querySelector('.logout-icon');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        });
    }

    // Sponsor sunucu tıklama
    const sponsorServers = document.querySelectorAll('.sponsor-server');
    sponsorServers.forEach(server => {
        server.addEventListener('click', function () {
            // Sunucuya katılma işlemi burada gerçekleştirilecek
            // Bildirim kaldırıldı
        });
    });

    // Header arama işlevi
    const headerSearchInput = document.querySelector('.search-box input');
    if (headerSearchInput) {
        headerSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            const friendCards = document.querySelectorAll('.friend-card');
            const clearSearchBtn = document.querySelector('.clear-search');

            // Arama temizleme butonunu göster/gizle
            clearSearchBtn.style.display = this.value.length > 0 ? 'block' : 'none';

            if (searchTerm.length === 0) {
                // Arama kutusu boşsa tüm kartları göster
                friendCards.forEach(card => {
                    card.style.display = 'block';
                });
                return;
            }

            friendCards.forEach(card => {
                const friendName = card.querySelector('.friend-name').textContent.toLowerCase();
                const friendTag = card.querySelector('.friend-tag')?.textContent.toLowerCase() || '';

                if (friendName.includes(searchTerm) || friendTag.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });

        // Enter tuşuna basıldığında arama işlemini gerçekleştir
        headerSearchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                // Arama işlemi burada gerçekleştirilecek
                // Bildirim kaldırıldı
                e.preventDefault();
            }
        });

        // Arama temizleme butonu işlevi
        const clearSearchBtn = document.querySelector('.clear-search');
        clearSearchBtn.addEventListener('click', function () {
            headerSearchInput.value = '';
            headerSearchInput.focus();
            this.style.display = 'none';

            // Tüm arkadaş kartlarını yeniden göster
            document.querySelectorAll('.friend-card').forEach(card => {
                card.style.display = 'block';
            });
        });
    }

    // Arkadaş Ekle butonu işlevi
    const addFriendBtn = document.querySelector('.add-friend');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', function () {
            // Modal veya popup açılabilir
            createAddFriendModal();
        });
    }

    // Arkadaş ekleme modalı oluştur
    function createAddFriendModal() {
        const modal = document.createElement('div');
        modal.className = 'add-friend-modal';
        modal.innerHTML = `
            <div class="add-friend-modal-content">
                <div class="add-friend-modal-header">
                    <div class="modal-header-left">
                        <i class="fas fa-user-plus modal-icon"></i>
                        <h3>Arkadaş Ekle</h3>
                    </div>
                    <div class="modal-header-right">
                        <i class="fas fa-times close-modal"></i>
                    </div>
                </div>
                <div class="add-friend-modal-body">
                    <div class="section-info">
                        <p>Chatlify'da birini arkadaş olarak eklemek için kullanıcı adını girin. Büyük/küçük harfe duyarlıdır.</p>
                    </div>
                    
                    <div class="add-friend-input-container">
                        <div class="input-wrapper">
                            <i class="fas fa-at"></i>
                            <input type="text" placeholder="Kullanıcıadı" class="add-friend-input">
                        </div>
                        <button class="add-friend-submit">
                            <i class="fas fa-paper-plane"></i>
                            <span>Arkadaşlık İsteği Gönder</span>
                        </button>
                    </div>
                    
                    <div class="friend-request-note">
                        <i class="fas fa-info-circle"></i>
                        <span>Doğru kullanıcıyı bulduğunuzdan emin olmak için doğru kullanıcı adını girin.</span>
                    </div>
                    
                    <div class="qr-code-section">
                        <div class="qr-code-info">
                            <h4>QR Kodu ile Arkadaş Ekle</h4>
                            <p>Arkadaşınızın kamerasıyla tarayabileceği QR kod</p>
                            <button class="qr-show-button">
                                <i class="fas fa-qrcode"></i>
                                <span>QR Kodumu Göster</span>
                            </button>
                        </div>
                        <div class="qr-code-image">
                            <div class="qr-placeholder">
                                <i class="fas fa-qrcode"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Modal stil ekle
        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .add-friend-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(11, 15, 33, 0.85);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(6px);
            }
            
            .add-friend-modal.show {
                opacity: 1;
            }
            
            .add-friend-modal-content {
                background: linear-gradient(145deg, #1a2036, #15192c);
                width: 480px;
                max-width: 92%;
                border-radius: 12px;
                box-shadow: 0 8px 35px rgba(0, 0, 0, 0.5);
                animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                transform: scale(0.9);
                overflow: hidden;
                border: 1px solid rgba(94, 114, 228, 0.15);
            }
            
            @keyframes scaleIn {
                to {
                    transform: scale(1);
                }
            }
            
            .add-friend-modal-header {
                padding: 20px 24px;
                border-bottom: 1px solid rgba(94, 114, 228, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(21, 25, 42, 0.7);
            }
            
            .modal-header-left {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .modal-icon {
                font-size: 18px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #5e72e4, #825ee4);
                color: white;
                box-shadow: 0 4px 10px rgba(94, 114, 228, 0.3);
            }
            
            .add-friend-modal-header h3 {
                margin: 0;
                color: white;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 0.01em;
            }
            
            .close-modal {
                cursor: pointer;
                color: #6c7293;
                transition: all 0.2s ease;
                font-size: 16px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(24, 27, 41, 0.4);
            }
            
            .close-modal:hover {
                color: white;
                background: rgba(255, 82, 82, 0.2);
                transform: rotate(90deg);
            }
            
            .add-friend-modal-body {
                padding: 24px;
            }
            
            .section-info {
                margin-bottom: 20px;
            }
            
            .section-info p {
                color: #9ba3c2;
                margin: 0;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .add-friend-input-container {
                margin-bottom: 20px;
            }
            
            .input-wrapper {
                display: flex;
                align-items: center;
                background: rgba(15, 19, 34, 0.7);
                border: 1px solid rgba(94, 114, 228, 0.2);
                border-radius: 8px;
                padding: 0 15px;
                margin-bottom: 12px;
                transition: all 0.3s ease;
            }
            
            .input-wrapper:focus-within {
                border-color: rgba(94, 114, 228, 0.8);
                box-shadow: 0 0 0 3px rgba(94, 114, 228, 0.1);
            }
            
            .input-wrapper i {
                color: #6c7293;
                font-size: 16px;
                margin-right: 10px;
                transition: color 0.3s ease;
            }
            
            .input-wrapper:focus-within i {
                color: #5e72e4;
            }
            
            .add-friend-input {
                background: transparent;
                border: none;
                color: white;
                padding: 15px 0;
                font-size: 15px;
                width: 100%;
                outline: none;
                font-family: 'Poppins', sans-serif;
            }
            
            .add-friend-input::placeholder {
                color: #6c7293;
                transition: color 0.3s ease;
            }
            
            .add-friend-input:focus::placeholder {
                color: rgba(255, 255, 255, 0.3);
            }
            
            .add-friend-submit {
                background: linear-gradient(135deg, #5e72e4, #825ee4);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 0 4px 10px rgba(94, 114, 228, 0.3);
                width: 100%;
            }
            
            .add-friend-submit:hover {
                background: linear-gradient(135deg, #4a5ed0, #7048d0);
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(94, 114, 228, 0.4);
            }
            
            .add-friend-submit i {
                font-size: 14px;
            }
            
            .friend-request-note {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                background: rgba(15, 19, 34, 0.5);
                padding: 14px;
                border-radius: 8px;
                margin-bottom: 24px;
            }
            
            .friend-request-note i {
                color: #5e72e4;
                font-size: 16px;
                margin-top: 2px;
            }
            
            .friend-request-note span {
                color: #9ba3c2;
                font-size: 13px;
                line-height: 1.5;
            }
            
            .qr-code-section {
                display: flex;
                align-items: center;
                gap: 15px;
                background: rgba(15, 19, 34, 0.5);
                padding: 20px;
                border-radius: 10px;
                border: 1px solid rgba(94, 114, 228, 0.1);
            }
            
            .qr-code-info {
                flex: 1;
            }
            
            .qr-code-info h4 {
                margin: 0 0 8px 0;
                color: white;
                font-size: 16px;
                font-weight: 600;
            }
            
            .qr-code-info p {
                color: #9ba3c2;
                margin: 0 0 15px 0;
                font-size: 13px;
            }
            
            .qr-show-button {
                background: rgba(94, 114, 228, 0.15);
                color: #5e72e4;
                border: 1px solid rgba(94, 114, 228, 0.3);
                padding: 8px 14px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                width: fit-content;
            }
            
            .qr-show-button:hover {
                background: rgba(94, 114, 228, 0.25);
                border-color: rgba(94, 114, 228, 0.5);
            }
            
            .qr-code-image {
                width: 100px;
                height: 100px;
                flex-shrink: 0;
            }
            
            .qr-placeholder {
                width: 100%;
                height: 100%;
                background: rgba(15, 19, 34, 0.8);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .qr-placeholder i {
                font-size: 40px;
                color: #5e72e4;
                opacity: 0.6;
            }
            
            @media (max-width: 576px) {
                .add-friend-modal-header {
                    padding: 16px 20px;
                }
                
                .add-friend-modal-body {
                    padding: 20px;
                }
                
                .qr-code-section {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .qr-code-image {
                    width: 120px;
                    height: 120px;
                    margin-top: 10px;
                    align-self: center;
                }
            }
        `;
        document.head.appendChild(modalStyle);

        // Modal göster
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Kapatma olayları
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                modalStyle.remove();
            }, 300);
        };

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        // QR Gösterme butonu
        const qrShowButton = modal.querySelector('.qr-show-button');
        if (qrShowButton) {
            qrShowButton.addEventListener('click', function () {
                const qrPlaceholder = modal.querySelector('.qr-placeholder');
                qrPlaceholder.innerHTML = `
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=chatlify-user-${Date.now()}" alt="QR Code" style="width: 100%; height: 100%; border-radius: 8px;">
                `;
                this.textContent = 'QR Kod Gösteriliyor';
                this.style.pointerEvents = 'none';
                this.style.opacity = '0.7';
            });
        }

        // İstek gönderme
        const addFriendSubmit = modal.querySelector('.add-friend-submit');
        const addFriendInput = modal.querySelector('.add-friend-input');

        addFriendSubmit.addEventListener('click', () => {
            const username = addFriendInput.value.trim();
            if (username) {
                closeModal();
                // İstek gönderildi
            } else {
                // Input'u sallar
                addFriendInput.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
                addFriendInput.style.borderColor = 'rgba(255, 82, 82, 0.7)';
                addFriendInput.focus();

                // Animasyonu temizle
                setTimeout(() => {
                    addFriendInput.style.animation = '';
                    addFriendInput.style.borderColor = '';
                }, 500);
            }
        });

        addFriendInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                addFriendSubmit.click();
            }
        });

        // Shake animasyonu ekle
        const shakeStyle = document.createElement('style');
        shakeStyle.textContent = `
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
                40%, 60% { transform: translate3d(3px, 0, 0); }
            }
        `;
        document.head.appendChild(shakeStyle);

        // Modal kapatıldığında shake stilini de kaldır
        modal.addEventListener('transitionend', function (e) {
            if (e.propertyName === 'opacity' && !modal.classList.contains('show')) {
                shakeStyle.remove();
            }
        });
    }

    // Ayarlar butonuna tıklandığında settings.html sayfasına yönlendirme
    const settingsButton = document.querySelector('.server-settings-icon').parentElement;
    if (settingsButton) {
        settingsButton.addEventListener('click', function () {
            setTimeout(() => {
                window.location.href = 'settings.html';
            }, 300);
        });
    }

    // Tab işlevselliği
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Aktif tab'ı güncelle
            document.querySelector('.tab.active').classList.remove('active');
            this.classList.add('active');

            // Tab içeriğini güncelle (gerçek bir uygulamada)
            // Örneğin: Çevrimiçi/Tüm Arkadaşlar/Bekleyen vb.
        });
    });

    // Çevrimdışı arkadaşlara mesaj gönderme işlevselliği
    document.querySelectorAll('.offline-friends-title + .friends-list .friend-action.message').forEach(button => {
        button.addEventListener('click', function () {
            // Mesaj gönderme işlemi burada gerçekleştirilecek
            // Bildirim kaldırıldı
        });
    });

    // Sesli arama butonu işlevi 
    const voiceButtons = document.querySelectorAll('.voice-btn');
    voiceButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Sesli arama işlemi burada gerçekleştirilecek
            const friendCard = this.closest('.friend-card');
            if (friendCard) {
                const friendName = friendCard.querySelector('.friend-card-name')?.textContent || 'Arkadaş';
                console.log(`${friendName} kişisi aranıyor...`);

                // Animasyon efekti
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 300);
            }
        });
    });

    // Diğer (more) butonu işlevi 
    const moreButtons = document.querySelectorAll('.more-btn');
    moreButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Burada dropdown menü veya ek işlemler uygulanabilir
            console.log('Diğer işlemler menüsü');

            // Dropdown menü oluşturmak için örnek
            const friendCard = this.closest('.friend-card');
            if (friendCard) {
                // Eğer zaten bir dropdown varsa kaldır
                const existingDropdown = document.querySelector('.friend-dropdown');
                if (existingDropdown) {
                    existingDropdown.remove();
                    return;
                }

                const friendName = friendCard.querySelector('.friend-card-name')?.textContent || 'Arkadaş';

                const dropdown = document.createElement('div');
                dropdown.className = 'friend-dropdown';
                dropdown.innerHTML = `
                    <div class="dropdown-item"><i class="fas fa-user-plus"></i> Favorilere Ekle</div>
                    <div class="dropdown-item"><i class="fas fa-user-minus"></i> Arkadaşlıktan Çıkar</div>
                    <div class="dropdown-item"><i class="fas fa-ban"></i> Engelle</div>
                `;

                // Dropdown'u konumlandır
                const rect = this.getBoundingClientRect();
                dropdown.style.position = 'absolute';
                dropdown.style.top = `${rect.bottom + 5}px`;
                dropdown.style.right = `${window.innerWidth - rect.right}px`;
                dropdown.style.zIndex = '9999';

                document.body.appendChild(dropdown);

                // Dropdown dışına tıklandığında kapat
                document.addEventListener('click', function closeDropdown(e) {
                    if (!dropdown.contains(e.target) && e.target !== button) {
                        dropdown.remove();
                        document.removeEventListener('click', closeDropdown);
                    }
                });

                // Dropdown stil ekle
                const dropdownStyle = document.createElement('style');
                dropdownStyle.textContent = `
                    .friend-dropdown {
                        background: rgba(15, 19, 34, 0.95);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                        width: 200px;
                        overflow: hidden;
                        animation: fadeScale 0.2s ease forwards;
                    }
                    
                    .dropdown-item {
                        padding: 12px 16px;
                        color: var(--text-secondary);
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .dropdown-item:hover {
                        background: rgba(255, 255, 255, 0.05);
                        color: var(--text-color);
                    }
                    
                    .dropdown-item:last-child {
                        color: var(--danger-color);
                    }
                    
                    .dropdown-item:last-child:hover {
                        background: rgba(255, 82, 82, 0.1);
                    }
                `;
                document.head.appendChild(dropdownStyle);
            }
        });
    });

    // Arkadaş bölümlerini genişletme/daraltma
    const sectionControls = document.querySelectorAll('.section-control');
    sectionControls.forEach(control => {
        control.addEventListener('click', function () {
            const section = this.closest('.friends-section');
            if (section) {
                section.classList.toggle('collapsed');

                // İkon animasyonu
                const icon = this.querySelector('i');
                if (section.classList.contains('collapsed')) {
                    icon.style.transform = 'rotate(-90deg)';
                } else {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
    });

    // Filtre işlevselliği
    const filterItems = document.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
        item.addEventListener('click', function () {
            // Aktif filtreyi güncelle
            document.querySelector('.filter-item.active').classList.remove('active');
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            const friendCards = document.querySelectorAll('.friend-card');

            if (filter === 'all') {
                // Tüm sekmeleri göster
                document.querySelector('.online-section').style.display = 'block';
                document.querySelector('.offline-section').style.display = 'block';
            } else if (filter === 'online') {
                // Sadece çevrimiçi olanları göster
                document.querySelector('.online-section').style.display = 'block';
                document.querySelector('.offline-section').style.display = 'none';
            } else if (filter === 'offline') {
                // Sadece çevrimdışı olanları göster
                document.querySelector('.online-section').style.display = 'none';
                document.querySelector('.offline-section').style.display = 'block';
            }
        });
    });

    // Arkadaş arama işlevi
    const friendsSearch = document.querySelector('.friends-search');
    if (friendsSearch) {
        friendsSearch.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            const friendCards = document.querySelectorAll('.friend-card');

            friendCards.forEach(card => {
                const friendName = card.querySelector('.friend-card-name').textContent.toLowerCase();
                const friendActivity = card.querySelector('.friend-card-activity').textContent.toLowerCase();

                if (friendName.includes(searchTerm) || friendActivity.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });

            // Boş bölümleri gizle
            const sections = document.querySelectorAll('.friends-section');
            sections.forEach(section => {
                const visibleCards = section.querySelectorAll('.friend-card[style="display: flex;"]');
                if (visibleCards.length === 0) {
                    section.style.display = 'none';
                } else {
                    section.style.display = 'block';
                }
            });

            // Arama sonucuna göre sayaçları güncelle
            updateFriendCounters();
        });
    }

    // Arkadaş sayaçlarını güncelle
    function updateFriendCounters() {
        const onlineSection = document.querySelector('.online-section');
        const offlineSection = document.querySelector('.offline-section');

        if (onlineSection) {
            const visibleOnlineFriends = onlineSection.querySelectorAll('.friend-card[style="display: flex;"]');
            const onlineCounter = onlineSection.querySelector('.friend-count');
            if (onlineCounter) {
                onlineCounter.textContent = visibleOnlineFriends.length;
            }
        }

        if (offlineSection) {
            const visibleOfflineFriends = offlineSection.querySelectorAll('.friend-card[style="display: flex;"]');
            const offlineCounter = offlineSection.querySelector('.friend-count');
            if (offlineCounter) {
                offlineCounter.textContent = visibleOfflineFriends.length;
            }
        }
    }

    // Arkadaş satırında hover durumunda butonların gösterilmesi
    const friendRows = document.querySelectorAll('.friend-row');
    friendRows.forEach(row => {
        // Mobil cihazlar için dokunma olayına uygun hale getirme
        row.addEventListener('touchstart', function () {
            this.classList.add('touch-hover');
        });

        row.addEventListener('touchend', function () {
            setTimeout(() => {
                this.classList.remove('touch-hover');
            }, 500);
        });
    });
}); 