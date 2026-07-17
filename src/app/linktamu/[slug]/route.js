import { createClient } from '@supabase/supabase-js';

const BUCKET = 'linktamu';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request, { params }) {
  const { slug } = await params;

  try {
    // Ambil HTML dari Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(`${slug}/index.html`);

    if (error || !data) {
      // Undangan tidak ditemukan
      return new Response(
        `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Undangan Tidak Ditemukan</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f4f8;}
        .box{text-align:center;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
        h1{color:#4a7c7e;margin-bottom:8px;}p{color:#666;}</style>
        </head><body><div class="box"><h1>Undangan Tidak Ditemukan</h1>
        <p>Link undangan <strong>${slug}</strong> belum dibuat atau sudah tidak aktif.</p>
        </div></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Baca teks HTML
    const html = await data.text();

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (err) {
    console.error('linktamu route error:', err);
    return new Response('Server error', { status: 500 });
  }
}
