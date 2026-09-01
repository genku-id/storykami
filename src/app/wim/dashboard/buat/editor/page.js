'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Floral1Template from '@/components/wim-baru/Floral1Template';
import JawaTemplate from '@/components/wim-baru/JawaTemplate';
import { defaultInvitationData } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';

// --- Komponen Accordion Item ---
function AccordionItem({ title, icon, pageKey, isOpen, onClick, visibility, onToggleVisibility, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div 
        style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isOpen ? '#f8fafc' : '#fff', borderBottom: isOpen ? '1px solid #eee' : 'none' }}
        onClick={onClick}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>{icon}</span>}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#334155' }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
          {/* Toggle Switch */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
            <div style={{
              width: 36, height: 20, background: visibility ? '#3b82f6' : '#cbd5e1', borderRadius: 20, position: 'relative', transition: '0.2s'
            }}>
              <div style={{
                width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: visibility ? 18 : 2, transition: '0.2s'
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
          {/* Chevron */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>
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
function InputField({ label, value, onChange, type = "text", placeholder = "", options = [] }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#4a5568' }}>{label}</label>
      {type === "textarea" ? (
        <textarea 
          value={value} 
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', resize: 'vertical' }}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={onChange}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff' }}
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={onChange}
          placeholder={placeholder}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
        />
      )}
    </div>
  );
}

export default function FormGenerator() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || 'test-slug';
  const templateName = searchParams.get('template') || 'floral1';
  
  const [data, setData] = useState(defaultInvitationData);
  const [openAccordion, setOpenAccordion] = useState('cover');
  const [showPreview, setShowPreview] = useState(false); // Modal state

  // Load existing data if edit
  useEffect(() => {
    const loadData = async () => {
      if (slug) {
        const { data: dbData } = await supabase.from('invitations').select('data').eq('slug', slug).single();
        if (dbData && dbData.data) {
          setData(prev => ({ 
            ...prev, 
            ...dbData.data,
            pageVisibility: { ...prev.pageVisibility, ...(dbData.data.pageVisibility || {}) }
          }));
        }
      }
    };
    loadData();
  }, [slug]);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (slug) {
        await supabase.from('invitations').update({ data: data }).eq('slug', slug);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [data, slug]);

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setData(prev => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}; // fallback
        current[keys[i]] = Array.isArray(current[keys[i]]) ? [...current[keys[i]]] : { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleToggleVisibility = (pageKey, value) => {
    setData(prev => ({
      ...prev,
      pageVisibility: {
        ...prev.pageVisibility,
        [pageKey]: value
      }
    }));
  };

  const isVisible = (pageKey) => data.pageVisibility[pageKey] ?? true;

  // --- Repeater Handlers: Love Story ---
  const handleAddStory = () => {
    setData(prev => ({
      ...prev,
      ceritaCinta: [...(prev.ceritaCinta || []), { tanggal: '', judul: '', cerita: '' }]
    }));
  };
  const handleRemoveStory = (index) => {
    setData(prev => ({
      ...prev,
      ceritaCinta: prev.ceritaCinta.filter((_, i) => i !== index)
    }));
  };
  const handleStoryChange = (index, field, value) => {
    setData(prev => {
      const newStories = [...prev.ceritaCinta];
      newStories[index] = { ...newStories[index], [field]: value };
      return { ...prev, ceritaCinta: newStories };
    });
  };

  // --- Repeater Handlers: Gift Accounts ---
  const handleAddAccount = () => {
    setData(prev => ({
      ...prev,
      hadiahDigital: {
        ...prev.hadiahDigital,
        accounts: [...(prev.hadiahDigital?.accounts || []), { name: 'BCA', number: '', owner: '', whatsapp: '' }]
      }
    }));
  };
  const handleRemoveAccount = (index) => {
    setData(prev => ({
      ...prev,
      hadiahDigital: {
        ...prev.hadiahDigital,
        accounts: prev.hadiahDigital.accounts.filter((_, i) => i !== index)
      }
    }));
  };
  const handleAccountChange = (index, field, value) => {
    setData(prev => {
      const newAccs = [...(prev.hadiahDigital?.accounts || [])];
      newAccs[index] = { ...newAccs[index], [field]: value };
      return { ...prev, hadiahDigital: { ...prev.hadiahDigital, accounts: newAccs } };
    });
  };

  const bankOptions = ["BCA","BLU","BNI","BRI","BSI","CIMB","DANA","GOPAY","JAGO","JENIUS","LINKAJA","MANDIRI","NEO","OVO","PERMATA","SEABANK","SHOPEEPAY"];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
      
      {/* Editor Main Container (Full Width) */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem 6rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/wim/dashboard/buat" style={{ textDecoration: 'none', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Kembali
            </a>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', margin: 0, paddingLeft: '1rem', borderLeft: '1px solid #cbd5e1' }}>Editor Undangan</h1>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#e2e8f0', padding: '4px 12px', borderRadius: 20 }}>
            Tersimpan Otomatis
          </span>
        </div>

        {/* Layout Grid 2 Kolom */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>


        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>} title="1. Halaman Cover" pageKey="cover" isOpen={openAccordion === 'cover'} onClick={() => setOpenAccordion(openAccordion === 'cover' ? '' : 'cover')} visibility={isVisible('cover')} onToggleVisibility={handleToggleVisibility}>
          <InputField label="Nama Panggilan Wanita (Inisial)" value={data.mempelai.wanita.namaPanggilan} onChange={e => handleChange('mempelai.wanita.namaPanggilan', e.target.value)} />
          <InputField label="Nama Panggilan Pria (Inisial)" value={data.mempelai.pria.namaPanggilan} onChange={e => handleChange('mempelai.pria.namaPanggilan', e.target.value)} />
          <InputField label="Tautan Musik Latar (YouTube/MP3)" type="url" value={data.musikUrl || ''} onChange={e => handleChange('musikUrl', e.target.value)} />
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>} title="2. Halaman Hero" pageKey="hero" isOpen={openAccordion === 'hero'} onClick={() => setOpenAccordion(openAccordion === 'hero' ? '' : 'hero')} visibility={isVisible('hero')} onToggleVisibility={handleToggleVisibility}>
          <InputField label="Tanggal Acara Utama" type="date" value={data.acara.akad.tanggal} onChange={e => handleChange('acara.akad.tanggal', e.target.value)} />
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} title="3. Halaman Profil" pageKey="profiles" isOpen={openAccordion === 'profiles'} onClick={() => setOpenAccordion(openAccordion === 'profiles' ? '' : 'profiles')} visibility={isVisible('profiles')} onToggleVisibility={handleToggleVisibility}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Mempelai Wanita</h3>
          <InputField label="Nama Lengkap" value={data.mempelai.wanita.namaLengkap} onChange={e => handleChange('mempelai.wanita.namaLengkap', e.target.value)} />
          <InputField label="Nama Ayah" value={data.mempelai.wanita.namaAyah} onChange={e => handleChange('mempelai.wanita.namaAyah', e.target.value)} />
          <InputField label="Nama Ibu" value={data.mempelai.wanita.namaIbu} onChange={e => handleChange('mempelai.wanita.namaIbu', e.target.value)} />
          <InputField label="Username Instagram" value={data.mempelai.wanita.instagram} onChange={e => handleChange('mempelai.wanita.instagram', e.target.value)} />

          <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Mempelai Pria</h3>
          <InputField label="Nama Lengkap" value={data.mempelai.pria.namaLengkap} onChange={e => handleChange('mempelai.pria.namaLengkap', e.target.value)} />
          <InputField label="Nama Ayah" value={data.mempelai.pria.namaAyah} onChange={e => handleChange('mempelai.pria.namaAyah', e.target.value)} />
          <InputField label="Nama Ibu" value={data.mempelai.pria.namaIbu} onChange={e => handleChange('mempelai.pria.namaIbu', e.target.value)} />
          <InputField label="Username Instagram" value={data.mempelai.pria.instagram} onChange={e => handleChange('mempelai.pria.instagram', e.target.value)} />
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>} title="4. Halaman Quotes" pageKey="quote" isOpen={openAccordion === 'quote'} onClick={() => setOpenAccordion(openAccordion === 'quote' ? '' : 'quote')} visibility={isVisible('quote')} onToggleVisibility={handleToggleVisibility}>
          <InputField label="Sumber Quote" value={data.kutipan.sumber} onChange={e => handleChange('kutipan.sumber', e.target.value)} />
          <InputField label="Isi Quote" type="textarea" value={data.kutipan.teks} onChange={e => handleChange('kutipan.teks', e.target.value)} />
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>} title="5. Halaman Acara" pageKey="events" isOpen={openAccordion === 'events'} onClick={() => setOpenAccordion(openAccordion === 'events' ? '' : 'events')} visibility={isVisible('events')} onToggleVisibility={handleToggleVisibility}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Akad Nikah</h3>
          <InputField label="Waktu Mulai" type="time" value={data.acara.akad.waktuMulai} onChange={e => handleChange('acara.akad.waktuMulai', e.target.value)} />
          <InputField label="Waktu Selesai" type="time" value={data.acara.akad.waktuSelesai} onChange={e => handleChange('acara.akad.waktuSelesai', e.target.value)} />
          <InputField label="Lokasi/Gedung" value={data.acara.akad.lokasi} onChange={e => handleChange('acara.akad.lokasi', e.target.value)} />
          <InputField label="Alamat Lengkap" type="textarea" value={data.acara.akad.alamatLengkap} onChange={e => handleChange('acara.akad.alamatLengkap', e.target.value)} />
          <InputField label="Link Google Maps" type="url" value={data.acara.akad.linkMap} onChange={e => handleChange('acara.akad.linkMap', e.target.value)} />

          <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Resepsi</h3>
          <InputField label="Waktu Mulai" type="time" value={data.acara.resepsi.waktuMulai} onChange={e => handleChange('acara.resepsi.waktuMulai', e.target.value)} />
          <InputField label="Waktu Selesai" type="time" value={data.acara.resepsi.waktuSelesai} onChange={e => handleChange('acara.resepsi.waktuSelesai', e.target.value)} />
          <InputField label="Lokasi/Gedung" value={data.acara.resepsi.lokasi} onChange={e => handleChange('acara.resepsi.lokasi', e.target.value)} />
          <InputField label="Alamat Lengkap" type="textarea" value={data.acara.resepsi.alamatLengkap} onChange={e => handleChange('acara.resepsi.alamatLengkap', e.target.value)} />
          <InputField label="Link Google Maps" type="url" value={data.acara.resepsi.linkMap} onChange={e => handleChange('acara.resepsi.linkMap', e.target.value)} />
          <InputField label="Foto Resepsi" value={data.foto?.resepsi || ''} onChange={e => handleChange('foto.resepsi', e.target.value)} />
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>} title="6. Love Story" pageKey="loveStory" isOpen={openAccordion === 'loveStory'} onClick={() => setOpenAccordion(openAccordion === 'loveStory' ? '' : 'loveStory')} visibility={isVisible('loveStory')} onToggleVisibility={handleToggleVisibility}>
          {data.ceritaCinta?.map((cerita, index) => (
            <div key={index} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1rem', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Cerita #{index + 1}</h4>
                <button onClick={() => handleRemoveStory(index)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>Hapus</button>
              </div>
              <InputField label="Judul Cerita" value={cerita.judul} onChange={e => handleStoryChange(index, 'judul', e.target.value)} />
              <InputField label="Tanggal / Tahun" value={cerita.tanggal} onChange={e => handleStoryChange(index, 'tanggal', e.target.value)} />
              <InputField label="Isi Cerita" type="textarea" value={cerita.cerita} onChange={e => handleStoryChange(index, 'cerita', e.target.value)} />
            </div>
          ))}
          <button onClick={handleAddStory} style={{ width: '100%', padding: '0.75rem', background: '#e2e8f0', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
            + Tambah Cerita
          </button>
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>} title="7. Wedding Gift" pageKey="gift" isOpen={openAccordion === 'gift'} onClick={() => setOpenAccordion(openAccordion === 'gift' ? '' : 'gift')} visibility={isVisible('gift')} onToggleVisibility={handleToggleVisibility}>
           <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Daftar Rekening / E-Wallet</h3>
           {data.hadiahDigital?.accounts?.map((acc, idx) => (
             <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1rem', background: '#f8fafc' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                 <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Rekening #{idx + 1}</h4>
                 <button onClick={() => handleRemoveAccount(idx)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>Hapus</button>
               </div>
               <InputField label="Nama Bank / E-Wallet" type="select" options={bankOptions} value={acc.name} onChange={e => handleAccountChange(idx, 'name', e.target.value)} />
               <InputField label="Nomor Rekening / HP" value={acc.number} onChange={e => handleAccountChange(idx, 'number', e.target.value)} />
               <InputField label="Atas Nama" value={acc.owner} onChange={e => handleAccountChange(idx, 'owner', e.target.value)} />
             </div>
           ))}
           <button onClick={handleAddAccount} style={{ width: '100%', padding: '0.75rem', background: '#e2e8f0', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500, marginBottom: '2rem' }}>
             + Tambah Rekening
           </button>

           <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Kirim Kado Fisik</h3>
           <InputField label="Nama Penerima Paket" value={data.hadiahDigital?.receiver || ''} onChange={e => handleChange('hadiahDigital.receiver', e.target.value)} />
           <InputField label="Alamat Pengiriman" type="textarea" value={data.hadiahDigital?.physicalAddress || ''} onChange={e => handleChange('hadiahDigital.physicalAddress', e.target.value)} />
           <InputField label="No HP Penerima" value={data.hadiahDigital?.physicalWhatsapp || ''} onChange={e => handleChange('hadiahDigital.physicalWhatsapp', e.target.value)} />
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>} title="8. Ucapan & Doa (Guestbook)" pageKey="guestbook" isOpen={openAccordion === 'guestbook'} onClick={() => setOpenAccordion(openAccordion === 'guestbook' ? '' : 'guestbook')} visibility={isVisible('guestbook')} onToggleVisibility={handleToggleVisibility}>
           <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: 8 }}>
             <p style={{ fontSize: '0.9rem', color: '#1e40af', margin: 0 }}>
               <strong>Info:</strong> Fitur Ucapan terhubung langsung ke tabel Supabase dan akan ditampilkan secara otomatis.
             </p>
           </div>
        </AccordionItem>

        <AccordionItem icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>} title="9. Penutup" pageKey="closing" isOpen={openAccordion === 'closing'} onClick={() => setOpenAccordion(openAccordion === 'closing' ? '' : 'closing')} visibility={isVisible('closing')} onToggleVisibility={handleToggleVisibility}>
          <InputField label="Kata Penutup & Salam" type="textarea" value={data.penutup || "Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.\n\nWassalamu'alaikum Wr. Wb."} onChange={e => handleChange('penutup', e.target.value)} />
        </AccordionItem>

        </div> {/* End of Layout Grid */}

      </div>

      {/* Floating Preview Button */}
      {!showPreview && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <button 
            onClick={() => setShowPreview(true)}
            style={{ 
              background: '#0f172a', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '30px',
              fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Lihat Preview Undangan
          </button>
        </div>
      )}

      {/* Modal Preview Full Screen Mockup */}
      {showPreview && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 1000, 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Close Button Floating */}
          <button 
            onClick={() => setShowPreview(false)}
            style={{
              position: 'absolute', top: '2rem', right: '2rem', background: '#ef4444', color: '#fff',
              border: 'none', width: 50, height: 50, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
              transition: '0.2s', zIndex: 1010
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Tutup Preview"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* Mockup HP Container */}
          <div style={{
            height: '90vh', aspectRatio: '9/16', background: '#fff', borderRadius: '36px', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative', border: '8px solid #1e293b'
          }}>
            {/* Notch */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '150px', height: '28px', background: '#1e293b', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', zIndex: 50 }} />
            
            <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
              {templateName === 'template-daerahJawa' || templateName === 'jawa' ? (
                <JawaTemplate data={data} slug={slug} isVisible={isVisible} />
              ) : (
                <Floral1Template data={data} slug={slug} isVisible={isVisible} />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
