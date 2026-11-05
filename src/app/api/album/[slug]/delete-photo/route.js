import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { getR2Client } from '@/utils/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'albumkami';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const { photo_id, r2_key, r2_image_url } = body || {};

    if (!photo_id && !r2_key && !r2_image_url) {
      return NextResponse.json({ error: 'Identifikasi foto diperlukan' }, { status: 400, headers: CORS_HEADERS });
    }

    // 1. Cari data foto di database
    let photo = null;

    // A. Coba cari via id jika format UUID valid
    const isUuid = photo_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photo_id);
    if (isUuid) {
      const { data } = await supabaseServer
        .from('album_photos')
        .select('*')
        .eq('id', photo_id)
        .maybeSingle();
      if (data) photo = data;
    }

    // B. Jika belum ketemu, cari via r2_key
    if (!photo && r2_key) {
      const { data } = await supabaseServer
        .from('album_photos')
        .select('*')
        .eq('r2_key', r2_key)
        .maybeSingle();
      if (data) photo = data;
    }

    // C. Jika belum ketemu, cari via partial match dari URL foto
    if (!photo && (r2_image_url || photo_id)) {
      const searchStr = decodeURIComponent(r2_image_url || photo_id || '');
      const match = searchStr.match(/albums\/[^"'\s&?]+\.(jpg|jpeg|webp|png)/i);
      if (match) {
        const { data } = await supabaseServer
          .from('album_photos')
          .select('*')
          .eq('r2_key', match[0])
          .maybeSingle();
        if (data) photo = data;
      }
    }

    // 2. Jika foto tidak ditemukan di database, bersihkan file di R2 jika key diketahui
    if (!photo) {
      const targetKey = r2_key || (photo_id?.includes('albums/') ? photo_id : null);
      if (targetKey) {
        try {
          const client = getR2Client();
          await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: targetKey }));
          await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: targetKey.replace(/\.(jpg|jpeg|webp|png)$/i, '_thumb.webp') }));
        } catch (e) {}
      }
      return NextResponse.json(
        { success: true, message: 'Foto sudah terhapus dari album' },
        { headers: CORS_HEADERS }
      );
    }

    // 3. Hapus file asli dan thumbnail dari Cloudflare R2
    if (photo.r2_key) {
      try {
        const client = getR2Client();
        const originalKey = photo.r2_key;
        const thumbKey = originalKey.replace(/\.(jpg|jpeg|webp|png)$/i, '_thumb.webp');

        await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: originalKey }));
        await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: thumbKey }));
      } catch (r2Err) {
        console.warn('Gagal menghapus file dari R2:', r2Err.message);
      }
    }

    // 4. Hapus baris dari Supabase
    const { error: deleteErr } = await supabaseServer
      .from('album_photos')
      .delete()
      .eq('id', photo.id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500, headers: CORS_HEADERS });
    }

    // 5. Kembalikan 1 kuota rol jepretan tamu (decrement photos_taken)
    if (photo.guest_id) {
      try {
        const { data: guest } = await supabaseServer
          .from('album_guests')
          .select('photos_taken')
          .eq('id', photo.guest_id)
          .single();

        if (guest && guest.photos_taken > 0) {
          await supabaseServer
            .from('album_guests')
            .update({ photos_taken: guest.photos_taken - 1, updated_at: new Date().toISOString() })
            .eq('id', photo.guest_id);
        }
      } catch (e) {}
    }

    return NextResponse.json(
      { success: true, photo_id: photo.id },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('Error deleting photo:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
