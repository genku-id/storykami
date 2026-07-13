'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import styles from './wim.module.css';

const INITIAL_FORM_DATA = {
  // Saklar (Toggles)
  show_hal1: true,
  show_hal2: true,
  show_hal3: true,
  show_hal4: true,
  show_hal5: true,
  show_hal6: true,
  show_hal7: true,
  show_hal8: true,
  show_hal9: true,

  // Halaman 1
  hal1_namaPasangan: '',
  hal1_youtubeLink: '',
  // Halaman 2
  hal2_tanggalAcara: '',
  // Halaman 3
  hal3_kataPengantar: "Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nMaha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu menyertai pernikahan putra-putri kami:",
  hal3_namaWanita: '',
  hal3_ortuWanita: '',
  hal3_igWanita: '',
  hal3_namaPria: '',
  hal3_ortuPria: '',
  hal3_igPria: '',
  // Halaman 4
  hal4_deskripsi: "وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً ۗاِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ\n\nDan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berfikir.\n(QS. Ar-Rum: 21)",
  // Halaman 5 (Acara Array)
  hal5_acara: [{ nama: 'Akad Nikah', tanggal: '', jam_mulai: '', jam_selesai: '', alamat: '', maps: '' }],
  // Halaman 6 (Cerita Array)
  hal6_cerita: [{ judul: 'Awal Pertemuan', tanggal: '', deskripsi: '' }],
  // Halaman 7 (Hadiah/Bank)
  hal7_bank: [{ namaBank: 'BCA', rekening: '', atasNama: '', wa: '' }],
  hal7_alamatKado: '',
  hal7_waKado: '',
  // Halaman 8
  hal8_deskripsi: "Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.",
  hal8_footer: "StoryKami",

  // Thumbnail
  thumbnailJudul: '',
  thumbnailDeskripsi: '',
  thumbnailFoto: null,
};

export default function WIMDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  const [activeTab, setActiveTab] = useState('list');
  const [activeModal, setActiveModal] = useState(null); // Tambahkan state untuk modal
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [invitations, setInvitations] = useState([]);
  
  const [slug, setSlug] = useState('');
  const [templateName, setTemplateName] = useState('template-floral1');
  const [clientWa, setClientWa] = useState('');
  
  // ================= STATE ADMIN SETTINGS =================
  const [adminSettings, setAdminSettings] = useState({
    adminName: '',
    adminWa: '',
    waTemplate: 'Halo! Berikut adalah link undangan digital pernikahan kalian yang sudah siap:\n\n[LINK]\n\nTerima kasih telah mempercayakan StoryKami, [NAMA_ADMIN]!'
  });
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) loadInvitations();
  }, [isAuthenticated]);

  const saveAdminSettings = async () => {
    setStatusMsg('Menyimpan pengaturan admin...');
    const payload = {
      slug: '_wim_admin_settings',
      template_name: 'settings',
      data: adminSettings
    };
    const { error } = await supabase.from('invitations').upsert(payload, { onConflict: 'slug' });
    
    if (error) {
      alert(`Gagal menyimpan: ${error.message}`);
      setStatusMsg('');
    } else {
      localStorage.setItem('wim_admin_settings', JSON.stringify(adminSettings));
      setIsEditingAdmin(false);
      setStatusMsg('Pengaturan admin berhasil disimpan!');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };
  
  // ================= STATE FORM 8 HALAMAN =================
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [images, setImages] = useState({
    hal2_fotoCouple: null,
    hal3_fotoWanita: null,
    hal3_fotoPria: null,
  });

  const loadInvitations = async () => {
    const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
    if (data) {
      const adminData = data.find(inv => inv.slug === '_wim_admin_settings');
      if (adminData && adminData.data) {
        setAdminSettings(prev => ({ ...prev, ...adminData.data }));
      } else {
        const savedSettings = localStorage.getItem('wim_admin_settings');
        if (savedSettings) setAdminSettings(JSON.parse(savedSettings));
      }
      setInvitations(data.filter(inv => inv.slug !== '_wim_admin_settings'));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === 'STORYKAMI123') setIsAuthenticated(true);
    else alert('PIN Salah!');
  };

  // Handler Teks Biasa
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Handler Array Dinamis (Acara, Cerita, Bank)
  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName, emptyItem) => {
    setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], emptyItem] }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const formatTime = (val) => {
    if (!val) return '';
    const clean = val.replace(/[^\d:]/g, '');
    if (!clean.includes(':')) {
      if (clean.length === 1) return `0${clean}:00`;
      if (clean.length === 2) return `${clean}:00`;
      if (clean.length === 3) return `${clean.substring(0,2)}:${clean.substring(2)}0`;
      if (clean.length >= 4) return `${clean.substring(0,2)}:${clean.substring(2,4)}`;
    }
    return clean;
  };

  const handleTimeBlur = (i, field, value) => {
    const formatted = formatTime(value);
    handleArrayChange('hal5_acara', i, field, formatted);
  };

  const compressImage = (file, maxSizeKB, maxWidth = 1200) => {
    return new Promise((resolve) => {
      // Allow GIFs to bypass compression to preserve animation
      if (file.type === 'image/gif') {
        resolve(file);
        return;
      }
      
      if (file.size <= maxSizeKB * 1024) {
        resolve(file);
        return;
      }
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
              if (!blob) {
                resolve(file);
                return;
              }
              if (blob.size <= maxSizeKB * 1024 || q <= 0.2) {
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
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
      setStatusMsg('Memproses foto...');
      // 290KB for thumbnail (safe under 300), 800KB for other images to save storage
      const maxSize = name === 'thumbnailFoto' ? 290 : 800;
      const compressedFile = await compressImage(files[0], maxSize);
      setImages(prev => ({ ...prev, [name]: compressedFile }));
      setStatusMsg('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slug) return alert('Slug wajib diisi!');
    setIsLoading(true);
    setStatusMsg('Mengunggah foto...');

    const slugStr = slug.toLowerCase().replace(/\s+/g, '-');
    
    // Auto-replace "dan" with "&" in partner's name
    let finalFormData = { ...formData };
    if (finalFormData.hal1_namaPasangan) {
      finalFormData.hal1_namaPasangan = finalFormData.hal1_namaPasangan.replace(/\s+dan\s+/gi, ' & ');
    }

    // Auto-generate 'jam' string from jam_mulai and jam_selesai for backwards compatibility
    if (finalFormData.hal5_acara) {
      finalFormData.hal5_acara = finalFormData.hal5_acara.map(a => {
        let jamStr = a.jam_mulai || '';
        if (jamStr && a.jam_selesai) {
           jamStr += ` - ${a.jam_selesai}`;
        } else if (jamStr) {
           jamStr += ` - Selesai`;
        }
        return { ...a, jam: jamStr || a.jam };
      });
    }

    let uploadedUrls = {};
    if (images.thumbnailFoto) uploadedUrls.thumbnailFoto = await uploadImageToSupabase(images.thumbnailFoto, slugStr, 'thumbnail');
    if (images.hal2_fotoCouple) uploadedUrls.hal2_fotoCouple = await uploadImageToSupabase(images.hal2_fotoCouple, slugStr, 'couple');
    if (images.hal3_fotoWanita) uploadedUrls.hal3_fotoWanita = await uploadImageToSupabase(images.hal3_fotoWanita, slugStr, 'wanita');
    if (images.hal3_fotoPria) uploadedUrls.hal3_fotoPria = await uploadImageToSupabase(images.hal3_fotoPria, slugStr, 'pria');

    setStatusMsg('Menyimpan data ke database...');

    const payload = {
      slug: slugStr,
      template_name: templateName,
      data: { ...finalFormData, clientWa, ...uploadedUrls }
    };

    const { error } = await supabase.from('invitations').upsert(payload, { onConflict: 'slug' });

    setIsLoading(false);
    if (error) setStatusMsg(`Gagal: ${error.message}`);
    else {
      setStatusMsg(`Sukses! Undangan ${slugStr} berhasil dibuat/diperbarui.`);
      loadInvitations();
    }
  };

  const handleDelete = async (delSlug) => {
    if (confirm(`Yakin ingin menghapus secara menyeluruh (Turbo Delete) undangan ${delSlug}? Ini akan menghapus data form, semua ucapan, dan foto dari server!`)) {
      setStatusMsg('Menghapus data, foto, dan ucapan (Turbo Delete)...');
      
      try {
        let errorMsg = '';
        
        // Cari data undangan untuk mendapatkan URL foto
        const inv = invitations.find(i => i.slug === delSlug);
        if (inv && inv.data) {
          const imgUrls = [
            inv.data.thumbnailFoto,
            inv.data.hal2_fotoCouple,
            inv.data.hal3_fotoWanita,
            inv.data.hal3_fotoPria
          ].filter(Boolean);

          const fileNames = imgUrls.map(url => {
            const parts = url.split('/');
            return parts[parts.length - 1];
          });

          if (fileNames.length > 0) {
            const { error: storageError } = await supabase.storage.from('wim-assets').remove(fileNames);
            if (storageError) {
              errorMsg += `Storage Error: ${storageError.message}. `;
            }
          }
        }

        const { error: guestbookError } = await supabase.from('guestbook').delete().eq('invitation_slug', delSlug);
        if (guestbookError) errorMsg += `Guestbook Error: ${guestbookError.message}. `;

        const { error: invError } = await supabase.from('invitations').delete().eq('slug', delSlug);
        if (invError) errorMsg += `Invitations Error: ${invError.message}. `;

        if (errorMsg) {
          setStatusMsg(`Gagal menghapus sepenuhnya: ${errorMsg}`);
        } else {
          setStatusMsg(`Undangan ${delSlug} berhasil dihapus beserta seluruh asetnya.`);
          setTimeout(() => setStatusMsg(''), 4000);
          loadInvitations();
        }
      } catch (err) {
        setStatusMsg(`Error: ${err.message}`);
      }
    }
  };

  const handleEdit = (inv) => {
    setSlug(inv.slug);
    setTemplateName(inv.template_name || 'template-floral1');
    setClientWa(inv.data.clientWa || '');

    // Migrate hal5_acara 'jam' to 'jam_mulai' and 'jam_selesai' if missing
    let migratedData = { ...inv.data };
    if (migratedData.hal5_acara) {
      migratedData.hal5_acara = migratedData.hal5_acara.map(a => {
        if (a.jam && !a.jam_mulai) {
          const parts = a.jam.split('-').map(s => s.trim());
          return { ...a, jam_mulai: parts[0] || '', jam_selesai: (parts[1] && parts[1].toLowerCase() !== 'selesai') ? parts[1] : '' };
        }
        return a;
      });
    }

    setFormData({ ...INITIAL_FORM_DATA, ...migratedData });
    setImages({
      thumbnailFoto: null,
      hal2_fotoCouple: null,
      hal3_fotoWanita: null,
      hal3_fotoPria: null,
    });
    
    setActiveTab('pengaturan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    setSlug('');
    setTemplateName('template-floral1');
    setClientWa('');
    setFormData(INITIAL_FORM_DATA);
    setImages({
      thumbnailFoto: null,
      hal2_fotoCouple: null,
      hal3_fotoWanita: null,
      hal3_fotoPria: null,
    });
    setActiveTab('pengaturan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ maxWidth: '400px' }}>
          <h2 className={styles.title}>🔒 StoryKami WIM</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Masukkan PIN" value={pin} onChange={e => setPin(e.target.value)} className={styles.input} style={{ width: '100%', marginBottom: '15px' }} />
            <button type="submit" className={styles.button} style={{ width: '100%' }}>Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ alignItems: 'flex-start', paddingTop: '40px', background: '#f0f2f5' }}>
      <div className={styles.card} style={{ maxWidth: '900px', width: '100%', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h1 className={styles.title} style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="StoryKami Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          Wedding Invitation Manager
        </h1>
        
        {activeTab !== 'pengaturan' && (
          <div className={styles.buttonGroup} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
            <button onClick={() => setActiveTab('list')} style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', background: activeTab === 'list' ? '#10b981' : '#f1f5f9', color: activeTab === 'list' ? '#fff' : '#475569', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Daftar Link</span>
            </button>
            <button onClick={() => setActiveTab('dashboard')} style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', background: activeTab === 'dashboard' ? '#8b5cf6' : '#f1f5f9', color: activeTab === 'dashboard' ? '#fff' : '#475569', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Dashboard Admin</span>
            </button>
          </div>
        )}

        {activeTab === 'pengaturan' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button type="button" onClick={() => setActiveTab('list')} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Kembali
            </button>
            <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Form Undangan</h2>
          </div>
        )}

        {statusMsg && (
          <div style={{ padding: '15px', background: statusMsg.includes('Gagal') ? '#fee2e2' : '#dcfce7', color: statusMsg.includes('Gagal') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
            {statusMsg}
          </div>
        )}

        {activeTab === 'pengaturan' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* LINK UNDANGAN (COMPACT) */}
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Slug link</label>
                  <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={styles.input} required placeholder="contoh: romeo-juliet" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Template</label>
                  <select value={templateName} onChange={e => setTemplateName(e.target.value)} className={styles.input}>
                    <option value="template-floral1">Floral Elegance 1</option>
                    <option value="template-floral2">Floral Elegance 2</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>No. WA Klien</label>
                  <input type="text" value={clientWa} onChange={e => setClientWa(e.target.value)} className={styles.input} placeholder="contoh: 6281234567890" />
                </div>
              </div>
              <hr style={{ borderTop: '1px solid #e2e8f0', borderBottom: 'none', margin: '15px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Judul Thumbnail</label>
                  <input type="text" name="thumbnailJudul" value={formData.thumbnailJudul || ''} onChange={handleChange} className={styles.input} placeholder="The Wedding of..." />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Deskripsi Thumbnail</label>
                  <input type="text" name="thumbnailDeskripsi" value={formData.thumbnailDeskripsi || ''} onChange={handleChange} className={styles.input} placeholder="Hadiri Pernikahan..." />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Foto Thumbnail (<small style={{color: '#10b981'}}>Auto &lt; 300KB</small>)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="file" accept="image/*" name="thumbnailFoto" onChange={handleImageChange} className={styles.input} style={{ flex: 1 }} />
                    {getPreviewUrl('thumbnailFoto') && (
                      <div style={{ position: 'relative', width: '50px', height: '35px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <img src={getPreviewUrl('thumbnailFoto')} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => handleRemoveImage('thumbnailFoto')} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', border: 'none', borderRadius: '0 0 0 4px', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', lineHeight: 1 }}>&times;</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <h3 style={{ color: '#0f172a', margin: '10px 0 0 0' }}>Atur Konten Halaman</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              
              {/* Halaman 1 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal1 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal1 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>📖 Hal 1 (Cover)</h4>
                  <input type="checkbox" name="show_hal1" checked={formData.show_hal1} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal1 && (
                  <button type="button" onClick={() => setActiveModal('hal1')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>

              {/* Halaman 2 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal2 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal2 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🌅 Hal 2 (Hero)</h4>
                  <input type="checkbox" name="show_hal2" checked={formData.show_hal2} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal2 && (
                  <button type="button" onClick={() => setActiveModal('hal2')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>

              {/* Halaman 3 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal3 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal3 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>👰 Hal 3 (Mempelai)</h4>
                  <input type="checkbox" name="show_hal3" checked={formData.show_hal3} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal3 && (
                  <button type="button" onClick={() => setActiveModal('hal3')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>

              {/* Halaman 4 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal4 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal4 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>📜 Hal 4 (Kutipan)</h4>
                  <input type="checkbox" name="show_hal4" checked={formData.show_hal4} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal4 && (
                  <button type="button" onClick={() => setActiveModal('hal4')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>

              {/* Halaman 5 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal5 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal5 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>📅 Hal 5 (Acara)</h4>
                  <input type="checkbox" name="show_hal5" checked={formData.show_hal5} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal5 && (
                  <button type="button" onClick={() => setActiveModal('hal5')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>

              {/* Halaman 6 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal6 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal6 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>❤️ Hal 6 (Cerita)</h4>
                  <input type="checkbox" name="show_hal6" checked={formData.show_hal6} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal6 && (
                  <button type="button" onClick={() => setActiveModal('hal6')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>

              {/* Halaman 7 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal7 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal7 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🎁 Hal 7 (Hadiah)</h4>
                  <input type="checkbox" name="show_hal7" checked={formData.show_hal7} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal7 && (
                  <button type="button" onClick={() => setActiveModal('hal7')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>

              {/* Halaman 8 (Ucapan / Guestbook) - Internal = show_hal9 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal9 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal9 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>💬 Hal 8 (Ucapan)</h4>
                  <input type="checkbox" name="show_hal9" checked={formData.show_hal9} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal9 && (
                  <button type="button" onClick={() => setActiveModal('hal8')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Lihat Info</button>
                )}
              </div>

              {/* Halaman 9 (Footer) - Internal = show_hal8 */}
              <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', background: '#f8fafc', opacity: formData.show_hal8 ? 1 : 0.6, transition: '0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.show_hal8 ? '10px' : '0' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>👋 Hal 9 (Footer)</h4>
                  <input type="checkbox" name="show_hal8" checked={formData.show_hal8} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {formData.show_hal8 && (
                  <button type="button" onClick={() => setActiveModal('hal9')} style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Edit Isian</button>
                )}
              </div>
            </div>

            {/* MODAL / POPUP ISIAN */}
            {activeModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                <div style={{ background: '#fff', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', padding: '25px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a' }}>
                      {activeModal === 'hal1' && '📖 Halaman 1 (Cover)'}
                      {activeModal === 'hal2' && '🌅 Halaman 2 (Hero)'}
                      {activeModal === 'hal3' && '👰 Halaman 3 (Profil Mempelai)'}
                      {activeModal === 'hal4' && '📜 Halaman 4 (Kutipan/Deskripsi)'}
                      {activeModal === 'hal5' && '📅 Halaman 5 (Acara)'}
                      {activeModal === 'hal6' && '❤️ Halaman 6 (Cerita/Love Story)'}
                      {activeModal === 'hal7' && '🎁 Halaman 7 (Hadiah/Rekening)'}
                      {activeModal === 'hal8' && '💬 Halaman 8 (Ucapan & RSVP)'}
                      {activeModal === 'hal9' && '👋 Halaman 9 (Footer)'}
                    </h3>
                    <button type="button" onClick={() => setActiveModal(null)} style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                  </div>

                  {/* KONTEN HAL 1 */}
                  {activeModal === 'hal1' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Nama Pasangan (Maks 3 Kata)</label>
                        <input type="text" name="hal1_namaPasangan" value={formData.hal1_namaPasangan} onChange={handleChange} className={styles.input} required placeholder="Romeo & Juliet" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Link Musik (YouTube URL)</label>
                        <input type="url" name="hal1_youtubeLink" value={formData.hal1_youtubeLink} onChange={handleChange} className={styles.input} placeholder="https://www.youtube.com/watch?v=..." />
                      </div>
                    </div>
                  )}

                  {/* KONTEN HAL 2 */}
                  {activeModal === 'hal2' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Tanggal Acara Utama</label>
                        <input type="text" name="hal2_tanggalAcara" value={formData.hal2_tanggalAcara} onChange={handleChange} className={styles.input} placeholder="12 Desember 2026" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Upload Foto Couple (Hero)</label>
                        {getPreviewUrl('hal2_fotoCouple') && (
                          <div style={{ position: 'relative', width: '100px', height: '140px', marginBottom: '10px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <img src={getPreviewUrl('hal2_fotoCouple')} alt="Preview Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => handleRemoveImage('hal2_fotoCouple')} style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: 1 }}>&times;</button>
                          </div>
                        )}
                        <input type="file" accept="image/*" name="hal2_fotoCouple" onChange={handleImageChange} className={styles.input} />
                      </div>
                    </div>
                  )}

                  {/* KONTEN HAL 3 */}
                  {activeModal === 'hal3' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Kata Pengantar</label>
                        <textarea name="hal3_kataPengantar" value={formData.hal3_kataPengantar} onChange={handleChange} className={styles.input} rows="4" />
                      </div>
                      <div className={styles.responsiveGrid} style={{ marginTop: '10px' }}>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '10px' }}>Mempelai Wanita</h4>
                          {getPreviewUrl('hal3_fotoWanita') && (
                            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '10px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e2e8f0', margin: '0 auto 10px auto' }}>
                              <img src={getPreviewUrl('hal3_fotoWanita')} alt="Preview Wanita" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => handleRemoveImage('hal3_fotoWanita')} style={{ position: 'absolute', top: '0px', right: '0px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: 1 }}>&times;</button>
                            </div>
                          )}
                          <input type="file" accept="image/*" name="hal3_fotoWanita" onChange={handleImageChange} className={styles.input} style={{ marginBottom: '10px' }} />
                          <input type="text" name="hal3_namaWanita" value={formData.hal3_namaWanita} onChange={handleChange} className={styles.input} placeholder="Nama Lengkap" style={{ marginBottom: '10px' }} />
                          <textarea name="hal3_ortuWanita" value={formData.hal3_ortuWanita} onChange={handleChange} className={styles.input} placeholder="Contoh: Putri dari Bapak Budi & Ibu Ani" style={{ marginBottom: '10px', height: '60px' }} />
                          <input type="text" name="hal3_igWanita" value={formData.hal3_igWanita} onChange={handleChange} className={styles.input} placeholder="Username IG (Contoh: @juliet)" />
                        </div>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                          <h4 style={{ marginBottom: '10px' }}>Mempelai Pria</h4>
                          {getPreviewUrl('hal3_fotoPria') && (
                            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '10px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e2e8f0', margin: '0 auto 10px auto' }}>
                              <img src={getPreviewUrl('hal3_fotoPria')} alt="Preview Pria" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => handleRemoveImage('hal3_fotoPria')} style={{ position: 'absolute', top: '0px', right: '0px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', lineHeight: 1 }}>&times;</button>
                            </div>
                          )}
                          <input type="file" accept="image/*" name="hal3_fotoPria" onChange={handleImageChange} className={styles.input} style={{ marginBottom: '10px' }} />
                          <input type="text" name="hal3_namaPria" value={formData.hal3_namaPria} onChange={handleChange} className={styles.input} placeholder="Nama Lengkap" style={{ marginBottom: '10px' }} />
                          <textarea name="hal3_ortuPria" value={formData.hal3_ortuPria} onChange={handleChange} className={styles.input} placeholder="Contoh: Putra dari Bapak Joko & Ibu Marni" style={{ marginBottom: '10px', height: '60px' }} />
                          <input type="text" name="hal3_igPria" value={formData.hal3_igPria} onChange={handleChange} className={styles.input} placeholder="Username IG (Contoh: @romeo)" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KONTEN HAL 4 */}
                  {activeModal === 'hal4' && (
                    <div className={styles.formGroup}>
                      <textarea name="hal4_deskripsi" value={formData.hal4_deskripsi} onChange={handleChange} className={styles.input} rows="10" placeholder="Kutipan Ayat Suci atau Quotes..." />
                    </div>
                  )}

                  {/* KONTEN HAL 5 */}
                  {activeModal === 'hal5' && (
                    <div>
                      {formData.hal5_acara.map((acara, i) => (
                        <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                          <h4 style={{ marginBottom: '10px', marginTop: 0 }}>Acara {i + 1}</h4>
                          {i > 0 && <button type="button" onClick={() => removeArrayItem('hal5_acara', i)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Hapus</button>}
                          <div className={styles.responsiveGrid}>
                            <input type="text" value={acara.nama} onChange={e => handleArrayChange('hal5_acara', i, 'nama', e.target.value)} className={styles.input} placeholder="Nama Acara (Akad/Resepsi)" />
                            <input type="text" value={acara.tanggal} onChange={e => handleArrayChange('hal5_acara', i, 'tanggal', e.target.value)} className={styles.input} placeholder="Tanggal" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <input type="text" value={acara.jam_mulai || ''} onChange={e => handleArrayChange('hal5_acara', i, 'jam_mulai', e.target.value)} onBlur={e => handleTimeBlur(i, 'jam_mulai', e.target.value)} className={styles.input} placeholder="Mulai" />
                              <input type="text" value={acara.jam_selesai || ''} onChange={e => handleArrayChange('hal5_acara', i, 'jam_selesai', e.target.value)} onBlur={e => handleTimeBlur(i, 'jam_selesai', e.target.value)} className={styles.input} placeholder="Selesai" />
                            </div>
                            <input type="text" value={acara.alamat} onChange={e => handleArrayChange('hal5_acara', i, 'alamat', e.target.value)} className={styles.input} placeholder="Nama Tempat / Alamat Lengkap" />
                            <input type="url" value={acara.maps} onChange={e => handleArrayChange('hal5_acara', i, 'maps', e.target.value)} className={styles.input} placeholder="Link Google Maps" style={{ gridColumn: '1 / -1' }} />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addArrayItem('hal5_acara', { nama: '', tanggal: '', jam_mulai: '', jam_selesai: '', alamat: '', maps: '' })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>+ Tambah Acara Baru</button>
                    </div>
                  )}

                  {/* KONTEN HAL 6 */}
                  {activeModal === 'hal6' && (
                    <div>
                      {formData.hal6_cerita.map((cerita, i) => (
                        <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                          <h4 style={{ marginBottom: '10px', marginTop: 0 }}>Cerita {i + 1}</h4>
                          <button type="button" onClick={() => removeArrayItem('hal6_cerita', i)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Hapus</button>
                          <input type="text" value={cerita.judul} onChange={e => handleArrayChange('hal6_cerita', i, 'judul', e.target.value)} className={styles.input} placeholder="Judul Cerita (Awal Kenal)" style={{ marginBottom: '10px' }} />
                          <input type="text" value={cerita.tanggal} onChange={e => handleArrayChange('hal6_cerita', i, 'tanggal', e.target.value)} className={styles.input} placeholder="Tanggal/Tahun" style={{ marginBottom: '10px' }} />
                          <textarea value={cerita.deskripsi} onChange={e => handleArrayChange('hal6_cerita', i, 'deskripsi', e.target.value)} className={styles.input} rows="3" placeholder="Deskripsi Cerita..." />
                        </div>
                      ))}
                      <button type="button" onClick={() => addArrayItem('hal6_cerita', { judul: '', tanggal: '', deskripsi: '' })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>+ Tambah Cerita Baru</button>
                    </div>
                  )}

                  {/* KONTEN HAL 7 */}
                  {activeModal === 'hal7' && (
                    <div>
                      <h4 style={{ marginBottom: '10px', color: '#475569', marginTop: 0 }}>Daftar Rekening Bank/E-Wallet</h4>
                      {formData.hal7_bank.map((bank, i) => (
                        <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                          <h4 style={{ marginBottom: '10px', marginTop: 0, fontSize: '14px' }}>Bank {i + 1}</h4>
                          <button type="button" onClick={() => removeArrayItem('hal7_bank', i)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Hapus</button>
                          <div className={styles.responsiveGrid}>
                            <input type="text" value={bank.namaBank} onChange={e => handleArrayChange('hal7_bank', i, 'namaBank', e.target.value)} className={styles.input} placeholder="Nama Bank (BCA / MANDIRI)" />
                            <input type="text" value={bank.rekening} onChange={e => handleArrayChange('hal7_bank', i, 'rekening', e.target.value)} className={styles.input} placeholder="No. Rekening" />
                            <input type="text" value={bank.atasNama} onChange={e => handleArrayChange('hal7_bank', i, 'atasNama', e.target.value)} className={styles.input} placeholder="Atas Nama" />
                            <input type="text" value={bank.wa} onChange={e => handleArrayChange('hal7_bank', i, 'wa', e.target.value)} className={styles.input} placeholder="No WA (Konfirmasi)" />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addArrayItem('hal7_bank', { namaBank: '', rekening: '', atasNama: '', wa: '' })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginBottom: '25px' }}>+ Tambah Bank Baru</button>

                      <h4 style={{ marginBottom: '10px', color: '#475569' }}>Kirim Kado Fisik (Wedding Gift)</h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <textarea name="hal7_alamatKado" value={formData.hal7_alamatKado} onChange={handleChange} className={styles.input} rows="3" placeholder="Alamat Pengiriman Kado Fisik..." />
                        <input type="text" name="hal7_waKado" value={formData.hal7_waKado} onChange={handleChange} className={styles.input} placeholder="No WA Penerima Kado" />
                      </div>
                    </div>
                  )}

                  {/* KONTEN HAL 8 */}
                  {activeModal === 'hal8' && (
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                      <p style={{ color: '#475569', margin: 0, lineHeight: 1.5 }}>
                        Halaman ini akan memuat fitur <b>Buku Tamu (Guestbook)</b> dan <b>Form RSVP</b> secara otomatis.<br/><br/>
                        Tamu undangan dapat menulis ucapan yang akan langsung tampil bergulir secara <i>real-time</i>.<br/><br/>
                        Anda cukup mengatur ceklis "Tampilkan Halaman Ini" di luar (aktif = Ya, nonaktif = Tidak).
                      </p>
                    </div>
                  )}

                  {/* KONTEN HAL 9 */}
                  {activeModal === 'hal9' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Deskripsi Penutup</label>
                        <textarea name="hal8_deskripsi" value={formData.hal8_deskripsi} onChange={handleChange} className={styles.input} rows="4" />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Teks Footer Brand (Watermark)</label>
                        <input type="text" name="hal8_footer" value={formData.hal8_footer} onChange={handleChange} className={styles.input} placeholder="StoryKami" />
                      </div>
                    </div>
                  )}

                  <button type="button" onClick={() => setActiveModal(null)} style={{ width: '100%', marginTop: '25px', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}>
                    ✅ Simpan & Tutup Kotak Isian
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className={styles.button} style={{ width: '100%', marginTop: '10px', padding: '18px', fontSize: '1.2rem', background: '#0f172a', fontWeight: 'bold' }}>
              {isLoading ? 'Sedang Memproses...' : '✨ Generate & Publikasikan ke Supabase'}
            </button>
          </form>
        ) : activeTab === 'list' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#0f172a', margin: 0 }}>Daftar Undangan Klien Aktif</h3>
              <button onClick={handleCreateNew} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Buat Undangan
              </button>
            </div>
            {invitations.length === 0 ? (
              <p style={{ color: '#64748b' }}>Belum ada undangan yang dibuat.</p>
            ) : (
              <div className={styles.tableResponsive} style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px', color: '#475569' }}>Pasangan</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Link</th>
                    <th style={{ padding: '10px', color: '#475569', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{inv.data.hal1_namaPasangan || inv.data.coupleName || '-'}</td>
                      <td style={{ padding: '10px' }}>
                        <a href={`/${inv.slug}`} target="_blank" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                          /{inv.slug}
                        </a>
                      </td>
                      <td style={{ padding: '10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => {
                          const waNum = inv.data.clientWa || '';
                          const rawLink = `https://storykami.my.id/${inv.slug}`;
                          const rawText = adminSettings.waTemplate.replace('[LINK]', rawLink).replace('[NAMA_ADMIN]', adminSettings.adminName || '');
                          const text = encodeURIComponent(rawText);
                          window.open(`https://wa.me/${waNum}?text=${text}`, '_blank');
                        }} style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center' }} title="Kirim WA">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        </button>
                        <button onClick={() => handleEdit(inv)} style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center' }} title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button onClick={() => handleDelete(inv.slug)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center' }} title="Hapus">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'dashboard' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#0f172a', margin: 0 }}>Pengaturan Dashboard & Pesan WA</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {isEditingAdmin ? (
                  <button onClick={saveAdminSettings} style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Simpan">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  </button>
                ) : (
                  <button onClick={() => setIsEditingAdmin(true)} style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Admin</label>
                <input type="text" value={adminSettings.adminName} onChange={e => setAdminSettings({...adminSettings, adminName: e.target.value})} className={styles.input} disabled={!isEditingAdmin} placeholder="contoh: Budi" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>No. WA Admin (Format 62...)</label>
                <input type="text" value={adminSettings.adminWa} onChange={e => setAdminSettings({...adminSettings, adminWa: e.target.value})} className={styles.input} disabled={!isEditingAdmin} placeholder="contoh: 6281234567890" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Pengaturan Kalimat WA</label>
                <textarea rows={6} value={adminSettings.waTemplate} onChange={e => setAdminSettings({...adminSettings, waTemplate: e.target.value})} className={styles.input} disabled={!isEditingAdmin} placeholder="Halo! Berikut link undangan Anda..." />
                <small style={{ color: '#64748b', marginTop: '5px', display: 'block' }}>Gunakan <b>[LINK]</b> untuk menyisipkan link otomatis, dan <b>[NAMA_ADMIN]</b> untuk menyisipkan nama Anda.</small>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
