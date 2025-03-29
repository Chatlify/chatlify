// Particle Arka Plan Efekti
let canvas;
let ctx;
let particlesArray = [];
let maxParticles = 100;

// Sayfa Yükleme
document.addEventListener('DOMContentLoaded', function () {
    // Canvas Ayarları
    setupCanvas();

    // Mobil Menü Ayarları
    setupMobileMenu();

    // Hero Bölümünü Yükle
    const hero = document.querySelector('.hero');
    if (hero) {
        setTimeout(() => {
            hero.classList.add('loaded');
        }, 100);
    }

    // Tüm sayfaları için yükleme animasyonu
    const loadingElements = document.querySelectorAll('.loading-hidden');
    loadingElements.forEach(element => {
        setTimeout(() => {
            element.classList.remove('loading-hidden');
            element.classList.add('loading-visible');
        }, 300);
    });

    // Scroll Animasyonları
    setupScrollAnimations();

    // Resimleri Lazy Load etme
    setupLazyLoading();

    // İletişim Sayfası İçin
    initContactPage();
});

// Particle Arkaplan Efekti Ayarları
function setupCanvas() {
    canvas = document.getElementById('particles-canvas');

    if (!canvas) {
        const particleBackground = document.querySelector('.particle-background');
        if (!particleBackground) return;

        canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        particleBackground.appendChild(canvas);
    }

    ctx = canvas.getContext('2d');

    resizeCanvas();
    initParticles();

    // Animasyon Başlat
    animateParticles();

    // Pencere Boyutu Değişince Yeniden Ölçekleme
    window.addEventListener('resize', function () {
        resizeCanvas();
        initParticles();
    });
}

// Canvas Ölçeklendirme
function resizeCanvas() {
    if (!canvas) return;

    const particleBackground = canvas.parentElement;
    canvas.width = particleBackground.offsetWidth;
    canvas.height = particleBackground.offsetHeight;

    // Ekran genişliğine göre parçacık sayısını ayarla
    if (window.innerWidth < 768) {
        maxParticles = 50;
    } else if (window.innerWidth < 1200) {
        maxParticles = 75;
    } else {
        maxParticles = 100;
    }
}

// Particle Sınıfı
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) {
            this.x = 0;
        } else if (this.x < 0) {
            this.x = canvas.width;
        }

        if (this.y > canvas.height) {
            this.y = 0;
        } else if (this.y < 0) {
            this.y = canvas.height;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Parçacıkları Başlat
function initParticles() {
    particlesArray = [];
    for (let i = 0; i < maxParticles; i++) {
        particlesArray.push(new Particle());
    }
}

// Parçacıkları Animasyon ile Hareket Ettir
function animateParticles() {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parçacıkları güncelle ve çiz
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }

    // Parçacıkları bağla
    connectParticles();

    requestAnimationFrame(animateParticles);
}

// Birbirine yakın parçacıkları çizgi ile bağla
function connectParticles() {
    const maxDistance = canvas.width > 768 ? 100 : 80;

    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            const dx = particlesArray[a].x - particlesArray[b].x;
            const dy = particlesArray[a].y - particlesArray[b].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
                const opacity = 1 - (distance / maxDistance);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// Mobil Menü Kurulumu
function setupMobileMenu() {
    // Mobil menü butonunu kontrol et, yoksa oluştur
    let mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    let mobileMenu = document.querySelector('.mobile-menu');
    let menuOverlay = document.querySelector('.menu-overlay');

    if (!mobileMenuBtn) {
        mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        const header = document.querySelector('.header');
        if (header) {
            const logo = header.querySelector('.logo');
            if (logo) {
                header.insertBefore(mobileMenuBtn, logo.nextSibling);
            } else {
                header.appendChild(mobileMenuBtn);
            }
        }
    }

    // Mobil menü overlay'i oluştur (Yoksa)
    if (!menuOverlay) {
        menuOverlay = document.createElement('div');
        menuOverlay.className = 'menu-overlay';
        document.body.appendChild(menuOverlay);
    }

    // Mobil menüyü oluştur veya düzenle (Yoksa)
    if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';

        // Nav bağlantılarını kopyala
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const mobileNavLinks = navLinks.cloneNode(true);
            mobileMenu.appendChild(mobileNavLinks);
        }

        // Nav butonlarını kopyala
        const navBtns = document.querySelector('.nav-btns');
        if (navBtns) {
            const mobileNavBtns = navBtns.cloneNode(true);
            mobileNavBtns.classList.add('nav-btns');
            mobileMenu.appendChild(mobileNavBtns);
        }

        document.body.appendChild(mobileMenu);
    }

    // Mobil menü toggle
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    menuOverlay.addEventListener('click', closeMobileMenu);

    // Swipe ile menüyü kapatma
    let touchStartX;
    let touchEndX;

    mobileMenu.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    });

    mobileMenu.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    // Sayfanın herhangi bir yerine dokunma ile menüyü kapatma
    document.addEventListener('touchstart', function (e) {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !mobileMenuBtn.contains(e.target)) {
            closeMobileMenu();
        }
    });

    function handleSwipe() {
        if (touchStartX - touchEndX > 70) { // Sağdan sola swipe
            closeMobileMenu();
        }
    }

    function toggleMobileMenu() {
        mobileMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
}

// Scroll Animasyonları
function setupScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
            }
        });
    }, {
        threshold: 0.1
    });

    elements.forEach(element => {
        observer.observe(element);
    });

    // Cihaz Hover Animasyonları
    const cards = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card');

    cards.forEach(card => {
        if (window.matchMedia('(hover: hover)').matches) {
            card.addEventListener('mouseenter', () => {
                card.classList.add('hover');
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('hover');
            });
        }
    });
}

// Lazy Loading
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('.lazy-image');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-image');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(image => {
            imageObserver.observe(image);
        });
    } else {
        // Intersection Observer desteği olmayan tarayıcılar için fallback
        let lazyImages = document.querySelectorAll('.lazy-image');

        function lazyLoad() {
            lazyImages.forEach(img => {
                if (isInViewport(img)) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-image');
                }
            });

            // Tüm lazy resimleri yüklenince dinlemeyi durdur
            if (lazyImages.length === 0) {
                document.removeEventListener('scroll', lazyLoad);
                window.removeEventListener('resize', lazyLoad);
                window.removeEventListener('orientationChange', lazyLoad);
            }
        }

        // Helper fonksiyon - görünür alanda mı?
        function isInViewport(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.bottom >= 0 &&
                rect.right >= 0 &&
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.left <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }

        document.addEventListener('scroll', lazyLoad);
        window.addEventListener('resize', lazyLoad);
        window.addEventListener('orientationChange', lazyLoad);
    }
}

// İletişim Sayfası İçin
function initContactPage() {
    const contactHero = document.querySelector('.contact-hero');
    if (contactHero) {
        setTimeout(() => {
            contactHero.classList.add('loaded');
        }, 100);

        // İletişim Bilgi Kartlarını Canlandırma
        const infoCards = document.querySelectorAll('.info-card');
        infoCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('appear');
            }, 300 + (index * 150));
        });
    }

    // İletişim Formu
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Form validation
            let isValid = true;
            const inputs = contactForm.querySelectorAll('input, textarea, select');

            inputs.forEach(input => {
                const formGroup = input.closest('.form-group');
                if (input.hasAttribute('required') && !input.value.trim()) {
                    isValid = false;
                    formGroup.classList.add('error');
                    const errorMessage = formGroup.querySelector('.error-message');
                    if (errorMessage) {
                        errorMessage.textContent = 'Bu alan zorunludur.';
                    }
                } else if (input.type === 'email' && input.value.trim() && !validateEmail(input.value)) {
                    isValid = false;
                    formGroup.classList.add('error');
                    const errorMessage = formGroup.querySelector('.error-message');
                    if (errorMessage) {
                        errorMessage.textContent = 'Geçerli bir e-posta adresi giriniz.';
                    }
                } else {
                    formGroup.classList.remove('error');
                }
            });

            if (isValid) {
                const submitBtn = contactForm.querySelector('.submit-btn');
                submitBtn.classList.add('loading');

                // Form gönderimi simülasyonu
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    const successMessage = document.querySelector('.success-message');
                    if (successMessage) {
                        contactForm.style.display = 'none';
                        successMessage.classList.add('show');
                    }
                }, 1500);
            }
        });

        // Validation fonksiyonu
        function validateEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }

        // Input değişikliklerinde error durumunu sıfırla
        const inputs = contactForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', function () {
                const formGroup = this.closest('.form-group');
                formGroup.classList.remove('error');
            });
        });
    }
}
