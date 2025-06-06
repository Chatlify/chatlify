# Chatlify

Chatlify, modern ve kullanıcı dostu bir iletişim platformudur. Sesli görüşme, görüntülü görüşme ve anlık mesajlaşma özellikleriyle kullanıcılarına kesintisiz bir iletişim deneyimi sunar.

## Canlı Demo

Uygulamayı görmek için lütfen aşağıdaki bağlantıyı ziyaret edin:
[Chatlify Web Sayfası](https://chatlify-demo.netlify.app)

## Özellikler

- Yüksek kaliteli sesli ve görüntülü görüşme
- Anlık mesajlaşma
- Özelleştirilebilir topluluklar
- Dosya paylaşımı
- Ekran paylaşımı
- Çoklu platform desteği (Windows, macOS, Linux, iOS, Android)

## Sayfalar

- Ana Sayfa
- Destek Sayfası
- İndirme Sayfası
- Topluluk Sayfası (Geliştirme aşamasında)

## Geliştirme

Bu proje sadece HTML, CSS ve JavaScript kullanılarak geliştirilmiştir. Framework kullanılmamıştır.

```
git clone https://github.com/kullaniciadi/chatlify.git
cd chatlify
```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

# Chatlify Güvenlik İyileştirmeleri

Bu repoda, Chatlify projesinde tespit edilen önemli güvenlik açıklarını gidermek için yapılan değişiklikleri içerir.

## Yapılan Güvenlik İyileştirmeleri

### 1. API Anahtarlarını Güvenli Hale Getirme

- Tüm API anahtarları (Supabase, Cloudinary, Tenor) `.env` dosyasına taşındı
- Hassas bilgileri içeren `.env` dosyası `.gitignore` ile versiyon kontrolünden çıkarıldı
- API anahtarları için örnek bir `.env.example` dosyası oluşturuldu

### 2. Kimlik Doğrulama Güvenliği

- `auth.js` dosyası tamamen yenilendi, güvenli kimlik doğrulama pratikleri eklendi
- Başarısız giriş denemeleri için hız sınırlama mekanizması eklendi
- Oturum süresini kontrol eden mekanizmalar eklendi
- Otomatik çıkış mekanizması eklendi
- JWT token güvenliği arttırıldı

### 3. XSS (Cross-Site Scripting) Koruması

- `contact.js` ve diğer kullanıcı girdisi işleyen dosyalar için sanitizasyon eklendi
- Kullanıcı girdileri DOM'a eklenmeden önce temizleniyor
- HTML özel karakterlerini escape eden fonksiyonlar eklendi

### 4. CSRF (Cross-Site Request Forgery) Koruması

- `settings.js` ve `shop.js` dosyalarına CSRF token koruması eklendi
- Form gönderimlerinde CSRF token doğrulaması yapılıyor
- Güvenli random token oluşturma mekanizması eklendi

### 5. Güvenli Ödeme İşlemleri

- `shop.js` dosyasında ödeme işlemleri güvenli hale getirildi
- CSRF token ile form doğrulaması eklendi
- Kullanıcı girdileri temizlendi
- Sepet bilgileri veritabanında güvenli şekilde saklanıyor

### 6. Şifre Güvenliği

- Şifre politikaları güçlendirildi (minimum 8 karakter, karma karakterler)
- Şifre gücü kontrolü geliştirildi
- Şifre sıfırlama işlemi güvenli hale getirildi

## Kurulum ve Kullanım

1. Repoyu klonlayın:
```
git clone https://github.com/kullaniciadi/chatlify.git
```

2. `.env.example` dosyasını `.env` olarak kopyalayın:
```
cp .env.example .env
```

3. `.env` dosyasını kendi API anahtarlarınızla güncelleyin:
```
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
CLOUDINARY_URL=https://api.cloudinary.com/v1_1/your-cloud-name/image/upload
CLOUDINARY_UPLOAD_PRESET=your-upload-preset
TENOR_API_KEY=your-tenor-api-key
```

4. Uygulamayı başlatın:
```
npm start
```

## Notlar

- API anahtarlarını hiçbir zaman direkt olarak istemci tarafı koduna eklemeyin
- Gerçek uygulamada, API isteklerini bir backend hizmeti üzerinden yapmalısınız
- Tüm güvenlik açıkları giderilmiş olsa da, projeyi düzenli olarak güvenlik testlerinden geçirin

## Katkıda Bulunma

Güvenlik açığı bildirimleri veya iyileştirme önerileri için lütfen issue açın veya pull request gönderin.

## Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.
