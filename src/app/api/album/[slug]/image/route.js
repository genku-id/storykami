import { NextResponse } from 'next/server';
import { getR2Client } from '@/utils/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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

    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await client.send(command);
    const byteArray = await response.Body.transformToByteArray();

    return new NextResponse(byteArray, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'image/webp',
        'Content-Length': String(response.ContentLength || byteArray.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Error streaming R2 image:', err);
    return new NextResponse('Image not found', { status: 404 });
  }
}
