import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getR2Client } from '@/utils/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'albumkami';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || `albums/${slug}/${Date.now()}.webp`;

    const blob = await request.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(key).toLowerCase();
    const contentType =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.png'
        ? 'image/png'
        : 'image/webp';

    // 1. Simpan langsung ke Cloudflare R2 via Server SDK (Bebas kendala CORS browser di HP)
    let savedToR2 = false;
    try {
      const client = getR2Client();
      await client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      savedToR2 = true;
    } catch (r2Err) {
      console.warn('[fallback-upload] R2 upload error, saving locally:', r2Err.message);
    }

    // 2. Simpan cadangan ke public/uploads/ jika R2 belum terhubung atau sedang offline
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', path.dirname(key));
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(process.cwd(), 'public', 'uploads', key);
      fs.writeFileSync(filePath, buffer);
    } catch (fsErr) {
      if (!savedToR2) throw fsErr;
    }

    return NextResponse.json({
      success: true,
      key,
      url: `/uploads/${key}`,
      savedToR2,
    });
  } catch (err) {
    console.error('Fallback upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, params) {
  return PUT(request, params);
}
