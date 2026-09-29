import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Batas ukuran 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawExt = file.name && file.name.includes('.') 
      ? file.name.split('.').pop().toLowerCase() 
      : 'jpg';
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
    const cleanSlug = String(slug).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    const fileName = `${cleanSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // Upload ke bucket wim-assets
    let uploadRes = await supabaseAdmin.storage
      .from('wim-assets')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    // Buat bucket otomatis jika belum ada
    if (uploadRes.error && uploadRes.error.message?.toLowerCase().includes('bucket not found')) {
      await supabaseAdmin.storage.createBucket('wim-assets', { public: true });
      uploadRes = await supabaseAdmin.storage
        .from('wim-assets')
        .upload(fileName, buffer, {
          contentType: file.type || 'image/jpeg',
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
