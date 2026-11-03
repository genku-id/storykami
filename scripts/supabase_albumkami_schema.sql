-- ========================================================
-- SKEMA BASIS DATA SUPABASE: ALBUMKAMI (DIGITAL DISPOSABLE CAMERA)
-- ========================================================

-- 1. Tabel Konfigurasi Album per Undangan
CREATE TABLE IF NOT EXISTS invitation_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id BIGINT REFERENCES invitations(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    preset_id VARCHAR(50) DEFAULT 'portra-400',
    roll_limit INT DEFAULT 10,
    max_guests INT DEFAULT 50,
    reveal_mode VARCHAR(20) DEFAULT 'instant',
    reveal_at TIMESTAMP WITH TIME ZONE,
    is_revealed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Sesi Tamu yang Memotret
CREATE TABLE IF NOT EXISTS album_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID REFERENCES invitation_albums(id) ON DELETE CASCADE,
    guest_name VARCHAR(100) NOT NULL,
    device_token VARCHAR(255) NOT NULL,
    photos_taken INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(album_id, device_token)
);

-- 3. Tabel Foto (File disimpan di Cloudflare R2)
CREATE TABLE IF NOT EXISTS album_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID REFERENCES invitation_albums(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES album_guests(id) ON DELETE SET NULL,
    guest_name VARCHAR(100) NOT NULL,
    r2_key TEXT NOT NULL,
    r2_image_url TEXT NOT NULL,
    preset_applied VARCHAR(50) DEFAULT 'portra-400',
    likes_count INT DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index performa pencarian galeri
CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_album_guests_token ON album_guests(album_id, device_token);
CREATE INDEX IF NOT EXISTS idx_invitation_albums_slug ON invitation_albums(slug);

-- Enable RLS
ALTER TABLE invitation_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses (RLS Policies)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read invitation_albums') THEN
        CREATE POLICY "Allow public read invitation_albums" ON invitation_albums FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert invitation_albums') THEN
        CREATE POLICY "Allow public insert invitation_albums" ON invitation_albums FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update invitation_albums') THEN
        CREATE POLICY "Allow public update invitation_albums" ON invitation_albums FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read album_guests') THEN
        CREATE POLICY "Allow public read album_guests" ON album_guests FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert album_guests') THEN
        CREATE POLICY "Allow public insert album_guests" ON album_guests FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update album_guests') THEN
        CREATE POLICY "Allow public update album_guests" ON album_guests FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read album_photos') THEN
        CREATE POLICY "Allow public read album_photos" ON album_photos FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert album_photos') THEN
        CREATE POLICY "Allow public insert album_photos" ON album_photos FOR INSERT WITH CHECK (true);
    END IF;
END $$;
