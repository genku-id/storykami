'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getYouTubeId, parseStartTime } from './BackgroundMusic';

// Helper format detik ke string mm:ss (atau hh:mm:ss jika > 1 jam)
export function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return '00:00';
  const totalSec = Math.floor(sec);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MusicTimestampPicker({ url, value, onChange }) {
  const [duration, setDuration] = useState(180); // default 3 menit jika belum termuat
  const [hasDuration, setHasDuration] = useState(false);
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const containerId = useRef(`yt-picker-${Math.random().toString(36).substring(2, 9)}`);
  const playerRef = useRef(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const ytId = getYouTubeId(url);
  const startSeconds = parseStartTime(value, url);

  // Sync currentPlayTime dengan startSeconds saat tidak sedang memutar tes audio
  useEffect(() => {
    if (!isPlaying) {
      setCurrentPlayTime(startSeconds);
    }
  }, [startSeconds, isPlaying]);

  // --- 1. Inisialisasi YouTube API / Durasi ---
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
                // Polling untuk membaca getDuration()
                let attempts = 0;
                const pollTimer = setInterval(() => {
                  if (!isMounted) { clearInterval(pollTimer); return; }
                  try {
                    const dur = event.target.getDuration();
                    if (dur && dur > 0) {
                      const rounded = Math.floor(dur);
                      setDuration(rounded);
                      setHasDuration(true);
                      setIsLoadingDuration(false);
                      clearInterval(pollTimer);
                    } else {
                      attempts++;
                      if (attempts > 20) {
                        // Jika durasi YouTube tidak terdeteksi (fallback 300 detik = 5 menit)
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
                // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
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
                  setErrorMsg('Pemilik video YouTube ini membatasi pemutaran eksternal (embed). Lagu mungkin tidak berbunyi pada beberapa perangkat.');
                }
              }
            }
          });
        } catch (err) {
          console.warn('Gagal membuat YT.Player:', err);
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
      // Audio MP3 biasa
      setIsLoadingDuration(true);
      setHasDuration(false);
      const audio = audioRef.current;
      if (!audio) return;

      const handleLoadedMetadata = () => {
        if (!isMounted) return;
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          setDuration(Math.floor(audio.duration));
          setHasDuration(true);
        } else {
          setDuration(180);
          setHasDuration(true);
        }
        setIsLoadingDuration(false);
      };

      const handleTimeUpdate = () => {
        if (!isMounted) return;
        setCurrentPlayTime(Math.floor(audio.currentTime));
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

  // --- 2. Interval Pelacakan Waktu Saat Tes Audio Berjalan (Khusus YouTube) ---
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
            setCurrentPlayTime(Math.floor(cur));
          }
        } catch (e) {}
      }
    }, 250);

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
        try { playerRef.current.pauseVideo(); } catch (e) {}
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // --- 3. Handler Perubahan Slider ---
  const handleSliderChange = useCallback((newSec) => {
    const maxDur = duration > 0 ? duration : 300;
    const clamped = Math.max(0, Math.min(newSec, maxDur));
    onChange(clamped);

    if (isPlaying) {
      if (ytId && playerRef.current) {
        try { playerRef.current.seekTo(clamped, true); } catch (e) {}
      } else if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
      setCurrentPlayTime(clamped);
    } else {
      setCurrentPlayTime(clamped);
    }
  }, [duration, isPlaying, onChange, ytId]);

  // --- 4. Handler Tes Audio (Play / Pause) ---
  const handleTogglePlay = () => {
    if (isPlaying) {
      // Pause
      if (ytId && playerRef.current) {
        try { playerRef.current.pauseVideo(); } catch (e) {}
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // Play dari titik startSeconds
      if (ytId && playerRef.current) {
        try {
          playerRef.current.seekTo(startSeconds, true);
          playerRef.current.playVideo();
          setCurrentPlayTime(startSeconds);
          setIsPlaying(true);
        } catch (e) {
          console.warn('Gagal memutar video YouTube:', e);
        }
      } else if (audioRef.current) {
        audioRef.current.currentTime = startSeconds;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setCurrentPlayTime(startSeconds);
        }).catch(e => {
          console.warn('Gagal memutar audio MP3:', e);
        });
      }
    }
  };

  // --- 5. Tampilan Jika Belum Ada Link Musik ---
  if (!url) {
    return (
      <div style={{
        marginTop: '0.75rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        borderRadius: '10px',
        background: 'rgba(99, 102, 241, 0.05)',
        border: '1px dashed var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
        <span>Masukkan tautan YouTube atau MP3 di atas untuk mengaktifkan pengaturan garis timestamp &amp; tes audio.</span>
      </div>
    );
  }

  const maxVal = duration > 0 ? duration : 300;
  const startPercent = Math.min(100, Math.max(0, (startSeconds / maxVal) * 100));
  const playheadPercent = Math.min(100, Math.max(0, (currentPlayTime / maxVal) * 100));

  return (
    <div style={{
      marginTop: '0.75rem',
      marginBottom: '1.5rem',
      padding: '1.25rem',
      borderRadius: '12px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative'
    }}>
      {/* Hidden container untuk YouTube IFrame API */}
      {ytId && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          width: '200px',
          height: '120px',
          opacity: 0.005,
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'hidden'
        }}>
          <div id={containerId.current} />
        </div>
      )}

      {/* Hidden audio element untuk MP3 */}
      {!ytId && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          style={{ display: 'none' }}
        />
      )}

      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🎵</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Garis Penentu Timestamp Lagu
          </span>
          {isLoadingDuration && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              (Memuat durasi...)
            </span>
          )}
        </div>

        {/* Badge Mulai */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '4px 10px',
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#4f46e5',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <span>Mulai Lagu:</span>
          <strong>{formatTime(startSeconds)}</strong>
          <span style={{ opacity: 0.7, fontSize: '0.75rem', fontWeight: 'normal' }}>
            ({startSeconds}s)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      {/* --- GARIS TIMELINE (YOUTUBE-STYLE SCRUBBER) --- */}
      <div style={{ position: 'relative', margin: '1.25rem 0 0.5rem 0' }}>
        {/* Custom Timeline Track Container */}
        <div style={{ position: 'relative', width: '100%', height: '28px', display: 'flex', alignItems: 'center' }}>
          {/* Background Bar */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '8px',
            background: 'var(--border)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            {/* Filled Bar sampai ke titik Mulai */}
            <div style={{
              height: '100%',
              width: `${startPercent}%`,
              background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)',
              transition: isPlaying ? 'none' : 'width 0.1s ease'
            }} />
          </div>

          {/* Indikator Posisi Suara Saat Sedang Tes Play (Playhead) */}
          {isPlaying && (
            <div style={{
              position: 'absolute',
              left: `${playheadPercent}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
              zIndex: 3,
              pointerEvents: 'none'
            }} />
          )}

          {/* Interactive Native Range Slider on top */}
          <input
            type="range"
            min="0"
            max={maxVal}
            step="1"
            value={startSeconds}
            onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 5,
              margin: 0
            }}
            title={`Geser untuk memilih detik mulai: ${formatTime(startSeconds)}`}
          />

          {/* Visible Pin/Thumb untuk Titik Mulai */}
          <div style={{
            position: 'absolute',
            left: `${startPercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '3px solid #6366f1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            zIndex: 4,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
          </div>
        </div>

        {/* Labels Waktu di Bawah Garis */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
          <span>00:00 (Awal)</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {isPlaying ? (
              <span style={{ color: '#ef4444' }}>▶ Tes Suara: {formatTime(currentPlayTime)}</span>
            ) : (
              <span>Dipilih: {formatTime(startSeconds)}</span>
            )}
          </span>
          <span>{formatTime(maxVal)} (Selesai)</span>
        </div>
      </div>

      {/* --- TOMBOL KONTROL & PENGATURAN --- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Tombol Play / Pause untuk Tes Audio */}
        <button
          type="button"
          onClick={handleTogglePlay}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 16px',
            borderRadius: '8px',
            background: isPlaying ? '#ef4444' : '#4f46e5',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {isPlaying ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              <span>Jeda Tes Audio</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Tes Audio dari Menit Ini</span>
            </>
          )}
        </button>

        {/* Tombol Cepat -5s dan +5s */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => handleSliderChange(startSeconds - 5)}
            title="Mundur 5 Detik"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'var(--border)',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            -5s
          </button>

          <button
            type="button"
            onClick={() => handleSliderChange(startSeconds + 5)}
            title="Maju 5 Detik"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'var(--border)',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            +5s
          </button>

          <button
            type="button"
            onClick={() => handleSliderChange(0)}
            title="Kembali ke Awal Lagu"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'var(--border)',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            00:00
          </button>
        </div>

        {/* Tombol Ambil Waktu Saat Mendengarkan */}
        {isPlaying && Math.abs(currentPlayTime - startSeconds) > 1 && (
          <button
            type="button"
            onClick={() => handleSliderChange(currentPlayTime)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <span>🎯</span>
            <span>Jadikan {formatTime(currentPlayTime)} sebagai Mulai</span>
          </button>
        )}
      </div>

      {/* Input Manual Terintegrasi */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Atau ubah angka manual (detik atau menit:detik):
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="text"
            value={formatTime(startSeconds)}
            onChange={(e) => {
              const val = e.target.value;
              const parsed = parseStartTime(val);
              handleSliderChange(parsed);
            }}
            placeholder="01:20 atau 80"
            style={{
              width: '90px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: 600
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            (= {startSeconds} detik)
          </span>
        </div>
      </div>
    </div>
  );
}
