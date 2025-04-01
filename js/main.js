import { createClient } from '@supabase/supabase-js';

document.addEventListener('DOMContentLoaded', () => {
    // Supabase client initialization
    const supabaseUrl = 'https://omyoobepjyyyvemovyim.supabase.coL'; // Replace with your Supabase project URL
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9teW9vYmVwanl5eXZlbW92eWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxNjIyNDksImV4cCI6MjA1MDczODI0OX0.-aNn51tjlgKLE9GssA0H4WvuCTYS3SMWIsJ4pz-PxqQ'; // Replace with your Supabase anon key
    const supabase = createClient(supabaseUrl, supabaseKey);
    window.supabase = supabase; // Make it globally accessible for debugging

    // Partikül arkaplan efekti için canvas oluştur
    const body = document.querySelector('body');
    const canvas = document.createElement('canvas');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-2';

    body.appendChild(canvas);

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
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(Math.random() * 50 + 50)}, ${Math.floor(Math.random() * 200 + 55)}, ${Math.random() * 0.2 + 0.1})`;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width || this.x < 0) {
                this.speedX = -this.speedX;
            }

            if (this.y > canvas.height || this.y < 0) {
                this.speedY = -this.speedY;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Partikül dizisi oluştur
    const particles = [];
    const particleCount = Math.floor(window.innerWidth / 15); // Ekran genişliğine göre partikül sayısı

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

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
        const maxDistance = 100;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(106, 17, 203, ${0.2 - distance / maxDistance})`;
                    ctx.lineWidth = 0.2;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animasyonu başlat
    animate();

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

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobil menü
    const createMobileMenu = () => {
        if (window.innerWidth <= 992 && !document.querySelector('.mobile-menu-btn')) {
            const nav = document.querySelector('nav');
            const mobileBtn = document.createElement('div');
            mobileBtn.classList.add('mobile-menu-btn');
            mobileBtn.innerHTML = `<i class="fas fa-bars"></i>`;

            const mobileMenu = document.createElement('div');
            mobileMenu.classList.add('mobile-menu');

            const navLinksClone = document.querySelector('.nav-links').cloneNode(true);
            const navButtonsClone = document.querySelector('.nav-buttons').cloneNode(true);

            mobileMenu.appendChild(navLinksClone);
            mobileMenu.appendChild(navButtonsClone);

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

    window.addEventListener('resize', () => {
        // Mobil menü oluştur
        createMobileMenu();
    });

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

    // Sayfa yükleme animasyonu
    const content = document.querySelector('main');
    content.classList.add('loaded');
});
