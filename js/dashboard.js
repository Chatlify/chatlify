import { supabase } from './auth_config.js'; // Supabase istemcisini import et

// Global değişkenler tanımları
let currentUserId = null;
let onlineFriends = new Set();
let presenceChannel = null;
let currentConversationId = null; // Aktif sohbet için ID
let messageSubscription = null; // Realtime mesaj aboneliği
let sampleColumnFormat = 'camelCase'; // Varsayılan olarak camelCase formatını kullan
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
function subscribeToMessages(conversationId) {
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
                // Filtrelemeyi sadece conversationId ile yap
                filter: `conversationId=eq.${conversationId}`
            }, (payload) => {
                // Kendi gönderdiğimiz mesajları tekrar eklememek için kontrol edebiliriz
                // Ancak genellikle realtime olayı sadece diğer istemcilere gider.
                // Emin olmak için kontrol ekleyelim:
                if (payload.new && payload.new.senderId !== currentUserId) {
                    console.log('Yeni mesaj alındı (realtime):', payload.new);
                    displayMessage(payload.new);
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

// Yeni bir mesajı ekrana görüntüleme
function displayMessage(message) {
    const chatMessagesContainer = document.querySelector('.chat-panel .chat-messages');
    if (!chatMessagesContainer || !message) return; // message null olabilir

    // Mesaj objesinden senderId al (camelCase)
    const senderId = message.senderId;
    if (!senderId) {
        console.warn('displayMessage: Gelen mesajda senderId bulunamadı.', message);
        return;
    }

    // Avatar URL'ini belirle
    let avatarUrl = defaultAvatar; // Varsayılan avatar

    // Eğer mesaj güncel kullanıcıdan geliyorsa, mevcut kullanıcının avatarını kullan
    if (senderId === currentUserId) {
        const userAvatar = document.querySelector('.dm-footer .dm-user-avatar img');
        if (userAvatar) {
            avatarUrl = userAvatar.src;
        }
    } else {
        // Sohbet başlığından diğer kullanıcının avatarını al
        const chatHeaderAvatar = document.querySelector('.chat-avatar img');
        if (chatHeaderAvatar) {
            avatarUrl = chatHeaderAvatar.src;
        }
    }

    // Mesaj öğesini oluştur
    const messageElement = document.createElement('div');
    messageElement.className = `message-group ${senderId === currentUserId ? 'own-message' : ''}`;
    messageElement.setAttribute('data-sender-id', senderId);

    // HTML şablonu oluştur
    messageElement.innerHTML = `
        <div class="message-group-avatar">
            <img src="${avatarUrl}" alt="Avatar">
        </div>
        <div class="message-group-content">
            <div class="message-group-header">
                <span class="message-author">${senderId === currentUserId ? 'Sen' : 'Kullanıcı'}</span>
                <span class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</span>
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