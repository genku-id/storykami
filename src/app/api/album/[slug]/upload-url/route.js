import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { createPresignedUploadUrl } from '@/utils/r2';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { device_token, contentType = 'image/jpeg' } = body || {};

    if (!device_token) {
      return NextResponse.json({ error: 'Device token diperlukan' }, { status: 400 });
    }

    // 1. Ambil album & cek sisa kuota roll
    const { data: album } = await supabaseServer
      .from('invitation_albums')
      .select('id, roll_limit, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (!album || !album.is_active) {
      return NextResponse.json({ error: 'Album tidak aktif' }, { status: 403 });
    }

    // 2. Ambil data tamu
    const { data: guest } = await supabaseServer
      .from('album_guests')
      .select('*')
      .eq('album_id', album.id)
      .eq('device_token', device_token)
      .maybeSingle();

    if (!guest) {
      return NextResponse.json({ error: 'Sesi tamu belum terdaftar. Silakan masukkan nama terlebih dahulu.' }, { status: 401 });
    }

    if ((guest.photos_taken || 0) >= (album.roll_limit || 10)) {
      return NextResponse.json({ error: 'Roll film Anda sudah habis! Semua jepretan telah terpakai.' }, { status: 429 });
    }

    // 3. Generate key unik di R2
    const randomHex = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'webp';
    const key = `albums/${slug}/${timestamp}_${randomHex}.${ext}`;

    // 4. Generate S3 Presigned URL untuk Cloudflare R2
    let uploadUrl;
    let publicUrl;
    try {
      const presigned = await createPresignedUploadUrl(key, contentType, 300);
      uploadUrl = presigned.uploadUrl;
      publicUrl = presigned.publicUrl;
    } catch (r2Err) {
      console.warn('R2 presign failed or R2 not configured. Using direct API fallback:', r2Err.message);
      // Fallback ke upload endpoint internal jika R2 env belum diisi
      uploadUrl = `/api/album/${slug}/fallback-upload?key=${encodeURIComponent(key)}`;
      publicUrl = `/uploads/${key}`;
    }

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
      albumId: album.id,
      guestId: guest.id,
      guestName: guest.guest_name,
      remainingRolls: (album.roll_limit || 10) - (guest.photos_taken || 0),
    });
  } catch (err) {
    console.error('Error generating upload URL:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
