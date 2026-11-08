import { NextResponse } from 'next/server';
import { getR2Client } from '@/utils/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'albumkami';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return new NextResponse('Key is required', { status: 400 });
    }

    let cleanKey = key;
    try {
      cleanKey = decodeURIComponent(key);
    } catch (e) {}
    cleanKey = cleanKey.replace(/^\/+/, '');

    const ext = path.extname(cleanKey).toLowerCase();
    const fallbackMime =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.png'
        ? 'image/png'
        : 'image/webp';

    const isDownload = searchParams.get('download') === '1' || searchParams.get('dl') === '1';
    const downloadFilename = searchParams.get('filename') || path.basename(cleanKey);

    const client = getR2Client();

    // 1. Coba ambil file yang diminta dari Cloudflare R2
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: cleanKey,
      });

      const response = await client.send(command);
      const byteArray = await response.Body.transformToByteArray();

      const headers = {
        'Content-Type': response.ContentType || fallbackMime,
        'Content-Length': String(response.ContentLength || byteArray.length),
        'Cache-Control': isDownload ? 'private, no-cache' : 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };

      if (isDownload) {
        headers['Content-Disposition'] = `attachment; filename="${downloadFilename}"`;
      }

      return new NextResponse(byteArray, {
        status: 200,
        headers,
      });
    } catch (r2Err) {
      // 2. Jika thumbnail (_thumb.webp) yang diminta belum ada (misal foto lama), fallback ke file aslinya
      if (cleanKey.includes('_thumb.webp')) {
        const candidateKeys = [
          cleanKey.replace('_thumb.webp', '.jpg'),
          cleanKey.replace('_thumb.webp', '.webp'),
          cleanKey.replace('_thumb.webp', '.png'),
        ];

        for (const fallbackKey of candidateKeys) {
          try {
            const fallbackCmd = new GetObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: fallbackKey,
            });
            const fbResponse = await client.send(fallbackCmd);
            const fbArray = await fbResponse.Body.transformToByteArray();

            const fbHeaders = {
              'Content-Type': fbResponse.ContentType || 'image/jpeg',
              'Content-Length': String(fbResponse.ContentLength || fbArray.length),
              'Cache-Control': isDownload ? 'private, no-cache' : 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
            };

            if (isDownload) {
              fbHeaders['Content-Disposition'] = `attachment; filename="${downloadFilename}"`;
            }

            return new NextResponse(fbArray, {
              status: 200,
              headers: fbHeaders,
            });
          } catch (e) {
            // continue next candidate
          }
        }
      }
    }

    // 3. Fallback jika file tersimpan di server lokal (public/uploads)
    const localPath = path.join(process.cwd(), 'public', 'uploads', cleanKey);
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      const localHeaders = {
        'Content-Type': fallbackMime,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': isDownload ? 'private, no-cache' : 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };
      if (isDownload) {
        localHeaders['Content-Disposition'] = `attachment; filename="${downloadFilename}"`;
      }
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: localHeaders,
      });
    }

    return new NextResponse('Image not found', { status: 404 });
  } catch (err) {
    console.error('Error streaming R2 image:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
