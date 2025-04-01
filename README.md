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

## Auth0 Entegrasyonu Kurulumu

Projede kullanılan Auth0 entegrasyonunu kurmak için aşağıdaki adımları izleyin:

1. [Auth0 web sitesine](https://auth0.com/) giderek bir hesap oluşturun veya giriş yapın.
2. Dashboard üzerinden yeni bir uygulama oluşturun (Application > Create Application).
3. Uygulamanın türü olarak "Single Page Web Application" seçin.
4. "Settings" sekmesine gidin ve aşağıdaki ayarları yapın:
   - Allowed Callback URLs: `http://localhost:8000/dashboard.html`, `https://your-site-domain.com/dashboard.html`
   - Allowed Logout URLs: `http://localhost:8000/index.html`, `https://your-site-domain.com/index.html`
   - Allowed Web Origins: `http://localhost:8000`, `https://your-site-domain.com`
5. "Domain" ve "Client ID" bilgilerini kopyalayın.
6. `js/auth.js` dosyasını açın ve aşağıdaki bilgileri güncelleyin:
   ```javascript
   auth0 = await createAuth0Client({
     domain: 'YOUR_AUTH0_DOMAIN', // Buraya kopyaladığınız domain bilgisini yazın
     client_id: 'YOUR_AUTH0_CLIENT_ID', // Buraya kopyaladığınız client ID bilgisini yazın
     redirect_uri: window.location.origin + '/dashboard.html',
     cacheLocation: 'localstorage'
   });
   ```
7. Auth0 Dashboard'dan "Connections" menüsüne gidin ve sosyal giriş seçeneklerini (Google, Facebook, GitHub, vs.) yapılandırın.

Artık Auth0 entegrasyonu hazır! Kullanıcılar login ve register sayfalarından giriş yapabilir veya kayıt olabilirler.
