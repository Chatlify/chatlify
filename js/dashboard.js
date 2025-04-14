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

// --- FONKSIYON TANIMLARI --- //

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

// Belirli bir bölümü gösterir
function showSection(sectionName) {
    console.log(`Bölüm gösteriliyor: ${sectionName}`);

    // Gerekli elementleri seç
    const friendsPanel = document.querySelector('.friends-panel-container');
    const chatPanel = document.querySelector('.chat-panel');
    const onlineSection = document.querySelector('.online-section-title');
    const offlineSection = document.querySelector('.offline-section-title');
    const pendingSection = document.querySelector('.pending-section-title');
    const onlineList = document.querySelector('.online-friends');
    const offlineList = document.querySelector('.offline-friends');
    const pendingList = document.querySelector('.pending-requests');

    if (!friendsPanel) return;

    // Önce sohbeti kapat (açıksa)
    closeChatPanel();

    // Tüm sekmelerin active sınıfını kaldır
    document.querySelectorAll('.dashboard-header .tab').forEach(tab => {
        if (tab.textContent.trim() === sectionName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Ana paneli görünür yap
    friendsPanel.classList.remove('hidden');
    if (chatPanel) chatPanel.classList.add('hidden');

    // Hangi içeriğin gösterileceğine karar ver
    if (sectionName === 'Tüm Arkadaşlar') {
        // Tüm sekme, herşeyi göster
        if (onlineSection) onlineSection.style.display = '';
        if (offlineSection) offlineSection.style.display = '';
        if (pendingSection) pendingSection.style.display = 'none';
        if (onlineList) onlineList.style.display = '';
        if (offlineList) offlineList.style.display = '';
        if (pendingList) pendingList.style.display = 'none';
    }
    else if (sectionName === 'Çevrimiçi') {
        // Sadece çevrimiçi olanları göster
        if (onlineSection) onlineSection.style.display = '';
        if (offlineSection) offlineSection.style.display = 'none';
        if (pendingSection) pendingSection.style.display = 'none';
        if (onlineList) onlineList.style.display = '';
        if (offlineList) offlineList.style.display = 'none';
        if (pendingList) pendingList.style.display = 'none';
    }
    else if (sectionName === 'Bekleyen') {
        // Sadece bekleyen istekleri göster
        if (onlineSection) onlineSection.style.display = 'none';
        if (offlineSection) offlineSection.style.display = 'none';
        if (pendingSection) pendingSection.style.display = '';
        if (onlineList) onlineList.style.display = 'none';
        if (offlineList) offlineList.style.display = 'none';
        if (pendingList) pendingList.style.display = '';

        // Bekleyen istekleri yeniden yükle (eğer liste görünür hale geldiyse)
        const pendingCountBadge = document.querySelector('.pending-count');
        if (pendingList && pendingList.style.display !== 'none') {
            loadPendingRequests(pendingList, pendingCountBadge);
        } // Sadece görünürse yükle
    }
}

// Sunucu panelini kurma
function setupServerPanel() {
    // Sunucu panelini kurma işlemleri burada yapılabilir
}

// Kontekst menüleri için dinleyicileri ekleme
function addContextMenuListeners() {
    // ... (fonksiyon içeriği) ...
}

// initializePresence fonksiyon tanımı
function initializePresence() {
    // ... (fonksiyon içeriği) ...
}

// Arkadaş Ekle modalını kur
function setupAddFriendModal() {
    // ... (fonksiyon içeriği) ...
}

// Arkadaşlık durumu için realtime abonelik
async function subscribeFriendshipUpdates() {
    // ... (fonksiyon içeriği) ...
}

// Tüm gelen mesajları dinleyip bildirim sesi çalma ve okunmamış sayısını güncelleme
async function subscribeToAllMessages() {
    // ... (fonksiyon içeriği) ...
}

// Okunmamış mesaj sayacı için UI güncelleme fonksiyonu
function updateUnreadBadge(userId, count) {
    // ... (fonksiyon içeriği) ...
}

// Helper function to display messages inside the modal
function displayModalMessage(message, type, messageAreaElement) {
    // ... (fonksiyon içeriği) ...
}

// Helper function to show the modal
function showModal(modalElement) {
    // ... (fonksiyon içeriği) ...
}

// Helper function to hide the modal
function hideModal(modalElement) {
    // ... (fonksiyon içeriği) ...
}

// --- DOMContentLoaded --- //

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard JS başlatılıyor...');

    // Ses dosyasını yükle
    try {
        messageNotificationSound = new Audio('sounds/MessageNotificationSound.mp3');
        messageNotificationSound.load();
        console.log('Mesaj bildirim sesi yüklendi.');
    } catch (error) {
        console.error('Mesaj bildirim sesi yüklenirken hata:', error);
        messageNotificationSound = null;
    }

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
        showSection('Tüm Arkadaşlar'); // Artık fonksiyon tanımlı olmalı

        // Arkadaş listesi ve bekleyen istekleri paralel yükle
        await Promise.all([
            loadAllFriends({ onlineList, offlineList, dmList, onlineSection, offlineSection }),
            loadPendingRequests(pendingList, pendingCountBadge)
        ]);

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
        // Kullanıcıya daha genel bir hata mesajı gösterilebilir
        // alert('Sayfa başlatılırken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
    }
});

// --- ASENKRON FONKSIYONLAR VE DİĞERLERİ --- //

// Tüm arkadaşları yükleme fonksiyonu (optimize edilmiş)
async function loadAllFriends({ onlineList, offlineList, dmList, onlineSection, offlineSection }) {
    // ... (fonksiyon içeriği) ...
}

// Bekleyen istekleri yükleme
async function loadPendingRequests(pendingList, pendingCountBadge) {
    // ... (fonksiyon içeriği) ...
}

// Arkadaşlık isteğini kabul et veya reddet
async function handleFriendRequest(requestId, action, userId, username) {
    // ... (fonksiyon içeriği) ...
}

// Sohbet panelini açma
async function openChatPanel(userId, username, avatar) {
    // ... (fonksiyon içeriği) ...
}

// Sohbet panelini kapatma
function closeChatPanel() {
    // ... (fonksiyon içeriği) ...
}

// Sohbet mesajlarını yükleme
async function loadConversationMessages(conversationId) {
    // ... (fonksiyon içeriği) ...
}

// Belirli bir sohbet için mesajları dinleme
function subscribeToMessages(conversationId) {
    // ... (fonksiyon içeriği) ...
}

// Mevcut mesaj aboneliğini sonlandırma
async function unsubscribeFromMessages() {
    // ... (fonksiyon içeriği) ...
}

// Mesajı ekranda gösterme
function displayMessage(message, senderUsername = 'Kullanıcı', senderAvatar = defaultAvatar) {
    // ... (fonksiyon içeriği) ...
}

// Arkadaş sayaçlarını güncelleme
function updateFriendCounters() {
    // ... (fonksiyon içeriği) ...
}

// İki kullanıcı arasındaki DM sohbetini bulur veya oluşturur
async function findOrCreateConversation(userId1, userId2) {
    // ... (fonksiyon içeriği) ...
}

// Arkadaş listesini yeniden yüklemek için yardımcı fonksiyon
async function loadFriends() {
    // ... (fonksiyon içeriği) ...
}

// Bildirim sayacını güncelleme fonksiyonu
async function updateNotificationCount() {
    // ... (fonksiyon içeriği) ...
}

// Bildirim gösterme fonksiyonu
function showToast(message, type = 'info') {
    // ... (fonksiyon içeriği) ...
}

// Belirli bir kullanıcının online durumunu UI'da günceller
function updateOnlineStatusUI(userId, isOnline) {
    // ... (fonksiyon içeriği) ...
}

// Tüm arkadaşların online durumunu başlangıçta ayarlar
function updateAllFriendsOnlineStatus() {
    // ... (fonksiyon içeriği) ...
}

// Bağlam menüsü elementini oluşturur veya mevcut olanı döndürür
function createContextMenuElement() {
    // ... (fonksiyon içeriği) ...
}

// Menü içeriğini dinamik olarak oluşturur
function buildContextMenuContent(menu, userId, username, avatar) {
    // ... (fonksiyon içeriği) ...
}

// Bağlam menüsünü gösterir
function showContextMenu(menu, x, y) {
    // ... (fonksiyon içeriği) ...
}

// Bağlam menüsünü gizler
function hideContextMenu(menu) {
    // ... (fonksiyon içeriği) ...
} 