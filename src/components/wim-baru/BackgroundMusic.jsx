'use client';
import React, { useEffect, useRef, useState } from 'react';

// Helper mengekstrak Video ID dari berbagai format link YouTube
export function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

// Helper konversi waktu mulai ke detik (angka murni, format mm:ss / mm:ss.ms / t= di URL)
export function parseStartTime(val, url = '') {
  if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '0') {
    if (typeof val === 'number') return Math.max(0, val);
    const raw = String(val).trim();
    if (raw.includes(':')) {
      const parts = raw.split(':');
      if (parts.length === 2) {
        const min = parseFloat(parts[0]) || 0;
        const sec = parseFloat(parts[1]) || 0;
        return Math.max(0, min * 60 + sec);
      } else if (parts.length === 3) {
        const hr = parseFloat(parts[0]) || 0;
        const min = parseFloat(parts[1]) || 0;
        const sec = parseFloat(parts[2]) || 0;
        return Math.max(0, hr * 3600 + min * 60 + sec);
      }
    }
    return Math.max(0, parseFloat(raw) || 0);
  }

  // Fallback: deteksi parameter t= di URL YouTube
  if (url && typeof url === 'string') {
    const tMatch = url.match(/[?&]t=([0-9hms.]+)/);
    if (tMatch) {
      const tVal = tMatch[1];
      if (/^\d+(\.\d+)?$/.test(tVal)) return parseFloat(tVal);
      let sec = 0;
      const h = tVal.match(/(\d+)h/);
      const m = tVal.match(/(\d+)m/);
      const s = tVal.match(/(\d+(?:\.\d+)?)s/);
      if (h) sec += parseFloat(h[1]) * 3600;
      if (m) sec += parseFloat(m[1]) * 60;
      if (s) sec += parseFloat(s[1]);
      return sec;
    }
  }

  return 0;
}

export default function BackgroundMusic({ url, isPlaying, start = 0 }) {
  const iframeRef = useRef(null);
  const audioRef = useRef(null);
  const hasMountedYtRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);

  const startSeconds = parseStartTime(start, url);
  const ytId = getYouTubeId(url);

  // Kirim perintah ke YouTube IFrame API via postMessage
  const sendYtCommand = (func, args = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (e) {
        console.warn('Gagal mengirim postMessage ke YouTube:', e);
      }
    }
  };

  // Saat tombol "Buka Undangan" diklik (isPlaying berubah jadi true)
  useEffect(() => {
    if (isPlaying && !hasStarted) {
      setHasStarted(true);
    }
  }, [isPlaying, hasStarted]);

  // Reset flag saat video ID berubah
  useEffect(() => {
    hasMountedYtRef.current = false;
  }, [ytId]);

  // Handle Play/Pause toggles
  useEffect(() => {
    if (!url) return;

    if (ytId) {
      if (hasMountedYtRef.current) {
        if (isPlaying) {
          sendYtCommand('playVideo', []);
        } else {
          sendYtCommand('pauseVideo', []);
        }
      }
    } else {
      // Audio MP3 biasa
      if (audioRef.current) {
        if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              if (startSeconds > 0 && Math.abs(audioRef.current.currentTime - startSeconds) > 0.5) {
                try { audioRef.current.currentTime = startSeconds; } catch (_) {}
              }
            }).catch(e => {
              console.log('Autoplay audio ditahan browser:', e);
            });
          }
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, url, ytId, startSeconds]);

  const handleIframeLoad = () => {
    // Unmute & set volume & play
    sendYtCommand('unMute', []);
    sendYtCommand('setVolume', [100]);
    if (isPlaying) {
      sendYtCommand('playVideo', []);
    }
  };

  if (!url) return null;

  return (
    <>
      {ytId ? (
        hasStarted ? (
          <div
            style={{
              position: 'fixed',
              bottom: '10px',
              right: '10px',
              width: '200px',
              height: '120px',
              opacity: 0.005, // Sangat tipis & transparan sehingga tidak terlihat dan tidak mengganggu visual undangan
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'hidden'
            }}
          >
            <iframe
              key={`${ytId}-${startSeconds}`}
              ref={(el) => {
                iframeRef.current = el;
                if (el) hasMountedYtRef.current = true;
              }}
              onLoad={handleIframeLoad}
              id="wim-youtube-player"
              width="200"
              height="120"
              src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&start=${startSeconds}&loop=1&playlist=${ytId}&controls=0&playsinline=1`}
              title="Lagu Latar Undangan"
              allow="autoplay; encrypted-media; picture-in-picture"
              style={{ border: 'none' }}
            />
          </div>
        ) : null
      ) : (
        <audio
          ref={audioRef}
          src={url}
          loop
          preload="auto"
          playsInline
          onLoadedMetadata={(e) => {
            if (startSeconds > 0 && e.target.currentTime < 0.1) {
              try { e.target.currentTime = startSeconds; } catch (_) {}
            }
          }}
          style={{ position: 'fixed', bottom: 0, right: 0, width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none', zIndex: -999 }}
        />
      )}
    </>
  );
}
