import { supabase } from './auth_config.js'; // Supabase istemcisini import et

// Global değişkenler tanımları
let currentUserId = null;
let onlineFriends = new Set();
let presenceChannel = null;
let currentConversationId = null; // Aktif sohbet için ID
let messageSubscription = null; // Realtime mesaj aboneliği
let sampleColumnFormat = 'camelCase'; // Varsayılan olarak camelCase formatını kullan
const defaultAvatar = 'images/DefaultAvatar.png';
let messageNotificationSound = null; // Ses nesnesi için global değişken
let unreadCounts = {}; // Okunmamış mesaj sayıları için global nesne
let allMessagesSubscription = null; // Tüm mesajları dinleyen abonelik

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard JS başlatılıyor...');

    try {
        // Element tanımlamaları
        const userPanelUsernameElement = document.querySelector('.dm-footer .dm-user-name');
        const userPanelAvatarElement = document.querySelector('.dm-footer .dm-user-avatar img');

        const tabs = document.querySelectorAll('.dashboard-header .tab');
        const onlineSection = document.querySelector('.online-section-title');
        const onlineList = document.querySelector('.online-friends');
        const offlineSection = document.querySelector('.offline-section-title');
        const offlineList = document.querySelector('.offline-friends');
        const pendingSection = document.querySelector('.pending-section-title');
        const pendingList = document.querySelector('.pending-requests');
        const pendingCountBadge = document.querySelector('.pending-count');
        const dmList = document.querySelector('#friends-group .dm-items');
        const chatPanel = document.querySelector('.chat-panel');
        const chatHeaderUser = chatPanel?.querySelector('.chat-header-user');
        const chatMessagesContainer = chatPanel?.querySelector('.chat-messages');
        const friendsPanelContainer = document.querySelector('.friends-panel-container');
        const sponsorSidebar = document.querySelector('.sponsor-sidebar');
        const settingsButtonContainer = document.querySelector('.server-sidebar .server-item:has(.server-settings-icon)');
        const chatCloseBtn = chatPanel?.querySelector('.chat-close-btn');
        const chatEmojiBtn = chatPanel?.querySelector('.emoji-btn');
        const chatTextarea = chatPanel?.querySelector('.chat-textbox textarea');
        const emojiPicker = document.querySelector('emoji-picker');

        // Kritik elementlerin varlığını kontrol et
        validateRequiredElements({
            userPanelUsernameElement,
            userPanelAvatarElement,
            chatPanel,
            chatMessagesContainer,
            chatTextarea
        });

        // Kullanıcı oturumunu başlat
        const userSessionActive = await initializeUserSession({
            userPanelUsernameElement,
            userPanelAvatarElement
        });

        if (!userSessionActive) return; // Oturum yoksa devam etme

        // Tab kontrolünü kur
        setupTabControls(tabs);

        // Mesaj göndermesi için gerekli dinleyicileri ekle
        setupMessageSending(chatTextarea);

        // Emoji picker dinleyicisini kur
        if (chatEmojiBtn && chatTextarea && emojiPicker) {
            setupEmojiPicker(chatEmojiBtn, chatTextarea, emojiPicker);
        }

        // Varsayılan sekmeyi göster
        showSection('Tüm Arkadaşlar');

        // Arkadaş listesini yükle
        await loadAllFriends({
            onlineList,
            offlineList,
            dmList,
            onlineSection,
            offlineSection
        });

        // Bekleyen istekleri yükle
        await loadPendingRequests(pendingList, pendingCountBadge);

        // Sunucu panelini kur
        setupServerPanel();

        // Kontekst menüleri için dinleyicileri ekle
        addContextMenuListeners();

        // Presence takip sistemini başlat
        initializePresence();

        // Arkadaş Ekle modalını kur
        setupAddFriendModal();

        // Arkadaşlık durumu için realtime abonelik başlat
        subscribeFriendshipUpdates();

        // Tüm mesajlar için global realtime abonelik başlat
        subscribeToAllMessages();

        console.log('Dashboard JS başlatma tamamlandı.');
    } catch (error) {
        console.error('Dashboard başlatma hatası:', error);
        alert('Sayfa başlatılırken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
    }

    // Zorunlu elementlerin varlığını kontrol eden yardımcı fonksiyon
    function validateRequiredElements(elements) {
        const criticalElements = [
            { element: elements.userPanelUsernameElement, name: '.dm-footer .dm-user-name' },
            { element: elements.userPanelAvatarElement, name: '.dm-footer .dm-user-avatar img' },
            { element: elements.chatPanel, name: '.chat-panel' },
            { element: elements.chatMessagesContainer, name: '.chat-messages' },
            { element: elements.chatTextarea, name: '.chat-textbox textarea' }
        ];

        const missingElements = criticalElements.filter(item => !item.element);

        if (missingElements.length > 0) {
            console.error('Kritik elementler bulunamadı:',
                missingElements.map(item => item.name).join(', '));
        }
    }

    // Tab yönetimi için dinleyicileri oluşturan yardımcı fonksiyon
    function setupTabControls(tabs) {
        if (!tabs) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabText = tab.textContent.trim();
                showSection(tabText);
            });
        });
    }
});

// Kullanıcı bilgilerini ve oturumu yönetme
async function initializeUserSession({ userPanelUsernameElement, userPanelAvatarElement }) {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
            currentUserId = user.id;
            console.log('Kullanıcı ID:', currentUserId);

            // Kullanıcı profilini yükle
            await loadUserProfile({ userPanelUsernameElement, userPanelAvatarElement });

            return true;
        } else {
            console.error('Oturum açık değil, giriş sayfasına yönlendiriliyor.');
            redirectToLogin();
            return false;
        }
    } catch (error) {
        console.error('Kullanıcı bilgileri alınırken hata:', error);
        redirectToLogin();
        return false;
    }
}

// Login sayfasına yönlendirme
function redirectToLogin() {
    console.log('Oturum bulunamadı veya süresi doldu, giriş sayfasına yönlendiriliyor...');
    window.location.href = 'login.html';
}

// Kullanıcı profil bilgilerini yükleme
async function loadUserProfile({ userPanelUsernameElement, userPanelAvatarElement }) {
    if (!currentUserId) {
        console.error('loadUserProfile için currentUserId gerekli');
        return;
    }

    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('username, avatar')
            .eq('id', currentUserId)
            .maybeSingle();

        if (error) {
            console.error('Profil bilgileri alınamadı:', error);
            setDefaultProfileUI({ userPanelUsernameElement, userPanelAvatarElement });
            return;
        }

        if (profile) {
            updateProfileUI({ profile, userPanelUsernameElement, userPanelAvatarElement });
        } else {
            console.warn(`${currentUserId} ID'li kullanıcı için profil bulunamadı`);
            setDefaultProfileUI({ userPanelUsernameElement, userPanelAvatarElement });
        }
    } catch (error) {
        console.error('Profil yüklenirken beklenmeyen hata:', error);
        setDefaultProfileUI({ userPanelUsernameElement, userPanelAvatarElement });
    }
}

// Profil UI güncellemesi
function updateProfileUI({ profile, userPanelUsernameElement, userPanelAvatarElement }) {
    if (userPanelUsernameElement) {
        userPanelUsernameElement.textContent = profile.username || 'Kullanıcı';
    }

    if (userPanelAvatarElement) {
        userPanelAvatarElement.src = profile.avatar || defaultAvatar;
        userPanelAvatarElement.onerror = () => {
            console.warn('Profil resmi yüklenemedi, varsayılan görsel kullanılıyor');
            userPanelAvatarElement.src = defaultAvatar;
        };
    }

    console.log('Profil arayüzü güncellendi:', profile.username);
}

// Varsayılan profil UI'ı
function setDefaultProfileUI({ userPanelUsernameElement, userPanelAvatarElement }) {
    if (userPanelUsernameElement) {
        userPanelUsernameElement.textContent = 'Kullanıcı';
    }

    if (userPanelAvatarElement) {
        userPanelAvatarElement.src = defaultAvatar;
    }
}

// Tüm arkadaşları yükleme fonksiyonu (optimize edilmiş)
async function loadAllFriends({ onlineList, offlineList, dmList, onlineSection, offlineSection }) {
    if (!onlineList || !offlineList || !dmList) {
        console.error('loadAllFriends: Arkadaş ve DM listesi elementleri bulunamadı');
        return;
    }

    // Yükleniyor göstergelerini göster
    showLoadingState();

    try {
        // Kullanıcı ID kontrolü
        if (!currentUserId) {
            console.error('loadAllFriends: currentUserId tanımlı değil');
            showError('Kullanıcı bilgisi bulunamadı. Lütfen sayfayı yenileyiniz.');
            return;
        }

        // Arkadaşlık verilerini çek
        const { data: friendships, error } = await supabase
            .from('friendships')
            .select(`
                id, 
                user_id_1, 
                user_id_2,
                user1:user_id_1(id, username, avatar),
                user2:user_id_2(id, username, avatar)
            `)
            .eq('status', 'accepted')
            .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

        if (error) {
            throw error;
        }

        // Listeleri temizle
        clearLists();

        // Arkadaşlık yoksa boş durumu göster
        if (!friendships || friendships.length === 0) {
            showEmptyState();
            return;
        }

        // Arkadaşlıkları ekrana ekle - fragment kullanarak performansı artır
        const onlineFragment = document.createDocumentFragment();
        const offlineFragment = document.createDocumentFragment();
        const dmFragment = document.createDocumentFragment();

        friendships.forEach(friendship => {
            // Doğru arkadaş bilgisini al
            const friendUser = friendship.user_id_1 === currentUserId ? friendship.user2 : friendship.user1;

            if (!friendUser) {
                console.warn(`Friendship ${friendship.id} için arkadaş bilgisi bulunamadı`);
                return;
            }

            // Güvenli default değerler
            const username = friendUser.username || 'Bilinmeyen Kullanıcı';
            const avatar = friendUser.avatar || defaultAvatar;
            const userId = friendUser.id;

            // Arkadaş satırını oluştur
            const friendRow = createFriendRow(userId, username, avatar);

            // DM satırını oluştur
            const dmRow = createDMRow(userId, username, avatar, onlineFriends.has(userId));

            // Online durumuna göre ekle
            if (onlineFriends.has(userId)) {
                friendRow.classList.add('online');
                friendRow.classList.remove('offline');
                friendRow.querySelector('.status-dot').className = 'status-dot online';
                friendRow.querySelector('.friend-status').textContent = 'Çevrimiçi';
                onlineFragment.appendChild(friendRow);

                if (dmRow) {
                    dmRow.querySelector('.dm-status').className = 'dm-status online';
                    dmRow.querySelector('.dm-activity').textContent = 'Çevrimiçi';
                }
            } else {
                friendRow.classList.add('offline');
                friendRow.classList.remove('online');
                friendRow.querySelector('.status-dot').className = 'status-dot offline';
                friendRow.querySelector('.friend-status').textContent = 'Çevrimdışı';
                offlineFragment.appendChild(friendRow);

                if (dmRow) {
                    dmRow.querySelector('.dm-status').className = 'dm-status offline';
                    dmRow.querySelector('.dm-activity').textContent = 'Çevrimdışı';
                }
            }

            // DM satırını her zaman ekle
            if (dmRow) dmFragment.appendChild(dmRow);
        });

        // Fragmanları DOM'a ekle
        onlineList.appendChild(onlineFragment);
        offlineList.appendChild(offlineFragment);
        dmList.appendChild(dmFragment);

        // Sayaçları güncelle
        updateFriendCounters();

        // Kontekst menüleri ekle
        addContextMenuListeners();

    } catch (error) {
        console.error('Arkadaşlar yüklenirken hata:', error);
        showError('Arkadaşlar yüklenirken bir hata oluştu.');
    }

    // Yardımcı fonksiyonlar
    function showLoadingState() {
        onlineList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Arkadaşlar yükleniyor...</div>';
        offlineList.innerHTML = '';
        dmList.innerHTML = '';

        // Sayaçları sıfırla
        const onlineCountBadge = document.querySelector('.online-count');
        const offlineCountBadge = document.querySelector('.offline-count');
        if (onlineCountBadge) onlineCountBadge.textContent = '0';
        if (offlineCountBadge) offlineCountBadge.textContent = '0';

        // Başlıkları gizle
        if (onlineSection) onlineSection.style.display = 'none';
        if (offlineSection) offlineSection.style.display = 'none';
    }

    function clearLists() {
        onlineList.innerHTML = '';
        offlineList.innerHTML = '';
        dmList.innerHTML = '';
    }

    function showEmptyState() {
        offlineList.innerHTML = '<div class="empty-placeholder">Henüz hiç arkadaşınız yok.</div>';
        dmList.innerHTML = '<div class="empty-placeholder dm-empty">Henüz hiç özel mesajınız yok.</div>';
        updateFriendCounters();
    }

    function showError(message) {
        onlineList.innerHTML = `<div class="error-placeholder">${message}</div>`;
        offlineList.innerHTML = '';
    }

    function createFriendRow(userId, username, avatar) {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-row';
        friendElement.dataset.userId = userId;
        friendElement.dataset.username = username;
        friendElement.dataset.avatar = avatar;

        friendElement.innerHTML = `
                    <div class="friend-avatar">
                <img src="${avatar}" alt="${username}" onerror="this.src='${defaultAvatar}'">
                        <span class="status-dot offline"></span>
                            </div>
                    <div class="friend-info">
                <div class="friend-name">${username}</div>
                <div class="friend-status">Çevrimdışı</div>
                    </div>
                `;

        return friendElement;
    }

    function createDMRow(userId, username, avatar, isOnline) {
        const dmElement = document.createElement('div');
        const statusClass = isOnline ? 'online' : 'offline';
        const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
        dmElement.className = `dm-item ${statusClass}`;
        dmElement.dataset.userId = userId;
        dmElement.dataset.username = username;
        dmElement.dataset.avatar = avatar;

        dmElement.innerHTML = `
            <div class="dm-avatar">
                <img src="${avatar}" alt="${username}" onerror="this.src='${defaultAvatar}'">
                
            </div>
            <div class="dm-info">
                <div class="dm-name">${username}</div>
                <div class="dm-activity">${statusText}</div>
            </div>
            <div class="dm-notification" style="display: none;">0</div> 
        `;

        // DM öğesine tıklama event listener'ı ekle
        dmElement.addEventListener('click', () => {
            openChatPanel(userId, username, avatar);
            document.querySelectorAll('.dm-item').forEach(item => item.classList.remove('active'));
            dmElement.classList.add('active');
        });

        return dmElement;
    }
}

// Bekleyen istekleri yükleme
async function loadPendingRequests(pendingList, pendingCountBadge) {
    try {
        const { data: pendingRequests, error } = await supabase
            .from('friendships')
            .select('*')
            .eq('status', 'pending')
            .eq('user_id_2', currentUserId);

        if (error) {
            throw error;
        }

        pendingList.textContent = pendingRequests.length;
        pendingCountBadge.textContent = pendingRequests.length;
    } catch (error) {
        console.error('Bekleyen istekler yüklenirken hata:', error);
        pendingList.textContent = 'Hata oluştu';
        pendingCountBadge.textContent = 'Hata';
    }
}

// Sunucu panelini kurma
function setupServerPanel() {
    // Sunucu panelini kurma işlemleri burada yapılabilir
}

// Kontekst menüleri için dinleyicileri ekleme
function addContextMenuListeners() {
    const contextMenu = createContextMenuElement(); // Menü elementini oluştur veya bul
    document.body.appendChild(contextMenu); // Body'ye ekle (eğer yoksa)

    // Dinlenecek ana konteynerlar
    const listenAreas = [
        document.querySelector('.direct-messages'), // DM listesi
        document.querySelector('.friends-panel-container') // Arkadaş paneli
        // '.server-sidebar' // Gerekirse sunucu listesi de eklenebilir
    ];

    listenAreas.forEach(area => {
        if (!area) return;

        area.addEventListener('contextmenu', (e) => {
            // Hedef elementi bul
            const targetItem = e.target.closest('.dm-item, .friend-row'); // '.server-item' de eklenebilir

            if (targetItem) {
                e.preventDefault(); // Tarayıcının kendi menüsünü engelle

                // Hedef elementten verileri al
                const userId = targetItem.dataset.userId;
                const username = targetItem.dataset.username;
                const avatar = targetItem.dataset.avatar || defaultAvatar; // Avatar yoksa varsayılan

                if (!userId || !username) {
                    console.warn('Context menu target missing data:', targetItem.dataset);
                    hideContextMenu(contextMenu);
                    return;
                }

                // Menü içeriğini oluştur
                buildContextMenuContent(contextMenu, userId, username, avatar);

                // Menüyü göster
                showContextMenu(contextMenu, e.clientX, e.clientY);
            } else {
                // Geçerli bir hedef değilse menüyü gizle
                hideContextMenu(contextMenu);
            }
        });
    });

    // Sayfanın herhangi bir yerine tıklanınca menüyü gizle
    document.addEventListener('click', () => {
        hideContextMenu(contextMenu);
    });

    // Scroll olayında menüyü gizle (isteğe bağlı ama iyi bir UX)
    window.addEventListener('scroll', () => {
        hideContextMenu(contextMenu);
    }, true); // Capture phase'de dinle
}

// Bağlam menüsü elementini oluşturur veya mevcut olanı döndürür
function createContextMenuElement() {
    let menu = document.getElementById('custom-context-menu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'custom-context-menu';
        menu.className = 'context-menu'; // CSS sınıfını ekle
        menu.style.display = 'none'; // Başlangıçta gizli
    }
    return menu;
}

// Menü içeriğini dinamik olarak oluşturur
function buildContextMenuContent(menu, userId, username, avatar) {
    // Önceki içeriği temizle
    menu.innerHTML = '';

    // Başlık kısmı (Avatar ve İsim)
    const header = document.createElement('div');
    header.className = 'context-menu-header';
    header.innerHTML = `
        <div class="context-menu-avatar">
            <img src="${avatar}" alt="${username}" onerror="this.src='${defaultAvatar}'">
        </div>
        <span class="context-menu-name">${username}</span>
    `;
    menu.appendChild(header);

    // Ayırıcı
    const divider = document.createElement('div');
    divider.className = 'context-menu-divider';
    menu.appendChild(divider);

    // Menü Öğeleri
    const items = [
        { label: 'Profil', icon: 'fa-user', action: () => console.log(`Profil görüntüle: ${username} (${userId})`) },
        {
            label: 'Mesaj Gönder', icon: 'fa-comment', action: () => {
                // DM listesindeki avatarı bulup openChatPanel'e göndermek daha doğru olabilir
                // Şimdilik dataset'ten gelen avatarı kullanıyoruz
                openChatPanel(userId, username, avatar);
            }
        },
        // { label: 'Arkadaşlıktan Çıkar', icon: 'fa-user-times', action: () => console.log(`Arkadaşlıktan çıkar: ${username}`), danger: true } // Örnek
    ];

    items.forEach(itemData => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        if (itemData.danger) {
            menuItem.classList.add('danger'); // CSS'te .danger stili tanımlanmalı
        }
        menuItem.innerHTML = `
            <i class="fas ${itemData.icon}"></i>
            <span>${itemData.label}</span>
        `;
        menuItem.addEventListener('click', () => {
            itemData.action();
            hideContextMenu(menu); // İşlem sonrası menüyü gizle
        });
        menu.appendChild(menuItem);
    });
}

// Bağlam menüsünü gösterir
function showContextMenu(menu, x, y) {
    menu.style.display = 'block'; // Görünür yap

    // Menünün pencere dışına taşmasını engelle
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;

    if (x + menuWidth > windowWidth) {
        finalX = windowWidth - menuWidth - 5; // Sağ kenardan taşmayı engelle
    }
    if (y + menuHeight > windowHeight) {
        finalY = windowHeight - menuHeight - 5; // Alt kenardan taşmayı engelle
    }

    menu.style.left = `${finalX}px`;
    menu.style.top = `${finalY}px`;

    // Aktif sınıfını ekleyerek animasyonu tetikle (CSS'te tanımlıysa)
    setTimeout(() => menu.classList.add('active'), 0);
}

// Bağlam menüsünü gizler
function hideContextMenu(menu) {
    if (menu && menu.style.display === 'block') {
        menu.classList.remove('active'); // Animasyon sınıfını kaldır
        // Animasyonun bitmesini bekleyip gizle (transition süresi kadar)
        // setTimeout(() => {
        menu.style.display = 'none';
        // }, 150); // CSS'teki transition süresiyle eşleşmeli
    }
}

// initializePresence fonksiyon tanımı (içi boş kalsa da fonksiyonun var olması önemli)
function initializePresence() {
    // Bu fonksiyonun içeriği varsa korunmalı, yoksa boş kalabilir.
    // console.log("Presence sistemi başlatılıyor...");
}

// showSection fonksiyon tanımı
function showSection(sectionName) {
    // Bu fonksiyonun içeriği varsa korunmalı, yoksa boş kalabilir.
    console.log(`Bölüm gösteriliyor: ${sectionName}`);
    // Gerçek içerik: İlgili panelleri göster/gizle
    const friendsPanel = document.querySelector('.friends-panel-container');
    const chatPanel = document.querySelector('.chat-panel');
    // Diğer bölümler için de elementler alınabilir

    if (!friendsPanel || !chatPanel) return;

    // Önce sohbeti kapat (açıksa)
    closeChatPanel(); // Bu fonksiyon sohbeti kapatıp arkadaş panelini gösterir

    // Aktif tab'ı ayarla (görsel olarak)
    document.querySelectorAll('.dashboard-header .tab').forEach(tab => {
        if (tab.textContent.trim() === sectionName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Hangi bölümün gösterileceğine karar ver (Bu kısım daha detaylı olmalı)
    // Örneğin:
    // if (sectionName === 'Tüm Arkadaşlar') {
    //     // Tüm arkadaşları gösteren listeyi filtrele/göster
    // } else if (sectionName === 'Çevrimiçi') {
    //     // Sadece çevrimiçi arkadaşları göster
    // } else if (sectionName === 'Bekleyen') {
    //     // Bekleyen istekler bölümünü göster
    // }

    // Şimdilik sadece arkadaş panelinin görünür kaldığından emin olalım
    friendsPanel.classList.remove('hidden');

}

async function openChatPanel(userId, username, avatar) {
    // Panel elementlerini al
    const chatPanel = document.querySelector('.chat-panel');
    const chatHeaderUser = chatPanel?.querySelector('.chat-header-user');
    const chatMessagesContainer = chatPanel?.querySelector('.chat-messages');
    const friendsPanelContainer = document.querySelector('.friends-panel-container');
    const sponsorSidebar = document.querySelector('.sponsor-sidebar');

    // Elementlerin varlığını kontrol et
    if (!chatPanel || !chatHeaderUser || !chatMessagesContainer || !friendsPanelContainer) {
        console.error('Chat panel elements not found, cannot open chat.');
        return;
    }
    console.log(`Sohbet paneli açılıyor (kullanıcı): ${username} (ID: ${userId})`);

    // Önce gerçek sohbet ID'sini bul/oluştur
    const actualConversationId = await findOrCreateConversation(currentUserId, userId);

    if (!actualConversationId) {
        console.error("Sohbet ID'si alınamadı veya oluşturulamadı.");
        alert("Sohbet başlatılamadı. Lütfen tekrar deneyin.");
        return; // Sohbet ID'si yoksa devam etme
    }

    // Global değişkeni GERÇEK sohbet ID'si ile güncelle
    currentConversationId = actualConversationId;
    console.log("Aktif sohbet ID'si (gerçek):", currentConversationId);

    // Sohbet başlığını güncelle
    const chatUsernameElement = chatHeaderUser.querySelector('.chat-username');
    const chatAvatarElement = chatHeaderUser.querySelector('.chat-avatar img');
    const chatStatusDot = chatHeaderUser.querySelector('.chat-avatar .status-dot');
    const chatStatusTextElement = chatHeaderUser.querySelector('.chat-user-info .chat-status');

    if (chatUsernameElement) chatUsernameElement.textContent = username;
    if (chatAvatarElement) chatAvatarElement.src = avatar || defaultAvatar;

    // Çevrimiçi durumunu kontrol et
    const isFriendOnline = onlineFriends.has(userId);
    const statusText = isFriendOnline ? 'Çevrimiçi' : 'Çevrimdışı';
    const statusClass = isFriendOnline ? 'online' : 'offline';
    if (chatStatusDot) chatStatusDot.className = `status-dot ${statusClass}`;
    if (chatStatusTextElement) chatStatusTextElement.textContent = statusText;

    // Mesajlar alanını temizle ve yükleniyor göster
    chatMessagesContainer.innerHTML = '';
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-placeholder';
    loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mesajlar yükleniyor...';
    chatMessagesContainer.appendChild(loadingElement);

    // Panelleri göster/gizle
    friendsPanelContainer.classList.add('hidden');
    if (sponsorSidebar) sponsorSidebar.style.display = 'none';
    chatPanel.classList.remove('hidden');

    // Aktif sohbetin user ID'sini panele ekle (durum güncellemesi için)
    chatPanel.dataset.activeChatUserId = userId;

    // Header butonlarının işlevselliğini ayarla
    setupChatHeaderActions(userId, username, avatar);

    // Mesajları GERÇEK sohbet ID'si ile yükle
    loadConversationMessages(currentConversationId);

    // Realtime aboneliği GERÇEK sohbet ID'si ile başlat
    subscribeToMessages(currentConversationId);

    // Okunmamış mesaj sayacını sıfırla ve badge'i gizle
    unreadCounts[userId] = 0;
    updateUnreadBadge(userId, 0);
}

// Sohbet paneli header butonlarını ayarlama
function setupChatHeaderActions(userId, username, avatar) {
    const chatHeader = document.querySelector('.chat-header');
    if (!chatHeader) {
        console.error('Chat header not found!');
        return;
    }

    // Kapatma butonu
    const closeChatBtn = chatHeader.querySelector('.chat-close-btn');
    if (closeChatBtn) {
        // Eski listener'ları temizlemek için klon oluştur
        const newCloseChatBtn = closeChatBtn.cloneNode(true);
        closeChatBtn.parentNode.replaceChild(newCloseChatBtn, closeChatBtn);

        // Yeni listener ekle
        newCloseChatBtn.addEventListener('click', () => {
            closeChatPanel();
        });
    }

    // Profil butonu
    const profileBtn = chatHeader.querySelector('button[title="Profili Görüntüle"]');
    if (profileBtn) {
        const newProfileBtn = profileBtn.cloneNode(true);
        profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);

        newProfileBtn.addEventListener('click', () => {
            // Profil görüntüleme işlevi (eğer varsa)
            console.log(`${username} profilini görüntüle`);
        });
    }
}

// Sohbet panelini kapatma
function closeChatPanel() {
    const chatPanel = document.querySelector('.chat-panel');
    const friendsPanelContainer = document.querySelector('.friends-panel-container');
    const sponsorSidebar = document.querySelector('.sponsor-sidebar');

    if (!chatPanel || !friendsPanelContainer) return;

    // Paneli gizle
    chatPanel.classList.add('hidden');
    friendsPanelContainer.classList.remove('hidden');

    // Sponsor sidebar'ı göster (eğer varsa)
    if (sponsorSidebar) sponsorSidebar.style.display = '';

    // Aktif DM stilini kaldır
    document.querySelectorAll('.dm-item.active').forEach(item => item.classList.remove('active'));

    // Aktif sohbet ID'sini temizle
    currentConversationId = null;

    // Realtime aboneliğini sonlandır
    unsubscribeFromMessages();
}

// Kullanıcının mesajlarını yükleme
async function loadConversationMessages(conversationId) {
    const chatMessagesContainer = document.querySelector('.chat-panel .chat-messages');
    if (!chatMessagesContainer) return;

    try {
        console.log(`Mesajları yükleme (ConversationID: ${conversationId})`);

        // Sorguyu conversationId'ye göre yap
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversationId', conversationId) // Sadece bu sohbete ait mesajları al
            .order('createdAt', { ascending: true });

        if (error) {
            console.error('Mesaj sorgusunda hata:', error);
            throw error;
        }

        // Mesaj alanını temizle
        chatMessagesContainer.innerHTML = '';

        if (!messages || messages.length === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'empty-placeholder chat-empty';
            emptyElement.textContent = 'Bu sohbetin başlangıcı.';
            chatMessagesContainer.appendChild(emptyElement);
            return;
        }

        console.log(`Toplam ${messages.length} mesaj bulundu`);

        // Gönderen kullanıcıların profil bilgilerini çek
        const senderIds = [...new Set(messages.map(msg => msg.senderId))];

        // Kullanıcı bilgilerini almak için Supabase sorgusu
        const { data: userProfiles, error: userError } = await supabase
            .from('users')
            .select('id, username, avatar')
            .in('id', senderIds);

        if (userError) {
            console.error('Kullanıcı profilleri alınırken hata:', userError);
        }

        // Kullanıcı ID'lerine göre profil bilgilerini eşleştir
        const userMap = {};
        if (userProfiles) {
            userProfiles.forEach(profile => {
                userMap[profile.id] = profile;
            });
        }

        // Tarih ayırıcılarını takip etmek için
        let lastMessageDate = null;

        // Fragment kullanarak DOM işlemlerini optimize et
        const fragment = document.createDocumentFragment();

        messages.forEach(message => {
            // Doğrudan camelCase kullan
            const senderId = message.senderId;

            // Tarih kontrolü yaparak gerekirse tarih ayırıcısı ekle
            const messageDate = new Date(message.createdAt).toLocaleDateString();
            if (messageDate !== lastMessageDate) {
                const dateDivider = document.createElement('div');
                dateDivider.className = 'chat-date-divider';
                dateDivider.innerHTML = `<span>${messageDate}</span>`;
                fragment.appendChild(dateDivider);
                lastMessageDate = messageDate;
            }

            // Avatar URL'ini belirle
            let avatarUrl = defaultAvatar;
            let username = senderId === currentUserId ? 'Sen' : 'Kullanıcı';

            // Kullanıcı profil bilgilerini kontrol et
            if (userMap[senderId]) {
                avatarUrl = userMap[senderId].avatar || defaultAvatar;
                username = userMap[senderId].username || username;
            }

            // Mesaj öğesini oluştur
            const messageElement = document.createElement('div');
            messageElement.className = `message-group ${senderId === currentUserId ? 'own-message' : ''}`;
            messageElement.setAttribute('data-sender-id', senderId);

            // HTML şablonu oluştur
            messageElement.innerHTML = `
                <div class="message-group-avatar">
                    <img src="${avatarUrl}" alt="${username}" onerror="this.src='${defaultAvatar}'">
                 </div>
                <div class="message-group-content">
                    <div class="message-group-header">
                        <span class="message-author">${username}</span>
                        <span class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</span>
                     </div>
                    <div class="message-content">
                        <p>${message.content}</p>
                 </div>
             </div>
         `;

            fragment.appendChild(messageElement);
        });

        // Tek seferde DOM'a ekle
        chatMessagesContainer.appendChild(fragment);

        // Scrollu en alta indir
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    } catch (error) {
        console.error('Mesajlar yüklenirken hata oluştu:', error);
        chatMessagesContainer.innerHTML = '';

        const errorElement = document.createElement('div');
        errorElement.className = 'error-placeholder';
        errorElement.textContent = 'Mesajlar yüklenirken bir hata oluştu.';
        chatMessagesContainer.appendChild(errorElement);
    }
}

// Realtime mesaj aboneliği
async function subscribeToMessages(conversationId) {
    unsubscribeFromMessages(); // Önceki aboneliği iptal et

    if (!conversationId) {
        console.warn('subscribeToMessages: Geçerli conversationId gerekli.');
        return;
    }

    try {
        const channelName = `messages:${conversationId}`; // Kanal adını basitleştir
        console.log(`Mesaj kanalına abone olunuyor: ${channelName}`);

        messageSubscription = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversationId=eq.${conversationId}`
            }, async (payload) => {
                if (payload.new && payload.new.senderId !== currentUserId) {
                    console.log('Yeni mesaj alındı (realtime - aktif sohbet):', payload.new);
                    const senderId = payload.new.senderId;
                    let senderUsername = 'Kullanıcı';
                    let senderAvatar = defaultAvatar;
                    try {
                        const { data: profile, error } = await supabase
                            .from('users')
                            .select('username, avatar')
                            .eq('id', senderId)
                            .maybeSingle();

                        if (error) {
                            console.error('Realtime mesaj için gönderen profili alınamadı:', error);
                        } else if (profile) {
                            senderUsername = profile.username || senderUsername;
                            senderAvatar = profile.avatar || senderAvatar;
                        }
                    } catch (profileError) {
                        console.error('Profil alınırken hata (realtime):', profileError);
                    }
                    displayMessage(payload.new, senderUsername, senderAvatar);
                }
            })
            .subscribe((status) => {
                console.log(`${channelName} abonelik durumu: ${status}`);
                if (status === 'SUBSCRIBED') {
                    console.log(`Başarıyla ${channelName} kanalına abone olundu.`);
                }
            });

    } catch (error) {
        console.error('Mesaj aboneliğinde hata:', error);
    }
}

// Mesaj aboneliğini sonlandırma
function unsubscribeFromMessages() {
    if (messageSubscription) {
        supabase.removeChannel(messageSubscription);
        messageSubscription = null;
    }
}

// Yeni bir mesajı ekrana görüntüleme (Kullanıcı adı ve avatarı parametre olarak alacak şekilde güncellendi)
function displayMessage(message, authorName = null, authorAvatar = null) {
    const chatMessagesContainer = document.querySelector('.chat-panel .chat-messages');
    if (!chatMessagesContainer || !message) return;

    const senderId = message.senderId;
    if (!senderId) {
        console.warn('displayMessage: Gelen mesajda senderId bulunamadı.', message);
        return;
    }

    // Kimin mesajı olduğunu ve gösterilecek bilgileri belirle
    const isOwnMessage = senderId === currentUserId;
    const displayName = isOwnMessage ? 'Sen' : (authorName || 'Kullanıcı'); // Gelen adı kullan, yoksa 'Kullanıcı'
    let displayAvatar = defaultAvatar;

    if (isOwnMessage) {
        // Kendi avatarımızı al
        const userAvatarElement = document.querySelector('.dm-footer .dm-user-avatar img');
        if (userAvatarElement) {
            displayAvatar = userAvatarElement.src;
        }
    } else {
        // Diğer kullanıcının avatarını kullan (parametre olarak geleni veya varsayılanı)
        displayAvatar = authorAvatar || defaultAvatar;
        // İsteğe bağlı: Sohbet başlığındaki avatarı da kontrol edebiliriz ama parametre daha güvenilir
        // const chatHeaderAvatar = document.querySelector('.chat-avatar img');
        // if (chatHeaderAvatar) displayAvatar = chatHeaderAvatar.src;
    }

    // Mesaj öğesini oluştur
    const messageElement = document.createElement('div');
    messageElement.className = `message-group ${isOwnMessage ? 'own-message' : ''}`;
    messageElement.setAttribute('data-sender-id', senderId);

    // HTML şablonu oluştur (Kullanıcı adı dinamik olarak eklendi)
    messageElement.innerHTML = `
        <div class="message-group-avatar">
            <img src="${displayAvatar}" alt="${displayName}" onerror="this.src='${defaultAvatar}'">
        </div>
        <div class="message-group-content">
            <div class="message-group-header">
                <span class="message-author">${displayName}</span>
                <span class="message-time">${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="message-content">
                <p>${message.content}</p>
            </div>
        </div>
    `;

    chatMessagesContainer.appendChild(messageElement);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function setupMessageSending(chatTextarea) {
    if (!chatTextarea) {
        console.error('setupMessageSending: chatTextarea elementi bulunamadı');
        return;
    }

    // Eski listener'ları temizle (varsa)
    const newTextarea = chatTextarea.cloneNode(true);
    if (chatTextarea.parentNode) {
        chatTextarea.parentNode.replaceChild(newTextarea, chatTextarea);
    }

    // Enter tuşu ile mesaj gönderme
    newTextarea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(newTextarea);
        }
    });

    // Gönder butonu için event listener
    const sendButton = document.querySelector('.chat-textbox .send-message-btn');
    if (sendButton) {
        const newSendButton = sendButton.cloneNode(true);
        if (sendButton.parentNode) {
            sendButton.parentNode.replaceChild(newSendButton, sendButton);
        }

        newSendButton.addEventListener('click', () => {
            sendMessage(newTextarea);
        });
    }

    // Mesaj gönderme yardımcı fonksiyonu
    async function sendMessage(textarea) {
        const messageText = textarea.value.trim();
        if (!messageText || !currentConversationId) {
            console.warn('Mesaj göndermek için içerik ve geçerli conversationId gerekli.');
            return;
        }

        console.log(`Mesaj gönderiliyor: ${messageText} (ConversationID: ${currentConversationId}, SenderID: ${currentUserId})`);

        try {
            // Insert edilecek veriye conversationId'yi ekle
            const messageData = {
                content: messageText,
                senderId: currentUserId,
                conversationId: currentConversationId, // CHECK kuralı için eklendi
                // receiverId'yi ayrıca göndermeye gerek yok, conversationId yeterli olabilir.
                // Eğer tablo yapınızda receiverId zorunluysa, onu da ekleyebilirsiniz:
                // receiverId: currentConversationId // Bu isimlendirme kafa karıştırıcı, 
                // currentConversationId aslında diğer kullanıcının ID'si
                // DM sisteminde conversationId'nin neyi temsil ettiğini netleştirmek iyi olur.
            };

            console.log('Eklenecek mesaj verisi:', messageData);

            const { data, error } = await supabase
                .from('messages')
                .insert([messageData])
                .select();

            if (error) {
                console.error('Mesaj eklenirken Supabase hatası:', error);
                // Hata detayını kullanıcıya göstermeyi düşünebilirsiniz
                if (error.code === '23514') { // Check constraint hatası
                    alert('Mesaj gönderilemedi. (Kural İhlali: ' + error.message + ')');
                } else {
                    alert('Mesaj gönderilemedi. Lütfen tekrar deneyiniz.');
                }
                throw error; // Hatayı tekrar fırlatarak işlemi durdur
            }

            // Mesaj alanını temizle
            textarea.value = '';

            // Başarılı mesaj gönderildiyse ve veri döndüyse ekranda göster
            if (data && data.length > 0) {
                console.log('Mesaj başarıyla gönderildi ve eklendi:', data[0]);
                displayMessage(data[0]);
            }

        } catch (error) {
            // Zaten yukarıda loglandı ve kullanıcıya alert gösterildi.
            // Burada ek bir işlem yapmaya gerek yok.
            // console.error('Mesaj gönderilirken genel hata:', error);
        }
    }
}

function updateFriendCounters() {
    // Çevrimiçi arkadaş sayacı
    const onlineCount = document.querySelector('.online-count');
    const onlineFriendElements = document.querySelectorAll('.online-friends .friend-row');
    if (onlineCount) {
        onlineCount.textContent = onlineFriendElements.length;
    }

    // Çevrimdışı arkadaş sayacı
    const offlineCount = document.querySelector('.offline-count');
    const offlineFriendElements = document.querySelectorAll('.offline-friends .friend-row');
    if (offlineCount) {
        offlineCount.textContent = offlineFriendElements.length;
    }

    // Başlıkların görünürlüğünü ayarla
    const onlineSection = document.querySelector('.online-section-title');
    const offlineSection = document.querySelector('.offline-section-title');

    if (onlineSection) {
        onlineSection.style.display = onlineFriendElements.length > 0 ? 'flex' : 'none';
    }

    if (offlineSection) {
        offlineSection.style.display = offlineFriendElements.length > 0 ? 'flex' : 'none';
    }
}

// İki kullanıcı arasındaki DM sohbetini bulur veya oluşturur
async function findOrCreateConversation(userId1, userId2) {
    if (!userId1 || !userId2) {
        console.error("findOrCreateConversation: İki kullanıcı ID'si de gerekli.");
        return null;
    }
    // Kendisiyle sohbeti engelle (isteğe bağlı ama önerilir)
    if (userId1 === userId2) {
        console.warn("Kendinizle sohbet oluşturamazsınız.");
        return null;
    }
    console.log(`DM Sohbeti aranıyor/oluşturuluyor: ${userId1} ve ${userId2}`);

    try {
        // Mevcut DM sohbetini ara: participantIds her iki kullanıcıyı da içermeli VE isGroup=false olmalı
        const participants = [userId1, userId2].sort(); // Tutarlılık için ID'leri sırala
        const { data: existingConversation, error: findError } = await supabase
            .from('conversations')
            .select('id')
            // participantIds dizisinin her iki kullanıcıyı da içerdiğini kontrol et (@> operatörü)
            .contains('participantIds', participants)
            // Sadece DM sohbetlerini bul (grup olmayanları)
            .eq('isGroup', false)
            .maybeSingle();

        if (findError) {
            console.error("Sohbet aranırken hata:", findError);
            throw findError;
        }

        // Sohbet bulunduysa ID'sini döndür
        if (existingConversation) {
            console.log("Mevcut DM sohbeti bulundu:", existingConversation.id);
            return existingConversation.id;
        }

        // Sohbet yoksa yeni bir DM sohbeti oluştur
        console.log("Mevcut DM sohbeti bulunamadı, yenisi oluşturuluyor...");
        const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert([
                {
                    participantIds: participants, // Sıralanmış ID dizisini ekle
                    isGroup: false // Bunun bir DM sohbeti olduğunu belirt
                    // groupName, groupAvatar null olabilir veya varsayılan değer atanabilir
                }
            ])
            .select('id')
            .single();

        if (createError) {
            console.error("Yeni DM sohbeti oluşturulurken hata:", createError);
            // RLS veya başka kısıtlamalar olabilir
            if (createError.message.includes("security policies")) {
                alert("Yeni sohbet oluşturulamadı. Güvenlik politikaları (RLS) INSERT işlemini engelliyor olabilir.");
            } else if (createError.message.includes("violates check constraint")) {
                alert("Yeni sohbet oluşturulamadı. Bir CHECK kuralı ihlal edilmiş olabilir (örn: participantIds boş olamaz).");
            } else if (createError.message.includes("violates not-null constraint")) {
                alert("Yeni sohbet oluşturulamadı. Gerekli bir sütun (örn: isGroup) boş bırakılmış olabilir.");
            }
            throw createError;
        }

        if (newConversation) {
            console.log("Yeni DM sohbeti oluşturuldu:", newConversation.id);
            return newConversation.id;
        } else {
            console.error("Sohbet oluşturuldu ancak Supabase ID döndürmedi.");
            throw new Error("Sohbet oluşturuldu ancak ID alınamadı.");
        }

    } catch (error) {
        console.error("findOrCreateConversation içinde genel hata:", error);
        alert("Sohbet bilgisi alınırken veya oluşturulurken bir hata oluştu. Konsolu kontrol edin.")
        return null;
    }
}

// Emoji picker'ı kuran fonksiyon
function setupEmojiPicker(emojiButton, textareaElement, emojiPickerElement) {
    // Emoji picker'ı gizle
    if (emojiPickerElement) {
        emojiPickerElement.style.display = 'none';
        emojiPickerElement.style.position = 'absolute';
        emojiPickerElement.style.bottom = '80px';
        emojiPickerElement.style.right = '16px';
        emojiPickerElement.style.zIndex = '1000';
    }

    // Emoji butonuna tıklama olayı
    emojiButton.addEventListener('click', () => {
        if (emojiPickerElement) {
            // Toggle emoji picker görünürlüğü
            const isVisible = emojiPickerElement.style.display === 'block';
            emojiPickerElement.style.display = isVisible ? 'none' : 'block';
        } else {
            console.error('Emoji picker elementi bulunamadı');
        }
    });

    // Emoji seçildiğinde textarea'ya ekleme
    if (emojiPickerElement) {
        emojiPickerElement.addEventListener('emoji-click', event => {
            const emoji = event.detail.unicode;
            const cursorPos = textareaElement.selectionStart;
            const text = textareaElement.value;
            const newText = text.substring(0, cursorPos) + emoji + text.substring(cursorPos);
            textareaElement.value = newText;
            textareaElement.focus();
            textareaElement.selectionStart = cursorPos + emoji.length;
            textareaElement.selectionEnd = cursorPos + emoji.length;
        });
    }

    // Döküman tıklamalarını dinleyerek emoji picker'ı kapat
    document.addEventListener('click', event => {
        if (emojiPickerElement &&
            event.target !== emojiButton &&
            event.target !== emojiPickerElement &&
            !emojiButton.contains(event.target) &&
            !emojiPickerElement.contains(event.target)) {
            emojiPickerElement.style.display = 'none';
        }
    });
}

// Helper function to show the modal
function showModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'flex'; // Use 'flex' or 'block' based on your CSS
        // Optionally add a class for animations
        // modalElement.classList.add('modal-visible');
    }
}

// Helper function to hide the modal
function hideModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'none';
        // Optionally remove the animation class
        // modalElement.classList.remove('modal-visible');
    }
}

// Arkadaş Ekle modalını kur
function setupAddFriendModal() {
    const addFriendButton = document.querySelector('.add-friend-btn'); // Selector for your "Add Friend" button
    const addFriendModal = document.getElementById('addFriendModal'); // ID of your modal container
    const closeModalButton = addFriendModal?.querySelector('.close-modal-btn'); // Selector for the close button inside the modal
    const addFriendForm = addFriendModal?.querySelector('#add-friend-form'); // ID of the form inside the modal
    const usernameInput = addFriendModal?.querySelector('#add-friend-username-input'); // ID of the username input
    const messageArea = addFriendModal?.querySelector('.modal-message-area'); // Selector for the message area

    if (!addFriendButton || !addFriendModal || !closeModalButton || !addFriendForm || !usernameInput || !messageArea) {
        console.warn('Arkadaş Ekle modal elementleri bulunamadı. Buton işlevsiz olabilir.');
        return;
    }

    // Show modal when Add Friend button is clicked
    addFriendButton.addEventListener('click', () => {
        showModal(addFriendModal);
        usernameInput.focus(); // Focus the input when modal opens
        // Clear previous messages
        messageArea.style.display = 'none';
        messageArea.textContent = '';
        messageArea.className = 'modal-message-area'; // Reset classes
    });

    // Hide modal when close button is clicked
    closeModalButton.addEventListener('click', () => {
        hideModal(addFriendModal);
    });

    // Hide modal when clicking outside the modal content
    addFriendModal.addEventListener('click', (event) => {
        if (event.target === addFriendModal) {
            hideModal(addFriendModal);
        }
    });

    // Handle form submission
    addFriendForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        const username = usernameInput.value.trim();
        const submitButton = addFriendForm.querySelector('.modal-submit-button'); // Selector for the submit button

        if (!username) {
            displayModalMessage('Lütfen bir kullanıcı adı girin.', 'error', messageArea);
            return;
        }

        if (submitButton) submitButton.disabled = true; // Disable button during request
        displayModalMessage('Arkadaşlık isteği gönderiliyor...', 'info', messageArea); // Use 'info' or similar class for loading

        try {
            // 1. Find the user by username
            const { data: users, error: findError } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .neq('id', currentUserId); // Exclude self

            if (findError) throw new Error(`Kullanıcı aranırken hata: ${findError.message}`);
            if (!users || users.length === 0) {
                throw new Error(`'${username}' kullanıcısı bulunamadı.`);
            }
            if (users.length > 1) {
                // Should ideally not happen if username is unique, but handle just in case
                throw new Error(`'${username}' ile eşleşen birden fazla kullanıcı bulundu. Lütfen daha belirgin bir kullanıcı adı deneyin.`);
            }

            const friendId = users[0].id;

            // 2. Check if already friends or request pending
            const { data: existingFriendship, error: checkError } = await supabase
                .from('friendships')
                .select('id, status')
                .or(`(user_id_1.eq.${currentUserId},user_id_2.eq.${friendId}),(user_id_1.eq.${friendId},user_id_2.eq.${currentUserId})`)
                .maybeSingle();

            if (checkError) throw new Error(`Arkadaşlık durumu kontrol edilirken hata: ${checkError.message}`);

            if (existingFriendship) {
                if (existingFriendship.status === 'accepted') {
                    throw new Error(`'${username}' ile zaten arkadaşsınız.`);
                } else if (existingFriendship.status === 'pending') {
                    throw new Error(`'${username}' kullanıcısına zaten bir istek gönderilmiş veya ondan bir istek var.`);
                } else if (existingFriendship.status === 'blocked') {
                    throw new Error(`Bu kullanıcıyla etkileşim kuramazsınız.`);
                }
            }


            // 3. Send friend request
            const { error: insertError } = await supabase
                .from('friendships')
                .insert({
                    user_id_1: currentUserId,
                    user_id_2: friendId,
                    status: 'pending'
                });

            if (insertError) throw new Error(`Arkadaşlık isteği gönderilirken hata: ${insertError.message}`);

            displayModalMessage(`'${username}' kullanıcısına arkadaşlık isteği gönderildi!`, 'success', messageArea);
            usernameInput.value = ''; // Clear input on success
            // Optionally close the modal after a short delay
            // setTimeout(() => hideModal(addFriendModal), 2000);

        } catch (error) {
            console.error('Arkadaş ekleme hatası:', error);
            displayModalMessage(error.message || 'Bir hata oluştu.', 'error', messageArea);
        } finally {
            if (submitButton) submitButton.disabled = false; // Re-enable button
        }
    });
}

// Helper function to display messages inside the modal
function displayModalMessage(message, type, messageAreaElement) {
    if (messageAreaElement) {
        messageAreaElement.textContent = message;
        // Reset classes and add the new type
        messageAreaElement.className = 'modal-message-area'; // Base class
        messageAreaElement.classList.add(type); // 'success', 'error', or 'info'
        messageAreaElement.style.display = 'flex'; // Show the message area
    }
}

// Tüm gelen mesajları dinleyip bildirim sesi çalma ve okunmamış sayısını güncelleme
async function subscribeToAllMessages() {
    // Eğer zaten bir abonelik varsa önce onu kaldır
    if (allMessagesSubscription) {
        try {
            await supabase.removeSubscription(allMessagesSubscription);
            console.log('Önceki global mesaj aboneliği kaldırıldı.');
        } catch (removeError) {
            console.error('Önceki global mesaj aboneliği kaldırılamadı:', removeError);
        }
        allMessagesSubscription = null;
    }

    if (!supabase || !currentUserId) {
        console.error('Global mesaj aboneliği başlatılamadı: Supabase veya kullanıcı ID eksik.');
        return;
    }
    console.log('Global mesaj aboneliği başlatılıyor...');

    allMessagesSubscription = supabase
        .channel('public:messages')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            },
            async (payload) => {
                const newMessage = payload.new;
                console.log('Global listener: Yeni mesaj eklendi:', newMessage);

                // Kendi mesajımızı veya geçersiz mesajı yoksay
                if (!newMessage || newMessage.senderId === currentUserId || !newMessage.conversationId) {
                    return;
                }

                try {
                    // Kullanıcının bu sohbette olup olmadığını kontrol et (performans için opsiyonel)
                    // Şimdilik sadece senderId'ye bakarak sesi çalıyoruz
                    // Daha güvenli: const { data: conv } = await supabase.from('conversations').select('participantIds').eq('id', newMessage.conversationId).maybeSingle();
                    // if (!conv || !conv.participantIds.includes(currentUserId)) return;

                    // 1. Bildirim Sesini Çal
                    if (messageNotificationSound) {
                        try {
                            messageNotificationSound.currentTime = 0;
                            await messageNotificationSound.play();
                            console.log('Global listener: Bildirim sesi çalındı.');
                        } catch (playError) {
                            console.warn('Bildirim sesi çalınamadı (global):', playError);
                        }
                    }

                    // 2. Okunmamış Mesaj Sayacını Güncelle
                    const chatPanel = document.querySelector('.chat-panel');
                    const isActiveChatOpen = !chatPanel?.classList.contains('hidden') && currentConversationId === newMessage.conversationId;

                    // Eğer ilgili sohbet açık değilse sayacı artır
                    if (!isActiveChatOpen) {
                        // Diğer katılımcının ID'sini bulmamız lazım. Conversation fetch edilebilir veya mesajda receiverId varsa kullanılabilir.
                        // Şimdilik senderId'yi anahtar olarak kullanalım (DM varsayımı)
                        const counterPartyId = newMessage.senderId; // DM varsayımı!
                        if (counterPartyId) {
                            unreadCounts[counterPartyId] = (unreadCounts[counterPartyId] || 0) + 1;
                            console.log(`Global listener: Okunmamış sayaç güncellendi - ${counterPartyId}: ${unreadCounts[counterPartyId]}`);
                            updateUnreadBadge(counterPartyId, unreadCounts[counterPartyId]);
                        }
                    }
                } catch (error) {
                    console.error('Global mesaj işlenirken hata:', error);
                }
            })
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Global mesaj kanalına başarıyla abone olundu.');
            } else {
                console.warn(`Global mesaj kanalı durumu: ${status}`, err || '');
            }
        });
}

// Okunmamış mesaj sayacı için UI güncelleme fonksiyonu
function updateUnreadBadge(userId, count) {
    const dmItem = document.querySelector(`.dm-item[data-user-id="${userId}"]`);
    if (!dmItem) return;

    let badge = dmItem.querySelector('.dm-notification');
    if (!badge) {
        // Eğer badge yoksa oluştur (createDMRow'da eklenmeli ama yedek kontrol)
        badge = document.createElement('div');
        badge.className = 'dm-notification';
        // Badge'i uygun bir yere ekle, örneğin dm-info içine?
        const dmInfo = dmItem.querySelector('.dm-info');
        if (dmInfo) dmInfo.appendChild(badge);
        else dmItem.appendChild(badge); // Veya direkt dm-item'a
    }

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count; // Limitleme
        badge.style.display = 'flex';
        console.log(`Badge gösteriliyor: ${userId} - ${count}`);
    } else {
        badge.textContent = '0'; // İçeriği temizle
        badge.style.display = 'none';
        console.log(`Badge gizleniyor: ${userId}`);
    }
} 