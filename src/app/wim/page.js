'use client';

import { useState } from 'react';
import styles from './wim.module.css';

export default function WIM() {
  const [formData, setFormData] = useState({
    templateName: 'template-floral1',
    slug: '',
    coupleName: '',
    groomName: '',
    brideName: ''
  });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('⏳ Sedang merakit undangan dan push ke GitHub (mohon tunggu sekitar 10 detik)...');

    try {
      const res = await fetch('/api/wim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || data.message || 'Terjadi kesalahan.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Gagal menghubungi server lokal.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>💍 WIM Dashboard</h1>
          <p className={styles.subtitle}>Wedding Invitation Manager</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Pilih Template</label>
            <select name="templateName" value={formData.templateName} onChange={handleChange} required className={styles.input}>
              <option value="template-floral1">Floral 1 (Elegan)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>URL / Slug Klien</label>
            <input type="text" name="slug" placeholder="contoh: romeo-juliet" value={formData.slug} onChange={handleChange} required className={styles.input} />
            <small className={styles.small}>Link undangan nantinya: storykami.my.id/<strong>{formData.slug || '...'}</strong></small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Judul Mempelai (di Cover)</label>
            <input type="text" name="coupleName" placeholder="contoh: Romeo & Juliet" value={formData.coupleName} onChange={handleChange} required className={styles.input} />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nama Pengantin Pria</label>
              <input type="text" name="groomName" placeholder="contoh: Romeo" value={formData.groomName} onChange={handleChange} required className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nama Pengantin Wanita</label>
              <input type="text" name="brideName" placeholder="contoh: Juliet" value={formData.brideName} onChange={handleChange} required className={styles.input} />
            </div>
          </div>

          <button type="submit" disabled={status === 'loading'} className={styles.btn}>
            {status === 'loading' ? 'Membangun...' : '✨ Generate Undangan'}
          </button>
        </form>

        {status !== 'idle' && (
          <div className={`${styles.alert} ${styles[status]}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
