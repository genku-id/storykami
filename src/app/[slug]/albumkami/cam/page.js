'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FILM_PRESETS, addFilmGrain, addRetroDateStamp } from '@/utils/filmPresets';
import '../albumkami.css';

export default function DisposableCameraPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || '';

  // State Sesi & Tamu
  const [guestName, setGuestName] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Info Album
  const [albumInfo, setAlbumInfo] = useState(null);
  const [activePresetId, setActivePresetId] = useState('portra');
  const [showPresetSheet, setShowPresetSheet] = useState(false);
  const [remainingRolls, setRemainingRolls] = useState(10);
  const [rollLimit, setRollLimit] = useState(10);

  // Hardware Kamera
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' | 'environment'
  const [cameraError, setCameraError] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

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

  // 2. Load info album & status sesi
  useEffect(() => {
    if (!slug || !deviceToken) return;

    async function fetchInfo() {
      try {
        setIsLoadingSession(true);
        const res = await fetch(`/api/album/${slug}/info?device_token=${deviceToken}`);
        const data = await res.json();

        if (data.album) {
          setAlbumInfo(data.album);
          const initialPreset = data.album.preset_id || 'portra';
          setActivePresetId(FILM_PRESETS[initialPreset] ? initialPreset : 'portra');
          setRollLimit(data.album.roll_limit || 10);
        }

        if (data.guestSession) {
          setIsRegistered(true);
          setGuestName(data.guestSession.guest_name);
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

  // 3. Start Camera Stream
  useEffect(() => {
    if (!isRegistered) return;

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
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
  }, [isRegistered, facingMode]);

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

  // Register Guest
  const handleRegisterGuest = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      setIsLoadingSession(true);
      localStorage.setItem('storykami_guest_name', guestName.trim());

      const res = await fetch(`/api/album/${slug}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_name: guestName.trim(), device_token: deviceToken }),
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

  // Keyboard shortcut (Spacebar) untuk pengguna Laptop / Desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && isRegistered && !isCapturing && remainingRolls > 0 && !showPresetSheet) {
        e.preventDefault();
        handleCapturePhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRegistered, isCapturing, remainingRolls, showPresetSheet]);

  // Jepret Foto
  const handleCapturePhoto = async () => {
    if (isCapturing || remainingRolls <= 0 || !videoRef.current) return;

    setIsCapturing(true);
    setSnapEffect(true);
    playShutterSound();
    setTimeout(() => setSnapEffect(false), 380);

    setStatusMessage('Developing...');

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const vWidth = video.videoWidth || 1280;
      const vHeight = video.videoHeight || 720;

      const maxDim = 1920;
      let width = vWidth;
      let height = vHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      const preset = FILM_PRESETS[activePresetId] || FILM_PRESETS['portra'];
      if (preset && preset.applyCanvas) {
        preset.applyCanvas(ctx, width, height);
      }

      addFilmGrain(ctx, width, height, 0.08);
      addRetroDateStamp(ctx, width, height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/webp', 0.85);
      });

      if (!blob) throw new Error('Gagal memproses gambar');

      const localPreview = URL.createObjectURL(blob);
      setRecentPhoto(localPreview);

      // 1. Upload Presigned URL R2
      const urlRes = await fetch(`/api/album/${slug}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_token: deviceToken, contentType: 'image/webp' }),
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok || !urlData.uploadUrl) {
        throw new Error(urlData.error || 'Gagal menyiapkan slot upload');
      }

      // 2. Upload Direct PUT ke Cloudflare R2
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: blob,
      });

      if (!uploadRes.ok) {
        throw new Error('Gagal mengirim foto ke Cloudflare R2');
      }

      // 3. Konfirmasi ke Supabase Database
      const confirmRes = await fetch(`/api/album/${slug}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          album_id: urlData.albumId,
          guest_id: urlData.guestId,
          guest_name: urlData.guestName,
          r2_key: urlData.key,
          r2_image_url: urlData.publicUrl,
          preset_applied: activePresetId,
        }),
      });

      const confirmData = await confirmRes.json();
      if (confirmData.remainingRolls !== undefined) {
        setRemainingRolls(confirmData.remainingRolls);
      } else {
        setRemainingRolls((prev) => Math.max(0, prev - 1));
      }

      setStatusMessage('Saved to roll 🎞️');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err) {
      console.error('Capture error:', err);
      alert(err.message || 'Gagal memotret');
      setStatusMessage('');
    } finally {
      setIsCapturing(false);
    }
  };

  const activePreset = FILM_PRESETS[activePresetId] || FILM_PRESETS['portra'];

  // 1. Loading Screen
  if (isLoadingSession) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#12110f] text-white">
        <div className="block h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70 mb-3" />
        <p className="font-film text-xs uppercase tracking-widest text-white/50">Memuat kamera...</p>
      </div>
    );
  }

  // 2. Guest Registration Screen (Identik dengan satualbum.id)
  if (!isRegistered) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-[#12110f] p-0 md:justify-center md:p-4">
        {/* Background Film Aesthetic */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-[#12110f] to-[#12110f] pointer-events-none" />

        {/* Modal Sheet ala Satualbum */}
        <div className="relative w-full max-w-md rounded-t-[32px] border border-white/10 bg-[#161616] px-6 pb-10 pt-7 shadow-2xl md:rounded-[32px]">
          {/* Drag Handle Bar */}
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-white/20" />

          {/* Badge & Title */}
          <div className="text-center mb-6">
            <span className="inline-block rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 font-film text-[11px] tracking-widest uppercase text-white/70 mb-3">
              Kamera Sekali Pakai Digital
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-white mb-2">
              {albumInfo?.title || `Album ${slug}`}
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-xs mx-auto">
              Scan, jepret foto dengan filter film vintage, lalu terungkap bersama di album pesta.
            </p>
          </div>

          {/* Roll Info Card */}
          <div className="mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-between">
            <div>
              <span className="block font-film text-[10px] tracking-wider uppercase text-white/40">Kuota Jepretan</span>
              <span className="font-film text-lg font-bold text-white">{rollLimit} Foto / Tamu</span>
            </div>
            <div className="text-right">
              <span className="block font-film text-[10px] tracking-wider uppercase text-white/40">Preset Film</span>
              <span className="font-sans text-xs font-medium text-emerald-400">{activePreset.name}</span>
            </div>
          </div>

          {/* Form Masukkan Nama */}
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
              Mulai Motret 📷
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

  // 3. Viewfinder Camera Screen (Identik 1:1 Satualbum.id)
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
            <span className="font-film text-white/40 text-[13px] bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
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

        {/* MIDDLE: VIEWFINDER */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4 pb-4">
          <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-black border border-white/10 shadow-inner flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-white/60">
                <p className="text-sm font-sans mb-2">📷</p>
                <p className="text-xs font-sans leading-relaxed">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ filter: activePreset.cssFilter }}
                className="w-full h-full object-cover transition-all duration-200"
              />
            )}

            {/* Satualbum Film Glow & Vignette */}
            <div className="film-glow pointer-events-none" />

            {/* Flash Toggle Button */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`absolute top-4 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                  torchOn ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40' : 'bg-black/50 backdrop-blur-md text-white border border-white/15'
                }`}
              >
                ⚡
              </button>
            )}

            {/* Flip Camera Button */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/15 flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21h5v-5"/>
              </svg>
            </button>

            {/* Active Preset Badge (Clickable to switch preset) */}
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 pointer-events-auto">
              <button
                onClick={() => setShowPresetSheet(true)}
                className="inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-white shadow-xl bg-black/60 backdrop-blur-md border border-white/15 active:scale-95 transition-transform"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activePreset.badgeColor }} />
                <span className="truncate text-[13px] font-semibold">{activePreset.name}</span>
                <span className="text-[10px] text-white/50 font-film uppercase">PILIH</span>
              </button>
            </div>

            {/* Retro Date Imprint */}
            <div className="absolute bottom-4 right-4 pointer-events-none font-film text-[12px] font-bold text-[#ff7b00] drop-shadow-[0_0_8px_rgba(255,100,0,0.8)] tracking-widest opacity-85">
              {`'${new Date().getFullYear().toString().slice(-2)} ${(new Date().getMonth() + 1).toString().padStart(2, '0')} ${new Date().getDate().toString().padStart(2, '0')}`}
            </div>

            {/* Developing Toast Notification */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full text-xs font-film text-white shadow-2xl z-30 animate-pulse">
                {statusMessage}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM CONTROLS (Identik dengan Satualbum) */}
        <div className="relative z-10 flex flex-shrink-0 items-center justify-around px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-2">
          
          {/* Preset Pill Button */}
          <button
            onClick={() => setShowPresetSheet(true)}
            className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[26px] bg-white/10 border border-white/10 px-5 text-white transition-transform active:scale-[0.96] max-[430px]:h-12 max-[430px]:w-12 max-[430px]:px-0"
            title="Ganti Preset Film"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePreset.badgeColor }} />
            <span className="text-[13px] font-medium text-white max-[430px]:hidden">
              {activePreset.name.split(' ')[0]}
            </span>
          </button>

          {/* BIG SHUTTER BUTTON (Satualbum White Disc Style) */}
          <button
            onClick={handleCapturePhoto}
            disabled={isCapturing || remainingRolls <= 0}
            className={`flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full bg-white transition-transform active:scale-[0.92] shadow-2xl p-1 ${
              remainingRolls <= 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <div className="w-full h-full rounded-full border-4 border-black/80 bg-white flex items-center justify-center">
              {isCapturing ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : remainingRolls <= 0 ? (
                <span className="text-[10px] font-film font-bold text-black uppercase">Habis</span>
              ) : null}
            </div>
          </button>

          {/* Gallery Button / Thumbnail */}
          <Link
            href={`/${slug}/albumkami`}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[26px] bg-white/10 border border-white/10 transition-transform active:scale-[0.96] overflow-hidden"
            title="Buka Galeri"
          >
            {recentPhoto ? (
              <img src={recentPhoto} alt="Recent" className="w-full h-full object-cover" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            )}
          </Link>
        </div>

      </div>

      {/* BOTTOM SHEET: PRESET PICKER (Satualbum Style) */}
      {showPresetSheet && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-sm p-0 md:items-center md:p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[32px] border border-white/10 bg-[#161616] px-6 pb-8 pt-5 shadow-2xl md:rounded-[32px] anim-slide-up"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-white">Preset Film</h3>
              <button
                onClick={() => setShowPresetSheet(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/50 mb-5 leading-relaxed">
              Pilih karakter rol film untuk jepretan acaramu.
            </p>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {Object.values(FILM_PRESETS).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActivePresetId(p.id);
                    setShowPresetSheet(false);
                  }}
                  className={`w-full p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    activePresetId === p.id
                      ? 'bg-white/10 border-white/40 shadow-lg'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.badgeColor }} />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <p className="text-[11px] text-white/45">{p.description}</p>
                    </div>
                  </div>
                  {activePresetId === p.id && (
                    <span className="text-emerald-400 text-sm font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
