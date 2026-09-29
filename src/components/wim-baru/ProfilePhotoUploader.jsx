'use client';
import React, { useState, useRef } from 'react';

export const DEFAULT_BRIDE_PHOTO = '/assets/images/bride.png';
export const DEFAULT_GROOM_PHOTO = '/assets/images/groom.png';

export default function ProfilePhotoUploader({
  label,
  value,
  onChange,
  gender = 'wanita', // 'wanita' | 'pria'
  slug = 'mempelai'
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const isWanita = gender === 'wanita';
  const defaultPhoto = isWanita ? DEFAULT_BRIDE_PHOTO : DEFAULT_GROOM_PHOTO;
  const defaultBadgeLabel = isWanita ? '✓ Default: Foto Bride' : '✓ Default: Foto Groom';

  // Jika nilai kosong atau sama dengan default, gunakan foto default
  const activeImage = value && value.trim() ? value.trim() : defaultPhoto;
  const isDefault = !value || value.trim() === '' || value === defaultPhoto;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar bisa memilih file yang sama jika diperlukan
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file tidak didukung. Harap pilih file gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran foto terlalu besar. Maksimal 5MB.');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', `${slug}-${isWanita ? 'bride' : 'groom'}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengunggah foto');
      }

      // Berhasil upload, simpan URL ke form data
      onChange(json.url);
    } catch (err) {
      console.error('Upload foto profil gagal:', err);
      setErrorMsg(err.message || 'Gagal mengunggah foto. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToDefault = () => {
    onChange('');
    setErrorMsg('');
  };

  return (
    <div style={{
      marginTop: '0.75rem',
      marginBottom: '1.25rem',
      padding: '1.25rem',
      borderRadius: '12px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
    }}>
      <label className="wim-label" style={{ marginBottom: '0.6rem', display: 'block', fontWeight: 600 }}>
        {label || (isWanita ? 'Foto Mempelai Wanita' : 'Foto Mempelai Pria')}
      </label>

      {/* Input File Hidden */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Baris Preview Kecil & Tombol Aksi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Kotak Preview Kecil Bulat / Rounded */}
        <div style={{
          position: 'relative',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid var(--border)',
          background: '#f8fafc',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={activeImage}
            alt={label || 'Foto Mempelai'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.currentTarget.src = defaultPhoto;
            }}
          />

          {isUploading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 600
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid #ffffff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '4px'
              }} />
              <span>Upload...</span>
            </div>
          )}
        </div>

        {/* Informasi Status & Tombol Unggah */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          {/* Badge Status */}
          <div style={{ marginBottom: '0.4rem' }}>
            {isDefault ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem',
                color: '#059669',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {defaultBadgeLabel}
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem',
                color: '#4f46e5',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                ✨ Foto Kustom Aktif
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
            {isDefault
              ? `Jika tidak mengunggah foto, undangan otomatis menggunakan gambar default ${isWanita ? 'bride' : 'groom'}.`
              : `Foto ini akan ditampilkan di bagian profil mempelai ${isWanita ? 'wanita' : 'pria'}.`}
          </p>

          {/* Tombol Aksi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '7px 14px',
                borderRadius: '8px',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{isDefault ? (isWanita ? 'Unggah Foto Mempelai Wanita' : 'Unggah Foto Mempelai Pria') : 'Ganti Foto'}</span>
            </button>

            {!isDefault && (
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={isUploading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontWeight: 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <span>Hapus / Gunakan Default</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#991b1b',
          fontSize: '0.8rem'
        }}>
          {errorMsg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
