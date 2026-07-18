'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const TEMPLATE_LABELS = {
  'template-floral1': 'Floral Elegance 1',
  'template-floral2': 'Floral Elegance 2',
};

function StatCard({ icon, label, value, sub, accentColor }) {
  return (
    <div
      className="stat-card-item"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor || 'var(--border-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div className="stat-card-icon" style={{
        width: 48, height: 48, borderRadius: 14,
        background: accentColor ? `${accentColor}18` : 'var(--bg-card)',
        border: `1px solid ${accentColor ? `${accentColor}30` : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor || 'var(--text-secondary)',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div className="stat-card-value" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, fontFamily: 'var(--font-outfit)' }}>
          {value}
        </div>
        <div className="stat-card-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>{label}</div>
        {sub && <div className="stat-card-sub" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const sStr = localStorage.getItem('wim_session');
    if (!sStr) { router.replace('/wim/login'); return; }
    const s = JSON.parse(sStr);

    // Set default if empty
    if (!s.joinDate) s.joinDate = new Date().toISOString();
    setSession(s);

    // Fetch all invitations
    const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });

    if (data) {
      // Filter out system config and resellers
      let filteredData = data.filter(inv => !inv.slug.startsWith('_'));

      // Filter by reseller if not admin
      if (!s.isAdmin) {
        filteredData = filteredData.filter(inv => inv.data?.resellerEmail === s.email);
      }

      setInvitations(filteredData.map(inv => ({
        id: inv.id,
        slug: inv.slug,
        namaPasangan: inv.data?.pasangan || inv.slug,
        clientWa: inv.data?.clientWa || '',
        template: inv.template,
        createdAt: inv.created_at
      })));
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (inv) => setConfirmDelete(inv);

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: confirmDelete.slug }),
      });
      const resData = await res.json();
      if (!res.ok) {
        showToast(`Gagal hapus: ${resData.error}`, 'error');
        return;
      }
    } catch (err) {
      showToast('Terjadi kesalahan sistem', 'error');
      return;
    }
    setConfirmDelete(null);
    load();
    showToast(`Undangan berhasil dihapus.`, 'success');
  };

  const filtered = invitations.filter(i =>
    (i.namaPasangan || i.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const used = invitations.length;
  const quota = session?.isAdmin ? Infinity : (session?.quota || 0);
  const remaining = quota === Infinity ? Infinity : Math.max(0, quota - used);

  if (!session) return null;

  return (
    <div className="page-container">

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', marginBottom: 4 }}>
            Selamat datang, {session.nama.split(' ')[0]}!
            <svg style={{ color: 'var(--text-secondary)' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" x2="6" y1="1" y2="3"/><line x1="10" x2="10" y1="1" y2="3"/><line x1="14" x2="14" y1="1" y2="3"/></svg>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => router.push('/wim/dashboard/buat')}
          className="btn btn-primary"
          style={{ flexShrink: 0 }}
          disabled={remaining === 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Buat Undangan Baru
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
          label="Total Undangan"
          value={used}
          sub="undangan aktif"
          accentColor="var(--accent)"
        />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
          label="Kuota Tersisa"
          value={remaining === Infinity ? '∞' : remaining}
          sub={`dari ${remaining === Infinity ? 'Tak Terbatas' : (quota + ' slot')}`}
          accentColor={remaining !== Infinity && remaining === 0 ? 'var(--danger)' : 'var(--success)'}
        />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          label="Paket Aktif"
          value={session.paket || 'Starter'}
          sub={`Bergabung ${new Date(session.joinDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
          accentColor="var(--warning)"
        />
      </div>

      {/* Invitation List */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>
            Daftar Undangan
            {filtered.length > 0 && (
              <span style={{
                marginLeft: 8, background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem',
                color: 'var(--text-muted)', fontWeight: 600,
              }}>
                {filtered.length}
              </span>
            )}
          </h2>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              className="wim-input"
              style={{ paddingLeft: 32, width: 200, fontSize: '0.82rem' }}
              placeholder="Cari undangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table body */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--accent)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>
            </div>
            <div className="empty-state-title">
              {invitations.length === 0 ? 'Belum ada undangan' : 'Tidak ditemukan'}
            </div>
            <div className="empty-state-desc">
              {invitations.length === 0
                ? 'Mulai buat undangan digital pertamamu!'
                : `Tidak ada undangan yang cocok dengan "${search}"`}
            </div>
            {invitations.length === 0 && remaining > 0 && (
              <button onClick={() => router.push('/wim/dashboard/buat')} className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Buat Undangan
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="wim-table">
              <thead>
                <tr>
                  <th>Pasangan</th>
                  <th>Slug / Link</th>
                  <th className="col-hide-mobile">Template</th>
                  <th className="col-hide-mobile">Dibuat</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {inv.namaPasangan || '—'}
                      </div>
                      {inv.clientWa && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          WA: {inv.clientWa}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                        <code style={{
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem', color: 'var(--text-accent)',
                          display: 'block'
                        }}>
                          storykami.my.id/{inv.slug}
                        </code>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => { navigator.clipboard.writeText(`https://storykami.my.id/${inv.slug}`); showToast('Link disalin!', 'info'); }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                            title="Salin link"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copy
                          </button>
                          <a
                            href={`https://storykami.my.id/${inv.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', textDecoration: 'none' }}
                            title="Lihat undangan"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            Preview
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="col-hide-mobile">
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        {TEMPLATE_LABELS[inv.template || inv.data?.template] || inv.template || inv.data?.template || 'Floral 1'}
                      </span>
                    </td>
                    <td className="col-hide-mobile" style={{ fontSize: '0.78rem' }}>
                      {new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {/* Kirim WA */}
                        <button
                          title="Kirim via WhatsApp"
                          onClick={() => {
                            const link = `https://storykami.my.id/${inv.slug}`;
                            const text = encodeURIComponent(`Halo! Berikut link undangan digital pernikahan Anda:\n\n${link}\n\nTerima kasih telah mempercayakan StoryKami 💌`);
                            window.open(`https://wa.me/${inv.clientWa}?text=${text}`, '_blank');
                          }}
                          className="btn btn-sm btn-icon btn-success"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        </button>
                        {/* Edit */}
                        <button
                          title="Edit"
                          onClick={() => router.push(`/wim/dashboard/buat?edit=${inv.slug}`)}
                          style={{ background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex', transition: '0.2s' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {/* Hapus */}
                        <button
                          title="Hapus"
                          onClick={() => handleDelete(inv)}
                          className="btn btn-sm btn-icon btn-danger"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--danger-bg)', border: '2px solid var(--danger-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Hapus Undangan?</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Undangan <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.namaPasangan}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Batal
              </button>
              <button onClick={confirmDeleteAction} className="btn btn-danger" style={{ flex: 1, background: 'var(--danger)', color: '#fff' }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
