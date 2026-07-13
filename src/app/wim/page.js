'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import styles from './wim.module.css';

export default function WIMDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  const [invitations, setInvitations] = useState([]);
  
  const [formData, setFormData] = useState({
    slug: '',
    templateName: 'template-floral1',
    coupleName: '',
    weddingDate: '',
    brideName: '',
    brideParents: '',
    groomName: '',
    groomParents: '',
    greetingTitle: '',
    greetingText: '',
    quoteTitle: '',
    quoteText: '',
    showQuote: true,
    showLoveStory: true,
    showGallery: true,
    showGift: true,
  });

  const [images, setImages] = useState({
    heroImage: null,
    brideImage: null,
    groomImage: null,
    quoteImage: null,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadInvitations();
    }
  }, [isAuthenticated]);

  const loadInvitations = async () => {
    const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
    if (data) setInvitations(data);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === 'STORYKAMI123') setIsAuthenticated(true);
    else alert('PIN Salah!');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setImages(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const uploadImageToSupabase = async (file, slug, prefix) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${slug}-${prefix}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('wim-assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('wim-assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg('Mengunggah foto... Mohon tunggu.');

    let uploadedUrls = {};
    
    // Upload images if selected
    if (images.heroImage) uploadedUrls.heroImage = await uploadImageToSupabase(images.heroImage, formData.slug, 'hero');
    if (images.brideImage) uploadedUrls.brideImage = await uploadImageToSupabase(images.brideImage, formData.slug, 'bride');
    if (images.groomImage) uploadedUrls.groomImage = await uploadImageToSupabase(images.groomImage, formData.slug, 'groom');
    if (images.quoteImage) uploadedUrls.quoteImage = await uploadImageToSupabase(images.quoteImage, formData.slug, 'quote');

    setStatusMsg('Menyimpan data ke database...');

    const payload = {
      slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
      template_name: formData.templateName,
      data: {
        ...formData,
        ...uploadedUrls
      }
    };

    // Upsert (Update if exists, Insert if new)
    const { error } = await supabase
      .from('invitations')
      .upsert(payload, { onConflict: 'slug' });

    setIsLoading(false);
    if (error) {
      setStatusMsg(`Gagal: ${error.message}`);
    } else {
      setStatusMsg(`Sukses! Undangan ${payload.slug} berhasil dibuat/diperbarui.`);
      loadInvitations();
    }
  };

  const handleDelete = async (slug) => {
    if (confirm(`Yakin ingin menghapus undangan ${slug}?`)) {
      await supabase.from('invitations').delete().eq('slug', slug);
      loadInvitations();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ maxWidth: '400px' }}>
          <h2 className={styles.title}>🔒 StoryKami WIM</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Masukkan PIN" 
              value={pin} 
              onChange={e => setPin(e.target.value)}
              className={styles.input}
              style={{ width: '100%', marginBottom: '15px' }}
            />
            <button type="submit" className={styles.button} style={{ width: '100%' }}>Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className={styles.card} style={{ maxWidth: '900px', width: '100%' }}>
        <h1 className={styles.title}>✨ StoryKami WIM Dashboard</h1>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          <button onClick={() => setActiveTab('info')} className={styles.button} style={{ background: activeTab === 'info' ? '#2563eb' : '#94a3b8' }}>Info Dasar</button>
          <button onClick={() => setActiveTab('gallery')} className={styles.button} style={{ background: activeTab === 'gallery' ? '#2563eb' : '#94a3b8' }}>Foto</button>
          <button onClick={() => setActiveTab('settings')} className={styles.button} style={{ background: activeTab === 'settings' ? '#2563eb' : '#94a3b8' }}>Pengaturan</button>
          <button onClick={() => setActiveTab('list')} className={styles.button} style={{ background: activeTab === 'list' ? '#10b981' : '#94a3b8' }}>Daftar Klien</button>
        </div>

        {statusMsg && (
          <div style={{ padding: '15px', background: statusMsg.includes('Gagal') ? '#fee2e2' : '#dcfce7', color: statusMsg.includes('Gagal') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '20px' }}>
            {statusMsg}
          </div>
        )}

        {activeTab !== 'list' ? (
          <form onSubmit={handleSubmit}>
            
            {activeTab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Slug (Link Undangan)</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} className={styles.input} required placeholder="romeo-juliet" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Pilih Template</label>
                  <select name="templateName" value={formData.templateName} onChange={handleChange} className={styles.input}>
                    <option value="template-floral1">Floral 1 (Premium)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Panggilan Pasangan (Cover)</label>
                  <input type="text" name="coupleName" value={formData.coupleName} onChange={handleChange} className={styles.input} required placeholder="Romeo & Juliet" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tanggal Acara Utama</label>
                  <input type="text" name="weddingDate" value={formData.weddingDate} onChange={handleChange} className={styles.input} placeholder="12 Desember 2026" />
                </div>
                
                {/* Mempelai Wanita */}
                <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Mempelai Wanita</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nama Lengkap</label>
                    <input type="text" name="brideName" value={formData.brideName} onChange={handleChange} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nama Orang Tua</label>
                    <input type="text" name="brideParents" value={formData.brideParents} onChange={handleChange} className={styles.input} placeholder="Bapak Budi & Ibu Ani" />
                  </div>
                </div>

                {/* Mempelai Pria */}
                <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '15px' }}>Mempelai Pria</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nama Lengkap</label>
                    <input type="text" name="groomName" value={formData.groomName} onChange={handleChange} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nama Orang Tua</label>
                    <input type="text" name="groomParents" value={formData.groomParents} onChange={handleChange} className={styles.input} placeholder="Bapak Joko & Ibu Siti" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Kosongkan jika ingin menggunakan foto bawaan template atau jika tidak ingin mengganti foto yang sudah ada.</p>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Foto Utama (Hero & Kutipan)</label>
                  <input type="file" accept="image/*" name="heroImage" onChange={handleImageChange} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Foto Mempelai Wanita</label>
                  <input type="file" accept="image/*" name="brideImage" onChange={handleImageChange} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Foto Mempelai Pria</label>
                  <input type="file" accept="image/*" name="groomImage" onChange={handleImageChange} className={styles.input} />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" name="showLoveStory" checked={formData.showLoveStory} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                  <label className={styles.label} style={{ margin: 0 }}>Tampilkan Section Love Story</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" name="showQuote" checked={formData.showQuote} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                  <label className={styles.label} style={{ margin: 0 }}>Tampilkan Section Kutipan Ayat</label>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className={styles.button} style={{ width: '100%', marginTop: '30px', padding: '15px', fontSize: '1.1rem' }}>
              {isLoading ? 'Sedang Memproses...' : '✨ Generate & Publikasikan Undangan'}
            </button>
          </form>
        ) : (
          <div>
            <h3 style={{ marginBottom: '15px' }}>Daftar Undangan Klien</h3>
            {invitations.length === 0 ? (
              <p>Belum ada undangan yang dibuat.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Slug</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Pasangan</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Link Aktif</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{inv.slug}</td>
                      <td style={{ padding: '12px' }}>{inv.data.coupleName}</td>
                      <td style={{ padding: '12px' }}>
                        <a href={`/${inv.slug}`} target="_blank" style={{ color: '#2563eb', textDecoration: 'underline' }}>Buka Link</a>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleDelete(inv.slug)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
