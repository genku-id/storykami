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
      {/* 1. MODAL UNDANG TAMU & TAMPILKAN QR (Layout 3/4 Layar, Rapi & Elegan)     */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-[78vh] md:h-auto md:max-h-[85vh] bg-[#141312] border border-white/10 rounded-t-[36px] md:rounded-[36px] px-6 pt-5 pb-8 text-white shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            {/* Top Section */}
            <div>
              {/* Drag Handle Bar */}
              <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-white/20" />

              {/* Header */}
              <div className="text-center mb-2">
                <h2 className="font-serif text-[24px] font-bold text-white tracking-tight leading-snug">
                  Undang tamu ke acaramu.
                </h2>
                <div className="text-[13px] text-white/50 space-y-0.5 mt-2 leading-relaxed">
                  <p>Lihat dunia dari sudut pandang mereka.</p>
                  <p>Undang tamumu untuk membuat acara ini tak terlupakan.</p>
                </div>
              </div>
            </div>

            {/* Middle Section: Centered QR Code Card */}
            <div className="my-auto py-4 flex flex-col items-center justify-center">
              <div className="w-[210px] h-[210px] bg-[#ede7de] rounded-[28px] p-4 shadow-2xl flex items-center justify-center border-4 border-white/10">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&margin=10&data=${encodeURIComponent(albumShareUrl)}`}
                  alt="QR Code Tamu"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
              <p className="text-[11px] font-sans text-white/40 mt-3 text-center">
                Scan dengan kamera HP tamu untuk langsung memotret
              </p>
            </div>

            {/* Bottom Actions Section */}
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
                  className="h-[50px] bg-[#222220] hover:bg-[#2a2a28] border border-white/10 rounded-2xl font-medium text-white text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <span>Bagikan Tautan</span>
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="h-[50px] bg-[#222220] hover:bg-[#2a2a28] border border-white/10 rounded-2xl font-medium text-white text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Simpan QR</span>
                </button>
              </div>

              {/* Link ke Cetak Kartu Meja (Disesuaikan UI AlbumKami) */}
              <div className="pt-1 text-center">
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
              <div
                onClick={() => {
                  setEditTitleInput(albumTitle);
                  setShowEditTitleModal(true);
                }}
                className="p-4 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/5 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/40">✏️</span>
                  <span className="font-medium text-white">Nama & Sampul</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span className="truncate max-w-[140px] text-white/80 font-medium">{albumTitle}</span>
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
                  <span>{albumData?.event_date_formatted ? `${albumData.event_date_formatted}, 23.59` : '22 Nov 2026, 23.59'}</span>
                  <span>›</span>
                </div>
              </div>

              {/* 3. Waktu ungkap */}
              <div
                onClick={() => setShowEditRevealModal(true)}
                className="p-4 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/5 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/40">🕒</span>
                  <span className="font-medium text-white">Waktu ungkap</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span className="text-white/80 font-medium">
                    {albumData?.reveal_mode === 'after' ? 'Setelah Acara' : 'Selama Acara'}
                  </span>
                  <span>›</span>
                </div>
              </div>

              {/* 4. Foto per orang */}
              <div
                onClick={() => setShowEditRollLimitModal(true)}
                className="p-4 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/5 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/40">📷</span>
                  <span className="font-medium text-white">Foto per orang</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span className="text-white/80 font-semibold">{albumData?.roll_limit || 10} Foto</span>
                  <span>›</span>
                </div>
              </div>

              {/* 5. Filter kamera */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm opacity-80">
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
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm opacity-80">
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
              <div
                onClick={() => {
                  navigator.clipboard.writeText(albumShareUrl);
                  setToastMessage('✓ Tautan khusus album berhasil disalin');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="p-4 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/5 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/40">🔗</span>
                  <span className="font-medium text-white">Tautan khusus</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span>Salin Tautan</span>
                  <span>›</span>
                </div>
              </div>

              {/* 8. Bahasa default acara */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-white/5 flex items-center justify-between text-sm opacity-80">
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
              <div
                onClick={() => setShowEditCapacityModal(true)}
                className="p-4 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/5 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between text-sm"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">👥</span>
                    <span className="font-medium text-white">Kapasitas tamu</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1 pl-7">
                    Hingga {maxGuests} Tamu • Kuota bergabung
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-[#1c3a5e] text-sky-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-sky-500/20 active:scale-95 transition-transform"
                >
                  Ubah pax ›
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
                    onClick={async () => {
                      const nextVal = !allowPublicView;
                      setAllowPublicView(nextVal);
                      await saveSetting({ album_settings: { allow_public_view: nextVal } });
                    }}
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
                  Aktifkan agar siapa pun dengan link bisa melihat semua foto. Nonaktifkan agar hanya kamu dan tamu undangan yang bisa melihat.
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
                    onClick={async () => {
                      const nextVal = !hideUploaderName;
                      setHideUploaderName(nextVal);
                      await saveSetting({ album_settings: { hide_uploader_name: nextVal } });
                    }}
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
                  Untuk penjurian buta — sembunyikan nama semua orang saat memilih foto favorit.
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
                    onClick={async () => {
                      const nextVal = !enableLikes;
                      setEnableLikes(nextVal);
                      await saveSetting({ album_settings: { enable_likes: nextVal } });
                    }}
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
                  Pengunjung dan tamu dapat menyukai setiap foto satu kali.
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
                    onClick={async () => {
                      const nextVal = !emailReminder;
                      setEmailReminder(nextVal);
                      await saveSetting({ album_settings: { email_reminder: nextVal } });
                    }}
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
                  Kirim pengingat otomatis menjelang hari pernikahan Anda.
                </p>
              </div>

              {/* 14. Danger Button: Hapus Acara */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteAlbumConfirmModal(true)}
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
