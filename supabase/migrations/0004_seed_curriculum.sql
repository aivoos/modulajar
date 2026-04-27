-- Day 10: Seed — Capaian Pembelajaran Kurikulum Merdeka Fase A-F
-- Ref: modulajar-docs.jsx → Roadmap Phase 0 "Seed: CP Kurikulum Merdeka semua mapel Fase A–F"
-- Migration: 0004_seed_curriculum.sql

BEGIN;

-- ── Curriculum Versions ────────────────────────────────────────
INSERT INTO curriculum_versions (kurikulum, name, phase, year, status, is_default)
VALUES
  ('k13',        'Kurikulum 2013',                    '2013', 2013, 'superseded', false),
  ('merdeka_2022', 'Kurikulum Merdeka',              '2022', 2022, 'active',    true),
  ('merdeka_2025', 'Kurikulum Merdeka',              '2025', 2025, 'active',    false)
ON CONFLICT (kurikulum, year) DO NOTHING;

-- Get the merdeka 2022 curriculum version id
DO $$
DECLARE
  merdeka_id uuid;
BEGIN
  SELECT id INTO merdeka_id FROM curriculum_versions WHERE kurikulum = 'merdeka_2022' AND year = 2022 LIMIT 1;

  -- ── Bahasa Indonesia ──────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    -- Fase A (Kelas 1-2)
    (merdeka_id, 'Bahasa Indonesia', 'A',
     '["Berinteraksi dengan orang lain melalui bahasa lisan dan tulisan", "Memahami teks lisan dan tulisan sederhana", "Mengucapkan huruf, kata, dan kalimat sederhana"]',
     'Peserta didik mampu berkomunikasi secara efektif melalui bahasa lisan dan tulisan untuk memenuhi kebutuhan komunikasi sehari-hari dengan kosakata dan struktur kalimat sederhana.'),
    -- Fase B (Kelas 3-4)
    (merdeka_id, 'Bahasa Indonesia', 'B',
     '["Berinteraksi dengan orang lain melalui bahasa lisan dan tulisan secara efektif", "Memahami berbagai teks dengan struktur yang lebih kompleks", "Membaca dan menulis teks pendek dengan ejaan dan punctuation yang benar"]',
     'Peserta didik mampu membaca, menulis, berbicara, dan menyimak berbagai teks pendek untuk kehidupan sehari-hari dengan kosakata yang berkembang.'),
    -- Fase C (Kelas 7-9)
    (merdeka_id, 'Bahasa Indonesia', 'C',
     '["Menganalisis teks informatif dan sastra", "Menyampaikan pendapat dengan argumen yang logis", "Memahami unsur kebahasaan dalam teks"]',
     'Peserta didik mampu menganalisis dan menghasilkan berbagai teks informatif dan sastra dengan struktur yang jelas dan bahasa yang efektif.'),
    -- Fase D (Kelas 10)
    (merdeka_id, 'Bahasa Indonesia', 'D',
     '["Memahami dan menganalisis teks sastra dan nonsastra", "Berpikir kritis terhadap informasi", "Menghasilkan karya tulis dengan penalaran yang baik"]',
     'Peserta didik mampu berpikir kritis dan menghasilkan karya tulis ilmiah populer dengan menganalisis berbagai teks sastra dan nonsastra.'),
    -- Fase E (Kelas 11)
    (merdeka_id, 'Bahasa Indonesia', 'E',
     '["Menganalisis dan mengevaluasi teks akademik", "Menyusun karya ilmiah populer", "Memahami perubahan bahasa dalam konteks sosial-budaya"]',
     'Peserta didik mampu menganalisis dan mengevaluasi teks akademik serta menyusun karya ilmiah populer dengan bahasa yang baku dan efektif.'),
    -- Fase F (Kelas 12)
    (merdeka_id, 'Bahasa Indonesia', 'F',
     '["Memahami dan menginterpretasi karya sastra Indonesia klasik dan modern", "Berpikir sistematis dan argumentatif", "Menghasilkan karya sastra dan nonsastra yang orisinal"]',
     'Peserta didik mampu memahami, menginterpretasi, dan menghasilkan karya sastra dan nonsastra Indonesia yang orisinal dengan pemikiran sistematis dan argumentatif.');

  -- ── Matematika ──────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'Matematika', 'A',
     '["Mengenal bilangan dan operasinya", "Memahami konsep pengukuran", "Mengenal bangun datar dan bangun ruang sederhana"]',
     'Peserta didik mampu memahami konsep bilangan, operasi hitung sederhana, pengukuran, dan bangun datar melalui pengalaman bermain dan contexts kehidupan sehari-hari.'),
    (merdeka_id, 'Matematika', 'B',
     '["Melakukan operasi bilangan bulat dan pecahan", "Memahami konsep keliling dan luas bangun datar", "Mengumpulkan dan mengolah data sederhana"]',
     'Peserta didik mampu menerapkan pemahaman bilangan, geometri, dan data untuk menyelesaikan masalah dalam kehidupan sehari-hari.'),
    (merdeka_id, 'Matematika', 'C',
     '["Memahami aljabar dan relasi", "Memahami bangun datar dan ruang", "Menganalisis data dan statistika sederhana"]',
     'Peserta didik mampu menggunakan aljabar, geometri, dan statistika untuk memodelkan dan menyelesaikan masalah dengan berbagai strategi.'),
    (merdeka_id, 'Matematika', 'D',
     '["Memahami pola dan relasi fungsi", "Memahami trigonometri dasar", "Menganalisis data dan peluang"]',
     'Peserta didik mampu berpikir logis, kritis, dan kreatif dalam matematika melalui pemodelan dan penyelesaian masalah.'),
    (merdeka_id, 'Matematika', 'E',
     '["Memahami kalkulus diferensial", "Memahami matriks dan vektor", "Menganalisis statistika inferensial"]',
     'Peserta didik mampu menggunakan kalkulus, aljabar linier, dan statistika untuk pemecahan masalah dalam berbagai konteks.'),
    (merdeka_id, 'Matematika', 'F',
     '["Memahami matematika lanjut untuk STEM", "Berpikir abstrak dan formal", "Mengaplikasikan matematika dalam penelitian sederhana"]',
     'Peserta didik mampu berpikir matematis secara抽象 dan mengaplikasikannya dalam konteks STEM dan riset sederhana.');

  -- ── IPA ─────────────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'IPA', 'A',
     '["Mengenal makhluk hidup dan lingkungannya", "Memahami perubahan pada benda dan energinya", "Melakukan pengamatan sederhana"]',
     'Peserta didik mampu mengamati dan memahami berbagai fenomena alam sederhana melalui pengalaman langsung di lingkungan sekitar.'),
    (merdeka_id, 'IPA', 'B',
     '["Memahami ekosistem dan interaksi organisme", "Memahami konsep energi dan perubahannya", "Melakukan percobaan sederhana dengan variáveis"]',
     'Peserta didik mampu memahami ekosistem, energi, dan percobaan sederhana untuk membangun kesadaran terhadap lingkungan.'),
    (merdeka_id, 'IPA', 'C',
     '["Memahami struktur dan fungsi makhluk hidup", "Memahami hukum Newton dan gerak", "Menganalisis campuran dan reaksi kimia"]',
     'Peserta didik mampu menganalisis gejala alam, makhluk hidup, dan fenomena fisika-kimia dengan pendekatan ilmiah.');

  -- ── IPS ──────────────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'IPS', 'A',
     '["Mengenal diri sendiri, keluarga, dan lingkungan sekolah", "Memahami kehidupan sosial di lingkungan terdekat"]',
     'Peserta didik mampu memahami hubungan sosial di lingkungan keluarga, sekolah, dan masyarakat sekitar.'),
    (merdeka_id, 'IPS', 'B',
     '["Memahami keberagaman sosial dan budaya", "Mengenal sumber daya alam dan ekonomi sederhana"]',
     'Peserta didik mampu memahami keberagaman masyarakat Indonesia serta interaksinya dengan lingkungan dan ekonomi.'),
    (merdeka_id, 'IPS', 'C',
     '["Memahami perubahan sosial dan budaya", "Menganalisis ruang dan interaksi sosial-ekonomi"]',
     'Peserta didik mampu menganalisis perubahan sosial-budaya, geografi, dan ekonomi dalam konteks masyarakat Indonesia.');

  -- ── Bahasa Inggris ────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'Bahasa Inggris', 'C',
     '["Memahami teks lisan dan tertulis dalam konteks spesifik", "Berinteraksi secara lisan dalam situasi konkret", "Memahami perbedaan budaya dalam teks bahasa Inggris"]',
     'Peserta didik mampu memahami dan berkomunikasi dalam bahasa Inggris secara sederhana dalam konteks spesifik dan lintas budaya.'),
    (merdeka_id, 'Bahasa Inggris', 'D',
     '["Memahami dan menghasilkan teks lisan dan tertulis dalam konteks umum", "Berpikir kritis terhadap teks bahasa Inggris"]',
     'Peserta didik mampu memahami dan menghasilkan berbagai teks dalam bahasa Inggris untuk keperluan komunikasi dan pembelajaran.'),
    (merdeka_id, 'Bahasa Inggris', 'E',
     '["Memahami teks akademik dalam bahasa Inggris", "Berinteraksi dalam konteks formal dan informal"]',
     'Peserta didik mampu menggunakan bahasa Inggris untuk keperluan akademik dan profesional secara efektif.');

  -- ── PJOK ────────────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'PJOK', 'A',
     '["Melakukan gerak dasar locomotor dan non-locomotor", "Memahami aturan permainan sederhana", "Menunjukkan sportivitas"]',
     'Peserta didik mampu melakukan berbagai aktivitas fisik dengan gerakkan dasar yang terkoordinasi dan sportivitas.'),
    (merdeka_id, 'PJOK', 'B',
     '["Melakukan berbagai aktivitas permainan dan olahraga", "Memahami konsep kebugaran jasmani", "Menunjukkan kerja sama tim"]',
     'Peserta didik mampu melakukan berbagai aktivitas permainan dan olahraga serta memahami pentingnya kebugaran jasmani.'),
    (merdeka_id, 'PJOK', 'C',
     '["Menganalisis teknik olahraga", "Memahami dampak aktivitas fisik terhadap kesehatan"]',
     'Peserta didik mampu menganalisis dan menerapkan berbagai teknik olahraga serta memahami hubungan aktivitas fisik dan kesehatan.');

  -- ── Seni Budaya ────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'Seni Budaya', 'A',
     '["Mengapresiasi karya seni musik, tari, dan rupa", "Mengekspresikan diri melalui seni"]',
     'Peserta didik mampu mengapresiasi dan mengekspresikan diri melalui berbagai karya seni sesuai usia.'),
    (merdeka_id, 'Seni Budaya', 'B',
     '["Menciptakan karya seni dengan teknik dasar", "Memahami unsur-unsur seni"]',
     'Peserta didik mampu menciptakan dan apresiasi karya seni dengan memahami unsur-unsur dasar seni.'),
    (merdeka_id, 'Seni Budaya', 'C',
     '["Menciptakan dan menganalisis karya seni", "Memahami hubungan seni dan budaya lokal"]',
     'Peserta didik mampu menganalisis dan menciptakan karya seni yang mencerminkan appreciation terhadap budaya lokal.');

  -- ── Prakarya ────────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'Prakarya', 'C',
     '["Membuat karya dari bahan alam dan buatan", "Memahami proses produksi sederhana"]',
     'Peserta didik mampu membuat karya prakarya dari berbagai bahan dengan memperhatikan aspek fungsi dan estetika.'),
    (merdeka_id, 'Prakarya', 'D',
     '["Merancang dan membuat produk dengan teknologi sederhana"]',
     'Peserta didik mampu merancang dan membuat produk rekayasa yang bermanfaat dengan teknologi sederhana.');

  -- ── Pendidikan Agama ───────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'Pendidikan Agama', 'A',
     '["Mengenal ajaran agama yang dianut", "Memahami akhlakul karimah dalam kehidupan sehari-hari"]',
     'Peserta didik mampu memahami dan mengamalkan ajaran agamanya dalam kehidupan sehari-hari.'),
    (merdeka_id, 'Pendidikan Agama', 'B',
     '["Memahami prinsip ajaran agama", "Berperilaku sesuai ajaran agama"]',
     'Peserta didik mampu memahami prinsip ajaran agama dan menerapkannya dalam kehidupan bermasyarakat.'),
    (merdeka_id, 'Pendidikan Agama', 'C',
     '["Menganalisis ajaran agama secara kritis", "Menunjukkan toleransi antarumat beragama"]',
     'Peserta didik mampu menganalisis ajaran agamanya secara kritis dan menunjukkan sikap toleransi.');

  -- ── PKn ────────────────────────────────────────────────────
  INSERT INTO capaian_pembelajaran (curriculum_version_id, subject, fase, elements, description)
  VALUES
    (merdeka_id, 'PKn', 'A',
     '["Mengenal simbol negara, aturan di rumah dan sekolah"]',
     'Peserta didik mampu mengenal dan memahami simbol negara, aturan, serta hak dan kewajiban di lingkungan terdekat.'),
    (merdeka_id, 'PKn', 'B',
     '["Memahami keberagaman dan demokrasi di lingkungan sekolah"]',
     'Peserta didik mampu memahami keberagaman, демократ, dan participação dalam kehidupan bermasyarakat.'),
    (merdeka_id, 'PKn', 'C',
     '["Memahami sistem pemerintahan dan kehidupan демократ"]',
     'Peserta didik mampu menganalisis sistema pemerintahan Indonesia, демократ, dan hak-hak warga negara.');

END $$;

COMMIT;