import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const guestFilter = searchParams.get('guest') || '';

    // 1. Ambil info album
    const { data: album } = await supabaseServer
      .from('invitation_albums')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!album) {
      return NextResponse.json({ error: 'Album tidak ditemukan' }, { status: 404 });
    }

    // 2. Status reveal: Selalu aktif realtime (fitur waktu ungkap dihapus)
    const isActuallyRevealed = true;

    // Hitung total foto yang sudah masuk
    const { count: totalPhotos } = await supabaseServer
      .from('album_photos')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', album.id);

    // Jika album belum revealed, kembalikan hanya metadata countdown (foto disembunyikan seperti disposable camera sesungguhnya!)
    if (!isActuallyRevealed) {
      return NextResponse.json({
        is_revealed: false,
        reveal_at: album.reveal_at,
        total_photos: totalPhotos || 0,
        photos: [],
      });
    }

    // 3. Jika sudah revealed, ambil foto-fotonya
    let query = supabaseServer
      .from('album_photos')
      .select('id, guest_id, guest_name, r2_key, r2_image_url, preset_applied, likes_count, created_at')
      .eq('album_id', album.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (guestFilter) {
      query = query.eq('guest_name', guestFilter);
    }

    const { data: photos, error: photoError } = await query;

    if (photoError) {
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }

    // Ambil daftar nama-nama tamu unik yang sudah berkontribusi
    const contributors = Array.from(new Set((photos || []).map((p) => p.guest_name)));

    // Format URL gambar agar menggunakan API proxy lokal dengan trailing slash (kebal blokir DNS & tanpa 308 redirect)
    // Sediakan r2_image_url (file asli resolusi tinggi) dan r2_thumb_url (thumbnail webp ringan untuk galeri)
    const formattedPhotos = (photos || []).map((p) => {
      const originalKey = p.r2_key || '';
      const thumbKey = originalKey ? originalKey.replace(/\.(jpg|jpeg|webp|png)$/i, '_thumb.webp') : '';
      return {
        ...p,
        r2_image_url: originalKey
          ? `/api/album/${slug}/image/?key=${encodeURIComponent(originalKey)}`
          : p.r2_image_url,
        r2_thumb_url: thumbKey
          ? `/api/album/${slug}/image/?key=${encodeURIComponent(thumbKey)}`
          : p.r2_image_url,
      };
    });

    return NextResponse.json(
      {
        is_revealed: true,
        reveal_at: album.reveal_at,
        total_photos: formattedPhotos.length,
        contributors,
        photos: formattedPhotos,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Error fetching album photos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
