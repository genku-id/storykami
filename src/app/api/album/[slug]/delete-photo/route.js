import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { getR2Client } from '@/utils/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'albumkami';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { photo_id } = body || {};

    if (!photo_id) {
      return NextResponse.json({ error: 'Photo ID diperlukan' }, { status: 400 });
    }

    // 1. Ambil data foto untuk mendapatkan key R2
    const { data: photo, error: fetchErr } = await supabaseServer
      .from('album_photos')
      .select('id, r2_key')
      .eq('id', photo_id)
      .maybeSingle();

    if (!photo) {
      return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
    }

    // 2. Hapus file asli dan thumbnail dari Cloudflare R2
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

    // 3. Hapus baris dari Supabase
    const { error: deleteErr } = await supabaseServer
      .from('album_photos')
      .delete()
      .eq('id', photo_id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, photo_id });
  } catch (err) {
    console.error('Error deleting photo:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
