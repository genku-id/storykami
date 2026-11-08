import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { getR2Client } from '@/utils/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'albumkami';
const R2_PUBLIC_DOMAIN = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const formData = await request.formData();

    const deviceToken = formData.get('device_token');
    const guestName = (formData.get('guest_name') || 'Tamu').trim();
    const originalFile = formData.get('file');
    const thumbFile = formData.get('thumb');

    if (!deviceToken) {
      return NextResponse.json({ error: 'Device token diperlukan' }, { status: 400 });
    }
    if (!originalFile) {
      return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });
    }

    // 1. Ambil album & cek status aktif
    const { data: album } = await supabaseServer
      .from('invitation_albums')
      .select('id, roll_limit, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (!album || !album.is_active) {
      return NextResponse.json({ error: 'Album tidak aktif' }, { status: 403 });
    }

    // 1b. Cek batas tanggal berakhir album
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
          return NextResponse.json(
            { error: 'Batas waktu pengunggahan foto untuk album ini telah berakhir.' },
            { status: 403 }
          );
        }
      }
    } catch (e) {}

    // 2. Ambil tamu atau auto-register jika belum ada
    let { data: guest } = await supabaseServer
      .from('album_guests')
      .select('*')
      .eq('album_id', album.id)
      .eq('device_token', deviceToken)
      .maybeSingle();

    if (!guest) {
      const { data: newGuest } = await supabaseServer
        .from('album_guests')
        .insert({
          album_id: album.id,
          device_token: deviceToken,
          guest_name: guestName,
          photos_taken: 0,
        })
        .select()
        .maybeSingle();
      guest = newGuest;
    }

    if (!guest) {
      return NextResponse.json({ error: 'Gagal memverifikasi sesi tamu' }, { status: 500 });
    }

    const currentTaken = guest.photos_taken || 0;
    const rollLimit = album.roll_limit || 10;
    if (currentTaken >= rollLimit) {
      return NextResponse.json(
        { error: 'Roll film Anda sudah habis! Semua jepretan telah terpakai.' },
        { status: 429 }
      );
    }

    // 3. Siapkan buffer & key unik R2
    const randomHex = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    const originalKey = `albums/${slug}/${timestamp}_${randomHex}.jpg`;
    const thumbKey = `albums/${slug}/${timestamp}_${randomHex}_thumb.webp`;

    const origBuffer = Buffer.from(await originalFile.arrayBuffer());
    let thumbBuffer = null;
    if (thumbFile) {
      thumbBuffer = Buffer.from(await thumbFile.arrayBuffer());
    }

    // 4. Upload ke R2 secara paralel via Server SDK (Cepat & Bebas CORS)
    let savedToR2 = false;
    try {
      const r2Client = getR2Client();
      const uploadTasks = [
        r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: originalKey,
            Body: origBuffer,
            ContentType: 'image/jpeg',
          })
        ),
      ];

      if (thumbBuffer) {
        uploadTasks.push(
          r2Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: thumbKey,
              Body: thumbBuffer,
              ContentType: 'image/webp',
            })
          )
        );
      }

      await Promise.all(uploadTasks);
      savedToR2 = true;
    } catch (r2Err) {
      console.warn('[Unified Upload] R2 upload failed, saving to local disk fallback:', r2Err.message);
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', path.dirname(originalKey));
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(process.cwd(), 'public', 'uploads', originalKey), origBuffer);
        if (thumbBuffer) {
          fs.writeFileSync(path.join(process.cwd(), 'public', 'uploads', thumbKey), thumbBuffer);
        }
      } catch (fsErr) {
        if (!savedToR2) throw fsErr;
      }
    }

    const publicUrl = R2_PUBLIC_DOMAIN ? `${R2_PUBLIC_DOMAIN}/${originalKey}` : `/uploads/${originalKey}`;

    // 5. Catat foto ke Supabase & update kuota tamu secara paralel
    const [photoResult] = await Promise.all([
      supabaseServer
        .from('album_photos')
        .insert({
          album_id: album.id,
          guest_id: guest.id,
          guest_name: guestName,
          r2_key: originalKey,
          r2_image_url: publicUrl,
          preset_applied: 'original-highres',
        })
        .select()
        .single(),
      supabaseServer
        .from('album_guests')
        .update({
          photos_taken: currentTaken + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guest.id),
    ]);

    if (photoResult.error) {
      console.error('Failed to save photo record:', photoResult.error);
      return NextResponse.json({ error: photoResult.error.message }, { status: 500 });
    }

    const remainingRolls = Math.max(0, rollLimit - (currentTaken + 1));

    return NextResponse.json({
      success: true,
      photo: photoResult.data,
      remainingRolls,
      key: originalKey,
      thumbKey,
    });
  } catch (err) {
    console.error('Unified upload error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mengunggah foto' }, { status: 500 });
  }
}
