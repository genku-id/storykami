'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const NAV_ITEMS = [
  {
    href: '/wim/dashboard', label: 'Beranda', exact: true,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    iconSm: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    href: '/wim/dashboard/pengaturan', label: 'Setelan', exact: false,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    iconSm: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [usedQuota, setUsedQuota] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSession = () => {
      const sStr = localStorage.getItem('wim_session');
      if (!sStr) { router.replace('/wim/login'); return; }
      const s = JSON.parse(sStr);
      
      // Set default quota if admin
      if (s.isAdmin) s.quota = 9999;
      setSession(s);
      
      // Fetch invitation count
      const fetchQuota = async () => {
        const { data } = await supabase.from('invitations').select('slug, data');
        if (data) {
          const validData = data.filter(inv => !inv.slug.startsWith('_'));
          if (s.isAdmin) {
            setUsedQuota(validData.length);
          } else {
            const used = validData.filter(inv => inv.data?.resellerEmail === s.email).length;
            setUsedQuota(used);
          }
        }
      };
      fetchQuota();

      // Sync latest profile data from database across devices
      const fetchLatestProfile = async () => {
        const slugKey = s.isAdmin ? '_wim_admin_settings' : `_reseller_${s.email.toLowerCase()}`;
        const { data } = await supabase.from('invitations').select('data').eq('slug', slugKey).single();
        if (data && data.data) {
          const updatedSession = { 
            ...s, 
            nama: data.data.nama || data.data.adminName || s.nama,
            foto: data.data.foto || s.foto
          };
          if (updatedSession.nama !== s.nama || updatedSession.foto !== s.foto) {
            setSession(updatedSession);
            localStorage.setItem('wim_session', JSON.stringify(updatedSession));
          }
        }
      };
      fetchLatestProfile();
    };
    
    fetchSession();
    
    window.addEventListener('wim_session_updated', fetchSession);
    return () => window.removeEventListener('wim_session_updated', fetchSession);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('wim_session');
    router.replace('/wim/login');
  };

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 24, height: 24, borderTopColor: 'var(--accent)', borderColor: 'rgba(0,0,0,0.1)' }} />
      </div>
    );
  }

  const quota = session?.isAdmin ? Infinity : (session?.quota || 0);
  const remaining = quota === Infinity ? Infinity : Math.max(0, quota - usedQuota);
  const quotaPct = quota === Infinity ? 0 : Math.min(100, (usedQuota / quota) * 100);
  const normalizedPath = pathname.replace(/\/$/, '');
  const isActive = (item) => item.exact ? normalizedPath === item.href : normalizedPath.startsWith(item.href);
  const isBuatActive = normalizedPath.startsWith('/wim/dashboard/buat') || normalizedPath.startsWith('/wim/dashboard/katalog');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>

      {/* ===== SIDEBAR OVERLAY (MOBILE) ===== */}
      {sidebarOpen && (
        <div className="wim-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* ===== DESKTOP / MOBILE SIDEBAR ===== */}
      <aside className={`wim-sidebar-el ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-accent)', flexShrink: 0, overflow: 'hidden' }}>
            <img src="/logo.png" alt="StoryKami Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', lineHeight: 1.2 }}>StoryKami</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>WIM Portal</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Menu</div>

          {/* 1. Beranda */}
          {NAV_ITEMS.filter(item => item.label === 'Beranda').map(item => (
            <a key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', fontWeight: isActive(item) ? 700 : 500, fontSize: '0.875rem',
              color: isActive(item) ? '#fff' : 'var(--text-secondary)',
              background: isActive(item) ? '#000' : 'transparent',
              boxShadow: isActive(item) ? 'var(--shadow-accent)' : 'none',
              transition: 'all 0.2s ease', fontFamily: 'var(--font-outfit)',
            }}>
              <span style={{ opacity: isActive(item) ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}

          {/* 2. Katalog Tema */}
          <a href="/wim/dashboard/katalog" onClick={() => setSidebarOpen(false)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
            textDecoration: 'none', fontWeight: isBuatActive ? 700 : 500, fontSize: '0.875rem',
            color: isBuatActive ? '#fff' : 'var(--text-secondary)',
            background: isBuatActive ? '#000' : 'transparent',
            border: 'none',
            boxShadow: isBuatActive ? 'var(--shadow-accent)' : 'none',
            transition: 'all 0.2s ease', fontFamily: 'var(--font-outfit)',
          }}>
            <span style={{ opacity: isBuatActive ? 1 : 0.8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            Katalog Tema
          </a>

          {/* 3. Admin Panel */}
          {session.isAdmin && (
            <a href="/wim/dashboard/admin" onClick={() => setSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', fontWeight: normalizedPath.startsWith('/wim/dashboard/admin') ? 700 : 500, fontSize: '0.875rem',
              color: normalizedPath.startsWith('/wim/dashboard/admin') ? '#fff' : 'var(--text-secondary)',
              background: normalizedPath.startsWith('/wim/dashboard/admin') ? '#000' : 'transparent',
              boxShadow: 'none',
              transition: 'all 0.2s ease', fontFamily: 'var(--font-outfit)',
            }}>
              <span style={{ opacity: normalizedPath.startsWith('/wim/dashboard/admin') ? 1 : 0.7 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              Admin Panel
            </a>
          )}

          {/* 4. Setelan */}
          {NAV_ITEMS.filter(item => item.label === 'Setelan').map(item => (
            <a key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', fontWeight: isActive(item) ? 700 : 500, fontSize: '0.875rem',
              color: isActive(item) ? '#fff' : 'var(--text-secondary)',
              background: isActive(item) ? '#000' : 'transparent',
              boxShadow: isActive(item) ? 'var(--shadow-accent)' : 'none',
              transition: 'all 0.2s ease', fontFamily: 'var(--font-outfit)',
            }}>
              <span style={{ opacity: isActive(item) ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Quota */}
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Kuota Undangan</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: remaining === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {usedQuota}/{quota === Infinity ? '∞' : quota}
              </span>
            </div>
            <div className="quota-bar" style={{ marginBottom: 6 }}>
              <div className="quota-fill" style={{ width: `${quotaPct}%`, background: quotaPct > 80 ? 'var(--danger)' : '#000' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {remaining === Infinity ? 'Tak terbatas' : (remaining > 0 ? `${remaining} slot tersedia` : 'Kuota habis')}
            </div>
          </div>
        </div>

        {/* User + Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: 'var(--font-outfit)', overflow: 'hidden' }}>
            {session.foto ? (
              <img src={session.foto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              session.nama?.charAt(0)?.toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.nama}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{session.paket || (session.isAdmin ? 'Supreme' : 'Starter')}</div>
          </div>
          <button onClick={handleLogout} title="Keluar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 6, transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ===== MOBILE FIXED TOP HEADER ===== */}
      <div className="wim-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="mob-menu-btn" onClick={() => setSidebarOpen(true)} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <img src="/logo.png" alt="StoryKami Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}>
            StoryKami WIM
          </span>
        </div>
        {/* Quota pill + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700, color: remaining === 0 ? 'var(--danger)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {usedQuota}/{quota === Infinity ? '∞' : quota}
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-outfit)', overflow: 'hidden' }}>
            {session.foto ? (
              <img src={session.foto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              session.nama?.charAt(0)?.toUpperCase()
            )}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="wim-page-offset" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}

