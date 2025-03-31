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

    // Arkadaş Arama İşlevi
    const friendSearchInput = document.querySelector('.friends-search input');
    if (friendSearchInput) {
        friendSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const friendCards = document.querySelectorAll('.friend-card');

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
    }

    // Sunucu Arama İşlevi
    const serverSearchInput = document.querySelector('.sponsor-search input');
    if (serverSearchInput) {
        serverSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const serverList = document.querySelectorAll('.sponsor-server');

            serverList.forEach(server => {
                const serverName = server.querySelector('.sponsor-server-name').textContent.toLowerCase();
                const serverDesc = server.querySelector('.sponsor-server-desc').textContent.toLowerCase();
                const serverCategory = server.querySelector('.sponsor-server-category').textContent.toLowerCase();

                if (serverName.includes(searchTerm) || serverDesc.includes(searchTerm) || serverCategory.includes(searchTerm)) {
                    server.style.display = 'flex';
                } else {
                    server.style.display = 'none';
                }
            });
        });
    }

    // DM Arama İşlevi
    const dmSearchInput = document.querySelector('.dm-search input');
    if (dmSearchInput) {
        dmSearchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const dmItems = document.querySelectorAll('.dm-item');

            dmItems.forEach(item => {
                const dmName = item.querySelector('.dm-name').textContent.toLowerCase();
                const dmActivity = item.querySelector('.dm-activity')?.textContent.toLowerCase() || '';

                if (dmName.includes(searchTerm) || dmActivity.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
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
}); 