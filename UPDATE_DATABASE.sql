-- SQL untuk Update Database yang Sudah Ada
-- Jalankan query ini di Supabase SQL Editor jika Anda sudah punya tabel incidents sebelumnya

-- Tambah kolom jenis_pecah ke tabel incidents
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS jenis_pecah TEXT;

-- Update kolom description menjadi optional (nullable)
ALTER TABLE incidents 
ALTER COLUMN description DROP NOT NULL;

-- Opsional: Set default value untuk data yang sudah ada
UPDATE incidents 
SET jenis_pecah = 'PECAH GUDANG' 
WHERE jenis_pecah IS NULL;

-- Opsional: Tambahkan constraint setelah semua data sudah diupdate
-- (Uncomment jika ingin jenis_pecah wajib diisi)
-- ALTER TABLE incidents 
-- ALTER COLUMN jenis_pecah SET NOT NULL;

-- Verifikasi struktur tabel
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incidents' 
ORDER BY ordinal_position;
