'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import BackgroundMusic from '@/components/wim-baru/BackgroundMusic';

export default function MovementTemplate({ data = {}, slug = 'demo', guestName = '', isDemo = false, isVisible = true }) {
  const iframeRef = useRef(null);

  const isDemoMode = Boolean(isDemo) || slug === 'demo' || slug === 'preview' || 
    (typeof slug === 'string' && (slug.startsWith('demo') || slug.includes('demo'))) || 
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/demo'));
  const demoStorageKey = `storykami_demo_guestbook_${slug || 'movement'}`;

  const buildIframeSrc = (nameOverride) => {
    let name = nameOverride !== undefined ? nameOverride : guestName;
    if (!name && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      name = sp.get('to') || sp.get('u') || sp.get('nama') || sp.get('guest') || '';
    }
    const finalName = name ? decodeURIComponent(name.replace(/\+/g, ' ')).trim() : '';
    const params = new URLSearchParams();
    if (finalName) params.set('to', finalName);
    if (slug) params.set('slug', slug);
    if (isDemoMode) params.set('demo', '1');
    params.set('v', '2.1.0');
    const qs = params.toString();
    return `/templates/movement/index.html${qs ? `?${qs}` : ''}`;
  };

  const [iframeSrc, setIframeSrc] = useState(buildIframeSrc);
  const [resolvedGuestName, setResolvedGuestName] = useState(() => {
    let name = guestName;
    if (!name && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      name = sp.get('to') || sp.get('u') || sp.get('nama') || sp.get('guest') || '';
    }
    return name ? decodeURIComponent(name.replace(/\+/g, ' ')).trim() : '';
  });
  const [comments, setComments] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // 1. Resolve Guest Name & setup query params
  useEffect(() => {
    let name = guestName;
    if (!name && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      name = sp.get('to') || sp.get('u') || sp.get('nama') || sp.get('guest') || '';
    }
    const finalName = name ? decodeURIComponent(name.replace(/\+/g, ' ')).trim() : '';
    setResolvedGuestName(finalName);

    // Store in sessionStorage so iframe reads it immediately on startup
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('storykami_invitation_data', JSON.stringify(data));
        sessionStorage.setItem('storykami_guest_name', finalName);
      }
    } catch (e) {
      console.warn('sessionStorage write error:', e);
    }

    const targetSrc = buildIframeSrc(finalName);
    setIframeSrc(prev => prev !== targetSrc ? targetSrc : prev);
  }, [guestName, slug, isDemoMode, data]);

  // 2. Fetch Comments (Guestbook)
  useEffect(() => {
    if (isDemoMode) {
      try {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(demoStorageKey);
          setComments(local ? JSON.parse(local) : []);
        }
      } catch (err) {
        console.error('Demo comments read error:', err);
      }
      return;
    }

    const fetchComments = async () => {
      if (!slug || slug === 'demo') return;
      try {
        const { data: dbComments, error } = await supabase
          .from('guestbook')
          .select('*')
          .eq('invitation_slug', slug)
          .order('created_at', { ascending: false });
        if (!error && dbComments) {
          setComments(dbComments);
        }
      } catch (err) {
        console.error('Fetch comments error:', err);
      }
    };
    fetchComments();
  }, [slug, isDemoMode, demoStorageKey]);

  // 3. Helper to send data to iframe
  const sendDataToIframe = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage({
        type: 'STORYKAMI_INIT',
        data,
        guestName: resolvedGuestName,
        slug,
        isDemo: isDemoMode,
        comments,
        isPlaying
      }, '*');
    } catch (err) {
      console.warn('postMessage error:', err);
    }
  }, [data, resolvedGuestName, slug, isDemoMode, comments, isPlaying]);

  // 4. Send data on updates
  useEffect(() => {
    sendDataToIframe();
  }, [sendDataToIframe]);

  // Sync music state to iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'MUSIC_STATE',
          isPlaying
        }, '*');
      } catch (err) {
        console.warn('postMessage music state error:', err);
      }
    }
  }, [isPlaying]);

  // 5. Handle messages from iframe (IFRAME_READY, MUSIC, and SUBMIT_COMMENT)
  useEffect(() => {
    const handleMessage = async (event) => {
      if (!event.data) return;
      
      if (event.data.type === 'IFRAME_READY') {
        sendDataToIframe();
      }

      if (event.data.type === 'PLAY_MUSIC') {
        setIsPlaying(true);
      }

      if (event.data.type === 'PAUSE_MUSIC') {
        setIsPlaying(false);
      }

      if (event.data.type === 'TOGGLE_MUSIC') {
        setIsPlaying(prev => !prev);
      }

      if (event.data.type === 'SUBMIT_COMMENT') {
        const { payload } = event.data;
        if (!payload || !payload.nama) return;

        if (isDemoMode) {
          const demoComment = {
            id: `demo-${Date.now()}`,
            invitation_slug: slug,
            nama: payload.nama,
            ucapan: payload.ucapan || '',
            kehadiran: payload.kehadiran || 'Hadir',
            created_at: new Date().toISOString()
          };
          try {
            const current = JSON.parse(localStorage.getItem(demoStorageKey) || '[]');
            const updated = [demoComment, ...current];
            localStorage.setItem(demoStorageKey, JSON.stringify(updated));
            setComments(updated);
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage({ type: 'COMMENTS_UPDATED', comments: updated }, '*');
            }
          } catch (e) {
            console.error('Error saving demo comment:', e);
          }
        } else {
          const dbPayload = {
            invitation_slug: slug,
            nama: payload.nama,
            ucapan: payload.ucapan || '',
            kehadiran: payload.kehadiran || 'Hadir',
            created_at: new Date().toISOString()
          };
          try {
            const { data: inserted, error } = await supabase
              .from('guestbook')
              .insert([dbPayload])
              .select();

            if (!error && inserted && inserted.length > 0) {
              setComments(prev => {
                const updated = [inserted[0], ...prev];
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.postMessage({ type: 'COMMENTS_UPDATED', comments: updated }, '*');
                }
                return updated;
              });
            }
          } catch (err) {
            console.error('Error saving live comment:', err);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendDataToIframe, isDemoMode, slug, demoStorageKey]);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100svh', 
        zIndex: 1000, 
        background: '#FFFFFF', 
        margin: 0, 
        padding: 0, 
        overflow: 'hidden' 
      }}
    >
      <BackgroundMusic url={data.musikUrl} isPlaying={isPlaying} start={data.musikStart} />
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="Movement - StoryKami"
        onLoad={sendDataToIframe}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none', 
          display: 'block',
          margin: 0,
          padding: 0
        }}
        allow="autoplay; clipboard-write"
      />
    </div>
  );
}
