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
  const [imageLoadedMap, setImageLoadedMap] = useState({});

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
  const [showEditCloseDateModal, setShowEditCloseDateModal] = useState(false);
  const [editCloseDate, setEditCloseDate] = useState('');
  const [editCloseTime, setEditCloseTime] = useState('17:00');
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
        // Jika album sudah memiliki nama, tandai setup selesai agar popup tidak pernah muncul lagi
        if (info.album.title && info.album.title.trim()) {
          try {
            localStorage.setItem(`storykami_host_setup_completed_${slug}`, 'true');
          } catch (e) {}
          setShowHostSetupModal(false);
        }
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
        let finalPhotos = pData.photos;
        try {
          const pendingKey = `storykami_pending_uploads_${slug}`;
          const pendingList = JSON.parse(localStorage.getItem(pendingKey) || '[]');
          const now = Date.now();
          // Filter pending uploads yang masih dalam rentang 3 menit (180 detik)
          const validPending = pendingList.filter((p) => now - (p.timestamp || 0) < 180000);

          if (validPending.length > 0) {
            // Hanya hilangkan pending yang BENAR-BENAR sudah pasti terdaftar di pData.photos
            const remainingPending = validPending.filter((pending) => {
              // 1. Jika sudah punya serverPhotoId dan ada di pData.photos
              if (pending.serverPhotoId && pData.photos.some((sp) => sp.id === pending.serverPhotoId)) {
                return false;
              }
              // 2. Jika punya r2_key dan ada di pData.photos
              if (pending.r2_key && pData.photos.some((sp) => sp.r2_key === pending.r2_key)) {
                return false;
              }
              // Jika belum ada di server, TETAP TAMPILKAN KOTAKNYA!
              return true;
            });

            localStorage.setItem(pendingKey, JSON.stringify(remainingPending));
            finalPhotos = [...remainingPending, ...pData.photos];
          } else if (pendingList.length > 0) {
            localStorage.setItem(pendingKey, '[]');
          }
        } catch (e) {}

        setPhotos(finalPhotos);
        setContributors(pData.contributors || []);
        try {
          localStorage.setItem(`storykami_cache_${slug}_photos`, JSON.stringify(finalPhotos));
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
      const pendingKey = `storykami_pending_uploads_${slug}`;
      const pendingPhotos = JSON.parse(localStorage.getItem(pendingKey) || '[]');

      let initialList = [];
      if (cachedPhotos) {
        const parsed = JSON.parse(cachedPhotos);
        if (Array.isArray(parsed)) initialList = parsed;
      }

      if (pendingPhotos.length > 0) {
        const existingIds = new Set(initialList.map((p) => p.id));
        const missingPending = pendingPhotos.filter((p) => !existingIds.has(p.id));
        initialList = [...missingPending, ...initialList];
      }

      if (initialList.length > 0) {
        setPhotos(initialList);
        setContributors(Array.from(new Set(initialList.map((p) => p.guest_name).filter(Boolean))));
        setLoading(false); // Instan tanpa delay!
        hasLoadedOnce.current = true;
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

    // Sinkronisasi seketika begitu proses upload latar belakang terkonfirmasi
    const handlePhotoUploaded = () => {
      loadGallery(true);
    };
    window.addEventListener('storykami_photo_uploaded', handlePhotoUploaded);

    return () => {
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleVisibility);
        window.removeEventListener('storykami_photo_uploaded', handlePhotoUploaded);
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
      // HANYA minta setup sekali: jika sudah pernah setup atau album sudah punya nama, JANGAN minta lagi
      const setupCompleted = localStorage.getItem(`storykami_host_setup_completed_${slug}`);
      const cachedInfo = localStorage.getItem(`storykami_cache_${slug}_info`);
      let alreadyHasName = false;
      if (cachedInfo) {
        try {
          const parsed = JSON.parse(cachedInfo);
          if (parsed?.title && parsed.title.trim()) {
            alreadyHasName = true;
          }
        } catch (e) {}
      }

      if (setupCompleted || alreadyHasName) {
        setShowHostSetupModal(false);
      } else {
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
  const handleSaveGuestName = async (nameToSave, shouldNavigateToCam = true) => {
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

    if (shouldNavigateToCam) {
      router.push(`/${slug}/albumkami/cam/`);
    }
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

  // Helper manipulasi dan format tanggal berakhir
  const addDaysToDate = (baseDateStr, days) => {
    if (!baseDateStr) return '';
    try {
      const parts = baseDateStr.split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return baseDateStr;
      const [y, m, d] = parts;
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + days);
      const resY = dt.getFullYear();
      const resM = String(dt.getMonth() + 1).padStart(2, '0');
      const resD = String(dt.getDate()).padStart(2, '0');
      return `${resY}-${resM}-${resD}`;
    } catch (e) {
      return baseDateStr;
    }
  };

  const formatCloseDateIndo = (dateStr, timeStr = '17:00') => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const mIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const year = parts[0];
    const timeFormatted = timeStr ? timeStr.replace(':', '.') : '17.00';
    return `${day} ${months[mIdx] || ''} ${year}, ${timeFormatted}`;
  };

  // Derived state (Ditempatkan di awal sebelum handlers & effects agar aman dari Temporal Dead Zone saat SSR)
  const filteredPhotos =
    selectedContributor === 'ALL'
      ? photos
      : photos.filter((p) => p.guest_name === selectedContributor);

  const albumTitle = albumData?.title || 'Awal dari Selamanya';
  const displayCoupleName = (albumTitle || '')
    .replace(/^(album\s+pernikahan\s*[:\-–—]?\s*)+/gi, '')
    .trim() || 'fafa-fufu';
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
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex justify-center items-start antialiased selection:bg-luxury-gold selection:text-black">
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

      {/* MobileDeviceContainer */}
      <main className="w-full max-w-[430px] min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-[#0a0a0d] shadow-2xl border-x border-white/[0.04] pb-8 mx-auto" data-purpose="mobile-viewport">
        {/* BEGIN: HeroSection */}
        <section className="relative w-full select-none h-[220px]" data-purpose="hero-header-banner">
          {/* Background Hero Wedding Photography */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              alt="Foto Pernikahan Polaroid Vintage"
              className="w-full h-full object-cover object-center scale-105 filter brightness-[0.92] contrast-[1.05]"
              src="/images/satualbum_cover.webp"
            />
            {/* Seamless Multi-stage Vignette & Dark Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/85 via-50% to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent h-28" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
          </div>

          {/* Top Floating Navigation Bar */}
          <nav className="relative z-20 flex items-center justify-between px-5 pt-8" data-purpose="top-navigation-bar">
            {/* Back Button with Glassmorphism */}
            <Link
              href={`/${slug}`}
              aria-label="Kembali"
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-zinc-200 active:scale-95 transition-all duration-200 hover:bg-black/60 hover:text-white hover:border-luxury-gold/50 shadow-lg cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
              </svg>
            </Link>

            {/* Setting / Gear Button (HANYA MUNCUL JIKA Host Masuk dari WIM) */}
            {isHost && (
              <button
                onClick={() => setShowSettingsModal(true)}
                aria-label="Pengaturan Album"
                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-zinc-200 active:scale-95 transition-all duration-200 hover:bg-black/60 hover:text-white hover:border-luxury-gold/50 shadow-lg cursor-pointer"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}
          </nav>

          {/* Title & Sub-header overlay on hero bottom */}
          <div className="absolute inset-x-0 px-6 text-center z-10 flex flex-col items-center bottom-2">
            {/* Small Luxury Tagline / Monogram Accent */}
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-luxury-gold" />
              <span className="text-[10px] tracking-[0.28em] uppercase text-luxury-gold font-medium">Gallery</span>
              <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-luxury-gold" />
            </div>
            {/* Wedding Couple Title */}
            <h1 className="font-serif tracking-tight text-white font-medium drop-shadow-md text-2xl">
              Album Pernikahan <br />
              <span className="italic font-normal font-serif text-luxury-goldLight">{displayCoupleName}</span>
            </h1>
          </div>
        </section>
        {/* END: HeroSection */}

        {/* BEGIN: ContentArea */}
        <div className="flex-1 flex flex-col justify-start px-4 -mt-2 z-20 gap-5" data-purpose="main-album-content">
          {/* BEGIN: StatsBar */}
          <div className="grid grid-cols-3 items-center py-3.5 px-3 bg-[#121217]/90 backdrop-blur-md border border-white/[0.07] rounded-2xl shadow-xl shadow-black/60 divide-x divide-white/[0.08]" data-purpose="album-stats-bar">
            {/* Total Moments */}
            <div className="text-center px-1">
              <span className="block font-serif text-2xl font-bold tracking-tight text-white italic leading-none mb-1">
                {photos.length}
              </span>
              <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                Momen
              </span>
            </div>

            {/* Event Date */}
            <div className="text-center px-2">
              <span className="block font-serif text-[19px] font-semibold text-luxury-goldLight tracking-tight italic leading-none mb-1">
                {albumData?.event_date_formatted || '22 Nov 2026'}
              </span>
              <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                Tanggal Acara
              </span>
            </div>

            {/* Guest Counter & Link */}
            <div
              onClick={() => setShowContributorsModal(true)}
              className="text-center px-1 group cursor-pointer"
            >
              <div className="flex items-center justify-center gap-0.5 leading-none mb-1">
                <span className="font-serif text-2xl font-bold text-white italic">
                  {currentGuestsCount}
                </span>
                <span className="text-xs font-serif text-zinc-500 font-semibold tracking-tighter">
                  /{maxGuests}
                </span>
              </div>
              <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase flex items-center justify-center gap-0.5 group-hover:text-luxury-gold transition-colors">
                Orang{' '}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right w-3 h-3 stroke-[2.5]">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </div>
          </div>
          {/* END: StatsBar */}

          {/* BEGIN: ActionToolbar */}
          <div className="flex items-center gap-2.5" data-purpose="quick-actions-toolbar">
            {/* Primary Large Camera Action Button */}
            <Link
              href={`/${slug}/albumkami/cam/`}
              aria-label="Ambil Foto"
              className="flex-[2.8] h-[58px] bg-gradient-to-r from-[#F7F3E9] via-[#EDE7D9] to-[#E2DAC7] text-zinc-950 font-medium rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 active:scale-[0.98] transition-all duration-200 border border-amber-200/50 group"
            >
              <div className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera w-6 h-6 stroke-[2.2] text-zinc-900 group-hover:scale-110 transition-transform">
                  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span className="text-sm font-semibold tracking-wide text-zinc-900">Potret Foto</span>
              </div>
            </Link>

            {/* Secondary Icon Buttons (QR, Grid/Filter, Download ZIP) */}
            <div className="flex flex-[2] items-center gap-2">
              {/* QR Code Button */}
              <button
                onClick={() => setShowQrModal(true)}
                aria-label="QR Code Tamu"
                className="flex-1 h-[58px] bg-[#141419] hover:bg-[#1a1a21] border border-white/[0.08] hover:border-luxury-gold/40 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all shadow-md shadow-black/40 cursor-pointer"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code w-5 h-5 stroke-[2]">
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

              {/* Guest/Grid Filter Button */}
              <button
                onClick={() => setGridColumns((prev) => (prev === 2 ? 3 : 2))}
                aria-label="Tampilan Grid Tamu"
                className="flex-1 h-[58px] bg-[#141419] hover:bg-[#1a1a21] border border-white/[0.08] hover:border-luxury-gold/40 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all shadow-md shadow-black/40 cursor-pointer"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid w-5 h-5 stroke-[2]">
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
              </button>

              {/* Download ZIP Button */}
              <button
                onClick={() => setShowDownloadConfirmModal(true)}
                disabled={isZipping}
                aria-label="Unduh Semua Foto"
                className="flex-1 h-[58px] bg-[#141419] hover:bg-[#1a1a21] border border-white/[0.08] hover:border-luxury-gold/40 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all shadow-md shadow-black/40 disabled:opacity-50 cursor-pointer"
                type="button"
              >
                {isZipping ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download w-5 h-5 stroke-[2]">
                    <path d="M12 15V3" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m7 10 5 5 5-5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {/* END: ActionToolbar */}

          {/* ACTIVE CONTRIBUTOR FILTER BANNER */}
          {selectedContributor !== 'ALL' && (
            <div className="flex items-center justify-between bg-[#141419] border border-luxury-gold/30 rounded-2xl px-4 py-2.5 text-xs shadow-md">
              <div className="flex items-center gap-2 truncate">
                <span className="text-zinc-400 font-sans">Filter Tamu:</span>
                <span className="font-semibold text-white truncate max-w-[150px]">{selectedContributor}</span>
                <span className="text-luxury-goldLight font-mono text-[11px]">({filteredPhotos.length} momen)</span>
              </div>
              <button
                onClick={() => setSelectedContributor('ALL')}
                className="text-luxury-gold hover:text-white text-xs font-medium ml-2 shrink-0 cursor-pointer underline"
              >
                Tampilkan Semua
              </button>
            </div>
          )}

          {/* PHOTO GALLERY GRID / EMPTY STATE */}
          {filteredPhotos.length === 0 ? (
            <section className="relative overflow-hidden bg-gradient-to-b from-[#14141a]/90 via-[#0e0e13]/95 to-[#0b0b0e] border border-white/[0.08] rounded-3xl p-7 text-center shadow-2xl flex flex-col items-center justify-center mt-1 group" data-purpose="empty-gallery-state">
              {/* Subtle Ambient Background Light */}
              <div className="absolute -top-16 inset-x-0 mx-auto w-40 h-40 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />
              {/* Elegant Camera Icon Badge */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#23232c] to-[#121217] border border-white/10 shadow-inner-subtle flex items-center justify-center mb-4 text-luxury-goldLight ring-1 ring-luxury-gold/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera w-7 h-7 stroke-[1.8] text-luxury-gold">
                  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                {/* Lens Flash Reflection Detail */}
                <div className="absolute top-3.5 right-4 w-1.5 h-1.5 rounded-full bg-white/40 blur-[0.5px]" />
              </div>
              {/* Empty State Title */}
              <h2 className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-white mb-2">
                Belum Ada Momen
              </h2>
              {/* Empty State Description */}
              <p className="text-xs md:text-sm text-zinc-400 font-normal leading-relaxed max-w-[270px] mb-6">
                Tekan tombol kamera di atas untuk mengambil foto pertama anda!
              </p>
            </section>
          ) : (
            <div
              className={`grid gap-2.5 mt-1 pb-8 ${
                gridColumns === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {filteredPhotos.map((photo, idx) => {
                const isImgLoaded = Boolean(imageLoadedMap[photo.id]);
                return (
                  <div
                    key={photo.id}
                    onClick={() => {
                      if (photo.isPending) {
                        setToastMessage('⏳ Foto sedang diunggah ke album...');
                        setTimeout(() => setToastMessage(null), 2500);
                        return;
                      }
                      setActivePhotoIndex(idx);
                    }}
                    className={`group relative overflow-hidden aspect-square rounded-2xl bg-[#141417] border border-white/[0.07] cursor-pointer active:scale-95 transition-transform shadow-md ${
                      photo.isPending ? 'ring-1 ring-amber-400/50' : ''
                    }`}
                  >
                    {/* 1. SKELETON SHIMMER LOADING (Tampil saat foto belum selesai termuat) */}
                    {!isImgLoaded && (
                      <div className="absolute inset-0 z-0 bg-[#151518] flex items-center justify-center animate-card-shimmer">
                        <div className="flex flex-col items-center justify-center gap-1.5 opacity-60">
                          <div className="w-6 h-6 border-2 border-white/20 border-t-[#d4af37] rounded-full animate-spin" />
                          <span className="text-[9px] font-film text-zinc-400 uppercase tracking-wider">Memuat...</span>
                        </div>
                      </div>
                    )}

                    {/* 2. PENDING UPLOAD OVERLAY (Animasi khusus foto yang baru saja dijepret & diupload) */}
                    {photo.isPending && (
                      <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none p-2 text-center anim-fade-in">
                        {photo.status === 'error' ? (
                          <>
                            <span className="text-xl mb-1">⚠️</span>
                            <span className="text-[10px] font-semibold text-rose-300 font-sans bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                              {photo.errorMessage || 'Gagal Unggah'}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin mb-1.5 shadow-lg" />
                            <span className="text-[10px] font-medium text-amber-200 tracking-wide font-sans bg-black/75 px-2.5 py-0.5 rounded-full border border-amber-400/30 shadow-md">
                              Memproses...
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* 3. GAMBAR FOTO (Fade-in mulus seketika selesai termuat) */}
                    <img
                      src={photo.r2_thumb_url || photo.r2_image_url}
                      alt={photo.guest_name}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => {
                        setImageLoadedMap((prev) => ({ ...prev, [photo.id]: true }));
                      }}
                      className={`w-full h-full object-cover transition-opacity duration-500 will-change-transform group-hover:scale-105 ${
                        isImgLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onError={(e) => {
                        setImageLoadedMap((prev) => ({ ...prev, [photo.id]: true }));
                        if (photo.r2_image_url && !e.currentTarget.dataset.fallback) {
                          e.currentTarget.dataset.fallback = 'true';
                          e.currentTarget.src = photo.r2_image_url;
                        }
                      }}
                    />

                    {/* Subtle vignette overlay on bottom for guest signature */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 pointer-events-none z-10" />
                    <span className="absolute bottom-2.5 left-2.5 text-[11px] font-sans text-white/95 font-medium truncate max-w-[85%] drop-shadow pointer-events-none z-10">
                      {photo.guest_name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

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
                src={currentPhoto.r2_thumb_url || currentPhoto.r2_image_url}
                alt={currentPhoto.guest_name}
                onError={(e) => {
                  // Fallback ke JPEG asli hanya jika file tidak punya webp atau gagal dimuat
                  if (currentPhoto.r2_image_url && !e.currentTarget.dataset.fallback) {
                    e.currentTarget.dataset.fallback = 'true';
                    e.currentTarget.src = currentPhoto.r2_image_url;
                  }
                }}
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
      {/* 1. MODAL UNDANG TAMU & TAMPILKAN QR (bottom_sheet_undang_qr_code_elegan)   */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#131315]/95 backdrop-blur-xl border-t md:border border-amber-500/20 rounded-t-[32px] md:rounded-[32px] px-6 pt-3 pb-8 text-white shadow-2xl flex flex-col justify-between overflow-y-auto max-h-[85vh] custom-scrollbar"
          >
            {/* Drag Handle Bar */}
            <div className="w-full pt-2 pb-1 flex justify-center items-center">
              <div className="w-12 h-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors" />
            </div>

            {/* Header Section with Close Button & Title */}
            <header className="px-1 pt-2 pb-2 text-center relative flex items-start justify-between">
              <div className="w-8 shrink-0" />
              <div className="relative flex-1 px-1">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-10 bg-amber-500/10 blur-2xl pointer-events-none rounded-full" />
                <h2 className="font-serif text-[28px] sm:text-[30px] font-semibold leading-[1.2] text-white tracking-normal gold-gradient-text">
                  Undang tamu ke acaramu.
                </h2>
                <p className="text-xs text-zinc-400 font-sans mt-1.5 leading-relaxed max-w-[320px] mx-auto">
                  Lihat dunia dari sudut pandang mereka.<br />
                  Undang agar acara ini tak terlupakan.
                </p>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                aria-label="Tutup"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-1 mt-0.5 cursor-pointer"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </header>

            {/* QR Code Section */}
            <section aria-label="QR Code Tamu" className="mt-3 px-2 flex flex-col items-center w-full">
              {/* QR Frame Container */}
              <div className="relative p-3.5 rounded-3xl bg-gradient-to-b from-[#fbf8f2] to-[#ede7dc] shadow-[0_12px_36px_rgba(0,0,0,0.6)] border border-amber-100/20 group">
                {/* Corner Accents for Luxury Aesthetic */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-stone-800/40 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-stone-800/40 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-stone-800/40 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-stone-800/40 rounded-br-sm pointer-events-none" />
                
                {/* QR Image Display */}
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-xl overflow-hidden flex items-center justify-center bg-white p-2 shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&margin=10&data=${encodeURIComponent(albumShareUrl)}`}
                    alt="QR Code Tamu"
                    className="w-full h-full object-contain pointer-events-none rounded-lg"
                  />
                  {/* Camera Icon Overlay in Center of QR */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#121316] rounded-xl flex items-center justify-center shadow-lg border border-amber-300/30 pointer-events-none">
                    <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Scan Instruction Caption */}
              <p className="text-[12px] text-zinc-400 mt-3 text-center tracking-wide flex items-center justify-center gap-1.5 font-normal">
                Scan dengan kamera HP tamu untuk langsung memotret
              </p>
            </section>

            {/* Action Buttons Group */}
            <section aria-label="Aksi Berbagi" className="w-full mt-4 px-1 flex flex-col gap-2.5 pb-2">
              {/* WhatsApp Primary Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Yuk abadikan dan bagikan momen seru kamu di ${albumTitle}! Jepret foto langsung dari kamera tamu di link berikut:\n\n${albumShareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 hover:brightness-105 active:scale-[0.98] transition-all duration-200 border border-emerald-300/30 shadow-lg cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 2C6.511 2 2.016 6.495 2.016 12.016c0 1.954.563 3.778 1.534 5.325L2 22l4.82-1.512c1.474.887 3.208 1.393 5.211 1.393 5.52 0 10.016-4.496 10.016-10.016S17.551 2 12.031 2zm5.834 14.179c-.244.686-1.42 1.31-1.956 1.393-.509.08-1.171.116-3.784-.963-3.136-1.296-5.161-4.475-5.321-4.688-.159-.214-1.278-1.7-1.278-3.243 0-1.543.808-2.302 1.096-2.617.288-.316.63-.395.84-.395.21 0 .42.002.604.012.195.01.455-.074.712.544.267.643.91 2.222.99 2.382.08.16.133.348.026.56-.107.213-.16.348-.32.533-.16.187-.336.417-.48.56-.16.16-.328.334-.141.655.187.321.83 1.368 1.78 2.215 1.22 1.087 2.249 1.424 2.57 1.584.321.16.508.134.695-.08.187-.214.802-.934 1.016-1.254.214-.321.428-.268.722-.16.294.107 1.868.88 2.188 1.04.32.16.534.24.614.374.08.134.08.774-.164 1.46z" />
                </svg>
                <span>Kirim ke WhatsApp</span>
              </a>

              {/* Secondary Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleShareCurrent}
                  className="py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/10 hover:border-white/20 text-zinc-200 hover:text-white font-medium text-[13.5px] flex items-center justify-center gap-2 transition-all duration-150 backdrop-blur-md cursor-pointer"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-4 h-4 text-zinc-400">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>Bagikan Tautan</span>
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/10 hover:border-white/20 text-zinc-200 hover:text-white font-medium text-[13.5px] flex items-center justify-center gap-2 transition-all duration-150 backdrop-blur-md cursor-pointer"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download w-4 h-4 text-zinc-400">
                    <path d="M12 15V3" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m7 10 5 5 5-5" />
                  </svg>
                  <span>Simpan QR</span>
                </button>
              </div>

              {/* Tertiary Special Button: Cetak Kartu Meja */}
              <Link
                href={`/${slug}/albumkami/print-qr/`}
                className="w-full py-2 px-4 rounded-xl text-center text-xs font-medium text-zinc-400 hover:text-amber-200/90 hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-1.5 group cursor-pointer"
              >
                <span>Cetak Kartu Meja Fisik (PDF / Print)</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 text-zinc-400 group-hover:text-amber-200">→</span>
              </Link>
            </section>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL KONFIRMASI UNDUH SEMUA FOTO (ZIP) - Nocturne Noir                */}
      {/* ========================================================================= */}
      {showDownloadConfirmModal && (
        <div
          onClick={() => !isZipping && setShowDownloadConfirmModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-5 sm:p-6 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[380px] rounded-3xl bg-[#131315]/95 border border-[#DFC29D]/25 backdrop-blur-2xl p-7 pt-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(207,172,123,0.12)] overflow-hidden anim-fade-in"
            data-purpose="zip-download-modal-card"
          >
            {/* Top ambient gold line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#DFC29D]/50 to-transparent" />

            <header className="flex flex-col items-center text-center">
              {/* Floating Package Icon with isometric gold styling */}
              <div className="relative mb-5" data-purpose="status-icon">
                <div className="absolute inset-0 bg-champagne-400/20 rounded-2xl blur-xl transform scale-125" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-[#202227] to-[#121316] border border-[#DFC29D]/40 flex items-center justify-center shadow-lg shadow-black/80">
                  <div className="absolute inset-[1px] rounded-[15px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <svg className="w-8 h-8 text-[#EBD8BD] drop-shadow-[0_2px_8px_rgba(207,172,123,0.5)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">
                    <path d="M12 3L20 7.5L12 12L4 7.5L12 3Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" />
                    <path d="M4 7.5V16.5L12 21V12L4 7.5Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" />
                    <path d="M12 12V21L20 16.5V7.5L12 12Z" fill="currentColor" fillOpacity="0.28" stroke="currentColor" />
                    <path d="M12 3V12" stroke="#FAF5ED" strokeOpacity="0.85" strokeWidth="1.4" />
                    <path d="M8 5.25L16 9.75" stroke="#FAF5ED" strokeOpacity="0.65" strokeWidth="1.2" />
                  </svg>
                </div>
              </div>

              <h2 className="font-serif text-[28px] sm:text-[32px] tracking-tight font-medium text-white mb-2.5 leading-tight">
                Unduh Semua Momen?
              </h2>
              <p className="text-sm leading-relaxed text-[#B4B2AD] max-w-[300px] font-normal px-1">
                Sebanyak <span className="font-semibold text-champagne-200">{photos.length} foto</span> akan didownload dalam file ZIP (<span className="font-mono text-xs text-stone-300">.zip</span>) ke perangkat Anda.
              </p>
            </header>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {isZipping ? (
              <div className="space-y-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 my-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Mengemas file foto...</span>
                  <span className="font-mono font-bold text-amber-200">{zipProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-200 to-amber-400 transition-all duration-300"
                    style={{ width: `${zipProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <footer className="flex items-center gap-3 w-full" data-purpose="action-buttons">
                <button
                  type="button"
                  onClick={() => setShowDownloadConfirmModal(false)}
                  className="w-1/2 py-3.5 px-4 rounded-xl text-sm font-medium text-[#B4B2AD] bg-[#202227]/90 hover:bg-[#2d3037] active:bg-[#18191d] border border-white/10 hover:border-white/20 transition-all duration-200 ease-out focus:outline-none focus:ring-1 focus:ring-champagne-400/40 cursor-pointer shadow-sm text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDownloadAllZip();
                    setShowDownloadConfirmModal(false);
                  }}
                  className="w-1/2 py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide text-[#0b0c0e] bg-gradient-to-b from-[#FAF5ED] to-[#DFC29D] hover:from-white hover:to-[#F4E8D5] active:brightness-95 border border-[#F4E8D5]/60 shadow-lg shadow-champagne-500/25 hover:shadow-champagne-500/40 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-champagne-300/60 cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>Unduh</span>
                  <svg className="w-4 h-4 text-[#0b0c0e]/80 group-hover:translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </footer>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BOTTOM SHEET FILTER TAMU (bottom_sheet_filter_tamu_berlatar_beranda)   */}
      {/* ========================================================================= */}
      {showContributorsModal && (
        <div
          onClick={() => setShowContributorsModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[6px] flex items-end justify-center select-none"
        >
          {/* BEGIN: BottomSheetContainer */}
          <main
            onClick={(e) => e.stopPropagation()}
            className="relative z-20 w-full max-w-md mx-auto bg-noir-900/95 backdrop-blur-xl border-t border-x border-amber-500/20 rounded-t-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden anim-slide-up"
            data-purpose="guest-filter-sheet"
          >
            {/* Top Drag Handle Bar */}
            <div className="w-full pt-3 pb-2 flex justify-center items-center cursor-grab active:cursor-grabbing" data-purpose="drag-handle-container">
              <div className="w-10 h-1.5 bg-neutral-600/80 rounded-full" />
            </div>

            {/* Header Section with Title (Tutup cukup klik area luar/atas bottom sheet) */}
            <header className="px-6 pt-1 pb-4 text-center relative border-b border-white/[0.06]" data-purpose="sheet-header">
              <div className="relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-12 bg-gold-500/15 blur-2xl pointer-events-none rounded-full" />
                <h1 className="font-serif text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-white to-amber-200" id="sheet-title">
                  Tamu Pengisi Album
                </h1>
                <p className="text-xs text-neutral-400 font-sans mt-0.5">Saring kenangan berdasarkan pengirim foto</p>
              </div>
            </header>

            {/* Scrollable Guest Filter List */}
            <div aria-labelledby="sheet-title" className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 custom-scrollbar flex-1" data-purpose="filter-options-list" role="radiogroup">
              {/* Item 1: 'Semua Momen' */}
              {selectedContributor === 'ALL' ? (
                <button
                  type="button"
                  aria-checked="true"
                  onClick={() => {
                    setSelectedContributor('ALL');
                    setShowContributorsModal(false);
                  }}
                  className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-white/95 to-amber-50 text-noir-950 flex items-center justify-between shadow-gold-glow transition-all duration-200 transform active:scale-[0.99] border border-amber-200/80 group cursor-pointer"
                  data-purpose="active-filter-item"
                  role="radio"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-noir-900/10 flex items-center justify-center shrink-0 shadow-inner text-noir-950">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform">
                        <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                    </div>
                    <div className="truncate">
                      <h2 className="font-semibold text-noir-950 text-base leading-tight tracking-tight">Semua Momen</h2>
                      <p className="text-xs text-neutral-700 font-normal mt-0.5">{photos.length} total foto terkumpul</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-noir-950/10 flex items-center justify-center shrink-0 ml-2">
                    <svg className="w-4 h-4 text-noir-950 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  aria-checked="false"
                  onClick={() => {
                    setSelectedContributor('ALL');
                    setShowContributorsModal(false);
                  }}
                  className="w-full text-left p-3 sm:p-3.5 rounded-2xl bg-noir-850 hover:bg-noir-800 active:bg-noir-700 border border-white/5 hover:border-gold-500/30 flex items-center justify-between transition-all duration-200 group cursor-pointer"
                  data-purpose="guest-filter-item"
                  role="radio"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-noir-800 to-noir-950 border border-gold-500/30 flex items-center justify-center shrink-0 shadow-inner-subtle group-hover:border-gold-400/60 transition-colors text-gold-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform">
                        <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                    </div>
                    <div className="truncate">
                      <span className="font-medium text-white group-hover:text-amber-100 text-[15px] block leading-tight tracking-normal transition-colors">Semua Momen</span>
                      <span className="text-xs text-neutral-400 font-light mt-0.5 block">{photos.length} total foto terkumpul</span>
                    </div>
                  </div>
                  <div className="text-neutral-500 group-hover:text-gold-400 transition-colors pr-1">
                    <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Items 2..N: Tiap Tamu / Kontributor */}
              {contributors.map((name) => {
                const count = photos.filter((p) => p.guest_name === name).length;
                const isSelected = selectedContributor === name;
                const initial = (name.charAt(0) || 'T').toUpperCase();

                if (isSelected) {
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-checked="true"
                      onClick={() => {
                        setSelectedContributor(name);
                        setShowContributorsModal(false);
                      }}
                      className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-white/95 to-amber-50 text-noir-950 flex items-center justify-between shadow-gold-glow transition-all duration-200 transform active:scale-[0.99] border border-amber-200/80 group cursor-pointer"
                      data-purpose="active-filter-item"
                      role="radio"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-noir-900/10 flex items-center justify-center text-lg shrink-0 shadow-inner">
                          <span className="font-serif font-bold text-noir-950 text-lg">{initial}</span>
                        </div>
                        <div className="truncate">
                          <h2 className="font-semibold text-noir-950 text-base leading-tight tracking-tight">{name}</h2>
                          <p className="text-xs text-neutral-700 font-normal mt-0.5">{count} foto diabadikan</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-noir-950/10 flex items-center justify-center shrink-0 ml-2">
                        <svg className="w-4 h-4 text-noir-950 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={name}
                    type="button"
                    aria-checked="false"
                    onClick={() => {
                      setSelectedContributor(name);
                      setShowContributorsModal(false);
                    }}
                    className="w-full text-left p-3 sm:p-3.5 rounded-2xl bg-noir-850 hover:bg-noir-800 active:bg-noir-700 border border-white/5 hover:border-gold-500/30 flex items-center justify-between transition-all duration-200 group cursor-pointer"
                    data-purpose="guest-filter-item"
                    role="radio"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-noir-800 to-noir-950 border border-gold-500/30 flex items-center justify-center shrink-0 shadow-inner-subtle group-hover:border-gold-400/60 transition-colors">
                        <span className="font-serif font-bold text-gold-400 text-lg">{initial}</span>
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-white group-hover:text-amber-100 text-[15px] block leading-tight tracking-normal transition-colors">{name}</span>
                        <span className="text-xs text-neutral-400 font-light mt-0.5 block">{count} foto diabadikan</span>
                      </div>
                    </div>
                    <div className="text-neutral-500 group-hover:text-gold-400 transition-colors pr-1">
                      <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Spacing & Safe Area */}
            <footer className="p-3 border-t border-white/[0.06] bg-noir-950/80 backdrop-blur pb-6 flex justify-center shrink-0" data-purpose="sheet-footer">
              <div className="w-32 h-1 bg-white/20 rounded-full" />
            </footer>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PENGATURAN ACARA (bottom_sheet_pengaturan_interaktif_full_screen)       */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-[#070709] text-white overflow-y-auto selection:bg-luxury-gold selection:text-black anim-slide-up">
          <div className="relative mx-auto w-full max-w-[430px] min-h-screen bg-[#0a0a0c] border-x border-white/[0.04] shadow-2xl pb-16">
            
            {/* Top Blurred Cover Header */}
            <div className="relative h-44 overflow-hidden">
              <img
                src="/images/satualbum_cover.webp"
                alt={albumTitle}
                className="w-full h-full object-cover filter blur-[6px] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/75 to-[#0a0a0c]" />

              {/* Back Button */}
              <div className="absolute top-8 left-4 z-20">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg cursor-pointer"
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
              <span className="text-[10px] font-semibold tracking-widest uppercase text-luxury-gold px-2.5 py-0.5 rounded-full bg-luxury-gold/15 border border-luxury-gold/30 inline-block mb-1.5">
                Wedding Gallery
              </span>
              <h1 className="font-serif text-[26px] font-semibold text-white tracking-wide">
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
                <div
                  onClick={() => {
                    const baseEvDate = albumData?.event_date || new Date().toISOString().split('T')[0];
                    const initialDate = albumData?.close_date || addDaysToDate(baseEvDate, 7);
                    const initialTime = albumData?.close_time || '17:00';
                    setEditCloseDate(initialDate);
                    setEditCloseTime(initialTime);
                    setShowEditCloseDateModal(true);
                  }}
                  className="p-3.5 hover:bg-white/[0.03] cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between group"
                >
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
                      {albumData?.close_date_formatted || (albumData?.event_date_formatted ? `${albumData.event_date_formatted}, 17.00` : '30 Nov 2026, 17.00')}
                    </span>
                    <svg className="w-4 h-4 text-zinc-500 shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* 3. Foto per Orang */}
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
      {/* 5. MODAL ONBOARDING TAMU (Pop-up Masuk Tamu - Nocturne Noir)               */}
      {/* ========================================================================= */}
      {showGuestNameModal && (
        <main
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md anim-fade-in select-none"
          data-purpose="guest-entry-modal"
        >
          <div className="w-full max-w-[390px] mx-auto">
            <section aria-label="Modal Kamera Tamu" className="glass-card rounded-3xl p-6 sm:p-7 border border-white/15 relative overflow-hidden backdrop-blur-2xl shadow-2xl" data-purpose="guest-entry-card">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
              
              <div className="flex flex-col items-center text-center space-y-4 pt-1">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/15 bg-white/[0.04] text-[10px] sm:text-[11px] font-medium tracking-[0.16em] uppercase text-zinc-300 backdrop-blur-md" data-purpose="status-badge">
                  <span>Kamera Tamu</span>
                  <span className="text-white/40 text-[8px]">•</span>
                  <span>Album Pernikahan</span>
                </div>

                {/* Title & Subtitle */}
                <h1 className="font-serif text-[1.95rem] leading-[1.2] sm:text-3xl text-zinc-50 font-semibold tracking-normal mt-1" id="modal-headline">
                  Album Pernikahan<br />{displayCoupleName}
                </h1>
                <p className="text-zinc-400 text-[13px] sm:text-sm leading-relaxed max-w-[310px] font-normal tracking-wide">
                  Tulis namamu untuk mulai mengambil foto <br />di album bersama.
                </p>

                {/* Form Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveGuestName(undefined, true);
                  }}
                  className="w-full pt-2 space-y-4 text-left"
                  data-purpose="guest-form"
                  id="guest-entry-form"
                  method="POST"
                >
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 pl-1" htmlFor="guest-input-name">
                      Siapa Namamu?
                    </label>
                    <div className="relative">
                      <input
                        id="guest-input-name"
                        name="guestName"
                        type="text"
                        value={guestInputName}
                        onChange={(e) => setGuestInputName(e.target.value)}
                        placeholder="Tulis nama panggilanmu..."
                        autoFocus
                        autoComplete="off"
                        required
                        className="input-glass w-full rounded-2xl px-4 py-3.5 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 placeholder:font-light outline-none transition focus:ring-0"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="gold-shimmer w-full text-zinc-950 font-semibold text-sm sm:text-base py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.08)] cursor-pointer active:scale-[0.98] transition-all"
                    data-purpose="action-submit"
                  >
                    <span>Mulai Memotret</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-950 fill-current inline-block shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h3.17L9 4.83C9.37 4.31 9.96 4 10.6 4h2.8c.64 0 1.23.31 1.6.83L16.83 7H20c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2zm8 11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-1.8c-1.77 0-3.2-1.43-3.2-3.2s1.43-3.2 3.2-3.2 3.2 1.43 3.2 3.2-1.43 3.2-3.2 3.2z" />
                    </svg>
                  </button>
                </form>

                {/* Secondary Link */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveGuestName(guestInputName || 'Tamu', false)}
                    data-purpose="secondary-link"
                    className="group inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 hover:text-amber-200/90 transition-colors duration-200 tracking-wide cursor-pointer"
                  >
                    <span>Lihat Galeri Bersama</span>
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 font-mono">→</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL SETUP HOST (Pop-up Pengaturan Masuk dari WIM Pertama Kali)         */}
      {/* ========================================================================= */}
      {showHostSetupModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none">
          <div className="w-full max-w-md bg-[#121215] border-t md:border border-luxury-gold/30 rounded-t-[32px] md:rounded-[32px] px-6 pt-4 pb-8 text-white shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 mx-auto flex items-center justify-center text-2xl mb-3 shadow-inner text-luxury-gold">
                📸
              </div>
              <h3 className="font-serif text-[24px] font-semibold text-white tracking-tight mb-1.5">
                Atur Album Kami
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto font-sans">
                Ruang penyimpanan R2 untuk album pernikahan Anda telah aktif. Beri nama khusus &amp; tentukan kuota rol kamera tamu.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-semibold text-luxury-goldLight mb-2 uppercase tracking-wider text-left">
                  Nama Album
                </label>
                <input
                  type="text"
                  value={hostAlbumTitleInput}
                  onChange={(e) => setHostAlbumTitleInput(e.target.value)}
                  placeholder="Contoh: Album Resepsi Dika &amp; Riyan"
                  className="w-full h-12 bg-[#18181b] border border-white/10 focus:border-luxury-gold rounded-xl px-4 text-white placeholder-zinc-500 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-luxury-goldLight mb-2 uppercase tracking-wider text-left">
                  Foto per Tamu (Kamera Roll)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 36, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setHostRollLimitInput(num)}
                      className={`h-11 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        hostRollLimitInput === num
                          ? 'bg-gradient-to-r from-[#FAF5ED] to-[#DFC29D] text-black border-amber-200 shadow-md font-bold'
                          : 'bg-[#18181b] text-zinc-400 border-white/5 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {num} foto
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                disabled={isSavingSettings}
                onClick={async () => {
                  await saveSetting({
                    title: hostAlbumTitleInput.trim() || albumTitle,
                    roll_limit: hostRollLimitInput,
                  });
                  try {
                    localStorage.setItem(`storykami_host_setup_completed_${slug}`, 'true');
                  } catch (e) {}
                  setShowHostSetupModal(false);
                }}
                className="w-full h-12 rounded-xl gold-shimmer text-zinc-950 font-semibold text-sm active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingSettings ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Simpan &amp; Buka Galeri</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.setItem(`storykami_host_setup_completed_${slug}`, 'true');
                  } catch (e) {}
                  setShowHostSetupModal(false);
                }}
                className="w-full h-10 rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white font-medium text-xs active:scale-[0.98] transition-all cursor-pointer"
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
            className="w-full max-w-md bg-[#121215] border-t md:border border-luxury-gold/30 rounded-t-[32px] md:rounded-[32px] px-6 pt-4 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-5">
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-1">
                Ubah Nama Album
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Nama ini akan tampil di bagian atas galeri album
              </p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                placeholder="Nama Album"
                className="w-full h-12 bg-[#18181b] border border-white/10 focus:border-luxury-gold rounded-xl px-4 text-white placeholder-zinc-500 text-sm outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEditTitleModal(false)}
                className="h-11 rounded-xl bg-[#18181b] hover:bg-[#202025] border border-white/10 text-zinc-300 font-medium text-xs active:scale-95 transition-all cursor-pointer"
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
                className="h-11 rounded-xl gold-shimmer text-zinc-950 font-semibold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
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
            className="w-full max-w-md bg-[#121215] border-t md:border border-luxury-gold/30 rounded-t-[32px] md:rounded-[32px] px-6 pt-4 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-5">
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-1">
                Foto per Tamu (Kamera Roll)
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
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
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FAF5ED] to-[#DFC29D] text-black border-amber-200 shadow-lg'
                        : 'bg-[#18181b] border-white/5 hover:border-white/20 text-white'
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
              className="w-full h-11 rounded-xl bg-[#18181b] hover:bg-[#202025] border border-white/10 text-zinc-300 font-medium text-xs active:scale-95 transition-all cursor-pointer"
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
            className="w-full max-w-md bg-[#121215] border-t md:border border-luxury-gold/30 rounded-t-[32px] md:rounded-[32px] px-6 pt-4 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-5">
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-1">
                Kapasitas Tamu Bergabung
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
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
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FAF5ED] to-[#DFC29D] text-black border-amber-200 shadow-lg'
                        : 'bg-[#18181b] border-white/5 hover:border-white/20 text-white'
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
              className="w-full h-11 rounded-xl bg-[#18181b] hover:bg-[#202025] border border-white/10 text-zinc-300 font-medium text-xs active:scale-95 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SUB-MODAL: ATUR TANGGAL BERAKHIR / DITUTUP                            */}
      {/* ========================================================================= */}
      {showEditCloseDateModal && (
        <div
          onClick={() => setShowEditCloseDateModal(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#121215] border-t md:border border-luxury-gold/30 rounded-t-[32px] md:rounded-[32px] px-6 pt-4 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-5">
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-1">
                Batas Pengunggahan Foto
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Tentukan batas waktu pengunggahan foto dari tamu
              </p>
            </div>

            {/* Info Tanggal Acara */}
            {albumData?.event_date_formatted && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <span className="text-lg">📅</span>
                <div className="text-left">
                  <p className="text-[11px] text-amber-200/80 uppercase tracking-wider font-semibold">Tanggal Acara</p>
                  <p className="text-xs text-amber-100 font-medium">
                    {albumData.event_date_formatted} (Batas awal penutupan)
                  </p>
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Pilihan Cepat
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'Hari Acara (23.59)',
                    getDate: () => albumData?.event_date || new Date().toISOString().split('T')[0],
                    time: '23:59',
                  },
                  {
                    label: '+3 Hari (17.00)',
                    getDate: () => addDaysToDate(albumData?.event_date || new Date().toISOString().split('T')[0], 3),
                    time: '17:00',
                  },
                  {
                    label: '+7 Hari (Rekomendasi)',
                    getDate: () => addDaysToDate(albumData?.event_date || new Date().toISOString().split('T')[0], 7),
                    time: '17:00',
                  },
                  {
                    label: '+30 Hari (1 Bulan)',
                    getDate: () => addDaysToDate(albumData?.event_date || new Date().toISOString().split('T')[0], 30),
                    time: '17:00',
                  },
                ].map((preset, idx) => {
                  const pDate = preset.getDate();
                  const isSelected = editCloseDate === pDate && editCloseTime === preset.time;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditCloseDate(pDate);
                        setEditCloseTime(preset.time);
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#d4af37]/20 border-[#d4af37] text-luxury-goldLight font-semibold'
                          : 'bg-[#18181b] border-white/5 hover:border-white/20 text-zinc-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Picker */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="col-span-3">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Tanggal Ditutup
                </label>
                <input
                  type="date"
                  min={albumData?.event_date || new Date().toISOString().split('T')[0]}
                  value={editCloseDate}
                  onChange={(e) => setEditCloseDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full h-11 bg-[#18181b] border border-white/10 focus:border-luxury-gold rounded-xl px-3 text-white text-xs outline-none transition-all cursor-pointer"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Jam (WIB)
                </label>
                <input
                  type="time"
                  value={editCloseTime}
                  onChange={(e) => setEditCloseTime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full h-11 bg-[#18181b] border border-white/10 focus:border-luxury-gold rounded-xl px-3 text-white text-xs outline-none transition-all cursor-pointer text-center"
                />
              </div>
            </div>

            {/* Live Result Preview */}
            <div className="mb-6 p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Jadwal Penutupan:</span>
              <span className="font-semibold text-luxury-goldLight">
                {editCloseDate ? formatCloseDateIndo(editCloseDate, editCloseTime) : '-'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowEditCloseDateModal(false)}
                className="h-11 rounded-xl bg-[#18181b] hover:bg-[#202025] border border-white/10 text-zinc-300 font-medium text-xs active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingSettings}
                onClick={async () => {
                  const minDate = albumData?.event_date || '';
                  if (minDate && editCloseDate < minDate) {
                    setToastMessage(`✕ Tanggal ditutup tidak boleh sebelum tanggal acara (${albumData?.event_date_formatted || minDate})`);
                    setTimeout(() => setToastMessage(null), 3500);
                    return;
                  }
                  if (!editCloseDate) {
                    setToastMessage('✕ Silakan pilih tanggal penutupan');
                    setTimeout(() => setToastMessage(null), 3000);
                    return;
                  }

                  const formatted = formatCloseDateIndo(editCloseDate, editCloseTime);
                  const success = await saveSetting({
                    album_settings: {
                      close_date: editCloseDate,
                      close_time: editCloseTime,
                      close_date_formatted: formatted,
                    },
                  });

                  if (success) {
                    setAlbumData((prev) => ({
                      ...prev,
                      close_date: editCloseDate,
                      close_time: editCloseTime,
                      close_date_formatted: formatted,
                    }));
                    setShowEditCloseDateModal(false);
                  }
                }}
                className="h-11 rounded-xl gold-shimmer text-zinc-950 font-semibold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSavingSettings ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. SUB-MODAL: KONFIRMASI HAPUS FOTO LIGHTBOX                              */}
      {/* ========================================================================= */}
      {showDeletePhotoConfirmModal && (
        <div
          onClick={() => !isDeleting && setShowDeletePhotoConfirmModal(false)}
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-end justify-center p-0 md:items-center md:p-4 anim-slide-up select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#121215] border-t md:border border-red-500/30 rounded-t-[32px] md:rounded-[32px] px-6 pt-4 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/30 mx-auto flex items-center justify-center text-2xl mb-3 text-red-400 shadow-inner">
                🗑️
              </div>
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-1.5">
                Hapus Foto Ini?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto font-sans">
                Foto yang diabadikan oleh <strong className="text-white">{currentPhoto?.guest_name || 'Tamu'}</strong> akan dihapus permanen dari galeri album bersama.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeletePhotoConfirmModal(false)}
                className="h-11 rounded-xl bg-[#18181b] hover:bg-[#202025] border border-white/10 text-zinc-300 font-medium text-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDeletePhotoAction}
                className="h-11 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 font-semibold text-xs active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            className="w-full max-w-md bg-[#121215] border-t md:border border-amber-500/30 rounded-t-[32px] md:rounded-[32px] px-6 pt-4 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-2xl mb-3 text-amber-300 shadow-inner">
                ⚠️
              </div>
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-1.5">
                Hapus Acara Ini?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto font-sans">
                Album ini terhubung secara langsung dengan undangan pernikahan utama Anda di StoryKami. Untuk mengelola atau menghapus seluruh undangan beserta album, silakan lakukan dari <strong className="text-white">Dashboard WIM</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteAlbumConfirmModal(false)}
              className="w-full h-11 rounded-xl gold-shimmer text-zinc-950 font-semibold text-xs active:scale-95 transition-all shadow-xl cursor-pointer"
            >
              Mengerti &amp; Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
