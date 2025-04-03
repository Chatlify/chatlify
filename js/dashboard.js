import { supabase } from './auth_config.js'; // Supabase istemcisini import et

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard JS Loaded');

    // --- Önce Gerekli Elementleri ve Sabitleri Tanımla ---
    const userPanelUsernameElement = document.querySelector('.dm-footer .dm-user-name');
    const userPanelAvatarElement = document.querySelector('.dm-footer .dm-user-avatar img');
    const defaultAvatar = 'images/default-avatar.png'; // Varsayılan avatar yolu (TEK TANIMLAMA)

    const tabs = document.querySelectorAll('.dashboard-header .tab');
    const onlineSection = document.querySelector('.online-section-title');
    const onlineList = document.querySelector('.online-friends');
    const offlineSection = document.querySelector('.offline-section-title');
    const offlineList = document.querySelector('.offline-friends');
    const pendingSection = document.querySelector('.pending-section-title');
    const pendingList = document.querySelector('.pending-requests');
    const pendingCountBadge = document.querySelector('.pending-count'); // Sayı için
    let presenceChannel = null; // Supabase presence kanalı için değişken
    let onlineFriends = new Set(); // Çevrimiçi arkadaşların ID\'lerini tutacak set
    let currentUserId = null; // Mevcut kullanıcı ID\'si
    const dmList = document.querySelector('.direct-messages .dm-items'); // DM listesi
    const chatPanel = document.querySelector('.chat-panel'); // Sağdaki sohbet paneli
    const chatHeaderUser = chatPanel?.querySelector('.chat-header-user'); // Sohbet başlığı kullanıcı alanı
    const chatMessagesContainer = chatPanel?.querySelector('.chat-messages'); // Sohbet mesajları alanı
    const friendsPanelContainer = document.querySelector('.friends-panel-container'); // Arkadaşlar paneli (gizlemek için)
    const sponsorSidebar = document.querySelector('.sponsor-sidebar'); // Sponsor alanı (gizlemek için)
    const settingsButtonContainer = document.querySelector('.server-settings-icon')?.closest('.server-item'); // Ayarlar butonu kapsayıcısı
    const chatCloseBtn = chatPanel?.querySelector('.chat-close-btn'); // Sohbet kapatma butonu
    const chatEmojiBtn = chatPanel?.querySelector('.emoji-btn'); // Emoji butonu
    const chatTextarea = chatPanel?.querySelector('.chat-textbox textarea'); // Mesaj yazma alanı
    const emojiPicker = document.querySelector('emoji-picker'); // Emoji picker elementi
    const addFriendButton = document.querySelector('.dashboard-header .add-friend'); // Arkadaş Ekle Butonu
    // --- End Element Tanımlamaları ---

    // Elementler bulunamadıysa kontrol et (Kullanıcı Paneli)
    if (!userPanelUsernameElement) {
        console.error('User panel username element (.dm-footer .dm-user-name) not found.');
    }
    if (!userPanelAvatarElement) {
        console.error('User panel avatar element (.dm-footer .dm-user-avatar img) not found.');
    }
    // Elementler bulunamadıysa kontrol et (Arkadaş Paneli)
    if (!pendingList || !pendingCountBadge || !pendingSection || !onlineList || !onlineSection || !offlineList || !offlineSection || !dmList || !chatPanel || !chatHeaderUser || !chatMessagesContainer || !friendsPanelContainer || !sponsorSidebar || !settingsButtonContainer || !chatCloseBtn || !chatEmojiBtn || !chatTextarea || !emojiPicker || !addFriendButton) {
        console.error('One or more friend panel elements are missing in HTML.');
    }

    // --- Kullanıcı Bilgilerini Al ve Paneli Güncelle ---
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Error getting session:', sessionError);
            return;
        }
        if (!session) {
            console.log('No active session found. Redirecting to login.');
            // window.location.href = '/login.html';
            return;
        }

        const user = session.user;
        console.log('Logged in user:', user);
        currentUserId = session.user.id; // Kullanıcı ID\'sini değişkene ata

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('username, avatar')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
            if (userPanelUsernameElement) userPanelUsernameElement.textContent = user.email;
            if (userPanelAvatarElement) userPanelAvatarElement.src = defaultAvatar;
        } else if (profile) {
            console.log('User profile:', profile);
            if (userPanelUsernameElement) userPanelUsernameElement.textContent = profile.username || user.email;
            if (userPanelAvatarElement) userPanelAvatarElement.src = profile.avatar || defaultAvatar;
        } else {
            console.log('Profile not found for user:', user.id);
            if (userPanelUsernameElement) userPanelUsernameElement.textContent = user.email;
            if (userPanelAvatarElement) userPanelAvatarElement.src = defaultAvatar;
        }

        // --- Supabase Presence Bağlantısını Başlat ---
        initializePresence();

    } catch (error) {
        console.error('Error in dashboard setup (User Panel):', error);
        if (userPanelUsernameElement) userPanelUsernameElement.textContent = 'Kullanıcı';
        if (userPanelAvatarElement) userPanelAvatarElement.src = defaultAvatar;
    }
    // --- End Kullanıcı Bilgileri & Presence Başlatma ---

    // --- Supabase Presence Fonksiyonları ---
    function initializePresence() {
        if (!currentUserId) return;

        presenceChannel = supabase.channel('online-users', {
            config: {
                presence: { key: currentUserId } // Her kullanıcıyı kendi ID'si ile takip et
            }
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                console.log('Presence sync event received');
                const presenceState = presenceChannel.presenceState();
                onlineFriends = new Set(Object.keys(presenceState)); // Tüm online kullanıcı ID'lerini al
                console.log('Currently online users:', onlineFriends);
                // Başlangıçta tüm arkadaş listesini durumlarına göre güncelle
                updateAllFriendStatuses();
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Presence join:', key, newPresences);
                onlineFriends.add(key); // Yeni katılanı online setine ekle
                updateFriendStatusUI(key, true); // Arayüzü güncelle (çevrimiçi)
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Presence leave:', key, leftPresences);
                onlineFriends.delete(key); // Ayrılanı online setinden çıkar
                updateFriendStatusUI(key, false); // Arayüzü güncelle (çevrimdışı)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to presence channel!');
                    // Kullanıcı kendi durumunu kanala gönderir
                    const status = await presenceChannel.track({
                        user_id: currentUserId,
                        online_at: new Date().toISOString()
                    });
                    console.log('Track status:', status);
                } else {
                    console.error('Failed to subscribe to presence channel:', status);
                }
            });
    }

    // Tüm arkadaşların durumunu tek seferde güncelleyen yardımcı fonksiyon
    function updateAllFriendStatuses() {
        const allFriendRows = document.querySelectorAll('.friends-list .friend-row[data-user-id]');
        allFriendRows.forEach(row => {
            const userId = row.dataset.userId;
            const isOnline = onlineFriends.has(userId);
            updateFriendStatusUI(userId, isOnline, row); // Belirli bir satırı güncelle
        });
        // Online/Offline sayılarını da güncelle
        updateFriendCounters();
    }

    // Belirli bir arkadaşın UI durumunu güncelleyen fonksiyon
    function updateFriendStatusUI(userId, isOnline, specificRow = null) {
        const friendRow = specificRow || document.querySelector(`.friend-row[data-user-id="${userId}"]`);
        const dmRow = dmList.querySelector(`.dm-item[data-user-id="${userId}"]`);

        // Arkadaş Paneli Güncellemesi
        if (friendRow) {
            if (isOnline) {
                friendRow.classList.remove('offline');
                friendRow.classList.add('online');
                friendRow.querySelector('.status-dot').className = 'status-dot online';
                friendRow.querySelector('.friend-status').textContent = 'Çevrimiçi';
                moveFriendRow(friendRow, onlineList);
            } else {
                friendRow.classList.remove('online');
                friendRow.classList.add('offline');
                friendRow.querySelector('.status-dot').className = 'status-dot offline';
                friendRow.querySelector('.friend-status').textContent = 'Çevrimdışı';
                moveFriendRow(friendRow, offlineList);
            }
        }

        // DM Listesi Güncellemesi
        if (dmRow) {
            if (isOnline) {
                dmRow.querySelector('.dm-status').className = 'dm-status online';
                dmRow.querySelector('.dm-activity').textContent = 'Çevrimiçi';
            } else {
                dmRow.querySelector('.dm-status').className = 'dm-status offline';
                dmRow.querySelector('.dm-activity').textContent = 'Çevrimdışı';
            }
        }

        // Açık olan sohbet panelinin başlığını da güncelle (eğer o kişiye aitse)
        if (chatPanel && !chatPanel.classList.contains('hidden') && chatPanel.dataset.activeChatUserId === userId) {
            const chatStatusDot = chatHeaderUser?.querySelector('.chat-avatar .status-dot');
            const chatStatusTextElement = chatHeaderUser?.querySelector('.chat-user-info .chat-status');
            const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
            const statusClass = isOnline ? 'online' : 'offline';
            if (chatStatusDot) chatStatusDot.className = `status-dot ${statusClass}`;
            if (chatStatusTextElement) chatStatusTextElement.textContent = statusText;
        }

        updateFriendCounters();
    }

    // Arkadaş satırını doğru listeye taşıyan yardımcı fonksiyon
    function moveFriendRow(friendRow, targetList) {
        if (targetList && friendRow.parentNode !== targetList) {
            targetList.appendChild(friendRow);
            // Eğer listede "boş" mesajı varsa kaldır
            const emptyPlaceholder = targetList.querySelector('.empty-placeholder');
            if (emptyPlaceholder) emptyPlaceholder.remove();
        }
        // Hedef liste görünür değilse (örneğin sadece çevrimiçiler görünüyorsa ve offline olduysa) satır gizlenebilir.
        // Bu, showSection mantığına bağlı.
    }

    // Online/Offline sayaçlarını güncelleyen fonksiyon
    function updateFriendCounters() {
        const onlineCountBadge = document.querySelector('.online-count');
        const offlineCountBadge = document.querySelector('.offline-count');

        if (onlineCountBadge && onlineList) {
            const onlineFriendsCount = onlineList.querySelectorAll('.friend-row').length;
            onlineCountBadge.textContent = onlineFriendsCount;
            if (onlineSection) onlineSection.style.display = onlineFriendsCount > 0 ? 'flex' : 'none';
        }
        if (offlineCountBadge && offlineList) {
            const offlineFriendsCount = offlineList.querySelectorAll('.friend-row').length;
            offlineCountBadge.textContent = offlineFriendsCount;
            if (offlineSection) offlineSection.style.display = offlineFriendsCount > 0 ? 'flex' : 'none';
        }
    }

    // Tarayıcıdan ayrılırken kanaldan çıkış yap (isteğe bağlı ama önerilir)
    window.addEventListener('beforeunload', () => {
        if (presenceChannel) {
            supabase.removeChannel(presenceChannel);
        }
    });
    // --- End Supabase Presence Fonksiyonları ---

    // --- Sekme Yönetimi ve İçerik Yükleme ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabText = tab.textContent.trim();
            showSection(tabText);
        });
    });

    // Başlangıçta 'Tüm Arkadaşlar' sekmesini göster ve yükle
    showSection('Tüm Arkadaşlar');

    function showSection(tabName) {
        if (!onlineSection || !onlineList || !offlineSection || !offlineList || !pendingSection || !pendingList) return;

        onlineSection.style.display = 'none';
        onlineList.style.display = 'none';
        offlineSection.style.display = 'none';
        offlineList.style.display = 'none';
        pendingSection.style.display = 'none';
        pendingList.style.display = 'none';

        if (tabName === 'Tüm Arkadaşlar') {
            onlineSection.style.display = 'flex'; // Çevrimiçi başlığını göster
            onlineList.style.display = 'block'; // Çevrimiçi listesini göster (şimdilik boş olacak)
            offlineSection.style.display = 'flex'; // Çevrimdışı başlığını göster
            offlineList.style.display = 'block'; // Çevrimdışı listesini göster
            loadAllFriends(); // Tüm (kabul edilmiş) arkadaşları yükle
        } else if (tabName === 'Çevrimiçi') {
            onlineSection.style.display = 'flex';
            onlineList.style.display = 'block';
            // loadOnlineFriends(); // Şimdilik sadece çevrimiçi arkadaşları yükleme fonksiyonu çağrılmıyor
            // Geçici olarak boş liste göster
            onlineList.innerHTML = '<div class="empty-placeholder">Çevrimiçi arkadaşları gösterme özelliği yakında eklenecektir.</div>';
            document.querySelector('.online-count').textContent = '0';
        } else if (tabName === 'Bekleyen') {
            pendingSection.style.display = 'flex';
            pendingList.style.display = 'block';
            loadPendingRequests();
        }
    }

    // --- Tüm (Kabul Edilmiş) Arkadaşları Yükleme Fonksiyonu (Profil butonu kontrolü) ---
    async function loadAllFriends() {
        if (!onlineList || !offlineList || !dmList || !document.querySelector('.online-count') || !document.querySelector('.offline-count')) return;

        onlineList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Arkadaşlar yükleniyor...</div>';
        offlineList.innerHTML = '';
        dmList.innerHTML = ''; // DM listesini de temizle
        document.querySelector('.online-count').textContent = '0';
        document.querySelector('.offline-count').textContent = '0';
        if (onlineSection) onlineSection.style.display = 'none';
        if (offlineSection) offlineSection.style.display = 'none';

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                onlineList.innerHTML = '<div class="error-placeholder">Oturum bulunamadı.</div>';
                return;
            }

            const { data: friendships, error: friendsError } = await supabase
                .from('friendships')
                .select(`id, user_id_1, user_id_2, user1:user_id_1(id, username, avatar), user2:user_id_2(id, username, avatar)`)
                .eq('status', 'accepted')
                .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

            if (friendsError) {
                console.error('Error fetching accepted friends:', friendsError);
                onlineList.innerHTML = '<div class="error-placeholder">Arkadaşlar yüklenirken hata oluştu.</div>';
                return;
            }

            onlineList.innerHTML = '';
            offlineList.innerHTML = '';
            dmList.innerHTML = ''; // DM listesini de temizle

            if (friendships.length === 0) {
                offlineList.innerHTML = '<div class="empty-placeholder">Henüz hiç arkadaşınız yok.</div>';
                dmList.innerHTML = '<div class="empty-placeholder dm-empty">Henüz hiç özel mesajınız yok.</div>';
                updateFriendCounters();
                return;
            }

            friendships.forEach(friendship => {
                const friendUser = friendship.user_id_1 === currentUserId ? friendship.user2 : friendship.user1;
                if (!friendUser) {
                    console.warn('Friend user data missing for friendship:', friendship.id);
                    return;
                }

                const friendElement = document.createElement('div');
                friendElement.className = 'friend-row';
                friendElement.dataset.userId = friendUser.id;
                friendElement.dataset.username = friendUser.username;
                friendElement.dataset.avatar = friendUser.avatar || defaultAvatar;
                friendElement.dataset.friendshipId = friendship.id;
                friendElement.innerHTML = `
                    <div class="friend-avatar">
                        <img src="${friendUser.avatar || defaultAvatar}" alt="${friendUser.username}">
                        <span class="status-dot offline"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${friendUser.username}</div>
                        <div class="friend-status">Çevrimdışı</div>
                    </div>
                    <div class="friend-actions">
                         <button class="friend-action-btn message-btn" title="Mesaj Gönder">
                             <i class="fas fa-comment"></i>
                         </button>
                         <button class="friend-action-btn profile-btn" title="Profil">
                             <i class="fas fa-user"></i>
                         </button>
                         <button class="friend-action-btn more-btn" title="Daha Fazla">
                             <i class="fas fa-ellipsis-v"></i>
                         </button>
                    </div>
                `;

                const dmElement = document.createElement('div');
                dmElement.className = 'dm-item';
                dmElement.dataset.userId = friendUser.id;
                dmElement.dataset.username = friendUser.username;
                dmElement.dataset.avatar = friendUser.avatar || defaultAvatar;
                dmElement.innerHTML = `
                    <div class="dm-avatar">
                        <img src="${friendUser.avatar || defaultAvatar}" alt="${friendUser.username}">
                        <div class="dm-status offline"></div>
                    </div>
                    <div class="dm-info">
                        <div class="dm-name">${friendUser.username}</div>
                        <div class="dm-activity">Çevrimdışı</div>
                    </div>
                `;

                offlineList.appendChild(friendElement);
                dmList.appendChild(dmElement);

                // Listener'ları ekle
                dmElement.addEventListener('click', () => {
                    openChatPanel(friendUser.id, friendUser.username, friendUser.avatar || defaultAvatar);
                    document.querySelectorAll('.dm-item').forEach(item => item.classList.remove('active'));
                    dmElement.classList.add('active');
                });
                const messageBtn = friendElement.querySelector('.message-btn');
                if (messageBtn) {
                    messageBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openChatPanel(friendUser.id, friendUser.username, friendUser.avatar || defaultAvatar);
                        document.querySelectorAll('.dm-item').forEach(item => item.classList.remove('active'));
                        dmList.querySelector(`.dm-item[data-user-id="${friendUser.id}"]`)?.classList.add('active');
                    });
                }
                const profileBtn = friendElement.querySelector('.profile-btn');
                if (profileBtn) {
                    profileBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const userId = friendElement.dataset.userId;
                        const username = friendElement.dataset.username;
                        const avatar = friendElement.dataset.avatar;

                        if (!username || !avatar || !userId) {
                            console.error('Could not retrieve valid user data from dataset for profile panel.', friendElement.dataset);
                            alert('Profil bilgileri alınamadı.');
                            return;
                        }
                        const profileData = {
                            name: username,
                            avatar: avatar,
                            status: onlineFriends.has(userId) ? 'online' : 'offline',
                            id: userId
                        };
                        createProfilePanel(profileData);
                    });
                }
            });

            // Arkadaşları ekledikten sonra Presence durumuna göre güncelle
            updateAllFriendStatuses();

        } catch (error) {
            console.error('Error in loadAllFriends:', error);
            onlineList.innerHTML = '<div class="error-placeholder">Arkadaşlar yüklenirken beklenmedik bir hata oluştu.</div>';
        }
    }
    // --- End Tüm Arkadaşları Yükleme ---

    // --- Sohbet Panelini Açma Fonksiyonu (Güncellendi - Seçiciler düzeltildi) ---
    function openChatPanel(userId, username, avatar) {
        if (!chatPanel || !chatHeaderUser || !chatMessagesContainer || !friendsPanelContainer || !sponsorSidebar) {
            console.error('Chat panel elements not found, cannot open chat.');
            return;
        }
        console.log(`Opening chat panel for user: ${username} (ID: ${userId})`);

        // Sohbet başlığını güncelle - DOĞRU SEÇİCİLER
        const chatUsernameElement = chatHeaderUser.querySelector('.chat-username');
        const chatAvatarElement = chatHeaderUser.querySelector('.chat-avatar img'); // .chat-avatar içindeki img
        const chatStatusDot = chatHeaderUser.querySelector('.chat-avatar .status-dot'); // .chat-avatar içindeki status-dot
        const chatStatusTextElement = chatHeaderUser.querySelector('.chat-user-info .chat-status'); // .chat-user-info içindeki chat-status

        if (chatUsernameElement) chatUsernameElement.textContent = username;
        if (chatAvatarElement) chatAvatarElement.src = avatar;

        const isFriendOnline = onlineFriends.has(userId);
        const statusText = isFriendOnline ? 'Çevrimiçi' : 'Çevrimdışı';
        const statusClass = isFriendOnline ? 'online' : 'offline';
        if (chatStatusDot) chatStatusDot.className = `status-dot ${statusClass}`;
        if (chatStatusTextElement) chatStatusTextElement.textContent = statusText;

        // Mesajlar alanını temizle
        chatMessagesContainer.innerHTML = '<div class="empty-placeholder chat-empty">Bu sohbetin başlangıcı.</div>';

        // Panelleri göster/gizle
        friendsPanelContainer.classList.add('hidden');
        if (sponsorSidebar) sponsorSidebar.style.display = 'none'; // Sponsoru gizle
        chatPanel.classList.remove('hidden');

        // Aktif sohbetin user ID'sini panele ekle (durum güncellemesi için)
        chatPanel.dataset.activeChatUserId = userId;
    }
    // --- End Sohbet Panelini Açma ---

    // --- Bekleyen İstekleri Yükleme Fonksiyonu (Değişiklik Yok) ---
    async function loadPendingRequests() {
        if (!pendingList || !pendingCountBadge) return;

        pendingList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Bekleyen istekler yükleniyor...</div>';
        pendingCountBadge.textContent = '0';

        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                pendingList.innerHTML = '<div class="error-placeholder">Oturum bulunamadı.</div>';
                return;
            }
            const currentUserId = session.user.id;

            const { data: requests, error: requestsError } = await supabase
                .from('friendships')
                .select(`
                    id,
                    requested_at,
                    sender:user_id_1 ( id, username, avatar )
                `)
                .eq('user_id_2', currentUserId)
                .eq('status', 'pending');

            if (requestsError) {
                console.error('Error fetching pending requests:', requestsError);
                pendingList.innerHTML = '<div class="error-placeholder">İstekler yüklenirken hata oluştu.</div>';
                return;
            }

            pendingList.innerHTML = '';
            pendingCountBadge.textContent = requests.length;

            if (requests.length === 0) {
                pendingList.innerHTML = '<div class="empty-placeholder">Bekleyen arkadaşlık isteğiniz yok.</div>';
                return;
            }

            requests.forEach(request => {
                const sender = request.sender;
                if (!sender) return;

                const requestElement = document.createElement('div');
                requestElement.className = 'friend-row pending';
                requestElement.dataset.friendshipId = request.id;
                requestElement.dataset.senderId = sender.id;

                requestElement.innerHTML = `
                    <div class="friend-avatar">
                        <img src="${sender.avatar || defaultAvatar}" alt="${sender.username}">
                        <span class="status-dot offline"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${sender.username}</div>
                        <div class="friend-status">Arkadaşlık isteği gönderdi</div>
                    </div>
                    <div class="friend-actions pending-actions">
                        <button class="friend-action-btn accept-request-btn" title="Kabul Et">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="friend-action-btn decline-request-btn" title="Reddet">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                pendingList.appendChild(requestElement);

                const acceptBtn = requestElement.querySelector('.accept-request-btn');
                const declineBtn = requestElement.querySelector('.decline-request-btn');
                acceptBtn.addEventListener('click', () => handleFriendRequest(request.id, 'accepted'));
                declineBtn.addEventListener('click', () => handleFriendRequest(request.id, 'declined'));
            });
        } catch (error) {
            console.error('Error in loadPendingRequests:', error);
            pendingList.innerHTML = '<div class="error-placeholder">Beklenmedik bir hata oluştu.</div>';
        }
    }
    // --- End Bekleyen İstekleri Yükleme ---

    // --- Arkadaşlık İsteği Kabul/Red Fonksiyonu (Güncellendi) ---
    async function handleFriendRequest(friendshipId, newStatus) {
        console.log(`Handling request ${friendshipId} with status ${newStatus}`);
        const requestRow = pendingList.querySelector(`.friend-row[data-friendship-id="${friendshipId}"]`);
        if (!requestRow) return;

        const buttons = requestRow.querySelectorAll('.friend-action-btn');
        buttons.forEach(btn => btn.disabled = true);
        const originalIcon = newStatus === 'accepted' ? requestRow.querySelector('.accept-request-btn i') : requestRow.querySelector('.decline-request-btn i');
        if (originalIcon) originalIcon.className = 'fas fa-spinner fa-spin';

        try {
            const updateData = { status: newStatus };
            if (newStatus === 'accepted') {
                updateData.accepted_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('friendships')
                .update(updateData)
                .eq('id', friendshipId);

            if (error) {
                console.error(`Error updating friendship ${friendshipId} to ${newStatus}:`, error);
                alert(`İstek işlenirken hata oluştu: ${error.message}`);
                buttons.forEach(btn => btn.disabled = false);
                if (originalIcon) originalIcon.className = newStatus === 'accepted' ? 'fas fa-check' : 'fas fa-times';
            } else {
                console.log(`Friendship ${friendshipId} updated to ${newStatus}`);
                requestRow.style.transition = 'opacity 0.5s ease';
                requestRow.style.opacity = '0';
                setTimeout(() => {
                    requestRow.remove();
                    const currentCount = parseInt(pendingCountBadge.textContent || '0', 10);
                    pendingCountBadge.textContent = Math.max(0, currentCount - 1);
                    if (pendingList.children.length === 0 && pendingCountBadge.textContent === '0') {
                        pendingList.innerHTML = '<div class="empty-placeholder">Bekleyen arkadaşlık isteğiniz yok.</div>';
                    }

                    // Eğer istek KABUL edildiyse, arkadaş listesini yenile
                    if (newStatus === 'accepted') {
                        loadAllFriends();
                    }

                }, 500);
            }
        } catch (error) {
            console.error('Error in handleFriendRequest:', error);
            alert('Beklenmedik bir hata oluştu.');
            buttons.forEach(btn => btn.disabled = false);
            if (originalIcon) originalIcon.className = newStatus === 'accepted' ? 'fas fa-check' : 'fas fa-times';
        }
    }
    // --- End Arkadaşlık İsteği Kabul/Red ---

    // --- Sohbet Paneli Kapatma İşlevi --- 
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', () => {
            console.log("Close chat button clicked");
            if (chatPanel) chatPanel.classList.add('hidden');
            if (friendsPanelContainer) friendsPanelContainer.classList.remove('hidden');
            if (sponsorSidebar) sponsorSidebar.style.display = ''; // veya 'flex'
            // Aktif DM stilini kaldır
            document.querySelectorAll('.dm-item.active').forEach(item => item.classList.remove('active'));
            // Aktif sohbet ID'sini temizle
            if (chatPanel) delete chatPanel.dataset.activeChatUserId;
        });
    }
    // --- End Sohbet Kapatma --- 

    // --- Ayarlar Butonu İşlevi ---
    if (settingsButtonContainer) {
        settingsButtonContainer.addEventListener('click', () => {
            console.log('Settings button clicked');
            window.location.href = 'settings.html';
        });
    }
    // --- End Ayarlar Butonu ---

    // --- Profil Paneli Oluşturma (Doğru HTML ve veri kullanımı) ---
    function createProfilePanel(userData) {
        console.log("Attempting to create profile panel for:", userData);
        if (!userData || typeof userData.name === 'undefined' || typeof userData.avatar === 'undefined') {
            console.error("Invalid or incomplete user data passed to createProfilePanel:", userData);
            alert('Profil paneli için geçersiz veri.');
            return;
        }

        const existingPanel = document.querySelector('.profile-panel');
        if (existingPanel) existingPanel.remove();

        const profilePanel = document.createElement('div');
        profilePanel.className = 'profile-panel';

        // Verileri güvenli kullan
        const userNameToShow = userData.name || 'Bilinmiyor'; // name null ise fallback
        const userAvatarToShow = userData.avatar || defaultAvatar; // avatar null ise fallback

        profilePanel.innerHTML = `
            <div class="profile-panel-content">
                <button class="profile-close-btn">
                    <i class="fas fa-times"></i>
                </button>
                <div class="profile-left-section">
                     <div class="profile-cover"></div>
                     <div class="profile-overlay"></div>
                    <div class="profile-left-content">
                        <div class="profile-avatar-large">
                            <img src="${userAvatarToShow}" alt="${userNameToShow}">
                            <!-- Status indicator kaldırıldı -->
                        </div>
                        <h2 class="profile-username">${userNameToShow}</h2>
                    </div>
                </div>
                <div class="profile-right-section">
                    <div class="profile-tabs">
                         <div class="profile-tab active">Profil</div>
                    </div>
                    <div class="profile-section">
                        <p>Detaylı profil bilgileri yakında eklenecek.</p>
                    </div>
                    <div class="profile-action-buttons">
                        <button class="profile-action-btn message-btn">
                            <i class="fas fa-comment"></i>
                            <span>Mesaj Gönder</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(profilePanel);
        setTimeout(() => { profilePanel.classList.add('show'); }, 10);

        const closeBtn = profilePanel.querySelector('.profile-close-btn');
        closeBtn?.addEventListener('click', () => {
            profilePanel.classList.remove('show');
            setTimeout(() => profilePanel.remove(), 300);
        });

        profilePanel.addEventListener('click', (e) => {
            if (e.target === profilePanel) closeBtn?.click();
        });

        const messageBtn = profilePanel.querySelector('.message-btn');
        if (messageBtn && userData.id) {
            messageBtn.addEventListener('click', () => {
                closeBtn?.click();
                openChatPanel(userData.id, userData.name, userData.avatar || defaultAvatar);
            });
        }
    }
    // --- End Profil Paneli --- 

    // --- Emoji Picker İşlevselliği ---
    if (chatEmojiBtn && emojiPicker && chatTextarea) {
        // Emoji butonuna tıklanınca picker'ı göster/gizle
        chatEmojiBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Başka tıklama olaylarını engelle
            const isPickerVisible = emojiPicker.style.display === 'block';
            if (isPickerVisible) {
                emojiPicker.style.display = 'none';
            } else {
                positionEmojiPicker();
                emojiPicker.style.display = 'block';
                emojiPicker.focus(); // Fokuslanınca arama kutusu aktif olur
            }
        });

        // Emoji seçildiğinde textarea'ya ekle
        emojiPicker.addEventListener('emoji-click', event => {
            const emoji = event.detail.unicode;
            insertEmoji(emoji);
            // İsteğe bağlı: Seçimden sonra picker'ı gizle
            // emojiPicker.style.display = 'none'; 
        });

        // Picker dışına tıklanınca gizle
        document.addEventListener('click', (event) => {
            if (emojiPicker.style.display === 'block' &&
                !emojiPicker.contains(event.target) &&
                event.target !== chatEmojiBtn &&
                !chatEmojiBtn.contains(event.target)) {
                emojiPicker.style.display = 'none';
            }
        });

        // Emoji picker'ı konumlandırma fonksiyonu
        function positionEmojiPicker() {
            const buttonRect = chatEmojiBtn.getBoundingClientRect();
            const pickerHeight = 450; // Tahmini picker yüksekliği
            const pickerWidth = 350; // Tahmini picker genişliği
            const spaceAbove = buttonRect.top;
            const spaceBelow = window.innerHeight - buttonRect.bottom;

            let top, left;

            // Genellikle butonun üstüne yerleştir
            if (spaceAbove > pickerHeight || spaceAbove > spaceBelow) {
                // Üstte yeterli yer var veya üstteki boşluk alttakinden fazla
                top = buttonRect.top - pickerHeight - 5; // 5px boşluk
            } else {
                // Altta daha fazla yer var
                top = buttonRect.bottom + 5;
            }

            // Yatayda butonun sağına hizala (veya sola taşır)
            left = buttonRect.left;
            // Ekranın sağ kenarını kontrol et
            if (left + pickerWidth > window.innerWidth) {
                left = window.innerWidth - pickerWidth - 10; // Sağdan boşluk bırak
            }
            // Ekranın sol kenarını kontrol et (nadiren gerekir)
            if (left < 0) {
                left = 10;
            }


            emojiPicker.style.top = `${top}px`;
            emojiPicker.style.left = `${left}px`;
        }

        // Textarea'ya emoji ekleme (imleç konumunu koruyarak)
        function insertEmoji(emoji) {
            const start = chatTextarea.selectionStart;
            const end = chatTextarea.selectionEnd;
            const text = chatTextarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            chatTextarea.value = before + emoji + after;
            // İmleci emojiden sonraya taşı
            chatTextarea.selectionStart = chatTextarea.selectionEnd = start + emoji.length;
            chatTextarea.focus();
            // Textarea yüksekliğini güncelle (varsa)
            const event = new Event('input', { bubbles: true });
            chatTextarea.dispatchEvent(event);
        }
    }
    // --- End Emoji Picker İşlevselliği ---

    // --- Arkadaş Ekle Butonu İşlevi --- 
    if (addFriendButton) {
        addFriendButton.addEventListener('click', () => {
            console.log('Add Friend button clicked - Calling createAddFriendModal');
            if (typeof createAddFriendModal === 'function') {
                createAddFriendModal();
            } else {
                console.error('createAddFriendModal is not defined or not a function!');
            }
        });
    } else {
        console.error('Add Friend button element not found.');
    }
    // --- End Arkadaş Ekle Butonu ---

    // --- Arkadaş ekleme modalı oluşturma ve yönetme (Linter hataları düzeltildi) --- 
    function createAddFriendModal() {
        console.log("createAddFriendModal invoked.");
        if (document.querySelector('.add-friend-modal')) {
            console.log('Modal already exists. Skipping creation.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'add-friend-modal';
        // innerHTML içeriği düzeltildi
        modal.innerHTML = `
            <div class="add-friend-modal-content">
                <div class="add-friend-modal-header">
                    <div class="modal-header-left">
                        <i class="fas fa-user-plus modal-icon"></i>
                        <h3>Arkadaş Ekle</h3>
                    </div>
                    <div class="modal-header-right">
                        <i class="fas fa-times close-modal"></i>
                    </div>
                </div>
                <div class="add-friend-modal-body">
                    <div class="section-info">
                        <p>Chatlify'da birini arkadaş olarak eklemek için kullanıcı adını girin. Büyük/küçük harfe duyarlıdır.</p>
                    </div>
                    <div class="add-friend-input-container">
                        <div class="input-wrapper">
                            <i class="fas fa-at"></i>
                            <input type="text" placeholder="Kullanıcıadı" class="add-friend-input">
                        </div>
                        <button class="add-friend-submit">
                            <i class="fas fa-paper-plane"></i>
                            <span>Arkadaşlık İsteği Gönder</span>
                        </button>
                    </div>
                    <div class="modal-message-area" style="min-height: 20px; margin-top: 10px;">
                         <!-- Hata/Başarı mesajları buraya gelecek -->
                    </div>
                    <div class="friend-request-note">
                        <i class="fas fa-info-circle"></i>
                        <span>Doğru kullanıcıyı bulduğunuzdan emin olmak için doğru kullanıcı adını girin.</span>
                    </div>
                </div> 
            </div>
         `; // innerHTML sonu

        document.body.appendChild(modal);
        setTimeout(() => { modal.classList.add('show'); }, 10);

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                const style = document.getElementById('modal-error-style');
                if (style) style.remove();
            }, 300);
        };

        modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        const addFriendSubmit = modal.querySelector('.add-friend-submit');
        const addFriendInput = modal.querySelector('.add-friend-input');
        const messageArea = modal.querySelector('.modal-message-area');

        if (!addFriendSubmit || !addFriendInput || !messageArea) {
            console.error('Crucial modal elements (.add-friend-submit, .add-friend-input, .modal-message-area) not found!');
            return;
        }

        // showModalMessage ve resetSubmitButton fonksiyonlarını modal içinde tanımlayalım
        function showModalMessage(message, type = 'error', area, inputElement) {
            if (!area) return;
            area.innerHTML = `<div class="modal-${type}-message" style="font-size: 13px; color: ${type === 'error' ? '#ff6b6b' : '#2ecc71'};">${message}</div>`;

            const shakeStyleId = 'modal-error-style';
            let shakeStyle = document.getElementById(shakeStyleId);

            if (type === 'error' && inputElement) {
                if (!shakeStyle) {
                    shakeStyle = document.createElement('style');
                    shakeStyle.id = shakeStyleId;
                    shakeStyle.textContent = `
                            @keyframes shake {
                                10%, 90% { transform: translate3d(-1px, 0, 0); }
                                20%, 80% { transform: translate3d(2px, 0, 0); }
                                30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
                                40%, 60% { transform: translate3d(3px, 0, 0); }
                            }
                       `;
                    document.head.appendChild(shakeStyle);
                }
                inputElement.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
                inputElement.style.borderColor = 'rgba(255, 82, 82, 0.7)';
                inputElement.focus();
                setTimeout(() => {
                    if (inputElement) {
                        inputElement.style.animation = '';
                        inputElement.style.borderColor = '';
                    }
                }, 500);
            } else if (shakeStyle && inputElement) { // Hata yoksa animasyonu temizle
                inputElement.style.animation = '';
                inputElement.style.borderColor = '';
            }
            setTimeout(() => { if (area) area.innerHTML = ''; }, 5000);
        }

        function resetSubmitButton(button, input) {
            if (button) button.disabled = false;
            if (input) input.disabled = false;
            if (button) button.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Arkadaşlık İsteği Gönder</span>';
        }

        addFriendSubmit.addEventListener('click', async () => {
            const targetUsername = addFriendInput.value.trim();
            addFriendInput.disabled = true;
            addFriendSubmit.disabled = true;
            addFriendSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
            messageArea.innerHTML = '';

            if (!targetUsername) {
                showModalMessage('Lütfen bir kullanıcı adı girin.', 'error', messageArea, addFriendInput);
                resetSubmitButton(addFriendSubmit, addFriendInput);
                return;
            }
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    showModalMessage('Oturum bulunamadı. Lütfen tekrar giriş yapın.', 'error', messageArea, addFriendInput);
                    resetSubmitButton(addFriendSubmit, addFriendInput);
                    return;
                }
                const currentUserId = session.user.id;
                const { data: targetUser, error: findUserError } = await supabase.from('users').select('id').eq('username', targetUsername).single();
                if (findUserError || !targetUser) {
                    showModalMessage(\`Kullanıcı bulunamadı: ${targetUsername}\`, 'error', messageArea, addFriendInput);
                     resetSubmitButton(addFriendSubmit, addFriendInput);
                     return;
                 }
                 const targetUserId = targetUser.id;
                 if (currentUserId === targetUserId) {
                     showModalMessage('Kendinize arkadaşlık isteği gönderemezsiniz.', 'error', messageArea, addFriendInput);
                     resetSubmitButton(addFriendSubmit, addFriendInput);
                     return;
                 }
                 const { data: existingFriendship, error: checkError } = await supabase.from('friendships').select('status').or(\`and(user_id_1.eq.${currentUserId},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${currentUserId})\`).maybeSingle();
                 if (checkError) {
                     console.error('Error checking existing friendship:', checkError);
                     showModalMessage('İstek gönderilirken bir hata oluştu. (Kod: CHECK)', 'error', messageArea, addFriendInput);
                     resetSubmitButton(addFriendSubmit, addFriendInput);
                     return;
                 }
                 if (existingFriendship) {
                     let errorMsg = 'Bu kullanıcıyla ilgili mevcut bir ilişki durumu var.';
                     if (existingFriendship.status === 'pending') errorMsg = 'Bu kullanıcıya zaten bir istek gönderilmiş veya ondan bir istek var.';
                     else if (existingFriendship.status === 'accepted') errorMsg = 'Bu kullanıcı zaten arkadaş listenizde.';
                     else if (existingFriendship.status === 'blocked') errorMsg = 'Bu kullanıcıyla ilgili bir engelleme mevcut.';
                     showModalMessage(errorMsg, 'error', messageArea, addFriendInput);
                     resetSubmitButton(addFriendSubmit, addFriendInput);
                     return;
                 }
                 const { error: insertError } = await supabase.from('friendships').insert({ user_id_1: currentUserId, user_id_2: targetUserId, status: 'pending' });
                 if (insertError) {
                     console.error('Error sending friend request:', insertError);
                     if (insertError.code === '23505') { 
                         showModalMessage('Bu kullanıcıya zaten bir istek gönderilmiş veya ondan bir istek var.', 'error', messageArea, addFriendInput);
                     } else {
                         showModalMessage(\`Arkadaşlık isteği gönderilemedi. (Kod: ${insertError.code})\`, 'error', messageArea, addFriendInput);
                     }
                     resetSubmitButton(addFriendSubmit, addFriendInput);
                     return;
                 }
                 showModalMessage(\`Arkadaşlık isteği ${targetUsername} kullanıcısına başarıyla gönderildi!\`, 'success', messageArea);
                 addFriendInput.value = '';
                 resetSubmitButton(addFriendSubmit, addFriendInput);
             } catch (error) {
                 console.error('Friend request error:', error);
                 showModalMessage('Beklenmedik bir hata oluştu.', 'error', messageArea, addFriendInput);
                 resetSubmitButton(addFriendSubmit, addFriendInput);
             }
         });

         addFriendInput.addEventListener('keydown', e => {
             if (e.key === 'Enter') addFriendSubmit?.click();
             messageArea.innerHTML = ''; // Yazmaya başlayınca mesajı temizle
         });
    }
    // --- End Arkadaş Ekleme Modalı ---

}); 