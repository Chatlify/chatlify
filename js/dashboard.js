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
    // --- End Element Tanımlamaları ---

    // Elementler bulunamadıysa kontrol et (Kullanıcı Paneli)
    if (!userPanelUsernameElement) {
        console.error('User panel username element (.dm-footer .dm-user-name) not found.');
    }
    if (!userPanelAvatarElement) {
        console.error('User panel avatar element (.dm-footer .dm-user-avatar img) not found.');
    }
    // Elementler bulunamadıysa kontrol et (Arkadaş Paneli)
    if (!pendingList || !pendingCountBadge || !pendingSection || !onlineList || !onlineSection || !offlineList || !offlineSection) {
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
        if (!friendRow) return; // Eğer arkadaş listede yoksa (veya henüz yüklenmediyse) çık

        const statusDot = friendRow.querySelector('.status-dot');
        const statusTextElement = friendRow.querySelector('.friend-status');

        if (isOnline) {
            friendRow.classList.remove('offline');
            friendRow.classList.add('online');
            if (statusDot) statusDot.className = 'status-dot online';
            if (statusTextElement) statusTextElement.textContent = 'Çevrimiçi';
            // Online listesine taşı (veya görünür yap)
            moveFriendRow(friendRow, onlineList);
        } else {
            friendRow.classList.remove('online');
            friendRow.classList.add('offline');
            if (statusDot) statusDot.className = 'status-dot offline';
            if (statusTextElement) statusTextElement.textContent = 'Çevrimdışı';
            // Offline listesine taşı (veya görünür yap)
            moveFriendRow(friendRow, offlineList);
        }
        // Her güncellemeden sonra sayaçları tekrar hesapla
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

    // --- Tüm (Kabul Edilmiş) Arkadaşları Yükleme Fonksiyonu ---
    async function loadAllFriends() {
        if (!onlineList || !offlineList || !document.querySelector('.online-count') || !document.querySelector('.offline-count')) return;

        onlineList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Arkadaşlar yükleniyor...</div>';
        offlineList.innerHTML = '';
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
                .select(`
                    id,
                    user_id_1,
                    user_id_2,
                    user1:user_id_1 ( id, username, avatar ),
                    user2:user_id_2 ( id, username, avatar )
                `)
                .eq('status', 'accepted')
                .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

            if (friendsError) {
                console.error('Error fetching accepted friends:', friendsError);
                onlineList.innerHTML = '<div class="error-placeholder">Arkadaşlar yüklenirken hata oluştu.</div>';
                return;
            }

            onlineList.innerHTML = '';
            offlineList.innerHTML = '';

            if (friendships.length === 0) {
                offlineList.innerHTML = '<div class="empty-placeholder">Henüz hiç arkadaşınız yok.</div>';
                updateFriendCounters();
                return;
            }

            friendships.forEach(friendship => {
                const friendUser = friendship.user_id_1 === currentUserId ? friendship.user2 : friendship.user1;
                if (!friendUser) return;

                const friendElement = document.createElement('div');
                friendElement.className = 'friend-row';
                friendElement.dataset.userId = friendUser.id;
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
                offlineList.appendChild(friendElement);
            });

            updateAllFriendStatuses();

        } catch (error) {
            console.error('Error in loadAllFriends:', error);
            onlineList.innerHTML = '<div class="error-placeholder">Arkadaşlar yüklenirken beklenmedik bir hata oluştu.</div>';
        }
    }
    // --- End Tüm Arkadaşları Yükleme ---

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

    // ... (Mevcut diğer dashboard.js kodları: createAddFriendModal vb.) ...

}); 