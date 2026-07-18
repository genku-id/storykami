import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client (service role) agar bisa hapus storage & melewati RLS
const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: 'Slug wajib diisi' }, { status: 400 });
    }

    // 1) Hapus HTML statis & data JSON di Storage (linktamu/{slug}/*)
    try {
      const { data: files } = await supabaseAdmin.storage
        .from('linktamu')
        .list(slug);
      if (files && files.length) {
        const paths = files.map(f => `${slug}/${f.name}`);
        await supabaseAdmin.storage.from('linktamu').remove(paths);
      }
    } catch (e) {
      console.error('Gagal hapus storage linktamu:', e);
    }

    // 2) Hapus foto (couple/bride/groom/thumbnail) di Storage (wim-assets/{slug}-*)
    try {
      const { data: assets } = await supabaseAdmin.storage.from('wim-assets').list('', { limit: 1000 });
      if (assets && assets.length) {
        const prefix = `${slug}-`;
        const targets = assets.filter(a => a.name.startsWith(prefix)).map(a => a.name);
        if (targets.length) {
          await supabaseAdmin.storage.from('wim-assets').remove(targets);
        }
      }
    } catch (e) {
      console.error('Gagal hapus storage wim-assets:', e);
    }

    // 3) Hapus ucapan di tabel guestbook
    await supabaseAdmin.from('guestbook').delete().eq('invitation_slug', slug);

    // 4) Hapus baris undangan
    const { error } = await supabaseAdmin.from('invitations').delete().eq('slug', slug);
    if (error) {
      return NextResponse.json({ error: `Gagal hapus undangan: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Undangan ${slug} beserta semua file terkait telah dihapus.` });
  } catch (err) {
    console.error('API Delete Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
