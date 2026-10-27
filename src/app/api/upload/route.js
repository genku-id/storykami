import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const slug = formData.get('slug') || 'thumb';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Tidak ada file yang dipilih' }, { status: 400 });
    }

    // Batas ukuran 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawExt = file.name && file.name.includes('.') 
      ? file.name.split('.').pop().toLowerCase() 
      : 'jpg';
    let ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';

    let finalBuffer = buffer;
    let finalContentType = file.type || 'image/jpeg';

    // Optimasi gambar otomatis agar ringan (< 250 KB) dan ramah thumbnail WhatsApp/Medsos
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      try {
        const imagePipeline = sharp(buffer).rotate();
        const metadata = await imagePipeline.metadata();

        if (metadata.width && metadata.width > 1200) {
          imagePipeline.resize({ width: 1200, withoutEnlargement: true });
        }

        if (ext === 'png') {
          finalBuffer = await imagePipeline.png({ compressionLevel: 9, quality: 85 }).toBuffer();
          // Jika PNG masih di atas 280KB, convert ke JPEG agar tidak ditolak crawler WhatsApp (<300KB)
          if (finalBuffer.length > 280 * 1024) {
            finalBuffer = await sharp(buffer)
              .rotate()
              .resize({ width: 1000, withoutEnlargement: true })
              .jpeg({ quality: 82, progressive: true })
              .toBuffer();
            ext = 'jpg';
            finalContentType = 'image/jpeg';
          } else {
            finalContentType = 'image/png';
          }
        } else {
          finalBuffer = await imagePipeline.jpeg({ quality: 82, progressive: true }).toBuffer();
          ext = 'jpg';
          finalContentType = 'image/jpeg';
        }
      } catch (optErr) {
        console.warn('Image optimization fallback to original buffer:', optErr);
        finalBuffer = buffer;
      }
    }

    const cleanSlug = String(slug).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    const fileName = `${cleanSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // Upload ke bucket wim-assets
    let uploadRes = await supabaseAdmin.storage
      .from('wim-assets')
      .upload(fileName, finalBuffer, {
        contentType: finalContentType,
        upsert: true
      });

    // Buat bucket otomatis jika belum ada
    if (uploadRes.error && uploadRes.error.message?.toLowerCase().includes('bucket not found')) {
      await supabaseAdmin.storage.createBucket('wim-assets', { public: true });
      uploadRes = await supabaseAdmin.storage
        .from('wim-assets')
        .upload(fileName, finalBuffer, {
          contentType: finalContentType,
          upsert: true
        });
    }

    if (uploadRes.error) {
      console.error('Storage upload error:', uploadRes.error);
      return NextResponse.json({ error: uploadRes.error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('wim-assets')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName
    });
  } catch (err) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memproses file' }, { status: 500 });
  }
}
