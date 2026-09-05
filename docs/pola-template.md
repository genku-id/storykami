# Pola Template Undangan StoryKami

Setiap template undangan mengikuti **10 section** dengan urutan tetap.
Logic sudah di-handle oleh `InvitationTemplate.jsx` — template baru tinggal **override visual**.

---

## Struktur Section (Urutan Wajib)

```
1. COVER       — Lock screen, inisial nama, tombol "Buka Undangan"
2. HERO        — Nama mempelai, tanggal acara, countdown, "Simpan di Kalender"
3. PROFILES    — Salam, foto wanita, ampersand, foto pria, data orang tua
4. QUOTE       — Kutipan ayat/doa dan sumber
5. EVENTS      — Kartu Akad Nikah + Resepsi (tanggal, waktu, lokasi, maps)
6. LOVE STORY  — Timeline cerita cinta
7. GIFT        — Rekening bank + alamat kado fisik
8. GUESTBOOK   — Form ucapan + daftar ucapan (Supabase)
9. CLOSING     — Terima Kasih + Wassalam
10. FOOTER     — StoryKami branding
```

---

## Logic yang Sudah Di-Share (Tidak Perlu Ditulis Ulang)

| Logic | Keterangan |
|-------|------------|
| State management | `comments`, `namaTamu`, `ucapan`, `isSubmitting`, `isLocked`, `isPlaying`, `timeLeft` |
| Countdown timer | `useEffect` hitung mundur ke tanggal acara |
| Guestbook fetch | `useEffect` ambil data dari Supabase `guestbook` table |
| Scroll animation | `useEffect` IntersectionObserver untuk `data-animate` |
| Submit ucapan | `handleKirimUcapan` insert ke Supabase |
| Buka undangan | `handleBukaUndangan` unlock + play audio |
| Section visibility | `isVisible(key)` cek `pageVisibility` |

---

## Cara Bikin Template Baru

### Langkah 1: Buat CSS File
Buat file CSS baru di `src/app/wim/[nama-template].css`.

CSS harus define class untuk setiap section:
```css
.wim-template-[nama] .cover-page { ... }
.wim-template-[nama] .hero-section { ... }
.wim-template-[nama] .profiles-section { ... }
/* ... dst */
```

### Langkah 2: Buat Theme Config
Buat file `src/components/wim-baru/themes/[nama].js`:

```js
const myTheme = {
  name: 'nama-template',
  rootClass: 'wim-template-[nama]',
  cssFile: '@/app/wim/[nama].css',
  bg: '#ffffff',
  
  ornaments: {
    cover: { /* ornament classes/images */ },
    hero: { /* ... */ },
    // ... per section
  },
  
  cover: { style: 'monogram' },      // monogram | frame | photo
  profiles: { avatarStyle: 'circle' }, // circle | frame
  events: { cardStyle: 'pill' },       // pill | card | radial
  countdown: { style: 'default' },     // default | dark
};
```

### Langkah 3: Buat Component Wrapper
Buat file `src/components/wim-baru/[Nama]Template.jsx`:

```jsx
'use client';
import '@/app/wim/[nama].css';
import InvitationTemplate from '../InvitationTemplate';
import myTheme from '../themes/[nama]';

export default function MyTemplate({ data, slug, isVisible }) {
  return (
    <InvitationTemplate
      data={data}
      slug={slug}
      isVisible={isVisible}
      rootClass={myTheme.rootClass}
      renderCover={(ctx) => <CoverSection {...ctx} theme={myTheme} />}
      renderHero={(ctx) => <HeroSection {...ctx} theme={myTheme} />}
      // ... override section yang perlu diubah
    />
  );
}
```

### Langkah 4: Register di Dashboard
Tambah option di `src/app/wim/dashboard/page.js`:
```js
'template-[nama]': 'Nama Template Baru',
```

Dan di `src/app/[slug]/page.js`:
```js
if (template === 'template-[nama]') {
  return <MyTemplate data={data} slug={slug} isVisible={() => true} />;
}
```

---

## Data Model (wimDataContract)

Semua template menggunakan data yang sama:

```js
{
  pageVisibility: { cover, hero, profiles, quote, events, loveStory, gift, guestbook, closing },
  mempelai: {
    pria: { namaLengkap, namaPanggilan, namaAyah, namaIbu, urutanAnak, instagram, fotoUtama },
    wanita: { namaLengkap, namaPanggilan, namaAyah, namaIbu, urutanAnak, instagram, fotoUtama }
  },
  acara: {
    akad: { tanggal, waktuMulai, waktuSelesai, zonaWaktu, lokasi, alamatLengkap, linkMap },
    resepsi: { tanggal, waktuMulai, waktuSelesai, zonaWaktu, lokasi, alamatLengkap, linkMap }
  },
  kutipan: { teks, sumber },
  galeri: [urls],
  ceritaCinta: [{ tanggal, judul, cerita }],
  hadiahDigital: { accounts: [{ name, number, owner, whatsapp }], physicalAddress, receiver, physicalWhatsapp },
  musikUrl: string,
  videoUrl: string,
}
```

---

## File Structure

```
src/
├── components/wim-baru/
│   ├── InvitationTemplate.jsx    ← BASE (logic + default structure)
│   ├── Floral1Template.jsx       ← Wrapper untuk floral1
│   ├── JawaTemplate.jsx          ← Wrapper untuk jawa
│   ├── Guestbook.jsx             ← Guestbook standalone (legacy)
│   └── themes/
│       ├── floral1.js            ← Config ornemen floral1
│       └── jawa.js               ← Config ornemen jawa
├── app/wim/
│   ├── floral1.css               ← CSS theme floral1
│   └── jawa.css                  ← CSS theme jawa
└── utils/
    ├── wimDataContract.js        ← Data model (Single Source of Truth)
    └── supabase.js               ← Supabase client
```

---

## Checklist Bikin Template Baru

- [ ] CSS file (`src/app/wim/[nama].css`)
- [ ] Theme config (`src/components/wim-baru/themes/[nama].js`)
- [ ] Component wrapper (`src/components/wim-baru/[Nama]Template.jsx`)
- [ ] Register di dashboard (`src/app/wim/dashboard/page.js`)
- [ ] Register di routing (`src/app/[slug]/page.js`)
- [ ] Test semua section tampil benar
- [ ] Test cover lock + unlock
- [ ] Test countdown timer
- [ ] Test guestbook submit + tampil
- [ ] Test scroll animation
