import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase Proje Bilgileri
// API anahtarları environment variables'dan alınır veya fallback değerleri kullanır
const supabaseUrl = process.env.SUPABASE_URL || null;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || null;

// Eğer API anahtarları bulunamazsa ve development ortamı değilse hata ver
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase ayarları bulunamadı! Lütfen .env dosyanızı kontrol edin.');
    throw new Error('Supabase API anahtarları eksik. Uygulama başlatılamıyor.');
}

// Supabase istemcisini oluştur ve dışa aktar
export const supabase = createClient(supabaseUrl, supabaseAnonKey) 