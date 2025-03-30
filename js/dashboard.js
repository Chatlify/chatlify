document.addEventListener('DOMContentLoaded', function () {
    // Tooltip gösterme/gizleme için gecikme değişkenleri
    let tooltipTimeout;
    const tooltipDelay = 300;

    // DM Gruplarını açıp kapatma
    const dmGroups = document.querySelectorAll('.dm-group-header');
    dmGroups.forEach(header => {
        header.addEventListener('click', function () {
            const group = this.parentElement;
            group.classList.toggle('collapsed');
            this.querySelector('i').style.transform = group.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0)';

            // Grup altındaki öğeleri göster/gizle
            const items = group.querySelectorAll('.dm-item');
            items.forEach(item => {
                item.style.display = group.classList.contains('collapsed') ? 'none' : 'flex';
            });
        });
    });

    // Arkadaş sekmesi değiştirme
    const friendsTabs = document.querySelectorAll('.friends-tab');
    friendsTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Aktif sekmeyi değiştir
            document.querySelector('.friends-tab.active').classList.remove('active');
            this.classList.add('active');

            // Burada farklı arkadaşlık panellerini göstermek için kod eklenebilir
            // Örnek: showFriendsPanel(this.dataset.panel);
            console.log('Sekme değişti:', this.textContent);
        });
    });

    // Özel mesaj öğesi seçimi
    const dmItems = document.querySelectorAll('.dm-item');
    dmItems.forEach(item => {
        item.addEventListener('click', function () {
            // Aktif öğeyi değiştir
            const activeItem = document.querySelector('.dm-item.active');
            if (activeItem) {
                activeItem.classList.remove('active');
            }
            this.classList.add('active');

            // Burada seçilen kullanıcıyla sohbet panelini göstermek için kod eklenebilir
            // Örnek: loadConversation(this.dataset.userId);
            console.log('Sohbet seçildi:', this.querySelector('.dm-name').textContent);
        });
    });

    // Sunucu öğeleri için hover animasyonu
    const serverItems = document.querySelectorAll('.server-item');
    serverItems.forEach(item => {
        item.addEventListener('mouseenter', function () {
            const serverIcon = this.querySelector('.server-icon');
            serverIcon.style.borderRadius = '16px';
        });

        item.addEventListener('mouseleave', function () {
            const serverIcon = this.querySelector('.server-icon');
            serverIcon.style.borderRadius = '24px';
        });
    });

    // Arkadaş ekleme butonu
    const addFriendButton = document.querySelector('.add-friend-button');
    if (addFriendButton) {
        addFriendButton.addEventListener('click', function () {
            // Burada arkadaş ekleme formu gösterilebilir
            alert('Arkadaş ekleme formu burada gösterilecek');
        });
    }

    // Arkadaş arama fonksiyonu
    const searchFriendsInput = document.querySelector('.search-friends input');
    if (searchFriendsInput) {
        searchFriendsInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
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
        searchChatInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
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
        button.addEventListener('click', function (e) {
            e.stopPropagation(); // Tıklamanın üst öğelere yayılmasını engelle

            const action = this.getAttribute('title');
            const friendName = this.closest('.friend-item').querySelector('.friend-name').textContent;

            console.log(`${action} aksiyonu ${friendName} için gerçekleştirilecek`);

            // Burada farklı aksiyonlar için işlevler eklenebilir
            switch (action) {
                case 'Mesaj':
                    // Mesaj penceresini aç
                    alert(`${friendName} ile sohbet başlatılıyor...`);
                    break;
                case 'Görüntülü Arama':
                    // Görüntülü arama başlat
                    alert(`${friendName} ile görüntülü arama başlatılıyor...`);
                    break;
                case 'Sesli Arama':
                    // Sesli arama başlat
                    alert(`${friendName} ile sesli arama başlatılıyor...`);
                    break;
                case 'Diğer':
                    // Diğer seçenekleri göster
                    showContextMenu(this, friendName);
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

            menuItem.addEventListener('click', function () {
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
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }

    // Sponsor sunucu katılma butonları
    const sponsorJoinButtons = document.querySelectorAll('.sponsor-join-btn');
    sponsorJoinButtons.forEach(button => {
        button.addEventListener('click', function () {
            const serverName = this.closest('.sponsor-item').querySelector('.sponsor-name').textContent;
            alert(`${serverName} sunucusuna katıldınız!`);
        });
    });

    // Mobil görünüm için ekstra işlevler eklenebilir
    if (window.innerWidth <= 768) {
        setupMobileView();
    }

    // Pencere boyutu değiştiğinde mobil işlevleri yeniden ayarla
    window.addEventListener('resize', function () {
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
}); 