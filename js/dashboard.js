import { supabase } from './auth_config.js'; // Supabase istemcisini import et

// Global değişkenler tanımları
let currentUserId = null;
let onlineFriends = new Set();
let presenceChannel = null;
const defaultAvatar = 'images/DefaultAvatar.png';

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

            // Profili yükle (yeni güvenli fonksiyon)
            await loadUserProfile();

            // Arkadaşları yükle
            loadAllFriends();

            // Mesaj gönderme sistemini kur
            setupMessageSending();

            // Presence sistemini başlat
            initializePresence();

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
async function loadUserProfile() {
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
            setDefaultProfileUI();
            return;
        }

        if (profile) {
            updateProfileUI(profile);
        } else {
            console.warn(`${currentUserId} ID'li kullanıcı için profil bulunamadı`);
            setDefaultProfileUI();
        }
    } catch (error) {
        console.error('Profil yüklenirken beklenmeyen hata:', error);
        setDefaultProfileUI();
    }
}

// Profil UI güncellemesi
function updateProfileUI(profile) {
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
function setDefaultProfileUI() {
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
            const dmRow = createDMRow(userId, username, avatar);

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

    function createDMRow(userId, username, avatar) {
        const dmElement = document.createElement('div');
        dmElement.className = 'dm-item';
        dmElement.dataset.userId = userId;
        dmElement.dataset.username = username;
        dmElement.dataset.avatar = avatar;

        dmElement.innerHTML = `
            <div class="dm-avatar">
                <img src="${avatar}" alt="${username}" onerror="this.src='${defaultAvatar}'">
                <div class="dm-status offline"></div>
            </div>
            <div class="dm-info">
                <div class="dm-name">${username}</div>
                <div class="dm-activity">Çevrimdışı</div>
            </div>
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
    // Kontekst menüleri için dinleyicileri ekleme işlemleri burada yapılabilir
}

// Presence takip sistemini başlatma
function initializePresence() {
    // Presence takip sistemini başlatma işlemleri burada yapılabilir
}

// Diğer yardımcı fonksiyonlar burada tanımlanabilir
function showSection(section) {
    // showSection işlemi burada yapılabilir
}

function openChatPanel(userId, username, avatar) {
    // openChatPanel işlemi burada yapılabilir
}

function setupMessageSending(chatTextarea) {
    // setupMessageSending işlemi burada yapılabilir
}

function updateFriendCounters() {
    // updateFriendCounters işlemi burada yapılabilir
} 