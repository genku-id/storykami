# CETAKAN Template Undangan StoryKami

Dokumen ini adalah **cetakan** yang saya pakai saat diminta bikin template baru.
Setiap template **mandiri** — semua logic, CSS, ornamen, struktur ada di dalam satu file.

---

## File yang Harus Dibuat

Untuk setiap template baru, buat:

```
src/components/wim-baru/[Nama]Template.jsx   ← Component mandiri (JSX + logic)
src/app/wim/[nama].css                       ← CSS lengkap untuk template ini
```

Lalu register di:
```
src/app/[slug]/page.js                       ← Tambah if condition untuk routing
src/app/wim/dashboard/page.js                ← Tambah option di TEMPLATE_OPTIONS
src/app/wim/dashboard/baru/page.js           ← Tambah option di template select
src/app/wim/dashboard/manage/[slug]/page.js  ← Tambah import + conditional render
```

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

## Logic Wajib (Harus Ada di Setiap Template)

```jsx
'use client';
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { defaultInvitationData } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';

export default function [Nama]Template({ data = defaultInvitationData, slug = 'test-slug', isVisible: isVisibleProp }) {
  const { mempelai, acara, kutipan, pageVisibility = {} } = data;

  // === STATE ===
  const [comments, setComments] = useState([]);
  const [namaTamu, setNamaTamu] = useState('');
  const [ucapan, setUcapan] = useState('');
  const [kehadiran, setKehadiran] = useState('Hadir');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, menit: 0, detik: 0 });

  // === COUNTDOWN ===
  useEffect(() => {
    const tanggalAcara = acara?.resepsi?.tanggal || acara?.akad?.tanggal;
    const waktuAcara = acara?.resepsi?.waktuMulai || acara?.akad?.waktuMulai || '00:00';
    if (!tanggalAcara) return;
    const targetDate = new Date(`${tanggalAcara}T${waktuAcara}:00`).getTime();
    if (isNaN(targetDate)) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hari: 0, jam: 0, menit: 0, detik: 0 });
      } else {
        setTimeLeft({
          hari: Math.floor(distance / (1000 * 60 * 60 * 24)),
          jam: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          menit: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          detik: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [acara]);

  // === GUESTBOOK FETCH ===
  useEffect(() => {
    const fetchComments = async () => {
      if (!slug) return;
      const { data: dbComments } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_slug', slug)
        .order('created_at', { ascending: false });
      if (dbComments) setComments(dbComments);
    };
    fetchComments();
  }, [slug]);

  // === SCROLL ANIMATION ===
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.1 });
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [pageVisibility, data, isLocked]);

  // === HANDLERS ===
  const handleKirimUcapan = async (e) => {
    e.preventDefault();
    if (!namaTamu || !ucapan) return;
    setIsSubmitting(true);
    const newComment = {
      invitation_slug: slug,
      nama: namaTamu,
      ucapan: ucapan,
      kehadiran: kehadiran
    };
    const { data: inserted, error } = await supabase
      .from('guestbook')
      .insert([newComment])
      .select();
    if (!error && inserted) {
      setComments(prev => [inserted[0], ...prev]);
      setNamaTamu('');
      setUcapan('');
    }
    setIsSubmitting(false);
  };

  const handleBukaUndangan = () => {
    setIsLocked(false);
    setIsPlaying(true);
  };

  const isVisible = (key) => {
    if (isVisibleProp) return isVisibleProp(key);
    return pageVisibility[key] ?? true;
  };

  // === RENDER ===
  return (
    <div className={`wim-template-[NAMA] ${isLocked ? 'locked' : ''}`} ...>
      {/* Font Awesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Audio Player (hidden) */}
      {data.musikUrl && ( ... ReactPlayer ... )}

      {/* 1. COVER SECTION */}
      {isVisible('cover') && (
        <section id="cover-page" ...>
          ... inisial, nama, tombol buka undangan ...
        </section>
      )}

      <main id="main-content" style={{ display: isLocked ? 'none' : 'block' }}>

        {/* 2. HERO SECTION */}
        {isVisible('hero') && ( ... )}

        {/* 3. PROFILES SECTION */}
        {isVisible('profiles') && ( ... )}

        {/* 4. QUOTE SECTION */}
        {isVisible('quote') && ( ... )}

        {/* 5. EVENTS SECTION */}
        {isVisible('events') && ( ... )}

        {/* 6. LOVE STORY SECTION */}
        {isVisible('loveStory') && data.ceritaCinta?.length > 0 && ( ... )}

        {/* 7. GIFT SECTION */}
        {isVisible('gift') && ( ... )}

        {/* 8. GUESTBOOK SECTION */}
        {isVisible('guestbook') && ( ... )}

        {/* 9. CLOSING SECTION */}
        {isVisible('closing') && ( ... )}

        {/* 10. FOOTER */}
        <footer ...> ... </footer>

      </main>
    </div>
  );
}
```

---

## Data Model

Semua template menggunakan data dari `wimDataContract.js`:

```js
{
  pageVisibility: { cover, hero, profiles, quote, events, loveStory, gift, guestbook, closing },
  mempelai: {
    pria:  { namaLengkap, namaPanggilan, namaAyah, namaIbu, urutanAnak, instagram, fotoUtama },
    wanita: { namaLengkap, namaPanggilan, namaAyah, namaIbu, urutanAnak, instagram, fotoUtama }
  },
  acara: {
    akad:    { tanggal, waktuMulai, waktuSelesai, zonaWaktu, lokasi, alamatLengkap, linkMap },
    resepsi: { tanggal, waktuMulai, waktuSelesai, zonaWaktu, lokasi, alamatLengkap, linkMap }
  },
  kutipan:    { teks, sumber },
  galeri:     [urls],
  ceritaCinta: [{ tanggal, judul, cerita }],
  hadiahDigital: {
    accounts: [{ name, number, owner, whatsapp }],
    physicalAddress, receiver, physicalWhatsapp
  },
  musikUrl: string,
  videoUrl: string,
}
```

---

## CSS Naming Convention

```
Root class:  .wim-template-[NAMA]
Cover:       .wim-template-[NAMA] .cover-page
Hero:        .wim-template-[NAMA] .hero-section
Profiles:    .wim-template-[NAMA] .profiles-section
Quote:       .wim-template-[NAMA] .quote-section
Events:      .wim-template-[NAMA] .events-section
Love Story:  .wim-template-[NAMA] .lovestory-section
Gift:        .wim-template-[NAMA] .gift-section
Guestbook:   .wim-template-[NAMA] .guestbook-section
Closing:     .wim-template-[NAMA] .closing-section
Footer:      .wim-template-[NAMA] .footer
```

---

## Checklist Bikin Template Baru

- [ ] Component JSX mandiri (`src/components/wim-baru/[Nama]Template.jsx`)
- [ ] CSS file sendiri (`src/app/wim/[nama].css`)
- [ ] Semua 10 section ada
- [ ] Semua logic wajib ada (state, countdown, guestbook, scroll animation, handlers)
- [ ] Import CSS di component: `import '@/app/wim/[nama].css'`
- [ ] Register di `[slug]/page.js`
- [ ] Register di `dashboard/page.js` (TEMPLATE_OPTIONS)
- [ ] Register di `dashboard/baru/page.js` (select options)
- [ ] Register di `dashboard/manage/[slug]/page.js` (import + conditional render)
- [ ] Test: cover lock/unlock
- [ ] Test: countdown timer
- [ ] Test: guestbook submit + tampil
- [ ] Test: semua section visible
- [ ] Test: scroll animation

---

## Referensi

Lihat `Floral1Template.jsx` dan `JawaTemplate.jsx` sebagai contoh template mandiri yang sudah jalan.
