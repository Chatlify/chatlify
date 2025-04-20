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
let unreadCounts = {}; // Okunmamış mesaj sayaçları { userId: count }
const TENOR_API_KEY = 'AIzaSyCjseHq-Gn4cii_fVDtSX3whyY94orNWPM'; // Tenor API anahtarı

document.addEventListener('DOMContentLoaded', function () {
    init();
});

async function init() {
    // Session kontrolü
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Oturum yoksa login sayfasına yönlendir
        window.location.href = '/login.html';
        return;
    }

    // Global değişkenleri ayarla
    currentUser = session.user;
    currentUserId = currentUser.id;

    // Tab kontrolleri
    setupTabControls();

    // Arama panellerini kur
    setupSearchPanel();
    setupDMSearchPanel();

    // Mesaj gönderme
    messageInput = document.getElementById('message-input');
    sendButton = document.getElementById('send-button');
    setupMessageSending();

    // ... existing code ...
}

// Ana arama paneli kurulumu
function setupSearchPanel() {
    const searchInput = document.getElementById('global-search');
    const clearButton = document.getElementById('clear-search');
    const searchResults = document.getElementById('search-results');

    if (!searchInput || !clearButton || !searchResults) return;

    // Input içeriği değiştiğinde
    searchInput.addEventListener('input', function () {
        const query = this.value.trim();

        // Temizle butonunu göster/gizle
        clearButton.style.display = query.length > 0 ? 'block' : 'none';

        if (query.length >= 2) {
            performSearch(query);
        } else {
            searchResults.classList.remove('show');
        }
    });

    // Temizle butonuna tıklandığında
    clearButton.addEventListener('click', function () {
        searchInput.value = '';
        clearButton.style.display = 'none';
        searchResults.classList.remove('show');
    });

    // Arama sonucu işlevselliği
    async function performSearch(query) {
        searchResults.innerHTML = '<div class="search-loading"><div class="search-spinner"></div>Aranıyor...</div>';
        searchResults.classList.add('show');

        try {
            // Kullanıcı araması
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .ilike('username', `%${query}%`)
                .limit(5);

            if (userError) throw userError;

            // Mesaj araması
            const { data: messages, error: messageError } = await supabase
                .from('messages')
                .select('id, content, created_at, sender_id, conversation_id')
                .ilike('content', `%${query}%`)
                .limit(5);

            if (messageError) throw messageError;

            // Sonuçları görüntüle
            displaySearchResults(users, messages, query);

        } catch (error) {
            searchResults.innerHTML = '<div class="search-error">Arama sırasında bir hata oluştu.</div>';
            console.error('Arama hatası:', error);
        }
    }

    // Arama sonuçlarını görüntüleme
    function displaySearchResults(users, messages, query) {
        if (users.length === 0 && messages.length === 0) {
            searchResults.innerHTML = '<div class="search-empty">Sonuç bulunamadı.</div>';
            return;
        }

        let resultsHtml = '<div class="search-results-inner">';

        // Kullanıcı sonuçları
        if (users.length > 0) {
            resultsHtml += `
                <div class="search-category">
                    <div class="search-category-header">
                        <i class="fas fa-user"></i>Kullanıcılar
                    </div>
                    <div class="search-category-items">
            `;

            users.forEach(user => {
                resultsHtml += `
                    <div class="search-result-item" data-user-id="${user.id}">
                        <div class="search-result-avatar">
                            <img src="${user.avatar_url || defaultAvatar}" alt="${user.username}">
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-name">${highlightMatch(user.username, query)}</div>
                        </div>
                    </div>
                `;
            });

            resultsHtml += '</div></div>';
        }

        // Mesaj sonuçları
        if (messages.length > 0) {
            resultsHtml += `
                <div class="search-category">
                    <div class="search-category-header">
                        <i class="fas fa-comment"></i>Mesajlar
                    </div>
                    <div class="search-category-items">
            `;

            messages.forEach(message => {
                resultsHtml += `
                    <div class="search-result-item" data-conversation-id="${message.conversation_id}">
                        <div class="search-result-content">
                            <div class="search-result-name">Konuşma</div>
                            <div class="search-result-detail">${highlightMatch(message.content, query)}</div>
                        </div>
                    </div>
                `;
            });

            resultsHtml += '</div></div>';
        }

        resultsHtml += '</div>';
        searchResults.innerHTML = resultsHtml;

        // Kullanıcı sonuç event listener'ları
        document.querySelectorAll('.search-result-item[data-user-id]').forEach(item => {
            item.addEventListener('click', function () {
                const userId = this.getAttribute('data-user-id');
                openChat(userId);
                searchResults.classList.remove('show');
                searchInput.value = '';
                clearButton.style.display = 'none';
            });
        });

        // Mesaj sonuç event listener'ları
        document.querySelectorAll('.search-result-item[data-conversation-id]').forEach(item => {
            item.addEventListener('click', function () {
                const conversationId = this.getAttribute('data-conversation-id');
                openConversation(conversationId);
                searchResults.classList.remove('show');
                searchInput.value = '';
                clearButton.style.display = 'none';
            });
        });
    }

    // Eşleşen metni vurgula
    function highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-result-match">$1</span>');
    }

    // Belge tıklamalarında dropdown'ı kapat
    document.addEventListener('click', function (event) {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.classList.remove('show');
        }
    });
}

// DM bölümü arama paneli kurulumu
function setupDMSearchPanel() {
    const dmSearchInput = document.querySelector('.dm-search input');

    if (!dmSearchInput) return;

    dmSearchInput.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();

        // Tüm DM öğelerini filtrele
        const dmItems = document.querySelectorAll('.dm-item');

        dmItems.forEach(item => {
            const name = item.querySelector('.dm-name').textContent.toLowerCase();
            if (query === '' || name.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Tab kontrollerini kur
function setupTabControls() {
    const tabs = document.querySelectorAll('.tab-controls .tab');
    const mainSections = {
        'Çevrimiçi': document.querySelector('.online-friends'),
        'Tümü': document.querySelector('.all-friends'),
        'Bekleyen': document.querySelector('.pending-friends')
    };

    // Tab butonları yoksa çık
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Aktif tabı kaldır
            document.querySelector('.tab.active').classList.remove('active');

            // Bu tabı aktif yap
            this.classList.add('active');

            // Seçilen bölümü göster
            const sectionName = this.getAttribute('data-section');
            showSection(sectionName, mainSections);
        });
    });
}

// Belirli bir bölümü göster, diğerlerini gizle
function showSection(sectionName, sections) {
    Object.keys(sections).forEach(key => {
        if (sections[key]) {
            if (key === sectionName) {
                sections[key].style.display = 'block';
            } else {
                sections[key].style.display = 'none';
            }
        }
    });
}

// Kullanıcı ile sohbeti aç
async function openChat(userId) {
    try {
        // Önce mevcut konuşmayı kontrol et
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('id')
            .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .maybeSingle();

        if (error) throw error;

        // Eğer konuşma varsa aç
        if (conversations) {
            openConversation(conversations.id);
        }
        // Yoksa yeni konuşma oluştur
        else {
            const { data: newConversation, error: createError } = await supabase
                .from('conversations')
                .insert({
                    user1_id: currentUserId,
                    user2_id: userId,
                    created_at: new Date()
                })
                .select()
                .single();

            if (createError) throw createError;

            openConversation(newConversation.id);
        }
    } catch (error) {
        console.error('Sohbet açma hatası:', error);
    }
}

// Konuşmayı aç
async function openConversation(conversationId) {
    try {
        // Önceki konuşma varsa aboneliği kapat
        if (messageSubscription) {
            messageSubscription.unsubscribe();
        }

        // Global değişkeni ayarla
        currentConversationId = conversationId;

        // Konuşma panelini göster
        const chatPanel = document.querySelector('.chat-panel');
        if (chatPanel) {
            chatPanel.classList.remove('hidden');
        }

        // Konuşma verilerini yükle
        loadConversationMessages(conversationId);

        // Realtime mesaj aboneliği
        subscribeToMessages(conversationId);

        // Okunmamış mesajları okundu olarak işaretle
        markMessagesAsRead(conversationId);

    } catch (error) {
        console.error('Konuşma açma hatası:', error);
    }
}

// Konuşma mesajlarını yükle
async function loadConversationMessages(conversationId) {
    try {
        // Konuşma mesajlarını al
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Mesajları UI'da göster
        displayMessages(messages);
    } catch (error) {
        console.error('Mesaj yükleme hatası:', error);
    }
}

// Mesajların realtime aboneliği
function subscribeToMessages(conversationId) {
    messageSubscription = supabase
        .channel(`messages:conversation_id=eq.${conversationId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
        }, payload => {
            // Yeni mesaj geldiğinde UI'ı güncelle
            addMessageToUI(payload.new);

            // Mesaj bizden değilse ve konuşma açıksa, okundu olarak işaretle
            if (payload.new.sender_id !== currentUserId) {
                markMessageAsRead(payload.new.id);
            }
        })
        .subscribe();
}

// Mesajları okundu olarak işaretle
async function markMessagesAsRead(conversationId) {
    try {
        // Okunmamış mesajları bul
        const { data: unreadMessages, error } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('recipient_id', currentUserId)
            .eq('read', false);

        if (error) throw error;

        // Hiç okunmamış mesaj yoksa çık
        if (!unreadMessages.length) return;

        // Mesajları okundu olarak işaretle
        const { error: updateError } = await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages.map(msg => msg.id));

        if (updateError) throw updateError;

        // Unread count'u güncelle
        updateUnreadCounts();
    } catch (error) {
        console.error('Mesajları okundu işaretleme hatası:', error);
    }
}

// Tek bir mesajı okundu olarak işaretle
async function markMessageAsRead(messageId) {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', messageId);

        if (error) throw error;

        // Unread count'u güncelle
        updateUnreadCounts();
    } catch (error) {
        console.error('Mesaj okundu işaretleme hatası:', error);
    }
}

// Mesajları UI'da göster
function displayMessages(messages) {
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">Henüz mesaj yok. Sohbete başlayın!</div>';
        return;
    }

    // Mesajları grupla ve göster
    // Bu basit implementasyon - gerçekte daha karmaşık olabilir
    messages.forEach(message => {
        addMessageToUI(message);
    });

    // En altta kaydır
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Yeni mesajı UI'a ekle
function addMessageToUI(message) {
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;

    const isOwnMessage = message.sender_id === currentUserId;

    const messageElement = document.createElement('div');
    messageElement.classList.add('message-group');

    if (isOwnMessage) {
        messageElement.classList.add('own-message');
    }

    // Basit mesaj HTML'i
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">${message.content}</div>
            <div class="message-time">${formatTimestamp(message.created_at)}</div>
        </div>
    `;

    messagesContainer.appendChild(messageElement);

    // En alta kaydır
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Zaman bilgisini formatla
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Okunmamış mesaj sayılarını güncelle
async function updateUnreadCounts() {
    try {
        // Kullanıcının tüm okunmamış mesajlarını say ve grupla
        const { data, error } = await supabase.rpc('get_unread_message_counts', {
            user_id: currentUserId
        });

        if (error) throw error;

        // Global unread counts'u güncelle
        unreadCounts = data.reduce((acc, item) => {
            acc[item.sender_id] = item.count;
            return acc;
        }, {});

        // UI'ı güncelle
        updateUnreadCountsUI();
    } catch (error) {
        console.error('Okunmamış mesaj sayısı güncelleme hatası:', error);
    }
}

// Okunmamış mesaj sayılarını UI'da güncelle
function updateUnreadCountsUI() {
    // Her bir kullanıcı için DM item'ını bul ve sayıyı güncelle
    Object.keys(unreadCounts).forEach(userId => {
        const count = unreadCounts[userId];
        const dmItem = document.querySelector(`.dm-item[data-user-id="${userId}"]`);

        if (dmItem) {
            let notificationBadge = dmItem.querySelector('.dm-notification');

            if (count > 0) {
                // Badge yoksa ekle, varsa güncelle
                if (!notificationBadge) {
                    notificationBadge = document.createElement('div');
                    notificationBadge.classList.add('dm-notification');
                    dmItem.appendChild(notificationBadge);
                }
                notificationBadge.textContent = count;
            } else if (notificationBadge) {
                // Count sıfırsa ve badge varsa kaldır
                notificationBadge.remove();
            }
        }
    });
}

// Mesaj gönderme işlemini ayarla
function setupMessageSending() {
    // messageInput ve sendButton init() içinde tanımlanmış olmalı
    if (!messageInput || !sendButton) return;

    // Enter tuşuna basıldığında mesaj gönder
    messageInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Gönder butonuna tıklandığında
    sendButton.addEventListener('click', sendMessage);

    // Mesajı gönder
    async function sendMessage() {
        const content = messageInput.value.trim();

        // Boş mesaj kontrolü
        if (!content || !currentConversationId) return;

        // Mesaj meta verileri
        const messageData = {
            content,
            conversation_id: currentConversationId,
            sender_id: currentUserId,
            created_at: new Date(),
            read: false
        };

        try {
            // Mesajı veritabanına ekle
            const { error } = await supabase
                .from('messages')
                .insert(messageData);

            if (error) throw error;

            // Girdi alanını temizle
            messageInput.value = '';

        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
        }
    }
}

// ... existing code ...

// ... existing code ...
