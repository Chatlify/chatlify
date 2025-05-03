document.addEventListener('DOMContentLoaded', () => {
    // Partikül arkaplan efekti için canvas oluştur
    const body = document.querySelector('body');
    const canvas = document.createElement('canvas');

    // Ensure body exists before appending canvas
    if (body) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        // Set z-index lower than main content but potentially higher than absolute background elements if any
        canvas.style.zIndex = '-1';
        // Optional: Add a class for easier targeting if needed
        canvas.classList.add('particle-canvas');
        body.appendChild(canvas);
    }

    // Proceed with particle logic only if canvas exists
    if (canvas && canvas.parentElement) {
        const ctx = canvas.getContext('2d');

        // Pencere boyutu değiştiğinde canvas boyutunu güncelle
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Partikül sınıfı
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.5; // Slightly smaller particles
                this.speedX = Math.random() * 0.4 - 0.2; // Slightly slower speed
                this.speedY = Math.random() * 0.4 - 0.2;
                // Adjust color for better visibility on dark background
                this.color = `rgba(180, 180, 220, ${Math.random() * 0.2 + 0.05})`;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x < 0 || this.x > canvas.width) {
                    this.speedX *= -1;
                }
                if (this.y < 0 || this.y > canvas.height) {
                    this.speedY *= -1;
                }
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Partikül dizisi oluştur
        let particles = [];
        function initParticles() {
            particles = [];
            const particleCount = Math.floor(canvas.width * canvas.height / 15000); // Adjust density based on area
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }
        initParticles(); // Initial creation
        window.addEventListener('resize', initParticles); // Re-init on resize for density


        // Animasyon fonksiyonu
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Partikülleri çiz ve güncelle
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Partiküller arasında bağlantı çiz
            connectParticles();

            requestAnimationFrame(animate);
        }

        // Partiküller arasında bağlantı çizme fonksiyonu
        function connectParticles() {
            const maxDistance = 80; // Reduced distance for fewer lines
            ctx.strokeStyle = 'rgba(180, 180, 220, 0.08)'; // Lighter, less opaque lines
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) { // Start j from i + 1 to avoid duplicate checks
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = 1 - (distance / maxDistance);
                        ctx.globalAlpha = opacity * 0.5; // Make lines fade based on distance
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                        ctx.globalAlpha = 1.0; // Reset global alpha
                    }
                }
            }
        }

        // Animasyonu başlat
        animate();
    }

    // Scroll animasyonları
    const scrollElements = document.querySelectorAll('.feature-item, .stat-item, .testimonial');

    const elementInView = (el, percentageScroll = 100) => {
        const elementTop = el.getBoundingClientRect().top;
        const elementHeight = el.getBoundingClientRect().height;

        return (
            elementTop <=
            ((window.innerHeight || document.documentElement.clientHeight) * (percentageScroll / 100))
        );
    };

    const displayScrollElement = (element) => {
        element.classList.add('scrolled');
    };

    const hideScrollElement = (element) => {
        element.classList.remove('scrolled');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 80)) {
                displayScrollElement(el);
            } else {
                hideScrollElement(el);
            }
        });
    };

    // İlk yükleme için ve scroll olayı için çağır
    handleScrollAnimation();
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });

    // Navigasyon menüsü scroll olayı
    const header = document.querySelector('header');

    // Check if header exists before adding scroll event
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Mobil menü
    const createMobileMenu = () => {
        const nav = document.querySelector('nav');
        const body = document.querySelector('body');

        // Check if nav and body exist
        if (!nav || !body) return;

        // Remove existing mobile menu if window resizes above threshold
        const existingMobileBtn = document.querySelector('.mobile-menu-btn');
        const existingMobileMenu = document.querySelector('.mobile-menu');
        if (window.innerWidth > 992) {
            if (existingMobileBtn) existingMobileBtn.remove();
            if (existingMobileMenu) existingMobileMenu.remove();
            return; // Don't create menu if screen is large
        }

        // Create mobile menu only if it doesn't exist
        if (!existingMobileBtn) {
            const mobileBtn = document.createElement('div');
            mobileBtn.classList.add('mobile-menu-btn');
            mobileBtn.innerHTML = `<i class="fas fa-bars"></i>`;

            const mobileMenu = document.createElement('div');
            mobileMenu.classList.add('mobile-menu');

            const navLinks = document.querySelector('.nav-links');
            const navButtons = document.querySelector('.nav-buttons');

            // Clone only if elements exist
            if (navLinks) mobileMenu.appendChild(navLinks.cloneNode(true));
            if (navButtons) mobileMenu.appendChild(navButtons.cloneNode(true));

            nav.appendChild(mobileBtn);
            body.appendChild(mobileMenu);

            mobileBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                mobileBtn.classList.toggle('active');

                if (mobileBtn.classList.contains('active')) {
                    mobileBtn.innerHTML = `<i class="fas fa-times"></i>`;
                } else {
                    mobileBtn.innerHTML = `<i class="fas fa-bars"></i>`;
                }
            });

            // Mobil menüde tıklama sonrası menüyü kapat
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    mobileBtn.classList.remove('active');
                    mobileBtn.innerHTML = `<i class="fas fa-bars"></i>`;
                });
            });
        }
    };

    createMobileMenu();
    window.addEventListener('resize', createMobileMenu); // Call on resize

    // Cihaz animasyonları
    const devices = document.querySelectorAll('.device');
    devices.forEach(device => {
        device.addEventListener('mouseover', () => {
            devices.forEach(d => d.classList.add('hover'));
        });

        device.addEventListener('mouseout', () => {
            devices.forEach(d => d.classList.remove('hover'));
        });
    });

    // Görseller için Lazy Loading
    const lazyLoadImages = () => {
        const lazyImages = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Intersection Observer desteklenmiyor, alternatif yöntem kullan
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    };

    lazyLoadImages();

    // Sayfa yükleme animasyonu (main element check)
    const content = document.querySelector('main');
    if (content) {
        content.classList.add('loaded');
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const siteBody = document.body;

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            siteBody.classList.toggle('mobile-menu-open');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (siteBody.classList.contains('mobile-menu-open') &&
            !e.target.closest('.mobile-menu-toggle') &&
            !e.target.closest('.nav-links') &&
            !e.target.closest('.nav-buttons')) {
            siteBody.classList.remove('mobile-menu-open');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                siteBody.classList.remove('mobile-menu-open');

                // Scroll to target with offset for fixed header
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = targetPosition - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const siteHeader = document.querySelector('header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Add background when scrolled
        if (scrollTop > 50) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }

        // Hide on scroll down, show on scroll up
        if (scrollTop > lastScrollTop && scrollTop > 500) {
            siteHeader.style.transform = 'translateY(-100%)';
        } else {
            siteHeader.style.transform = 'translateY(0)';
        }

        lastScrollTop = scrollTop;
    });

    // Animate elements on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to animate
    const animateElements = document.querySelectorAll('.feature-card, .hero-content, .hero-image, .cta-content');
    animateElements.forEach(element => {
        element.classList.add('animate-element');
        observer.observe(element);
    });

    // Add CSS to handle animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-element {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .header.scrolled {
            background-color: rgba(15, 15, 26, 0.95);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
    `;
    document.head.appendChild(style);
});
