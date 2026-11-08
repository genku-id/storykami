import { supabaseServer } from '@/utils/supabaseServer';
import { headers } from 'next/headers';
import AlbumKamiClient from './AlbumKamiClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sParams = await searchParams;
  const photoId = sParams?.photo;

  let baseUrl = 'https://storykami.my.id';
  try {
    const headerList = await headers();
    let host = headerList.get('x-forwarded-host') || headerList.get('host') || 'storykami.my.id';
    host = host.replace(/^www\./i, ''); // Hapus prefix www. agar link selalu bersih
    const proto = headerList.get('x-forwarded-proto') || 'https';
    baseUrl = `${proto}://${host}`;
  } catch (e) {}

  // 1. Ambil info album
  const { data: album } = await supabaseServer
    .from('invitation_albums')
    .select('id, title')
    .eq('slug', slug)
    .maybeSingle();

  const albumTitle = album?.title || 'Album Kami';

  // 2. Jika ada query parameter ?photo= (foto spesifik yang dibagikan)
  if (photoId) {
    const { data: photo } = await supabaseServer
      .from('album_photos')
      .select('id, guest_name, r2_key, r2_image_url')
      .eq('id', photoId)
      .maybeSingle();

    if (photo) {
      const uploaderName = photo.guest_name || 'Tamu';
      const cleanKey = photo.r2_key || '';
      // Gunakan file thumbnail WebP ringan untuk Open Graph WhatsApp preview
      const thumbKey = cleanKey.includes('_thumb.webp')
        ? cleanKey
        : cleanKey.replace(/\.(jpg|jpeg|png)$/i, '_thumb.webp');

      const ogImageUrl = `${baseUrl}/api/album/${slug}/image/?key=${encodeURIComponent(thumbKey)}`;
      const pageUrl = `${baseUrl}/${slug}/albumkami/?photo=${encodeURIComponent(photo.id)}`;
      const title = `Foto dari ${uploaderName} • ${albumTitle}`;
      const description = `Lihat foto yang diabadikan oleh ${uploaderName} di ${albumTitle}. Abadikan juga momen manismu di sini! ✨`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: pageUrl,
          siteName: 'StoryKami',
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `Foto dari ${uploaderName}`,
              type: 'image/webp',
            },
          ],
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [ogImageUrl],
        },
      };
    }
  }

  // Metadata default album
  const defaultPageUrl = `${baseUrl}/${slug}/albumkami/`;
  return {
    title: `${albumTitle} • Galeri Foto Bersama`,
    description: `Galeri foto pernikahan ${albumTitle}. Lihat dan unggah foto momen bahagiamu di sini!`,
    openGraph: {
      title: `${albumTitle} • Galeri Foto Bersama`,
      description: `Galeri foto pernikahan ${albumTitle}. Lihat dan unggah foto momen bahagiamu di sini!`,
      url: defaultPageUrl,
      siteName: 'StoryKami',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${albumTitle} • Galeri Foto Bersama`,
      description: `Galeri foto pernikahan ${albumTitle}. Lihat dan unggah foto momen bahagiamu di sini!`,
    },
  };
}

export default async function Page({ params, searchParams }) {
  const p = await params;
  const s = await searchParams;
  return <AlbumKamiClient slug={p.slug} initialPhotoId={s?.photo || null} />;
}
