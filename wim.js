const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=========================================");
console.log("💍 WEDDING INVITATION MANAGER (WIM)");
console.log("=========================================\n");

const templateDirSource = path.join(__dirname, '..', 'template');
const publicDir = path.join(__dirname, 'public');

rl.question('1. Nama Folder Template (contoh: template-floral1): ', (templateName) => {
  rl.question('2. URL/Slug Klien (contoh: romeo-juliet): ', (slug) => {
    rl.question('3. Judul Mempelai (contoh: Romeo & Juliet): ', (coupleName) => {
      rl.question('4. Nama Pengantin Pria (contoh: Romeo): ', (groomName) => {
        rl.question('5. Nama Pengantin Wanita (contoh: Juliet): ', (brideName) => {

          const sourcePath = path.join(templateDirSource, templateName);
          const destPath = path.join(publicDir, slug);

          if (!fs.existsSync(sourcePath)) {
            console.error(`\n❌ Error: Template '${templateName}' tidak ditemukan di ${sourcePath}`);
            rl.close();
            return;
          }

          console.log(`\n⏳ Meng-copy template ke /public/${slug}...`);
          
          // Helper for copy recursive
          const copyRecursiveSync = function(src, dest) {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = exists && stats.isDirectory();
            if (isDirectory) {
              if (!fs.existsSync(dest)) fs.mkdirSync(dest, {recursive: true});
              fs.readdirSync(src).forEach(function(childItemName) {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
              });
            } else {
              fs.copyFileSync(src, dest);
            }
          };

          copyRecursiveSync(sourcePath, destPath);

          console.log(`⏳ Mengganti nama menjadi ${coupleName}...`);
          const indexPath = path.join(destPath, 'index.html');
          
          if (fs.existsSync(indexPath)) {
            let content = fs.readFileSync(indexPath, 'utf8');
            
            // Ganti nama spesifik (Asumsi template awal menggunakan Dilan & Milea)
            content = content.replace(/Dilan & Milea/g, coupleName);
            content = content.replace(/Dilan &amp; Milea/g, coupleName);
            content = content.replace(/Dilan/g, groomName);
            content = content.replace(/dilan/g, groomName.toLowerCase());
            content = content.replace(/Milea/g, brideName);
            content = content.replace(/milea/g, brideName.toLowerCase());
            
            // Ganti inisial Monogram
            const groomInitial = groomName.charAt(0).toUpperCase();
            const brideInitial = brideName.charAt(0).toUpperCase();
            content = content.replace(/<span class="cover-slide-in-left">M<\/span>/g, `<span class="cover-slide-in-left">${brideInitial}</span>`);
            content = content.replace(/<span class="cover-slide-in-right">D<\/span>/g, `<span class="cover-slide-in-right">${groomInitial}</span>`);
            
            fs.writeFileSync(indexPath, content, 'utf8');
          }

          console.log(`✅ Undangan berhasil dibuat di folder: public/${slug}`);
          
          console.log(`\n⏳ Meng-upload ke GitHub...`);
          try {
            execSync('git add .', { stdio: 'inherit' });
            execSync(`git commit -m "wim: generate undangan ${slug}"`, { stdio: 'inherit' });
            execSync('git push', { stdio: 'inherit' });
            console.log(`\n🎉 SUKSES! Undangan akan online dalam 1 menit di:`);
            console.log(`👉 https://storykami.my.id/${slug}/index.html`);
          } catch (err) {
            console.log(`\n⚠️ Undangan berhasil dibuat lokal, tapi gagal push ke GitHub.`);
            console.log(`Silakan push secara manual melalui VSCode Source Control.`);
          }

          rl.close();
        });
      });
    });
  });
});
