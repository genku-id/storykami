'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import '../albumkami.css';

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
    if (isCapturing || remainingRolls <= 0 || !videoRef.current) return;

    setIsCapturing(true);
    setSnapEffect(true);
    playShutterSound();
    setTimeout(() => setSnapEffect(false), 300);

    try {
      const video = videoRef.current;
      const vWidth = video.videoWidth || 1920;
      const vHeight = video.videoHeight || 1080;

      // --- 1. KANVAS RESOLUSI ASLI PENUH (High-Res) ---
      const origCanvas = document.createElement('canvas');
      origCanvas.width = vWidth;
      origCanvas.height = vHeight;
      const origCtx = origCanvas.getContext('2d');

      if (facingMode === 'user') {
        origCtx.translate(vWidth, 0);
        origCtx.scale(-1, 1);
      }

      if (zoomLevel === 2) {
        const cropW = vWidth / 2;
        const cropH = vHeight / 2;
        const startX = (vWidth - cropW) / 2;
        const startY = (vHeight - cropH) / 2;
        origCtx.drawImage(video, startX, startY, cropW, cropH, 0, 0, vWidth, vHeight);
      } else {
        origCtx.drawImage(video, 0, 0, vWidth, vHeight);
      }

      // Export file asli High-Res JPEG (kualitas maksimal 0.98)
      const originalBlob = await new Promise((resolve) => {
        origCanvas.toBlob(resolve, 'image/jpeg', 0.98);
      });

      if (!originalBlob) throw new Error('Gagal memproses gambar asli');

      // --- 2. KANVAS THUMBNAIL RINGAN (WebP ~600px) ---
      const maxThumbDim = 600;
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

      // Export file thumbnail WebP ringan (kualitas 0.75)
      const thumbBlob = await new Promise((resolve) => {
        thumbCanvas.toBlob(resolve, 'image/webp', 0.75);
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
    if (previewPhoto?.url) {
      URL.revokeObjectURL(previewPhoto.url);
    }
    setPreviewPhoto(null);
    setUploadSuccess(false);
  };

  // 🚀 Unggah di Latar Belakang (Non-Blocking: UI Langsung Kembali ke Kamera Instan!)
  const handleConfirmUpload = async () => {
    if (!previewPhoto?.originalBlob) return;

    const photoToUpload = { ...previewPhoto };
    const finalSenderName = (senderName || guestName || 'Tamu').trim();
    try {
      localStorage.setItem('storykami_guest_name', finalSenderName);
    } catch (e) {}

    // 1. Feedback Instan (0 Milidetik)
    setRemainingRolls((prev) => Math.max(0, prev - 1));
    setRecentPhoto(photoToUpload.url);
    setPreviewPhoto(null); // Langsung tutup preview, kamera seketika aktif kembali!

    // 2. Tambahkan secara optimis ke cache galeri lokal agar saat pengguna buka galeri, foto langsung ada
    try {
      const cacheKey = `storykami_cache_${slug}_photos`;
      const existing = localStorage.getItem(cacheKey);
      let list = existing ? JSON.parse(existing) : [];
      const optimisticPhoto = {
        id: 'opt_' + Date.now(),
        guest_name: finalSenderName,
        r2_key: '',
        r2_image_url: photoToUpload.url,
        r2_thumb_url: photoToUpload.url,
        preset_applied: 'original-highres',
        likes_count: 0,
        created_at: new Date().toISOString(),
        isOptimistic: true,
      };
      list = [optimisticPhoto, ...list];
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch (e) {}

    // 3. Eksekusi Upload di Latar Belakang
    setBgUploadQueue((prev) => prev + 1);
    setBgToast({ show: true, type: 'uploading', message: 'Mengunggah di latar belakang... ☁️' });

    try {
      // Step A: Minta Presigned PUT URL
      const urlRes = await fetch(`/api/album/${slug}/upload-url/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_token: deviceToken }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok || !urlData.uploadUrl) {
        throw new Error(urlData.error || 'Gagal menyiapkan slot upload');
      }

      // Step B: Upload file asli JPEG & thumbnail WebP secara paralel
      const uploadPromises = [
        fetch(urlData.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: photoToUpload.originalBlob,
        }),
      ];

      if (urlData.thumbUploadUrl && photoToUpload.thumbBlob) {
        uploadPromises.push(
          fetch(urlData.thumbUploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/webp' },
            body: photoToUpload.thumbBlob,
          })
        );
      }

      const uploadResults = await Promise.all(uploadPromises);
      for (const res of uploadResults) {
        if (!res.ok) throw new Error('Gagal mengunggah foto');
      }

      // Step C: Konfirmasi ke Supabase Database
      const confirmRes = await fetch(`/api/album/${slug}/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_id: urlData.albumId,
          guest_id: urlData.guestId,
          guest_name: finalSenderName,
          r2_key: urlData.key,
          r2_image_url: urlData.publicUrl,
          preset_applied: 'original-highres',
        }),
      });

      const confirmData = await confirmRes.json();
      if (confirmData.remainingRolls !== undefined) {
        setRemainingRolls(confirmData.remainingRolls);
      }

      // Update cache galeri lokal dengan URL permanen dari R2
      try {
        const cacheKey = `storykami_cache_${slug}_photos`;
        const existing = localStorage.getItem(cacheKey);
        if (existing) {
          const list = JSON.parse(existing);
          const updated = list.map((p) => {
            if (p.isOptimistic && p.r2_image_url === photoToUpload.url) {
              return {
                ...p,
                id: confirmData.photo?.id || p.id,
                r2_key: urlData.key,
                r2_image_url: `/api/album/${slug}/image/?key=${encodeURIComponent(urlData.key)}`,
                r2_thumb_url: `/api/album/${slug}/image/?key=${encodeURIComponent(urlData.key.replace(/\.jpg$/, '_thumb.webp'))}`,
                isOptimistic: false,
              };
            }
            return p;
          });
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      } catch (e) {}

      setBgToast({ show: true, type: 'success', message: '✓ Foto berhasil tersimpan di album!' });
      setTimeout(() => {
        setBgToast((prev) => (prev.type === 'success' ? { ...prev, show: false } : prev));
      }, 2500);
    } catch (err) {
      console.error('Background upload error:', err);
      setBgToast({ show: true, type: 'error', message: '⚠️ Gagal mengunggah. Cek koneksi internet.' });
      setTimeout(() => {
        setBgToast((prev) => (prev.type === 'error' ? { ...prev, show: false } : prev));
      }, 4000);
    } finally {
      setBgUploadQueue((prev) => Math.max(0, prev - 1));
    }
  };

  const albumTitle = albumInfo?.title || 'Awal dari Selamanya';

  // =========================================================================
  // 1. MODAL PRATINJAU FOTO (Preview Sebelum Diunggah - UI Elegan & Rapi)
  // =========================================================================
  if (previewPhoto) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-[#0d0c0b] text-white overflow-hidden select-none">
        <div className="w-full h-full flex flex-col md:max-w-[480px] md:h-[95vh] md:rounded-[36px] md:overflow-hidden md:border md:border-white/10 md:shadow-2xl bg-[#0d0c0b] relative px-4 py-3">
          
          {/* Top Bar Preview */}
          <div className="flex items-center justify-between pt-8 pb-3 px-2 flex-shrink-0 z-20">
            <div>
              <h2 className="text-[20px] font-bold text-white font-serif tracking-tight leading-tight">
                Pratinjau Foto
              </h2>
              <p className="text-xs text-white/50 font-sans mt-0.5">
                Pastikan momen sudah pas sebelum diunggah
              </p>
            </div>

            {!uploadSuccess && (
              <button
                onClick={handleRetake}
                disabled={isUploading}
                className="w-11 h-11 rounded-[16px] bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                title="Batal & Foto Ulang"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Middle Photo Container */}
          <div className="relative flex-1 rounded-[30px] overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center my-2">
            <img
              src={previewPhoto.url}
              alt="Preview"
              className="w-full h-full object-contain pointer-events-none"
            />

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
                  Foto asli resolusi tinggi & thumbnail ringan sudah tersimpan di album bersama. Sisa rol Anda: <span className="font-bold text-white">{remainingRolls} foto</span>.
                </p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {remainingRolls > 0 ? (
                    <button
                      onClick={handleRetake}
                      className="w-full h-[52px] rounded-2xl bg-white font-bold text-black text-sm active:scale-95 transition-transform shadow-xl flex items-center justify-center gap-2"
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
                    className="w-full h-[50px] rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 font-medium text-white text-sm text-center active:scale-95 transition-transform flex items-center justify-center"
                  >
                    Buka Galeri Bersama →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Card Form & Actions (UI Pratinjau Bersih & Rapi Sesuai AlbumKami) */}
          {!uploadSuccess && (
            <div className="bg-[#141312] border border-white/10 rounded-[28px] p-4.5 flex-shrink-0 space-y-3.5 shadow-2xl z-20">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-medium text-white/70 font-sans flex items-center gap-1.5">
                  <span>Nama Pengirim Foto</span>
                </label>
                <span className="text-[11px] text-white/40">Tampil di galeri album</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Tulis nama pengirim foto..."
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.08] focus:bg-[#1c1b18] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-amber-300/40 focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-0.5">
                {/* Tombol Foto Ulang */}
                <button
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="h-[52px] rounded-2xl border border-white/15 bg-[#222222] hover:bg-[#2a2a2a] font-semibold text-white text-sm active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  <span>Foto Ulang</span>
                </button>

                {/* Tombol Unggah Foto */}
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="h-[52px] rounded-2xl bg-white hover:bg-neutral-200 font-bold text-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <span>Unggah Foto</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 7-7 7 7"/>
                        <path d="M12 19V5"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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
            disabled={isCapturing || remainingRolls <= 0}
            className={`relative flex h-[82px] w-[82px] items-center justify-center rounded-full border-[3px] border-white p-[5px] transition-transform active:scale-90 shadow-2xl ${
              remainingRolls <= 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title="Jepret Foto"
          >
            <div className="h-full w-full rounded-full bg-white active:bg-neutral-200 flex items-center justify-center shadow-lg transition-colors">
              {isCapturing ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

      {/* BOTTOM SHEET REGISTRASI TAMU (Jika belum punya nama) */}
      {!isRegistered && !isLoadingSession && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 md:items-center md:p-4 anim-slide-up">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-[34px] border border-white/10 bg-[#161616] px-6 pb-10 pt-6 shadow-2xl md:rounded-[34px]"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

            <div className="text-center mb-5">
              <span className="inline-block rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 font-film text-[10px] tracking-widest uppercase text-white/70 mb-2.5">
                Kamera Tamu • {albumTitle}
              </span>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-white mb-1.5">
                {albumTitle}
              </h2>
              <p className="text-[13px] text-white/50 leading-relaxed max-w-xs mx-auto">
                Tulis namamu untuk mulai mengambil foto jernih beresolusi tinggi di album bersama.
              </p>
            </div>

            <form onSubmit={handleRegisterGuest} className="space-y-4">
              <div>
                <label className="block font-film text-[11px] tracking-wider uppercase text-white/50 mb-2">
                  Siapa Namamu?
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Tulis nama panggilanmu..."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white placeholder-white/25 focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!guestName.trim()}
                className="w-full rounded-2xl bg-white py-4 font-semibold text-black text-[15px] hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40 shadow-xl"
              >
                Mulai Memotret 📷
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href={`/${slug}/albumkami/`}
                className="font-film text-xs text-white/40 hover:text-white transition-colors"
              >
                Lihat Galeri Bersama →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
