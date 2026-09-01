'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { defaultInvitationData } from '@/utils/wimDataContract';

const TEMPLATE_OPTIONS = [
  { val: 'floral1', name: 'Floral Elegance 1' },
  { val: 'template-daerahJawa', name: 'Jawa Klasik' }
];

export default function BuatBaruPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [templateName, setTemplateName] = useState('floral1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!slug || slug.trim() === '') {
      setError("Tautan (Slug) tidak boleh kosong!");
      return;
    }
    
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    setIsLoading(true);
    setError('');

    // Check if slug exists
    const { data: existingData } = await supabase
      .from('invitations')
      .select('slug')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existingData) {
      setError('Tautan ini sudah dipakai! Silakan gunakan nama lain.');
      setIsLoading(false);
      return;
    }

    // Insert new
    const payload = {
      slug: cleanSlug,
      template_name: templateName,
      data: {
        ...defaultInvitationData,
        template: templateName
      }
    };

    const { error: insertErr } = await supabase.from('invitations').insert([payload]);
    if (insertErr) {
      setError("Gagal membuat undangan: " + insertErr.message);
      setIsLoading(false);
    } else {
      // Redirect to Sub-Dashboard
      router.push(`/wim/dashboard/manage/${cleanSlug}`);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '2rem', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Buat Undangan Baru</h1>
      
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>{error}</div>}

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="wim-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Tautan Undangan (Slug)</label>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <span style={{ padding: '0.75rem 1rem', background: 'var(--bg-primary)', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>storykami.my.id/</span>
          <input 
            type="text"
            className="wim-input"
            style={{ border: 'none', borderRadius: 0, padding: '0.75rem 1rem' }}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="budi-sari"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '2rem' }}>
        <label className="wim-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Pilih Template Awal</label>
        <select 
          className="wim-input"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          style={{ padding: '0.75rem 1rem', width: '100%' }}
        >
          {TEMPLATE_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.name}</option>)}
        </select>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>*Anda bisa mengubah template ini nanti di dalam halaman pengaturan.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/wim/dashboard')} disabled={isLoading}>Batal</button>
        <button className="btn btn-primary" onClick={handleCreate} disabled={isLoading}>
          {isLoading ? 'Membuat...' : 'Buat & Lanjut Edit'}
        </button>
      </div>
    </div>
  );
}
