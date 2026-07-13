# Generator Undangan Digital

Folder ini adalah alat generator terpisah. File template utama di root project tidak diubah.

## Lewat browser

Jalankan server dari folder project:

```powershell
python -m http.server 8000
```

Buka:

```text
http://localhost:8000/assets/images/invitation-generator/
```

Isi data, upload gambar pengganti bila ada, lalu klik `Buat ZIP`.

Bagian `Halaman` bisa dipakai untuk mematikan halaman yang tidak dibutuhkan, misalnya Love Story, Wedding Gift, Ucapan, atau Footer. Bagian `Acara` dan `Love Story` bisa ditambah atau dihapus langsung dari form.

## Lewat Node

Edit `data-example.json`, lalu jalankan:

```powershell
node assets/images/invitation-generator/generate-from-data.js assets/images/invitation-generator/data-example.json
```

Output folder dibuat di:

```text
assets/images/invitation-generator/output/
```

Untuk gambar custom lewat Node, tambahkan properti `images` pada JSON:

```json
{
  "images": {
    "brideImage": "path/foto-mempelai-1.png",
    "groomImage": "path/foto-mempelai-2.png",
    "coupleImage": "path/foto-pasangan.png",
    "logoImage": "path/logo.png",
    "backgroundImage": "path/backgroundbunga.png",
    "floralImage": "path/floral1.png"
  }
}
```

URL tamu personal bisa memakai query:

```text
index.html?to=Nama%20Tamu
```

Untuk menyembunyikan halaman dari JSON, ubah nilai di `sections` menjadi `false`. Untuk acara, gunakan format daftar:

```json
{
  "sections": {
    "events": true,
    "gift": false
  },
  "events": [
    {
      "title": "Syukuran",
      "dateText": "Minggu, 6 Januari 2027",
      "startTime": "10:00",
      "endTime": "12:00",
      "locationName": "Rumah Mempelai",
      "address": "Jl. Contoh No. 1",
      "mapsUrl": "https://maps.google.com"
    }
  ]
}
```
