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
    const addFriendButton = document.querySelector('.dashboard-header .add-friend'); // Eski Arkadaş Ekle Butonu
    const newAddFriendButton = document.getElementById('add-friend-button'); // Yeni Arkadaş Ekle Butonu
    const callOverlay = document.querySelector('.call-panel-overlay');
    const outgoingCallPanel = callOverlay.querySelector('.outgoing-call');
    const incomingCallPanel = callOverlay.querySelector('.incoming-call');
    const activeCallPanel = callOverlay.querySelector('.active-call');
    let currentCallTarget = null; // Aranan veya görüşülen kişiyi tutacak
    // --- End Element Tanımlamaları ---

    // --- Modal Elementlerini Tanımla ---
    const addFriendModal = document.getElementById('add-friend-modal');
    const closeModalButton = addFriendModal?.querySelector('.close-modal-btn');
    const addFriendUsernameInput = addFriendModal?.querySelector('#add-friend-username-input');
    const addFriendSubmitButton = addFriendModal?.querySelector('#add-friend-submit-button');
    const addFriendMessageArea = addFriendModal?.querySelector('#add-friend-message-area');
    // --- End Modal Element Tanımlamaları ---

    // --- Kontekst Menü (Sağ Tık) Sistemi ---
    let activeContextMenu = null;

    // Sayfa üzerinde kontekst menü göster
    function showContextMenu(event, userData) {
        event.preventDefault(); // Varsayılan sağ tık menüsünü engelle

        // Varsa önceki menüyü temizle
        if (activeContextMenu) {
            document.body.removeChild(activeContextMenu);
        }

        // Yeni kontekst menüsü oluştur
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';

        // Menü içeriği - başlık ve avatar ile
        let menuContent = '';

        // Eğer kullanıcı bilgisi varsa header ekle
        if (userData && userData.name) {
            menuContent += `
                <div class="context-menu-header">
                    <div class="context-menu-avatar">
                        <img src="${userData.avatar || defaultAvatar}" alt="${userData.name}">
                    </div>
                    <div class="context-menu-name">${userData.name}</div>
                </div>
            `;
        }

        // Sunucu/DM/Arkadaş türüne göre menü öğeleri ekle
        switch (userData.type) {
            case 'friend':
                menuContent += `
                    <div class="context-menu-item" data-action="message" data-id="${userData.id}">
                        <i class="fas fa-comment"></i> Mesaj Gönder
                    </div>
                    <div class="context-menu-item" data-action="profile" data-id="${userData.id}">
                        <i class="fas fa-user"></i> Profili Görüntüle
                    </div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="remove-friend" data-id="${userData.id}">
                        <i class="fas fa-user-times"></i> Arkadaşlıktan Çıkar
                    </div>
                `;
                break;

            case 'server':
                menuContent += `
                    <div class="context-menu-item" data-action="visit-server" data-id="${userData.id}">
                        <i class="fas fa-sign-in-alt"></i> Sunucuya Git
                    </div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="leave-server" data-id="${userData.id}">
                        <i class="fas fa-sign-out-alt"></i> Sunucudan Ayrıl
                    </div>
                `;
                break;

            case 'dm':
                menuContent += `
                    <div class="context-menu-item" data-action="message" data-id="${userData.id}">
                        <i class="fas fa-comment"></i> Mesaj Gönder
                    </div>
                    <div class="context-menu-item" data-action="profile" data-id="${userData.id}">
                        <i class="fas fa-user"></i> Profili Görüntüle
                    </div>
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item" data-action="remove-dm" data-id="${userData.id}">
                        <i class="fas fa-times"></i> Sohbeti Kapat
                    </div>
                `;
                break;
        }

        contextMenu.innerHTML = menuContent;
        document.body.appendChild(contextMenu);

        // Menüyü doğru konuma yerleştir 
        positionContextMenu(contextMenu, event);

        // Menü öğelerine olay dinleyicileri ekle
        contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', handleContextMenuAction);
        });

        // Animasyonu aktifleştir
        setTimeout(() => {
            contextMenu.classList.add('active');
        }, 10);

        // Aktif menüyü kaydet
        activeContextMenu = contextMenu;
    }

    // Kontekst menüsünü konumlandırma fonksiyonu
    function positionContextMenu(menu, event) {
        const x = event.clientX;
        const y = event.clientY;
        const menuWidth = 220; // context-menu için CSS'de tanımlanan genişlik
        const menuHeight = menu.offsetHeight || 200; // Henüz DOM'a eklenmemiş olabilir, tahmini kullan

        // Ekranın sağ ve alt sınırlarını kontrol et
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Sağ kenar kontrolü - eğer taşacaksa solda göster
        let menuX = x;
        if (x + menuWidth > windowWidth) {
            menuX = x - menuWidth;
        }

        // Alt kenar kontrolü - eğer taşacaksa yukarı kaydır
        let menuY = y;
        if (y + menuHeight > windowHeight) {
            menuY = windowHeight - menuHeight - 10; // 10px bottom margin
            if (menuY < 10) menuY = 10; // En azından 10px yukarıdan olsun
        }

        // Menüyü konumlandır
        menu.style.left = menuX + 'px';
        menu.style.top = menuY + 'px';
    }

    // Kontekst menü öğelerine tıklanınca yapılacak işlemler
    function handleContextMenuAction(e) {
        const action = e.currentTarget.dataset.action;
        const id = e.currentTarget.dataset.id;

        console.log(`Kontekst menü aksiyonu: ${action} için ID: ${id}`);

        switch (action) {
            case 'message':
                // DM aç
                const targetElement = document.querySelector(`.friend-row[data-user-id="${id}"]`) ||
                    document.querySelector(`.dm-item[data-user-id="${id}"]`);

                if (targetElement) {
                    const username = targetElement.dataset.username;
                    const avatar = targetElement.dataset.avatar;

                    if (username && id) {
                        openChatPanel(id, username, avatar || defaultAvatar);
                        // DM listesinde ilgili öğeyi aktif et
                        document.querySelectorAll('.dm-item').forEach(item => item.classList.remove('active'));
                        document.querySelector(`.dm-item[data-user-id="${id}"]`)?.classList.add('active');
                    }
                }
                break;

            case 'profile':
                // Profili göster
                const userElement = document.querySelector(`.friend-row[data-user-id="${id}"]`) ||
                    document.querySelector(`.dm-item[data-user-id="${id}"]`);

                if (userElement) {
                    const userData = {
                        id: id,
                        name: userElement.dataset.username,
                        avatar: userElement.dataset.avatar,
                        status: onlineFriends.has(id) ? 'online' : 'offline'
                    };
                    createProfilePanel(userData);
                }
                break;

            // Diğer aksiyonlar kullanıcı taleplerine göre eklenebilir
            case 'remove-friend':
                alert('Bu özellik henüz aktif değil: Arkadaşlıktan çıkarma');
                break;

            case 'visit-server':
                alert('Bu özellik henüz aktif değil: Sunucuya gitme');
                break;

            case 'leave-server':
                alert('Bu özellik henüz aktif değil: Sunucudan ayrılma');
                break;

            case 'remove-dm':
                alert('Bu özellik henüz aktif değil: Sohbeti kaldırma');
                break;
        }

        // Menüyü kapat
        if (activeContextMenu) {
            activeContextMenu.classList.remove('active');
            setTimeout(() => {
                if (activeContextMenu && activeContextMenu.parentNode) {
                    activeContextMenu.parentNode.removeChild(activeContextMenu);
                }
                activeContextMenu = null;
            }, 150);
        }
    }

    // Döküman üzerinde başka bir yere tıklanınca menüyü kapat
    document.addEventListener('click', () => {
        if (activeContextMenu) {
            activeContextMenu.classList.remove('active');
            setTimeout(() => {
                if (activeContextMenu && activeContextMenu.parentNode) {
                    activeContextMenu.parentNode.removeChild(activeContextMenu);
                }
                activeContextMenu = null;
            }, 150);
        }
    });

    // Elemanlara sağ tık menüsü ekle
    function addContextMenuListeners() {
        // Arkadaş Satırları
        document.querySelectorAll('.friend-row').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                const userData = {
                    id: item.dataset.userId,
                    name: item.dataset.username,
                    avatar: item.dataset.avatar,
                    type: 'friend'
                };
                showContextMenu(e, userData);
            });
        });

        // Özel Mesaj Satırları
        document.querySelectorAll('.dm-item').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                const userData = {
                    id: item.dataset.userId,
                    name: item.dataset.username,
                    avatar: item.dataset.avatar,
                    type: 'dm'
                };
                showContextMenu(e, userData);
            });
        });

        // Sunucu Satırları
        document.querySelectorAll('.server-item:not(.home):not(:last-child)').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                // Sunucu ID, ad ve avatar data attributelerden alınabilir
                const serverName = item.querySelector('.server-tooltip')?.textContent || 'Sunucu';
                const serverAvatar = item.querySelector('.server-icon img')?.src || defaultAvatar;
                const serverId = item.dataset.serverId || 'unknown'; // Eğer data-server-id eklenmişse

                const userData = {
                    id: serverId,
                    name: serverName,
                    avatar: serverAvatar,
                    type: 'server'
                };
                showContextMenu(e, userData);
            });
        });
    }

    // --- End Kontekst Menü Sistemi ---

    // Elementler bulunamadıysa kontrol et (Kullanıcı Paneli)
    if (!userPanelUsernameElement) {
        console.error('User panel username element (.dm-footer .dm-user-name) not found.');
    }
    if (!userPanelAvatarElement) {
        console.error('User panel avatar element (.dm-footer .dm-user-avatar img) not found.');
    }
    // Elementler bulunamadıysa kontrol et (Arkadaş Paneli)
    if (!pendingList || !pendingCountBadge || !pendingSection || !onlineList || !onlineSection || !offlineList || !offlineSection || !dmList || !chatPanel || !chatHeaderUser || !chatMessagesContainer || !friendsPanelContainer || !sponsorSidebar || !settingsButtonContainer || !chatCloseBtn || !chatEmojiBtn || !chatTextarea || !emojiPicker || !addFriendButton ||
        // Modal elementlerini de kontrol et
        !addFriendModal || !closeModalButton || !addFriendUsernameInput || !addFriendSubmitButton || !addFriendMessageArea) {
        console.error('One or more friend panel or modal elements are missing in HTML.');
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

                // Kontekst menüsü ekle
                addContextMenuListeners();
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
                friendElement.innerHTML = `
                    <div class="friend-avatar">
                        <img src="${friendUser.avatar || defaultAvatar}" alt="${friendUser.username}">
                        <span class="status-dot offline"></span>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${friendUser.username}</div>
                        <div class="friend-status">Çevrimdışı</div>
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
            });

            // Arkadaşları ekledikten sonra Presence durumuna göre güncelle
            updateAllFriendStatuses();

            // Kontekst menüsü ekle
            addContextMenuListeners();

        } catch (error) {
            console.error('Error in loadAllFriends:', error);
            onlineList.innerHTML = '<div class="error-placeholder">Arkadaşlar yüklenirken beklenmedik bir hata oluştu.</div>';
        }
    }
    // --- End Tüm Arkadaşları Yükleme ---

    // --- Sohbet Paneli Açma Fonksiyonu (Güncellendi - Seçiciler düzeltildi) ---
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

        // Header butonlarına listener ekle
        setupChatHeaderActions(userId, username, avatar);

        // Scrollu en alta indir (yeni mesajlar için)
        const messagesContainer = chatPanel.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
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
    function closeChatPanel() {
        console.log("Close chat button clicked");
        if (chatPanel) chatPanel.classList.add('hidden');
        if (friendsPanelContainer) friendsPanelContainer.classList.remove('hidden');
        if (sponsorSidebar) sponsorSidebar.style.display = ''; // veya 'flex'
        // Aktif DM stilini kaldır
        document.querySelectorAll('.dm-item.active').forEach(item => item.classList.remove('active'));
        // Aktif sohbet ID'sini temizle
        if (chatPanel) delete chatPanel.dataset.activeChatUserId;
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

    // --- Arkadaş Ekle Modalını Yönetme --- 
    function openAddFriendModal() {
        if (!addFriendModal || !addFriendUsernameInput || !addFriendMessageArea || !addFriendSubmitButton) return;

        // Modal açılmadan önce input ve mesaj alanını temizle, butonu sıfırla
        addFriendUsernameInput.value = '';
        addFriendMessageArea.innerHTML = '';
        addFriendMessageArea.className = 'modal-message-area'; // Mesaj stillerini temizle
        addFriendMessageArea.style.display = 'none';
        addFriendUsernameInput.disabled = false;
        addFriendSubmitButton.disabled = false;
        addFriendSubmitButton.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Arkadaşlık İsteği Gönder</span>';

        // Önce görünür hale getir, sonra animasyon için open sınıfını ekle
        addFriendModal.style.display = 'flex';

        // Body'nin kaydırmasını devre dışı bırak
        document.body.style.overflow = 'hidden';

        // Küçük bir gecikme ile opacity/transform animasyonu başlat
        setTimeout(() => {
            addFriendModal.classList.add('open');
            addFriendUsernameInput.focus(); // Açıldığında inputa odaklan
        }, 10);
    }

    function closeAddFriendModal() {
        if (!addFriendModal) return;

        // Önce open sınıfını kaldır (animasyon başlar)
        addFriendModal.classList.remove('open');

        // Body'nin kaydırmasını tekrar etkinleştir
        document.body.style.overflow = '';

        // CSS transition bittikten sonra display none yap
        setTimeout(() => {
            addFriendModal.style.display = 'none';

            // Modalı kapatırken içeriği temizle (opsiyonel)
            if (addFriendUsernameInput) addFriendUsernameInput.value = '';
            if (addFriendMessageArea) {
                addFriendMessageArea.innerHTML = '';
                addFriendMessageArea.className = 'modal-message-area';
                addFriendMessageArea.style.display = 'none';
            }
        }, 300); // CSS transition süresi ile aynı olmalı
    }

    // Yeni eklediğimiz "Arkadaş Ekle" butonuna olay dinleyicisi ekle
    if (newAddFriendButton) {
        newAddFriendButton.addEventListener('click', openAddFriendModal);
    }

    // Eski "Arkadaş Ekle" butonuna olay dinleyicisi ekle (eğer varsa)
    if (addFriendButton) {
        addFriendButton.addEventListener('click', openAddFriendModal);
    }

    // Kapatma butonuna tıklanınca modalı kapat
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeAddFriendModal);
    }

    // Overlay'e (modal dışına) tıklanınca modalı kapat
    if (addFriendModal) {
        addFriendModal.addEventListener('click', (event) => {
            if (event.target === addFriendModal) { // Sadece overlay'e tıklandıysa kapat
                closeAddFriendModal();
            }
        });

        // ESC tuşuna basınca modalı kapat
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && addFriendModal.style.display !== 'none') {
                closeAddFriendModal();
            }
        });
    }

    // Modal içindeki "Arkadaşlık İsteği Gönder" butonu için olay dinleyicisi
    if (addFriendSubmitButton && addFriendUsernameInput && addFriendMessageArea) {

        // Yardımcı mesaj gösterme fonksiyonu (modal için özelleştirilmiş)
        function showModalMessage(message, type = 'info') {
            if (!addFriendMessageArea) return;

            // Mesaj alanını temizle
            addFriendMessageArea.innerHTML = message;
            addFriendMessageArea.className = `modal-message-area ${type}`; // success veya error class'ı ekle

            // Animasyon efektini yeniden tetiklemek için kısa bir süre gizle ve sonra göster
            addFriendMessageArea.style.display = 'none';
            setTimeout(() => {
                addFriendMessageArea.style.display = 'flex';
            }, 10);
        }

        // Butonu ve inputu sıfırlama fonksiyonu (modal için)
        function resetModalSubmitButton() {
            if (!addFriendSubmitButton || !addFriendUsernameInput) return;

            addFriendSubmitButton.disabled = false;
            addFriendUsernameInput.disabled = false;
            addFriendSubmitButton.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Arkadaşlık İsteği Gönder</span>';
        }

        addFriendSubmitButton.addEventListener('click', async () => {
            const targetUsername = addFriendUsernameInput.value.trim();

            // Giriş yoksa, input'a odaklan ve hafif bir sarsma animasyonu ekle
            if (!targetUsername) {
                addFriendUsernameInput.focus();
                addFriendUsernameInput.classList.add('shake-input');
                setTimeout(() => {
                    addFriendUsernameInput.classList.remove('shake-input');
                }, 500);
                showModalMessage('Lütfen bir kullanıcı adı girin.', 'error');
                return;
            }

            // Loading durumunu başlat
            addFriendUsernameInput.disabled = true;
            addFriendSubmitButton.disabled = true;
            addFriendSubmitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Gönderiliyor...</span>';
            addFriendMessageArea.style.display = 'none'; // Önceki mesajı gizle

            try {
                // Bu kısım daha önceki kodunuzdan alındı ve modal elementleri kullanacak şekilde güncellendi
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    showModalMessage('Oturum bulunamadı. Lütfen tekrar giriş yapın.', 'error');
                    resetModalSubmitButton();
                    closeAddFriendModal(); // Oturum yoksa modalı kapat
                    return;
                }
                const currentUserId = session.user.id;

                const { data: targetUser, error: findUserError } = await supabase.from('users').select('id').eq('username', targetUsername).single();
                if (findUserError || !targetUser) {
                    showModalMessage(`Kullanıcı bulunamadı: ${targetUsername}`, 'error');
                    resetModalSubmitButton();
                    return;
                }
                const targetUserId = targetUser.id;

                if (currentUserId === targetUserId) {
                    showModalMessage('Kendinize arkadaşlık isteği gönderemezsiniz.', 'error');
                    resetModalSubmitButton();
                    return;
                }

                const { data: existingFriendship, error: checkError } = await supabase.from('friendships').select('status').or(`and(user_id_1.eq.${currentUserId},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${currentUserId})`).maybeSingle();
                if (checkError) {
                    console.error('Error checking existing friendship:', checkError);
                    showModalMessage('İstek gönderilirken bir hata oluştu. (Kod: CHECK)', 'error');
                    resetModalSubmitButton();
                    return;
                }

                if (existingFriendship) {
                    let errorMsg = 'Bu kullanıcıyla ilgili mevcut bir ilişki durumu var.';
                    if (existingFriendship.status === 'pending') errorMsg = 'Bu kullanıcıya zaten bir istek gönderilmiş veya ondan bir istek var.';
                    else if (existingFriendship.status === 'accepted') errorMsg = 'Bu kullanıcı zaten arkadaş listenizde.';
                    else if (existingFriendship.status === 'blocked') errorMsg = 'Bu kullanıcıyla ilgili bir engelleme mevcut.';
                    showModalMessage(errorMsg, 'error');
                    resetModalSubmitButton();
                    return;
                }

                const { error: insertError } = await supabase.from('friendships').insert({ user_id_1: currentUserId, user_id_2: targetUserId, status: 'pending' });
                if (insertError) {
                    console.error('Error sending friend request:', insertError);
                    if (insertError.code === '23505') {
                        showModalMessage('Bu kullanıcıya zaten bir istek gönderilmiş veya ondan bir istek var.', 'error');
                    } else {
                        showModalMessage(`Arkadaşlık isteği gönderilemedi. (Kod: ${insertError.code})`, 'error');
                    }
                    resetModalSubmitButton();
                    return;
                }

                // Başarılı olduğunda 
                showModalMessage(`Arkadaşlık isteği ${targetUsername} kullanıcısına başarıyla gönderildi!`, 'success');
                addFriendUsernameInput.value = ''; // Başarılıysa inputu temizle

                // Başarıdan sonra belirli bir süre bekleyip modalı kapat
                setTimeout(() => {
                    closeAddFriendModal();
                }, 2500);

                // Bekleyen arkadaşlık isteklerini yenile (eğer ilgili bölüm aktif ise)
                setTimeout(() => {
                    loadPendingRequests(); // Bu fonksiyon mevcutsa çalıştır
                }, 1000);

            } catch (error) {
                console.error('Friend request error:', error);
                showModalMessage('Beklenmedik bir hata oluştu.', 'error');
                resetModalSubmitButton();
            }
        });

        // Input alanında Enter'a basılınca gönderme butonunu tetikle
        addFriendUsernameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !addFriendSubmitButton.disabled) {
                e.preventDefault(); // Form varsa gönderilmesini engelle
                addFriendSubmitButton.click();
            }

            // Yazmaya başlayınca hata mesajını temizle
            if (addFriendMessageArea.classList.contains('error')) {
                addFriendMessageArea.style.display = 'none';
            }
        });

        // Input içeriği değiştiğinde de hata mesajını gizle (daha iyi UX)
        addFriendUsernameInput.addEventListener('input', () => {
            if (addFriendMessageArea.classList.contains('error')) {
                addFriendMessageArea.style.display = 'none';
            }
        });
    }
    // --- End Arkadaş Ekle Modalını Yönetme ---

    // Sohbet panelini açan fonksiyonu güncelleyelim veya event listener ekleyelim
    function setupChatHeaderActions(userId, username, avatar) {
        const chatHeader = document.querySelector('.chat-header');
        if (!chatHeader) return;

        const voiceCallBtn = chatHeader.querySelector('.chat-action-btn i.fa-phone')?.parentElement;
        const videoCallBtn = chatHeader.querySelector('.chat-action-btn i.fa-video')?.parentElement;
        const closeChatBtn = chatHeader.querySelector('.chat-close-btn');

        if (voiceCallBtn) {
            // Önceki listener'ı kaldır (varsa)
            voiceCallBtn.replaceWith(voiceCallBtn.cloneNode(true));
            const newVoiceCallBtn = chatHeader.querySelector('.chat-action-btn i.fa-phone')?.parentElement;
            if (newVoiceCallBtn) {
                newVoiceCallBtn.addEventListener('click', () => startVoiceCall(userId, username, avatar));
            }
        }

        // Diğer butonlar için listener'lar (varsa)
        if (closeChatBtn) {
            // Önceki listener'ı kaldır (varsa)
            closeChatBtn.replaceWith(closeChatBtn.cloneNode(true));
            const newCloseChatBtn = chatHeader.querySelector('.chat-close-btn');
            if (newCloseChatBtn) {
                newCloseChatBtn.addEventListener('click', closeChatPanel); // Artık hata vermemeli
            }
        }
    }

    // Sesli Arama Fonksiyonları
    function startVoiceCall(userId, username, avatar) {
        console.log(`${username} (${userId}) aranıyor...`);
        currentCallTarget = { userId, username, avatar };

        // Giden arama panelini doldur
        const outAvatar = outgoingCallPanel.querySelector('.call-avatar');
        const outUsername = outgoingCallPanel.querySelector('.call-username');
        if (outAvatar) outAvatar.src = avatar || defaultAvatar;
        if (outUsername) outUsername.textContent = `${username} aranıyor...`;

        // Panelleri göster/gizle
        outgoingCallPanel.style.display = 'block';
        incomingCallPanel.style.display = 'none';
        activeCallPanel.style.display = 'none';
        callOverlay.style.display = 'flex';

        // TODO: Backend'e arama isteği gönder
    }

    function endCall() {
        console.log('Arama sonlandırıldı.');
        callOverlay.style.display = 'none';
        outgoingCallPanel.style.display = 'none';
        incomingCallPanel.style.display = 'none';
        activeCallPanel.style.display = 'none';
        currentCallTarget = null;
        // TODO: Backend'e arama sonlandırma bilgisi gönder
    }

    // Olay Dinleyicileri
    document.addEventListener('DOMContentLoaded', () => {
        // ... (Mevcut DOMContentLoaded kodları) ...

        // Arama paneli butonları için listener'lar
        if (callOverlay) {
            // Kapatma butonları (tüm panellerde aynı sınıf var)
            callOverlay.querySelectorAll('.hangup-btn').forEach(btn => {
                btn.addEventListener('click', endCall);
            });
            callOverlay.querySelectorAll('.decline-btn').forEach(btn => {
                btn.addEventListener('click', endCall); // Şimdilik reddetmek de aramayı kapatıyor
            });

            // TODO: Kabul etme (.accept-btn) ve Sesi Kapatma (.mute-btn) butonları için listener ekle
            // const acceptBtn = incomingCallPanel.querySelector('.accept-btn');
            // const muteBtn = activeCallPanel.querySelector('.mute-btn');

            // Overlay'a tıklayınca kapatma (opsiyonel)
            // callOverlay.addEventListener('click', (e) => {
            //     if (e.target === callOverlay) {
            //         endCall();
            //     }
            // });
        }

        // Sohbet paneli açıldığında header butonlarını ayarlamak için
        // Örnek: DM listesindeki birine tıklayınca
        const dmListElement = document.querySelector('#friends-group .dm-items'); // dmList değişkeni zaten tanımlı olabilir, emin olalım.
        if (dmListElement) {
            dmListElement.addEventListener('click', (e) => {
                const dmItem = e.target.closest('.dm-item');
                if (dmItem) {
                    const userId = dmItem.dataset.userId;
                    const username = dmItem.dataset.username;
                    const avatar = dmItem.dataset.avatar;
                    if (userId && username) {
                        openChatPanel(userId, username, avatar);
                    }
                }
            });
        }
        // Benzer şekilde arkadaş listesi için de eklenebilir
        const friendsListContainer = document.querySelector('.friends-list'); // Veya ilgili arkadaş listesi konteyneri
        if (friendsListContainer) {
            friendsListContainer.addEventListener('click', (e) => {
                const friendRow = e.target.closest('.friend-row');
                if (friendRow) {
                    const messageBtn = e.target.closest('.message-btn');
                    const profileBtn = e.target.closest('.profile-btn'); // Arkadaş satırındaki profil butonu

                    const userId = friendRow.dataset.userId;
                    const username = friendRow.dataset.username;
                    const avatar = friendRow.dataset.avatar;

                    if (userId && username) {
                        if (messageBtn) { // Mesaj butonuna tıklandıysa
                            openChatPanel(userId, username, avatar);
                        } else if (profileBtn) { // Profil butonuna tıklandıysa
                            const profileData = {
                                id: userId,
                                name: username,
                                avatar: avatar,
                                status: onlineFriends.has(userId) ? 'online' : 'offline'
                            };
                            createProfilePanel(profileData);
                        }
                    }
                }
            });
        }

    });

}); 