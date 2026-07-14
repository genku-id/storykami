'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const STATUS_LABELS = { active: 'Aktif', pending: 'Menunggu', suspended: 'Suspended' };

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  const [resellers, setResellers] = useState([]);
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('resellers');
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const sStr = localStorage.getItem('wim_session');
    if (!sStr) { router.replace('/wim/login'); return; }
    const s = JSON.parse(sStr);
    if (!s.isAdmin) {
      router.replace('/wim/dashboard');
      return;
    }
    setSession(s);
    loadData();
  }, [router]);

  const loadData = async () => {
    // Load resellers
    const { data: rsData } = await supabase
      .from('wim_users')
      .select('email, data');
    
    if (rsData) {
      const resellersOnly = rsData
        .filter(r => r.data?.role === 'reseller')
        .map(r => ({ dbEmail: r.email, ...r.data }));
      setResellers(resellersOnly);
    }

    // Load invitations count (excluding _reseller and _wim_admin)
    const { count } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .not('slug', 'like', '\\_%');
      
    if (count !== null) setInvitationsCount(count);
  };

  const handleLogout = () => {
    localStorage.removeItem('wim_session');
    router.replace('/wim/login');
  };

  const updateStatus = async (email, data, status) => {
    const newData = { ...data, status };
    const { error } = await supabase.from('wim_users').update({ data: newData }).eq('email', email);
    if (!error) {
      loadData();
      showToast(`Akun berhasil diubah ke ${STATUS_LABELS[status]}!`);
    } else {
      showToast('Terjadi kesalahan!', 'error');
    }
  };

  if (!session || !session.isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 24, height: 24, borderTopColor: 'var(--accent)', borderColor: 'rgba(0,0,0,0.1)' }} />
      </div>
    );
  }

  const filteredResellers = resellers.filter(r =>
    r.nama.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: resellers.length,
    active: resellers.filter(r => r.status === 'active').length,
    pending: resellers.filter(r => r.status === 'pending').length,
    invitations: invitationsCount,
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          {toast.msg}
        </div>
      )}

      <div className="page-container" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Admin Panel
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Kelola akses dan pendaftaran akun reseller
          </p>
        </div>
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Reseller', val: stats.total, color: 'var(--accent)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { label: 'Reseller Aktif', val: stats.active, color: 'var(--success)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
            { label: 'Menunggu Approve', val: stats.pending, color: '#f59e0b', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Total Undangan', val: stats.invitations, color: '#3b82f6', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> },
          ].map(s => (
            <div key={s.label} className="stat-card-item">
              <div className="stat-card-icon" style={{ fontSize: '1.8rem', color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-outfit)', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {[{ id: 'resellers', label: 'Daftar Reseller' }].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-outfit)',
                background: activeTab === t.id ? 'var(--accent-gradient)' : 'none',
                color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
                transition: '0.2s',
              }}
            >
              {t.label}
              {t.id === 'resellers' && stats.pending > 0 && (
                <span style={{ marginLeft: 6, background: '#f59e0b', color: '#000', borderRadius: 20, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 800 }}>
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---- RESELLERS TAB ---- */}
        {activeTab === 'resellers' && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', margin: 0 }}>Kelola Reseller</h2>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input type="text" className="wim-input" style={{ paddingLeft: 30, width: 200, fontSize: '0.82rem' }} placeholder="Cari reseller..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            {filteredResellers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--accent)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="empty-state-title">Belum ada reseller</div>
              </div>
            ) : (
              <div className="wim-table-wrapper">
                <table className="wim-table">
                  <thead>
                    <tr>
                      <th>Reseller</th>
                      <th className="col-hide-mobile">WhatsApp</th>
                      <th>Paket</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResellers.map(r => {
                      // Hapus atribut meta dari copy data untuk update
                      const { dbEmail, ...resellerData } = r;
                      return (
                        <tr key={dbEmail}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="col-hide-mobile" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.85rem', fontFamily: 'var(--font-outfit)', flexShrink: 0 }}>
                                {r.nama.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{r.nama}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="col-hide-mobile" style={{ fontSize: '0.85rem' }}>{r.wa}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.paket}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limit: {r.quota}</div>
                          </td>
                          <td>
                            <span className={`badge ${r.status === 'active' ? 'badge-active' : r.status === 'pending' ? 'badge-pending' : ''}`}
                              style={{ 
                                background: r.status === 'suspended' ? 'var(--danger-bg)' : '',
                                color: r.status === 'suspended' ? 'var(--danger)' : '',
                                border: r.status === 'suspended' ? '1px solid var(--danger-border)' : ''
                              }}>
                              {STATUS_LABELS[r.status]}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              {r.status === 'pending' && (
                                <button onClick={() => updateStatus(dbEmail, resellerData, 'active')} className="btn btn-sm btn-icon btn-success" title="Approve">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                                </button>
                              )}
                              {r.status === 'active' && (
                                <button onClick={() => updateStatus(dbEmail, resellerData, 'suspended')} className="btn btn-sm btn-icon btn-danger" title="Suspend">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                </button>
                              )}
                              {r.status === 'suspended' && (
                                <button onClick={() => updateStatus(dbEmail, resellerData, 'active')} className="btn btn-sm btn-icon btn-success" title="Reactivate">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10"/><path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14"/></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
