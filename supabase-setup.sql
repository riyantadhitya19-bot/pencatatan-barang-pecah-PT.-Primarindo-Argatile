-- SQL Schema untuk Supabase Database
-- Jalankan query ini di Supabase SQL Editor

-- 1. Buat tabel incidents
CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  date DATE NOT NULL,
  shading TEXT NOT NULL,
  sizing TEXT NOT NULL,
  ukuran TEXT NOT NULL,
  merk TEXT NOT NULL,
  kualitas TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  jenis_pecah TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(date DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- 4. Buat policy untuk public access (sesuaikan dengan kebutuhan keamanan Anda)
-- Policy ini memperbolehkan semua orang untuk membaca, insert, update, dan delete
-- PENTING: Untuk production, sebaiknya tambahkan autentikasi dan batasi akses

-- Allow SELECT (read)
CREATE POLICY "Enable read access for all users" ON incidents
  FOR SELECT USING (true);

-- Allow INSERT (create)
CREATE POLICY "Enable insert access for all users" ON incidents
  FOR INSERT WITH CHECK (true);

-- Allow UPDATE (update)
CREATE POLICY "Enable update access for all users" ON incidents
  FOR UPDATE USING (true);

-- Allow DELETE (delete)
CREATE POLICY "Enable delete access for all users" ON incidents
  FOR DELETE USING (true);

-- 5. Buat trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Storage Bucket untuk foto
-- Buat bucket bernama 'incident-photos' di Supabase Storage Dashboard
-- Kemudian jalankan query berikut untuk mengatur policy-nya:

-- Allow public read access untuk storage bucket
-- (Jalankan di Supabase SQL Editor setelah bucket dibuat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public upload
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'incident-photos');

-- Allow public read
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'incident-photos');

-- Allow public delete (opsional, sesuaikan dengan kebutuhan)
CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'incident-photos');
