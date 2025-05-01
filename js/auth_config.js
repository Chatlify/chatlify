import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase Proje Bilgileri
// DİKKAT: Bu bilgileri doğrudan koda yazmak yerine environment variable kullanmak daha güvenlidir.
// Ancak tarayıcı ortamında process.env doğrudan çalışmaz.
const supabaseUrl = "https://omyoobepjyyyvemovyim.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9teW9vYmVwanl5eXZlbW92eWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxNjIyNDksImV4cCI6MjA1MDczODI0OX0.-aNn51tjlgKLE9GssA0H4WvuCTYS3SMWIsJ4pz-PxqQ"; // GERÇEK ANON KEY GİRİLDİ

// Eğer API anahtarları boşsa hata ver (İçerik kontrolü kaldırıldı)
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL veya Anon Key eksik! Lütfen js/auth_config.js dosyasını kontrol edin.');
    // Geliştirme kolaylığı için hatayı fırlatmak yerine sadece konsola yazdırabiliriz.
    // throw new Error('Supabase API anahtarları eksik. Uygulama başlatılamıyor.');
    alert("Supabase bağlantı bilgileri eksik. Lütfen yönetici ile iletişime geçin.");
}

// Supabase istemcisini oluşturmadan önce değerleri logla (Bu logları kaldırabiliriz artık)
// console.log("Supabase URL (auth_config):", supabaseUrl);
// console.log("Supabase Anon Key (auth_config):", supabaseAnonKey ? "Anahtar mevcut" : "Anahtar YOK"); 

// Supabase istemcisini oluştur ve dışa aktar
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null; 