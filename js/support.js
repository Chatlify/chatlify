// Support Sayfası JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Ana içeriğin yüklenmesi animasyonu
    const main = document.querySelector('main');
    setTimeout(() => {
        main.classList.add('loaded');
    }, 300);

    // Değişkenler
    const faqItems = document.querySelectorAll('.faq-item');
    const faqSearch = document.getElementById('faq-search');
    const searchBtn = document.getElementById('search-btn');
    const noResults = document.getElementById('no-results');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const allFaqItems = document.querySelectorAll('.faq-item'); // Hem görünür hem gizli öğeler

    let activeCategory = 'all';
    let visibleCount = 0;

    // İlk 10 soruyu göster, diğerlerini gizle (zaten HTML'de hidden class'ı var)
    const initialVisibleItems = Array.from(faqItems).filter(item => !item.classList.contains('hidden'));

    // Tüm FAQ öğelerini kapat (başlangıçta)
    initialVisibleItems.forEach((item, index) => {
        if (index < 10) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });

    // Accordion fonksiyonu - FAQ öğelerine tıklama işlevi
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Diğer tüm öğeleri kapat
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Tıklanan öğeyi aç/kapat
            item.classList.toggle('active');
        });
    });

    // Arama fonksiyonu
    function searchFaqs() {
        const searchTerm = faqSearch.value.toLowerCase().trim();
        let matchCount = 0;

        if (searchTerm === '') {
            // Arama terimi yoksa, kategoriye göre filtrele
            resetSearch();
            filterByCategory(activeCategory);
            return;
        }

        // Tüm soruları gez ve arama terimiyle eşleşenleri göster
        allFaqItems.forEach(item => {
            const question = item.querySelector('h3').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
            const category = item.getAttribute('data-category');

            // Eşleşme kontrolü
            const matchesSearch = question.includes(searchTerm) || answer.includes(searchTerm);
            const matchesCategory = activeCategory === 'all' || category === activeCategory;

            if (matchesSearch && matchesCategory) {
                item.classList.remove('hidden');
                matchCount++;
            } else {
                item.classList.add('hidden');
            }
        });

        // Sonuç mesajını göster/gizle
        if (matchCount === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }

    // Arama kutusuna girilen değeri dinle
    faqSearch.addEventListener('input', searchFaqs);

    // Arama butonu tıklama olayı
    searchBtn.addEventListener('click', searchFaqs);

    // Enter tuşu ile arama
    faqSearch.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchFaqs();
        }
    });

    // Kategori filtresi
    function filterByCategory(category) {
        activeCategory = category;
        let visibleCount = 0;

        // Tüm kategori butonlarından aktif sınıfını kaldır
        categoryBtns.forEach(btn => {
            btn.classList.remove('active');
        });

        // Tıklanan kategori butonuna aktif sınıfı ekle
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Arama terimi varsa, arama sonuçlarını koru
        const searchTerm = faqSearch.value.toLowerCase().trim();
        if (searchTerm !== '') {
            searchFaqs();
            return;
        }

        // Kategori filtreleme
        allFaqItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');

            if (category === 'all' || itemCategory === category) {
                // İlk 10 öğeyi göster, diğerlerini gizle (arama yapmadığımız sürece)
                if (visibleCount < 10 && !item.classList.contains('hidden-by-default')) {
                    item.classList.remove('hidden');
                    visibleCount++;
                } else {
                    item.classList.add('hidden');
                }
            } else {
                item.classList.add('hidden');
            }
        });

        // Sonuç mesajını gizle
        noResults.classList.add('hidden');
    }

    // Kategori butonlarına tıklama olayları ekle
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const category = this.getAttribute('data-category');
            filterByCategory(category);
        });
    });

    // Aramayı sıfırla ve varsayılan görünümü göster
    function resetSearch() {
        let visibleCount = 0;

        allFaqItems.forEach(item => {
            if (visibleCount < 10 && !item.classList.contains('hidden-by-default')) {
                item.classList.remove('hidden');
                visibleCount++;
            } else {
                item.classList.add('hidden');
            }
        });

        noResults.classList.add('hidden');
    }

    // Arama alanı temizleme
    document.addEventListener('click', function (e) {
        if (e.target !== faqSearch && e.target !== searchBtn && faqSearch.value !== '') {
            // Tıklama arama kutusu veya butonu dışında ise ve arama kutusu boş değilse
            const isClickInsideSearchContainer = document.querySelector('.search-container').contains(e.target);

            if (!isClickInsideSearchContainer) {
                faqSearch.value = '';
                resetSearch();
                filterByCategory(activeCategory);
            }
        }
    });

    // İçeriği sayfa yüklendiğinde animasyonla göster
    setTimeout(() => {
        document.querySelectorAll('.support-hero, .faq-section, .contact-section').forEach(section => {
            section.classList.add('fade-in');
        });
    }, 100);
}); 