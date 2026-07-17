'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

function FieldGroup({ label, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 12 }}>
      {label && <label className="wim-label" style={{ marginBottom: 6, fontSize: '0.82rem', display: 'block' }}>{label}</label>}
      {children}
    </div>
  );
}

function YoutubeScrubber({ value, timestamp, onChange, onTimestampChange }) {
  const [videoId, setVideoId] = useState(null);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerId = 'yt-player-scrubber';

  useEffect(() => {
    if (!value) { setVideoId(null); return; }
    const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) setVideoId(match[1]);
    else setVideoId(null);
  }, [value]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  useEffect(() => {
    if (!videoId) {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
        setPlayer(null);
      }
      return;
    }

    const initPlayer = () => {
      if (player && typeof player.destroy === 'function') player.destroy();
      const newPlayer = new window.YT.Player(playerId, {
        height: '10',
        width: '10',
        videoId: videoId,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1 },
        events: {
          onReady: (e) => {
            setDuration(e.target.getDuration());
            setPlayer(e.target);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            else setIsPlaying(false);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
       if (player && typeof player.destroy === 'function') {
         player.destroy();
       }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isPlaying && player && typeof player.getCurrentTime === 'function') {
      interval = setInterval(() => {
        setCurrentPlaybackTime(player.getCurrentTime());
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.seekTo(timestamp || 0);
      player.playVideo();
    }
  };

  const handleSlider = (e) => {
    const val = parseInt(e.target.value, 10);
    onTimestampChange(val);
    if (player) {
      player.seekTo(val);
      if (!isPlaying) player.playVideo();
    }
  };
  
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <input type="text" className="wim-input" style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }} placeholder="https://www.youtube.com/watch?v=..." value={value || ''} onChange={e => onChange(e.target.value)} />
      
      {videoId && (
        <div style={{ marginTop: 12, background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
            <div id={playerId}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button type="button" onClick={togglePlay} style={{ background: 'var(--accent)', color: '#fff', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              )}
            </button>
            <div style={{ flex: 1, paddingTop: 6 }}>
               <input type="range" min="0" max={duration || 100} value={timestamp || 0} onChange={handleSlider} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                 <span style={{ color: 'var(--accent)' }}>
                   Mulai: {formatTime(timestamp || 0)}
                   {isPlaying && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>| Diputar: {formatTime(currentPlaybackTime)}</span>}
                 </span>
                 <span>Total: {formatTime(duration)}</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function RepeaterField({ field, items, onChange }) {
  const handleAdd = () => {
    const newItem = {};
    field.sub_fields.forEach(sf => newItem[sf.id] = '');
    onChange([...(items || []), newItem]);
  };

  const handleRemove = (idx) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    onChange(newItems);
  };

  const handleChange = (idx, key, val) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [key]: val };
    onChange(newItems);
  };

  const itemsArr = Array.isArray(items) ? items : [];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'block' }}>{field.label}</label>
      
      {itemsArr.map((item, idx) => (
        <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border)', borderRadius: 8, padding: 16, marginBottom: 16, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: 16, background: 'var(--accent)', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            {field.item_title || 'Item'} {idx + 1}
          </div>
          <button type="button" onClick={() => handleRemove(idx)} style={{ position: 'absolute', top: 12, right: 12, background: '#fee2e2', color: '#ef4444', border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {field.sub_fields.map(sf => {
              if (sf.type === 'select') {
                return (
                  <FieldGroup key={sf.id} label={sf.label}>
                    <select className="wim-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={item[sf.id] || ''} onChange={e => handleChange(idx, sf.id, e.target.value)}>
                      <option value="">Pilih...</option>
                      {sf.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </FieldGroup>
                )
              }
              if (sf.type === 'textarea') {
                 return (
                   <FieldGroup key={sf.id} label={sf.label}>
                     <textarea className="wim-input" style={{ padding: '8px 12px', fontSize: '0.85rem', minHeight: 60 }} value={item[sf.id] || ''} onChange={e => handleChange(idx, sf.id, e.target.value)} />
                   </FieldGroup>
                 )
              }
              return (
                <FieldGroup key={sf.id} label={sf.label}>
                  <input type={sf.type === 'date' ? 'date' : sf.type === 'time' ? 'time' : 'text'} className="wim-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={item[sf.id] || ''} onChange={e => handleChange(idx, sf.id, e.target.value)} />
                </FieldGroup>
              )
            })}
          </div>
        </div>
      ))}

      <button type="button" onClick={handleAdd} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--accent)', color: 'var(--accent)', width: '100%', padding: '10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah {field.item_title || 'Item'}
      </button>
    </div>
  );
}

function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  const [session, setSession] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [schema, setSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [usePhotos, setUsePhotos] = useState({});
  const [images, setImages] = useState({});
  const [existingImages, setExistingImages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [activeModalPage, setActiveModalPage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const sStr = localStorage.getItem('wim_session');
    if (!sStr) { router.replace('/wim/login'); return; }
    setSession(JSON.parse(sStr));

    if (slug) {
      const loadData = async () => {
        const { data: inv } = await supabase.from('invitations').select('*').eq('slug', slug).single();
        if (inv) {
          setInvitation(inv);
          const initialData = inv.data || {};
          if (!initialData.sections) initialData.sections = {};
          setFormData(initialData);
          
          const currentPhotos = {};
          const currentExistingImages = {};
          if (inv.data) {
             Object.keys(inv.data).forEach(key => {
               if (key.endsWith('Foto') && inv.data[key]) {
                  currentPhotos[key] = true;
                  currentExistingImages[key] = inv.data[key];
               }
             });
          }
          setUsePhotos(currentPhotos);
          setExistingImages(currentExistingImages);

          const tName = inv.template_name || inv.template;
          if (tName) {
            try {
              const res = await fetch(`/demo/${tName}/schema.json?t=${Date.now()}`);
              if (res.ok) {
                const s = await res.json();
                setSchema(s);
              }
            } catch (err) {
              console.error("Gagal load schema:", err);
            }
          }
        }
      };
      loadData();
    }
  }, [router, slug]);

  const compressImage = (file, maxSizeKB, maxWidth = 1200) => {
    return new Promise((resolve) => {
      if (file.type === 'image/gif') return resolve(file);
      if (file.size <= maxSizeKB * 1024) return resolve(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          let quality = 0.8;
          const tryCompress = (q) => {
            canvas.toBlob((blob) => {
              if (!blob) return resolve(file);
              if (blob.size <= maxSizeKB * 1024 || q <= 0.2) {
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
                resolve(newFile);
              } else { tryCompress(q - 0.2); }
            }, 'image/jpeg', q);
          };
          tryCompress(quality);
        };
      };
    });
  };

  const handleImageChange = async (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      showToast('Memproses foto...', 'info');
      const compressedFile = await compressImage(files[0], 290);
      setImages(prev => ({ ...prev, [name]: compressedFile }));
    }
  };

  const getPreviewUrl = (name) => {
    if (images[name]) return URL.createObjectURL(images[name]);
    if (existingImages[name]) return existingImages[name];
    return null;
  };

  const uploadImageToSupabase = async (file, slugName, prefix) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${slugName}-${prefix}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('wim-assets').upload(fileName, file);
    if (uploadError) return null;
    const { data } = supabase.storage.from('wim-assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    showToast('Menyimpan data dan memproses foto...', 'info');

    let uploadedUrls = { ...existingImages };
    for (const key of Object.keys(usePhotos)) {
      if (usePhotos[key] && images[key]) {
        const url = await uploadImageToSupabase(images[key], slug, key);
        if (url) uploadedUrls[key] = url;
      } else if (!usePhotos[key]) {
        uploadedUrls[key] = null;
      }
    }

    const finalData = { ...formData };
    Object.keys(uploadedUrls).forEach(k => {
      finalData[k] = uploadedUrls[k];
    });

    const { error } = await supabase
      .from('invitations')
      .update({ data: finalData })
      .eq('slug', slug);

    if (error) {
      showToast('Gagal menyimpan ke database', 'error');
      setIsLoading(false);
      return;
    }

    showToast('Generate HTML Template...', 'info');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, template: invitation.template_name, data: finalData })
      });
      const resData = await res.json();

      if (res.ok) {
        showToast('Undangan berhasil dibuat!', 'success');
        setTimeout(() => router.push('/wim/dashboard'), 1500);
      } else {
        showToast(`Gagal Generate: ${resData.error}`, 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan sistem', 'error');
    }
    
    setIsLoading(false);
  };

  const saveDraft = async () => {
    showToast('Menyimpan draf...', 'info');
    const { error } = await supabase
      .from('invitations')
      .update({ data: formData })
      .eq('slug', slug);
      
    if (error) showToast('Gagal simpan draf', 'error');
    else showToast('Draf disimpan!', 'success');
  };

  const handlePreview = () => {
    const tName = invitation?.template_name || invitation?.template;
    if (tName) {
      window.open(`/demo/${tName}/index.html`, '_blank');
    }
  };

  if (!schema) {
    return (
      <div className="page-container" style={{ maxWidth: 640, padding: '16px', textAlign: 'center', marginTop: 50 }}>
        <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat Pengaturan Template...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ flex: 1, width: '100%', maxWidth: 1000, padding: '16px', paddingBottom: 100, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push(`/wim/dashboard/buat?edit=${slug}`)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Kembali
        </button>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', margin: 0 }}>
            Isian Template
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{schema.name} - {slug}</p>
        </div>
      </div>

      {/* List of Pages (Trigger for Modals) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {schema.pages.map((page, idx) => (
          <div 
            key={page.id} 
            onClick={() => setActiveModalPage(page)}
            style={{ 
              background: 'var(--bg-secondary)', border: '1px solid var(--border)', 
              borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', 
              justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ background: 'var(--bg-card)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, border: '1px solid var(--border)', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: page.icon }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}>
                  {idx + 1}. {page.title}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Klik untuk mengatur isi halaman</p>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Action */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', gap: 12, zIndex: 10, boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 1000 }}>
          <button onClick={handlePreview} className="btn" style={{ flex: 1, padding: '12px', fontSize: '0.85rem', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Preview
          </button>
          <button onClick={saveDraft} disabled={isLoading} className="btn" style={{ flex: 1, padding: '12px', fontSize: '0.85rem', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 600 }}>
            Simpan Draf
          </button>
          <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary" style={{ flex: 1.5, padding: '12px', fontSize: '0.9rem', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            {isLoading ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} /> Tunggu...</>
            ) : (
              <>Generate <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg></>
            )}
          </button>
        </div>
      </div>

      {/* Popup Modal for Page Content */}
      {activeModalPage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '0 10px' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: 640, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90%', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease-out' }}>
            
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }} dangerouslySetInnerHTML={{ __html: activeModalPage.icon }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}>{activeModalPage.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Isi data untuk halaman ini</p>
                </div>
              </div>
              <button onClick={() => setActiveModalPage(null)} style={{ background: 'var(--bg-secondary)', border: 'none', fontSize: '1.4rem', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>&times;</button>
            </div>

            <div style={{ flex: 1, padding: 20, overflowY: 'auto', background: 'var(--bg-secondary)', minHeight: 0 }}>
              
              {/* Page Toggle */}
              {activeModalPage.allow_toggle && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>Tampilkan Halaman Ini</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matikan jika Anda tidak ingin menggunakan fitur ini</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: 44, height: 24 }}>
                      <input 
                        type="checkbox" 
                        checked={formData.sections?.[activeModalPage.id] !== false} 
                        onChange={(e) => setFormData(p => ({ ...p, sections: { ...(p.sections || {}), [activeModalPage.id]: e.target.checked } }))} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: formData.sections?.[activeModalPage.id] !== false ? 'var(--accent)' : 'var(--border)', borderRadius: 24, transition: '0.4s' }}></span>
                      <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: formData.sections?.[activeModalPage.id] !== false ? 22 : 4, bottom: 3, background: '#fff', borderRadius: '50%', transition: '0.4s' }}></span>
                    </div>
                  </label>
                </div>
              )}

              
              {/* Photo Toggle */}
              {activeModalPage.photos && activeModalPage.photos.map(photo => (
                <div key={photo.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={!!usePhotos[photo.name]} 
                      onChange={(e) => setUsePhotos(p => ({ ...p, [photo.name]: e.target.checked }))} 
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                    />
                    {photo.label}
                  </label>
                  
                  {usePhotos[photo.name] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                      <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {getPreviewUrl(photo.name) ? (
                          <>
                            <img src={getPreviewUrl(photo.name)} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => {
                              setImages(p => { const n = {...p}; delete n[photo.name]; return n; });
                              setExistingImages(p => { const n = {...p}; delete n[photo.name]; return n; });
                            }} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 10 }}>&times;</button>
                          </>
                        ) : (
                          <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</span>
                        )}
                        {!getPreviewUrl(photo.name) && <input type="file" accept="image/*" name={photo.name} onChange={handleImageChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Akan otomatis dikompres<br/>(Maksimal file ~250KB)
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      {photo.defaultText} akan digunakan.
                    </div>
                  )}
                </div>
              ))}

              {/* Text Fields */}
              <div style={{ display: 'grid', gap: 16 }}>
                {activeModalPage.fields.map(f => {
                  if (f.type === 'separator') {
                    return <div key={f.id} style={{ borderBottom: '1px dashed var(--border)', margin: '16px 0 8px 0', position: 'relative' }}><span style={{ position: 'absolute', top: -10, left: 10, background: 'var(--bg-secondary)', padding: '0 8px', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>{f.label}</span></div>;
                  }

                  
                  if (f.type === 'repeater') {
                    return (
                      <RepeaterField 
                        key={f.id} 
                        field={f} 
                        items={f.id.includes('.') ? formData[f.id.split('.')[0]]?.[f.id.split('.')[1]] : formData[f.id]} 
                        onChange={(val) => {
                          setFormData(p => {
                            const newD = { ...p };
                            const parts = f.id.split('.');
                            if (parts.length === 1) newD[parts[0]] = val;
                            else newD[parts[0]] = { ...newD[parts[0]], [parts[1]]: val };
                            return newD;
                          });
                        }}
                      />
                    );
                  }
                  
                  if (f.type === 'select') {
                    return (
                      <FieldGroup key={f.id} label={f.label}>
                        <select
                          className="wim-input"
                          style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                          value={f.id?.includes('.') ? formData[f.id.split('.')[0]]?.[f.id.split('.')[1]] : formData[f.id] || ''}
                          onChange={e => setFormData(p => {
                          const newD = { ...p };
                          const parts = f.id ? f.id.split('.') : f.id.split('.');
                          if (parts.length === 1) newD[parts[0]] = e.target.value;
                          else {
                            newD[parts[0]] = { ...newD[parts[0]], [parts[1]]: e.target.value };
                          }
                          return newD;
                        })}>
                          <option value="">Pilih...</option>
                          {f.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </FieldGroup>
                    );
                  }
                  if (f.type === 'textarea') {
                    return (
                      <FieldGroup key={f.id} label={f.label}>
                        <textarea
                          className="wim-input"
                          style={{ padding: '10px 12px', fontSize: '0.85rem', minHeight: 80, resize: 'vertical' }}
                          placeholder={f.placeholder}
                          value={f.id?.includes('.') ? formData[f.id.split('.')[0]]?.[f.id.split('.')[1]] : formData[f.id] || ''}
                          onChange={e => setFormData(p => {
                          const newD = { ...p };
                          const parts = f.id ? f.id.split('.') : f.id.split('.');
                          if (parts.length === 1) newD[parts[0]] = e.target.value;
                          else {
                            newD[parts[0]] = { ...newD[parts[0]], [parts[1]]: e.target.value };
                          }
                          return newD;
                        })}
                        />
                      </FieldGroup>
                    );
                  }

                  if (f.type === 'youtube_audio') {
                    return (
                      <FieldGroup key={f.id} label={f.label}>
                        <YoutubeScrubber
                          value={f.id?.includes('.') ? formData[f.id.split('.')[0]]?.[f.id.split('.')[1]] : formData[f.id]}
                          timestamp={formData['audioTimestamp']}
                          onChange={val => setFormData(p => ({ ...p, [f.id]: val }))}
                          onTimestampChange={val => setFormData(p => ({ ...p, audioTimestamp: val }))}
                        />
                      </FieldGroup>
                    );
                  }

                  return (
                    <FieldGroup key={f.id} label={f.label}>
                      <input
                        type={f.type === 'date' ? 'date' : 'text'}
                        className="wim-input"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        placeholder={f.placeholder}
                        value={f.id?.includes('.') ? formData[f.id.split('.')[0]]?.[f.id.split('.')[1]] : formData[f.id] || ''}
                        onChange={e => setFormData(p => {
                          const newD = { ...p };
                          const parts = f.id ? f.id.split('.') : f.id.split('.');
                          if (parts.length === 1) newD[parts[0]] = e.target.value;
                          else {
                            newD[parts[0]] = { ...newD[parts[0]], [parts[1]]: e.target.value };
                          }
                          return newD;
                        })}
                      />
                    </FieldGroup>
                  );
                })}
              </div>
              <div style={{ height: 40 }} />

            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={() => setActiveModalPage(null)} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem', borderRadius: 8 }}>
                Simpan & Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Slide Up Animation Style */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}

export default function EditorPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat...</div>}>
      <EditorPage />
    </Suspense>
  );
}
