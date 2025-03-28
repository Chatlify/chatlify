document.addEventListener('DOMContentLoaded', () => {
    // Partikül arkaplan efekti için canvas oluştur
    const body = document.querySelector('body');
    const particlesBackground = document.querySelector('.particles-background');
    const canvas = document.createElement('canvas');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';

    particlesBackground.appendChild(canvas);

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
            this.size = Math.random() * 3 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;

            // Mor ve mavi tonları arasında rastgele renk
            const hue = Math.random() * 60 + 240; // 240-300 arası (mavi-mor)
            const sat = Math.random() * 20 + 80; // 80-100% doygunluk
            const light = Math.random() * 20 + 50; // 50-70% aydınlık
            this.color = `hsla(${hue}, ${sat}%, ${light}%, ${Math.random() * 0.3 + 0.2})`;

            this.maxSize = this.size;
            this.angle = Math.random() * 360;
            this.angleSpeed = Math.random() * 0.01 - 0.005;
            this.orbitRadius = Math.random() * 50;
        }

        update() {
            // Partikül hareketini güncelle
            this.x += this.speedX;
            this.y += this.speedY;

            // Sinüs dalgası efekti ile boyut değişimi
            this.size = this.maxSize * (0.8 + Math.sin(Date.now() * 0.001 + this.angle) * 0.2);

            // Ekran sınırlarını kontrol et
            if (this.x > canvas.width || this.x < 0) {
                this.speedX = -this.speedX;
            }

            if (this.y > canvas.height || this.y < 0) {
                this.speedY = -this.speedY;
            }
        }

        draw() {
            // Partikülü çiz (hafif glow efektiyle)
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;

            // Glow efekti
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;

            ctx.fill();
            ctx.restore();
        }
    }

    // Partikül dizisi oluştur - ekran genişliğine göre dinamik sayı
    const particles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 10), 150); // Maksimum 150 partikül

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animasyon fonksiyonu
    function animate() {
        // Her kareyi yarı-transparan temizle (iz bırakma efekti)
        ctx.fillStyle = 'rgba(14, 14, 24, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        const maxDistance = Math.min(150, canvas.width * 0.15); // Ekrana göre dinamik mesafe

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    // Mesafeye göre opaklık ayarla
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    ctx.beginPath();

                    // Gradient çizgi
                    const gradient = ctx.createLinearGradient(
                        particles[i].x, particles[i].y,
                        particles[j].x, particles[j].y
                    );

                    gradient.addColorStop(0, `rgba(106, 17, 203, ${opacity})`);
                    gradient.addColorStop(1, `rgba(37, 117, 252, ${opacity})`);

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animasyonu başlat
    animate();

    // SVG logoyu etkileyecek 3D efekti
    const logo = document.querySelector('.logo');

    if (logo) {
        document.addEventListener('mousemove', (e) => {
            // İmleç pozisyonuna göre perspektif efekti
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const percentX = (mouseX - centerX) / centerX;
            const percentY = (mouseY - centerY) / centerY;

            const maxRotate = 10; // Maksimum dönüş açısı (derece)

            logo.style.transform = `perspective(1000px) rotateY(${percentX * maxRotate}deg) rotateX(${-percentY * maxRotate}deg)`;
        });

        // İmleç çıkınca normal pozisyona dön
        document.addEventListener('mouseleave', () => {
            logo.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
            logo.style.transition = 'transform 0.5s ease';
        });
    }

    // Animasyonlu parçacıklar için rastgele konum değişimi
    const logoParticles = document.querySelectorAll('.particle');

    if (logoParticles.length > 0) {
        logoParticles.forEach((particle, index) => {
            // SVG içindeki parçacıklar için özel animasyon
            setInterval(() => {
                const randomX = (Math.random() * 10 - 5) * (index % 3 + 1);
                const randomY = (Math.random() * 10 - 5) * ((index + 1) % 3 + 1);

                particle.style.transform = `translate(${randomX}px, ${randomY}px)`;
                particle.style.transition = 'transform 3s ease-in-out';
            }, 3000 + index * 500);
        });
    }

    // Dinamik loading metni
    const loadingInfo = document.querySelector('.loading-info');
    if (loadingInfo) {
        const loadingTexts = [
            'Yeni nesil iletişim platformu yükleniyor...',
            'Topluluğa bağlanılıyor...',
            'Güvenli bağlantı kuruluyor...',
            'Neredeyse hazır...'
        ];

        let textIndex = 0;

        // Belirli aralıklarla metni değiştir
        const loadingTextInterval = setInterval(() => {
            textIndex = (textIndex + 1) % loadingTexts.length;

            // Metni değiştirirken fade efekti
            loadingInfo.style.opacity = '0';

            setTimeout(() => {
                loadingInfo.textContent = loadingTexts[textIndex];
                loadingInfo.style.opacity = '1';
            }, 500);

        }, 1500);

        // Ana sayfaya yönlendirirken interval'i temizle
        setTimeout(() => {
            clearInterval(loadingTextInterval);
        }, 3500);
    }
});
