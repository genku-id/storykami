'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Suspense } from 'react';

// ==================== INITIAL FORM DATA ====================
const EMPTY_FORM = {
  show_hal1: true, show_hal2: true, show_hal3: true, show_hal4: true,
  show_hal5: true, show_hal6: true, show_hal7: true, show_hal8: true, show_hal9: true,
  hal1_namaPasangan: '',
  hal1_youtubeLink: '',
  hal2_tanggalAcara: '',
  hal3_kataPengantar: "Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nMaha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu menyertai pernikahan putra-putri kami:",
  hal3_namaWanita: '', hal3_ortuWanita: '', hal3_igWanita: '',
  hal3_namaPria: '', hal3_ortuPria: '', hal3_igPria: '',
  hal4_deskripsi: "وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً\n\nDan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri...\n(QS. Ar-Rum: 21)",
  hal5_acara: [{ nama: 'Akad Nikah', tanggal: '', jam_mulai: '', jam_selesai: '', alamat: '', maps: '' }],
  hal6_cerita: [{ judul: 'Awal Pertemuan', tanggal: '', deskripsi: '' }],
  hal7_bank: [{ namaBank: 'BCA', rekening: '', atasNama: '', wa: '' }],
  hal7_alamatKado: '', hal7_waKado: '',
  hal8_deskripsi: "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
  hal8_footer: 'StoryKami',
  thumbnailJudul: '', thumbnailDeskripsi: '',
};

const STEPS = [
  { id: 1, label: 'Setup', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg> },
  { id: 2, label: 'Cover & Hero', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> },
  { id: 3, label: 'Mempelai', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 4, label: 'Kutipan & Acara', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { id: 5, label: 'Cerita & Hadiah', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> },
  { id: 6, label: 'Penutup', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg> },
];

// ==================== HELPER COMPONENTS ====================
function SectionToggle({ label, name, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div
        onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: checked ? 'var(--accent)' : 'var(--border)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    </label>
  );
}

function FieldGroup({ label, children, half }) {
  return (
    <div className="form-group" style={half ? {} : {}}>
      {label && <label className="wim-label">{label}</label>}
      {children}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
function BuatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [session, setSession] = useState(null);
  const [step, setStep] = useState(1);
  const [slug, setSlug] = useState('');
  const [templateName, setTemplateName] = useState('template-floral1');
  const [clientWa, setClientWa] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState({
    thumbnailFoto: null,
    hal2_fotoCouple: null,
    hal3_fotoWanita: null,
    hal3_fotoPria: null,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const sStr = localStorage.getItem('wim_session');
    if (!sStr) { router.replace('/wim/login'); return; }
    setSession(JSON.parse(sStr));

    // Load existing invitation for edit
    if (editId) {
      const loadEdit = async () => {
        const { data } = await supabase.from('invitations').select('*').eq('slug', editId).single();
        if (data) {
          setSlug(data.slug);
          setTemplateName(data.template_name || data.template || 'template-floral1');
          setClientWa(data.data?.clientWa || '');
          setFormData({ ...EMPTY_FORM, ...(data.data || {}) });
        }
      };
      loadEdit();
    }
  }, [router, editId]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleArrayChange = (arr, idx, field, val) => {
    setFormData(prev => {
      const next = [...prev[arr]];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, [arr]: next };
    });
  };

  const addArrayItem = (arr, empty) =>
    setFormData(prev => ({ ...prev, [arr]: [...prev[arr], empty] }));

  const removeArrayItem = (arr, idx) =>
    setFormData(prev => ({ ...prev, [arr]: prev[arr].filter((_, i) => i !== idx) }));

  // Image Upload Logic
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
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg', lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                tryCompress(q - 0.2);
              }
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
      const maxSize = name === 'thumbnailFoto' ? 290 : 800;
      const compressedFile = await compressImage(files[0], maxSize);
      setImages(prev => ({ ...prev, [name]: compressedFile }));
    }
  };

  const getPreviewUrl = (name) => {
    if (images[name]) return URL.createObjectURL(images[name]);
    if (formData[name] && typeof formData[name] === 'string') return formData[name];
    return null;
  };

  const handleRemoveImage = (name) => {
    if (images[name]) {
      setImages(prev => {
        const newImgs = { ...prev };
        delete newImgs[name];
        return newImgs;
      });
    }
    if (formData[name]) {
      setFormData(prev => ({ ...prev, [name]: null }));
    }
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

  // Validate step 1
  const validateStep1 = () => {
    const errs = {};
    if (!slug.trim()) errs.slug = 'Slug wajib diisi';
    else if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = 'Slug hanya boleh huruf kecil, angka, dan tanda -';
    if (!formData.hal1_namaPasangan.trim()) errs.namaPasangan = 'Nama pasangan wajib diisi';
    return errs;
  };

  const handleNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }
    setStep(s => Math.min(STEPS.length, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    showToast('Mengunggah foto dan menyimpan...', 'info');

    const slugStr = slug.toLowerCase().replace(/\s+/g, '-');
    let finalFormData = { ...formData };
    if (finalFormData.hal1_namaPasangan) {
      finalFormData.hal1_namaPasangan = finalFormData.hal1_namaPasangan.replace(/\s+dan\s+/gi, ' & ');
    }
    if (finalFormData.hal5_acara) {
      finalFormData.hal5_acara = finalFormData.hal5_acara.map(a => {
        let jamStr = a.jam_mulai || '';
        if (jamStr && a.jam_selesai) jamStr += ` - ${a.jam_selesai}`;
        else if (jamStr) jamStr += ` - Selesai`;
        return { ...a, jam: jamStr || a.jam };
      });
    }

    let uploadedUrls = {};
    if (images.thumbnailFoto) uploadedUrls.thumbnailFoto = await uploadImageToSupabase(images.thumbnailFoto, slugStr, 'thumbnail');
    if (images.hal2_fotoCouple) uploadedUrls.hal2_fotoCouple = await uploadImageToSupabase(images.hal2_fotoCouple, slugStr, 'couple');
    if (images.hal3_fotoWanita) uploadedUrls.hal3_fotoWanita = await uploadImageToSupabase(images.hal3_fotoWanita, slugStr, 'wanita');
    if (images.hal3_fotoPria) uploadedUrls.hal3_fotoPria = await uploadImageToSupabase(images.hal3_fotoPria, slugStr, 'pria');

    const payload = {
      slug: slugStr,
      template_name: templateName,
      template: templateName,
      data: { 
        ...finalFormData, 
        clientWa, 
        ...uploadedUrls,
        resellerEmail: session?.email // Track ownership
      }
    };

    const { error } = await supabase.from('invitations').upsert(payload, { onConflict: 'slug' });

    setIsLoading(false);
    if (error) {
      showToast(`Gagal: ${error.message}`, 'error');
    } else {
      showToast('Undangan berhasil disimpan!', 'success');
      setTimeout(() => router.push('/wim/dashboard'), 1200);
    }
  };

  if (!session) return null;

  // ==================== IMAGE UPLOAD COMPONENT ====================
  const ImageUploadBox = ({ name, label, preview }) => (
    <div style={{ position: 'relative', width: 120, height: 160, borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-card)' }}>
      {preview ? (
        <>
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={() => handleRemoveImage(name)} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', zIndex: 10 }}>&times;</button>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <div style={{ fontSize: '0.7rem' }}>{label}</div>
        </div>
      )}
      {!preview && <input type="file" accept="image/*" name={name} onChange={handleImageChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />}
    </div>
  );

  // ==================== STEP CONTENT ====================
  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-accent)' }}>
            <svg style={{ flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            Isi informasi dasar undangan ini. Slug adalah bagian URL yang unik untuk setiap undangan.
          </div>
          <div className="form-row">
            <FieldGroup label="Slug Link *">
              <input
                className="wim-input"
                placeholder="contoh: budi-dan-sari"
                value={slug}
                onChange={e => {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  if (errors.slug) setErrors(p => ({ ...p, slug: null }));
                }}
              />
              {errors.slug && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.slug}</span>}
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                URL: storykami.my.id/<strong>{slug || 'slug-kamu'}</strong>
              </span>
            </FieldGroup>
            <FieldGroup label="No. WhatsApp Klien">
              <input className="wim-input" placeholder="628xxx" value={clientWa} onChange={e => setClientWa(e.target.value)} />
            </FieldGroup>
          </div>
          <FieldGroup label="Nama Pasangan *">
            <input
              className="wim-input"
              placeholder="contoh: Budi & Sari"
              name="hal1_namaPasangan"
              value={formData.hal1_namaPasangan}
              onChange={handleChange}
            />
            {errors.namaPasangan && <span style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.namaPasangan}</span>}
          </FieldGroup>
          <FieldGroup label="Template Desain">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ val: 'template-floral1', name: 'Floral Elegance 1' }, { val: 'template-floral2', name: 'Floral Elegance 2' }].map(t => (
                <div
                  key={t.val}
                  onClick={() => setTemplateName(t.val)}
                  style={{
                    padding: '14px 16px',
                    border: `2px solid ${templateName === t.val ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12, cursor: 'pointer',
                    background: templateName === t.val ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                    transition: '0.2s',
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${templateName === t.val ? 'var(--accent)' : 'var(--border)'}`,
                    background: templateName === t.val ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {templateName === t.val && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{t.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </FieldGroup>
          {/* Thumbnail */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14, fontFamily: 'var(--font-outfit)' }}>Info Thumbnail (SEO)</h3>
            <div className="form-row">
              <ImageUploadBox name="thumbnailFoto" label="Upload Thumbnail" preview={getPreviewUrl('thumbnailFoto')} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FieldGroup label="Judul Thumbnail">
                  <input className="wim-input" name="thumbnailJudul" placeholder="The Wedding of..." value={formData.thumbnailJudul} onChange={handleChange} />
                </FieldGroup>
                <FieldGroup label="Deskripsi Thumbnail">
                  <input className="wim-input" name="thumbnailDeskripsi" placeholder="Hadiri Pernikahan..." value={formData.thumbnailDeskripsi} onChange={handleChange} />
                </FieldGroup>
              </div>
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionToggle label="Tampilkan Halaman Cover" name="show_hal1" checked={formData.show_hal1} onChange={handleChange} />
          <SectionToggle label="Tampilkan Halaman Hero (Foto Utama)" name="show_hal2" checked={formData.show_hal2} onChange={handleChange} />
          <hr className="divider" />
          <FieldGroup label="YouTube Link (Backsound)">
            <input className="wim-input" name="hal1_youtubeLink" placeholder="https://youtube.com/watch?v=..." value={formData.hal1_youtubeLink} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Tanggal Acara (untuk countdown)">
            <input type="date" className="wim-input" name="hal2_tanggalAcara" value={formData.hal2_tanggalAcara} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Foto Utama Pasangan (Hero)">
            <ImageUploadBox name="hal2_fotoCouple" label="Upload Foto Pasangan" preview={getPreviewUrl('hal2_fotoCouple')} />
          </FieldGroup>
        </div>
      );

      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionToggle label="Tampilkan Halaman Profil Mempelai" name="show_hal3" checked={formData.show_hal3} onChange={handleChange} />
          <hr className="divider" />
          <FieldGroup label="Kata Pengantar">
            <textarea className="wim-input" name="hal3_kataPengantar" rows={4} value={formData.hal3_kataPengantar} onChange={handleChange} />
          </FieldGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Wanita */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-accent)', marginBottom: 12, fontFamily: 'var(--font-outfit)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 12v9"/><path d="M9 16h6"/></svg> Mempelai Wanita
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ImageUploadBox name="hal3_fotoWanita" label="Foto Wanita" preview={getPreviewUrl('hal3_fotoWanita')} />
                <input className="wim-input" name="hal3_namaWanita" placeholder="Nama Lengkap" value={formData.hal3_namaWanita} onChange={handleChange} />
                <input className="wim-input" name="hal3_ortuWanita" placeholder="Putri ke-... dari Bapak/Ibu..." value={formData.hal3_ortuWanita} onChange={handleChange} />
                <input className="wim-input" name="hal3_igWanita" placeholder="@instagram" value={formData.hal3_igWanita} onChange={handleChange} />
              </div>
            </div>
            {/* Pria */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-accent)', marginBottom: 12, fontFamily: 'var(--font-outfit)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="m21 3-6.5 6.5"/><path d="M16 3h5v5"/></svg> Mempelai Pria
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ImageUploadBox name="hal3_fotoPria" label="Foto Pria" preview={getPreviewUrl('hal3_fotoPria')} />
                <input className="wim-input" name="hal3_namaPria" placeholder="Nama Lengkap" value={formData.hal3_namaPria} onChange={handleChange} />
                <input className="wim-input" name="hal3_ortuPria" placeholder="Putra ke-... dari Bapak/Ibu..." value={formData.hal3_ortuPria} onChange={handleChange} />
                <input className="wim-input" name="hal3_igPria" placeholder="@instagram" value={formData.hal3_igPria} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionToggle label="Tampilkan Kutipan Al-Qur'an" name="show_hal4" checked={formData.show_hal4} onChange={handleChange} />
          <SectionToggle label="Tampilkan Halaman Acara" name="show_hal5" checked={formData.show_hal5} onChange={handleChange} />
          <hr className="divider" />
          <FieldGroup label="Kutipan / Deskripsi">
            <textarea className="wim-input" name="hal4_deskripsi" rows={5} value={formData.hal4_deskripsi} onChange={handleChange} />
          </FieldGroup>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label className="wim-label" style={{ margin: 0 }}>Daftar Acara</label>
              <button
                type="button" onClick={() => addArrayItem('hal5_acara', { nama: '', tanggal: '', jam_mulai: '', jam_selesai: '', alamat: '', maps: '' })}
                className="btn btn-sm btn-secondary"
              >
                + Tambah Acara
              </button>
            </div>
            {formData.hal5_acara.map((acara, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12, position: 'relative' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>Acara {i + 1}</div>
                {i > 0 && (
                  <button type="button" onClick={() => removeArrayItem('hal5_acara', i)} style={{
                    position: 'absolute', top: 12, right: 12, background: 'var(--danger-bg)', color: 'var(--danger)',
                    border: '1px solid var(--danger-border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer',
                  }}>Hapus</button>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="form-row">
                    <input className="wim-input" placeholder="Nama Acara" value={acara.nama} onChange={e => handleArrayChange('hal5_acara', i, 'nama', e.target.value)} />
                    <input type="date" className="wim-input" value={acara.tanggal} onChange={e => handleArrayChange('hal5_acara', i, 'tanggal', e.target.value)} />
                  </div>
                  <div className="form-row">
                    <input className="wim-input" placeholder="Jam Mulai (09:00)" value={acara.jam_mulai || ''} onChange={e => handleArrayChange('hal5_acara', i, 'jam_mulai', e.target.value)} />
                    <input className="wim-input" placeholder="Jam Selesai (11:00)" value={acara.jam_selesai || ''} onChange={e => handleArrayChange('hal5_acara', i, 'jam_selesai', e.target.value)} />
                  </div>
                  <input className="wim-input" placeholder="Nama Tempat / Alamat" value={acara.alamat} onChange={e => handleArrayChange('hal5_acara', i, 'alamat', e.target.value)} />
                  <input type="url" className="wim-input" placeholder="Link Google Maps" value={acara.maps} onChange={e => handleArrayChange('hal5_acara', i, 'maps', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case 5: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionToggle label="Tampilkan Halaman Cerita" name="show_hal6" checked={formData.show_hal6} onChange={handleChange} />
          <SectionToggle label="Tampilkan Halaman Hadiah" name="show_hal7" checked={formData.show_hal7} onChange={handleChange} />
          <hr className="divider" />
          {/* Cerita */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label className="wim-label" style={{ margin: 0 }}>Cerita Cinta</label>
              <button type="button" onClick={() => addArrayItem('hal6_cerita', { judul: '', tanggal: '', deskripsi: '' })} className="btn btn-sm btn-secondary">
                + Tambah Cerita
              </button>
            </div>
            {formData.hal6_cerita.map((cerita, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12, position: 'relative' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>Cerita {i + 1}</div>
                {i > 0 && (
                  <button type="button" onClick={() => removeArrayItem('hal6_cerita', i)} style={{
                    position: 'absolute', top: 12, right: 12, background: 'var(--danger-bg)', color: 'var(--danger)',
                    border: '1px solid var(--danger-border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer',
                  }}>Hapus</button>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="form-row">
                    <input className="wim-input" placeholder="Judul Cerita" value={cerita.judul} onChange={e => handleArrayChange('hal6_cerita', i, 'judul', e.target.value)} />
                    <input className="wim-input" placeholder="Tanggal / Tahun" value={cerita.tanggal} onChange={e => handleArrayChange('hal6_cerita', i, 'tanggal', e.target.value)} />
                  </div>
                  <textarea className="wim-input" rows={2} placeholder="Deskripsi cerita..." value={cerita.deskripsi} onChange={e => handleArrayChange('hal6_cerita', i, 'deskripsi', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          {/* Bank */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label className="wim-label" style={{ margin: 0 }}>Rekening / E-Wallet</label>
              <button type="button" onClick={() => addArrayItem('hal7_bank', { namaBank: 'BCA', rekening: '', atasNama: '', wa: '' })} className="btn btn-sm btn-secondary">
                + Tambah Bank
              </button>
            </div>
            {formData.hal7_bank.map((bank, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12, position: 'relative' }}>
                {i > 0 && (
                  <button type="button" onClick={() => removeArrayItem('hal7_bank', i)} style={{
                    position: 'absolute', top: 12, right: 12, background: 'var(--danger-bg)', color: 'var(--danger)',
                    border: '1px solid var(--danger-border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer',
                  }}>Hapus</button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select className="wim-input" value={bank.namaBank} onChange={e => handleArrayChange('hal7_bank', i, 'namaBank', e.target.value)}>
                    {['BCA','Mandiri','BNI','BRI','BSI','GOPAY','OVO','DANA','SHOPEEPAY'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input className="wim-input" placeholder="No. Rekening" value={bank.rekening} onChange={e => handleArrayChange('hal7_bank', i, 'rekening', e.target.value)} />
                  <input className="wim-input" placeholder="Atas Nama" value={bank.atasNama} onChange={e => handleArrayChange('hal7_bank', i, 'atasNama', e.target.value)} />
                  <input className="wim-input" placeholder="No WA Konfirmasi" value={bank.wa} onChange={e => handleArrayChange('hal7_bank', i, 'wa', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <div className="form-row">
            <FieldGroup label="Alamat Kirim Kado Fisik">
              <textarea className="wim-input" name="hal7_alamatKado" rows={2} placeholder="Alamat pengiriman kado..." value={formData.hal7_alamatKado} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup label="WA Penerima Kado">
              <input className="wim-input" name="hal7_waKado" placeholder="628xxx" value={formData.hal7_waKado} onChange={handleChange} />
            </FieldGroup>
          </div>
        </div>
      );

      case 6: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionToggle label="Tampilkan Halaman Ucapan (Guestbook)" name="show_hal9" checked={formData.show_hal9} onChange={handleChange} />
          <SectionToggle label="Tampilkan Halaman Penutup" name="show_hal8" checked={formData.show_hal8} onChange={handleChange} />
          <hr className="divider" />
          <FieldGroup label="Teks Penutup / Pesan Undangan">
            <textarea className="wim-input" name="hal8_deskripsi" rows={4} value={formData.hal8_deskripsi} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Teks Footer / Watermark Brand">
            <input className="wim-input" name="hal8_footer" placeholder="StoryKami" value={formData.hal8_footer} onChange={handleChange} />
          </FieldGroup>

          {/* Ringkasan */}
          <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.9rem', color: 'var(--success)', marginBottom: 14, fontFamily: 'var(--font-outfit)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ringkasan Undangan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.82rem' }}>
              {[
                ['Pasangan', formData.hal1_namaPasangan || '—'],
                ['Slug', slug || '—'],
                ['Template', templateName === 'template-floral1' ? 'Floral Elegance 1' : 'Floral Elegance 2'],
                ['WA Klien', clientWa || '—'],
                ['Jumlah Acara', formData.hal5_acara.length],
                ['Jumlah Cerita', formData.hal6_cerita.length],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 860 }}>
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/wim/dashboard')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', flexShrink: 0, transition: '0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Kembali
        </button>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>
            {editId ? (
              <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> Edit Undangan</>
            ) : (
              <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Buat Undangan Baru</>
            )}
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Langkah {step} dari {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="step-bar" style={{ marginBottom: 28 }}>
        {STEPS.map((s, idx) => (
          <div key={s.id} className="step-item">
            <div
              onClick={() => step > s.id && setStep(s.id)}
              className={`step-circle ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}
              style={{ cursor: step > s.id ? 'pointer' : 'default' }}
              title={s.label}
            >
              {step > s.id ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : s.id}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`step-line ${step > s.id ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step label */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
          {STEPS[step - 1].icon}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>
            {STEPS[step - 1].label}
          </h2>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 24 }}>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="btn btn-secondary"
          style={{ minWidth: 120 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Sebelumnya
        </button>

        {step < STEPS.length ? (
          <button onClick={handleNext} className="btn btn-primary" style={{ minWidth: 140 }}>
            Selanjutnya
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isLoading} className="btn btn-primary" style={{ minWidth: 160 }}>
            {isLoading ? (
              <><div className="spinner" /> Menyimpan...</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> {editId ? 'Simpan Perubahan' : 'Buat Undangan'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BuatPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: 'var(--text-muted)' }}>Memuat...</div>}>
      <BuatPage />
    </Suspense>
  );
}
