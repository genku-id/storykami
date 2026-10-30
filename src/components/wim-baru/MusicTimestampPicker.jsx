'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getYouTubeId } from './BackgroundMusic';

// Helper konversi waktu mulai ke detik float (mendukung desimal / milidetik)
export function parseStartTime(val, url = '') {
  if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '0') {
    if (typeof val === 'number') return Math.max(0, val);
    const str = String(val).trim();
    if (str.includes(':')) {
      const parts = str.split(':');
      if (parts.length === 2) {
        const min = parseFloat(parts[0]) || 0;
        const sec = parseFloat(parts[1]) || 0;
        return Math.max(0, Number((min * 60 + sec).toFixed(3)));
      } else if (parts.length === 3) {
        const hr = parseFloat(parts[0]) || 0;
        const min = parseFloat(parts[1]) || 0;
        const sec = parseFloat(parts[2]) || 0;
        return Math.max(0, Number((hr * 3600 + min * 60 + sec).toFixed(3)));
      }
    }
    const num = parseFloat(str);
    if (!isNaN(num)) return Math.max(0, Number(num.toFixed(3)));
  }

  if (url && typeof url === 'string') {
    const tMatch = url.match(/[?&]t=([0-9hms.]+)/);
    if (tMatch) {
      const tVal = tMatch[1];
      if (/^\d+(\.\d+)?$/.test(tVal)) return parseFloat(tVal);
      let sec = 0;
      const h = tVal.match(/(\d+)h/);
      const m = tVal.match(/(\d+)m/);
      const s = tVal.match(/(\d+(\.\d+)?)s/);
      if (h) sec += parseFloat(h[1]) * 3600;
      if (m) sec += parseFloat(m[1]) * 60;
      if (s) sec += parseFloat(s[1]);
      return Number(sec.toFixed(3));
    }
  }

  return 0;
}

// Helper format detik ke string mm:ss atau mm:ss.ms
export function formatTime(sec, showMs = false) {
  if (isNaN(sec) || sec < 0) return showMs ? '00:00.00' : '00:00';
  const totalSec = Math.floor(sec);
  const ms = Math.floor((sec - totalSec) * 100);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');
  const msStr = String(ms).padStart(2, '0');
  if (h > 0) {
    const hStr = String(h).padStart(2, '0');
    return showMs ? `${hStr}:${mStr}:${sStr}.${msStr}` : `${hStr}:${mStr}:${sStr}`;
  }
  return showMs ? `${mStr}:${sStr}.${msStr}` : `${mStr}:${sStr}`;
}

export default function MusicTimestampPicker({ url, onUrlChange, value, onChange, slug = 'undangan' }) {
  const [duration, setDuration] = useState(180);
  const [hasDuration, setHasDuration] = useState(false);
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Status Konversi YouTube
  const [isConverting, setIsConverting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const containerId = useRef(`yt-picker-${Math.random().toString(36).substring(2, 9)}`);
  const playerRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);

  const ytId = getYouTubeId(url);
  const startSeconds = parseStartTime(value, url);
  const isDirectAudio = url && !ytId;

  // Sync currentPlayTime saat tidak sedang play
  useEffect(() => {
    if (!isPlaying) {
      setCurrentPlayTime(startSeconds);
    }
  }, [startSeconds, isPlaying]);

  // --- Inisialisasi Durasi (YouTube API atau HTML5 Audio) ---
  useEffect(() => {
    if (!url) {
      setIsLoadingDuration(false);
      setHasDuration(false);
      return;
    }

    let isMounted = true;
    setErrorMsg('');

    if (ytId) {
      setIsLoadingDuration(true);
      setHasDuration(false);

      const initYTPlayer = () => {
        if (!isMounted || !window.YT || !window.YT.Player) return;

        if (playerRef.current) {
          try { playerRef.current.destroy(); } catch (e) {}
          playerRef.current = null;
        }

        try {
          playerRef.current = new window.YT.Player(containerId.current, {
            height: '120',
            width: '200',
            videoId: ytId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              playsinline: 1,
              origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            },
            events: {
              onReady: (event) => {
                if (!isMounted) return;
                let attempts = 0;
                const pollTimer = setInterval(() => {
                  if (!isMounted) { clearInterval(pollTimer); return; }
                  try {
                    const dur = event.target.getDuration();
                    if (dur && dur > 0) {
                      setDuration(Math.floor(dur));
                      setHasDuration(true);
                      setIsLoadingDuration(false);
                      clearInterval(pollTimer);
                    } else {
                      attempts++;
                      if (attempts > 20) {
                        setDuration(300);
                        setHasDuration(true);
                        setIsLoadingDuration(false);
                        clearInterval(pollTimer);
                      }
                    }
                  } catch (e) {
                    clearInterval(pollTimer);
                  }
                }, 300);
              },
              onStateChange: (event) => {
                if (!isMounted) return;
                if (event.data === 1) {
                  setIsPlaying(true);
                } else if (event.data === 2 || event.data === 0) {
                  setIsPlaying(false);
                }
              },
              onError: (event) => {
                if (!isMounted) return;
                setIsLoadingDuration(false);
                setDuration(300);
                setHasDuration(true);
                if (event.data === 101 || event.data === 150) {
                  setErrorMsg('Video YouTube ini membatasi pemutaran eksternal. Sangat disarankan konversi ke MP3 di bawah.');
                }
              }
            }
          });
        } catch (err) {
          console.warn('YT Player init error:', err);
          setIsLoadingDuration(false);
          setDuration(300);
          setHasDuration(true);
        }
      };

      if (window.YT && window.YT.Player) {
        initYTPlayer();
      } else {
        if (!document.getElementById('yt-iframe-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'yt-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }

        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevReady) prevReady();
          initYTPlayer();
        };

        const checkInterval = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkInterval);
            initYTPlayer();
          }
        }, 250);

        return () => {
          isMounted = false;
          clearInterval(checkInterval);
          if (playerRef.current) {
            try { playerRef.current.destroy(); } catch (e) {}
            playerRef.current = null;
          }
        };
      }

      return () => {
        isMounted = false;
        if (playerRef.current) {
          try { playerRef.current.destroy(); } catch (e) {}
          playerRef.current = null;
        }
      };
    } else {
      // Audio MP3 / M4A Langsung
      setIsLoadingDuration(true);
      setHasDuration(false);
      const audio = audioRef.current;
      if (!audio) return;

      const handleLoadedMetadata = () => {
        if (!isMounted) return;
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          setDuration(Number(audio.duration.toFixed(2)));
          setHasDuration(true);
        } else {
          setDuration(180);
          setHasDuration(true);
        }
        setIsLoadingDuration(false);
      };

      const handleTimeUpdate = () => {
        if (!isMounted) return;
        setCurrentPlayTime(Number(audio.currentTime.toFixed(2)));
      };

      const handleEnded = () => {
        if (!isMounted) return;
        setIsPlaying(false);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        isMounted = false;
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
      };
    }
  }, [ytId, url]);

  // Interval pelacakan waktu (khusus YouTube)
  useEffect(() => {
    if (!isPlaying || !ytId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const cur = playerRef.current.getCurrentTime();
          if (typeof cur === 'number') {
            setCurrentPlayTime(Number(cur.toFixed(2)));
          }
        } catch (e) {}
      }
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, ytId]);

  // Hentikan pemutaran audio saat unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // --- Handlers Slider & Micro Adjustments ---
  const handleSliderChange = (newVal) => {
    const clamped = Math.max(0, Math.min(Number(newVal), duration));
    const rounded = Number(clamped.toFixed(2));
    onChange(rounded);
    setCurrentPlayTime(rounded);

    if (isPlaying) {
      if (ytId && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(rounded, true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = rounded;
      }
    }
  };

  // --- Handler Play / Pause Tes Audio ---
  const togglePlayAudio = () => {
    if (!url) return;

    if (isPlaying) {
      if (ytId && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (ytId && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(startSeconds, true);
        playerRef.current.playVideo();
        setIsPlaying(true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = startSeconds;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Audio play failed:', err);
        });
      }
    }
  };

  // --- Action: Konversi YouTube ke Audio MP3 / M4A ---
  const handleConvertYouTube = async () => {
    if (!url || !ytId) return;
    setIsConverting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/convert-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, slug })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal mengonversi video YouTube');
      }

      if (typeof onUrlChange === 'function') {
        onUrlChange(resData.audioUrl);
      }
      setSuccessMsg(`Berhasil dikonversi! "${resData.title}". Audio murni kini aktif (100% lancar di iPhone & Android).`);
    } catch (err) {
      console.error('Convert YouTube error:', err);
      setErrorMsg(err.message || 'Gagal mengekstrak audio dari YouTube. Silakan gunakan opsi upload MP3.');
    } finally {
      setIsConverting(false);
    }
  };

  // --- Action: Upload File MP3 / M4A Langsung ---
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', slug || 'audio');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const resData = await res.json();
      if (!res.ok || !resData.url) {
        throw new Error(resData.error || 'Gagal mengunggah file musik');
      }

      if (typeof onUrlChange === 'function') {
        onUrlChange(resData.url);
      }
      setSuccessMsg(`File audio "${file.name}" berhasil diunggah dan aktif!`);
    } catch (err) {
      console.error('Upload audio error:', err);
      setErrorMsg(err.message || 'Gagal mengunggah file audio.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!url) {
    return (
      <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px dashed var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Masukkan link musik YouTube atau unggah file MP3 di atas untuk mengatur waktu mulai lagu.
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1.25rem',
      borderRadius: '12px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Hidden Player Elements */}
      {ytId ? (
        <div style={{ position: 'fixed', bottom: '-200px', right: '-200px', width: '200px', height: '120px', opacity: 0.001, pointerEvents: 'none', zIndex: -1 }}>
          <div id={containerId.current}></div>
        </div>
      ) : (
        <audio ref={audioRef} src={url} preload="metadata" style={{ display: 'none' }} />
      )}

      {/* Hidden Audio File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header Info Status Format Musik */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🎵</span>
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Pengatur Waktu Mulai Musik
          </span>
        </div>

        {isDirectAudio ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <span>✅</span>
            <span>Audio Langsung (100% Kompatibel iPhone & Android)</span>
          </span>
        ) : (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#b45309',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <span>⚠️</span>
            <span>Link YouTube (Disarankan Konversi)</span>
          </span>
        )}
      </div>

      {/* Alert Notifikasi Sukses / Error */}
      {successMsg && (
        <div style={{ marginBottom: '1rem', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#047857', fontSize: '0.82rem' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ marginBottom: '1rem', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#b91c1c', fontSize: '0.82rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Tombol Aksi: Auto Convert YouTube & Upload File Langsung */}
      {typeof onUrlChange === 'function' && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'var(--bg-main, #f8fafc)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {ytId ? (
              <span>Ubah link YouTube ini menjadi audio murni agar langsung berbunyi di iPhone:</span>
            ) : (
              <span>Ganti lagu dengan file audio lain:</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ytId && (
              <button
                type="button"
                onClick={handleConvertYouTube}
                disabled={isConverting}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: isConverting ? '#94a3b8' : '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: isConverting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 4px rgba(225, 29, 72, 0.2)'
                }}
              >
                <span>{isConverting ? '⏳' : '⚡'}</span>
                <span>{isConverting ? 'Mengekstrak Audio...' : 'Konversi YouTube ke Audio'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{isUploading ? '⏳' : '📁'}</span>
              <span>{isUploading ? 'Mengunggah...' : 'Upload File MP3 / M4A'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tampilan Waktu Mulai & Durasi */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mulai di: </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary, #4f46e5)', fontFamily: 'monospace' }}>
            {formatTime(startSeconds, true)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
            ({startSeconds.toFixed(2)} detik)
          </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isLoadingDuration ? (
            <span>Membaca durasi...</span>
          ) : (
            <span>Total Durasi: <strong>{formatTime(duration)}</strong></span>
          )}
        </div>
      </div>

      {/* Slider Presisi (Mendukung Milidetik step 0.05 / 50ms) */}
      <div style={{ position: 'relative', margin: '0.75rem 0' }}>
        <input
          type="range"
          min="0"
          max={duration || 180}
          step="0.05"
          value={startSeconds}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            outline: 'none',
            accentColor: 'var(--primary, #4f46e5)',
            cursor: 'pointer'
          }}
        />
      </div>

      {/* Tombol Kontrol Cepat Presisi (Mikro-Detik) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleSliderChange(startSeconds - 1)}
            title="Mundur 1 Detik"
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--border)', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            -1s
          </button>
          <button
            type="button"
            onClick={() => handleSliderChange(startSeconds - 0.1)}
            title="Mundur 100 Milidetik"
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--border)', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            -0.1s
          </button>
          <button
            type="button"
            onClick={() => handleSliderChange(startSeconds + 0.1)}
            title="Maju 100 Milidetik"
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--border)', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            +0.1s
          </button>
          <button
            type="button"
            onClick={() => handleSliderChange(startSeconds + 1)}
            title="Maju 1 Detik"
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--border)', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            +1s
          </button>
          <button
            type="button"
            onClick={() => handleSliderChange(0)}
            title="Mulai dari awal"
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--border)', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}
          >
            00:00
          </button>
        </div>

        {/* Tombol Play / Pause Tes Audio */}
        <button
          type="button"
          onClick={togglePlayAudio}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '7px 14px',
            borderRadius: '8px',
            background: isPlaying ? '#ef4444' : '#4f46e5',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.84rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span>{isPlaying ? '⏸️' : '▶️'}</span>
          <span>{isPlaying ? 'Jeda Tes Audio' : 'Dengarkan dari Waktu Ini'}</span>
        </button>
      </div>

      {/* Info Live Playback & Tombol Jadikan Titik Ini */}
      {isPlaying && (
        <div style={{
          marginTop: '0.75rem',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(79, 70, 229, 0.08)',
          border: '1px solid rgba(79, 70, 229, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ fontSize: '0.82rem', color: '#4f46e5', fontWeight: 600 }}>
            <span>▶️ Sedang Diputar: </span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{formatTime(currentPlayTime, true)}</span>
          </div>

          {Math.abs(currentPlayTime - startSeconds) > 0.2 && (
            <button
              type="button"
              onClick={() => handleSliderChange(currentPlayTime)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <span>🎯</span>
              <span>Jadikan {formatTime(currentPlayTime, true)} sebagai Mulai</span>
            </button>
          )}
        </div>
      )}

      {/* Input Manual Input Detik & Milidetik */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Ketik angka manual (format mm:ss.ms atau detik):
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="text"
            value={formatTime(startSeconds, true)}
            onChange={(e) => {
              const val = e.target.value;
              const parsed = parseStartTime(val);
              handleSliderChange(parsed);
            }}
            placeholder="00:14.250 atau 14.25"
            style={{
              width: '115px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}
          />
        </div>
      </div>
    </div>
  );
}
