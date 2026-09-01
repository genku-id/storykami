import React from 'react';
import { defaultInvitationData } from '@/utils/wimDataContract';

/**
 * TemplateSatu - Floral Elegance (Premium Template)
 * @param {Object} props.data - Data JSON standar undangan
 */
export default function TemplateSatu({ data = defaultInvitationData }) {
  const { mempelai, acara, galeri, kutipan } = data;

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
      fontFamily: '"Outfit", sans-serif',
      color: '#333',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)'
    }}>
      {/* Hero Section */}
      <section style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Ornamen Atas (Bisa diganti image di real project) */}
        <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />

        <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
          The Wedding Of
        </p>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontFamily: '"Playfair Display", serif',
          fontWeight: 'bold',
          color: '#2c3e50',
          margin: '0 0 1rem 0',
          lineHeight: 1.1
        }}>
          {mempelai.pria.namaPanggilan} <br/> &amp; <br/> {mempelai.wanita.namaPanggilan}
        </h1>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: '16px',
          padding: '12px 24px',
          marginTop: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#4a5568' }}>
            {new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Mempelai Section */}
      <section style={{ padding: '4rem 2rem', backgroundColor: '#fff', textAlign: 'center' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem' }}>
          Pasangan Mempelai
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Pria */}
          <div>
            <div style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden', border: '3px solid #f0e6d2' }}>
              <img src={mempelai.pria.fotoUtama} alt={mempelai.pria.namaLengkap} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0', color: '#2d3748' }}>{mempelai.pria.namaLengkap}</h3>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
              {mempelai.pria.urutanAnak} dari <br/> {mempelai.pria.namaAyah} &amp; {mempelai.pria.namaIbu}
            </p>
          </div>

          <div style={{ fontSize: '2rem', color: '#d4af37', fontFamily: '"Playfair Display", serif' }}>&amp;</div>

          {/* Wanita */}
          <div>
            <div style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden', border: '3px solid #f0e6d2' }}>
              <img src={mempelai.wanita.fotoUtama} alt={mempelai.wanita.namaLengkap} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0', color: '#2d3748' }}>{mempelai.wanita.namaLengkap}</h3>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
              {mempelai.wanita.urutanAnak} dari <br/> {mempelai.wanita.namaAyah} &amp; {mempelai.wanita.namaIbu}
            </p>
          </div>
        </div>
      </section>

      {/* Acara Section */}
      <section style={{ padding: '4rem 2rem', background: '#2c3e50', color: '#fff', textAlign: 'center' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', color: '#f0e6d2', marginBottom: '2rem' }}>
          Detail Acara
        </h2>
        
        {/* Akad */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#d4af37', fontSize: '1.5rem' }}>Akad Nikah</h3>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p style={{ margin: '0 0 1rem 0', color: '#cbd5e0' }}>{acara.akad.waktuMulai} - {acara.akad.waktuSelesai} {acara.akad.zonaWaktu}</p>
          <p style={{ margin: '0 0 0.5rem 0' }}>{acara.akad.lokasi}</p>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#a0aec0' }}>{acara.akad.alamatLengkap}</p>
          <a href={acara.akad.linkMap} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#d4af37', color: '#1a202c', padding: '10px 20px', borderRadius: '30px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Lihat Peta</a>
        </div>
      </section>

      {/* Footer / Kutipan */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fff' }}>
        <p style={{ fontStyle: 'italic', color: '#4a5568', lineHeight: 1.6, marginBottom: '1rem' }}>
          "{kutipan.teks}"
        </p>
        <p style={{ fontWeight: 600, color: '#2d3748' }}>- {kutipan.sumber} -</p>
      </section>
    </div>
  );
}
