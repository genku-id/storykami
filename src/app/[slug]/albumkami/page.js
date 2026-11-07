'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false);
  const [origin, setOrigin] = useState('');

  // Settings Toggles State (Screenshot 1: Pengaturan Acara)
  const [allowPublicView, setAllowPublicView] = useState(true);
  const [hideUploaderName, setHideUploaderName] = useState(false);
  const [enableLikes, setEnableLikes] = useState(false);
  const [emailReminder, setEmailReminder] = useState(false);

  // Lightbox Modal Index & Actions State
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Host & Guest Onboarding State
  const [isHost, setIsHost] = useState(false);
  const [showHostSetupModal, setShowHostSetupModal] = useState(false);
  const [hostAlbumTitleInput, setHostAlbumTitleInput] = useState('');
  const [hostRollLimitInput, setHostRollLimitInput] = useState(10);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Guest Onboarding Modal State
  const [showGuestNameModal, setShowGuestNameModal] = useState(false);
  const [guestInputName, setGuestInputName] = useState('');

  // Sub-modals for settings
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [showEditRollLimitModal, setShowEditRollLimitModal] = useState(false);
  const [showEditCapacityModal, setShowEditCapacityModal] = useState(false);
  const [showEditRevealModal, setShowEditRevealModal] = useState(false);
  const [showDeletePhotoConfirmModal, setShowDeletePhotoConfirmModal] = useState(false);
  const [showDeleteAlbumConfirmModal, setShowDeleteAlbumConfirmModal] = useState(false);

  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Buka lightbox otomatis jika ada query parameter ?photo=...
  useEffect(() => {
    if (typeof window !== 'undefined' && photos.length > 0 && activePhotoIndex === null) {
      const urlParams = new URLSearchParams(window.location.search);
      const photoParam = urlParams.get('photo');
      if (photoParam) {
        const foundIdx = photos.findIndex(
          (p) => p.id === photoParam || p.r2_key === photoParam || (p.r2_key && p.r2_key.includes(photoParam))
        );
        if (foundIdx !== -1) {
          setActivePhotoIndex(foundIdx);
        }
      }
    }
  }, [photos, activePhotoIndex]);

  // Fetch data galeri secara paralel (Promise.all) agar 2x lebih cepat
  const loadGallery = useCallback(async (silent = false) => {
    if (!slug) return;
    try {
      if (!silent && !hasLoadedOnce.current) setLoading(true);

      const timestamp = Date.now();
      const [infoRes, photosRes] = await Promise.all([
        fetch(`/api/album/${slug}/info/?_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/album/${slug}/photos/?_t=${timestamp}`, { cache: 'no-store' }),
      ]);

      const info = await infoRes.json();
      const pData = await photosRes.json();

      if (info.album) {
        setAlbumData(info.album);
        if (info.album.settings) {
          if (info.album.settings.allow_public_view !== undefined) setAllowPublicView(info.album.settings.allow_public_view);
          if (info.album.settings.hide_uploader_name !== undefined) setHideUploaderName(info.album.settings.hide_uploader_name);
          if (info.album.settings.enable_likes !== undefined) setEnableLikes(info.album.settings.enable_likes);
          if (info.album.settings.email_reminder !== undefined) setEmailReminder(info.album.settings.email_reminder);
        }
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
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

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
          hasLoadedOnce.current = true;
        }
      }
      if (cachedInfo) {
        setAlbumData(JSON.parse(cachedInfo));
      }
    } catch (e) {}

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
  }, [slug, loadGallery]);

  // Deteksi status Host vs Tamu & Tampilkan popup yang sesuai
  useEffect(() => {
    if (typeof window === 'undefined' || !slug) return;

    // Bersihkan legacy host flag di localStorage agar tidak bocor ke tamu
    try {
      localStorage.removeItem(`storykami_is_host_${slug}`);
    } catch (e) {}

    const urlParams = new URLSearchParams(window.location.search);
    // Tombol pengaturan dan mode host HANYA jika ada parameter URL ?from=wim
    const fromWim = urlParams.get('from') === 'wim';
    setIsHost(fromWim);

    if (fromWim) {
      const setupShown = sessionStorage.getItem(`storykami_host_setup_shown_${slug}`);
      if (!setupShown) {
        setShowHostSetupModal(true);
      }
    } else {
      // Pengunjung adalah TAMU: Cek apakah nama sudah tersimpan di localStorage
      const savedGuestName = localStorage.getItem('storykami_guest_name');
      if (!savedGuestName) {
        setShowGuestNameModal(true);
      }
    }
  }, [slug]);

  // Sinkronisasi data album ke input form host
  useEffect(() => {
    if (albumData?.title && !hostAlbumTitleInput) {
      setHostAlbumTitleInput(albumData.title);
    }
    if (albumData?.roll_limit) {
      setHostRollLimitInput(albumData.roll_limit);
    }
  }, [albumData, hostAlbumTitleInput]);

  // Helper untuk token device tamu
  const getOrCreateDeviceToken = () => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('storykami_device_token');
    if (!token) {
      token = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('storykami_device_token', token);
    }
    return token;
  };

  // Simpan nama tamu dari modal selamat datang
  const handleSaveGuestName = async (nameToSave) => {
    const finalName = (nameToSave !== undefined ? nameToSave : guestInputName).trim() || 'Tamu';
    localStorage.setItem('storykami_guest_name', finalName);
    setShowGuestNameModal(false);
    setToastMessage(`✓ Selamat datang, ${finalName}!`);
    setTimeout(() => setToastMessage(null), 3000);

    // Daftarkan sesi tamu ke server di background
    try {
      const deviceToken = getOrCreateDeviceToken();
      await fetch(`/api/album/${slug}/session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: finalName,
          device_token: deviceToken,
        }),
      });
    } catch (e) {}
  };

  // Simpan pengaturan album ke backend Supabase
  const saveSetting = async (updates) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/album/${slug}/settings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.album) {
        setAlbumData((prev) => ({
          ...prev,
          ...data.album,
        }));
        try {
          const cached = localStorage.getItem(`storykami_cache_${slug}_info`);
          if (cached) {
            const parsed = JSON.parse(cached);
            localStorage.setItem(
              `storykami_cache_${slug}_info`,
              JSON.stringify({ ...parsed, ...data.album })
            );
          }
        } catch (e) {}
        setToastMessage('✓ Pengaturan album berhasil disimpan');
        setTimeout(() => setToastMessage(null), 3000);
        return true;
      } else {
        setToastMessage('✕ Gagal menyimpan: ' + (data.error || 'Terjadi kesalahan'));
        setTimeout(() => setToastMessage(null), 3500);
        return false;
      }
    } catch (err) {
      setToastMessage('✕ Gagal menghubungi server');
      setTimeout(() => setToastMessage(null), 3500);
      return false;
    } finally {
      setIsSavingSettings(false);
    }
  };

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
    const shareUrl = typeof window !== 'undefined'
      ? (currentPhoto
          ? `${window.location.origin}/${slug}/albumkami/?photo=${encodeURIComponent(currentPhoto.id)}`
          : `${window.location.origin}/${slug}/albumkami/`)
      : '';
    const shareData = {
      title: currentPhoto ? `Foto ${currentPhoto.guest_name || 'Tamu'} • ${albumTitle}` : albumTitle,
      text: currentPhoto
        ? `Lihat momen dari ${currentPhoto.guest_name || 'Tamu'} di ${albumTitle}!`
        : `Yuk abadikan momen terbaikmu di ${albumTitle}!`,
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setToastMessage('✓ Tautan langsung foto berhasil disalin!');
      setTimeout(() => setToastMessage(null), 3000);
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
      setToastMessage('✕ Gagal mengunduh QR, Anda bisa screenshot kartu QR ini');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDeleteCurrent = (e) => {
    e?.stopPropagation();
    if (!currentPhoto || isDeleting) return;
    setShowDeletePhotoConfirmModal(true);
  };

  const confirmDeletePhotoAction = async () => {
    if (!currentPhoto || isDeleting) return;
    setIsDeleting(true);
    setShowDeletePhotoConfirmModal(false);
    const photoToDelete = currentPhoto;

    try {
      const res = await fetch(`/api/album/${slug}/delete-photo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: photoToDelete.id,
          r2_key: photoToDelete.r2_key,
          r2_image_url: photoToDelete.r2_image_url,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Hapus seketika dari state photos
        setPhotos((prev) => {
          const next = prev.filter(
            (p) =>
              p.id !== photoToDelete.id &&
              (!photoToDelete.r2_key || p.r2_key !== photoToDelete.r2_key) &&
              (!photoToDelete.r2_image_url || p.r2_image_url !== photoToDelete.r2_image_url)
          );
          try {
            localStorage.setItem(`storykami_cache_${slug}_photos`, JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        // Tampilkan feedback toast
        setToastMessage('✓ Foto berhasil dihapus');
        setTimeout(() => setToastMessage(null), 3000);

        // Jika foto habis, tutup lightbox. Jika masih ada, sesuaikan index.
        const remainingCount = filteredPhotos.filter(
          (p) =>
            p.id !== photoToDelete.id &&
            (!photoToDelete.r2_key || p.r2_key !== photoToDelete.r2_key)
        ).length;

        if (remainingCount <= 0) {
          setActivePhotoIndex(null);
        } else if (activePhotoIndex >= remainingCount) {
          setActivePhotoIndex(remainingCount - 1);
        }

        // Sinkronisasi data ke server di background
        loadGallery(true);
      } else {
        setToastMessage('✕ ' + (data.error || 'Gagal menghapus foto'));
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Delete photo error:', err);
      setToastMessage('✕ Gagal menghubungi server untuk menghapus foto');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsDeleting(false);
    }
  };

  // Unduh Semua Foto sebagai ZIP
  const handleDownloadAllZip = async () => {
    if (!photos || photos.length === 0 || isZipping) {
      setToastMessage('✕ Belum ada foto yang bisa diunduh');
      setTimeout(() => setToastMessage(null), 3000);
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
      setToastMessage('✕ Gagal mengunduh ZIP: ' + err.message);
      setTimeout(() => setToastMessage(null), 3500);
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
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-neutral-900/95 backdrop-blur-md text-white border border-white/20 px-5 py-2.5 rounded-full text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

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

            {/* Tombol Pengaturan HANYA MUNCUL JIKA Host Masuk dari WIM */}
            {isHost && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
                title="Pengaturan Album (Host)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            )}
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

            {/* Col 2: Tanggal Acara (Dari Undangan WIM) */}
            <div className="flex flex-col items-center gap-0.5 flex-1">
              <span className="font-serif text-[20px] md:text-[22px] font-bold text-white italic leading-none whitespace-nowrap">
                {albumData?.event_date_formatted || '22 Nov 2026'}
              </span>
              <span className="text-[#888888] text-[11px] font-sans">Tanggal Acara</span>
            </div>

            <div className="w-px h-8 bg-[#2a2a2a]" />

            {/* Col 3: Orang (Bisa diklik membuka popup nama pengisi foto) */}
            <button
              onClick={() => setShowContributorsModal(true)}
              className="flex flex-col items-center gap-0.5 flex-1 cursor-pointer active:scale-95 transition-transform group"
              title="Lihat Tamu Pengisi Album"
            >
              <div className="flex items-baseline gap-0.5 leading-none">
                <span className="font-serif text-[26px] font-bold text-white italic group-hover:text-amber-200 transition-colors">
                  {currentGuestsCount}
                </span>
                <span className="text-white/30 text-[13px] font-medium font-sans">
                  /{maxGuests}
                </span>
              </div>
              <span className="text-[#888888] group-hover:text-white text-[11px] font-sans flex items-center gap-0.5 transition-colors">
                Orang &gt;
              </span>
            </button>
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

            {/* 4. Download All (ZIP) Button: Menampilkan Modal Konfirmasi Unduh */}
            <button
              onClick={() => setShowDownloadConfirmModal(true)}
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

          {/* ACTIVE CONTRIBUTOR FILTER BANNER (Jika filter aktif dari popup Orang >) */}
          {selectedContributor !== 'ALL' && (
            <div className="flex items-center justify-between bg-[#1c1b18] border border-white/10 rounded-2xl px-4 py-2.5 mb-5 text-xs anim-slide-down shadow-md">
              <div className="flex items-center gap-2 truncate">
                <span className="text-white/40 font-sans">Filter Tamu:</span>
                <span className="font-bold text-white truncate max-w-[150px]">{selectedContributor}</span>
                <span className="text-amber-200/80 font-mono text-[11px]">({filteredPhotos.length} momen)</span>
              </div>
              <button
                onClick={() => setSelectedContributor('ALL')}
                className="text-sky-300 hover:text-white text-xs font-medium ml-2 shrink-0 cursor-pointer underline"
              >
                Tampilkan Semua
              </button>
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
                      if (photo.r2_image_url && !e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = 'true';
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

            {/* 3. BOTTOM ACTIONS (3 Tombol: Unduh, Bagikan Tautan Langsung, Hapus) */}
            <div className="flex items-center justify-center gap-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] flex-shrink-0 z-20">
              
              {/* Tombol 1: Unduh Resolusi Asli */}
              <button
                onClick={handleDownloadCurrent}
                className="w-[56px] h-[56px] rounded-full bg-[#1e1e1e] hover:bg-[#282828] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
                title="Unduh Resolusi Asli"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </button>

              {/* Tombol 2: Bagikan / Share Langsung ke Foto Ini (Bulat Putih Menonjol di Tengah) */}
              <button
                onClick={handleShareCurrent}
                className="w-[66px] h-[66px] rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center active:scale-90 transition-transform shadow-2xl"
                title="Bagikan Tautan Foto Ini"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
                  <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                </svg>
              </button>

              {/* Tombol 3: Hapus Foto (Bulat Merah Marun) */}
              <button
                onClick={handleDeleteCurrent}
                disabled={isDeleting}
                className="w-[56px] h-[56px] rounded-full bg-[#7a1c1c] hover:bg-[#8e2222] border border-red-500/25 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg disabled:opacity-50"
                title="Hapus Foto dari Galeri"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" x2="10" y1="11" y2="17"/>
                    <line x1="14" x2="14" y1="11" y2="17"/>
                  </svg>
                )}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MODAL UNDANG TAMU & TAMPILKAN QR (Presisi Sesuai Screenshot 2)          */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#131316] border-t md:border border-white/10 rounded-t-[32px] md:rounded-[32px] px-6 pt-3 pb-8 text-white shadow-2xl flex flex-col justify-between overflow-y-auto max-h-[90vh]"
          >
            {/* Grabber Handle Bar Area */}
            <div className="pt-2 pb-2 flex justify-center items-center">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header: Title & Subtitle */}
            <div className="text-center pt-1 pb-3">
              <h2 className="font-serif text-[26px] md:text-[28px] font-bold text-white tracking-wide leading-tight">
                Undang tamu ke acaramu.
              </h2>
              <div className="text-xs text-zinc-400 font-sans mt-2 space-y-0.5 leading-relaxed">
                <p>Lihat dunia dari sudut pandang mereka.</p>
                <p>Undang tamumu untuk membuat acara ini tak terlupakan.</p>
              </div>
            </div>

            {/* Divider Line */}
            <div className="w-full h-px bg-white/[0.08] my-1" />

            {/* Middle Section: Centered QR Code Card */}
            <div className="py-4 flex flex-col items-center justify-center">
              <div className="w-[210px] h-[210px] bg-[#ede7df] rounded-[28px] p-4 shadow-2xl flex items-center justify-center border-4 border-white/10">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&margin=10&data=${encodeURIComponent(albumShareUrl)}`}
                  alt="QR Code Tamu"
                  className="w-full h-full object-contain pointer-events-none rounded-xl"
                />
              </div>
              <p className="text-[11px] font-sans text-zinc-400 mt-3 text-center">
                Scan dengan kamera HP tamu untuk langsung memotret
              </p>
            </div>

            {/* Bottom Actions Section */}
            <div className="space-y-3 mt-1">
              {/* Primary: Kirim ke WhatsApp (Green Pill Button) */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Yuk abadikan dan bagikan momen seru kamu di ${albumTitle}! Jepret foto langsung dari kamera tamu di link berikut:\n\n${albumShareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[52px] rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-sm shadow-xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 2C6.511 2 2.016 6.495 2.016 12.016c0 1.954.563 3.778 1.534 5.325L2 22l4.82-1.512c1.474.887 3.208 1.393 5.211 1.393 5.52 0 10.016-4.496 10.016-10.016S17.551 2 12.031 2zm5.834 14.179c-.244.686-1.42 1.31-1.956 1.393-.509.08-1.171.116-3.784-.963-3.136-1.296-5.161-4.475-5.321-4.688-.159-.214-1.278-1.7-1.278-3.243 0-1.543.808-2.302 1.096-2.617.288-.316.63-.395.84-.395.21 0 .42.002.604.012.195.01.455-.074.712.544.267.643.91 2.222.99 2.382.08.16.133.348.026.56-.107.213-.16.348-.32.533-.16.187-.336.417-.48.56-.16.16-.328.334-.141.655.187.321.83 1.368 1.78 2.215 1.22 1.087 2.249 1.424 2.57 1.584.321.16.508.134.695-.08.187-.214.802-.934 1.016-1.254.214-.321.428-.268.722-.16.294.107 1.868.88 2.188 1.04.32.16.534.24.614.374.08.134.08.774-.164 1.46z"/>
                </svg>
                <span>Kirim ke WhatsApp</span>
              </a>

              {/* Grid 2 Tombol: Bagikan Tautan & Simpan QR */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShareCurrent}
                  className="h-[48px] bg-[#1c1c1f] hover:bg-[#252528] border border-white/10 rounded-2xl font-medium text-white text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow"
                >
                  <svg className="w-4 h-4 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <span>Bagikan Tautan</span>
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="h-[48px] bg-[#1c1c1f] hover:bg-[#252528] border border-white/10 rounded-2xl font-medium text-white text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow"
                >
                  <svg className="w-4 h-4 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Simpan QR</span>
                </button>
              </div>

              {/* Link ke Cetak Kartu Meja (Disesuaikan UI AlbumKami) */}
              <div className="pt-2 text-center">
                <Link
                  href={`/${slug}/albumkami/print-qr/`}
                  className="inline-flex items-center gap-2 text-xs font-sans text-white/60 hover:text-white px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all"
                >
                  <span>🖨️</span>
                  <span className="font-medium">Cetak Kartu Meja Fisik (PDF / Print)</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL KONFIRMASI UNDUH SEMUA FOTO (ZIP)                                */}
      {/* ========================================================================= */}
      {showDownloadConfirmModal && (
        <div
          onClick={() => !isZipping && setShowDownloadConfirmModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#161514] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.06] border border-white/10 mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner">
                📦
              </div>
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-2">
                Unduh Semua Momen?
              </h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto font-sans">
                Sebanyak <span className="text-white font-semibold">{photos.length} foto</span> resolusi asli kualitas tinggi akan dikemas ke dalam satu file ZIP (.zip) langsung ke perangkat Anda.
              </p>
            </div>

            {isZipping ? (
              <div className="space-y-3 mb-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Mengemas file foto...</span>
                  <span className="font-mono font-bold text-white">{zipProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${zipProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDownloadConfirmModal(false)}
                  className="h-12 rounded-2xl bg-[#222220] hover:bg-[#2a2a28] border border-white/10 text-white font-medium text-xs active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    await handleDownloadAllZip();
                    setShowDownloadConfirmModal(false);
                  }}
                  className="h-12 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <span>Unduh Sekarang</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL DAFTAR TAMU / KONTRIBUTOR (Muncul saat "Orang >" diklik)           */}
      {/* ========================================================================= */}
      {showContributorsModal && (
        <div
          onClick={() => setShowContributorsModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[80vh] bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl flex flex-col"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 flex-shrink-0" />
            
            {/* Header */}
            <div className="text-center mb-5 flex-shrink-0">
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-1">
                Tamu Pengisi Album
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Pilih tamu untuk melihat foto yang diabadikan olehnya
              </p>
            </div>

            {/* List Tamu */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 custom-scrollbar">
              {/* Option 1: Semua Momen */}
              <div
                onClick={() => {
                  setSelectedContributor('ALL');
                  setShowContributorsModal(false);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedContributor === 'ALL'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-[#1c1b19] border-white/5 hover:border-white/20 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${
                    selectedContributor === 'ALL' ? 'bg-black/10 text-black' : 'bg-white/10 text-white'
                  }`}>
                    📸
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Semua Momen</p>
                    <p className={`text-xs ${selectedContributor === 'ALL' ? 'text-black/60' : 'text-white/40'}`}>
                      {photos.length} total foto terkumpul
                    </p>
                  </div>
                </div>
                {selectedContributor === 'ALL' && (
                  <span className="text-black font-bold text-sm">✓</span>
                )}
              </div>

              {/* Option 2..N: Tiap Kontributor Tamu */}
              {contributors.map((name) => {
                const count = photos.filter((p) => p.guest_name === name).length;
                const isSelected = selectedContributor === name;
                return (
                  <div
                    key={name}
                    onClick={() => {
                      setSelectedContributor(name);
                      setShowContributorsModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-[#1c1b19] border-white/5 hover:border-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl font-bold font-serif flex items-center justify-center text-sm uppercase ${
                        isSelected ? 'bg-black text-white' : 'bg-[#292825] text-amber-200 border border-white/10'
                      }`}>
                        {name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{name}</p>
                        <p className={`text-xs ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                          {count} foto diabadikan
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-black font-bold text-sm">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PENGATURAN ACARA (Presisi Sesuai Data & Screenshot)                     */}
      {/* ========================================================================= */}
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

              {/* Back Button (Identik Screenshot 1) */}
              <div className="absolute top-8 left-4 z-20">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg"
                  title="Kembali ke Galeri"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Title (Playfair Display) */}
            <div className="px-5 -mt-6 relative z-10 mb-4">
              <h1 className="font-serif text-[28px] font-bold text-white tracking-tight">
                Pengaturan Acara
              </h1>
            </div>

            {/* Content Container */}
            <div className="px-4 space-y-3.5">
              
              {/* PRIMARY SETTINGS GROUP (Identik Screenshot 1) */}
              <div className="card-glass rounded-2xl border border-white/[0.08] shadow-lg overflow-hidden divide-y divide-white/[0.06]">
                
                {/* 1. Nama & Sampul */}
                <div
                  onClick={() => {
                    setEditTitleInput(albumTitle);
                    setShowEditTitleModal(true);
                  }}
                  className="p-3.5 hover:bg-white/[0.03] cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Nama &amp; Sampul</span>
                  </div>
                  <div className="flex items-center gap-2 max-w-[50%]">
                    <span className="text-xs font-normal text-zinc-400 truncate">{albumTitle}</span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 2. Tanggal Berakhir */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2v3"/><path d="M16 2v3"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Tanggal berakhir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-zinc-400">
                      {albumData?.event_date_formatted ? `${albumData.event_date_formatted}, 17.00` : '30 Nov 2026, 17.00'}
                    </span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 3. Waktu Ungkap */}
                <div
                  onClick={() => setShowEditRevealModal(true)}
                  className="p-3.5 hover:bg-white/[0.03] cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Waktu ungkap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-zinc-400">
                      {albumData?.reveal_mode === 'after' ? 'Setelah Acara' : 'Selama Acara'}
                    </span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 4. Foto per Orang */}
                <div
                  onClick={() => setShowEditRollLimitModal(true)}
                  className="p-3.5 hover:bg-white/[0.03] cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Foto per orang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-zinc-400">
                      {albumData?.roll_limit || 36}
                    </span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 5. Filter Kamera */}
                <div className="p-3.5 flex items-center justify-between group opacity-90">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Filter kamera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-zinc-400">Asli</span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 6. Bingkai Foto */}
                <div className="p-3.5 flex items-center justify-between group opacity-90">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Bingkai foto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-zinc-400">Tanpa</span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 7. Tautan Khusus */}
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(albumShareUrl);
                    setToastMessage('✓ Tautan khusus album berhasil disalin');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="p-3.5 hover:bg-white/[0.03] cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Tautan khusus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-zinc-400">Buat tautan khusus</span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 8. Bahasa Default Acara */}
                <div className="p-3.5 flex items-center justify-between group opacity-90">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-200">Bahasa default acara</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-zinc-400">Bahasa Indonesia</span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 9. Kapasitas Tamu (Identik Screenshot 1) */}
                <div
                  onClick={() => setShowEditCapacityModal(true)}
                  className="p-3.5 hover:bg-white/[0.03] cursor-pointer active:scale-[0.99] transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37]">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-200">Kapasitas tamu</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-[#1a293b] hover:bg-[#20344d] border border-sky-500/30 text-sky-400 transition-all shadow-sm active:scale-95"
                    >
                      <span>Tambah pax</span>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 pl-11">
                    Hingga {maxGuests} Tamu • Paket gratis dibatasi {maxGuests} tamu
                  </p>
                </div>
              </div>

              {/* TOGGLES SECTION (Identik Screenshot 1) */}
              <div className="card-glass rounded-2xl border border-white/[0.08] shadow-lg p-4 space-y-4">
                
                {/* Toggle 1: Semua orang bisa melihat semua foto (Default Aktif) */}
                <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37] mt-0.5 shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">Semua orang bisa melihat semua foto</span>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Aktifkan agar siapa pun dengan link bisa melihat semua foto. Nonaktifkan agar hanya kamu dan tamu undangan yang bisa melihat — tamu tetap hanya melihat foto miliknya.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !allowPublicView;
                      setAllowPublicView(nextVal);
                      await saveSetting({ album_settings: { allow_public_view: nextVal } });
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                      allowPublicView ? 'bg-[#3b82f6]' : 'bg-[#2a2a2e]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        allowPublicView ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Sembunyikan nama pengunggah */}
                <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37] mt-0.5 shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="8" y2="13"/><line x1="22" x2="17" y1="8" y2="13"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">Sembunyikan nama pengunggah</span>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Untuk penjurian buta — sembunyikan nama semua orang saat memilih favorit.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !hideUploaderName;
                      setHideUploaderName(nextVal);
                      await saveSetting({ album_settings: { hide_uploader_name: nextVal } });
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                      hideUploaderName ? 'bg-[#3b82f6]' : 'bg-[#2a2a2e]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        hideUploaderName ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: Like foto */}
                <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37] mt-0.5 shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">Like foto</span>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Pengunjung dan tamu dapat menyukai setiap foto satu kali. Matikan untuk menyembunyikan tombol like dan jumlahnya dari semua orang.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !enableLikes;
                      setEnableLikes(nextVal);
                      await saveSetting({ album_settings: { enable_likes: nextVal } });
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                      enableLikes ? 'bg-[#3b82f6]' : 'bg-[#2a2a2e]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        enableLikes ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 4: Ingatkan H-2 lewat email */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#d4af37] mt-0.5 shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-200">Ingatkan H-2 lewat email</span>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        <button
                          type="button"
                          onClick={() => {
                            setToastMessage('Fitur pengingat email otomatis aktif untuk penyelenggara');
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="text-sky-400 hover:underline text-left inline"
                        >
                          Simpan akun dulu supaya kami punya alamat email.
                        </button>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextVal = !emailReminder;
                      setEmailReminder(nextVal);
                      await saveSetting({ album_settings: { email_reminder: nextVal } });
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shrink-0 mt-0.5 ${
                      emailReminder ? 'bg-[#3b82f6]' : 'bg-[#2a2a2e]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        emailReminder ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* 14. Destructive Action: Hapus Acara (Identik Screenshot 1) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAlbumConfirmModal(true)}
                  className="w-full py-3.5 px-4 rounded-2xl border border-red-900/40 bg-red-950/20 hover:bg-red-950/35 text-red-400 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
                >
                  <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
                  </svg>
                  <span>Hapus acara</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL ONBOARDING TAMU (Pop-up Nama Tamu Pertama Kali)                    */}
      {/* ========================================================================= */}
      {showGuestNameModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none">
          <div className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner">
                ✨
              </div>
              <h3 className="font-serif text-[24px] font-bold text-white tracking-tight mb-2">
                Selamat Datang di Album Kami
              </h3>
              <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto font-sans">
                Tulis namamu agar kedua mempelai tahu siapa yang mengabadikan momen berharga ini.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={guestInputName}
                onChange={(e) => setGuestInputName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGuestName();
                }}
                placeholder="Nama panggilan (contoh: Dimas, Sarah)"
                autoFocus
                className="w-full h-14 bg-[#1c1b19] border border-white/10 focus:border-white/40 rounded-2xl px-5 text-center text-white placeholder-white/30 text-base outline-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSaveGuestName()}
                className="w-full h-13 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-sm active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <span>Mulai Abadikan Momen</span>
                <span>→</span>
              </button>

              <button
                onClick={() => handleSaveGuestName('Tamu')}
                className="w-full h-11 rounded-2xl bg-transparent hover:bg-white/5 text-white/50 hover:text-white font-medium text-xs active:scale-[0.98] transition-all"
              >
                Lewati (Sebagai Tamu)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL SETUP HOST (Pop-up Pengaturan Masuk dari WIM Pertama Kali)         */}
      {/* ========================================================================= */}
      {showHostSetupModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none">
          <div className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-fuchsia-500/10 border border-fuchsia-500/20 mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner">
                📸
              </div>
              <h3 className="font-serif text-[24px] font-bold text-white tracking-tight mb-2">
                Atur Album Kami
              </h3>
              <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto font-sans">
                Ruang penyimpanan R2 untuk album pernikahan Anda telah aktif. Beri nama khusus & tentukan kuota rol kamera tamu.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider text-left">
                  Nama Album
                </label>
                <input
                  type="text"
                  value={hostAlbumTitleInput}
                  onChange={(e) => setHostAlbumTitleInput(e.target.value)}
                  placeholder="Contoh: Album Resepsi Dika & Riyan"
                  className="w-full h-13 bg-[#1c1b19] border border-white/10 focus:border-white/40 rounded-2xl px-4 text-white placeholder-white/30 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider text-left">
                  Foto per Tamu (Kamera Roll)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 36, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setHostRollLimitInput(num)}
                      className={`h-11 rounded-xl text-xs font-bold transition-all border ${
                        hostRollLimitInput === num
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-[#1c1b19] text-white/60 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {num} foto
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                disabled={isSavingSettings}
                onClick={async () => {
                  await saveSetting({
                    title: hostAlbumTitleInput.trim() || albumTitle,
                    roll_limit: hostRollLimitInput,
                  });
                  sessionStorage.setItem(`storykami_host_setup_shown_${slug}`, 'true');
                  setShowHostSetupModal(false);
                }}
                className="w-full h-13 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-sm active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingSettings ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Simpan & Buka Galeri</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  sessionStorage.setItem(`storykami_host_setup_shown_${slug}`, 'true');
                  setShowHostSetupModal(false);
                }}
                className="w-full h-11 rounded-2xl bg-transparent hover:bg-white/5 text-white/50 hover:text-white font-medium text-xs active:scale-[0.98] transition-all"
              >
                Gunakan Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUB-MODAL: UBAH NAMA ALBUM                                              */}
      {/* ========================================================================= */}
      {showEditTitleModal && (
        <div
          onClick={() => setShowEditTitleModal(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-1">
                Ubah Nama Album
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Nama ini akan tampil di bagian atas galeri album
              </p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                placeholder="Nama Album"
                className="w-full h-13 bg-[#1c1b19] border border-white/10 focus:border-white/40 rounded-2xl px-4 text-white placeholder-white/30 text-sm outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEditTitleModal(false)}
                className="h-12 rounded-2xl bg-[#222220] hover:bg-[#2a2a28] border border-white/10 text-white font-medium text-xs active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                disabled={isSavingSettings}
                onClick={async () => {
                  if (editTitleInput.trim()) {
                    await saveSetting({ title: editTitleInput.trim() });
                  }
                  setShowEditTitleModal(false);
                }}
                className="h-12 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SUB-MODAL: PILIH FOTO PER ORANG (ROL FILM)                              */}
      {/* ========================================================================= */}
      {showEditRollLimitModal && (
        <div
          onClick={() => setShowEditRollLimitModal(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-5">
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-1">
                Foto per Tamu (Kamera Roll)
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Tentukan batas maksimal foto yang bisa diabadikan tiap tamu
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {[5, 10, 15, 20, 36, 50].map((limit) => {
                const isSelected = (albumData?.roll_limit || 10) === limit;
                return (
                  <div
                    key={limit}
                    onClick={async () => {
                      await saveSetting({ roll_limit: limit });
                      setShowEditRollLimitModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-[#1c1b19] border-white/5 hover:border-white/20 text-white'
                    }`}
                  >
                    <span className="font-semibold text-sm">
                      {limit} Foto {limit === 10 ? '• Rekomendasi' : limit === 36 ? '• Rol Klasik' : ''}
                    </span>
                    {isSelected && <span className="font-bold text-sm">✓</span>}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowEditRollLimitModal(false)}
              className="w-full h-12 rounded-2xl bg-[#222220] hover:bg-[#2a2a28] border border-white/10 text-white font-medium text-xs active:scale-95 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SUB-MODAL: PILIH KAPASITAS TAMU                                         */}
      {/* ========================================================================= */}
      {showEditCapacityModal && (
        <div
          onClick={() => setShowEditCapacityModal(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-5">
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-1">
                Kapasitas Tamu Bergabung
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Batas jumlah kuota tamu yang dapat mengakses album ini
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {[25, 50, 100, 200, 500].map((cap) => {
                const isSelected = maxGuests === cap;
                return (
                  <div
                    key={cap}
                    onClick={async () => {
                      await saveSetting({ max_guests: cap });
                      setShowEditCapacityModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-[#1c1b19] border-white/5 hover:border-white/20 text-white'
                    }`}
                  >
                    <span className="font-semibold text-sm">
                      Hingga {cap} Tamu {cap === 50 ? '• Default' : ''}
                    </span>
                    {isSelected && <span className="font-bold text-sm">✓</span>}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowEditCapacityModal(false)}
              className="w-full h-12 rounded-2xl bg-[#222220] hover:bg-[#2a2a28] border border-white/10 text-white font-medium text-xs active:scale-95 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SUB-MODAL: PILIH WAKTU UNGKAP                                         */}
      {/* ========================================================================= */}
      {showEditRevealModal && (
        <div
          onClick={() => setShowEditRevealModal(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-5">
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-1">
                Waktu Ungkap Foto
              </h3>
              <p className="text-xs text-white/50 font-sans">
                Tentukan kapan foto dari tamu dapat dilihat di galeri
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div
                onClick={async () => {
                  await saveSetting({ reveal_mode: 'instant', is_revealed: true });
                  setShowEditRevealModal(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  albumData?.reveal_mode !== 'after'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-[#1c1b19] border-white/5 hover:border-white/20 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Selama Acara (Langsung Tampil)</span>
                  {albumData?.reveal_mode !== 'after' && <span className="font-bold text-sm">✓</span>}
                </div>
                <p className={`text-xs ${albumData?.reveal_mode !== 'after' ? 'text-black/60' : 'text-white/40'}`}>
                  Setiap foto yang dijepret tamu akan langsung muncul di dashboard galeri secara realtime.
                </p>
              </div>

              <div
                onClick={async () => {
                  await saveSetting({ reveal_mode: 'after', is_revealed: false });
                  setShowEditRevealModal(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  albumData?.reveal_mode === 'after'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-[#1c1b19] border-white/5 hover:border-white/20 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Setelah Acara Selesai (Teka-Teki)</span>
                  {albumData?.reveal_mode === 'after' && <span className="font-bold text-sm">✓</span>}
                </div>
                <p className={`text-xs ${albumData?.reveal_mode === 'after' ? 'text-black/60' : 'text-white/40'}`}>
                  Foto tamu tetap tersimpan rapi, namun galeri baru akan terbuka bersamaan setelah acara selesai.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEditRevealModal(false)}
              className="w-full h-12 rounded-2xl bg-[#222220] hover:bg-[#2a2a28] border border-white/10 text-white font-medium text-xs active:scale-95 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. SUB-MODAL: KONFIRMASI HAPUS FOTO LIGHTBOX                              */}
      {/* ========================================================================= */}
      {showDeletePhotoConfirmModal && (
        <div
          onClick={() => !isDeleting && setShowDeletePhotoConfirmModal(false)}
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center text-3xl mb-4 text-red-400">
                🗑️
              </div>
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-2">
                Hapus Foto Ini?
              </h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto font-sans">
                Foto yang diabadikan oleh <strong className="text-white">{currentPhoto?.guest_name || 'Tamu'}</strong> akan dihapus permanen dari galeri album bersama.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeletePhotoConfirmModal(false)}
                className="h-12 rounded-2xl bg-[#222220] hover:bg-[#2a2a28] border border-white/10 text-white font-medium text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDeletePhotoAction}
                className="h-12 rounded-2xl bg-[#7a1c1c] hover:bg-[#8e2222] border border-red-500/20 text-white font-bold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. SUB-MODAL: KONFIRMASI HAPUS ACARA                                      */}
      {/* ========================================================================= */}
      {showDeleteAlbumConfirmModal && (
        <div
          onClick={() => setShowDeleteAlbumConfirmModal(false)}
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center text-3xl mb-4 text-red-400">
                ⚠️
              </div>
              <h3 className="font-serif text-[22px] font-bold text-white tracking-tight mb-2">
                Hapus Acara Ini?
              </h3>
              <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto font-sans">
                Album ini terhubung secara langsung dengan undangan pernikahan utama Anda di StoryKami. Untuk mengelola atau menghapus seluruh undangan beserta album, silakan lakukan dari <strong className="text-white">Dashboard WIM</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteAlbumConfirmModal(false)}
              className="w-full h-12 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs active:scale-95 transition-all shadow-xl"
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
