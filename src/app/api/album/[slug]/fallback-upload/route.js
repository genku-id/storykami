import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || `albums/${slug}/${Date.now()}.webp`;

    const blob = await request.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Simpan ke public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', path.dirname(key));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', key);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, key, url: `/uploads/${key}` });
  } catch (err) {
    console.error('Fallback upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
