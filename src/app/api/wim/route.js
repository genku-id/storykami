import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function POST(request) {
  // 1. Keamanan Anti-Hacker: Tolak jika berjalan di Vercel
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: 'Akses Ditolak. WIM hanya bisa dijalankan di Localhost (Laptop Anda).' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();
    const { templateName, slug, coupleName, groomName, brideName } = data;

    if (!templateName || !slug || !coupleName || !groomName || !brideName) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi.' }, { status: 400 });
    }

    // Path setup
    // Di Next.js API Routes, process.cwd() menunjuk ke root proyek (folder websk)
    const templateDirSource = path.join(process.cwd(), '..', 'template');
    const publicDir = path.join(process.cwd(), 'public');
    
    const sourcePath = path.join(templateDirSource, templateName);
    const destPath = path.join(publicDir, slug);

    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json({ error: `Template '${templateName}' tidak ditemukan di ${sourcePath}` }, { status: 404 });
    }

    // Fungsi rekursif untuk copy folder
    const copyRecursiveSync = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
          copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    // 2. Eksekusi Copy
    copyRecursiveSync(sourcePath, destPath);

    // 3. Proses Penggantian Nama
    const indexPath = path.join(destPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf8');
      
      // Asumsi template awal menggunakan Dilan & Milea
      content = content.replace(/Dilan & Milea/g, coupleName);
      content = content.replace(/Dilan &amp; Milea/g, coupleName);
      content = content.replace(/Dilan/g, groomName);
      content = content.replace(/dilan/g, groomName.toLowerCase());
      content = content.replace(/Milea/g, brideName);
      content = content.replace(/milea/g, brideName.toLowerCase());
      
      // Inisial Monogram
      const groomInitial = groomName.charAt(0).toUpperCase();
      const brideInitial = brideName.charAt(0).toUpperCase();
      content = content.replace(/<span class="cover-slide-in-left">M<\/span>/g, `<span class="cover-slide-in-left">${brideInitial}</span>`);
      content = content.replace(/<span class="cover-slide-in-right">D<\/span>/g, `<span class="cover-slide-in-right">${groomInitial}</span>`);
      
      fs.writeFileSync(indexPath, content, 'utf8');
    }

    // 4. Otomatisasi Git Push
    try {
      execSync('git add .', { cwd: process.cwd() });
      execSync(`git commit -m "wim-web: generate undangan ${slug}"`, { cwd: process.cwd() });
      execSync('git push', { cwd: process.cwd() });
    } catch (gitErr) {
      console.error('Git error:', gitErr);
      return NextResponse.json(
        { 
          message: 'Folder undangan berhasil dibuat secara lokal, namun gagal push ke GitHub. Silakan push manual di VSCode.',
          details: gitErr.toString() 
        }, 
        { status: 207 } // 207 Multi-Status
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sukses! Undangan akan online dalam 1 menit di https://storykami.my.id/${slug}/index.html` 
    });

  } catch (error) {
    console.error('WIM API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
