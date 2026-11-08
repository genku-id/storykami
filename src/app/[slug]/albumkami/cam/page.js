'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import '../albumkami.css';

// Global memory queue untuk proses upload latar belakang yang kebal unmount/navigasi halaman
if (typeof window !== 'undefined') {
  window.__storykami_upload_tasks = window.__storykami_upload_tasks || [];
}

const executeBackgroundUploadTask = async ({
  slug,
  deviceToken,
  originalBlob,
  thumbBlob,
  finalSenderName,
  pendingId,
}) => {
  try {
    // Pastikan deviceToken terisi
    let effectiveToken = deviceToken;
    if (!effectiveToken && typeof window !== 'undefined') {
      effectiveToken = localStorage.getItem('storykami_cam_token') || localStorage.getItem('storykami_device_token') || '';
    }
    if (!effectiveToken && typeof window !== 'undefined') {
      effectiveToken = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('storykami_cam_token', effectiveToken);
    }

    // 🚀 SINGLE-SHOT UNIFIED UPLOAD: 1x HTTP request, server memproses R2 & DB secara paralel kilat (<400ms)
    const formData = new FormData();
    formData.append('file', originalBlob, 'photo.jpg');
    if (thumbBlob) {
      formData.append('thumb', thumbBlob, 'thumb.webp');
    }
    formData.append('device_token', effectiveToken);
    formData.append('guest_name', finalSenderName);

    const uploadRes = await fetch(`/api/album/${slug}/upload/`, {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.success) {
      throw new Error(uploadData.error || 'Gagal mengunggah foto');
    }

    const serverPhotoId = uploadData.photo?.id;
    const r2Key = uploadData.key;

    // Bersihkan pending upload seketika & simpan foto resmi ke cache galeri lokal
    try {
      const pendingKey = `storykami_pending_uploads_${slug}`;
      const curPending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      localStorage.setItem(pendingKey, JSON.stringify(curPending.filter((p) => p.id !== pendingId)));

      const cacheKey = `storykami_cache_${slug}_photos`;
      const existingCache = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const cleanCache = existingCache.filter((p) => p.id !== pendingId && p.id !== serverPhotoId);
      const serverPhotoObj = uploadData.photo || {
        id: serverPhotoId,
        album_id: uploadData.photo?.album_id,
        guest_name: finalSenderName,
        r2_key: r2Key,
        r2_image_url: `/api/album/${slug}/image/?key=${encodeURIComponent(r2Key)}`,
        r2_thumb_url: `/api/album/${slug}/image/?key=${encodeURIComponent(r2Key.replace(/\.jpg$/, '_thumb.webp'))}`,
        preset_applied: 'original-highres',
        likes_count: 0,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(cacheKey, JSON.stringify([serverPhotoObj, ...cleanCache]));
    } catch (e) {}

    // Dispatch custom event agar galeri seketika sinkronisasi jika pengguna sedang berada di galeri
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('storykami_photo_uploaded', {
          detail: { slug, photoId: serverPhotoId },
        })
      );
    }

    return { success: true, confirmData: uploadData };
  } catch (err) {
    console.error('Background upload execution error:', err);
    try {
      const pendingKey = `storykami_pending_uploads_${slug}`;
      const curPending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      const updatedPending = curPending.map((p) =>
        p.id === pendingId
          ? { ...p, status: 'error', errorMessage: err.message || 'Gagal mengunggah foto' }
          : p
      );
      localStorage.setItem(pendingKey, JSON.stringify(updatedPending));
    } catch (e) {}
    throw err;
  }
};

export default function SatualbumCameraPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || '';

  // State Sesi & Tamu
  const [guestName, setGuestName] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Info Album & Kuota
  const [albumInfo, setAlbumInfo] = useState(null);
  const [remainingRolls, setRemainingRolls] = useState(35);
  const [rollLimit, setRollLimit] = useState(35);

  // Hardware Kamera
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' | 'environment'
  const [cameraError, setCameraError] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 or 2

  // Shutter & Preview States
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [snapEffect, setSnapEffect] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null); // { originalBlob, thumbBlob, url, width, height, originalSize, thumbSize }
  const [senderName, setSenderName] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [recentPhoto, setRecentPhoto] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Background Upload State (Upload di latar belakang tanpa blokir UI)
  const [bgUploadQueue, setBgUploadQueue] = useState(0);
  const [bgToast, setBgToast] = useState({ show: false, type: 'uploading', message: '' });

  // Format File Size
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 1. Inisialisasi Device Token di LocalStorage
  useEffect(() => {
    let token = localStorage.getItem('storykami_cam_token');
    if (!token) {
      token = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('storykami_cam_token', token);
    }
    setDeviceToken(token);

    const savedName = localStorage.getItem('storykami_guest_name') || '';
    if (savedName) {
      setGuestName(savedName);
      setSenderName(savedName);
    }
  }, []);

  // 2. Load info album, sesi tamu, dan foto terbaru
  useEffect(() => {
    if (!slug || !deviceToken) return;

    async function fetchInfo() {
      try {
        setIsLoadingSession(true);
        const res = await fetch(`/api/album/${slug}/info/?device_token=${deviceToken}`, { cache: 'no-store' });
        const data = await res.json();

        if (data.album) {
          setAlbumInfo(data.album);
          const limit = data.album.roll_limit || 35;
          setRollLimit(limit);
          setRemainingRolls(limit);
        }

        const savedName = localStorage.getItem('storykami_guest_name') || '';

        if (data.guestSession) {
          setIsRegistered(true);
          setGuestName(data.guestSession.guest_name);
          setSenderName(data.guestSession.guest_name);
          setRemainingRolls(data.guestSession.remaining_rolls);
        } else if (savedName) {
          // Auto-register jika sudah ada nama tersimpan di perangkat
          try {
            const regRes = await fetch(`/api/album/${slug}/session/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ guest_name: savedName, device_token: deviceToken }),
            });
            const regData = await regRes.json();
            if (regData.guest) {
              setIsRegistered(true);
              setRemainingRolls(regData.guest.remaining_rolls);
            }
          } catch (e) {}
        } else {
          setIsRegistered(false);
        }

        // Ambil thumbnail foto terakhir di galeri untuk slot kanan bawah
        try {
          const photoRes = await fetch(`/api/album/${slug}/photos/?_t=${Date.now()}`, { cache: 'no-store' });
          const photoData = await photoRes.json();
          if (photoData.photos && photoData.photos.length > 0) {
            setRecentPhoto(photoData.photos[0].r2_thumb_url || photoData.photos[0].r2_image_url);
          } else {
            setRecentPhoto(null);
          }
        } catch (e) {}
      } catch (err) {
        console.error('Failed to load album info:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    fetchInfo();
  }, [slug, deviceToken]);

  // 3. Start Camera Stream (Langsung start agar viewfinder aktif & jernih)
  useEffect(() => {
    if (previewPhoto) return; // Jeda kamera saat sedang pratinjau

    let activeStream = null;

    async function startCamera() {
      try {
        setCameraError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 3840, min: 1920 },
            height: { ideal: 2160, min: 1080 },
          },
          audio: false,
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (strictErr) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
            audio: false,
          });
        }

        activeStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        setHasTorch(Boolean(capabilities.torch));
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError('Izin kamera belum aktif. Buka pengaturan browser untuk mengizinkan akses kamera.');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, previewPhoto]);

  // Toggle Torch (Hardware flashlight jika didukung, atau screen-flash)
  const toggleTorch = async () => {
    const next = !torchOn;
    setTorchOn(next);
    if (streamRef.current) {
      try {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          if (capabilities.torch) {
            await track.applyConstraints({ advanced: [{ torch: next }] });
          }
        }
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Flip Camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Zoom Handler (1x vs 2x)
  const handleToggleZoom = async (level) => {
    setZoomLevel(level);
    if (streamRef.current) {
      try {
        const track = streamRef.current.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.zoom) {
          await track.applyConstraints({ advanced: [{ zoom: level }] });
        }
      } catch (e) {
        console.warn('Hardware zoom not supported, relying on canvas/CSS crop');
      }
    }
  };

  // Register Guest Form Submission
  const handleRegisterGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      setIsLoadingSession(true);
      const cleanName = guestName.trim();
      localStorage.setItem('storykami_guest_name', cleanName);
      setSenderName(cleanName);

      const res = await fetch(`/api/album/${slug}/session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_name: cleanName, device_token: deviceToken }),
      });

      const data = await res.json();
      if (data.guest) {
        setIsRegistered(true);
        setRemainingRolls(data.guest.remaining_rolls);
      } else {
        alert(data.error || 'Gagal mendaftar');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Shutter Sound via Web Audio API
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  };

  // Keyboard shortcut (Spacebar) untuk Laptop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && isRegistered && !isCapturing && !previewPhoto && remainingRolls > 0) {
        e.preventDefault();
        handleCapturePhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRegistered, isCapturing, previewPhoto, remainingRolls]);

  // 📸 Jepret Foto -> Muncul Preview Terlebih Dahulu (Dual-file: Asli High-Res & Thumbnail WebP)
  const handleCapturePhoto = async () => {
    if (isCapturing || remainingRolls <= 0 || !videoRef.current || albumInfo?.is_closed) return;

    setIsCapturing(true);
    setSnapEffect(true);
    playShutterSound();
    setTimeout(() => setSnapEffect(false), 300);

    try {
      const video = videoRef.current;
      const vWidth = video.videoWidth || 1920;
      const vHeight = video.videoHeight || 1080;

      // --- 1. KANVAS RESOLUSI ASLI (1920px Full HD - Kualitas Tinggi & Transfer Instan) ---
      const maxOrigDim = 1920; // 1920px Full HD (sangat tajam & jernih di semua smartphone/layar retina)
      let oW = vWidth;
      let oH = vHeight;
      if (oW > maxOrigDim || oH > maxOrigDim) {
        if (oW > oH) {
          oH = Math.round((oH * maxOrigDim) / oW);
          oW = maxOrigDim;
        } else {
          oW = Math.round((oW * maxOrigDim) / oH);
          oH = maxOrigDim;
        }
      }

      const origCanvas = document.createElement('canvas');
      origCanvas.width = oW;
      origCanvas.height = oH;
      const origCtx = origCanvas.getContext('2d');

      if (zoomLevel === 2) {
        const cropW = vWidth / 2;
        const cropH = vHeight / 2;
        const startX = (vWidth - cropW) / 2;
        const startY = (vHeight - cropH) / 2;
        origCtx.drawImage(video, startX, startY, cropW, cropH, 0, 0, oW, oH);
      } else {
        origCtx.drawImage(video, 0, 0, oW, oH);
      }

      // Export file asli High-Res JPEG (kualitas 0.82 - visual kristal tajam, ukuran ~200KB, upload super kilat)
      const originalBlob = await new Promise((resolve) => {
        origCanvas.toBlob(resolve, 'image/jpeg', 0.82);
      });

      if (!originalBlob) throw new Error('Gagal memproses gambar asli');

      // --- 2. KANVAS THUMBNAIL RINGAN (WebP ~500px, ~20KB) ---
      const maxThumbDim = 500;
      let thumbW = vWidth;
      let thumbH = vHeight;
      if (thumbW > maxThumbDim || thumbH > maxThumbDim) {
        if (thumbW > thumbH) {
          thumbH = Math.round((thumbH * maxThumbDim) / thumbW);
          thumbW = maxThumbDim;
        } else {
          thumbW = Math.round((thumbW * maxThumbDim) / thumbH);
          thumbH = maxThumbDim;
        }
      }

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const thumbCtx = thumbCanvas.getContext('2d');
      thumbCtx.drawImage(origCanvas, 0, 0, thumbW, thumbH);

      // Export file thumbnail WebP ringan (kualitas 0.70)
      const thumbBlob = await new Promise((resolve) => {
        thumbCanvas.toBlob(resolve, 'image/webp', 0.70);
      });

      // Tampilkan Layar Pratinjau (Preview)
      const previewUrl = URL.createObjectURL(originalBlob);
      setPreviewPhoto({
        originalBlob,
        thumbBlob,
        url: previewUrl,
        width: vWidth,
        height: vHeight,
        originalSize: formatBytes(originalBlob.size),
        thumbSize: formatBytes(thumbBlob?.size || 0),
      });
      setUploadSuccess(false);
    } catch (err) {
      console.error('Capture error:', err);
      alert(err.message || 'Gagal memotret');
    } finally {
      setIsCapturing(false);
    }
  };

  // Batalkan Preview / Foto Ulang
  const handleRetake = () => {
    if (isUploading) return;
    if (previewPhoto?.url) {
      URL.revokeObjectURL(previewPhoto.url);
    }
    setPreviewPhoto(null);
    setUploadSuccess(false);
  };

  // 🚀 Unggah Foto Aman (Kunci Layar Selama Proses Lalu Otomatis ke Galeri)
  const handleConfirmUpload = async () => {
    if (!previewPhoto?.originalBlob || isUploading) return;

    const photoToUpload = { ...previewPhoto };
    const finalSenderName = (senderName || guestName || 'Tamu').trim();
    try {
      localStorage.setItem('storykami_guest_name', finalSenderName);
    } catch (e) {}

    setIsUploading(true);
    setStatusMessage('Mengunggah ke galeri...');

    const pendingId = 'pending_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // 1. Simpan ke pending uploads & cache lokal seketika
    const optimisticPhoto = {
      id: pendingId,
      guest_name: finalSenderName,
      r2_key: '',
      r2_image_url: photoToUpload.url,
      r2_thumb_url: photoToUpload.url,
      preset_applied: 'original-highres',
      likes_count: 0,
      created_at: new Date().toISOString(),
      isPending: true,
      timestamp: Date.now(),
    };

    try {
      const pendingKey = `storykami_pending_uploads_${slug}`;
      const curPending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      localStorage.setItem(pendingKey, JSON.stringify([optimisticPhoto, ...curPending]));

      const cacheKey = `storykami_cache_${slug}_photos`;
      const existing = localStorage.getItem(cacheKey);
      let list = existing ? JSON.parse(existing) : [];
      list = [optimisticPhoto, ...list.filter((p) => p.id !== pendingId)];
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch (e) {}

    // Konversi thumbnail WebP ke Base64 Data URL secara cepat agar cache lokal persisten
    if (photoToUpload.thumbBlob) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result;
          if (b64) {
            try {
              const pendingKey = `storykami_pending_uploads_${slug}`;
              const curPending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
              const updated = curPending.map((p) =>
                p.id === pendingId ? { ...p, r2_thumb_url: b64, r2_image_url: b64 } : p
              );
              localStorage.setItem(pendingKey, JSON.stringify(updated));

              const cacheKey = `storykami_cache_${slug}_photos`;
              const curCache = JSON.parse(localStorage.getItem(cacheKey) || '[]');
              const updatedCache = curCache.map((p) =>
                p.id === pendingId ? { ...p, r2_thumb_url: b64, r2_image_url: b64 } : p
              );
              localStorage.setItem(cacheKey, JSON.stringify(updatedCache));
            } catch (e) {}
          }
        };
        reader.readAsDataURL(photoToUpload.thumbBlob);
      } catch (e) {}
    }

    try {
      // 2. Eksekusi upload dan konfirmasi ke database sampai tuntas
      const res = await executeBackgroundUploadTask({
        slug,
        deviceToken,
        originalBlob: photoToUpload.originalBlob,
        thumbBlob: photoToUpload.thumbBlob,
        finalSenderName,
        pendingId,
      });

      if (res.confirmData?.remainingRolls !== undefined) {
        setRemainingRolls(res.confirmData.remainingRolls);
      }

      setRemainingRolls((prev) => Math.max(0, prev - 1));
      setUploadSuccess(true);

      // Bersihkan preview object URL
      if (previewPhoto?.url) {
        URL.revokeObjectURL(previewPhoto.url);
      }

      // 3. Sukses! Langsung arahkan kembali ke beranda/galeri album
      router.push(`/${slug}/albumkami/`);
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
      alert(`⚠️ ${err.message || 'Gagal mengunggah foto. Pastikan koneksi internet aktif lalu coba lagi.'}`);
    }
  };

  const albumTitle = albumInfo?.title || 'Awal dari Selamanya';
  const displayCoupleName = (albumTitle || '')
    .replace(/^(album\s+pernikahan\s*[:\-–—]?\s*)+/gi, '')
    .trim() || 'fafa-fufu';

  // =========================================================================
  // 1. MODAL PRATINJAU FOTO (Nocturne Noir Luxury Preview Viewfinder)
  // =========================================================================
  if (previewPhoto) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-noir-950 antialiased overflow-x-hidden select-none">
        {/* BEGIN: MobileDeviceContainer */}
        <div
          className="relative w-full max-w-[412px] h-[100dvh] sm:h-[844px] bg-noir-900 sm:rounded-[44px] overflow-hidden flex flex-col justify-between shadow-2xl border border-noir-800/80"
          data-purpose="photo-preview-container"
        >
          {/* iOS Dynamic Island & Status Bar Space */}
          <div className="w-full pt-3 pb-1 px-8 flex justify-between items-center text-xs tracking-wider text-stone-400 font-medium z-30 select-none" data-purpose="status-bar-spacer">
            <div className="w-20 h-4 bg-black rounded-full mx-auto hidden sm:block" />
          </div>

          {/* BEGIN: ModalHeader */}
          <header className="relative px-6 pt-3 pb-3 flex items-start justify-between z-20" data-purpose="modal-header">
            <div className="pr-4">
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-champagne-500 shadow-[0_0_8px_#d4af37]" />
                <span className="text-[10px] tracking-[0.22em] uppercase font-semibold text-champagne-400/90 font-sans">
                  Wedding Album Guest Cam
                </span>
              </div>
              <h1 className="text-3xl font-serif text-white font-normal tracking-wide leading-tight">
                Pratinjau Foto
              </h1>
              <p className="text-xs text-stone-400 font-light mt-0.5 leading-relaxed font-sans">
                Pastikan momen sudah pas sebelum diunggah
              </p>
            </div>

            {!uploadSuccess && (
              <button
                onClick={handleRetake}
                disabled={isUploading}
                aria-label="Tutup pratinjau"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-noir-800/80 border border-stone-700/60 text-stone-300 hover:text-white hover:border-champagne-500/50 hover:bg-noir-700 transition duration-200 active:scale-95 shrink-0 cursor-pointer"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            )}
          </header>
          {/* END: ModalHeader */}

          {/* BEGIN: PhotoDisplaySection */}
          <main className="flex-1 flex flex-col justify-center px-6 py-2 overflow-hidden" data-purpose="preview-body">
            <div className="relative w-full aspect-[4/4.8] max-h-[460px] rounded-2xl overflow-hidden p-1.5 glass-surface champagne-glow" id="adaptive-preview-wrapper" data-purpose="adaptive-preview-wrapper">
              {/* Inner image frame */}
              <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-black flex items-center justify-center group">
                <img
                  src={previewPhoto.url}
                  alt="Pratinjau Foto"
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* Viewfinder Golden Aesthetic Corner Accents */}
                <div className="pointer-events-none absolute inset-0 p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="w-3.5 h-3.5 border-t border-l border-champagne-400/80" />
                    <span className="w-3.5 h-3.5 border-t border-r border-champagne-400/80" />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="w-3.5 h-3.5 border-b border-l border-champagne-400/80" />
                    <span className="w-3.5 h-3.5 border-b border-r border-champagne-400/80" />
                  </div>
                </div>

                {/* Subtle Live Preview Badge */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full bg-noir-950/75 border border-white/10 backdrop-blur-md flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-stone-200 tracking-wider uppercase font-medium">Ready</span>
                </div>

                {/* Shutter timestamp metadata watermark */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-noir-950/60 backdrop-blur-sm text-[9px] font-mono tracking-widest text-champagne-300/80">
                  RAW • 4:5
                </div>

                {/* Uploading Overlay: Kunci visual dengan feedback elegan saat proses simpan */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-30 anim-fade-in pointer-events-none">
                    <div className="w-12 h-12 rounded-full border-3 border-champagne-400 border-t-transparent animate-spin mb-3 shadow-xl" />
                    <p className="text-white font-medium text-sm tracking-wide">
                      Menyimpan ke album...
                    </p>
                    <p className="text-champagne-300/80 text-xs mt-1 font-light">
                      Kamu akan langsung dialihkan ke galeri ✨
                    </p>
                  </div>
                )}

                {/* Success Overlay Dialog jika sudah terunggah */}
                {uploadSuccess && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 anim-slide-up">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-3xl mb-4 shadow-xl">
                      ✓
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white mb-2">
                      Foto Berhasil Diunggah!
                    </h3>
                    <p className="text-xs text-white/60 mb-6 max-w-xs leading-relaxed font-sans">
                      Foto asli tersimpan di album bersama. Sisa rol Anda: <span className="font-bold text-amber-200">{remainingRolls} foto</span>.
                    </p>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      {remainingRolls > 0 ? (
                        <button
                          onClick={handleRetake}
                          className="w-full h-[50px] rounded-2xl bg-white font-bold text-black text-sm active:scale-95 transition-transform shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>📸</span>
                          <span>Ambil Foto Lagi</span>
                        </button>
                      ) : (
                        <div className="text-xs text-amber-400/80 mb-2 font-mono">
                          Semua kuota foto Anda telah digunakan.
                        </div>
                      )}

                      <button
                        onClick={() => {
                          router.push(`/${slug}/albumkami/`);
                        }}
                        className="w-full h-[48px] rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 font-medium text-white text-sm text-center active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                      >
                        Buka Galeri Bersama →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BEGIN: GuestMetaForm */}
            {!uploadSuccess && (
              <div className="mt-4 px-1" data-purpose="guest-input-form">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-medium text-stone-200 flex items-center space-x-1.5" htmlFor="uploader-name">
                    <span>Nama Pengirim Foto</span>
                    <span className="text-champagne-500">*</span>
                  </label>
                  <span className="text-[11px] font-light text-stone-400 italic">
                    Tampil di galeri album
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-champagne-500/70">
                    {/* Signature / User Pen Icon */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <input
                    id="uploader-name"
                    name="uploaderName"
                    type="text"
                    value={senderName}
                    disabled={isUploading}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ketik nama Anda di sini..."
                    className="w-full bg-noir-850/90 text-stone-100 placeholder-stone-500 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-stone-800 gold-input-focus transition duration-150 shadow-inner disabled:opacity-50"
                  />
                </div>
              </div>
            )}
            {/* END: GuestMetaForm */}
          </main>
          {/* END: PhotoDisplaySection */}

          {/* BEGIN: ModalActionFooter */}
          {!uploadSuccess && (
            <footer className="p-6 pt-3 pb-8 sm:pb-6 bg-gradient-to-t from-noir-950 via-noir-950/95 to-transparent z-20" data-purpose="preview-action-footer">
              <div className="grid grid-cols-2 gap-3.5 preview-action-grid">
                {/* Retake / Foto Ulang Button */}
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-full bg-noir-850 hover:bg-noir-800 active:scale-[0.98] border border-stone-700/70 text-stone-200 transition duration-150 group shadow-md cursor-pointer disabled:opacity-50"
                >
                  {/* Redo / Retry Icon */}
                  <svg className="w-4 h-4 text-stone-400 group-hover:text-champagne-400 transition" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span className="font-medium text-sm tracking-wide">Foto Ulang</span>
                </button>

                {/* Upload / Unggah Foto CTA */}
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-full bg-champagne-100 hover:bg-champagne-200 active:scale-[0.98] text-noir-950 font-semibold tracking-wide text-sm shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition duration-150 group cursor-pointer disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-noir-950 border-t-transparent rounded-full animate-spin" />
                      <span className="tracking-tight text-noir-900 font-bold">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-tight text-noir-900 font-bold">Unggah Foto</span>
                      {/* Upload Arrow Icon */}
                      <svg className="w-4 h-4 text-noir-900 group-hover:-translate-y-0.5 transition-transform duration-150" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
                        <path d="M12 19V5" />
                        <path d="M5 12l7-7 7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {/* iOS Home Indicator bar */}
              <div className="w-32 h-1 bg-stone-700/50 rounded-full mx-auto mt-5" />
            </footer>
          )}
          {/* END: ModalActionFooter */}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN VIEWFINDER SCREEN (Kamera Identik 1:1 Satualbum.id)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-[#0d0c0b] select-none touch-none overflow-hidden">
      {/* Snap Flash Animation Overlay */}
      {snapEffect && <div className="absolute inset-0 z-[60] anim-camera-snap pointer-events-none" />}

      {/* Main Camera Frame (Konsisten Mobile & Laptop) */}
      <div className="w-full h-full flex flex-col md:max-w-[480px] md:h-[94vh] md:rounded-[36px] md:overflow-hidden md:border md:border-white/10 md:shadow-2xl bg-[#0d0c0b] relative">
        
        {/* TOP BAR (Presisi Identik Satualbum.id) */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-11 pb-2 flex-shrink-0">
          {/* Tombol Back Arrow */}
          <button
            onClick={() => {
              router.push(`/${slug}/albumkami/`);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#181818] border border-white/10 text-white transition-transform active:scale-90 shadow-md"
            title="Kembali ke Galeri"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          {/* Judul Acara & Tanggal Acara */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            <h1 className="font-serif text-[17px] font-bold text-white tracking-tight leading-tight truncate max-w-[210px]">
              {albumTitle}
            </h1>
            <p className="text-[11px] font-sans text-amber-200/80 font-medium leading-tight mt-0.5">
              {albumInfo?.event_date_formatted || '22 Nov 2026'}
            </p>
          </div>

          {/* Tombol QR Code */}
          <Link
            href={`/${slug}/albumkami/print-qr/`}
            className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#181818] border border-white/10 text-white transition-transform active:scale-90 shadow-md"
            title="QR Code Meja"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        </div>

        {/* Floating Background Upload Toast (Non-blocking, UI Tetap Halus & Responsif) */}
        {bgToast.show && (
          <div className="absolute top-24 inset-x-0 z-40 flex justify-center pointer-events-none px-4 anim-slide-down">
            <div
              className={`px-4 py-2 rounded-full backdrop-blur-md border text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-auto transition-all ${
                bgToast.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                  : bgToast.type === 'error'
                  ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                  : 'bg-black/85 text-white/90 border-white/20'
              }`}
            >
              {bgToast.type === 'uploading' && (
                <div className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
              )}
              <span>{bgToast.message}</span>
            </div>
          </div>
        )}

        {/* Floating Closed Album Banner */}
        {albumInfo?.is_closed && (
          <div className="absolute top-24 inset-x-0 z-40 flex justify-center px-4 anim-slide-down">
            <div className="px-4 py-2 rounded-full bg-black/90 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs font-medium shadow-2xl flex items-center gap-2">
              <span>🔒 Batas waktu pengunggahan berakhir ({albumInfo.close_date_formatted || 'Ditutup'})</span>
            </div>
          </div>
        )}

        {/* MIDDLE: VIEWFINDER KAMERA (Presisi Satualbum.id) */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-2">
          <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-white/70 max-w-xs">
                <p className="text-3xl mb-2">📷</p>
                <p className="text-xs font-sans leading-relaxed">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
                className="w-full h-full object-cover transition-transform duration-300"
              />
            )}

            {/* Flash Toggle Button (Top-Left Viewfinder - Identik Satualbum Screenshot) */}
            <button
              onClick={toggleTorch}
              className={`absolute top-4 left-4 z-20 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                torchOn
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40'
                  : 'bg-black/45 backdrop-blur-md text-white/80 border border-white/15'
              }`}
              title="Flash Kamera"
            >
              {torchOn ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="2" x2="22" y2="22" />
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              )}
            </button>

            {/* Zoom Pill Button [ 1x | 2x ] (Bottom-Center Viewfinder) */}
            <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center pointer-events-auto">
              <div className="bg-black/55 backdrop-blur-md border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-xl">
                <button
                  onClick={() => handleToggleZoom(1)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    zoomLevel === 1
                      ? 'bg-[#c6a073] text-black shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  1x
                </button>
                <button
                  onClick={() => handleToggleZoom(2)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    zoomLevel === 2
                      ? 'bg-[#c6a073] text-black shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  2x
                </button>
              </div>
            </div>

            {/* Flip Camera Button (Bottom-Right Viewfinder) */}
            <button
              onClick={switchCamera}
              className="absolute bottom-4 right-4 z-20 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white flex items-center justify-center active:scale-90 transition-transform shadow-xl"
              title="Balik Kamera Depan / Belakang"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
            </button>

            {/* Developing Toast Notification */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-xs font-medium text-white shadow-2xl z-30 animate-pulse">
                {statusMessage}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM CONTROLS (Identik 1:1 Satualbum.id Screenshot) */}
        <div className="relative z-10 flex flex-shrink-0 items-center justify-between px-7 pb-[max(32px,env(safe-area-inset-bottom))] pt-2">
          
          {/* 1. MECHANICAL FILM COUNTER DIAL (Kiri Bawah) */}
          <div
            className="flex h-[58px] w-[84px] items-center justify-between rounded-[20px] bg-[#181818] border border-white/10 px-3 py-1 shadow-lg"
            title="Sisa Rol Film"
          >
            {/* Film Strip Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M7 3v18"/><path d="M17 3v18"/>
              <path d="M3 7.5h4"/><path d="M3 12h4"/><path d="M3 16.5h4"/>
              <path d="M17 7.5h4"/><path d="M17 12h4"/><path d="M17 16.5h4"/>
            </svg>

            {/* Vertical Dial Roll Window */}
            <div className="flex flex-col items-center justify-center leading-none text-right">
              <span className="text-[11px] font-serif italic text-white/30 select-none">
                {remainingRolls + 1}
              </span>
              <span className="text-[20px] font-serif italic font-bold text-white select-none my-0.5">
                {remainingRolls}
              </span>
              <span className="text-[11px] font-serif italic text-white/30 select-none">
                {Math.max(0, remainingRolls - 1)}
              </span>
            </div>
          </div>

          {/* 2. BIG SHUTTER BUTTON (Tengah Bawah - Identik Satualbum Screenshot) */}
          <button
            onClick={handleCapturePhoto}
            disabled={isCapturing || remainingRolls <= 0 || albumInfo?.is_closed}
            className={`relative flex h-[82px] w-[82px] items-center justify-center rounded-full border-[3px] border-white p-[5px] transition-transform active:scale-90 shadow-2xl ${
              remainingRolls <= 0 || albumInfo?.is_closed ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={albumInfo?.is_closed ? 'Album telah ditutup' : 'Jepret Foto'}
          >
            <div className="h-full w-full rounded-full bg-white active:bg-neutral-200 flex items-center justify-center shadow-lg transition-colors">
              {isCapturing ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : albumInfo?.is_closed ? (
                <span className="text-[9px] font-film font-bold text-black uppercase">Tutup</span>
              ) : remainingRolls <= 0 ? (
                <span className="text-[9px] font-film font-bold text-black uppercase">Habis</span>
              ) : null}
            </div>
          </button>

          {/* 3. GALLERY THUMBNAIL SQUIRCLE (Kanan Bawah) */}
          <button
            onClick={() => {
              router.push(`/${slug}/albumkami/`);
            }}
            className="relative flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[20px] border border-white/20 bg-[#181818] transition-transform active:scale-95 shadow-lg"
            title="Buka Galeri Album"
          >
            {recentPhoto ? (
              <img
                src={recentPhoto}
                alt="Foto Terbaru"
                className="h-full w-full object-cover"
              />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* BOTTOM SHEET REGISTRASI TAMU (popup_masuk_tamu_berlatar_beranda) */}
      {!isRegistered && !isLoadingSession && (
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
                  onSubmit={handleRegisterGuest}
                  className="w-full pt-2 space-y-4 text-left"
                  data-purpose="guest-form"
                  id="guest-entry-form"
                  method="POST"
                >
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 pl-1" htmlFor="cam-guest-name">
                      Siapa Namamu?
                    </label>
                    <div className="relative">
                      <input
                        id="cam-guest-name"
                        name="guestName"
                        type="text"
                        autoFocus
                        autoComplete="off"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Tulis nama panggilanmu..."
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

                <div className="pt-1">
                  <Link
                    href={`/${slug}/albumkami/`}
                    data-purpose="secondary-link"
                    className="group inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 hover:text-amber-200/90 transition-colors duration-200 tracking-wide"
                  >
                    <span>Lihat Galeri Bersama</span>
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 font-mono">→</span>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
