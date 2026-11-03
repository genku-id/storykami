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

  // Shutter & Effects
  const [isCapturing, setIsCapturing] = useState(false);
  const [snapEffect, setSnapEffect] = useState(false);
  const [recentPhoto, setRecentPhoto] = useState(null);
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
    if (savedName) setGuestName(savedName);
  }, []);

  // 2. Load info album, sesi tamu, dan foto terbaru
  useEffect(() => {
    if (!slug || !deviceToken) return;

    async function fetchInfo() {
      try {
        setIsLoadingSession(true);
        const res = await fetch(`/api/album/${slug}/info/?device_token=${deviceToken}`);
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
          const photoRes = await fetch(`/api/album/${slug}/photos/`);
          const photoData = await photoRes.json();
          if (photoData.photos && photoData.photos.length > 0) {
            setRecentPhoto(photoData.photos[0].r2_image_url);
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
  }, [facingMode]);

  // Toggle Torch
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
      if (e.code === 'Space' && isRegistered && !isCapturing && remainingRolls > 0) {
        e.preventDefault();
        handleCapturePhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRegistered, isCapturing, remainingRolls]);

  // Jepret Foto Resolusi Tinggi (Murni tanpa filter, JPEG berkualitas tinggi)
  const handleCapturePhoto = async () => {
    if (isCapturing || remainingRolls <= 0 || !videoRef.current) return;

    setIsCapturing(true);
    setSnapEffect(true);
    playShutterSound();
    setTimeout(() => setSnapEffect(false), 300);

    // Animasi putaran dial mundur 1 angka langsung
    setRemainingRolls((prev) => Math.max(0, prev - 1));
    setStatusMessage('Saved to roll 🎞️');
    setTimeout(() => setStatusMessage(''), 2000);

    try {
      const video = videoRef.current;
      const vWidth = video.videoWidth || 1920;
      const vHeight = video.videoHeight || 1080;

      const canvas = document.createElement('canvas');
      canvas.width = vWidth;
      canvas.height = vHeight;
      const ctx = canvas.getContext('2d');

      if (facingMode === 'user') {
        ctx.translate(vWidth, 0);
        ctx.scale(-1, 1);
      }

      // Handle digital zoom 2x crop jika zoomLevel === 2
      if (zoomLevel === 2) {
        const cropW = vWidth / 2;
        const cropH = vHeight / 2;
        const startX = (vWidth - cropW) / 2;
        const startY = (vHeight - cropH) / 2;
        ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, vWidth, vHeight);
      } else {
        ctx.drawImage(video, 0, 0, vWidth, vHeight);
      }

      // Export murni JPEG tanpa filter dengan kualitas maksimal 0.98
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.98);
      });

      if (!blob) throw new Error('Gagal memproses gambar');

      // Tampilkan langsung di thumbnail kanan bawah
      const localPreview = URL.createObjectURL(blob);
      setRecentPhoto(localPreview);

      // 1. Minta Presigned PUT URL ke Cloudflare R2
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
        throw new Error(urlData.error || 'Gagal menyiapkan slot upload');
      }

      // 2. Upload file asli resolusi tinggi langsung ke Cloudflare R2
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });

      if (!uploadRes.ok) {
        throw new Error('Gagal mengirim foto ke Cloudflare R2');
      }

      // 3. Konfirmasi ke Supabase Database
      const confirmRes = await fetch(`/api/album/${slug}/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_id: urlData.albumId,
          guest_id: urlData.guestId,
          guest_name: urlData.guestName,
          r2_key: urlData.key,
          r2_image_url: urlData.publicUrl,
          preset_applied: 'original-highres',
        }),
      });

      const confirmData = await confirmRes.json();
      if (confirmData.remainingRolls !== undefined) {
        setRemainingRolls(confirmData.remainingRolls);
      }
    } catch (err) {
      console.error('Capture error:', err);
      alert(err.message || 'Gagal memotret');
      setStatusMessage('');
    } finally {
      setIsCapturing(false);
    }
  };

  const albumTitle = albumInfo?.title || 'Awal dari Selamanya';

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-[#0d0c0b] select-none touch-none overflow-hidden">
      {/* Snap Flash Animation Overlay */}
      {snapEffect && <div className="absolute inset-0 z-[60] anim-camera-snap pointer-events-none" />}

      {/* Main Camera Frame (Konsisten Mobile & Laptop) */}
      <div className="w-full h-full flex flex-col md:max-w-[480px] md:h-[94vh] md:rounded-[36px] md:overflow-hidden md:border md:border-white/10 md:shadow-2xl bg-[#0d0c0b] relative">
        
        {/* TOP BAR (Presisi Identik Satualbum.id) */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-11 pb-2 flex-shrink-0">
          {/* Tombol Back Arrow */}
          <Link
            href={`/${slug}/albumkami/`}
            className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#181818] border border-white/10 text-white transition-transform active:scale-90 shadow-md"
            title="Kembali ke Galeri"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </Link>

          {/* Judul Acara & Sisa Hari */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            <h1 className="font-serif text-[17px] font-bold text-white tracking-tight leading-tight truncate max-w-[210px]">
              {albumTitle}
            </h1>
            <p className="text-[11px] font-sans text-[#888888] font-normal leading-tight mt-0.5">
              27d 1h tersisa
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

            {/* Flash Toggle Button (Top-Left Viewfinder) */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`absolute top-4 left-4 z-20 w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                  torchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40' : 'bg-black/40 backdrop-blur-md text-white border border-white/15'
                }`}
                title="Flash Kamera"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={torchOn ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </button>
            )}

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

          {/* 2. BIG SHUTTER BUTTON (Tengah Bawah) */}
          <button
            onClick={handleCapturePhoto}
            disabled={isCapturing || remainingRolls <= 0}
            className={`relative flex h-[82px] w-[82px] items-center justify-center rounded-full border-[3.5px] border-white p-1 transition-transform active:scale-90 shadow-2xl ${
              remainingRolls <= 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title="Jepret Foto"
          >
            <div className="h-full w-full rounded-full bg-[#f2ece4] active:bg-white flex items-center justify-center shadow-inner">
              {isCapturing ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : remainingRolls <= 0 ? (
                <span className="text-[9px] font-film font-bold text-black uppercase">Habis</span>
              ) : null}
            </div>
          </button>

          {/* 3. GALLERY THUMBNAIL SQUIRCLE (Kanan Bawah) */}
          <Link
            href={`/${slug}/albumkami/`}
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
          </Link>
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
