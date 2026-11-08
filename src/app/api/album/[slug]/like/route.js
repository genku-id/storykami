import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { photo_id, action = 'like' } = body || {};

    if (!photo_id) {
      return NextResponse.json({ error: 'Photo ID diperlukan' }, { status: 400 });
    }

    // 1. Ambil data foto saat ini
    const { data: photo, error: fetchErr } = await supabaseServer
      .from('album_photos')
      .select('id, likes_count, album_id')
      .eq('id', photo_id)
      .maybeSingle();

    if (fetchErr || !photo) {
      return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
    }

    // 2. Hitung jumlah like baru
    const currentLikes = photo.likes_count || 0;
    const newLikes = action === 'unlike' ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    // 3. Update likes_count di Supabase
    const { error: updateErr } = await supabaseServer
      .from('album_photos')
      .update({ likes_count: newLikes })
      .eq('id', photo_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      photo_id,
      likes_count: newLikes,
      action,
    });
  } catch (err) {
    console.error('Error toggling like:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
