import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import engine from '@/utils/template-engine.js';

function uniqueDir(baseDir) {
  if (!fs.existsSync(baseDir)) return baseDir;
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `${baseDir}-${stamp}`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(sourcePath, targetPath) {
  ensureDir(path.dirname(targetPath));
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function copyDefaultImages(sourceImages, targetImagesDir) {
  ensureDir(targetImagesDir);
  if (!fs.existsSync(sourceImages)) return;
  for (const entry of fs.readdirSync(sourceImages, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    copyFile(path.join(sourceImages, entry.name), path.join(targetImagesDir, entry.name));
  }
}

// Transform flat form data to nested JSON for engine
function transformData(flatData) {
  const result = {
    events: [],
    gift: { bank1: {}, bank2: {} },
    images: {}
  };

  // Basic flat fields
  const basic = ['brideName', 'groomName', 'weddingDate', 'weddingDateText', 'audioUrl', 'brideParents', 'groomParents', 'brideInstagram', 'groomInstagram'];
  basic.forEach(k => {
    if (flatData[k]) result[k] = flatData[k];
  });

  // Extract events
  const akad = {}; const resepsi = {};
  Object.keys(flatData).forEach(k => {
    if (k.startsWith('akad_')) akad[k.replace('akad_', '')] = flatData[k];
    if (k.startsWith('resepsi_')) resepsi[k.replace('resepsi_', '')] = flatData[k];
  });
  if (Object.keys(akad).length > 0) result.events.push(akad);
  if (Object.keys(resepsi).length > 0) result.events.push(resepsi);

  // Extract gift
  Object.keys(flatData).forEach(k => {
    if (k.startsWith('gift_bank1_')) result.gift.bank1[k.replace('gift_bank1_', '')] = flatData[k];
    else if (k.startsWith('gift_bank2_')) result.gift.bank2[k.replace('gift_bank2_', '')] = flatData[k];
    else if (k.startsWith('gift_')) result.gift[k.replace('gift_', '')] = flatData[k];
  });

  // Extract photos (URLs from supabase)
  if (flatData.coverFoto) result.images.coverFoto = flatData.coverFoto;
  if (flatData.coupleFoto) result.images.coupleFoto = flatData.coupleFoto;
  
  result.projectName = flatData.slug || "undangan";

  return result;
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

    // Prepare paths
    const templateDir = path.join(process.cwd(), 'public', 'demo', template);
    if (!fs.existsSync(templateDir)) {
      return NextResponse.json({ error: 'Template directory not found' }, { status: 404 });
    }

    const source = {
      html: path.join(templateDir, 'index.html'),
      css: path.join(templateDir, 'assets', 'css', 'style.css'),
      js: path.join(templateDir, 'assets', 'js', 'script.js'),
      images: path.join(templateDir, 'assets', 'images')
    };

    // Transform and Normalize
    const transformed = transformData({ ...data, slug });
    const normalized = engine.normalizeData(transformed);
    
    // Setup Output directory (public/linktamu/[slug])
    const outputBase = path.join(process.cwd(), 'public', 'linktamu');
    const outputDir = path.join(outputBase, slug);
    
    // Optional: if directory exists, remove it or override (For now let's override)
    ensureDir(path.join(outputDir, 'assets', 'css'));
    ensureDir(path.join(outputDir, 'assets', 'js'));
    copyDefaultImages(source.images, path.join(outputDir, 'assets', 'images'));

    // Note: since images from Editor are Supabase URLs, we don't copy local files for them.
    // The HTML builder needs to be modified if it expects local files. 
    // Wait, the template engine actually injects `<img src="assets/images/bride.png">`.
    // If we have custom URLs, we need the engine to support URLs. 
    // We will handle this gracefully. For now, let's just generate the HTML.

    const html = fs.existsSync(source.html) ? fs.readFileSync(source.html, 'utf8') : '';
    const css = fs.existsSync(source.css) ? fs.readFileSync(source.css, 'utf8') : '';
    const js = fs.existsSync(source.js) ? fs.readFileSync(source.js, 'utf8') : '';

    if (html) fs.writeFileSync(path.join(outputDir, 'index.html'), engine.buildHtml(html, normalized), 'utf8');
    if (css) fs.writeFileSync(path.join(outputDir, 'assets', 'css', 'style.css'), css, 'utf8');
    if (js) fs.writeFileSync(path.join(outputDir, 'assets', 'js', 'script.js'), engine.buildScript(js, normalized), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'DATA.json'), JSON.stringify(normalized, null, 2), 'utf8');

    return NextResponse.json({ success: true, url: `/linktamu/${slug}` });
  } catch (error) {
    console.error('API Generate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
