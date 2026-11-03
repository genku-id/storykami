'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import JSZip from 'jszip';
import './albumkami.css';

export default function SharedAlbumPage() {
  const params = useParams();
  const slug = params?.slug || '';

  const [loading, setLoading] = useState(true);
  const [albumData, setAlbumData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [selectedContributor, setSelectedContributor] = useState('ALL');
  const [gridColumns, setGridColumns] = useState(2); // 2 col or 3 col toggle
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Lightbox Modal Index
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Fetch data galeri secara real-time dengan auto-refresh
  useEffect(() => {
    if (!slug) return;

    async function loadGallery(isInitial = false) {
      try {
        if (isInitial) setLoading(true);
        // 1. Fetch info album (selalu segar dengan cache buster)
        const infoRes = await fetch(`/api/album/${slug}/info/?_t=${Date.now()}`, { cache: 'no-store' });
        const info = await infoRes.json();
        if (info.album) setAlbumData(info.album);

        // 2. Fetch foto album (dengan URL proxy lokal agar kebal blokir DNS, selalu segar)
        const photosRes = await fetch(`/api/album/${slug}/photos/?_t=${Date.now()}`, { cache: 'no-store' });
        const pData = await photosRes.json();

        if (pData.photos) {
          setPhotos(pData.photos);
          setContributors(pData.contributors || []);
        }
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        if (isInitial) setLoading(false);
      }
    }

    loadGallery(true);

    // Auto-refresh galeri berkala setiap 4 detik agar foto baru langsung muncul otomatis untuk semua orang
    const pollInterval = setInterval(() => {
      loadGallery(false);
    }, 4000);

    // Refresh seketika saat pengguna kembali ke tab galeri
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadGallery(false);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleVisibility);
      }
    };
  }, [slug]);

  // Derived state (Ditempatkan di awal sebelum handlers & effects agar aman dari Temporal Dead Zone saat SSR)
  const filteredPhotos =
    selectedContributor === 'ALL'
      ? photos
      : photos.filter((p) => p.guest_name === selectedContributor);

  const albumTitle = albumData?.title || 'Awal dari Selamanya';
  const maxGuests = albumData?.max_guests || 50;
  const currentGuestsCount = Math.max(contributors.length, photos.length > 0 ? 1 : 0);

  const currentPhoto =
    activePhotoIndex !== null && filteredPhotos[activePhotoIndex]
      ? filteredPhotos[activePhotoIndex]
      : null;

  const handleNextPhoto = (e) => {
    e?.stopPropagation();
    if (activePhotoIndex !== null && filteredPhotos.length > 0) {
      setActivePhotoIndex((prev) => (prev < filteredPhotos.length - 1 ? prev + 1 : 0));
    }
  };

  const handlePrevPhoto = (e) => {
    e?.stopPropagation();
    if (activePhotoIndex !== null && filteredPhotos.length > 0) {
      setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : filteredPhotos.length - 1));
    }
  };

  // Keyboard navigation untuk Laptop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'Escape') setActivePhotoIndex(null);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activePhotoIndex, filteredPhotos.length]);

  const handleDownloadCurrent = async (e) => {
    e?.stopPropagation();
    if (!currentPhoto) return;
    try {
      const res = await fetch(currentPhoto.r2_image_url);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanName = (currentPhoto.guest_name || 'tamu').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `foto_${cleanName}_${currentPhoto.id.slice(0, 6)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.open(currentPhoto.r2_image_url, '_blank');
      }
    }
  };

  const handleShareCurrent = async (e) => {
    e?.stopPropagation();
    if (!currentPhoto) return;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: `Foto ${currentPhoto.guest_name || 'Tamu'} • ${albumTitle}`,
      text: `Momen seru dari ${currentPhoto.guest_name || 'Tamu'} di Album Pernikahan!`,
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert('Tautan foto album berhasil disalin!');
    }
  };

  const handleDeleteCurrent = async (e) => {
    e?.stopPropagation();
    if (!currentPhoto) return;
    if (typeof window !== 'undefined' && !window.confirm(`Hapus foto dari "${currentPhoto.guest_name}" ini dari galeri album?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/album/${slug}/delete-photo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: currentPhoto.id }),
      });
      const data = await res.json();
      if (data.success) {
        const remaining = photos.filter((p) => p.id !== currentPhoto.id);
        setPhotos(remaining);
        if (remaining.length === 0) {
          setActivePhotoIndex(null);
        } else if (activePhotoIndex >= remaining.length) {
          setActivePhotoIndex(remaining.length - 1);
        }
      } else {
        alert(data.error || 'Gagal menghapus foto');
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk menghapus foto');
    }
  };

  // Unduh Semua Foto sebagai ZIP
  const handleDownloadAllZip = async () => {
    if (!photos || photos.length === 0 || isZipping) {
      alert('Belum ada foto yang bisa diunduh');
      return;
    }

    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`albumkami-${slug}`);

      let completed = 0;
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        try {
          const res = await fetch(p.r2_image_url);
          const blob = await res.blob();
          const cleanName = (p.guest_name || 'tamu').replace(/[^a-zA-Z0-9]/g, '_');
          const ext = p.r2_key?.endsWith('.jpg') || p.r2_key?.endsWith('.jpeg') || blob.type === 'image/jpeg' ? 'jpg' : (p.r2_key?.endsWith('.png') ? 'png' : 'webp');
          folder.file(`${i + 1}_${cleanName}_${p.id.slice(0, 6)}.${ext}`, blob);
        } catch (fetchErr) {
          console.warn('Failed to add photo to zip:', p.r2_image_url);
        }
        completed++;
        setZipProgress(Math.round((completed / photos.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `AlbumKami-${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Gagal mendownload ZIP: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12110f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="block h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70 mb-3" />
        <p className="font-film text-xs uppercase tracking-widest text-white/50">Memuat album...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a09] text-white selection:bg-white selection:text-black">
      {/* Ambient background glow di laptop */}
      <div
        className="hidden md:block fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(226,160,122,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Frame Mobile Centered Shell (Konsisten Rapi di HP maupun Laptop) */}
      <div className="relative mx-auto w-full max-w-[480px] min-h-[100svh] bg-[#12110f] border-x border-white/5 shadow-2xl pb-24">
        
        {/* HERO COVER IMAGE */}
        <div className="relative h-[44vh] min-h-[270px] max-h-[360px] overflow-hidden">
          <img
            src="/images/satualbum_cover.webp"
            alt={albumTitle}
            className="w-full h-full object-cover"
          />
          {/* Smooth Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#12110f]" />

          {/* Top Floating Buttons */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-12 z-20">
            <Link
              href={`/${slug}`}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
              title="Kembali ke Undangan"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
              </svg>
            </Link>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
              title="Pengaturan Album"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="px-5 -mt-4 relative z-10 text-center">
          
          {/* Main Title */}
          <h1 className="mb-5">
            <span className="font-serif font-bold text-white text-center block leading-tight tracking-tight text-[26px]">
              {albumTitle}
            </span>
          </h1>

          {/* 3 STATS COLUMNS WITH VERTICAL DIVIDERS */}
          <div className="flex justify-around items-center mb-6 py-1">
            {/* Col 1: Momen */}
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <span className="font-serif text-[26px] font-bold text-white italic leading-none">
                {photos.length}
              </span>
              <span className="text-[#888888] text-[11px] font-sans">Momen</span>
            </div>

            <div className="w-px h-8 bg-[#2a2a2a]" />

            {/* Col 2: Tersisa */}
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <span className="font-serif text-[26px] font-bold text-white italic leading-none">
                27d 4h
              </span>
              <span className="text-[#888888] text-[11px] font-sans">Tersisa</span>
            </div>

            <div className="w-px h-8 bg-[#2a2a2a]" />

            {/* Col 3: Orang */}
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <div className="flex items-baseline gap-0.5 leading-none">
                <span className="font-serif text-[26px] font-bold text-white italic">
                  {currentGuestsCount}
                </span>
                <span className="text-white/30 text-[13px] font-medium font-sans">
                  /{maxGuests}
                </span>
              </div>
              <span className="text-[#888888] text-[11px] font-sans">Orang &gt;</span>
            </div>
          </div>

          {/* 4 ACTION BUTTONS ROW (Presisi Sesuai Screenshot WhatsApp) */}
          <div className="flex items-center gap-2.5 mb-6">
            {/* 1. Big Creamy White Pill Button: Open Camera (Background Putih -> Ikon Hitam) */}
            <Link
              href={`/${slug}/albumkami/cam`}
              className="flex-1 h-14 bg-[#f2ece4] hover:bg-white text-black rounded-2xl flex items-center justify-center active:scale-[0.97] transition-all shadow-xl"
              title="Buka Kamera Tamu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#12110f"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-black stroke-black"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </Link>

            {/* 2. QR Code Button (Background Gelap -> Ikon Putih) */}
            <Link
              href={`/${slug}/albumkami/print-qr`}
              className="w-14 h-14 bg-[#161616] border border-[#2a2a2a] hover:border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-[0.97] transition-all"
              title="Cetak & Tampilkan QR Meja"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white stroke-white"
              >
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
            </Link>

            {/* 3. Grid Toggle Button (Background Gelap -> Ikon Putih) */}
            <button
              onClick={() => setGridColumns((prev) => (prev === 2 ? 3 : 2))}
              className="w-14 h-14 bg-[#161616] border border-[#2a2a2a] hover:border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-[0.97] transition-all"
              title="Ubah Ukuran Grid"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white stroke-white"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </button>

            {/* 4. Download All (ZIP) Button (Background Gelap -> Ikon Putih) */}
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="w-14 h-14 bg-[#161616] border border-[#2a2a2a] hover:border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-[0.97] transition-all disabled:opacity-50"
              title="Unduh Semua Foto (ZIP)"
            >
              {isZipping ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white stroke-white"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
              )}
            </button>
          </div>

          {/* FILTER CONTRIBUTORS BAR */}
          {photos.length > 0 && contributors.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
              <button
                onClick={() => setSelectedContributor('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs font-film transition-colors whitespace-nowrap ${
                  selectedContributor === 'ALL'
                    ? 'bg-white text-black font-bold'
                    : 'bg-white/[0.05] text-white/60 hover:text-white border border-white/10'
                }`}
              >
                Semua ({photos.length})
              </button>
              {contributors.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedContributor(name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-film transition-colors whitespace-nowrap ${
                    selectedContributor === name
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.05] text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* PHOTO GALLERY GRID */}
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-16 bg-[#161616] border border-[#2a2a2a] rounded-3xl p-6">
              <span className="text-3xl mb-2 block">📷</span>
              <h3 className="font-serif text-base font-bold text-white mb-1">Belum Ada Momen</h3>
              <p className="text-xs text-white/40 mb-5">
                Tekan tombol kamera di atas untuk mengambil foto pertama dengan preset film vintage!
              </p>
              <Link
                href={`/${slug}/albumkami/cam`}
                className="inline-flex items-center gap-2 bg-[#f2ece4] text-[#12110f] font-semibold px-5 py-2.5 rounded-xl text-xs shadow-lg hover:bg-white transition-colors"
              >
                <span>Buka Kamera Sekarang</span>
              </Link>
            </div>
          ) : (
            <div
              className={`grid gap-2.5 ${
                gridColumns === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {filteredPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhotoIndex(idx)}
                  className="group relative overflow-hidden aspect-square rounded-2xl bg-[#1c1c1a] border border-white/5 cursor-pointer active:scale-95 transition-transform"
                >
                  <img
                    src={photo.r2_thumb_url || photo.r2_image_url}
                    alt={photo.guest_name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (photo.r2_image_url && e.currentTarget.src !== photo.r2_image_url) {
                        e.currentTarget.src = photo.r2_image_url;
                      }
                    }}
                  />
                  {/* Gradient shadow overlay for guest name tag */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-2.5 left-2.5 text-[11px] font-sans text-white font-medium truncate max-w-[85%] drop-shadow">
                    {photo.guest_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX MODAL (Presisi 100% Identik Screenshot Host 2/3) */}
      {currentPhoto && (
        <div
          onClick={() => setActivePhotoIndex(null)}
          className="fixed inset-0 z-50 bg-[#000000] flex flex-col md:items-center md:justify-center p-0 select-none overflow-hidden anim-slide-up"
        >
          {/* Mobile Frame Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full flex flex-col md:max-w-[480px] md:h-[95vh] md:rounded-[36px] md:overflow-hidden md:border md:border-white/10 md:shadow-2xl bg-[#000000] relative px-4 py-3"
          >
            {/* 1. TOP BAR */}
            <div className="flex items-center justify-between pt-8 pb-2 px-2 flex-shrink-0 z-20">
              <div className="flex items-baseline gap-2">
                <span className="text-white text-[19px] font-bold tracking-tight font-sans">
                  {currentPhoto.guest_name || 'Tamu'}
                </span>
                <span className="text-[#777777] font-mono text-[14px]">
                  {activePhotoIndex + 1} / {filteredPhotos.length}
                </span>
              </div>

              <button
                onClick={() => setActivePhotoIndex(null)}
                className="w-11 h-11 rounded-[16px] bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                title="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* 2. MIDDLE PHOTO CONTAINER WITH LEFT & RIGHT ARROWS */}
            <div className="relative flex-1 rounded-[30px] overflow-hidden bg-[#0a0a0a] border border-white/10 flex items-center justify-center my-2 shadow-2xl">
              <img
                src={currentPhoto.r2_image_url}
                alt={currentPhoto.guest_name}
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Tombol Panah Kiri */}
              {filteredPhotos.length > 1 && (
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl z-10"
                  title="Foto Sebelumnya"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
              )}

              {/* Tombol Panah Kanan */}
              {filteredPhotos.length > 1 && (
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl z-10"
                  title="Foto Berikutnya"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              )}
            </div>

            {/* 3. BOTTOM ACTIONS (4 Tombol Bulat Identik Screenshot) */}
            <div className="flex items-center justify-center gap-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] flex-shrink-0 z-20">
              
              {/* Tombol 1: Instagram / Camera View */}
              <button
                onClick={handleShareCurrent}
                className="w-[54px] h-[54px] rounded-full bg-[#1e1e1e] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
                title="Bagikan ke Instagram / Story"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </button>

              {/* Tombol 2: Unduh Resolusi Asli */}
              <button
                onClick={handleDownloadCurrent}
                className="w-[54px] h-[54px] rounded-full bg-[#1e1e1e] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
                title="Unduh Resolusi Asli"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </button>

              {/* Tombol 3: Bagikan / Share (Bulat Putih Menonjol di Tengah) */}
              <button
                onClick={handleShareCurrent}
                className="w-[62px] h-[62px] rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-transform shadow-2xl"
                title="Bagikan Tautan Foto"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
                  <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                </svg>
              </button>

              {/* Tombol 4: Hapus Foto (Bulat Merah Marun) */}
              <button
                onClick={handleDeleteCurrent}
                className="w-[54px] h-[54px] rounded-full bg-[#7a1c1c] hover:bg-[#8e2222] border border-red-500/25 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
                title="Hapus Foto dari Galeri"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" x2="10" y1="11" y2="17"/>
                  <line x1="14" x2="14" y1="11" y2="17"/>
                </svg>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* SETTINGS / INFO MODAL */}
      {showSettingsModal && (
        <div
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 anim-slide-up"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#161616] border border-white/10 rounded-t-[32px] md:rounded-[32px] p-6 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <h3 className="font-serif text-lg font-bold mb-3">Pengaturan Acara</h3>
            <p className="text-xs text-white/50 mb-5 leading-relaxed">
              Album ini terhubung dengan undangan pernikahan <strong>{slug}</strong>.
            </p>

            <div className="space-y-3 mb-6 text-sm font-sans">
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <span className="text-white/50">Kapasitas Tamu</span>
                <span className="font-medium text-white">{maxGuests} Tamu</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <span className="text-white/50">Batas Rol per Tamu</span>
                <span className="font-medium text-white">{albumData?.roll_limit || 10} Jepretan</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5">
                <span className="text-white/50">Storage Provider</span>
                <span className="font-medium text-emerald-400">Cloudflare R2</span>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-neutral-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
