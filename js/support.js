document.addEventListener('DOMContentLoaded', function () {
    // Tüm SSS sorularını içeren veri
    const allFaqs = [
        {
            question: "Chatlify'ı nasıl indirebilirim?",
            answer: "Chatlify'ı ana sayfamızda veya indirme sayfamızda bulunan 'İndir' butonuna tıklayarak indirebilirsiniz. Şu anda Windows, macOS, Linux, iOS ve Android için uygulamalarımız mevcuttur. Platformunuza uygun sürümü seçip indirme işlemini başlatabilirsiniz.",
            visible: true
        },
        {
            question: "Hesap oluşturmak ücretsiz mi?",
            answer: "Evet, Chatlify'da hesap oluşturmak tamamen ücretsizdir. Temel özelliklerin çoğu ücretsiz hesap ile kullanılabilir. Premium özellikler için Chatlify Premium aboneliği sunuyoruz, ancak standart kullanım için ücret ödemeniz gerekmez.",
            visible: true
        },
        {
            question: "Şifremi unuttum, ne yapmalıyım?",
            answer: "Şifrenizi unuttuysanız, giriş ekranındaki 'Şifremi Unuttum' bağlantısına tıklayabilirsiniz. Hesabınızla ilişkili e-posta adresinizi girdiğinizde, şifre sıfırlama bağlantısı içeren bir e-posta alacaksınız. Bağlantıya tıklayarak yeni bir şifre oluşturabilirsiniz.",
            visible: true
        },
        {
            question: "Chatlify'da sesli görüşme nasıl yapılır?",
            answer: "Sesli görüşme başlatmak için, konuşmak istediğiniz kişinin veya grubun sohbet penceresine gidin. Ekranın üst kısmındaki 'Ara' simgesine (telefon şeklinde) tıklayın. Karşı taraf aramanızı kabul ettiğinde sesli görüşme başlayacaktır. Grup aramalarında birden fazla kişi aynı anda katılabilir.",
            visible: true
        },
        {
            question: "Bir topluluğa nasıl katılabilirim?",
            answer: "Bir topluluğa katılmak için birkaç yol vardır: Ana sayfadaki 'Topluluk Keşfet' bölümünden popüler toplulukları görüntüleyebilir, arama çubuğundan belirli toplulukları arayabilir veya bir davet bağlantısı ile doğrudan katılabilirsiniz. Topluluğu bulduğunuzda 'Katıl' butonuna tıklamanız yeterlidir.",
            visible: true
        },
        {
            question: "Chatlify Premium ne sunuyor?",
            answer: "Chatlify Premium ile yüksek kaliteli ses ve görüntü, özel emojiler ve çıkartmalar, gelişmiş güvenlik özellikleri, daha yüksek dosya yükleme limitleri, özel profil rozeti ve daha fazla özelleştirme seçeneği sunuyoruz. Aylık veya yıllık abonelik planlarımız mevcuttur.",
            visible: true
        },
        {
            question: "Kendi topluluğumu nasıl oluşturabilirim?",
            answer: "Kendi topluluğunuzu oluşturmak için ana menüden 'Topluluk Oluştur' seçeneğine tıklayın. Topluluğunuz için bir isim, açıklama ve simge belirleyin. Ardından kanallar oluşturabilir, izinleri ayarlayabilir ve arkadaşlarınızı davet edebilirsiniz. Topluluk ayarlarından her zaman özelleştirmeler yapabilirsiniz.",
            visible: true
        },
        {
            question: "Chatlify'da mesajlarımı nasıl silerim?",
            answer: "Bir mesajı silmek için, silmek istediğiniz mesajın üzerine gelin ve beliren üç nokta (...) simgesine tıklayın. Açılan menüden 'Sil' seçeneğini seçin. Mesajı yalnızca kendiniz için mi yoksa herkes için mi silmek istediğinizi belirtin. Grup mesajlarında, yalnızca kendi mesajlarınızı silebilirsiniz.",
            visible: true
        },
        {
            question: "Birini engellemek için ne yapmalıyım?",
            answer: "Bir kullanıcıyı engellemek için, o kişinin profil sayfasına gidin ve sağ üst köşedeki üç nokta (...) simgesine tıklayın. Açılan menüden 'Engelle' seçeneğini seçin. Engellediğiniz kişiler size mesaj gönderemez, aramalar yapamaz ve topluluklarda içeriğinizi göremez. Engellemeleri istediğiniz zaman kaldırabilirsiniz.",
            visible: true
        },
        {
            question: "Bildirim ayarlarımı nasıl değiştirebilirim?",
            answer: "Bildirim ayarlarınızı değiştirmek için Ayarlar > Bildirimler bölümüne gidin. Burada genel bildirimler, sesli aramalar, mesajlar ve topluluk bildirimleri için farklı seçenekleri özelleştirebilirsiniz. Belirli sohbetler veya topluluklar için özel bildirim ayarları da yapabilirsiniz.",
            visible: true
        },
        {
            question: "Chatlify'da ekran paylaşımı nasıl yapılır?",
            answer: "Ekran paylaşımı yapmak için, görüntülü arama sırasında alt menüdeki 'Ekranı Paylaş' simgesine tıklayın. Tüm ekranınızı veya belirli bir pencereyi paylaşmayı seçebilirsiniz. Ekran paylaşımını durdurmak için tekrar aynı simgeye tıklamanız yeterlidir.",
            visible: false
        },
        {
            question: "Chatlify'da grup sohbeti nasıl oluşturulur?",
            answer: "Grup sohbeti oluşturmak için ana menüden 'Yeni Grup' seçeneğine tıklayın. Gruba katılmasını istediğiniz kişileri seçin, gruba bir isim verin ve isteğe bağlı olarak bir grup simgesi ekleyin. Oluştur'a tıkladığınızda grup sohbeti başlatılacaktır.",
            visible: false
        },
        {
            question: "Hesabımı nasıl silebilirim?",
            answer: "Hesabınızı silmek için Ayarlar > Hesap > Hesabı Sil bölümüne gidin. Hesap silme işlemi geri alınamaz ve tüm verileriniz, sohbetleriniz ve ayarlarınız kalıcı olarak silinecektir. Onaylamadan önce bu bilgiyi dikkate alın.",
            visible: false
        },
        {
            question: "Ödeme bilgilerimi nasıl güncellerim?",
            answer: "Ödeme bilgilerinizi güncellemek için Ayarlar > Faturalandırma bölümüne gidin. 'Ödeme Yöntemini Güncelle' seçeneğine tıklayın ve yeni kart bilgilerinizi girin. Değişiklikler anında uygulanacak ve bir sonraki ödemeniz güncel bilgilerinizle yapılacaktır.",
            visible: false
        },
        {
            question: "İki faktörlü kimlik doğrulamayı nasıl etkinleştirebilirim?",
            answer: "İki faktörlü kimlik doğrulamayı etkinleştirmek için Ayarlar > Güvenlik > İki Faktörlü Kimlik Doğrulama bölümüne gidin. 'Etkinleştir' butonuna tıklayın ve tercih ettiğiniz doğrulama yöntemini seçin (SMS, e-posta veya kimlik doğrulama uygulaması). Verilen talimatları izleyerek kurulumu tamamlayın.",
            visible: false
        },
        {
            question: "Chatlify'da dosya paylaşım limitleri nelerdir?",
            answer: "Ücretsiz hesaplar için dosya paylaşım limiti her bir dosya için 100MB'dir. Premium kullanıcılar için bu limit 500MB'a yükseltilmiştir. Ayrıca, ücretsiz kullanıcılar aylık toplam 5GB, Premium kullanıcılar ise 50GB dosya paylaşabilir.",
            visible: false
        },
        {
            question: "Profil resmimi nasıl değiştirebilirim?",
            answer: "Profil resminizi değiştirmek için Ayarlar > Profil bölümüne gidin. Mevcut profil resminize tıklayın ve 'Değiştir' seçeneğini seçin. Cihazınızdan bir resim yükleyebilir veya önerilen avatarlardan birini seçebilirsiniz. Resmi ayarlamak için 'Kaydet' butonuna tıklayın.",
            visible: false
        },
        {
            question: "Chatlify'da arkadaş nasıl eklenir?",
            answer: "Arkadaş eklemek için kullanıcı adı, e-posta veya telefon numarası ile arama yapabilirsiniz. Ayrıca, kullanıcının profilini ziyaret edip 'Arkadaş Ekle' butonuna tıklayabilirsiniz. Karşı taraf arkadaşlık isteğinizi kabul ettiğinde arkadaş listenize eklenecektir.",
            visible: false
        },
        {
            question: "Chatlify'ı birden fazla cihazda kullanabilir miyim?",
            answer: "Evet, Chatlify hesabınıza istediğiniz kadar cihazdan giriş yapabilirsiniz. Tüm sohbetleriniz ve ayarlarınız cihazlar arasında senkronize edilecektir. Aynı anda birden fazla cihazda aktif olabilirsiniz.",
            visible: false
        },
        {
            question: "Chatlify'da mesajlarımı nasıl yedekleyebilirim?",
            answer: "Mesajlarınızı yedeklemek için Ayarlar > Veri ve Depolama > Sohbet Yedekleme bölümüne gidin. 'Yedekle' butonuna tıklayın ve yedekleme konumunu seçin. Otomatik yedekleme için günlük, haftalık veya aylık seçeneklerden birini etkinleştirebilirsiniz.",
            visible: false
        },
        {
            question: "Chatlify'da koyu tema nasıl etkinleştirilir?",
            answer: "Koyu temayı etkinleştirmek için Ayarlar > Görünüm > Tema bölümüne gidin. 'Koyu' seçeneğini işaretleyin. Ayrıca 'Otomatik' seçeneğini seçerek cihazınızın sistem ayarlarına göre temanın otomatik değişmesini sağlayabilirsiniz.",
            visible: false
        },
        {
            question: "Chatlify sunucularının konumu nerededir?",
            answer: "Chatlify sunucuları dünya genelinde stratejik konumlarda bulunmaktadır: Kuzey Amerika (ABD ve Kanada), Avrupa (Almanya, Fransa, İngiltere), Asya (Japonya, Singapur, Hindistan) ve Avustralya. Kullanıcılara en düşük gecikme süresini sağlamak için en yakın sunucuya otomatik olarak bağlanırlar.",
            visible: false
        },
        {
            question: "Chatlify'da dil ayarlarını nasıl değiştirebilirim?",
            answer: "Dil ayarlarını değiştirmek için Ayarlar > Genel > Dil bölümüne gidin. Desteklenen 25+ dil arasından tercih ettiğiniz dili seçin. Değişiklik anında uygulanacaktır. Bazı çeviriler topluluk tarafından sağlanmaktadır ve eksiklikler olabilir.",
            visible: false
        },
        {
            question: "Chatlify'da internet bağlantısı olmadan kullanabilir miyim?",
            answer: "Hayır, Chatlify çevrimiçi bir iletişim platformudur ve temel özelliklerinin çoğu için internet bağlantısı gerektirir. Ancak, daha önce yüklenmiş olan medya dosyalarına çevrimdışıyken erişebilirsiniz. İnternet bağlantınız geri geldiğinde, tüm mesajlarınız otomatik olarak senkronize edilecektir.",
            visible: false
        },
        {
            question: "Chatlify hangi tarayıcılarla uyumludur?",
            answer: "Chatlify web uygulaması Chrome, Firefox, Safari, Edge ve Opera'nın güncel sürümleriyle tam uyumludur. En iyi deneyim için tarayıcınızı güncel tutmanızı öneririz. Internet Explorer artık desteklenmemektedir.",
            visible: false
        }
    ];

    // SSS öğelerini sayfaya ekleyen fonksiyon
    function renderFaqs(faqs) {
        const container = document.getElementById('faqContainer');
        container.innerHTML = '';

        if (faqs.length === 0) {
            document.querySelector('.no-results').style.display = 'block';
            return;
        }

        document.querySelector('.no-results').style.display = 'none';

        faqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.classList.add('faq-item');

            faqItem.innerHTML = `
                <div class="faq-question">
                    <span>${faq.question}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer">
                    <p>${faq.answer}</p>
                </div>
            `;

            container.appendChild(faqItem);

            // Soru tıklama olayını ekle
            const questionElement = faqItem.querySelector('.faq-question');
            questionElement.addEventListener('click', () => {
                faqItem.classList.toggle('active');
            });
        });
    }

    // Sayfayı ilk yüklediğimizde görünür SSS'leri göster
    const visibleFaqs = allFaqs.filter(faq => faq.visible);
    renderFaqs(visibleFaqs);

    // Arama fonksiyonu
    function searchFaqs(query) {
        if (!query.trim()) {
            renderFaqs(visibleFaqs);
            return;
        }

        query = query.toLowerCase().trim();

        const results = allFaqs.filter(faq =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        );

        renderFaqs(results);
    }

    // Arama olaylarını ekle
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    searchButton.addEventListener('click', () => {
        searchFaqs(searchInput.value);
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchFaqs(searchInput.value);
        }
    });

    // Sayfa yüklenirken animasyon
    document.querySelector('main').classList.add('loaded');

    // Scroll animasyonları
    const addScrolledClass = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scrolled');
            }
        });
    };

    const observer = new IntersectionObserver(addScrolledClass, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    document.querySelectorAll('.faq-item').forEach(item => {
        observer.observe(item);
    });

    // Header scroll efekti
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            document.querySelector('header').classList.add('scrolled');
        } else {
            document.querySelector('header').classList.remove('scrolled');
        }
    });
}); 