'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

// Floating orb component for background
function Orb({ style }) {
  return <div style={{
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.15,
    pointerEvents: 'none',
    animation: 'float 8s ease-in-out infinite',
    ...style,
  }} />;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('wim_session');
    if (session) router.replace('/wim/dashboard');
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // 1. Cek apakah ini login Admin
      const { data: adminData } = await supabase.from('invitations').select('data').eq('slug', '_wim_admin_settings').single();
      
      let dbAdminEmail = 'admin@storykami.com';
      let dbAdminPass = 'admin123';
      
      if (adminData && adminData.data) {
        if (adminData.data.email) dbAdminEmail = adminData.data.email;
        if (adminData.data.password) dbAdminPass = adminData.data.password;
      }
      
      if (email.toLowerCase() === dbAdminEmail.toLowerCase() && password === dbAdminPass) {
        localStorage.setItem('wim_session', JSON.stringify({ 
          email: dbAdminEmail, 
          nama: adminData?.data?.adminName || 'Admin SK',
          role: 'admin',
          isAdmin: true
        }));
        router.replace('/wim/dashboard/admin'); // Admin goes directly to admin panel within dashboard
        setIsLoading(false);
        return;
      }

      // 2. Jika bukan admin, cek apakah ini login Reseller
      const slugKey = `_reseller_${email.toLowerCase()}`;
      const { data: resellerRow } = await supabase.from('invitations').select('data').eq('slug', slugKey).single();

      if (resellerRow && resellerRow.data) {
        const reseller = resellerRow.data;
        if (reseller.password === password) {
          // Cek status
          if (reseller.status === 'pending') {
            setError('Akun Anda masih menunggu persetujuan Admin.');
          } else if (reseller.status === 'suspended') {
            setError('Akun Anda ditangguhkan. Silakan hubungi Admin.');
          } else if (reseller.status === 'active') {
            localStorage.setItem('wim_session', JSON.stringify({ 
              email: reseller.email, 
              nama: reseller.nama,
              role: 'reseller',
              quota: reseller.quota,
              paket: reseller.paket,
              isAdmin: false
            }));
            router.replace('/wim/dashboard');
          } else {
            setError('Status akun tidak valid.');
          }
        } else {
          setError('Email atau password salah.');
        }
      } else {
        setError('Email atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan server.');
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
      padding: '16px',
    }}>
      {/* Background orbs */}
      <Orb style={{ width: 600, height: 600, background: 'var(--accent)', top: -200, right: -200 }} />
      <Orb style={{ width: 400, height: 400, background: 'var(--accent-2)', bottom: -100, left: -100, animationDelay: '3s' }} />
      <Orb style={{ width: 300, height: 300, background: 'var(--accent-3)', top: '40%', left: '40%', animationDelay: '5s' }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(var(--accent-glow) 1px, transparent 1px),
          linear-gradient(90deg, var(--accent-glow) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Login card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 10,
        animation: 'fadeIn 0.5s ease forwards',
      }}>
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '18px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-accent)',
            overflow: 'hidden',
          }}>
            <img src="/logo.png" alt="StoryKami Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontFamily: 'var(--font-outfit)' }}>
            StoryKami WIM
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Wedding Invitation Manager • Reseller Portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
            Masuk ke Akun
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            Belum punya akun?{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              Akses terbatas untuk Admin.
            </span>
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '0.85rem',
              color: 'var(--danger)',
              animation: 'fadeIn 0.3s ease',
            }}>
              <svg style={{ flexShrink: 0, marginTop: 1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div className="form-group">
              <label className="wim-label">Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="wim-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="email@kamu.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="wim-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="wim-input"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    padding: 4, display: 'flex',
                  }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ marginTop: 8, width: '100%' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Demo account hint */}
          <div style={{
            marginTop: 24,
            padding: '12px 14px',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 10,
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-accent)', fontWeight: 600, marginBottom: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              Info Login Admin
            </div>
            Jika Anda belum mengubahnya, gunakan:<br/>
            Email: <code style={{ color: 'var(--text-primary)', background: 'var(--bg-input)', padding: '1px 6px', borderRadius: 4 }}>admin@storykami.com</code><br/>
            Password: <code style={{ color: 'var(--text-primary)', background: 'var(--bg-input)', padding: '1px 6px', borderRadius: 4 }}>admin123</code>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 20 }}>
          © 2026 StoryKami · All rights reserved
        </p>
      </div>
    </div>
  );
}
