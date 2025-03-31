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
    const messageButtons = document.querySelectorAll('.friend-action.message');
    messageButtons.forEach(button => {
        button.addEventListener('click', function () {
            const friendName = this.closest('.friend-card').querySelector('.friend-name').textContent;
            showNotification(`${friendName} ile bir sohbet başlatıldı.`, 'success');
        });
    });

    // Kabul Et ve Reddet butonları için event listeners
    const acceptButtons = document.querySelectorAll('.friend-action.accept');
    const declineButtons = document.querySelectorAll('.friend-action.decline');

    acceptButtons.forEach(button => {
        button.addEventListener('click', function () {
            const friendCard = this.closest('.friend-card');
            const friendName = friendCard.querySelector('.friend-name').textContent;
            showNotification(`${friendName}'in arkadaşlık isteği kabul edildi.`, 'success');

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
            const friendName = friendCard.querySelector('.friend-name').textContent;
            showNotification(`${friendName}'in arkadaşlık isteği reddedildi.`, 'error');

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
            showNotification('Çıkış yapılıyor...', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }

    // Sponsor sunucu tıklama
    const sponsorServers = document.querySelectorAll('.sponsor-server');
    sponsorServers.forEach(server => {
        server.addEventListener('click', function () {
            const serverName = this.querySelector('.sponsor-server-name').textContent;
            showNotification(`${serverName} sunucusuna katılmak için yönlendiriliyorsunuz...`, 'info');
        });
    });

    // Header arama işlevi
    const headerSearchInput = document.querySelector('.header-search input');
    if (headerSearchInput) {
        headerSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            const friendCards = document.querySelectorAll('.friend-card');

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
                const searchTerm = this.value.trim();
                if (searchTerm.length > 0) {
                    showNotification(`"${searchTerm}" için arkadaşlar aranıyor...`, 'info');
                }
                e.preventDefault();
            }
        });

        // Arama çubuğunu temizlemek için çarpı simgesi ekle
        const searchContainer = document.querySelector('.search-container');
        const clearSearchBtn = document.createElement('i');
        clearSearchBtn.className = 'fas fa-times clear-search';
        clearSearchBtn.style.display = 'none';
        clearSearchBtn.style.cursor = 'pointer';
        clearSearchBtn.style.color = '#6c7293';
        clearSearchBtn.style.marginLeft = '5px';
        clearSearchBtn.style.fontSize = '12px';
        searchContainer.appendChild(clearSearchBtn);

        headerSearchInput.addEventListener('input', function () {
            clearSearchBtn.style.display = this.value.length > 0 ? 'block' : 'none';
        });

        clearSearchBtn.addEventListener('click', function () {
            headerSearchInput.value = '';
            headerSearchInput.focus();
            clearSearchBtn.style.display = 'none';

            // Tüm arkadaş kartlarını yeniden göster
            document.querySelectorAll('.friend-card').forEach(card => {
                card.style.display = 'block';
            });
        });
    }

    // Arkadaş Ekle butonu işlevi
    const addFriendBtn = document.querySelector('.add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', function () {
            // Modal veya popup açılabilir, şu an için bildirim gösterelim
            showNotification('Arkadaşlık isteği gönderme paneli açıldı', 'info');

            // Örnek modal gösterimi (gerçek bir uygulamada burada modal açılır)
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
                    <h3>Arkadaş Ekle</h3>
                    <i class="fas fa-times close-modal"></i>
                </div>
                <div class="add-friend-modal-body">
                    <p>Chatlify'da birini arkadaş olarak eklemek için kullanıcı adını ve etiketini girin.</p>
                    <div class="add-friend-input-container">
                        <input type="text" placeholder="Kullanıcıadı#0000" class="add-friend-input">
                        <button class="add-friend-submit">Arkadaşlık İsteği Gönder</button>
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
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .add-friend-modal.show {
                opacity: 1;
            }
            
            .add-friend-modal-content {
                background: #1a2036;
                width: 450px;
                max-width: 90%;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                animation: scaleIn 0.3s ease forwards;
                transform: scale(0.9);
            }
            
            @keyframes scaleIn {
                to {
                    transform: scale(1);
                }
            }
            
            .add-friend-modal-header {
                padding: 15px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .add-friend-modal-header h3 {
                margin: 0;
                color: white;
                font-size: 18px;
                font-weight: 600;
            }
            
            .close-modal {
                cursor: pointer;
                color: #6c7293;
                transition: color 0.2s ease;
                font-size: 16px;
            }
            
            .close-modal:hover {
                color: white;
            }
            
            .add-friend-modal-body {
                padding: 20px;
            }
            
            .add-friend-modal-body p {
                color: #6c7293;
                margin-top: 0;
                margin-bottom: 15px;
            }
            
            .add-friend-input-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .add-friend-input {
                background: rgba(24, 27, 41, 1);
                border: 1px solid rgba(87, 96, 235, 0.3);
                border-radius: 4px;
                color: white;
                padding: 12px 15px;
                font-size: 14px;
                outline: none;
                transition: all 0.3s ease;
            }
            
            .add-friend-input:focus {
                border-color: rgba(87, 96, 235, 0.8);
                box-shadow: 0 0 0 2px rgba(87, 96, 235, 0.15);
            }
            
            .add-friend-submit {
                background: linear-gradient(135deg, #5e72e4, #825ee4);
                color: white;
                border: none;
                padding: 12px;
                border-radius: 4px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .add-friend-submit:hover {
                background: linear-gradient(135deg, #4a5ed0, #7048d0);
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

        // İstek gönderme
        const addFriendSubmit = modal.querySelector('.add-friend-submit');
        const addFriendInput = modal.querySelector('.add-friend-input');

        addFriendSubmit.addEventListener('click', () => {
            const username = addFriendInput.value.trim();
            if (username) {
                showNotification(`${username} kullanıcısına arkadaşlık isteği gönderildi.`, 'success');
                closeModal();
            } else {
                showNotification('Lütfen geçerli bir kullanıcı adı girin.', 'error');
            }
        });

        addFriendInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                addFriendSubmit.click();
            }
        });
    }

    // Ayarlar butonuna tıklandığında settings.html sayfasına yönlendirme
    const settingsButton = document.querySelector('.server-settings-icon').parentElement;
    if (settingsButton) {
        settingsButton.addEventListener('click', function () {
            showNotification('Ayarlar sayfasına yönlendiriliyorsunuz...', 'info');
            setTimeout(() => {
                window.location.href = 'settings.html';
            }, 1000);
        });
    }

    // Bildirim gösterme fonksiyonu
    function showNotification(message, type = 'info') {
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

    // Bildirim stili
    const notificationStyle = document.createElement('style');
    notificationStyle.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: rgba(23, 32, 57, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            max-width: 350px;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        }
        
        .notification.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
        }
        
        .notification i {
            margin-right: 10px;
            font-size: 20px;
        }
        
        .notification.success i {
            color: var(--success-color);
        }
        
        .notification.error i {
            color: var(--danger-color);
        }
        
        .notification.warning i {
            color: #ffc107;
        }
        
        .notification.info i {
            color: var(--primary-color);
        }
    `;

    document.head.appendChild(notificationStyle);

    // Main Tabs işlevselliği
    const mainTabs = document.querySelectorAll('.main-tab');
    mainTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Aktif tab'ı güncelle
            document.querySelector('.main-tab.active').classList.remove('active');
            this.classList.add('active');

            const tabText = this.textContent.trim();
            showNotification(`${tabText} sekmesi seçildi`, 'info');

            // Tab içeriğini güncelle (gerçek bir uygulamada)
            // Örneğin: Çevrimiçi/Tüm Arkadaşlar/Bekleyen vb.
        });
    });

    // Çevrimdışı arkadaşlara mesaj gönderme işlevselliği
    document.querySelectorAll('.offline-friends-title + .friends-list .friend-action.message').forEach(button => {
        button.addEventListener('click', function () {
            const friendName = this.closest('.friend-card').querySelector('.friend-name').textContent;
            showNotification(`${friendName} şu anda çevrimdışı. Mesajınız iletilecek.`, 'info');
        });
    });
}); 