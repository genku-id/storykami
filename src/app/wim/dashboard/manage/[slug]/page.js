'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Floral1Template from '@/components/wim-baru/Floral1Template';
import JawaTemplate from '@/components/wim-baru/JawaTemplate';
import { supabase } from '@/utils/supabase';

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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {isOpen && <div style={{ padding: '1.5rem' }}>{children}</div>}
    </div>
  );
}

// --- Helper Input ---
function InputField({ label, value, onChange, type = "text", placeholder = "", options = [], disabled = false }) {
  return (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      <label className="wim-label" style={{ marginBottom: '0.3rem' }}>{label}</label>
      {type === "textarea" ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} disabled={disabled} className="wim-input" style={{ resize: 'vertical' }} />
      ) : type === "select" ? (
        <select value={value} onChange={onChange} disabled={disabled} className="wim-input">
          {options.map(opt => <option key={opt.val || opt} value={opt.val || opt}>{opt.name || opt}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="wim-input" />
      )}
    </div>
  );
}

const TEMPLATE_OPTIONS = [
  { val: 'floral1', name: 'Floral Elegance 1' },
  { val: 'template-daerahJawa', name: 'Jawa Klasik' }
];

export default function SubDashboardManage() {
  const router = useRouter();
  const params = useParams();
  const originalSlug = params.slug; 
  
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'guestbook'

  // Editor State
  const [slug, setSlug] = useState(originalSlug);
  const [templateName, setTemplateName] = useState('floral1');
  const [data, setData] = useState({});
  const [openAccordion, setOpenAccordion] = useState('pengaturan');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Guestbook State
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      const { data: dbData } = await supabase.from('invitations').select('*').eq('slug', originalSlug).single();
      if (dbData) {
        setSlug(dbData.slug);
        setTemplateName(dbData.template_name || dbData.template || 'floral1');
        if (dbData.data) {
          setData(prev => ({ 
            ...prev, 
            ...dbData.data,
            pageVisibility: { ...prev?.pageVisibility, ...(dbData.data.pageVisibility || {}) }
          }));
        }
      } else {
        alert('Data undangan tidak ditemukan!');
        router.push('/wim/dashboard');
      }
      setIsLoading(false);
    };
    if (originalSlug) loadData();
  }, [originalSlug, router]);

  // Load Comments
  useEffect(() => {
    if (activeTab === 'guestbook') {
      const fetchComments = async () => {
        setIsCommentsLoading(true);
        const { data: dbComments } = await supabase
          .from('guestbook')
          .select('*')
          .eq('invitation_slug', originalSlug)
          .order('created_at', { ascending: false });
        
        if (dbComments) setComments(dbComments);
        setIsCommentsLoading(false);
      };
      fetchComments();
    }
  }, [activeTab, originalSlug]);

  const handleDeleteComment = async (id) => {
    if (!confirm('Hapus ucapan ini secara permanen?')) return;
    const { error } = await supabase.from('guestbook').delete().eq('id', id);
    if (!error) {
      setComments(comments.filter(c => c.id !== id));
    } else {
      alert("Gagal menghapus ucapan.");
    }
  };

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
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    setIsSaving(true);
    
    if (cleanSlug !== originalSlug) {
      const { data: existingData } = await supabase.from('invitations').select('slug').eq('slug', cleanSlug).maybeSingle();
      if (existingData) {
        alert('Tautan (Slug) ini sudah dipakai. Silakan gunakan yang lain.');
        setSlug(originalSlug);
        setOpenAccordion('pengaturan');
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      slug: cleanSlug,
      template_name: templateName,
      data: { ...data, template: templateName }
    };

    const { error } = await supabase.from('invitations').update(payload).eq('slug', originalSlug);
    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      if (cleanSlug !== originalSlug) {
        router.push(`/wim/dashboard/manage/${cleanSlug}`);
      } else {
        alert('Perubahan berhasil disimpan!');
      }
    }
    setIsSaving(false);
  };

  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>Loading...</div>;

  if (showPreview) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#111', overflowY: 'auto' }}>
        <button onClick={() => setShowPreview(false)} style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10000, background: 'var(--bg-card)', color: 'var(--text-primary)', border: 'none', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>Tutup Preview ✕</button>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {templateName === 'floral1' ? <Floral1Template data={data} slug={slug || 'preview'} isVisible={isVisible} /> : <JawaTemplate data={data} slug={slug || 'preview'} isVisible={isVisible} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: 'var(--bg-primary)', fontFamily: 'inherit' }}>
      {/* Header Panel */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/wim/dashboard" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Kembali
            </a>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
              Kelola: {originalSlug}
            </h1>
          </div>
          {activeTab === 'editor' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowPreview(true)} className="btn btn-secondary">Lihat Preview</button>
              <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '2rem', padding: '0 1rem' }}>
          <button onClick={() => setActiveTab('editor')} style={{ background: 'none', border: 'none', borderBottom: activeTab === 'editor' ? '3px solid var(--text-primary)' : '3px solid transparent', padding: '10px 0', fontSize: '1rem', fontWeight: activeTab === 'editor' ? 600 : 400, color: activeTab === 'editor' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>Editor Undangan</button>
          <button onClick={() => setActiveTab('guestbook')} style={{ background: 'none', border: 'none', borderBottom: activeTab === 'guestbook' ? '3px solid var(--text-primary)' : '3px solid transparent', padding: '10px 0', fontSize: '1rem', fontWeight: activeTab === 'guestbook' ? 600 : 400, color: activeTab === 'guestbook' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>Ucapan & Doa Tamu</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem 6rem 1rem' }}>
        
        {activeTab === 'editor' && (
          <div>
            <AccordionItem title="1. Pengaturan Dasar & SEO" hideToggle={true} pageKey="pengaturan" isOpen={openAccordion === 'pengaturan'} onClick={() => setOpenAccordion(openAccordion === 'pengaturan' ? '' : 'pengaturan')}>
               <InputField label="Tautan Undangan (Slug)" value={slug} onChange={e => setSlug(e.target.value)} placeholder="contoh: budi-dan-sari" />
               <InputField label="Pilihan Template" type="select" options={TEMPLATE_OPTIONS} value={templateName} onChange={e => setTemplateName(e.target.value)} />
               <InputField label="No WhatsApp Klien" value={data.clientWa || ''} onChange={e => handleChange('clientWa', e.target.value)} placeholder="628123456789" />
               <div style={{ height: '1px', background: 'var(--border)', margin: '2rem 0' }}></div>
               <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Lagu Latar / Musik (MP3)</h3>
               <InputField label="URL Link Audio MP3" value={data.musikUrl || ''} onChange={e => handleChange('musikUrl', e.target.value)} placeholder="https://..." />
               <div style={{ height: '1px', background: 'var(--border)', margin: '2rem 0' }}></div>
               <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Tampilan Thumbnail Link (SEO)</h3>
               <InputField label="Judul Thumbnail" value={data.thumbnailJudul || ''} onChange={e => handleChange('thumbnailJudul', e.target.value)} placeholder="Undangan Pernikahan Budi & Sari" />
               <InputField label="Deskripsi Singkat" type="textarea" value={data.thumbnailDeskripsi || ''} onChange={e => handleChange('thumbnailDeskripsi', e.target.value)} />
               <InputField label="URL Foto Thumbnail" value={data.thumbnailFoto || ''} onChange={e => handleChange('thumbnailFoto', e.target.value)} />
            </AccordionItem>
            
            <AccordionItem title="2. Cover Halaman Depan" pageKey="cover" isOpen={openAccordion === 'cover'} onClick={() => setOpenAccordion(openAccordion === 'cover' ? '' : 'cover')} visibility={isVisible('cover')} onToggleVisibility={handleToggleVisibility}>
              <InputField label="Nama Panggilan Kedua Mempelai" value={data.coverName || ''} onChange={e => handleChange('coverName', e.target.value)} placeholder="Budi & Sari" />
              <InputField label="Inisial Mempelai" value={data.coverInitials || ''} onChange={e => handleChange('coverInitials', e.target.value)} placeholder="BS" />
            </AccordionItem>

            <AccordionItem title="3. Profil Mempelai" pageKey="profiles" isOpen={openAccordion === 'profiles'} onClick={() => setOpenAccordion(openAccordion === 'profiles' ? '' : 'profiles')} visibility={isVisible('profiles')} onToggleVisibility={handleToggleVisibility}>
               <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Mempelai Wanita</h3>
               <InputField label="Nama Lengkap Wanita" value={data.mempelai?.wanita?.namaLengkap || ''} onChange={e => handleChange('mempelai.wanita.namaLengkap', e.target.value)} />
               <InputField label="Nama Panggilan Wanita" value={data.mempelai?.wanita?.namaPanggilan || ''} onChange={e => handleChange('mempelai.wanita.namaPanggilan', e.target.value)} />
               <InputField label="Nama Bapak" value={data.mempelai?.wanita?.namaAyah || ''} onChange={e => handleChange('mempelai.wanita.namaAyah', e.target.value)} />
               <InputField label="Nama Ibu" value={data.mempelai?.wanita?.namaIbu || ''} onChange={e => handleChange('mempelai.wanita.namaIbu', e.target.value)} />
               <InputField label="Urutan Anak" value={data.mempelai?.wanita?.urutanAnak || ''} onChange={e => handleChange('mempelai.wanita.urutanAnak', e.target.value)} />
               <InputField label="Username Instagram" value={data.mempelai?.wanita?.instagram || ''} onChange={e => handleChange('mempelai.wanita.instagram', e.target.value)} />
               <InputField label="Link Foto Utama" value={data.mempelai?.wanita?.fotoUtama || ''} onChange={e => handleChange('mempelai.wanita.fotoUtama', e.target.value)} />

               <div style={{ height: '1px', background: 'var(--border)', margin: '2rem 0' }}></div>

               <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Mempelai Pria</h3>
               <InputField label="Nama Lengkap Pria" value={data.mempelai?.pria?.namaLengkap || ''} onChange={e => handleChange('mempelai.pria.namaLengkap', e.target.value)} />
               <InputField label="Nama Panggilan Pria" value={data.mempelai?.pria?.namaPanggilan || ''} onChange={e => handleChange('mempelai.pria.namaPanggilan', e.target.value)} />
               <InputField label="Nama Bapak" value={data.mempelai?.pria?.namaAyah || ''} onChange={e => handleChange('mempelai.pria.namaAyah', e.target.value)} />
               <InputField label="Nama Ibu" value={data.mempelai?.pria?.namaIbu || ''} onChange={e => handleChange('mempelai.pria.namaIbu', e.target.value)} />
               <InputField label="Urutan Anak" value={data.mempelai?.pria?.urutanAnak || ''} onChange={e => handleChange('mempelai.pria.urutanAnak', e.target.value)} />
               <InputField label="Username Instagram" value={data.mempelai?.pria?.instagram || ''} onChange={e => handleChange('mempelai.pria.instagram', e.target.value)} />
               <InputField label="Link Foto Utama" value={data.mempelai?.pria?.fotoUtama || ''} onChange={e => handleChange('mempelai.pria.fotoUtama', e.target.value)} />
            </AccordionItem>

            <AccordionItem title="4. Jadwal Acara" pageKey="events" isOpen={openAccordion === 'events'} onClick={() => setOpenAccordion(openAccordion === 'events' ? '' : 'events')} visibility={isVisible('events')} onToggleVisibility={handleToggleVisibility}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Akad Nikah</h3>
              <InputField label="Tanggal (YYYY-MM-DD)" type="date" value={data.acara?.akad?.tanggal || ''} onChange={e => handleChange('acara.akad.tanggal', e.target.value)} />
              <InputField label="Waktu Mulai" type="time" value={data.acara?.akad?.waktuMulai || ''} onChange={e => handleChange('acara.akad.waktuMulai', e.target.value)} />
              <InputField label="Waktu Selesai" type="text" placeholder="Selesai / 10:00" value={data.acara?.akad?.waktuSelesai || ''} onChange={e => handleChange('acara.akad.waktuSelesai', e.target.value)} />
              <InputField label="Lokasi/Gedung" value={data.acara?.akad?.lokasi || ''} onChange={e => handleChange('acara.akad.lokasi', e.target.value)} />
              <InputField label="Alamat Lengkap" type="textarea" value={data.acara?.akad?.alamatLengkap || ''} onChange={e => handleChange('acara.akad.alamatLengkap', e.target.value)} />
              <InputField label="Link Google Maps" type="url" value={data.acara?.akad?.linkMap || ''} onChange={e => handleChange('acara.akad.linkMap', e.target.value)} />

              <div style={{ height: '1px', background: 'var(--border)', margin: '2rem 0' }}></div>

              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Resepsi Pernikahan</h3>
              <InputField label="Tanggal (YYYY-MM-DD)" type="date" value={data.acara?.resepsi?.tanggal || ''} onChange={e => handleChange('acara.resepsi.tanggal', e.target.value)} />
              <InputField label="Waktu Mulai" type="time" value={data.acara?.resepsi?.waktuMulai || ''} onChange={e => handleChange('acara.resepsi.waktuMulai', e.target.value)} />
              <InputField label="Waktu Selesai" type="text" placeholder="Selesai / 14:00" value={data.acara?.resepsi?.waktuSelesai || ''} onChange={e => handleChange('acara.resepsi.waktuSelesai', e.target.value)} />
              <InputField label="Lokasi/Gedung" value={data.acara?.resepsi?.lokasi || ''} onChange={e => handleChange('acara.resepsi.lokasi', e.target.value)} />
              <InputField label="Alamat Lengkap" type="textarea" value={data.acara?.resepsi?.alamatLengkap || ''} onChange={e => handleChange('acara.resepsi.alamatLengkap', e.target.value)} />
              <InputField label="Link Google Maps" type="url" value={data.acara?.resepsi?.linkMap || ''} onChange={e => handleChange('acara.resepsi.linkMap', e.target.value)} />
            </AccordionItem>

            <AccordionItem title="5. Love Story" pageKey="loveStory" isOpen={openAccordion === 'loveStory'} onClick={() => setOpenAccordion(openAccordion === 'loveStory' ? '' : 'loveStory')} visibility={isVisible('loveStory')} onToggleVisibility={handleToggleVisibility}>
              {data.ceritaCinta?.map((cerita, index) => (
                <div key={index} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1rem', background: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Cerita #{index + 1}</h4>
                    <button onClick={() => handleChange('ceritaCinta', data.ceritaCinta.filter((_, i) => i !== index))} style={{ background: '#ef4444', color: 'var(--bg-card)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>Hapus</button>
                  </div>
                  <InputField label="Judul Cerita" value={cerita.judul} onChange={e => {
                    const arr = [...data.ceritaCinta]; arr[index].judul = e.target.value; handleChange('ceritaCinta', arr);
                  }} />
                  <InputField label="Tanggal / Tahun" value={cerita.tanggal} onChange={e => {
                    const arr = [...data.ceritaCinta]; arr[index].tanggal = e.target.value; handleChange('ceritaCinta', arr);
                  }} />
                  <InputField label="Isi Cerita" type="textarea" value={cerita.cerita} onChange={e => {
                    const arr = [...data.ceritaCinta]; arr[index].cerita = e.target.value; handleChange('ceritaCinta', arr);
                  }} />
                </div>
              ))}
              <button onClick={() => handleChange('ceritaCinta', [...(data.ceritaCinta || []), { judul: '', tanggal: '', cerita: '' }])} style={{ width: '100%', padding: '0.75rem', background: 'var(--border)', border: '1px dashed var(--border-hover)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
                + Tambah Cerita
              </button>
            </AccordionItem>

            <AccordionItem title="6. Wedding Gift" pageKey="gift" isOpen={openAccordion === 'gift'} onClick={() => setOpenAccordion(openAccordion === 'gift' ? '' : 'gift')} visibility={isVisible('gift')} onToggleVisibility={handleToggleVisibility}>
               <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Daftar Rekening / E-Wallet</h3>
               {data.hadiahDigital?.accounts?.map((acc, idx) => (
                 <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1rem', background: 'var(--bg-primary)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Rekening #{idx + 1}</h4>
                     <button onClick={() => handleChange('hadiahDigital.accounts', data.hadiahDigital.accounts.filter((_, i) => i !== idx))} style={{ background: '#ef4444', color: 'var(--bg-card)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>Hapus</button>
                   </div>
                   <InputField label="Nama Bank / E-Wallet" type="select" options={["BCA", "Mandiri", "BNI", "BRI", "BSI", "GoPay", "OVO", "Dana", "ShopeePay"]} value={acc.name} onChange={e => {
                      const arr = [...data.hadiahDigital.accounts]; arr[idx].name = e.target.value; handleChange('hadiahDigital.accounts', arr);
                   }} />
                   <InputField label="Nomor Rekening / HP" value={acc.number} onChange={e => {
                      const arr = [...data.hadiahDigital.accounts]; arr[idx].number = e.target.value; handleChange('hadiahDigital.accounts', arr);
                   }} />
                   <InputField label="Atas Nama" value={acc.owner} onChange={e => {
                      const arr = [...data.hadiahDigital.accounts]; arr[idx].owner = e.target.value; handleChange('hadiahDigital.accounts', arr);
                   }} />
                 </div>
               ))}
               <button onClick={() => handleChange('hadiahDigital.accounts', [...(data.hadiahDigital?.accounts || []), { name: 'BCA', number: '', owner: '' }])} style={{ width: '100%', padding: '0.75rem', background: 'var(--border)', border: '1px dashed var(--border-hover)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, marginBottom: '2rem' }}>
                 + Tambah Rekening
               </button>

               <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Kirim Kado Fisik</h3>
               <InputField label="Nama Penerima Paket" value={data.hadiahDigital?.receiver || ''} onChange={e => handleChange('hadiahDigital.receiver', e.target.value)} />
               <InputField label="Alamat Pengiriman" type="textarea" value={data.hadiahDigital?.physicalAddress || ''} onChange={e => handleChange('hadiahDigital.physicalAddress', e.target.value)} />
               <InputField label="No HP Penerima" value={data.hadiahDigital?.physicalWhatsapp || ''} onChange={e => handleChange('hadiahDigital.physicalWhatsapp', e.target.value)} />
            </AccordionItem>

            <AccordionItem title="7. Penutup" pageKey="closing" isOpen={openAccordion === 'closing'} onClick={() => setOpenAccordion(openAccordion === 'closing' ? '' : 'closing')} visibility={isVisible('closing')} onToggleVisibility={handleToggleVisibility}>
              <InputField label="Kata Penutup & Salam" type="textarea" value={data.penutup || ''} onChange={e => handleChange('penutup', e.target.value)} />
            </AccordionItem>
          </div>
        )}

        {/* Tab Guestbook */}
        {activeTab === 'guestbook' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Daftar Ucapan & Doa</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Kelola pesan yang ditinggalkan tamu untuk undangan ini.</p>
            
            {isCommentsLoading ? (
              <div>Memuat data...</div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Belum ada ucapan yang masuk.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {comments.map(c => (
                  <div key={c.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: c.attendance === 'Hadir' ? 'var(--success-bg)' : '#fef2f2', color: c.attendance === 'Hadir' ? 'var(--success)' : '#dc2626' }}>
                          {c.attendance}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{c.message}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>{new Date(c.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteComment(c.id)}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
