document.addEventListener('DOMContentLoaded', () => {
    // Canvas Ayarları
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');

    // Yükleme Elementleri
    const loadingBarFill = document.getElementById('loadingBarFill');
    const loadingPercent = document.getElementById('loadingPercent');
    const loadingStatus = document.getElementById('loadingStatus');
    const quoteText = document.getElementById('quoteText');

    // Yükleme Ayarları
    const loadingConfig = {
        totalDuration: 5000, // ms cinsinden toplam süre
        updateInterval: 30, // ms cinsinden güncelleme aralığı
        currentStep: 0,
        totalSteps: 0
    };

    // Yükleme Aşamaları
    const loadingPhases = [
        { progress: 0, text: "Bağlantı kuruluyor..." },
        { progress: 20, text: "Arayüz hazırlanıyor..." },
        { progress: 40, text: "Kullanıcı verileri alınıyor..." },
        { progress: 60, text: "Hizmetler başlatılıyor..." },
        { progress: 80, text: "Son dokunuşlar yapılıyor..." },
        { progress: 100, text: "Chatlify'a Hoş Geldiniz!" }
    ];

    // İlham Verici Alıntılar
    const inspiringQuotes = [
        "İletişim, hayatı anlamlı kılan en önemli şeydir.",
        "Fikirlerinizi paylaşın, dünyayı değiştirin.",
        "Gerçek bağlantılar kurarak dünyayı dönüştürün.",
        "Yeni insanlarla tanışmak, yeni dünyalar keşfetmektir.",
        "İyi bir konuşma, iki zihin arasında dans gibidir.",
        "Chatlify ile sınırları aşan iletişimin tadını çıkarın.",
        "Başarı, doğru insanlarla kurduğunuz bağlantılarla başlar.",
        "Kelimeler güçlüdür, onları Chatlify ile paylaşın.",
        "Mesajınızı tüm dünyaya ulaştırın.",
        "İletişim kurma şekliniz, ilişkilerinizi belirler.",
        "Etkili iletişim, dinlemekle başlar."
    ];

    // Rastgele bir alıntı seç
    const randomQuote = inspiringQuotes[Math.floor(Math.random() * inspiringQuotes.length)];
    if (quoteText) quoteText.textContent = randomQuote;

    // Canvas Boyutlandırma
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // İlk yükleme ve pencere yeniden boyutlandırma olayları
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Partikül Sınıfı
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            // Rastgele pozisyon
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;

            // Boyut
            this.size = Math.random() * 5 + 1;

            // Hız
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;

            // Opaklık ve renk
            this.alpha = Math.random() * 0.5 + 0.2;
            this.color = this.getRandomColor();

            // Parlaklık efekti için değişkenler
            this.brightness = 0;
            this.brightnessFactor = Math.random() * 0.02 + 0.005;
            this.brightDirection = 1;
        }

        getRandomColor() {
            // Ana renk şemaları
            const colorSchemes = [
                { h: 260, s: 80, l: 65 }, // Mor
                { h: 230, s: 70, l: 60 }, // Mavi
                { h: 290, s: 60, l: 70 }  // Eflatun
            ];

            // Rastgele bir renk şeması seç
            const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

            // Renk varyasyonu ekle
            const hue = scheme.h + Math.random() * 20 - 10;
            const saturation = scheme.s + Math.random() * 20 - 10;
            const lightness = scheme.l + Math.random() * 20 - 10;

            return `hsla(${hue}, ${saturation}%, ${lightness}%, ${this.alpha})`;
        }

        update() {
            // Pozisyonu güncelle
            this.x += this.speedX;
            this.y += this.speedY;

            // Ekran sınırları kontrolü
            if (this.x > canvas.width || this.x < 0) {
                this.speedX = -this.speedX;
            }

            if (this.y > canvas.height || this.y < 0) {
                this.speedY = -this.speedY;
            }

            // Parlaklık efekti
            this.brightness += this.brightDirection * this.brightnessFactor;

            if (this.brightness > 0.3) {
                this.brightDirection = -1;
            } else if (this.brightness < 0) {
                this.brightDirection = 1;
            }
        }

        draw() {
            ctx.save();

            // Parlaklık efekti
            ctx.shadowBlur = 15 + this.brightness * 10;
            ctx.shadowColor = this.color;

            // Partikül
            ctx.globalAlpha = this.alpha + this.brightness;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // Bağlantı Sınıfı
    class Connection {
        constructor(p1, p2, distance) {
            this.p1 = p1;
            this.p2 = p2;
            this.distance = distance;
            this.opacity = 1 - (distance / 150);
        }

        draw() {
            ctx.save();

            const gradient = ctx.createLinearGradient(this.p1.x, this.p1.y, this.p2.x, this.p2.y);
            gradient.addColorStop(0, `hsla(260, 80%, 65%, ${this.opacity * 0.5})`);
            gradient.addColorStop(1, `hsla(230, 70%, 60%, ${this.opacity * 0.5})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.opacity * 2;
            ctx.beginPath();
            ctx.moveTo(this.p1.x, this.p1.y);
            ctx.lineTo(this.p2.x, this.p2.y);
            ctx.stroke();

            ctx.restore();
        }
    }

    // Partikül Yöneticisi
    class ParticleManager {
        constructor() {
            this.particles = [];
            this.connections = [];
            this.initParticles();
        }

        initParticles() {
            // Ekran boyutuna göre uygun sayıda partikül oluştur
            const density = 0.0001; // partikül/piksel²
            const areaPixels = canvas.width * canvas.height;
            const particleCount = Math.min(Math.floor(areaPixels * density), 100);

            for (let i = 0; i < particleCount; i++) {
                this.particles.push(new Particle());
            }
        }

        update() {
            this.connections = []; // Bağlantıları temizle

            // Partikülleri güncelle
            this.particles.forEach(particle => {
                particle.update();
            });

            // Bağlantıları oluştur
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        this.connections.push(new Connection(
                            this.particles[i],
                            this.particles[j],
                            distance
                        ));
                    }
                }
            }
        }

        draw() {
            // Arkaplanı temizle
            ctx.fillStyle = 'rgba(15, 15, 26, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Önce bağlantıları çiz
            this.connections.forEach(connection => {
                connection.draw();
            });

            // Sonra partikülleri çiz
            this.particles.forEach(particle => {
                particle.draw();
            });
        }

        resize() {
            // Ekran yeniden boyutlandırıldığında partikülleri sıfırla
            this.particles = [];
            this.initParticles();
        }
    }

    // Partikül sistemini başlat
    const particleManager = new ParticleManager();

    // Yükleme simülasyonu
    function initLoading() {
        loadingConfig.totalSteps = loadingConfig.totalDuration / loadingConfig.updateInterval;

        // Bir önceki durumdan yükleme aşamasını belirle
        function getPhaseText(progress) {
            for (let i = loadingPhases.length - 1; i >= 0; i--) {
                if (progress >= loadingPhases[i].progress) {
                    return loadingPhases[i].text;
                }
            }
            return loadingPhases[0].text;
        }

        // Yükleme aralığı
        const loadingInterval = setInterval(() => {
            loadingConfig.currentStep++;

            // Yükleme yüzdesini hesapla (easing fonksiyonu ile daha doğal görünüm)
            const linearProgress = loadingConfig.currentStep / loadingConfig.totalSteps;
            const easedProgress = 1 - Math.pow(1 - linearProgress, 3); // Cubic easing
            const progress = Math.min(100, Math.floor(easedProgress * 100));

            // UI güncelleme
            if (loadingBarFill) loadingBarFill.style.width = `${progress}%`;
            if (loadingPercent) loadingPercent.textContent = `${progress}%`;

            // Yükleme metnini güncelle
            if (loadingStatus) {
                const phaseText = getPhaseText(progress);
                if (loadingStatus.textContent !== phaseText) {
                    // Metin değişiminde animasyon
                    loadingStatus.style.opacity = '0';

                    setTimeout(() => {
                        loadingStatus.textContent = phaseText;
                        loadingStatus.style.opacity = '1';
                    }, 200);
                }
            }

            // Yükleme tamamlandıysa
            if (progress >= 100) {
                clearInterval(loadingInterval);

                // Ana sayfaya yönlendir
                setTimeout(() => {
                    try {
                        window.location.href = 'index.html';
                    } catch (error) {
                        console.error('Yönlendirme hatası:', error);
                    }
                }, 1000);
            }
        }, loadingConfig.updateInterval);
    }

    // Animasyon döngüsü
    function animate() {
        particleManager.update();
        particleManager.draw();
        requestAnimationFrame(animate);
    }

    // Resize olay dinleyicisi
    window.addEventListener('resize', () => {
        resizeCanvas();
        particleManager.resize();
    });

    // Animasyonu ve yüklemeyi başlat
    animate();
    initLoading();
}); 