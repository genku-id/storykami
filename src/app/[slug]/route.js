import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import engine from '@/utils/template-engine.js';

// Admin client (service role) untuk baca storage & DB tanpa batasan RLS
const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const BUCKET = 'linktamu';

// Baca file template dari filesystem (public/demo/{template}/index.html)
function readTemplateHtml(template) {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'demo', template, 'index.html'), 'utf8');
  } catch (e) {
    return null;
  }
}

// Sisipkan meta tag OG ke dalam <head> HTML statis
function injectMeta(html, { title, description, image }) {
  const headOpen = html.indexOf('<head');
  if (headOpen === -1) return html;
  const headClose = html.indexOf('>', headOpen) + 1;
  const meta = `
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
    <meta property="og:type" content="website">
    ${image ? `<meta property="og:image" content="${image}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}">
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
    ${image ? `<meta name="twitter:image" content="${image}">` : ''}
  `;
  return html.slice(0, headClose) + meta + html.slice(headClose);
}

export async function GET(request, { params }) {
  const { slug } = await params;

  try {
    // 1) Coba HTML statis dari Storage (paling cepat & anti-error)
    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(`${slug}/index.html`);

    if (fileData && !fileError) {
      const html = await fileData.text();
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    // 2) Fallback: bangun HTML statis on-the-fly dari DB via template-engine
    const { data: invitation, error: dbError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (dbError || !invitation) {
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

    const template = invitation.template_name || invitation.template;
    const data = invitation.data || {};
    data.slug = slug;

    const templateHtml = readTemplateHtml(template);
    if (!templateHtml) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Template tidak tersedia</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;color:#4a7c7e;">
        <h1>Template ${template} sedang dalam pengembangan.</h1></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const built = engine.buildHtml(templateHtml, engine.normalizeData(data));

    const namaPasangan =
      data.coverName || data.coupleName || `${data.brideName || ''} & ${data.groomName || ''}`.trim() || '';
    const title = (data.thumbnailJudul || `Undangan Pernikahan ${namaPasangan} | StoryKami`).replace(/\[NAMA\]/gi, namaPasangan);
    const description = (data.thumbnailDeskripsi || `Hadiri Pernikahan ${namaPasangan}`).replace(/\[NAMA\]/gi, namaPasangan);
    const ogImage = data.thumbnailFoto || data.coupleImage || data.hal2_fotoCouple || null;

    const finalHtml = injectMeta(built, { title, description, image: ogImage });

    return new Response(finalHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    console.error('invitation route error:', err);
    return new Response('Server error', { status: 500 });
  }
}
