document.addEventListener('DOMContentLoaded', () => {
    // Tooltip gösterme/gizleme için gecikme değişkenleri
    let tooltipTimeout;
    const tooltipDelay = 300;

    // DM Gruplarını açıp kapatma
    const dmGroups = document.querySelectorAll('.dm-group-header');
    dmGroups.forEach(header => {
        header.addEventListener('click', () => {
            const group = header.closest('.dm-group');
            group.classList.toggle('collapsed');

            const icon = header.querySelector('.dm-group-toggle i');
            if (group.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
        });
    });

    // Arkadaş sekmesi değiştirme
    const friendsTabs = document.querySelectorAll('.friends-tab');
    friendsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Aktif sekmeyi değiştir
            document.querySelector('.friends-tab.active').classList.remove('active');
            tab.classList.add('active');

            // Burada farklı arkadaşlık panellerini göstermek için kod eklenebilir
            // Örnek: showFriendsPanel(this.dataset.panel);
            console.log('Sekme değişti:', tab.textContent);
        });
    });

    // Özel mesaj öğesi seçimi
    const dmItems = document.querySelectorAll('.dm-item');
    dmItems.forEach(item => {
        item.addEventListener('click', () => {
            // Aktif olan öğeyi kaldır
            document.querySelectorAll('.dm-item.active').forEach(active => {
                active.classList.remove('active');
            });

            // Tıklanan öğeyi aktif yap
            item.classList.add('active');

            // Gerçek bir uygulamada burada sohbet yüklenirdi
        });
    });

    // Sunucu öğeleri için hover animasyonu
    const serverItems = document.querySelectorAll('.server-item');
    serverItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const serverIcon = item.querySelector('.server-icon');
            serverIcon.style.borderRadius = '16px';
        });

        item.addEventListener('mouseleave', () => {
            const serverIcon = item.querySelector('.server-icon');
            serverIcon.style.borderRadius = '24px';
        });
    });

    // Arkadaş ekleme butonu
    const addFriendButton = document.querySelector('.add-friend-button');
    if (addFriendButton) {
        addFriendButton.addEventListener('click', () => {
            // Burada arkadaş ekleme formu gösterilebilir
            alert('Arkadaş ekleme formu burada gösterilecek');
        });
    }

    // Arkadaş arama fonksiyonu
    const searchFriendsInput = document.querySelector('.search-friends input');
    if (searchFriendsInput) {
        searchFriendsInput.addEventListener('input', () => {
            const searchTerm = searchFriendsInput.value.toLowerCase();
            const friendItems = document.querySelectorAll('.friend-item');

            friendItems.forEach(item => {
                const friendName = item.querySelector('.friend-name').textContent.toLowerCase();
                const friendStatus = item.querySelector('.friend-status').textContent.toLowerCase();

                // Ad veya durum içinde arama terimini ara
                if (friendName.includes(searchTerm) || friendStatus.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Sohbet arama fonksiyonu
    const searchChatInput = document.querySelector('.search-bar input');
    if (searchChatInput) {
        searchChatInput.addEventListener('input', () => {
            const searchTerm = searchChatInput.value.toLowerCase();
            const dmItems = document.querySelectorAll('.dm-item');

            dmItems.forEach(item => {
                const dmName = item.querySelector('.dm-name').textContent.toLowerCase();

                // Arkadaş adında arama terimini ara
                if (dmName.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Arkadaş aksiyon butonları
    const friendActionButtons = document.querySelectorAll('.friend-action-btn');
    friendActionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Tıklamanın üst öğelere yayılmasını engelle

            const action = button.getAttribute('title');
            const friendName = button.closest('.friend-item').querySelector('.friend-name').textContent;

            console.log(`${action} aksiyonu ${friendName} için gerçekleştirilecek`);

            // Burada farklı aksiyonlar için işlevler eklenebilir
            switch (action) {
                case 'Mesaj':
                    // Mesaj penceresini aç
                    showNotification(`${friendName} ile sohbet başlatılıyor...`);
                    break;
                case 'Görüntülü Arama':
                    // Görüntülü arama başlat
                    showNotification(`${friendName} ile görüntülü arama başlatılıyor...`);
                    break;
                case 'Sesli Arama':
                    // Sesli arama başlat
                    showNotification(`${friendName} ile sesli arama başlatılıyor...`);
                    break;
                case 'Diğer':
                    // Diğer seçenekleri göster
                    showContextMenu(button, friendName);
                    break;
            }
        });
    });

    // Bağlam menüsü gösterme fonksiyonu
    function showContextMenu(button, friendName) {
        // Mevcut menüyü kaldır
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Yeni menü oluştur
        const menu = document.createElement('div');
        menu.className = 'context-menu';

        // Menü öğeleri
        const menuItems = [
            { text: 'Profili Görüntüle', icon: 'fas fa-user' },
            { text: 'Arkadaşlıktan Çıkar', icon: 'fas fa-user-minus' },
            { text: 'Engelle', icon: 'fas fa-ban' }
        ];

        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;

            menuItem.addEventListener('click', () => {
                console.log(`${item.text} aksiyonu ${friendName} için gerçekleştirilecek`);
                menu.remove();
            });

            menu.appendChild(menuItem);
        });

        // Menüyü konumlandır
        const rect = button.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left - 120}px`;

        // Sayfaya ekle
        document.body.appendChild(menu);

        // Sayfa tıklamasıyla menüyü kapat
        document.addEventListener('click', () => {
            menu.remove();
        });
    }

    // Sponsor sunucu katılma butonları
    const sponsorJoinButtons = document.querySelectorAll('.sponsor-join-btn');
    sponsorJoinButtons.forEach(button => {
        button.addEventListener('click', () => {
            const serverName = button.closest('.sponsor-item').querySelector('.sponsor-name').textContent;
            showNotification(`${serverName} sunucusuna katıldınız!`);
        });
    });

    // Mobil görünüm için ekstra işlevler eklenebilir
    if (window.innerWidth <= 768) {
        setupMobileView();
    }

    // Pencere boyutu değiştiğinde mobil işlevleri yeniden ayarla
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            setupMobileView();
        } else {
            resetMobileView();
        }
    });

    // Mobil görünüm ayarları
    function setupMobileView() {
        console.log('Mobil görünüm ayarlanıyor');
        // Mobil için ekstra işlevler burada
    }

    // Mobil görünümü sıfırlama
    function resetMobileView() {
        console.log('Masaüstü görünümüne geçiliyor');
        // Masaüstü görünümüne dönme işlemleri
    }

    // Sayfayı yüklendikten sonra göster (loading efekti için)
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 300);

    // Server tooltips yerleşimini kontrol et
    serverItems.forEach(item => {
        const tooltip = item.querySelector('.server-tooltip');
        if (tooltip) {
            item.addEventListener('mouseenter', () => {
                const rect = item.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                if (rect.top + tooltip.offsetHeight > windowHeight) {
                    tooltip.style.top = 'auto';
                    tooltip.style.bottom = '0';
                }
            });
        }
    });

    // Mesaj gönderme işlevselliği
    const messageActions = document.querySelectorAll('.friend-action.message');
    messageActions.forEach(action => {
        action.addEventListener('click', () => {
            const friendCard = action.closest('.friend-card');
            const friendName = friendCard.querySelector('.friend-name').textContent;

            // Gerçek bir uygulamada burada mesajlaşma ekranına yönlendirme olurdu
            // Bu örnekte sadece bildirim gösterelim
            showNotification(`${friendName} ile sohbet başlatılıyor...`);
        });
    });

    // Ana sekmeleri tıklanabilir yap
    const mainTabs = document.querySelectorAll('.main-tab');
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Aktif olan sekmeyi kaldır
            document.querySelectorAll('.main-tab.active').forEach(active => {
                active.classList.remove('active');
            });

            // Tıklanan sekmeyi aktif yap
            tab.classList.add('active');

            // İçeriği değiştirmek için gerçek bir uygulamada burada 
            // yeni içerik yüklenirdi
        });
    });

    // Sponsor sekmeleri tıklanabilir yap
    const sponsorTabs = document.querySelectorAll('.sponsor-tab');
    sponsorTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Aktif olan sekmeyi kaldır
            document.querySelectorAll('.sponsor-tab.active').forEach(active => {
                active.classList.remove('active');
            });

            // Tıklanan sekmeyi aktif yap
            tab.classList.add('active');

            // Gerçek bir uygulamada burada yeni içerik yüklenirdi
        });
    });

    // Arama işlevselliği
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });

        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();

            // Hangi arama kutusunun kullanıldığını belirle
            if (input.closest('.friends-search')) {
                // Arkadaş arama
                const friends = document.querySelectorAll('.friend-card');
                friends.forEach(friend => {
                    const name = friend.querySelector('.friend-name').textContent.toLowerCase();
                    const tag = friend.querySelector('.friend-tag').textContent.toLowerCase();

                    if (name.includes(searchTerm) || tag.includes(searchTerm)) {
                        friend.style.display = '';
                    } else {
                        friend.style.display = 'none';
                    }
                });
            } else if (input.closest('.sponsor-search')) {
                // Sunucu arama
                const servers = document.querySelectorAll('.sponsor-server');
                servers.forEach(server => {
                    const name = server.querySelector('.sponsor-server-name').textContent.toLowerCase();
                    const desc = server.querySelector('.sponsor-server-desc').textContent.toLowerCase();

                    if (name.includes(searchTerm) || desc.includes(searchTerm)) {
                        server.style.display = '';
                    } else {
                        server.style.display = 'none';
                    }
                });
            } else if (input.closest('.dm-search')) {
                // DM arama
                const dms = document.querySelectorAll('.dm-item');
                dms.forEach(dm => {
                    const name = dm.querySelector('.dm-name').textContent.toLowerCase();
                    const activity = dm.querySelector('.dm-activity').textContent.toLowerCase();

                    if (name.includes(searchTerm) || activity.includes(searchTerm)) {
                        dm.style.display = '';
                    } else {
                        dm.style.display = 'none';
                    }
                });
            }
        });
    });

    // Sunucu butonlarını tıklanabilir yap
    serverItems.forEach(item => {
        item.addEventListener('click', () => {
            // Aktif olan sunucuyu kaldır
            document.querySelectorAll('.server-item.active').forEach(active => {
                active.classList.remove('active');
            });

            // Tıklanan sunucuyu aktif yap
            item.classList.add('active');

            // Gerçek bir uygulamada burada sunucu içeriği yüklenirdi
        });
    });

    // Çıkış butonu işlevi
    const logoutButton = document.querySelector('.logout-icon');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            showNotification('Çıkış yapılıyor...');

            // Gerçek uygulamada burada çıkış işlemi yapılırdı
            setTimeout(() => {
                // Örnek olarak ana sayfaya yönlendirme
                // window.location.href = 'index.html';
                showNotification('Çıkış yapıldı');
            }, 1500);
        });
    }

    // Bildirim gösterme fonksiyonu
    function showNotification(message) {
        // Bildirim elementi oluştur
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;

        // Belgeye ekle
        document.body.appendChild(notification);

        // Bildirim stillerini ekle
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'var(--primary-color)';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.zIndex = '9999';
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';

        // Bildirimi göster
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);

        // Bildirimi kapat
        setTimeout(() => {
            notification.style.transform = 'translateY(100px)';
            notification.style.opacity = '0';

            // DOM'dan kaldır
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Animasyonlu arkaplanın yeniden boyutlandırılması
    function resizeBackground() {
        const bg = document.querySelector('.bg-animation');
        if (bg) {
            bg.style.width = window.innerWidth + 'px';
            bg.style.height = window.innerHeight + 'px';
        }
    }

    // Sayfa yüklendiğinde ve pencere boyutu değiştiğinde 
    // arkaplanı boyutlandır
    resizeBackground();
    window.addEventListener('resize', resizeBackground);

    // Arkadaş kabul etme işlevselliği
    const acceptButtons = document.querySelectorAll('.friend-action:has(.fa-check)');
    acceptButtons.forEach(button => {
        button.addEventListener('click', () => {
            const friendCard = button.closest('.friend-card');
            const friendName = friendCard.querySelector('.friend-name').textContent;

            // Kabul efekti
            friendCard.style.transition = 'all 0.3s ease';
            friendCard.style.transform = 'translateX(50px)';
            friendCard.style.opacity = '0';

            setTimeout(() => {
                friendCard.remove();
                showNotification(`${friendName} arkadaşlık isteğini kabul ettiniz.`);

                // Bekleyen istek sayısını güncelle
                const requestsTitle = document.querySelector('.pending-requests-title');
                const count = document.querySelectorAll('.friends-list:nth-of-type(2) .friend-card').length;
                requestsTitle.textContent = `Bekleyen Arkadaşlık İstekleri - ${count}`;
            }, 300);
        });
    });

    // İstek reddetme işlevselliği
    const rejectButtons = document.querySelectorAll('.friend-action:has(.fa-times)');
    rejectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const friendCard = button.closest('.friend-card');
            const friendName = friendCard.querySelector('.friend-name').textContent;

            // Red efekti
            friendCard.style.transition = 'all 0.3s ease';
            friendCard.style.transform = 'translateX(-50px)';
            friendCard.style.opacity = '0';

            setTimeout(() => {
                friendCard.remove();
                showNotification(`${friendName} arkadaşlık isteğini reddettiniz.`);

                // Bekleyen istek sayısını güncelle
                const requestsTitle = document.querySelector('.pending-requests-title');
                const count = document.querySelectorAll('.friends-list:nth-of-type(2) .friend-card').length;
                requestsTitle.textContent = `Bekleyen Arkadaşlık İstekleri - ${count}`;
            }, 300);
        });
    });

    // İnternet bağlantısını kontrol et
    window.addEventListener('online', () => {
        showNotification('İnternet bağlantısı kuruldu.');
    });

    window.addEventListener('offline', () => {
        showNotification('İnternet bağlantısı kesildi!');
    });

    // Chat tipini seçme butonları
    const chatTypeButtons = document.querySelectorAll('.chat-type-btn');
    chatTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Aktif olan butondan class'ı kaldır
            document.querySelector('.chat-type-btn.active').classList.remove('active');

            // Tıklanan butonu aktif yap
            button.classList.add('active');

            // Buton metni "Grup Sohbeti" ise grup sohbetlerini göster, değilse normal sohbetleri göster
            const isGroupChat = button.textContent === 'Grup Sohbeti';
            const dmGroups = document.querySelectorAll('.dm-group');

            dmGroups.forEach(group => {
                const isGroupMessages = group.querySelector('.dm-group-title').textContent === 'Grup Mesajları';

                if (isGroupChat) {
                    // Grup sohbeti modu
                    if (isGroupMessages) {
                        group.style.display = 'block';
                    } else {
                        group.style.display = 'none';
                    }
                } else {
                    // Normal sohbet modu
                    if (!isGroupMessages) {
                        group.style.display = 'block';
                    } else {
                        group.style.display = 'none';
                    }
                }
            });
        });
    });
}); 