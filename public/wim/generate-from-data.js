#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const engine = require("./template-engine");

const generatorDir = __dirname;
const projectRoot = path.resolve(generatorDir, "..", "template", "template-floral1");
const source = {
    html: path.join(projectRoot, "index.html"),
    css: path.join(projectRoot, "assets", "css", "style.css"),
    js: path.join(projectRoot, "assets", "js", "script.js"),
    images: path.join(projectRoot, "assets", "images")
};

function uniqueDir(baseDir) {
    if (!fs.existsSync(baseDir)) return baseDir;
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    return `${baseDir}-${stamp}`;
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function copyFile(sourcePath, targetPath) {
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
}

function copyDefaultImages(targetImagesDir) {
    ensureDir(targetImagesDir);
    for (const entry of fs.readdirSync(source.images, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        copyFile(path.join(source.images, entry.name), path.join(targetImagesDir, entry.name));
    }
}

function applyCustomImages(data, targetImagesDir, dataDir) {
    const images = data.images || {};
    Object.entries(engine.IMAGE_FILES).forEach(([key, filename]) => {
        if (!images[key]) return;
        const sourcePath = path.resolve(dataDir, images[key]);
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`File gambar tidak ditemukan: ${sourcePath}`);
        }
        copyFile(sourcePath, path.join(targetImagesDir, filename));
    });
}

function main() {
    const dataPath = path.resolve(process.argv[2] || path.join(generatorDir, "data-example.json"));
    const outputBase = path.resolve(process.argv[3] || path.join(generatorDir, "output"));
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const normalized = engine.normalizeData(data);
    const outputDir = uniqueDir(path.join(outputBase, normalized.projectName));

    ensureDir(path.join(outputDir, "assets", "css"));
    ensureDir(path.join(outputDir, "assets", "js"));
    copyDefaultImages(path.join(outputDir, "assets", "images"));
    applyCustomImages(data, path.join(outputDir, "assets", "images"), path.dirname(dataPath));

    const html = fs.readFileSync(source.html, "utf8");
    const css = fs.readFileSync(source.css, "utf8");
    const js = fs.readFileSync(source.js, "utf8");

    fs.writeFileSync(path.join(outputDir, "index.html"), engine.buildHtml(html, normalized), "utf8");
    fs.writeFileSync(path.join(outputDir, "assets", "css", "style.css"), css, "utf8");
    fs.writeFileSync(path.join(outputDir, "assets", "js", "script.js"), engine.buildScript(js, normalized), "utf8");
    fs.writeFileSync(path.join(outputDir, "DATA.json"), JSON.stringify(normalized, null, 2), "utf8");
    fs.writeFileSync(path.join(outputDir, "README.txt"), [
        `Undangan ${normalized.coupleName}`,
        "",
        "Upload seluruh isi folder ini ke hosting.",
        "Nama tamu bisa dibuat personal lewat query URL:",
        "index.html?to=Nama%20Tamu"
    ].join("\n"), "utf8");

    console.log(`Undangan berhasil dibuat: ${outputDir}`);
}

main();
