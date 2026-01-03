-- Veritabanını sıfırlamak için bu scripti çalıştırın
-- DİKKAT: Bu işlem tüm verileri silecektir!

-- Mevcut bağlantıları sonlandır
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'ogrencisikayet' AND pid <> pg_backend_pid();

-- Veritabanını sil
DROP DATABASE IF EXISTS ogrencisikayet;

-- Veritabanını yeniden oluştur
CREATE DATABASE ogrencisikayet;

-- Kullanıcıya yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE ogrencisikayet TO yigit;

