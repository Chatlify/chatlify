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

    // Yeni header arama işlevi ve temizleme butonu
    const headerSearchInput = document.querySelector('.header-search input');
    const searchClearBtn = document.querySelector('.search-clear');

    if (headerSearchInput && searchClearBtn) {
        // Arama alanı işlevi
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

        // Arama temizleme butonu işlevi
        searchClearBtn.addEventListener('click', function () {
            headerSearchInput.value = '';
            headerSearchInput.focus();

            // Tüm arkadaş kartlarını göster
            document.querySelectorAll('.friend-card').forEach(card => {
                card.style.display = 'block';
            });
        });

        // Enter tuşuna basıldığında arama işlemini gerçekleştir
        headerSearchInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm.length > 0) {
                    showNotification(`"${searchTerm}" için arkadaşlar aranıyor...`, 'info');
                }
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

    // Arkadaş Ekle butonu işlevi
    const friendAddBtn = document.querySelector('.friend-add-btn');
    if (friendAddBtn) {
        friendAddBtn.addEventListener('click', function () {
            showNotification('Arkadaş eklemek için yeni pencere açılıyor...', 'info');

            // Açılır modal veya yeni sayfa açıldığını simüle ediyoruz
            // Gerçek uygulamada burada modal gösterilir veya sayfa değiştirilebilir
            setTimeout(() => {
                const modalHtml = `
                    <div class="friend-modal">
                        <div class="friend-modal-header">
                            <h3>Arkadaş Ekle</h3>
                            <div class="friend-modal-close"><i class="fas fa-times"></i></div>
                        </div>
                        <div class="friend-modal-content">
                            <p>Kullanıcı adı ve etiketini giriniz</p>
                            <div class="friend-modal-input">
                                <input type="text" placeholder="Kullanıcı#0000">
                                <button>Arkadaşlık İsteği Gönder</button>
                            </div>
                        </div>
                    </div>
                `;

                const modalContainer = document.createElement('div');
                modalContainer.className = 'modal-container';
                modalContainer.innerHTML = modalHtml;
                document.body.appendChild(modalContainer);

                // Modal kapanma işlevi
                const closeBtn = modalContainer.querySelector('.friend-modal-close');
                closeBtn.addEventListener('click', function () {
                    modalContainer.classList.add('closing');
                    setTimeout(() => {
                        modalContainer.remove();
                    }, 300);
                });

                // Dışa tıklayınca kapanma
                modalContainer.addEventListener('click', function (e) {
                    if (e.target === this) {
                        modalContainer.classList.add('closing');
                        setTimeout(() => {
                            modalContainer.remove();
                        }, 300);
                    }
                });

                // Modal CSS ekleme
                const modalStyle = document.createElement('style');
                modalStyle.textContent = `
                    .modal-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        animation: fadeIn 0.3s ease;
                    }
                    
                    .modal-container.closing {
                        animation: fadeOut 0.3s ease;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    
                    .friend-modal {
                        background: #212842;
                        border-radius: 8px;
                        width: 450px;
                        max-width: 90%;
                        overflow: hidden;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                        animation: scaleIn 0.3s ease;
                    }
                    
                    @keyframes scaleIn {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    
                    .friend-modal-header {
                        padding: 16px 20px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .friend-modal-header h3 {
                        margin: 0;
                        font-size: 18px;
                        color: #fff;
                    }
                    
                    .friend-modal-close {
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        border-radius: 50%;
                        transition: background 0.2s;
                    }
                    
                    .friend-modal-close:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                    
                    .friend-modal-content {
                        padding: 20px;
                    }
                    
                    .friend-modal-content p {
                        margin: 0 0 16px;
                        font-size: 14px;
                        color: rgba(255, 255, 255, 0.7);
                    }
                    
                    .friend-modal-input {
                        display: flex;
                        gap: 12px;
                    }
                    
                    .friend-modal-input input {
                        flex: 1;
                        background: rgba(30, 33, 50, 0.8);
                        border: 1px solid rgba(87, 96, 235, 0.3);
                        border-radius: 4px;
                        padding: 10px 12px;
                        color: #fff;
                        font-size: 14px;
                        outline: none;
                    }
                    
                    .friend-modal-input input:focus {
                        border-color: #5865f2;
                    }
                    
                    .friend-modal-input button {
                        background: #5865f2;
                        color: #fff;
                        border: none;
                        border-radius: 4px;
                        padding: 0 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    
                    .friend-modal-input button:hover {
                        background: #4752c4;
                    }
                `;
                document.head.appendChild(modalStyle);

                // Arkadaşlık isteği gönderme işlevi
                const sendBtn = modalContainer.querySelector('.friend-modal-input button');
                const userInput = modalContainer.querySelector('.friend-modal-input input');

                sendBtn.addEventListener('click', function () {
                    const username = userInput.value.trim();
                    if (username) {
                        showNotification(`${username} kullanıcısına arkadaşlık isteği gönderildi.`, 'success');
                        modalContainer.classList.add('closing');
                        setTimeout(() => {
                            modalContainer.remove();
                        }, 300);
                    } else {
                        showNotification('Lütfen geçerli bir kullanıcı adı girin.', 'error');
                    }
                });

                // Enter tuşu ile gönderme
                userInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        sendBtn.click();
                    }
                });
            }, 300);
        });
    }
}); 