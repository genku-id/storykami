'use client';
import React, { useState, useRef } from 'react';

export default function GalleryUploader({ images = [], onChange, slug = 'undangan' }) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const safeImages = Array.isArray(images) ? images : [];

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    setErrorMsg('');
    setIsUploading(true);

    const uploadedUrls = [];
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setErrorMsg('Beberapa file dilewati karena berukuran lebih dari 5MB.');
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('slug', slug || 'galeri');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (res.ok && json.success && json.url) {
          uploadedUrls.push(json.url);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...safeImages, ...uploadedUrls]);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      setErrorMsg('Gagal mengunggah beberapa foto. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (indexToRemove) => {
    const updated = safeImages.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= safeImages.length) return;
    const updated = [...safeImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!newUrlInput || !newUrlInput.trim()) return;
    const url = newUrlInput.trim();
    onChange([...safeImages, url]);
    setNewUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
        Kelola foto galeri untuk undangan ini. Pengaturan ini secara default non-aktif, aktifkan toggle di atas jika ingin menampilkan galeri foto di undangan.
      </p>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {isUploading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1"></path>
              </svg>
              Mengunggah Foto...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              + Unggah Foto (Bisa Pilih Banyak)
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          {showUrlInput ? 'Tutup Input Link' : '+ Tambah Link URL Foto'}
        </button>
      </div>

      {showUrlInput && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <input
            type="url"
            value={newUrlInput}
            onChange={(e) => setNewUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="wim-input"
            style={{ flex: 1, margin: 0 }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Tambahkan
          </button>
        </div>
      )}

      {errorMsg && (
        <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '1rem', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px' }}>
          {errorMsg}
        </div>
      )}

      {/* Grid of Current Images */}
      {safeImages.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
        }}>
          {safeImages.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                aspectRatio: '1 / 1',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <img
                src={url}
                alt={`Galeri ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/couple.png';
                }}
              />

              {/* Badge Number */}
              <div style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 600
              }}>
                #{idx + 1}
              </div>

              {/* Bottom Actions Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                padding: '8px 6px 4px 6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {idx > 0 && (
                    <button
                      type="button"
                      title="Geser Kiri"
                      onClick={() => handleMove(idx, -1)}
                      style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      ‹
                    </button>
                  )}
                  {idx < safeImages.length - 1 && (
                    <button
                      type="button"
                      title="Geser Kanan"
                      onClick={() => handleMove(idx, 1)}
                      style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      ›
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  title="Hapus Foto"
                  onClick={() => handleRemove(idx)}
                  style={{
                    background: '#dc2626',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
          color: 'var(--text-muted)',
          fontSize: '0.88rem'
        }}>
          Belum ada foto galeri yang diunggah. Klik tombol <strong>+ Unggah Foto</strong> di atas untuk menambahkan foto momen bahagia Anda.
        </div>
      )}
    </div>
  );
}
