import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { album_id, guest_id, guest_name, r2_key, r2_image_url, preset_applied } = body || {};

    if (!album_id || !guest_id || !r2_image_url) {
      return NextResponse.json({ error: 'Data foto tidak lengkap' }, { status: 400 });
    }

    // 1. Simpan rekaman foto
    const { data: photo, error: photoError } = await supabaseServer
      .from('album_photos')
      .insert({
        album_id,
        guest_id,
        guest_name: guest_name || 'Tamu Anonim',
        r2_key: r2_key || '',
        r2_image_url,
        preset_applied: preset_applied || 'portra-400',
      })
      .select()
      .single();

    if (photoError) {
      console.error('Failed to save photo record:', photoError);
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }

    // 2. Increment photos_taken tamu
    const { data: guest } = await supabaseServer
      .from('album_guests')
      .select('photos_taken, album_id')
      .eq('id', guest_id)
      .single();

    const newCount = (guest?.photos_taken || 0) + 1;

    await supabaseServer
      .from('album_guests')
      .update({ photos_taken: newCount, updated_at: new Date().toISOString() })
      .eq('id', guest_id);

    // Ambil roll_limit album
    const { data: album } = await supabaseServer
      .from('invitation_albums')
      .select('roll_limit')
      .eq('id', album_id)
      .single();

    const rollLimit = album?.roll_limit || 10;
    const remainingRolls = Math.max(0, rollLimit - newCount);

    return NextResponse.json({
      success: true,
      photo,
      photosTaken: newCount,
      remainingRolls,
    });
  } catch (err) {
    console.error('Error confirming photo upload:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
