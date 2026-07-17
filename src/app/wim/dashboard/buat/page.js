'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const TEMPLATE_CATEGORIES = [
  {
    id: 'floral', name: 'Floral',
    templates: [
      { val: 'template-floral1', name: 'Floral Elegance 1', img: '/images/floral1_preview.png' },
      { val: 'template-floral2', name: 'Floral Elegance 2', img: '/images/floral2_preview.png' }
    ]
  },
  {
    id: 'minimalis', name: 'Minimalis',
    templates: [
      { val: 'template-minimalis1', name: 'Minimalis White', img: '/images/floral1_preview.png' },
      { val: 'template-minimalis2', name: 'Minimalis Dark', img: '/images/floral2_preview.png' }
    ]
  },
  {
    id: 'modern', name: 'Modern',
    templates: [
      { val: 'template-modern1', name: 'Modern Abstract', img: '/images/floral1_preview.png' }
    ]
  }
];

function FieldGroup({ label, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      {label && <label className="wim-label" style={{ marginBottom: 6, fontSize: '0.82rem' }}>{label}</label>}
      {children}
    </div>
  );
}

function BuatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [session, setSession] = useState(null);
  const [slug, setSlug] = useState('');
  const [templateName, setTemplateName] = useState(''); // DIKOSONGKAN SAAT AWAL
  const [clientWa, setClientWa] = useState('');
  const [thumbnailJudul, setThumbnailJudul] = useState('');
  const [thumbnailDeskripsi, setThumbnailDeskripsi] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [useCustomThumbnail, setUseCustomThumbnail] = useState(false);
  const [images, setImages] = useState({ thumbnailFoto: null });
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState('');

  // Modal Catalog State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('floral');

  const allTemplates = TEMPLATE_CATEGORIES.flatMap(c => c.templates);
  const selectedTemplate = allTemplates.find(t => t.val === templateName);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const sStr = localStorage.getItem('wim_session');
    if (!sStr) { router.replace('/wim/login'); return; }
    setSession(JSON.parse(sStr));

    if (editId) {
      const loadEdit = async () => {
        const { data } = await supabase.from('invitations').select('*').eq('slug', editId).single();
        if (data) {
          setSlug(data.slug);
          setTemplateName(data.template_name || data.template || '');
          setClientWa(data.data?.clientWa || '');
          setThumbnailJudul(data.data?.thumbnailJudul || '');
          setThumbnailDeskripsi(data.data?.thumbnailDeskripsi || '');
          if (data.data?.thumbnailFoto) {
            setUseCustomThumbnail(true);
            setExistingThumbnailUrl(data.data.thumbnailFoto);
          }
        }
      };
      loadEdit();
    }
  }, [router, editId]);

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
    if (name === 'thumbnailFoto' && existingThumbnailUrl) return existingThumbnailUrl;
    return null;
  };

  const handleRemoveImage = (name) => {
    if (images[name]) setImages(prev => { const newImgs = { ...prev }; delete newImgs[name]; return newImgs; });
    if (name === 'thumbnailFoto') setExistingThumbnailUrl('');
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

  const validateForm = () => {
    const errs = {};
    if (!slug.trim()) errs.slug = 'Slug wajib diisi';
    else if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = 'Hanya huruf kecil, angka, dan strip (-) diperbolehkan';
    
    if (!templateName) errs.templateName = 'Anda harus memilih tema terlebih dahulu';
    
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.templateName) showToast(errs.templateName, 'error');
      else showToast('Mohon lengkapi data wajib', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    showToast('Memverifikasi data...', 'info');

    const slugStr = slug.toLowerCase().replace(/\s+/g, '-');

    if (!editId || editId !== slugStr) {
      const { data: existingData } = await supabase
        .from('invitations')
        .select('slug')
        .eq('slug', slugStr)
        .maybeSingle();

      if (existingData) {
        setErrors(prev => ({ ...prev, slug: 'Slug ini sudah dipakai, silakan gunakan yang lain.' }));
        showToast('Slug sudah terpakai oleh pengguna lain', 'error');
        setIsLoading(false);
        return;
      }
    }

    let uploadedUrls = {};
    if (useCustomThumbnail && images.thumbnailFoto) {
      uploadedUrls.thumbnailFoto = await uploadImageToSupabase(images.thumbnailFoto, slugStr, 'thumbnail');
    } else if (useCustomThumbnail && existingThumbnailUrl) {
      uploadedUrls.thumbnailFoto = existingThumbnailUrl;
    }

    // Ambil data lama agar tidak terhapus jika sedang edit
    let oldData = {};
    if (editId) {
      const { data: currentDb } = await supabase.from('invitations').select('data').eq('slug', slugStr).single();
      if (currentDb && currentDb.data) {
        oldData = currentDb.data;
      }
    }
    
    const payload = {
      slug: slugStr,
      template_name: templateName,
      data: { 
        ...oldData, // Preserve existing editor data
        clientWa, 
        template: templateName,
        thumbnailJudul,
        thumbnailDeskripsi,
        thumbnailFoto: useCustomThumbnail ? uploadedUrls.thumbnailFoto : null,
        resellerEmail: session?.email
      }
    };

    const { error } = await supabase.from('invitations').upsert(payload, { onConflict: 'slug' });

    setIsLoading(false);
    if (error) {
      showToast(`Gagal: ${error.message}`, 'error');
    } else {
      showToast('Tersimpan! Mengalihkan ke editor...', 'success');
      setTimeout(() => router.push(`/wim/dashboard/buat/editor?slug=${slugStr}`), 1200);
    }
  };

  if (!session) return null;

  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '16px 24px', minHeight: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/wim/dashboard')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Kembali
        </button>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', margin: 0 }}>
            Pengaturan Awal Undangan
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Lengkapi data dasar sebelum mendesain undangan</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '24px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          
          <FieldGroup label="Tema Undangan *">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div 
                onClick={() => setIsTemplateModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', 
                  background: errors.templateName ? '#fef2f2' : 'var(--bg-card)', 
                  border: `1px solid ${errors.templateName ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 8, cursor: 'pointer', transition: '0.2s'
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedTemplate ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {selectedTemplate ? selectedTemplate.name : 'Pilih Tema...'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" color="var(--text-muted)"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              {selectedTemplate && (
                <img 
                  src={selectedTemplate.img} 
                  alt="cover" 
                  style={{ width: 28, height: 38, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} 
                />
              )}
            </div>
            {errors.templateName && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>{errors.templateName}</span>}
          </FieldGroup>

          <FieldGroup label="Slug Link *">
            <div className="wim-input" style={{ display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden', border: errors.slug ? '1px solid var(--danger)' : undefined }}>
              <span style={{ padding: '8px 2px 8px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'inherit', userSelect: 'none' }}>
                storykami.my.id/
              </span>
              <input
                style={{ flex: 1, padding: '8px 12px 8px 0', fontSize: '0.85rem', fontFamily: 'inherit', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%' }}
                placeholder="budi-sari"
                value={slug}
                onChange={e => {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  if (errors.slug) setErrors(p => ({ ...p, slug: null }));
                }}
              />
            </div>
            {errors.slug && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>{errors.slug}</span>}
          </FieldGroup>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <input 
                type="checkbox" 
                checked={useCustomThumbnail} 
                onChange={(e) => setUseCustomThumbnail(e.target.checked)} 
                style={{ width: 14, height: 14, accentColor: 'var(--accent)' }}
              />
              Atur Thumbnail Khusus Saat Di-Share
            </label>
            {useCustomThumbnail && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {getPreviewUrl('thumbnailFoto') ? (
                      <>
                        <img src={getPreviewUrl('thumbnailFoto')} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => handleRemoveImage('thumbnailFoto')} style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 10 }}>&times;</button>
                      </>
                    ) : (
                      <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</span>
                    )}
                    {!getPreviewUrl('thumbnailFoto') && <input type="file" accept="image/*" name="thumbnailFoto" onChange={handleImageChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Akan otomatis dikompres<br/>(Optimal: ~250KB)
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FieldGroup label="Judul Thumbnail">
                    <input 
                      className="wim-input" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }} 
                      placeholder="The Wedding of..." 
                      value={thumbnailJudul} 
                      onChange={e => setThumbnailJudul(e.target.value)} 
                    />
                  </FieldGroup>
                  <FieldGroup label="Deskripsi Thumbnail">
                    <input 
                      className="wim-input" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }} 
                      placeholder="Hadiri Pernikahan..." 
                      value={thumbnailDeskripsi} 
                      onChange={e => setThumbnailDeskripsi(e.target.value)} 
                    />
                  </FieldGroup>
                </div>
              </div>
            )}
          </div>

          <FieldGroup label="No. WhatsApp Klien">
            <input 
              className="wim-input" 
              style={{ padding: '8px 12px', fontSize: '0.85rem' }} 
              placeholder="628123456789" 
              value={clientWa} 
              onChange={e => setClientWa(e.target.value)} 
            />
          </FieldGroup>

        </div>
      </div>

      {/* Action */}
      <button onClick={handleSubmit} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: 8, marginTop: 24 }}>
        {isLoading ? (
          <><div className="spinner" style={{ width: 16, height: 16 }} /> Mempersiapkan...</>
        ) : (
          <>Lanjutkan ke Editor <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></>
        )}
      </button>

      {/* Modal Katalog Tema */}
      {isTemplateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 0 }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '100vw', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', animation: 'slideUp 0.3s ease-out' }}>
            
            <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', fontWeight: 800 }}>Katalog Tema Undangan</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 4 }}>Pilih kategori dan temukan desain yang paling cocok untuk kerjamu</p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} style={{ background: 'var(--bg-secondary)', border: 'none', fontSize: '1.8rem', cursor: 'pointer', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', transition: '0.2s' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', gap: 12, padding: '16px 24px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0, background: 'var(--bg-card)', scrollbarWidth: 'none' }}>
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '8px 20px', borderRadius: 24, border: 'none', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s',
                    background: activeCategory === cat.id ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: activeCategory === cat.id ? 'var(--bg-card)' : 'var(--text-secondary)'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24, alignContent: 'start' }}>
              {TEMPLATE_CATEGORIES.find(c => c.id === activeCategory)?.templates.map(t => (
                <div 
                  key={t.val}
                  onClick={() => {
                    setTemplateName(t.val);
                    setIsTemplateModalOpen(false);
                    if (errors.templateName) setErrors(p => ({ ...p, templateName: null }));
                  }}
                  style={{
                    cursor: 'pointer', borderRadius: 16, border: `2px solid ${templateName === t.val ? 'var(--text-primary)' : 'transparent'}`, padding: 8,
                    background: templateName === t.val ? 'var(--bg-card)' : 'transparent', transition: '0.2s',
                    boxShadow: templateName === t.val ? '0 8px 20px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '9/16', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 12, position: 'relative' }}>
                    <img src={t.img} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {templateName === t.val && (
                      <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--text-primary)', color: 'var(--bg-card)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)' }}>{t.name}</div>
                </div>
              ))}
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

export default function BuatPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat...</div>}>
      <BuatPage />
    </Suspense>
  );
}
