import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { guest_name, device_token } = body || {};

    if (!guest_name || !device_token) {
      return NextResponse.json({ error: 'Nama tamu dan device token wajib diisi' }, { status: 400 });
    }

    // 1. Ambil album
    const { data: album } = await supabaseServer
      .from('invitation_albums')
      .select('id, roll_limit, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (!album) {
      return NextResponse.json({ error: 'Album belum tersedia' }, { status: 404 });
    }

    if (!album.is_active) {
      return NextResponse.json({ error: 'Kamera untuk album ini sedang dinonaktifkan' }, { status: 403 });
    }

    // 2. Cek apakah tamu dengan device_token ini sudah terdaftar
    const { data: existingGuest } = await supabaseServer
      .from('album_guests')
      .select('*')
      .eq('album_id', album.id)
      .eq('device_token', device_token)
      .maybeSingle();

    if (existingGuest) {
      // Update nama jika tamu mengubah nama
      if (existingGuest.guest_name !== guest_name.trim()) {
        await supabaseServer
          .from('album_guests')
          .update({ guest_name: guest_name.trim() })
          .eq('id', existingGuest.id);
      }

      return NextResponse.json({
        guest: {
          id: existingGuest.id,
          guest_name: guest_name.trim(),
          photos_taken: existingGuest.photos_taken || 0,
          remaining_rolls: Math.max(0, album.roll_limit - (existingGuest.photos_taken || 0)),
        },
      });
    }

    // 3. Daftarkan tamu baru
    const { data: newGuest, error: insertError } = await supabaseServer
      .from('album_guests')
      .insert({
        album_id: album.id,
        guest_name: guest_name.trim(),
        device_token,
        photos_taken: 0,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      guest: {
        id: newGuest.id,
        guest_name: newGuest.guest_name,
        photos_taken: 0,
        remaining_rolls: album.roll_limit,
      },
    });
  } catch (err) {
    console.error('Error in guest session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
