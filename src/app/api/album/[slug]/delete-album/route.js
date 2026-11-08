import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { deleteAlbumFolderFromR2 } from '@/utils/r2';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug tidak valid' }, { status: 400 });
    }

    // 1. Ambil data album dari database
    const { data: album } = await supabaseServer
      .from('invitation_albums')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    // 2. Hapus seluruh file foto di Cloudflare R2
    try {
      await deleteAlbumFolderFromR2(slug);
    } catch (r2Err) {
      console.error(`[delete-album] Gagal menghapus file R2 untuk ${slug}:`, r2Err);
    }

    // 3. Jika record album ditemukan di invitation_albums, bersihkan database
    if (album?.id) {
      // Hapus data foto di album_photos
      try {
        await supabaseServer
          .from('album_photos')
          .delete()
          .eq('album_id', album.id);
      } catch (pErr) {
        console.error(`[delete-album] Gagal hapus album_photos:`, pErr);
      }

      // Hapus data tamu di album_guests
      try {
        await supabaseServer
          .from('album_guests')
          .delete()
          .eq('album_id', album.id);
      } catch (gErr) {
        console.error(`[delete-album] Gagal hapus album_guests:`, gErr);
      }

      // Hapus row di invitation_albums
      const { error: delAlbumErr } = await supabaseServer
        .from('invitation_albums')
        .delete()
        .eq('id', album.id);

      if (delAlbumErr) {
        console.error(`[delete-album] Gagal hapus invitation_albums:`, delAlbumErr);
      }
    }

    // 4. Reset album_settings di invitations.data jika ada
    try {
      const { data: inv } = await supabaseServer
        .from('invitations')
        .select('id, data')
        .eq('slug', slug)
        .maybeSingle();

      if (inv?.data?.album_settings) {
        const nextData = { ...inv.data };
        delete nextData.album_settings;

        await supabaseServer
          .from('invitations')
          .update({ data: nextData })
          .eq('id', inv.id);
      }
    } catch (invErr) {
      console.error(`[delete-album] Gagal membersihkan album_settings di invitations:`, invErr);
    }

    return NextResponse.json({
      success: true,
      message: `Album untuk ${slug} beserta seluruh foto dan datanya berhasil dihapus bersih.`,
    });
  } catch (err) {
    console.error('[delete-album] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
