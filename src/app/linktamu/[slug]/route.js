import { NextResponse } from 'next/server';

// Alias lama: arahkan tamu dari /linktamu/{slug} ke link publik langsung /{slug}
export async function GET(request, { params }) {
  const { slug } = await params;
  return NextResponse.redirect(new URL(`/${slug}`, request.url), 301);
}
