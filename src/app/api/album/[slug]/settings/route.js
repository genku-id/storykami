import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const {
      title,
      roll_limit,
      max_guests,
      reveal_mode,
      is_active,
      is_revealed,
      preset_id,
      album_settings,
    } = body || {};

    if (!slug) {
      return NextResponse.json({ error: 'Slug tidak valid' }, { status: 400 });
    }

    // 1. Cek apakah album ada di database
    let { data: album } = await supabaseServer
      .from('invitation_albums')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    // Jika belum ada, cari di invitations dan buat otomatis
    if (!album) {
      const { data: inv } = await supabaseServer
        .from('invitations')
        .select('id, slug, data')
        .eq('slug', slug)
        .maybeSingle();

      if (!inv) {
        return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 });
      }

      const defaultTitle =
        inv.data?.mempelaiPria && inv.data?.mempelaiWanita
          ? `Album ${inv.data.mempelaiPria} & ${inv.data.mempelaiWanita}`
          : `Album Pernikahan ${inv.slug}`;

      const { data: inserted, error: insertErr } = await supabaseServer
        .from('invitation_albums')
        .insert({
          invitation_id: inv.id,
          slug: inv.slug,
          title: title || defaultTitle,
          roll_limit: roll_limit ? parseInt(roll_limit, 10) : 10,
          max_guests: max_guests ? parseInt(max_guests, 10) : 50,
          reveal_mode: reveal_mode || 'instant',
          is_active: is_active ?? true,
          is_revealed: is_revealed ?? true,
          preset_id: preset_id || 'portra-400',
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      album = inserted;
    } else {
      // Update fields yang dikirim
      const updatePayload = {
        updated_at: new Date().toISOString(),
      };
      if (title !== undefined) updatePayload.title = title.trim();
      if (roll_limit !== undefined) updatePayload.roll_limit = parseInt(roll_limit, 10);
      if (max_guests !== undefined) updatePayload.max_guests = parseInt(max_guests, 10);
      if (reveal_mode !== undefined) updatePayload.reveal_mode = reveal_mode;
      if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);
      if (is_revealed !== undefined) updatePayload.is_revealed = Boolean(is_revealed);
      if (preset_id !== undefined) updatePayload.preset_id = preset_id;

      const { data: updated, error: updateErr } = await supabaseServer
        .from('invitation_albums')
        .update(updatePayload)
        .eq('id', album.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      album = updated;
    }

    // 2. Simpan album_settings ekstra ke invitations.data jika ada
    let savedAlbumSettings = null;
    if (album_settings && typeof album_settings === 'object') {
      try {
        const { data: inv } = await supabaseServer
          .from('invitations')
          .select('id, data')
          .eq('slug', slug)
          .maybeSingle();

        if (inv) {
          const currentData = inv.data || {};
          const mergedData = {
            ...currentData,
            album_settings: {
              ...(currentData.album_settings || {}),
              ...album_settings,
            },
          };
          savedAlbumSettings = mergedData.album_settings;

          await supabaseServer
            .from('invitations')
            .update({ data: mergedData })
            .eq('id', inv.id);
        }
      } catch (e) {
        console.error('Error updating invitations.data.album_settings:', e);
      }
    }

    return NextResponse.json({
      success: true,
      album: {
        id: album.id,
        slug: album.slug,
        title: album.title,
        preset_id: album.preset_id,
        roll_limit: album.roll_limit,
        max_guests: album.max_guests,
        reveal_mode: album.reveal_mode,
        is_revealed: album.is_revealed,
        is_active: album.is_active,
        ...(savedAlbumSettings ? {
          settings: savedAlbumSettings,
          close_date: savedAlbumSettings.close_date,
          close_time: savedAlbumSettings.close_time,
          close_date_formatted: savedAlbumSettings.close_date_formatted,
        } : {}),
      },
    });
  } catch (err) {
    console.error('Error in album settings API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
