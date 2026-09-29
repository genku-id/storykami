'use client';
import React, { useState, useRef } from 'react';

export const DEFAULT_COUPLE_THUMBNAIL = '/assets/images/couple.png';

export default function ThumbnailUploader({ value, onChange, slug = 'undangan', title = '', label = '', description = '', showWhatsappPreview = true }) {
  const displayLabel = label || title || 'Foto Thumbnail Link (WhatsApp & Medsos)';
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Jika tidak ada foto kustom, gunakan foto default couple
  const activeImage = value && value.trim() ? value.trim() : DEFAULT_COUPLE_THUMBNAIL;
  const isDefault = !value || value.trim() === '' || value === DEFAULT_COUPLE_THUMBNAIL;

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
      formData.append('slug', slug || 'thumb');

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
      console.error('Upload thumbnail gagal:', err);
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
      <label className="wim-label" style={{ marginBottom: description ? '0.3rem' : '0.6rem', display: 'block', fontWeight: 600 }}>
        {displayLabel}
      </label>
      {description && (
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {description}
        </p>
      )}

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
        {/* Kotak Preview Kecil */}
        <div style={{
          position: 'relative',
          width: '100px',
          height: '100px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid var(--border)',
          background: '#f8fafc',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={activeImage}
            alt="Preview Thumbnail"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_COUPLE_THUMBNAIL;
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
          <div style={{ marginBottom: '0.5rem' }}>
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
                ✓ Default: Foto Pasangan (Couple)
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
              ? 'Jika tidak mengunggah foto, sistem otomatis menggunakan foto default couple.'
              : (showWhatsappPreview
                  ? 'Foto ini akan muncul sebagai gambar preview saat tautan undangan dibagikan di WhatsApp/Facebook.'
                  : 'Foto ini akan digunakan sebagai gambar latar belakang pada bagian penutup.')}
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
              <span>{isDefault ? 'Unggah Foto Baru' : 'Ganti Foto'}</span>
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

      {/* Simulasi Tampilan WhatsApp Preview Card */}
      {showWhatsappPreview && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Simulasi Preview di WhatsApp:
          </p>
          <div style={{
            maxWidth: '340px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <img
              src={activeImage}
              alt="WA Preview"
              style={{ width: '80px', height: '80px', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.src = DEFAULT_COUPLE_THUMBNAIL; }}
            />
            <div style={{ padding: '8px 10px', overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title || 'Undangan Pernikahan'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                {description || 'Tanpa mengurangi rasa hormat, kami mengundang...'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#059669', marginTop: '4px', fontWeight: 500 }}>
                storykami.my.id
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
