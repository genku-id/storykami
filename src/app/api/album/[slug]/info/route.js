import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const deviceToken = searchParams.get('device_token') || '';

    // 1. Cek apakah album sudah ada di invitation_albums
    let { data: album, error } = await supabaseServer
      .from('invitation_albums')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    // 2. Jika belum ada, cek apakah slug ini ada di tabel invitations (auto create default album)
    if (!album) {
      const { data: inv } = await supabaseServer
        .from('invitations')
        .select('id, slug, data')
        .eq('slug', slug)
        .maybeSingle();

      if (inv) {
        const invTitle = inv.data?.mempelaiPria && inv.data?.mempelaiWanita
          ? `Album ${inv.data.mempelaiPria} & ${inv.data.mempelaiWanita}`
          : `Album Pernikahan ${inv.slug}`;

        const newAlbumData = {
          invitation_id: inv.id,
          slug: inv.slug,
          title: invTitle,
          preset_id: 'portra-400',
          roll_limit: 10,
          max_guests: 50,
          reveal_mode: 'instant',
          is_revealed: true,
          is_active: true,
        };

        const { data: inserted, error: insertError } = await supabaseServer
          .from('invitation_albums')
          .insert(newAlbumData)
          .select()
          .single();

        if (!insertError && inserted) {
          album = inserted;
        } else {
          album = { ...newAlbumData, id: inv.id };
        }
      } else {
        return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 });
      }
    }

    // 3. Ambil data tanggal acara dari undangan WIM & album_settings
    let eventDateRaw = null;
    let eventDateFormatted = null;
    let extraSettings = {};
    try {
      const { data: inv } = await supabaseServer
        .from('invitations')
        .select('data')
        .eq('slug', slug)
        .maybeSingle();

      if (inv?.data) {
        extraSettings = inv.data.album_settings || {};
        if (inv.data.acara && Array.isArray(inv.data.acara) && inv.data.acara.length > 0) {
          eventDateRaw = inv.data.acara[0].tanggal;
          if (eventDateRaw) {
            const dParts = eventDateRaw.split('-');
            if (dParts.length === 3) {
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
              const mIdx = parseInt(dParts[1], 10) - 1;
              const day = parseInt(dParts[2], 10);
              const year = dParts[0];
              eventDateFormatted = `${day} ${months[mIdx] || ''} ${year}`;
            }
          }
        }
      }
    } catch (e) {}

    // 4. Hitung total foto yang sudah diupload
    let totalPhotos = 0;
    try {
      const { count } = await supabaseServer
        .from('album_photos')
        .select('*', { count: 'exact', head: true })
        .eq('album_id', album.id);
      totalPhotos = count || 0;
    } catch (e) {
      // Table might not exist yet
    }

    // 4. Cek sesi tamu jika ada deviceToken
    let guestSession = null;
    if (deviceToken) {
      try {
        const { data: guest } = await supabaseServer
          .from('album_guests')
          .select('*')
          .eq('album_id', album.id)
          .eq('device_token', deviceToken)
          .maybeSingle();

        if (guest) {
          guestSession = {
            id: guest.id,
            guest_name: guest.guest_name,
            photos_taken: guest.photos_taken,
            remaining_rolls: Math.max(0, (album.roll_limit || 10) - (guest.photos_taken || 0)),
          };
        }
      } catch (e) {}
    }

    return NextResponse.json(
      {
        album: {
          id: album.id,
          slug: album.slug,
          title: album.title,
          preset_id: album.preset_id || 'portra-400',
          roll_limit: album.roll_limit || 10,
          max_guests: album.max_guests || 50,
          reveal_mode: album.reveal_mode || 'instant',
          reveal_at: album.reveal_at || null,
          is_revealed: album.is_revealed ?? true,
          is_active: album.is_active ?? true,
          total_photos: totalPhotos,
          event_date: eventDateRaw,
          event_date_formatted: eventDateFormatted,
          settings: extraSettings,
        },
        guestSession,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Error fetching album info:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
