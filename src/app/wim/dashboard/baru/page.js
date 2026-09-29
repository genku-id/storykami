'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Floral1Template from '@/components/wim-baru/Floral1Template';
import JawaTemplate from '@/components/wim-baru/JawaTemplate';
import { defaultInvitationData, normalizeAcara } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';
import MusicTimestampPicker from '@/components/wim-baru/MusicTimestampPicker';
import ThumbnailUploader from '@/components/wim-baru/ThumbnailUploader';
import ProfilePhotoUploader from '@/components/wim-baru/ProfilePhotoUploader';
import DateInputField from '@/components/wim-baru/DateInputField';

// --- Komponen Accordion Item ---
function AccordionItem({ title, icon, pageKey, isOpen, onClick, visibility, onToggleVisibility, children, hideToggle = false }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border)' }}>
      <div 
        style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isOpen ? 'var(--bg-primary)' : 'var(--bg-card)', borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
        onClick={onClick}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{icon}</span>}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
          {/* Toggle Switch */}
          {!hideToggle && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{
                width: 36, height: 20, background: visibility ? 'var(--success)' : 'var(--border-hover)', borderRadius: 20, position: 'relative', transition: '0.2s'
              }}>
                <div style={{
                  width: 16, height: 16, background: 'var(--bg-card)', borderRadius: '50%', position: 'absolute', top: 2, left: visibility ? 18 : 2, transition: '0.2s'
                }}/>
              </div>
              <input 
                type="checkbox" 
                checked={visibility} 
                onChange={(e) => onToggleVisibility(pageKey, e.target.checked)}
                style={{ display: 'none' }}
              />
              {visibility ? 'Aktif' : 'Disembunyikan'}
            </label>
          )}
          {/* Chevron */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// --- Helper Input ---
function InputField({ label, value, onChange, type = "text", placeholder = "", options = [], disabled = false }) {
  return (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      <label className="wim-label" style={{ marginBottom: '0.3rem' }}>{label}</label>
      {type === "textarea" ? (
        <textarea 
          value={value} 
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="wim-input"
          style={{ resize: 'vertical' }}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="wim-input"
        >
          {options.map(opt => <option key={opt.val || opt} value={opt.val || opt}>{opt.name || opt}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="wim-input"
        />
      )}
    </div>
  );
}

const TEMPLATE_OPTIONS = [
  { val: 'floral1', name: 'Floral Elegance 1' },
  { val: 'template-daerahJawa', name: 'Jawa Klasik' }
];

function UnifiedEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit'); // Jika ada, berarti mode Edit
  const templateParam = searchParams.get('template');
  
  const [slug, setSlug] = useState('');
  const [templateName, setTemplateName] = useState(templateParam || 'floral1');
  const [data, setData] = useState(defaultInvitationData);
  const [openAccordion, setOpenAccordion] = useState('pengaturan');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading awal

  // Load existing data if edit
  useEffect(() => {
    const loadData = async () => {
      if (editId) {
        const { data: dbData } = await supabase.from('invitations').select('*').eq('slug', editId).single();
        if (dbData) {
          setSlug(dbData.slug);
          setTemplateName(dbData.template_name || dbData.template || 'floral1');
          
          if (dbData.data) {
            setData(prev => ({ 
              ...prev, 
              ...dbData.data,
              acara: normalizeAcara(dbData.data.acara || prev.acara),
              pageVisibility: { ...prev.pageVisibility, ...(dbData.data.pageVisibility || {}) }
            }));
          }
        } else {
          alert('Data tidak ditemukan!');
          router.push('/wim/dashboard');
        }
      } else if (templateParam) {
        setTemplateName(templateParam);
      }
      setIsLoading(false);
    };
    loadData();
  }, [editId, templateParam, router]);

  const handleChange = (path, value) => {
    setData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const acaraList = normalizeAcara(data.acara);

  const handleUpdateAcara = (index, field, value) => {
    const currentList = [...normalizeAcara(data.acara)];
    currentList[index] = {
      ...currentList[index],
      [field]: value
    };
    handleChange('acara', currentList);
  };

  const handleAddAcara = () => {
    const currentList = normalizeAcara(data.acara);
    let defaultName = `Acara #${currentList.length + 1}`;
    if (currentList.length === 2) {
      defaultName = 'Ngunduh Mantu';
    } else if (currentList.length === 0) {
      defaultName = 'Akad Nikah';
    } else if (currentList.length === 1) {
      defaultName = 'Resepsi Pernikahan';
    }

    const newEvent = {
      id: `acara-${Date.now()}`,
      nama: defaultName,
      tanggal: currentList[0]?.tanggal || '22/11/2026',
      waktuMulai: '09:00',
      waktuSelesai: 'Selesai',
      zonaWaktu: currentList[0]?.zonaWaktu || 'WIB',
      lokasi: '',
      alamatLengkap: '',
      linkMap: ''
    };
    handleChange('acara', [...currentList, newEvent]);
  };

  const handleDeleteAcara = (index) => {
    const currentList = normalizeAcara(data.acara);
    if (currentList.length <= 1) {
      alert('Minimal harus ada 1 acara.');
      return;
    }
    const eventName = currentList[index]?.nama || `Acara #${index + 1}`;
    if (confirm(`Apakah Anda yakin ingin menghapus "${eventName}"?`)) {
      const updated = currentList.filter((_, idx) => idx !== index);
      handleChange('acara', updated);
    }
  };

  const handleToggleVisibility = (pageKey, isVisible) => {
    setData(prev => ({
      ...prev,
      pageVisibility: { ...prev.pageVisibility, [pageKey]: isVisible }
    }));
  };
  
  const isVisible = (pageKey) => {
    return data.pageVisibility?.[pageKey] !== false;
  };

  const handleSave = async () => {
    if (!slug || slug.trim() === '') {
      alert("Tautan/Slug tidak boleh kosong!");
      setOpenAccordion('pengaturan');
      return;
    }
    
    // Format slug
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    setIsSaving(true);
    
    // Cek duplikasi jika membuat baru atau mengubah slug
    if (!editId || editId !== cleanSlug) {
      const { data: existingData } = await supabase
        .from('invitations')
        .select('slug')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (existingData) {
        alert('Tautan (Slug) ini sudah dipakai oleh pengguna lain. Silakan ganti dengan yang lain.');
        setSlug(editId || ''); // Kembalikan ke asal jika edit
        setOpenAccordion('pengaturan');
        setIsSaving(false);
        return;
      }
    }

    let resellerEmail = data.resellerEmail;
    if (!resellerEmail && typeof window !== 'undefined') {
      try {
        const sStr = localStorage.getItem('wim_session');
        if (sStr) resellerEmail = JSON.parse(sStr)?.email;
      } catch (e) {}
    }

    const payload = {
      slug: cleanSlug,
      template_name: templateName,
      data: {
        ...data,
        template: templateName,
        resellerEmail: resellerEmail || 'admin@storykami.my.id'
      }
    };

    if (editId) {
      // Update data
      const { error } = await supabase.from('invitations').update(payload).eq('slug', editId);
      if (error) {
        alert("Gagal menyimpan: " + error.message);
      } else {
        router.push('/wim/dashboard');
      }
    } else {
      // Insert baru
      const { error } = await supabase.from('invitations').insert([payload]);
      if (error) {
        alert("Gagal membuat undangan: " + error.message);
      } else {
        router.push('/wim/dashboard');
      }
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>Loading...</div>;
  }

  // Handle Fullscreen Preview
  if (showPreview) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#111', overflowY: 'auto' }}>
        <button 
          onClick={() => setShowPreview(false)}
          style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10000, background: 'var(--bg-card)', color: 'var(--text-primary)', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        >
          Tutup Preview ✕
        </button>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {templateName === 'floral1' ? (
            <Floral1Template data={data} slug={slug || 'preview'} isVisible={isVisible} />
          ) : (
            <JawaTemplate data={data} slug={slug || 'preview'} isVisible={isVisible} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: 'var(--bg-primary)', fontFamily: 'inherit' }}>
      
      {/* Header Editor */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/wim/dashboard" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Kembali
            </a>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
              {editId ? 'Edit Undangan' : 'Buat Undangan Baru'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowPreview(true)}
              className="btn btn-secondary"
            >
              Lihat Preview
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan & Kembali'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem 6rem 1rem' }}>
        
        {/* Accordion 1: Pengaturan Link & Template */}
        <AccordionItem title="1. Pengaturan Dasar" hideToggle={true} pageKey="pengaturan" isOpen={openAccordion === 'pengaturan'} onClick={() => setOpenAccordion(openAccordion === 'pengaturan' ? '' : 'pengaturan')}>
           <InputField label="Tautan Undangan (Slug)" value={slug} onChange={e => setSlug(e.target.value)} placeholder="contoh: budi-dan-sari" />
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>URL akan menjadi: storykami.my.id/<strong>{slug || '...'}</strong></p>
           
           <InputField label="Pilihan Template" type="select" options={TEMPLATE_OPTIONS} value={templateName} onChange={e => setTemplateName(e.target.value)} />
           
           <InputField label="No WhatsApp Klien" value={data.clientWa || ''} onChange={e => handleChange('clientWa', e.target.value)} placeholder="628123456789" />
           
           <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }}></div>
           <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Lagu Latar / Musik Undangan</h3>
           <InputField label="Link Musik (YouTube atau Link MP3)" value={data.musikUrl || ''} onChange={e => handleChange('musikUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=... atau https://...mp3" />
           <MusicTimestampPicker url={data.musikUrl} value={data.musikStart} onChange={val => handleChange('musikStart', val)} />
           
           <h3 style={{ fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Tampilan Thumbnail Link (SEO)</h3>
           <InputField label="Judul Thumbnail" value={data.thumbnailJudul || ''} onChange={e => handleChange('thumbnailJudul', e.target.value)} placeholder="Undangan Pernikahan Budi & Sari" />
           <InputField label="Deskripsi Singkat" type="textarea" value={data.thumbnailDeskripsi || ''} onChange={e => handleChange('thumbnailDeskripsi', e.target.value)} placeholder="Tanpa mengurangi rasa hormat, kami mengundang..." />
           <ThumbnailUploader 
             value={data.thumbnailFoto || ''} 
             onChange={url => handleChange('thumbnailFoto', url)} 
             slug={slug || 'undangan'} 
             title={data.thumbnailJudul} 
             description={data.thumbnailDeskripsi} 
           />
        </AccordionItem>

        {/* Accordion 2: Cover */}
        <AccordionItem title="2. Cover Halaman Depan" pageKey="cover" isOpen={openAccordion === 'cover'} onClick={() => setOpenAccordion(openAccordion === 'cover' ? '' : 'cover')} visibility={isVisible('cover')} onToggleVisibility={handleToggleVisibility}>
          <InputField label="Nama Panggilan Kedua Mempelai" value={data.coverName || ''} onChange={e => handleChange('coverName', e.target.value)} placeholder="Budi & Sari" />
          <InputField label="Inisial Mempelai" value={data.coverInitials || ''} onChange={e => handleChange('coverInitials', e.target.value)} placeholder="BS" />
        </AccordionItem>

        {/* Accordion 3: Profil Mempelai */}
        <AccordionItem title="3. Profil Mempelai" pageKey="profiles" isOpen={openAccordion === 'profiles'} onClick={() => setOpenAccordion(openAccordion === 'profiles' ? '' : 'profiles')} visibility={isVisible('profiles')} onToggleVisibility={handleToggleVisibility}>
           <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Mempelai Wanita</h3>
           <InputField label="Nama Lengkap Wanita" value={data.mempelai.wanita.namaLengkap} onChange={e => handleChange('mempelai.wanita.namaLengkap', e.target.value)} />
           <InputField label="Nama Panggilan Wanita" value={data.mempelai.wanita.namaPanggilan} onChange={e => handleChange('mempelai.wanita.namaPanggilan', e.target.value)} />
           <InputField label="Nama Bapak" value={data.mempelai.wanita.namaAyah} onChange={e => handleChange('mempelai.wanita.namaAyah', e.target.value)} />
           <InputField label="Nama Ibu" value={data.mempelai.wanita.namaIbu} onChange={e => handleChange('mempelai.wanita.namaIbu', e.target.value)} />
           <InputField label="Urutan Anak (contoh: Putri ke-2)" value={data.mempelai.wanita.urutanAnak} onChange={e => handleChange('mempelai.wanita.urutanAnak', e.target.value)} />
           <InputField label="Username Instagram" value={data.mempelai.wanita.instagram} onChange={e => handleChange('mempelai.wanita.instagram', e.target.value)} />
           <ProfilePhotoUploader 
             label="Foto Mempelai Wanita" 
             gender="wanita" 
             value={data.mempelai.wanita.fotoUtama} 
             onChange={url => handleChange('mempelai.wanita.fotoUtama', url)} 
             slug={slug || 'undangan'} 
           />

           <div style={{ height: '1px', background: 'var(--border)', margin: '2rem 0' }}></div>

           <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Mempelai Pria</h3>
           <InputField label="Nama Lengkap Pria" value={data.mempelai.pria.namaLengkap} onChange={e => handleChange('mempelai.pria.namaLengkap', e.target.value)} />
           <InputField label="Nama Panggilan Pria" value={data.mempelai.pria.namaPanggilan} onChange={e => handleChange('mempelai.pria.namaPanggilan', e.target.value)} />
           <InputField label="Nama Bapak" value={data.mempelai.pria.namaAyah} onChange={e => handleChange('mempelai.pria.namaAyah', e.target.value)} />
           <InputField label="Nama Ibu" value={data.mempelai.pria.namaIbu} onChange={e => handleChange('mempelai.pria.namaIbu', e.target.value)} />
           <InputField label="Urutan Anak (contoh: Putra sulung)" value={data.mempelai.pria.urutanAnak} onChange={e => handleChange('mempelai.pria.urutanAnak', e.target.value)} />
           <InputField label="Username Instagram" value={data.mempelai.pria.instagram} onChange={e => handleChange('mempelai.pria.instagram', e.target.value)} />
           <ProfilePhotoUploader 
             label="Foto Mempelai Pria" 
             gender="pria" 
             value={data.mempelai.pria.fotoUtama} 
             onChange={url => handleChange('mempelai.pria.fotoUtama', url)} 
             slug={slug || 'undangan'} 
           />
        </AccordionItem>

        {/* Accordion 4: Jadwal Acara */}
        <AccordionItem title="4. Jadwal Acara" pageKey="events" isOpen={openAccordion === 'events'} onClick={() => setOpenAccordion(openAccordion === 'events' ? '' : 'events')} visibility={isVisible('events')} onToggleVisibility={handleToggleVisibility}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {acaraList.map((item, index) => (
              <div key={item.id || index} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {index + 1}
                    </span>
                    <span>{item.nama || `Acara #${index + 1}`}</span>
                  </h4>
                  {acaraList.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleDeleteAcara(index)} 
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Hapus Acara
                    </button>
                  )}
                </div>

                <InputField 
                  label="Nama Acara" 
                  value={item.nama || ''} 
                  onChange={e => handleUpdateAcara(index, 'nama', e.target.value)} 
                  placeholder="contoh: Akad Nikah / Resepsi Pernikahan / Ngunduh Mantu" 
                />

                <DateInputField 
                  label="Tanggal Acara (DD/MM/YYYY)" 
                  value={item.tanggal || ''} 
                  onChange={val => handleUpdateAcara(index, 'tanggal', val)} 
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <InputField 
                    label="Waktu Mulai" 
                    type="time" 
                    value={item.waktuMulai || ''} 
                    onChange={e => handleUpdateAcara(index, 'waktuMulai', e.target.value)} 
                  />
                  <InputField 
                    label="Waktu Selesai" 
                    type="text" 
                    placeholder="Selesai / 14:00" 
                    value={item.waktuSelesai || ''} 
                    onChange={e => handleUpdateAcara(index, 'waktuSelesai', e.target.value)} 
                  />
                  <InputField 
                    label="Zona Waktu" 
                    type="select" 
                    options={["WIB", "WITA", "WIT"]} 
                    value={item.zonaWaktu || 'WIB'} 
                    onChange={e => handleUpdateAcara(index, 'zonaWaktu', e.target.value)} 
                  />
                </div>

                <InputField 
                  label="Lokasi / Tempat Acara" 
                  value={item.lokasi || ''} 
                  onChange={e => handleUpdateAcara(index, 'lokasi', e.target.value)} 
                  placeholder="contoh: Gedung Serbaguna / Masjid Agung / Kediaman Mempelai" 
                />

                <InputField 
                  label="Alamat Lengkap" 
                  type="textarea" 
                  value={item.alamatLengkap || ''} 
                  onChange={e => handleUpdateAcara(index, 'alamatLengkap', e.target.value)} 
                  placeholder="Jl. Merdeka No. 1, Jakarta Pusat" 
                />

                <InputField 
                  label="Link Google Maps" 
                  type="url" 
                  value={item.linkMap || ''} 
                  onChange={e => handleUpdateAcara(index, 'linkMap', e.target.value)} 
                  placeholder="https://maps.app.goo.gl/..." 
                />
              </div>
            ))}

            <button 
              type="button"
              onClick={handleAddAcara} 
              style={{ width: '100%', padding: '0.85rem', background: 'var(--border)', border: '1px dashed var(--border-hover)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              + Tambah Acara (Misal: Ngunduh Mantu, dsb)
            </button>
          </div>
        </AccordionItem>

        {/* Accordion 5: Love Story */}
        <AccordionItem title="5. Love Story" pageKey="loveStory" isOpen={openAccordion === 'loveStory'} onClick={() => setOpenAccordion(openAccordion === 'loveStory' ? '' : 'loveStory')} visibility={isVisible('loveStory')} onToggleVisibility={handleToggleVisibility}>
          {data.ceritaCinta?.map((cerita, index) => (
            <div key={index} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1rem', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Cerita #{index + 1}</h4>
                <button 
                  onClick={() => {
                    const newCerita = [...data.ceritaCinta];
                    newCerita.splice(index, 1);
                    handleChange('ceritaCinta', newCerita);
                  }} 
                  style={{ background: '#ef4444', color: 'var(--bg-card)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
                >Hapus</button>
              </div>
              <InputField label="Judul Cerita" value={cerita.judul} onChange={e => {
                const newCerita = [...data.ceritaCinta];
                newCerita[index].judul = e.target.value;
                handleChange('ceritaCinta', newCerita);
              }} />
              <InputField label="Tanggal / Tahun" value={cerita.tanggal} onChange={e => {
                const newCerita = [...data.ceritaCinta];
                newCerita[index].tanggal = e.target.value;
                handleChange('ceritaCinta', newCerita);
              }} />
              <InputField label="Isi Cerita" type="textarea" value={cerita.cerita} onChange={e => {
                const newCerita = [...data.ceritaCinta];
                newCerita[index].cerita = e.target.value;
                handleChange('ceritaCinta', newCerita);
              }} />
            </div>
          ))}
          <button 
            onClick={() => {
              handleChange('ceritaCinta', [...(data.ceritaCinta || []), { judul: '', tanggal: '', cerita: '' }]);
            }} 
            style={{ width: '100%', padding: '0.75rem', background: 'var(--border)', border: '1px dashed var(--border-hover)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
          >
            + Tambah Cerita
          </button>
        </AccordionItem>

        {/* Accordion 6: Wedding Gift */}
        <AccordionItem title="6. Wedding Gift" pageKey="gift" isOpen={openAccordion === 'gift'} onClick={() => setOpenAccordion(openAccordion === 'gift' ? '' : 'gift')} visibility={isVisible('gift')} onToggleVisibility={handleToggleVisibility}>
           <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Daftar Rekening / E-Wallet</h3>
           {data.hadiahDigital?.accounts?.map((acc, idx) => (
             <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1rem', background: 'var(--bg-primary)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                 <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Rekening #{idx + 1}</h4>
                 <button 
                  onClick={() => {
                    const newAcc = [...data.hadiahDigital.accounts];
                    newAcc.splice(idx, 1);
                    handleChange('hadiahDigital.accounts', newAcc);
                  }} 
                  style={{ background: '#ef4444', color: 'var(--bg-card)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
                 >Hapus</button>
               </div>
               <InputField label="Nama Bank / E-Wallet" type="select" options={["BCA", "Mandiri", "BNI", "BRI", "BSI", "CIMB", "Jago", "Jenius", "SeaBank", "Blu", "GoPay", "OVO", "Dana", "ShopeePay", "LinkAja"]} value={acc.name} onChange={e => {
                  const newAcc = [...data.hadiahDigital.accounts];
                  newAcc[idx].name = e.target.value;
                  handleChange('hadiahDigital.accounts', newAcc);
               }} />
               <InputField label="Nomor Rekening / HP" value={acc.number} onChange={e => {
                  const newAcc = [...data.hadiahDigital.accounts];
                  newAcc[idx].number = e.target.value;
                  handleChange('hadiahDigital.accounts', newAcc);
               }} />
               <InputField label="Atas Nama" value={acc.owner} onChange={e => {
                  const newAcc = [...data.hadiahDigital.accounts];
                  newAcc[idx].owner = e.target.value;
                  handleChange('hadiahDigital.accounts', newAcc);
               }} />
               <InputField label="No. WhatsApp Konfirmasi Pemilik (Opsional)" placeholder="Contoh: 081234567890" value={acc.whatsapp || ''} onChange={e => {
                  const newAcc = [...data.hadiahDigital.accounts];
                  newAcc[idx].whatsapp = e.target.value;
                  handleChange('hadiahDigital.accounts', newAcc);
               }} />
             </div>
           ))}
           <button 
             onClick={() => {
               const currentAccs = data.hadiahDigital?.accounts || [];
               handleChange('hadiahDigital.accounts', [...currentAccs, { name: 'BCA', number: '', owner: '', whatsapp: '' }]);
             }} 
             style={{ width: '100%', padding: '0.75rem', background: 'var(--border)', border: '1px dashed var(--border-hover)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, marginBottom: '2rem' }}
           >
             + Tambah Rekening
           </button>

           <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Kirim Kado Fisik</h3>
           <InputField label="Nama Penerima Paket" value={data.hadiahDigital?.receiver || ''} onChange={e => handleChange('hadiahDigital.receiver', e.target.value)} />
           <InputField label="Alamat Pengiriman" type="textarea" value={data.hadiahDigital?.physicalAddress || ''} onChange={e => handleChange('hadiahDigital.physicalAddress', e.target.value)} />
           <InputField label="No HP Penerima" value={data.hadiahDigital?.physicalWhatsapp || ''} onChange={e => handleChange('hadiahDigital.physicalWhatsapp', e.target.value)} />
        </AccordionItem>

        {/* Accordion 7: Penutup */}
        <AccordionItem title="7. Penutup" pageKey="closing" isOpen={openAccordion === 'closing'} onClick={() => setOpenAccordion(openAccordion === 'closing' ? '' : 'closing')} visibility={isVisible('closing')} onToggleVisibility={handleToggleVisibility}>
          <InputField label="Kata Penutup & Salam" type="textarea" value={data.penutup || ''} onChange={e => handleChange('penutup', e.target.value)} />
        </AccordionItem>

      </div>
    </div>
  );
}

export default function BaruPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <UnifiedEditor />
    </React.Suspense>
  );
}

