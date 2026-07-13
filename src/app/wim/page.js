'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import styles from './wim.module.css';

export default function WIMDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  const [activeTab, setActiveTab] = useState('pengaturan');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [invitations, setInvitations] = useState([]);
  
  const [slug, setSlug] = useState('');
  
  // ================= STATE FORM 8 HALAMAN =================
  const [formData, setFormData] = useState({
    // Saklar (Toggles)
    show_hal1: true,
    show_hal2: true,
    show_hal3: true,
    show_hal4: true,
    show_hal5: true,
    show_hal6: true,
    show_hal7: true,
    show_hal8: true,

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
    hal5_acara: [{ nama: 'Akad Nikah', tanggal: '', jam: '', alamat: '', maps: '' }],
    // Halaman 6 (Cerita Array)
    hal6_cerita: [{ judul: 'Awal Pertemuan', tanggal: '', deskripsi: '' }],
    // Halaman 7 (Hadiah/Bank)
    hal7_bank: [{ namaBank: 'BCA', rekening: '', atasNama: '', wa: '' }],
    hal7_alamatKado: '',
    hal7_waKado: '',
    // Halaman 8
    hal8_deskripsi: "Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.",
    hal8_footer: "StoryKami"
  });

  const [images, setImages] = useState({
    hal2_fotoCouple: null,
    hal3_fotoWanita: null,
    hal3_fotoPria: null,
  });

  useEffect(() => {
    if (isAuthenticated) loadInvitations();
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

  const handleImageChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) setImages(prev => ({ ...prev, [name]: files[0] }));
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
    let uploadedUrls = {};
    if (images.hal2_fotoCouple) uploadedUrls.hal2_fotoCouple = await uploadImageToSupabase(images.hal2_fotoCouple, slugStr, 'couple');
    if (images.hal3_fotoWanita) uploadedUrls.hal3_fotoWanita = await uploadImageToSupabase(images.hal3_fotoWanita, slugStr, 'wanita');
    if (images.hal3_fotoPria) uploadedUrls.hal3_fotoPria = await uploadImageToSupabase(images.hal3_fotoPria, slugStr, 'pria');

    setStatusMsg('Menyimpan data ke database...');

    const payload = {
      slug: slugStr,
      template_name: 'template-floral1',
      data: { ...formData, ...uploadedUrls }
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
    if (confirm(`Yakin ingin menghapus undangan ${delSlug}?`)) {
      await supabase.from('invitations').delete().eq('slug', delSlug);
      loadInvitations();
    }
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
        <h1 className={styles.title} style={{ color: '#1e293b' }}>✨ WIM Dashboard (8 Halaman)</h1>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
          <button onClick={() => setActiveTab('pengaturan')} className={styles.button} style={{ flex: 1, background: activeTab === 'pengaturan' ? '#3b82f6' : '#cbd5e1', color: activeTab === 'pengaturan' ? '#fff' : '#475569' }}>⚙️ Pengaturan Undangan</button>
          <button onClick={() => setActiveTab('list')} className={styles.button} style={{ flex: 1, background: activeTab === 'list' ? '#10b981' : '#cbd5e1', color: activeTab === 'list' ? '#fff' : '#475569' }}>📋 Daftar Link Aktif</button>
        </div>

        {statusMsg && (
          <div style={{ padding: '15px', background: statusMsg.includes('Gagal') ? '#fee2e2' : '#dcfce7', color: statusMsg.includes('Gagal') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
            {statusMsg}
          </div>
        )}

        {activeTab === 'pengaturan' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* LINK UNDANGAN */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '15px', color: '#334155' }}>🔗 Link Undangan (Slug)</h3>
              <div className={styles.formGroup}>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={styles.input} required placeholder="contoh: romeo-juliet" />
              </div>
            </div>

            {/* HALAMAN 1 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal1 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>📖 Halaman 1 (Cover)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal1" checked={formData.show_hal1} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Pasangan (Maks 3 Kata)</label>
                <input type="text" name="hal1_namaPasangan" value={formData.hal1_namaPasangan} onChange={handleChange} className={styles.input} required placeholder="Romeo & Juliet" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Link Musik (YouTube URL)</label>
                <input type="url" name="hal1_youtubeLink" value={formData.hal1_youtubeLink} onChange={handleChange} className={styles.input} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
            </div>

            {/* HALAMAN 2 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal2 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>🌅 Halaman 2 (Hero)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal2" checked={formData.show_hal2} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tanggal Acara Utama</label>
                <input type="text" name="hal2_tanggalAcara" value={formData.hal2_tanggalAcara} onChange={handleChange} className={styles.input} placeholder="12 Desember 2026" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload Foto Couple (Hero)</label>
                <input type="file" accept="image/*" name="hal2_fotoCouple" onChange={handleImageChange} className={styles.input} />
              </div>
            </div>

            {/* HALAMAN 3 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal3 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>👰 Halaman 3 (Profil Mempelai)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal3" checked={formData.show_hal3} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Kata Pengantar</label>
                <textarea name="hal3_kataPengantar" value={formData.hal3_kataPengantar} onChange={handleChange} className={styles.input} rows="4" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Mempelai Wanita</h4>
                  <input type="file" accept="image/*" name="hal3_fotoWanita" onChange={handleImageChange} className={styles.input} style={{ marginBottom: '10px' }} />
                  <input type="text" name="hal3_namaWanita" value={formData.hal3_namaWanita} onChange={handleChange} className={styles.input} placeholder="Nama Lengkap" style={{ marginBottom: '10px' }} />
                  <input type="text" name="hal3_ortuWanita" value={formData.hal3_ortuWanita} onChange={handleChange} className={styles.input} placeholder="Nama Orang Tua" style={{ marginBottom: '10px' }} />
                  <input type="text" name="hal3_igWanita" value={formData.hal3_igWanita} onChange={handleChange} className={styles.input} placeholder="Username IG (Contoh: @juliet)" />
                </div>
                
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Mempelai Pria</h4>
                  <input type="file" accept="image/*" name="hal3_fotoPria" onChange={handleImageChange} className={styles.input} style={{ marginBottom: '10px' }} />
                  <input type="text" name="hal3_namaPria" value={formData.hal3_namaPria} onChange={handleChange} className={styles.input} placeholder="Nama Lengkap" style={{ marginBottom: '10px' }} />
                  <input type="text" name="hal3_ortuPria" value={formData.hal3_ortuPria} onChange={handleChange} className={styles.input} placeholder="Nama Orang Tua" style={{ marginBottom: '10px' }} />
                  <input type="text" name="hal3_igPria" value={formData.hal3_igPria} onChange={handleChange} className={styles.input} placeholder="Username IG (Contoh: @romeo)" />
                </div>
              </div>
            </div>

            {/* HALAMAN 4 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal4 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>📜 Halaman 4 (Kutipan/Deskripsi)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal4" checked={formData.show_hal4} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              <div className={styles.formGroup}>
                <textarea name="hal4_deskripsi" value={formData.hal4_deskripsi} onChange={handleChange} className={styles.input} rows="6" placeholder="Kutipan Ayat Suci atau Quotes..." />
              </div>
            </div>

            {/* HALAMAN 5 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal5 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>📅 Halaman 5 (Acara)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal5" checked={formData.show_hal5} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              {formData.hal5_acara.map((acara, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                  <h4 style={{ marginBottom: '10px' }}>Acara {i + 1}</h4>
                  {i > 0 && <button type="button" onClick={() => removeArrayItem('hal5_acara', i)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>Hapus</button>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="text" value={acara.nama} onChange={e => handleArrayChange('hal5_acara', i, 'nama', e.target.value)} className={styles.input} placeholder="Nama Acara (Akad/Resepsi)" />
                    <input type="text" value={acara.tanggal} onChange={e => handleArrayChange('hal5_acara', i, 'tanggal', e.target.value)} className={styles.input} placeholder="Tanggal" />
                    <input type="text" value={acara.jam} onChange={e => handleArrayChange('hal5_acara', i, 'jam', e.target.value)} className={styles.input} placeholder="Jam (08:00 - Selesai)" />
                    <input type="text" value={acara.alamat} onChange={e => handleArrayChange('hal5_acara', i, 'alamat', e.target.value)} className={styles.input} placeholder="Nama Tempat / Alamat Lengkap" />
                    <input type="url" value={acara.maps} onChange={e => handleArrayChange('hal5_acara', i, 'maps', e.target.value)} className={styles.input} placeholder="Link Google Maps" style={{ gridColumn: '1 / -1' }} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('hal5_acara', { nama: '', tanggal: '', jam: '', alamat: '', maps: '' })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>+ Tambah Acara Baru</button>
            </div>

            {/* HALAMAN 6 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal6 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>❤️ Halaman 6 (Cerita/Love Story)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal6" checked={formData.show_hal6} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              {formData.hal6_cerita.map((cerita, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                  <h4 style={{ marginBottom: '10px' }}>Cerita {i + 1}</h4>
                  <button type="button" onClick={() => removeArrayItem('hal6_cerita', i)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>Hapus</button>
                  <input type="text" value={cerita.judul} onChange={e => handleArrayChange('hal6_cerita', i, 'judul', e.target.value)} className={styles.input} placeholder="Judul Cerita (Awal Kenal)" style={{ marginBottom: '10px' }} />
                  <input type="text" value={cerita.tanggal} onChange={e => handleArrayChange('hal6_cerita', i, 'tanggal', e.target.value)} className={styles.input} placeholder="Tanggal/Tahun" style={{ marginBottom: '10px' }} />
                  <textarea value={cerita.deskripsi} onChange={e => handleArrayChange('hal6_cerita', i, 'deskripsi', e.target.value)} className={styles.input} rows="3" placeholder="Deskripsi Cerita..." />
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('hal6_cerita', { judul: '', tanggal: '', deskripsi: '' })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>+ Tambah Cerita Baru</button>
            </div>

            {/* HALAMAN 7 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal7 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>🎁 Halaman 7 (Hadiah/Rekening)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal7" checked={formData.show_hal7} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              
              <h4 style={{ marginBottom: '10px', color: '#475569' }}>Daftar Rekening Bank/E-Wallet</h4>
              {formData.hal7_bank.map((bank, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
                  <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Bank {i + 1}</h4>
                  <button type="button" onClick={() => removeArrayItem('hal7_bank', i)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>Hapus</button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

            {/* HALAMAN 8 */}
            <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', opacity: formData.show_hal8 ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#0f172a', margin: 0 }}>👋 Halaman 8 (Footer)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="show_hal8" checked={formData.show_hal8} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Tampilkan
                </label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Deskripsi Penutup</label>
                <textarea name="hal8_deskripsi" value={formData.hal8_deskripsi} onChange={handleChange} className={styles.input} rows="3" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Teks Footer Brand (Watermark)</label>
                <input type="text" name="hal8_footer" value={formData.hal8_footer} onChange={handleChange} className={styles.input} placeholder="StoryKami" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={styles.button} style={{ width: '100%', marginTop: '10px', padding: '18px', fontSize: '1.2rem', background: '#0f172a', fontWeight: 'bold' }}>
              {isLoading ? 'Sedang Memproses...' : '✨ Generate & Publikasikan ke Supabase'}
            </button>
          </form>
        ) : (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#0f172a' }}>Daftar Undangan Klien Aktif</h3>
            {invitations.length === 0 ? (
              <p style={{ color: '#64748b' }}>Belum ada undangan yang dibuat.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '15px', color: '#475569' }}>Nama Slug</th>
                    <th style={{ padding: '15px', color: '#475569' }}>Pasangan</th>
                    <th style={{ padding: '15px', color: '#475569' }}>Link Aktif</th>
                    <th style={{ padding: '15px', color: '#475569' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px', fontWeight: 600 }}>{inv.slug}</td>
                      <td style={{ padding: '15px' }}>{inv.data.hal1_namaPasangan || inv.data.coupleName || '-'}</td>
                      <td style={{ padding: '15px' }}>
                        <a href={`/${inv.slug}`} target="_blank" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          Buka <span style={{ fontSize: '12px' }}>↗</span>
                        </a>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <button onClick={() => handleDelete(inv.slug)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: '0.2s' }}>Hapus</button>
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
