import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import engine from '@/utils/template-engine.js';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client (pakai service role key agar bisa upload ke storage)
const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const BUCKET = 'linktamu';

// The editor stores data already in the engine's nested shape (defined by schema.json),
// e.g. coverName, brideName, weddingDate, events[], stories[], gift{accounts[]}, etc.
// We only need to ensure a few wrapper fields exist and forward everything else verbatim
// so the engine's normalizeData/migrateInput can process it.
function transformData(flatData) {
  const result = Object.assign({}, flatData);

  // Pastikan struktur dasar ada agar engine tidak error
  if (!result.gift || typeof result.gift !== 'object') {
    result.gift = { bank1: {}, bank2: {}, accounts: [] };
  }
  if (!Array.isArray(result.events)) result.events = [];
  if (!Array.isArray(result.stories)) result.stories = [];

  // Dukung juga format lama (flat akad_/resepsi_/gift_*) bila masih digunakan
  const akad = {};
  const resepsi = {};
  Object.keys(flatData).forEach(k => {
    if (k.startsWith('akad_')) akad[k.replace('akad_', '')] = flatData[k];
    if (k.startsWith('resepsi_')) resepsi[k.replace('resepsi_', '')] = flatData[k];
  });
  if (Object.keys(akad).length > 0 && result.events.length === 0) result.events.push(akad);
  if (Object.keys(resepsi).length > 0 && result.events.length === 0) result.events.push(resepsi);

  if (!result.gift.accounts || !Array.isArray(result.gift.accounts)) {
    if (result.gift.bank1 || result.gift.bank2) {
      result.gift.accounts = [result.gift.bank1, result.gift.bank2].filter(Boolean);
    } else {
      result.gift.accounts = [];
    }
  }

  result.projectName = flatData.slug || result.projectName || 'undangan';
  return result;
}

// Baca file template dari filesystem (tersedia di Vercel karena bagian dari build)
function readTemplateFile(templateDir, relativePath) {
  try {
    const fullPath = path.join(process.cwd(), 'public', 'demo', templateDir, relativePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    return null;
  }
}

export async function POST(req) {
  try {
    if (!engine) {
      return NextResponse.json({ error: 'Template engine not found' }, { status: 500 });
    }

    const { slug, template, data } = await req.json();

    if (!slug || !template || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Pastikan template ada
    const templateDir = path.join(process.cwd(), 'public', 'demo', template);
    if (!fs.existsSync(templateDir)) {
      return NextResponse.json({ error: 'Template directory not found' }, { status: 404 });
    }

    // Transform & normalize data
    const transformed = transformData({ ...data, slug });
    const normalized = engine.normalizeData(transformed);

    // Baca template HTML & JS
    const rawHtml = readTemplateFile(template, 'index.html');
    const rawJs = readTemplateFile(template, 'assets/js/script.js');

    if (!rawHtml) {
      return NextResponse.json({ error: 'Template HTML not found' }, { status: 404 });
    }

    // Build HTML & JS
    const builtHtml = engine.buildHtml(rawHtml, normalized);
    const builtJs = rawJs ? engine.buildScript(rawJs, normalized) : '';

    // Patch HTML: ubah path assets agar mengarah ke /demo/[template]/assets/
    // (karena CSS & gambar tetap di-serve dari /public/demo)
    let finalHtml = builtHtml
      .replace(/href="assets\/css\/style\.css[^"]*"/g, `href="/demo/${template}/assets/css/style.css"`)
      .replace(/src="assets\/images\//g, `src="/demo/${template}/assets/images/`);

    // Sisipkan script inline langsung di HTML (agar tidak perlu file JS terpisah)
    if (builtJs) {
      finalHtml = finalHtml.replace(
        /<script src="assets\/js\/script\.js[^"]*"><\/script>/,
        `<script>\n${builtJs}\n</script>`
      );
    }

    // Upload ke Supabase Storage
    const fileName = `${slug}/index.html`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, Buffer.from(finalHtml, 'utf8'), {
        contentType: 'text/html; charset=utf-8',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: `Upload gagal: ${uploadError.message}` }, { status: 500 });
    }

    // Simpan juga DATA.json ke storage
    await supabaseAdmin.storage
      .from(BUCKET)
      .upload(`${slug}/data.json`, Buffer.from(JSON.stringify(normalized, null, 2), 'utf8'), {
        contentType: 'application/json',
        upsert: true
      });

    return NextResponse.json({ success: true, url: `/${slug}` });

  } catch (error) {
    console.error('API Generate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
