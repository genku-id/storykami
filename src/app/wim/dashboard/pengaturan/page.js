'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PengaturanPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [adminSettings, setAdminSettings] = useState({
    adminName: '',
    adminWa: '',
    waTemplate: 'Halo! Berikut adalah link undangan digital pernikahan kalian yang sudah siap:\n\n[LINK]\n\nTerima kasih telah mempercayakan StoryKami, [NAMA_ADMIN]!',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sStr = localStorage.getItem('wim_session');
    if (!sStr) { router.replace('/wim/login'); return; }
    const s = JSON.parse(sStr);
    setSession(s);
    const stored = localStorage.getItem(`wim_settings_${s.id}`);
    if (stored) setAdminSettings(JSON.parse(stored));
  }, [router]);

  const handleSave = () => {
    localStorage.setItem(`wim_settings_${session.id}`, JSON.stringify(adminSettings));
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!session) return null;

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      {saved && (
        <div className="toast toast-success">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Pengaturan berhasil disimpan!
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', marginBottom: 4 }}>
          Pengaturan Akun
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Atur informasi admin dan template pesan WhatsApp</p>
      </div>

      {/* Profil Akun */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profil Reseller
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.875rem' }}>
          {[
            ['Nama', session.nama],
            ['Email', session.email],
            ['No. WhatsApp', session.wa || '—'],
            ['Status', session.status],
            ['Paket', session.paket || 'Starter'],
            ['Bergabung', new Date(session.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k}</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {k === 'Status' ? (
                  <span className={`badge badge-${v}`}>{v === 'active' ? 'Aktif' : v}</span>
                ) : v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pengaturan WA */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Pesan WhatsApp
          </h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">Batal</button>
              <button onClick={handleSave} className="btn btn-primary btn-sm">Simpan</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="wim-label">Nama Admin (untuk pesan WA)</label>
            <input
              className="wim-input"
              placeholder="Nama kamu"
              value={adminSettings.adminName}
              onChange={e => setAdminSettings(p => ({ ...p, adminName: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="wim-label">No. WA Admin</label>
            <input
              className="wim-input"
              placeholder="628xxx"
              value={adminSettings.adminWa}
              onChange={e => setAdminSettings(p => ({ ...p, adminWa: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div className="form-group">
            <label className="wim-label">Template Pesan WA</label>
            <textarea
              className="wim-input"
              rows={5}
              value={adminSettings.waTemplate}
              onChange={e => setAdminSettings(p => ({ ...p, waTemplate: e.target.value }))}
              disabled={!isEditing}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Gunakan <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4 }}>[LINK]</code> dan <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4 }}>[NAMA_ADMIN]</code> sebagai variabel.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
