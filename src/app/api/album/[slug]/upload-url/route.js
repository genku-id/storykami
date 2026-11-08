import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { createPresignedUploadUrl } from '@/utils/r2';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { device_token } = body || {};

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

    // 1b. Cek apakah album sudah melewati batas tanggal berakhir
    try {
      const { data: inv } = await supabaseServer
        .from('invitations')
        .select('data')
        .eq('slug', slug)
        .maybeSingle();

      if (inv?.data?.album_settings?.close_date) {
        const closeDateRaw = inv.data.album_settings.close_date;
        const closeTimeRaw = inv.data.album_settings.close_time || '17:00';
        const closeDateTime = new Date(`${closeDateRaw}T${closeTimeRaw.replace('.', ':')}:00`);
        if (!isNaN(closeDateTime.getTime()) && Date.now() > closeDateTime.getTime()) {
          return NextResponse.json({ error: 'Batas waktu pengunggahan foto untuk album ini telah berakhir.' }, { status: 403 });
        }
      }
    } catch (e) {}

    // 2. Ambil data tamu (atau auto-register jika belum ada agar upload tidak gagal)
    let { data: guest } = await supabaseServer
      .from('album_guests')
      .select('*')
      .eq('album_id', album.id)
      .eq('device_token', device_token)
      .maybeSingle();

    if (!guest) {
      const initialGuestName = (body.guest_name || 'Tamu').trim();
      const { data: newGuest } = await supabaseServer
        .from('album_guests')
        .insert({
          album_id: album.id,
          device_token,
          guest_name: initialGuestName,
          photos_taken: 0,
        })
        .select()
        .maybeSingle();

      if (newGuest) {
        guest = newGuest;
      } else {
        return NextResponse.json({ error: 'Sesi tamu belum terdaftar. Silakan masukkan nama terlebih dahulu.' }, { status: 401 });
      }
    }

    if ((guest.photos_taken || 0) >= (album.roll_limit || 10)) {
      return NextResponse.json({ error: 'Roll film Anda sudah habis! Semua jepretan telah terpakai.' }, { status: 429 });
    }

    // 3. Generate key unik di R2 (file asli .jpg & thumbnail .webp)
    const randomHex = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    const originalKey = `albums/${slug}/${timestamp}_${randomHex}.jpg`;
    const thumbKey = `albums/${slug}/${timestamp}_${randomHex}_thumb.webp`;

    // 4. Generate S3 Presigned URL untuk kedua file
    let originalPresigned;
    let thumbPresigned;

    try {
      originalPresigned = await createPresignedUploadUrl(originalKey, 'image/jpeg', 300);
      thumbPresigned = await createPresignedUploadUrl(thumbKey, 'image/webp', 300);
    } catch (r2Err) {
      console.warn('R2 presign failed or R2 not configured. Using fallback:', r2Err.message);
      originalPresigned = {
        uploadUrl: `/api/album/${slug}/fallback-upload?key=${encodeURIComponent(originalKey)}`,
        publicUrl: `/uploads/${originalKey}`,
      };
      thumbPresigned = {
        uploadUrl: `/api/album/${slug}/fallback-upload?key=${encodeURIComponent(thumbKey)}`,
        publicUrl: `/uploads/${thumbKey}`,
      };
    }

    return NextResponse.json(
      {
        uploadUrl: originalPresigned.uploadUrl,
        publicUrl: originalPresigned.publicUrl,
        key: originalKey,
        thumbUploadUrl: thumbPresigned.uploadUrl,
        thumbPublicUrl: thumbPresigned.publicUrl,
        thumbKey: thumbKey,
        albumId: album.id,
        guestId: guest.id,
        guestName: guest.guest_name,
        remainingRolls: (album.roll_limit || 10) - (guest.photos_taken || 0),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Error generating upload URL:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
