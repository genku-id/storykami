import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Ytdl } from '@distube/ytdl-core';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, slug = 'audio' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Link YouTube wajib diisi' }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    // Validasi link YouTube
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = trimmedUrl.match(ytRegex);
    if (!match || !match[1]) {
      return NextResponse.json({ error: 'Format link YouTube tidak valid' }, { status: 400 });
    }

    const videoId = match[1];
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Gunakan Ytdl untuk mengekstrak stream audio
    const ytdl = new Ytdl();
    let info;
    try {
      info = await ytdl.getInfo(canonicalUrl);
    } catch (infoErr) {
      console.error('ytdl.getInfo error:', infoErr);
      return NextResponse.json({
        error: 'Server cloud dibatasi oleh sistem proteksi bot YouTube (Sign in to confirm you are not a bot). Silakan gunakan opsi "Upload File MP3 / M4A" di bawah untuk memasang lagu secara instan & 100% lancar di iPhone.',
        details: infoErr.message
      }, { status: 500 });
    }

    const title = info.videoDetails?.title || 'Audio Undangan';
    const duration = info.videoDetails?.durationInSec || 180;

    // Batasi durasi jika terlalu panjang (maksimal 15 menit)
    if (duration > 15 * 60) {
      return NextResponse.json({ error: 'Durasi video YouTube melebihi batas maksimal (maksimal 15 menit)' }, { status: 400 });
    }

    // Download audio stream murni
    const stream = await ytdl.download(canonicalUrl, {
      filter: { hasAudio: true, hasVideo: false },
      quality: 'highestaudio'
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.length < 5000) {
      return NextResponse.json({ error: 'Audio yang diekstrak kosong atau terlalu kecil' }, { status: 500 });
    }

    // Upload buffer ke Supabase Storage (wim-assets)
    const cleanSlug = String(slug).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'audio';
    const fileName = `audio-${cleanSlug}-${Date.now()}-${videoId.substring(0, 6)}.m4a`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('wim-assets')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload audio error:', uploadError);
      return NextResponse.json({ error: 'Gagal menyimpan file audio ke server penyimpanan', details: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('wim-assets')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData?.publicUrl;

    return NextResponse.json({
      success: true,
      audioUrl: publicUrl,
      title,
      duration,
      sizeBytes: audioBuffer.length,
      format: 'm4a'
    });
  } catch (err) {
    console.error('API /api/convert-youtube catch error:', err);
    return NextResponse.json({
      error: 'Terjadi kesalahan sistem saat mengonversi video YouTube',
      details: err.message
    }, { status: 500 });
  }
}
