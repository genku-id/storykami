'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import '../albumkami.css';

export default function GuestCameraHighResPage() {
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
  const [remainingRolls, setRemainingRolls] = useState(10);
  const [rollLimit, setRollLimit] = useState(10);

  // Hardware Kamera
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' | 'environment'
  const [cameraError, setCameraError] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Shutter & Preview States
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [snapEffect, setSnapEffect] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null); // { blob, url, width, height, sizeText }
  const [senderName, setSenderName] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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

  // 2. Load info album & status sesi
  useEffect(() => {
    if (!slug || !deviceToken) return;

    async function fetchInfo() {
      try {
        setIsLoadingSession(true);
        const res = await fetch(`/api/album/${slug}/info/?device_token=${deviceToken}`);
        const data = await res.json();

        if (data.album) {
          setAlbumInfo(data.album);
          setRollLimit(data.album.roll_limit || 10);
        }

        if (data.guestSession) {
          setIsRegistered(true);
          setGuestName(data.guestSession.guest_name);
          setSenderName(data.guestSession.guest_name);
          setRemainingRolls(data.guestSession.remaining_rolls);
        } else {
          setIsRegistered(false);
          setRemainingRolls(data.album?.roll_limit || 10);
        }
      } catch (err) {
        console.error('Failed to load album info:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    fetchInfo();
  }, [slug, deviceToken]);

  // 3. Start Camera Stream (Resolusi Maksimal High-Res tanpa filter)
  useEffect(() => {
    if (!isRegistered || previewPhoto) return;

    let activeStream = null;

    async function startCamera() {
      try {
        setCameraError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        // Meminta resolusi sensor tertinggi yang didukung perangkat (hingga 4K / Full HD)
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
          // Fallback resolusi standar jika resolusi 4K ditolak browser
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
        setCameraError('Izin kamera belum aktif. Buka pengaturan browser untuk mengizinkan kamera atau gunakan tombol unggah.');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isRegistered, facingMode, previewPhoto]);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Flip Camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Register Guest
  const handleRegisterGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      setIsLoadingSession(true);
      const trimmed = guestName.trim();
      localStorage.setItem('storykami_guest_name', trimmed);
      setSenderName(trimmed);

      const res = await fetch(`/api/album/${slug}/session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_name: trimmed, device_token: deviceToken }),
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

  // Format File Size
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  // Tangkap Foto Resolusi Tinggi (Murni tanpa filter, format JPEG berkualitas tinggi)
  const handleCapturePhoto = async () => {
    if (isCapturing || remainingRolls <= 0) return;

    setIsCapturing(true);
    setSnapEffect(true);
    playShutterSound();
    setTimeout(() => setSnapEffect(false), 300);

    try {
      const video = videoRef.current;
      const track = streamRef.current?.getVideoTracks()[0];

      let photoBlob = null;
      let width = 0;
      let height = 0;

      // 1. Coba gunakan ImageCapture API bawaan browser (mengakses resolusi penuh sensor perangkat tanpa crop)
      if (typeof window !== 'undefined' && 'ImageCapture' in window && track) {
        try {
          const imageCapture = new window.ImageCapture(track);
          // Ambil foto JPEG resolusi sensor asli
          photoBlob = await imageCapture.takePhoto({
            fillLightMode: torchOn ? 'flash' : 'off',
          });
        } catch (imgCapErr) {
          console.warn('ImageCapture API fallback to high-res canvas:', imgCapErr);
        }
      }

      // 2. Fallback ke Canvas dengan 100% resolusi native video stream
      if (!photoBlob && video) {
        const vWidth = video.videoWidth || 1920;
        const vHeight = video.videoHeight || 1080;
        width = vWidth;
        height = vHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Jika kamera depan (selfie), balikkan mirror
        if (facingMode === 'user') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);

        // Export murni JPEG tanpa filter dengan kualitas maksimal 0.98 (menghindari artefak kompresi & ukuran besar asli)
        photoBlob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.98);
        });
      }

      if (!photoBlob) {
        throw new Error('Gagal menangkap foto resolusi tinggi dari kamera.');
      }

      // Ukur dimensi foto asli secara aman
      const localUrl = URL.createObjectURL(photoBlob);
      if (!width || !height) {
        const img = new Image();
        img.src = localUrl;
        await new Promise((res) => {
          img.onload = () => {
            width = img.naturalWidth || 1920;
            height = img.naturalHeight || 1080;
            res();
          };
          img.onerror = () => {
            width = 1920;
            height = 1080;
            res();
          };
        });
      }

      // Masuk ke Mode Preview & Konfirmasi (Sesuai PRD)
      setPreviewPhoto({
        blob: photoBlob,
        url: localUrl,
        width,
        height,
        sizeText: formatBytes(photoBlob.size),
      });
      setUploadSuccess(false);
    } catch (err) {
      console.error('Capture error:', err);
      alert(err.message || 'Gagal memotret');
    } finally {
      setIsCapturing(false);
    }
  };

  // Upload dari File / Kamera Bawaan HP (Alternative File Picker)
  const handleNativeFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (remainingRolls <= 0) {
      alert('Kuota foto Anda sudah habis!');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = localUrl;
    img.onload = () => {
      setPreviewPhoto({
        blob: file,
        url: localUrl,
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
        sizeText: formatBytes(file.size),
      });
      setUploadSuccess(false);
    };
    img.onerror = () => {
      setPreviewPhoto({
        blob: file,
        url: localUrl,
        width: 1920,
        height: 1080,
        sizeText: formatBytes(file.size),
      });
      setUploadSuccess(false);
    };
  };

  // Batalkan Preview / Foto Ulang (Retake)
  const handleRetake = () => {
    if (previewPhoto?.url) {
      URL.revokeObjectURL(previewPhoto.url);
    }
    setPreviewPhoto(null);
    setUploadSuccess(false);
  };

  // Kirim Foto Resolusi Tinggi ke Cloudflare R2 & Simpan ke Database
  const handleConfirmUpload = async () => {
    if (!previewPhoto?.blob || isUploading) return;

    setIsUploading(true);
    setStatusMessage('Mengunggah foto resolusi tinggi...');

    try {
      const finalSenderName = (senderName || guestName || 'Tamu').trim();
      localStorage.setItem('storykami_guest_name', finalSenderName);

      // 1. Dapatkan Presigned PUT URL ke Cloudflare R2 (dengan trailing slash)
      const urlRes = await fetch(`/api/album/${slug}/upload-url/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_token: deviceToken,
          contentType: 'image/jpeg',
        }),
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok || !urlData.uploadUrl) {
        throw new Error(urlData.error || 'Gagal menyiapkan slot penyimpanan');
      }

      // 2. Upload file asli beresolusi tinggi (JPEG) langsung ke Cloudflare R2
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: previewPhoto.blob,
      });

      if (!uploadRes.ok) {
        throw new Error('Gagal mengunggah foto ke Cloudflare R2');
      }

      // 3. Catat foto ke Supabase Database (dengan trailing slash)
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
      } else {
        setRemainingRolls((prev) => Math.max(0, prev - 1));
      }

      setUploadSuccess(true);
      setStatusMessage('');
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.message || 'Gagal mengirim foto');
    } finally {
      setIsUploading(false);
    }
  };

  // 1. Loading Screen
  if (isLoadingSession) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#12110f] text-white">
        <div className="block h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70 mb-3" />
        <p className="font-film text-xs uppercase tracking-widest text-white/50">Memuat kamera...</p>
      </div>
    );
  }

  // 2. Guest Registration Screen (Masuk Nama Tamu)
  if (!isRegistered) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-[#12110f] p-0 md:justify-center md:p-4">
        {/* Ambient Dark Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-[#12110f] to-[#12110f] pointer-events-none" />

        <div className="relative w-full max-w-md rounded-t-[32px] border border-white/10 bg-[#161616] px-6 pb-10 pt-7 shadow-2xl md:rounded-[32px]">
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-white/20" />

          <div className="text-center mb-6">
            <span className="inline-block rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 font-film text-[11px] tracking-widest uppercase text-white/70 mb-3">
              Album Foto Tamu • High Resolution
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-white mb-2">
              {albumInfo?.title || `Album ${slug}`}
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-xs mx-auto">
              Jepret momen terbaikmu dengan resolusi asli yang jernih dan abadikan di album bersama.
            </p>
          </div>

          <div className="mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-between">
            <div>
              <span className="block font-film text-[10px] tracking-wider uppercase text-white/40">Kuota Jepretan</span>
              <span className="font-film text-lg font-bold text-white">{rollLimit} Foto / Tamu</span>
            </div>
            <div className="text-right">
              <span className="block font-film text-[10px] tracking-wider uppercase text-white/40">Format Foto</span>
              <span className="font-sans text-xs font-semibold text-emerald-400">High-Res JPEG</span>
            </div>
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
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setSenderName(e.target.value);
                }}
                placeholder="Tulis nama panggilanmu..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white placeholder-white/25 focus:border-white/30 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!guestName.trim()}
              className="w-full rounded-2xl bg-white py-4 font-semibold text-black text-[15px] hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40 shadow-xl"
            >
              Mulai Memotret 📸
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href={`/${slug}/albumkami`}
              className="font-film text-xs text-white/40 hover:text-white transition-colors"
            >
              Lihat Galeri Bersama →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. MODAL PREVIEW FOTO & KONFIRMASI (Flow PRD: Jepret -> Preview & Nama -> Kirim / Foto Ulang)
  if (previewPhoto) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-[#0d0c0b] text-white overflow-y-auto">
        <div className="w-full h-full flex flex-col md:max-w-[480px] md:h-[92vh] md:rounded-[32px] md:overflow-hidden md:border md:border-white/10 md:shadow-2xl bg-[#12110f] relative p-4">
          
          {/* Top Bar Preview */}
          <div className="flex items-center justify-between pb-3 pt-4 px-2 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-white">Pratinjau Foto</h2>
              <p className="text-[11px] text-white/50 font-mono">
                {previewPhoto.width} × {previewPhoto.height} px • {previewPhoto.sizeText}
              </p>
            </div>
            {!uploadSuccess && (
              <button
                onClick={handleRetake}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white/80 transition-colors"
              >
                Batal
              </button>
            )}
          </div>

          {/* Photo Preview Container */}
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center my-2 border border-white/10 shadow-inner">
            <img
              src={previewPhoto.url}
              alt="Preview"
              className="w-full h-full object-contain"
            />

            {/* Success Overlay jika sudah terkirim */}
            {uploadSuccess && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 anim-slide-up">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-3xl mb-4 shadow-xl">
                  ✓
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-2">
                  Foto Berhasil Terkirim!
                </h3>
                <p className="text-xs text-white/60 mb-6 max-w-xs leading-relaxed">
                  Foto resolusi tinggi tersimpan aman di album pernikahan. Sisa kuota jepretan Anda: <span className="font-bold text-white">{remainingRolls} foto</span>.
                </p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {remainingRolls > 0 ? (
                    <button
                      onClick={handleRetake}
                      className="w-full py-3.5 rounded-2xl bg-white font-semibold text-black text-sm active:scale-95 transition-transform shadow-lg"
                    >
                      📸 Ambil Foto Lagi
                    </button>
                  ) : (
                    <div className="text-xs text-amber-400/80 mb-2 font-mono">
                      Semua kuota foto Anda telah digunakan.
                    </div>
                  )}

                  <Link
                    href={`/${slug}/albumkami`}
                    className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 font-medium text-white text-sm text-center active:scale-95 transition-transform"
                  >
                    Lihat Galeri Bersama →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Form & Actions */}
          {!uploadSuccess && (
            <div className="pt-3 pb-2 px-1 flex-shrink-0 space-y-3">
              <div>
                <label className="block text-[11px] font-film uppercase tracking-wider text-white/50 mb-1.5">
                  Nama Anda (Pengirim)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama pengirim foto..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Tombol Foto Ulang */}
                <button
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="py-3.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-semibold text-white text-sm active:scale-95 transition-all text-center"
                >
                  🔄 Foto Ulang
                </button>

                {/* Tombol Kirim Foto */}
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-200 font-semibold text-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Foto</span>
                      <span>🚀</span>
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

  // 4. MAIN VIEWFINDER SCREEN (Kamera Asli High-Res Murni)
  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-[#12110f] select-none touch-none overflow-hidden">
      {/* Snap Flash Animation Overlay */}
      {snapEffect && <div className="absolute inset-0 z-[60] anim-camera-snap pointer-events-none" />}

      {/* Main Camera Frame */}
      <div className="w-full h-full flex flex-col md:max-w-[480px] md:h-[92vh] md:rounded-[32px] md:overflow-hidden md:border md:border-white/10 md:shadow-2xl bg-[#12110f] relative">
        
        {/* TOP BAR */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-10 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-[16px] font-medium tracking-wide truncate max-w-[170px]">
              {albumInfo?.title || slug}
            </span>
            <span className="font-film text-white/50 text-[13px] bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/10">
              {remainingRolls}/{rollLimit}
            </span>
          </div>

          <Link
            href={`/${slug}/albumkami`}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/10 text-white transition-transform active:scale-90 border border-white/10"
            title="Tutup & ke Galeri"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </Link>
        </div>

        {/* MIDDLE: VIEWFINDER (Jernih tanpa filter) */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4 pb-4">
          <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-black border border-white/10 shadow-inner flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-white/70 max-w-xs">
                <p className="text-2xl mb-2">📷</p>
                <p className="text-xs font-sans leading-relaxed mb-4">{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs shadow-lg active:scale-95"
                >
                  Pilih dari Kamera/Galeri HP
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Flash Toggle Button */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`absolute top-4 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                  torchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40' : 'bg-black/50 backdrop-blur-md text-white border border-white/15'
                }`}
                title="Flash Kamera"
              >
                ⚡
              </button>
            )}

            {/* Flip Camera Button */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/15 flex items-center justify-center active:scale-90 transition-transform"
              title="Balik Kamera Depan/Belakang"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
            </button>

            {/* Subtle High-Res Indicator Badge */}
            <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
              <span className="font-film text-[10px] tracking-wider uppercase text-white/70 bg-black/50 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full">
                High-Res JPEG • No Filter
              </span>
            </div>

            {/* Loading / Status Toast */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-xs font-medium text-white shadow-2xl z-30 animate-pulse">
                {statusMessage}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="relative z-10 flex flex-shrink-0 items-center justify-around px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-2">
          
          {/* File Picker / Native Camera Fallback Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleNativeFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[26px] bg-white/10 border border-white/10 text-white transition-transform active:scale-[0.94]"
              title="Ambil dari Kamera Bawaan HP / Unggah Foto"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
          </div>

          {/* BIG SHUTTER BUTTON */}
          <button
            onClick={handleCapturePhoto}
            disabled={isCapturing || remainingRolls <= 0}
            className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-white transition-transform active:scale-[0.92] shadow-2xl p-1 ${
              remainingRolls <= 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title="Jepret Foto"
          >
            <div className="w-full h-full rounded-full border-4 border-black/80 bg-white flex items-center justify-center">
              {isCapturing ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : remainingRolls <= 0 ? (
                <span className="text-[10px] font-film font-bold text-black uppercase">Habis</span>
              ) : null}
            </div>
          </button>

          {/* Gallery Button */}
          <Link
            href={`/${slug}/albumkami`}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[26px] bg-white/10 border border-white/10 transition-transform active:scale-[0.94] text-white"
            title="Buka Galeri Album"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
