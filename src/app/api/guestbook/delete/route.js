import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req) {
  try {
    const { id, slug, deleteAll } = await req.json();

    if (deleteAll && slug) {
      const { error } = await supabaseAdmin
        .from('guestbook')
        .delete()
        .eq('invitation_slug', slug);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Semua ucapan berhasil dihapus' });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID ucapan wajib disertakan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('guestbook')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Ucapan berhasil dihapus' });
  } catch (err) {
    console.error('API Guestbook Delete Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menghapus ucapan' }, { status: 500 });
  }
}
