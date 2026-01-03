-- Şikayet Tipleri Ekleme Scripti
-- PostgreSQL veritabanı: ogrencisikayet

-- Mevcut verileri temizle (opsiyonel - sadece test için)
-- TRUNCATE TABLE complaint_type CASCADE;

-- Şikayet tiplerini ekle
-- PostgreSQL'de kolon isimleri tırnak içinde case-sensitive olabilir
INSERT INTO complaint_type ("typeName", description, "requiresCourse") VALUES
('Ders İçeriği', 'Ders içeriği, müfredat veya ders materyalleri ile ilgili şikayetler', true),
('Öğretim Üyesi', 'Öğretim üyesi davranışı, ders anlatımı veya iletişim ile ilgili şikayetler', true),
('Sınav ve Değerlendirme', 'Sınav soruları, değerlendirme kriterleri veya notlandırma ile ilgili şikayetler', true),
('Ders Programı', 'Ders saatleri, çakışmalar veya program düzenlemeleri ile ilgili şikayetler', true),
('Kampüs Altyapısı', 'Bina, sınıf, laboratuvar veya diğer fiziksel altyapı ile ilgili şikayetler', false),
('Yemekhane', 'Yemekhane hizmetleri, yemek kalitesi veya fiyatları ile ilgili şikayetler', false),
('Kütüphane', 'Kütüphane hizmetleri, kaynak erişimi veya çalışma alanları ile ilgili şikayetler', false),
('Burs ve Finansal', 'Burs başvuruları, ödeme sorunları veya finansal destek ile ilgili şikayetler', false),
('İdari İşler', 'Kayıt, belge işlemleri veya idari süreçler ile ilgili şikayetler', false),
('Güvenlik', 'Kampüs güvenliği, acil durum prosedürleri veya güvenlik önlemleri ile ilgili şikayetler', false),
('Ulaşım', 'Kampüs ulaşımı, servis hizmetleri veya park alanları ile ilgili şikayetler', false),
('Teknoloji ve İnternet', 'Bilgisayar laboratuvarları, internet bağlantısı veya teknoloji altyapısı ile ilgili şikayetler', false),
('Sosyal Faaliyetler', 'Öğrenci kulüpleri, etkinlikler veya sosyal alanlar ile ilgili şikayetler', false),
('Diğer', 'Yukarıdaki kategorilere uymayan diğer şikayetler', false)
ON CONFLICT DO NOTHING;

-- Eklenen verileri kontrol et
SELECT * FROM complaint_type ORDER BY "complaintTypeId";

