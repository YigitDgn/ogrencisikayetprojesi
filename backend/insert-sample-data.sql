-- Örnek Veri Ekleme Scripti
-- PostgreSQL veritabanı: ogrencisikayet
-- 20 kullanıcılı sistem için örnek veriler

-- pgcrypto extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabloların var olup olmadığını kontrol et
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'department') THEN
    RAISE EXCEPTION 'Tablolar bulunamadı! Lütfen önce TypeORM ile tabloları oluşturun. Backend uygulamasını bir kez çalıştırın (npm run start:dev)';
  END IF;
END $$;

BEGIN;

-- ============================================
-- 1. DEPARTMENTS (Bölümler)
-- ============================================
INSERT INTO "department" ("departmentName", "departmentCode", "facultyName") VALUES
('Bilgisayar Mühendisliği', 'BM', 'Mühendisfalik Fakültesi'),
('Elektrik-Elektronik Mühendisliği', 'EE', 'Mühendislik Fakültesi'),
('Endüstri Mühendisliği', 'EN', 'Mühendislik Fakültesi'),
('İşletme', 'IS', 'İktisadi ve İdari Bilimler Fakültesi')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. COURSES (Dersler)
-- ============================================
-- Bilgisayar Mühendisliği dersleri
INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Veri Yapıları ve Algoritmalar',
  'BM101',
  4,
  'Güz'
FROM "department" d WHERE d."departmentCode" = 'BM';

INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Nesne Yönelimli Programlama',
  'BM102',
  4,
  'Bahar'
FROM "department" d WHERE d."departmentCode" = 'BM';

INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Veritabanı Yönetim Sistemleri',
  'BM201',
  3,
  'Güz'
FROM "department" d WHERE d."departmentCode" = 'BM';

-- Elektrik-Elektronik Mühendisliği dersleri
INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Devre Analizi',
  'EE101',
  4,
  'Güz'
FROM "department" d WHERE d."departmentCode" = 'EE';

INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Elektronik Devreler',
  'EE201',
  3,
  'Bahar'
FROM "department" d WHERE d."departmentCode" = 'EE';

-- Endüstri Mühendisliği dersleri
INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Yöneylem Araştırması',
  'EN101',
  3,
  'Güz'
FROM "department" d WHERE d."departmentCode" = 'EN';

INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Üretim Planlama',
  'EN201',
  3,
  'Bahar'
FROM "department" d WHERE d."departmentCode" = 'EN';

-- İşletme dersleri
INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Genel Muhasebe',
  'IS101',
  3,
  'Güz'
FROM "department" d WHERE d."departmentCode" = 'IS';

INSERT INTO "course" ("departmentId", "courseName", "courseCode", credits, semester)
SELECT 
  d."departmentId",
  'Pazarlama Yönetimi',
  'IS201',
  3,
  'Bahar'
FROM "department" d WHERE d."departmentCode" = 'IS';

-- ============================================
-- 3. USERS (Kullanıcılar) - 20 kullanıcı
-- ============================================

-- 2 Admin
INSERT INTO "users" ("firstName", "lastName", email, password, "roleType", "createdAt")
VALUES 
('Ahmet', 'Yönetici', 'admin1@university.edu', crypt('admin123', gen_salt('bf', 10)), 'admin', NOW() - INTERVAL '30 days'),
('Ayşe', 'Admin', 'admin2@university.edu', crypt('admin123', gen_salt('bf', 10)), 'admin', NOW() - INTERVAL '25 days');

-- 3 Personnel
INSERT INTO "users" ("firstName", "lastName", email, password, "roleType", "phoneNumber", "createdAt")
VALUES 
('Mehmet', 'Personel', 'personel1@university.edu', crypt('personel123', gen_salt('bf', 10)), 'personnel', '05321234567', NOW() - INTERVAL '20 days'),
('Fatma', 'Çalışan', 'personel2@university.edu', crypt('personel123', gen_salt('bf', 10)), 'personnel', '05321234568', NOW() - INTERVAL '18 days'),
('Ali', 'Görevli', 'personel3@university.edu', crypt('personel123', gen_salt('bf', 10)), 'personnel', '05321234569', NOW() - INTERVAL '15 days');

-- 15 Student
INSERT INTO "users" ("firstName", "lastName", email, password, "roleType", "phoneNumber", "createdAt")
VALUES 
('Zeynep', 'Öğrenci', 'ogrenci1@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111111', NOW() - INTERVAL '10 days'),
('Can', 'Kaya', 'ogrenci2@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111112', NOW() - INTERVAL '9 days'),
('Elif', 'Demir', 'ogrenci3@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111113', NOW() - INTERVAL '8 days'),
('Burak', 'Şahin', 'ogrenci4@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111114', NOW() - INTERVAL '7 days'),
('Selin', 'Yılmaz', 'ogrenci5@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111115', NOW() - INTERVAL '6 days'),
('Emre', 'Çelik', 'ogrenci6@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111116', NOW() - INTERVAL '5 days'),
('Derya', 'Arslan', 'ogrenci7@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111117', NOW() - INTERVAL '4 days'),
('Kerem', 'Öztürk', 'ogrenci8@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111118', NOW() - INTERVAL '3 days'),
('İrem', 'Kurt', 'ogrenci9@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111119', NOW() - INTERVAL '2 days'),
('Onur', 'Aydın', 'ogrenci10@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111120', NOW() - INTERVAL '1 days'),
('Gizem', 'Polat', 'ogrenci11@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111121', NOW()),
('Tolga', 'Erdoğan', 'ogrenci12@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111122', NOW()),
('Ceren', 'Akar', 'ogrenci13@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111123', NOW()),
('Barış', 'Yıldız', 'ogrenci14@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111124', NOW()),
('Deniz', 'Koç', 'ogrenci15@university.edu', crypt('ogrenci123', gen_salt('bf', 10)), 'student', '05321111125', NOW());

-- ============================================
-- 4. ADMIN (Admin kayıtları)
-- ============================================
INSERT INTO "admin" ("userId", "adminLevel", permissions)
SELECT "userId", 'admin', NULL
FROM "users"
WHERE "roleType" = 'admin'
ORDER BY "userId";

-- ============================================
-- 5. PERSONNEL (Personel kayıtları)
-- ============================================
INSERT INTO "personnel" ("userId", "employeeNumber", position, "departmentId", "hireDate")
SELECT 
  u."userId",
  'EMP' || u."userId",
  CASE 
    WHEN u."userId" = (SELECT "userId" FROM "users" WHERE email = 'personel1@university.edu') THEN 'Şikayet Uzmanı'
    WHEN u."userId" = (SELECT "userId" FROM "users" WHERE email = 'personel2@university.edu') THEN 'İdari Personel'
    ELSE 'Danışman'
  END,
  d."departmentId",
  u."createdAt"
FROM "users" u
CROSS JOIN (SELECT "departmentId" FROM "department" WHERE "departmentCode" = 'BM' LIMIT 1) d
WHERE u."roleType" = 'personnel'
ORDER BY u."userId"
LIMIT 1;

INSERT INTO "personnel" ("userId", "employeeNumber", position, "departmentId", "hireDate")
SELECT 
  u."userId",
  'EMP' || u."userId",
  'İdari Personel',
  d."departmentId",
  u."createdAt"
FROM "users" u
CROSS JOIN (SELECT "departmentId" FROM "department" WHERE "departmentCode" = 'EE' LIMIT 1) d
WHERE u."roleType" = 'personnel'
ORDER BY u."userId"
OFFSET 1
LIMIT 1;

INSERT INTO "personnel" ("userId", "employeeNumber", position, "departmentId", "hireDate")
SELECT 
  u."userId",
  'EMP' || u."userId",
  'Danışman',
  d."departmentId",
  u."createdAt"
FROM "users" u
CROSS JOIN (SELECT "departmentId" FROM "department" WHERE "departmentCode" = 'EN' LIMIT 1) d
WHERE u."roleType" = 'personnel'
ORDER BY u."userId"
OFFSET 2
LIMIT 1;

-- ============================================
-- 6. STUDENT (Öğrenci kayıtları)
-- ============================================
INSERT INTO "student" ("userId", "studentNumber", "enrollmentYear", "currentYear", "GPA")
SELECT 
  u."userId",
  'STU' || LPAD(u."userId"::text, 4, '0'),
  EXTRACT(YEAR FROM u."createdAt")::int - CASE 
    WHEN u."userId" % 3 = 0 THEN 3
    WHEN u."userId" % 3 = 1 THEN 2
    ELSE 1
  END,
  CASE 
    WHEN u."userId" % 3 = 0 THEN 3
    WHEN u."userId" % 3 = 1 THEN 2
    ELSE 1
  END,
  (RANDOM() * 1.5 + 2.0)::numeric(3,2)
FROM "users" u
WHERE u."roleType" = 'student'
ORDER BY u."userId";

-- ============================================
-- 7. ENROLLMENT (Ders kayıtları)
-- ============================================
-- Her öğrenciye 2-4 ders kaydı ekle
DO $$
DECLARE
  student_rec RECORD;
  course_rec RECORD;
  enrollment_count INTEGER;
  courses_per_student INTEGER;
BEGIN
  FOR student_rec IN SELECT * FROM student LOOP
    -- Her öğrenci için 2-4 ders seç
    courses_per_student := FLOOR(RANDOM() * 3 + 2)::INTEGER;
    enrollment_count := 0;
    
    FOR course_rec IN 
      SELECT * FROM "course" 
      ORDER BY RANDOM() 
      LIMIT courses_per_student
    LOOP
      INSERT INTO "enrollment" ("studentId", "courseId", "enrollmentDate", grade)
      VALUES (
        student_rec."studentId",
        course_rec."courseId",
        NOW() - INTERVAL '60 days',
        CASE 
          WHEN RANDOM() < 0.2 THEN 'AA'
          WHEN RANDOM() < 0.4 THEN 'BA'
          WHEN RANDOM() < 0.6 THEN 'BB'
          WHEN RANDOM() < 0.75 THEN 'CB'
          WHEN RANDOM() < 0.9 THEN 'CC'
          ELSE 'DC'
        END
      );
      enrollment_count := enrollment_count + 1;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 8. COMPLAINT (Şikayetler)
-- ============================================
-- Complaint types'ı kontrol et (eğer yoksa ekle)
DO $$
DECLARE
  type_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO type_count FROM "complaint_type";
  IF type_count = 0 THEN
    INSERT INTO "complaint_type" ("typeName", description, "requiresCourse") VALUES
    ('Ders İçeriği', 'Ders içeriği, müfredat veya ders materyalleri ile ilgili şikayetler', true),
    ('Öğretim Üyesi', 'Öğretim üyesi davranışı, ders anlatımı veya iletişim ile ilgili şikayetler', true),
    ('Sınav ve Değerlendirme', 'Sınav soruları, değerlendirme kriterleri veya notlandırma ile ilgili şikayetler', true),
    ('Kampüs Altyapısı', 'Bina, sınıf, laboratuvar veya diğer fiziksel altyapı ile ilgili şikayetler', false),
    ('Yemekhane', 'Yemekhane hizmetleri, yemek kalitesi veya fiyatları ile ilgili şikayetler', false),
    ('Burs ve Finansal', 'Burs başvuruları, ödeme sorunları veya finansal destek ile ilgili şikayetler', false);
  END IF;
END $$;

-- Şikayetler ekle (10 karakterlik benzersiz kod ile)
DO $$
DECLARE
  student_rec RECORD;
  complaint_type_rec RECORD;
  course_rec RECORD;
  personnel_rec RECORD;
  unique_code TEXT;
  complaint_status TEXT;
  complaint_id INTEGER;
  i INTEGER;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
BEGIN
  FOR student_rec IN SELECT * FROM "student" ORDER BY RANDOM() LIMIT 12 LOOP
    FOR complaint_type_rec IN SELECT * FROM "complaint_type" ORDER BY RANDOM() LIMIT 1 LOOP
      -- Benzersiz kod oluştur
      unique_code := '';
      FOR i IN 1..10 LOOP
        unique_code := unique_code || SUBSTRING(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
      END LOOP;
      
      -- Ders seçimi (eğer gerekiyorsa)
      IF complaint_type_rec."requiresCourse" THEN
        SELECT * INTO course_rec FROM "course" ORDER BY RANDOM() LIMIT 1;
      ELSE
        course_rec := NULL;
      END IF;
      
      -- Personel seçimi
      IF RANDOM() < 0.6 THEN
        SELECT * INTO personnel_rec FROM "personnel" ORDER BY RANDOM() LIMIT 1;
      ELSE
        personnel_rec := NULL;
      END IF;
      
      -- Durum belirleme
      IF RANDOM() < 0.3 THEN
        complaint_status := 'beklemede';
      ELSIF RANDOM() < 0.7 THEN
        complaint_status := 'cevaplandı';
      ELSE
        complaint_status := 'tamamlandı';
      END IF;
      
      -- Şikayet ekle
      INSERT INTO "complaint" (
        "studentId", 
        "complaintTypeId", 
        "courseId", 
        "handledByPersonnelId",
        "completedByPersonnelId",
        "uniqueCode", 
        title, 
        description, 
        status, 
        "createdAt", 
        "resolvedAt",
        "isPublic",
        "isAnonymous"
      ) VALUES (
        student_rec."studentId",
        complaint_type_rec."complaintTypeId",
        CASE WHEN course_rec IS NOT NULL THEN course_rec."courseId" ELSE NULL END,
        CASE WHEN personnel_rec IS NOT NULL THEN personnel_rec."personnelId" ELSE NULL END,
        CASE WHEN complaint_status = 'tamamlandı' AND personnel_rec IS NOT NULL THEN personnel_rec."personnelId" ELSE NULL END,
        unique_code,
        CASE 
          WHEN complaint_type_rec."typeName" = 'Ders İçeriği' THEN 'Ders İçeriği Yetersiz'
          WHEN complaint_type_rec."typeName" = 'Öğretim Üyesi' THEN 'Öğretim Üyesi İletişim Sorunu'
          WHEN complaint_type_rec."typeName" = 'Sınav ve Değerlendirme' THEN 'Sınav Değerlendirmesi Haksız'
          WHEN complaint_type_rec."typeName" = 'Kampüs Altyapısı' THEN 'Sınıf Donanımı Eksik'
          WHEN complaint_type_rec."typeName" = 'Yemekhane' THEN 'Yemekhane Kalitesi Düşük'
          WHEN complaint_type_rec."typeName" = 'Burs ve Finansal' THEN 'Burs Başvurusu Gecikiyor'
          ELSE 'Genel Şikayet'
        END,
        CASE 
          WHEN complaint_type_rec."typeName" = 'Ders İçeriği' THEN 'Ders içeriği güncel değil ve yeterli materyal sağlanmıyor. Daha fazla kaynak ve örnek bekliyorum.'
          WHEN complaint_type_rec."typeName" = 'Öğretim Üyesi' THEN 'Öğretim üyesi sorularıma yeterince cevap vermiyor ve ders saatleri dışında ulaşmak zor.'
          WHEN complaint_type_rec."typeName" = 'Sınav ve Değerlendirme' THEN 'Sınav soruları ders içeriğiyle uyumlu değil ve notlandırma adil görünmüyor.'
          WHEN complaint_type_rec."typeName" = 'Kampüs Altyapısı' THEN 'Sınıftaki projeksiyon cihazı çalışmıyor ve laboratuvardaki bilgisayarlar eski.'
          WHEN complaint_type_rec."typeName" = 'Yemekhane' THEN 'Yemekhane yemekleri kalitesiz ve fiyatlar çok yüksek. Daha iyi seçenekler olmalı.'
          WHEN complaint_type_rec."typeName" = 'Burs ve Finansal' THEN 'Burs başvurum 2 aydır bekliyor. Sonuçlanmasını bekliyorum.'
          ELSE 'Bu konuda bir sorun yaşıyorum ve çözüm bekliyorum.'
        END,
        complaint_status,
        NOW() - (RANDOM() * INTERVAL '30 days'),
        CASE 
          WHEN complaint_status = 'tamamlandı' THEN NOW() - (RANDOM() * INTERVAL '5 days')
          ELSE NULL
        END,
        CASE WHEN RANDOM() < 0.7 THEN true ELSE false END,
        CASE WHEN RANDOM() < 0.2 THEN true ELSE false END
      ) RETURNING "complaintId" INTO complaint_id;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 9. COMPLAINT_RESPONSE (Şikayet Cevapları)
-- ============================================
-- Resolved veya in_progress şikayetlere cevaplar ekle
DO $$
DECLARE
  complaint_rec RECORD;
  personnel_rec RECORD;
  response_count INTEGER;
BEGIN
  FOR complaint_rec IN 
    SELECT c.* FROM "complaint" c 
    WHERE c.status IN ('cevaplandı', 'tamamlandı') 
      AND c."handledByPersonnelId" IS NOT NULL
    ORDER BY RANDOM()
  LOOP
    -- İlk cevap (personel)
    SELECT * INTO personnel_rec FROM "personnel" WHERE "personnelId" = complaint_rec."handledByPersonnelId";
    
    IF personnel_rec IS NOT NULL THEN
      INSERT INTO "complaint_response" (
        "complaintId",
        "respondedByPersonnelId",
        "personnelResponse",
        "studentResponse",
        "createdAt",
        "updatedAt"
      ) VALUES (
        complaint_rec."complaintId",
        personnel_rec."personnelId",
        CASE 
          WHEN complaint_rec.status = 'tamamlandı' THEN 'Şikayetiniz incelendi ve gerekli düzenlemeler yapıldı. Sorununuz çözülmüştür.'
          WHEN complaint_rec.status = 'cevaplandı' THEN 'Şikayetiniz değerlendirilmektedir. En kısa sürede size geri dönüş yapılacaktır.'
          ELSE 'Şikayetiniz alınmıştır. İnceleme sürecine başlanmıştır.'
        END,
        CASE 
          WHEN complaint_rec.status = 'tamamlandı' AND RANDOM() < 0.5 THEN 'Teşekkür ederim, sorun çözüldü.'
          WHEN complaint_rec.status = 'cevaplandı' AND RANDOM() < 0.3 THEN 'Bekliyorum, lütfen hızlı olun.'
          ELSE NULL
        END,
        complaint_rec."createdAt" + INTERVAL '1 day',
        CASE 
          WHEN complaint_rec.status = 'tamamlandı' THEN complaint_rec."resolvedAt"
          ELSE complaint_rec."createdAt" + INTERVAL '2 days'
        END
      );
      
      -- Bazı şikayetlere ikinci cevap ekle (konuşma benzeri)
      IF complaint_rec.status = 'cevaplandı' AND RANDOM() < 0.3 THEN
        INSERT INTO "complaint_response" (
          "complaintId",
          "respondedByPersonnelId",
          "personnelResponse",
          "createdAt",
          "updatedAt"
        ) VALUES (
          complaint_rec."complaintId",
          personnel_rec."personnelId",
          'Ek bilgi almak için sizinle iletişime geçeceğiz. Lütfen bekleyiniz.',
          complaint_rec."createdAt" + INTERVAL '3 days',
          complaint_rec."createdAt" + INTERVAL '3 days'
        );
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ============================================
-- VERİ KONTROLÜ
-- ============================================
SELECT 'Users' as tablo, COUNT(*) as sayi FROM "users"
UNION ALL
SELECT 'Admins', COUNT(*) FROM "admin"
UNION ALL
SELECT 'Personnel', COUNT(*) FROM "personnel"
UNION ALL
SELECT 'Students', COUNT(*) FROM "student"
UNION ALL
SELECT 'Departments', COUNT(*) FROM "department"
UNION ALL
SELECT 'Courses', COUNT(*) FROM "course"
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM "enrollment"
UNION ALL
SELECT 'Complaints', COUNT(*) FROM "complaint"
UNION ALL
SELECT 'Complaint Responses', COUNT(*) FROM "complaint_response";

