'use client';
import React, { useState, useRef } from 'react';

export default function StoryPhotoUploader({ value, onChange, slug = 'undangan', label = 'Foto Cerita (Opsional)' }) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file tidak didukung. Harap pilih gambar (JPG, PNG, WEBP).');
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
      formData.append('slug', slug || 'story');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengunggah foto');
      }

      onChange(json.url);
    } catch (err) {
      console.error('Upload foto story gagal:', err);
      setErrorMsg(err.message || 'Gagal mengunggah foto. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setErrorMsg('');
  };

  const hasPhoto = Boolean(value && value.trim());

  return (
    <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        {label}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {hasPhoto ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            flexShrink: 0
          }}>
            <img
              src={value}
              alt="Foto Cerita"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isUploading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.7rem'
              }}>
                ...
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  cursor: isUploading ? 'not-allowed' : 'pointer'
                }}
              >
                {isUploading ? 'Mengunggah...' : 'Ganti Foto'}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #fca5a5',
                  background: '#fee2e2',
                  color: '#dc2626',
                  cursor: isUploading ? 'not-allowed' : 'pointer'
                }}
              >
                Hapus Foto
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Foto terpasang. Tampilan cerita akan memuat gambar ini.
            </span>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: '6px',
              border: '1px dashed var(--border-hover)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {isUploading ? 'Mengunggah...' : '+ Unggah Foto'}
          </button>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Opsional. Jika tidak diunggah, kartu cerita tampil rapi & ringkas tanpa ruang kosong foto.
          </p>
        </div>
      )}

      {errorMsg && (
        <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', marginBottom: 0 }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
