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

// Mesaj gönderme işlevselliğini kurar
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
                conversationId: currentConversationId,
            };

            console.log('Eklenecek mesaj verisi:', messageData);

            const { data, error } = await supabase
                .from('messages')
                .insert([messageData])
                .select();

            if (error) {
                console.error('Mesaj eklenirken Supabase hatası:', error);
                if (error.code === '23514') {
                    alert('Mesaj gönderilemedi. (Kural İhlali: ' + error.message + ')');
                } else {
                    alert('Mesaj gönderilemedi. Lütfen tekrar deneyiniz.');
                }
                throw error;
            }

            textarea.value = '';

            if (data && data.length > 0) {
                console.log('Mesaj başarıyla gönderildi ve eklendi:', data[0]);
                // Kendi gönderdiğimiz mesajı da göstermek için (opsiyonel)
                // displayMessage(data[0]); 
            }

        } catch (error) {
            // Hata zaten loglandı ve alert gösterildi.
        }
    }
}

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

// Arkadaşlık durumu için realtime abonelik
async function subscribeFriendshipUpdates() {
    try {
        console.log('Arkadaşlık durumu güncellemeleri için abone olunuyor...');

        const friendshipSubscription = supabase
            .channel('friendship-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'friendships',
                filter: `user_id_1.eq.${currentUserId}`
            }, async (payload) => {
                console.log('Arkadaşlık durumu güncellendi (gönderen olarak):', payload);

                // Status accepted ise, arkadaş kabul edilmiş
                if (payload.new && payload.new.status === 'accepted') {
                    showToast('Arkadaşlık isteğiniz kabul edildi!', 'success');
                    await loadFriends();
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'friendships',
                filter: `user_id_2.eq.${currentUserId}`
            }, async (payload) => {
                console.log('Arkadaşlık durumu güncellendi (alıcı olarak):', payload);

                // Status accepted ise, arkadaş listesini güncelle
                if (payload.new && payload.new.status === 'accepted') {
                    await loadFriends();
                }
            })
            .subscribe((status) => {
                console.log(`Arkadaşlık kanalı abonelik durumu: ${status}`);
            });

    } catch (error) {
        console.error('Arkadaşlık durumu aboneliğinde hata:', error);
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

            // Başlangıç online durumunu kontrol et
            const isInitiallyOnline = onlineFriends.has(userId);

            // Arkadaş satırını oluştur ve durumu ayarla
            const friendRow = createFriendRow(userId, username, avatar, isInitiallyOnline);

            // DM satırını oluştur ve durumu ayarla
            const dmRow = createDMRow(userId, username, avatar, isInitiallyOnline);

            // Online durumuna göre doğru fragmana ekle
            if (isInitiallyOnline) {
                onlineFragment.appendChild(friendRow);
            } else {
                offlineFragment.appendChild(friendRow);
            }

            // DM satırını her zaman dm fragmanına ekle
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

    function createFriendRow(userId, username, avatar, isOnline) {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-row';
        friendElement.dataset.userId = userId;
        friendElement.dataset.username = username;
        friendElement.dataset.avatar = avatar;

        friendElement.innerHTML = `
                    <div class="friend-avatar">
                <img src="${avatar}" alt="${username}" onerror="this.src='${defaultAvatar}'">
                        <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
                            </div>
                    <div class="friend-info">
                <div class="friend-name">${username}</div>
                <div class="friend-status">${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</div>
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

// Arkadaş listesini yeniden yüklemek için yardımcı fonksiyon
async function loadFriends() {
    // ... (fonksiyon içeriği) ...
}

// Bildirim sayacını güncelleme fonksiyonu
async function updateNotificationCount() {
    // ... (fonksiyon içeriği) ...
}

// ... (diğer fonksiyon tanımları) ...

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

// ... (diğer fonksiyon tanımları) ...

// ... (diğer yardımcı fonksiyonlar) ... 