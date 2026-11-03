'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import JSZip from 'jszip';
import './albumkami.css';

export default function SharedAlbumPage() {
  const params = useParams();
  const slug = params?.slug || '';

  const [photos, setPhotos] = useState([]);
  const [albumData, setAlbumData] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContributor, setSelectedContributor] = useState('ALL');
  const [gridColumns, setGridColumns] = useState(2); // 2 col or 3 col toggle
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [origin, setOrigin] = useState('');

  // Settings Toggles State (Screenshot 1: Pengaturan Acara)
  const [allowPublicView, setAllowPublicView] = useState(true);
  const [hideUploaderName, setHideUploaderName] = useState(false);
  const [enableLikes, setEnableLikes] = useState(false);
  const [emailReminder, setEmailReminder] = useState(false);

  // Lightbox Modal Index
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // SWR: Baca cache lokal seketika (0 milidetik, tanpa spinner jika sudah pernah dibuka)
  useEffect(() => {
    if (!slug) return;

    try {
      const cachedPhotos = localStorage.getItem(`storykami_cache_${slug}_photos`);
      const cachedInfo = localStorage.getItem(`storykami_cache_${slug}_info`);
      if (cachedPhotos) {
        const parsed = JSON.parse(cachedPhotos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhotos(parsed);
          setContributors(Array.from(new Set(parsed.map((p) => p.guest_name).filter(Boolean))));
          setLoading(false); // Instan tanpa delay!
        }
      }
      if (cachedInfo) {
        setAlbumData(JSON.parse(cachedInfo));
      }
    } catch (e) {}

    // Fetch data galeri secara paralel (Promise.all) agar 2x lebih cepat
    async function loadGallery(silent = false) {
      try {
        if (!silent && photos.length === 0) setLoading(true);

        const [infoRes, photosRes] = await Promise.all([
          fetch(`/api/album/${slug}/info/`, { cache: 'no-store' }),
          fetch(`/api/album/${slug}/photos/`, { cache: 'no-store' }),
        ]);

        const info = await infoRes.json();
        const pData = await photosRes.json();

        if (info.album) {
          setAlbumData(info.album);
          try {
            localStorage.setItem(`storykami_cache_${slug}_info`, JSON.stringify(info.album));
          } catch (e) {}
        }

        if (pData.photos) {
          setPhotos(pData.photos);
          setContributors(pData.contributors || []);
          try {
            localStorage.setItem(`storykami_cache_${slug}_photos`, JSON.stringify(pData.photos));
          } catch (e) {}
        }
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGallery(false);

    // Auto-refresh galeri berkala setiap 4 detik secara silent di background
    const pollInterval = setInterval(() => {
      loadGallery(true);
    }, 4000);

    // Refresh seketika saat pengguna kembali ke tab galeri
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadGallery(true);
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
    const shareUrl = typeof window !== 'undefined' ? (currentPhoto ? `${window.location.origin}/${slug}/albumkami/` : window.location.href) : '';
    const shareData = {
      title: currentPhoto ? `Foto ${currentPhoto.guest_name || 'Tamu'} • ${albumTitle}` : albumTitle,
      text: currentPhoto
        ? `Momen seru dari ${currentPhoto.guest_name || 'Tamu'} di Album Pernikahan!`
        : `Yuk abadikan momen terbaikmu di ${albumTitle}!`,
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert('Tautan album berhasil disalin!');
    }
  };

  const albumShareUrl = origin ? `${origin}/${slug}/albumkami/` : `https://storykami.my.id/${slug}/albumkami/`;

  const handleDownloadQr = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&margin=15&data=${encodeURIComponent(albumShareUrl)}`;
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `QR_AlbumKami_${slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      alert('Gagal mengunduh QR, Anda bisa melakukan screenshot kartu QR ini.');
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
        try {
          localStorage.setItem(`storykami_cache_${slug}_photos`, JSON.stringify(remaining));
        } catch (e) {}
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
              href={`/${slug}/albumkami/cam/`}
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

            {/* 2. QR Code Button: Tampilkan Modal Undang Tamu (Identik Screenshot 2) */}
            <button
              onClick={() => setShowQrModal(true)}
              className="w-14 h-14 bg-[#161616] border border-[#2a2a2a] hover:border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-[0.97] transition-all shadow-md"
              title="Undang Tamu & Tampilkan QR"
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
            </button>

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
                href={`/${slug}/albumkami/cam/`}
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
                    decoding="async"
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

      {/* ========================================================================= */}
      {/* 1. MODAL UNDANG TAMU & TAMPILKAN QR (Presisi 100% Identik Screenshot 2)   */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#131313] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl relative"
          >
            {/* Drag Handle Bar */}
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-white/20" />

            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="font-serif text-[24px] font-bold text-white tracking-tight leading-snug">
                Undang tamu ke acaramu.
              </h2>
              <div className="text-[13px] text-white/50 space-y-0.5 mt-2 leading-relaxed">
                <p>Lihat dunia dari sudut pandang mereka.</p>
                <p>Undang tamumu untuk membuat acara ini tak terlupakan.</p>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="w-full h-px bg-white/10 my-5" />

            {/* Cream QR Card Container */}
            <div className="mx-auto w-[240px] h-[240px] bg-[#ede7de] rounded-[32px] p-5 shadow-2xl flex items-center justify-center mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&margin=12&data=${encodeURIComponent(albumShareUrl)}`}
                alt="QR Code Tamu"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary: Kirim ke WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Yuk abadikan dan bagikan momen seru kamu di ${albumTitle}! Jepret foto langsung dari kamera tamu di link berikut:\n\n${albumShareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[54px] rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.33 7.34 9.13 7.35 8.97 7.63C8.78 7.96 8.21 8.5 8.21 9.58C8.21 10.66 9 11.7 9.12 11.86C9.25 12.03 10.65 14.18 12.8 15.11C14.59 15.88 14.95 15.73 15.36 15.69C15.78 15.65 16.71 15.14 16.91 14.59C17.11 14.04 17.11 13.56 17.05 13.47C16.99 13.37 16.84 13.31 16.61 13.2C16.38 13.08 15.26 12.53 15.05 12.45C14.85 12.37 14.7 12.33 14.56 12.56C14.39 12.82 13.97 13.31 13.85 13.45C13.72 13.6 13.59 13.62 13.36 13.5C13.13 13.39 12.39 13.15 11.51 12.37C10.83 11.76 10.37 11.01 10.24 10.78C10.11 10.55 10.22 10.43 10.34 10.31C10.44 10.21 10.57 10.04 10.69 9.9C10.8 9.77 10.84 9.67 10.92 9.5C11 9.34 10.95 9.19 10.89 9.07C10.83 8.95 10.35 7.78 10.15 7.31C9.96 6.85 9.76 6.91 9.61 6.91C9.47 6.91 9.33 6.91 9.19 6.91L9.53 7.34Z"/>
                </svg>
                <span>Kirim ke WhatsApp</span>
              </a>

              {/* Grid 2 Tombol: Bagikan Tautan & Simpan QR */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShareCurrent}
                  className="h-[50px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/10 rounded-2xl font-medium text-white text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <span>Bagikan Tautan</span>
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="h-[50px] bg-[#222222] hover:bg-[#2a2a2a] border border-white/10 rounded-2xl font-medium text-white text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Simpan QR</span>
                </button>
              </div>

              {/* Link ke Cetak Kartu Meja */}
              <div className="pt-2 text-center">
                <Link
                  href={`/${slug}/albumkami/print-qr/`}
                  className="text-xs font-mono text-white/40 hover:text-white transition-colors"
                >
                  🖨️ Cetak Kartu Meja Fisik (PDF / Print) →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PENGATURAN ACARA (Presisi 100% Identik Screenshot 1)                     */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-[#0e0e0e] text-white overflow-y-auto selection:bg-white selection:text-black anim-slide-up">
          <div className="relative mx-auto w-full max-w-[480px] min-h-screen bg-[#0e0e0e] border-x border-white/5 shadow-2xl pb-16">
            
            {/* Top Blurred Cover Header */}
            <div className="relative h-44 overflow-hidden">
              <img
                src="/images/satualbum_cover.webp"
                alt={albumTitle}
                className="w-full h-full object-cover filter blur-[6px] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-[#0e0e0e]" />

              {/* Back Button */}
              <div className="absolute top-10 left-4 z-20">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
                  title="Kembali ke Galeri"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="px-5 -mt-6 relative z-10 mb-4">
              <h1 className="font-serif text-[28px] font-bold text-white tracking-tight">
                Pengaturan Acara
              </h1>
            </div>

            {/* List of Settings Cards */}
            <div className="px-4 space-y-2.5">
              
              {/* 1. Nama & Sampul */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">✏️</span>
                  <span className="font-medium text-white">Nama & Sampul</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span className="truncate max-w-[140px] text-white/70">{albumTitle}</span>
                  <span>›</span>
                </div>
              </div>

              {/* 2. Tanggal berakhir */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">📅</span>
                  <span className="font-medium text-white">Tanggal berakhir</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>30 Nov 2026, 17.00</span>
                  <span>›</span>
                </div>
              </div>

              {/* 3. Waktu ungkap */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">🕒</span>
                  <span className="font-medium text-white">Waktu ungkap</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>Selama Acara</span>
                  <span>›</span>
                </div>
              </div>

              {/* 4. Foto per orang */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">📷</span>
                  <span className="font-medium text-white">Foto per orang</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>{albumData?.roll_limit || 10}</span>
                  <span>›</span>
                </div>
              </div>

              {/* 5. Filter kamera */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">⚙️</span>
                  <span className="font-medium text-white">Filter kamera</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>Asli</span>
                  <span>›</span>
                </div>
              </div>

              {/* 6. Bingkai foto */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">🔲</span>
                  <span className="font-medium text-white">Bingkai foto</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>Tanpa</span>
                  <span>›</span>
                </div>
              </div>

              {/* 7. Tautan khusus */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">🔗</span>
                  <span className="font-medium text-white">Tautan khusus</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>Buat tautan khusus</span>
                  <span>›</span>
                </div>
              </div>

              {/* 8. Bahasa default acara */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white/40">🌐</span>
                  <span className="font-medium text-white">Bahasa default acara</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>Bahasa Indonesia</span>
                  <span>›</span>
                </div>
              </div>

              {/* 9. Kapasitas tamu */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">👥</span>
                    <span className="font-medium text-white">Kapasitas tamu</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1 pl-7">
                    Hingga {maxGuests} Tamu • Paket gratis dibatasi 5 tamu
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-[#1c3a5e] text-sky-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-sky-500/20 active:scale-95 transition-transform"
                >
                  Tambah pax ›
                </button>
              </div>

              {/* 10. Toggle: Semua orang bisa melihat semua foto */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">👁️</span>
                    <span className="font-medium text-white text-sm">Semua orang bisa melihat semua foto</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowPublicView(!allowPublicView)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      allowPublicView ? 'bg-[#3b82f6]' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        allowPublicView ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-white/40 pl-7 leading-relaxed">
                  Aktifkan agar siapa pun dengan link bisa melihat semua foto. Nonaktifkan agar hanya kamu dan tamu undangan yang bisa melihat — tamu tetap hanya melihat foto miliknya.
                </p>
              </div>

              {/* 11. Toggle: Sembunyikan nama pengunggah */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">👁️‍🗨️</span>
                    <span className="font-medium text-white text-sm">Sembunyikan nama pengunggah</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHideUploaderName(!hideUploaderName)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      hideUploaderName ? 'bg-[#3b82f6]' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        hideUploaderName ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-white/40 pl-7 leading-relaxed">
                  Untuk penjurian buta — sembunyikan nama semua orang saat memilih favorit.
                </p>
              </div>

              {/* 12. Toggle: Like foto */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">❤️</span>
                    <span className="font-medium text-white text-sm">Like foto</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableLikes(!enableLikes)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      enableLikes ? 'bg-[#3b82f6]' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        enableLikes ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-white/40 pl-7 leading-relaxed">
                  Pengunjung dan tamu dapat menyukai setiap foto satu kali. Matikan untuk menyembunyikan tombol like dan jumlahnya dari semua orang.
                </p>
              </div>

              {/* 13. Toggle: Ingatkan H-2 lewat email */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">🔔</span>
                    <span className="font-medium text-white text-sm">Ingatkan H-2 lewat email</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailReminder(!emailReminder)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      emailReminder ? 'bg-[#3b82f6]' : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        emailReminder ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-white/40 pl-7 leading-relaxed">
                  <span className="text-sky-400 hover:underline cursor-pointer">Simpan akun dulu</span> supaya kami punya alamat email.
                </p>
              </div>

              {/* 14. Danger Button: Hapus Acara */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus acara ini beserta seluruh fotonya?')) {
                      alert('Acara ini terhubung dengan undangan pernikahan utama Anda.');
                    }
                  }}
                  className="w-full py-4 rounded-2xl bg-[#241313] hover:bg-[#321717] border border-red-500/20 text-[#ef4444] font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  <span>Hapus acara</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
