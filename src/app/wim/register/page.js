'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

function Orb({ style }) {
  return <div style={{
    position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.12,
    pointerEvents: 'none', animation: 'float 8s ease-in-out infinite', ...style,
  }} />;
}

const PAKET_LIST = [
  { id: 'starter', label: 'Starter', quota: 10, price: 'Rp 150.000', desc: '10 undangan / bulan' },
  { id: 'pro', label: 'Pro', quota: 30, price: 'Rp 350.000', desc: '30 undangan / bulan' },
  { id: 'business', label: 'Business', quota: 999, price: 'Rp 700.000', desc: 'Unlimited undangan' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: '', email: '', wa: '', password: '', confirmPassword: '',
  });
  const [selectedPaket, setSelectedPaket] = useState('starter');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('wim_session');
    if (session) router.replace('/wim/dashboard');
  }, [router]);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateStep1 = async () => {
    if (!formData.nama.trim()) return 'Nama lengkap wajib diisi.';
    if (!formData.email.trim()) return 'Email wajib diisi.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Format email tidak valid.';
    if (!formData.wa.trim()) return 'Nomor WhatsApp wajib diisi.';
    if (!formData.password) return 'Password wajib diisi.';
    if (formData.password.length < 6) return 'Password minimal 6 karakter.';
    if (formData.password !== formData.confirmPassword) return 'Konfirmasi password tidak cocok.';

    // Check if email already exists in supabase
    const slugKey = `_reseller_${formData.email.toLowerCase()}`;
    const { data } = await supabase.from('invitations').select('id').eq('slug', slugKey).single();
    if (data) return 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.';
    
    return null;
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    const err = await validateStep1();
    setIsLoading(false);
    if (err) { setError(err); return; }
    setStep(2);
    setError('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const paket = PAKET_LIST.find(p => p.id === selectedPaket);
    const slugKey = `_reseller_${formData.email.toLowerCase()}`;
    
    const newResellerData = {
      nama: formData.nama,
      email: formData.email.toLowerCase(),
      password: formData.password,
      wa: formData.wa,
      paket: paket.label,
      quota: paket.quota,
      status: 'pending',
      role: 'reseller',
      createdAt: new Date().toISOString()
    };

    const { error: sbError } = await supabase.from('invitations').insert([{
      slug: slugKey,
      data: newResellerData
    }]);

    setIsLoading(false);
    if (sbError) {
      setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      return;
    }
    setStep(3);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: 24,
    }}>
      <Orb style={{ width: 500, height: 500, background: 'var(--accent)', top: -150, left: -150 }} />
      <Orb style={{ width: 400, height: 400, background: 'var(--accent-2)', bottom: -100, right: -100, animationDelay: '4s' }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(var(--accent-glow) 1px,transparent 1px),linear-gradient(90deg,var(--accent-glow) 1px,transparent 1px)`,
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 10, animation: 'fadeIn 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/wim/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-accent)', overflow: 'hidden',
            }}>
              <img src="/logo.png" alt="StoryKami Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>
              StoryKami WIM
            </span>
          </a>
        </div>

        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.08)',
        }}>

          {/* STEP 1: Data Diri */}
          {step === 1 && (
            <div className="animate-fade">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>Daftar Jadi Reseller</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 24 }}>
                Sudah punya akun? <a href="/wim/login" style={{ color: 'var(--text-accent)', fontWeight: 600 }}>Masuk di sini</a>
              </p>

              {error && (
                <div style={{
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10,
                  padding: '11px 14px', marginBottom: 18, fontSize: '0.83rem', color: 'var(--danger)',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <svg style={{ flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="wim-label">Nama Lengkap</label>
                  <input name="nama" type="text" className="wim-input" placeholder="contoh: Budi Santoso" value={formData.nama} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="wim-label">Email</label>
                    <input name="email" type="email" className="wim-input" placeholder="email@kamu.com" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="wim-label">No. WhatsApp</label>
                    <input name="wa" type="text" className="wim-input" placeholder="628xxx" value={formData.wa} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="wim-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input name="password" type={showPass ? 'text' : 'password'} className="wim-input" placeholder="Min. 6 karakter" value={formData.password} onChange={handleChange} style={{ paddingRight: 42 }} />
                      <button type="button" onClick={() => setShowPass(v => !v)} style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="wim-label">Konfirmasi Password</label>
                    <input name="confirmPassword" type="password" className="wim-input" placeholder="Ulangi password" value={formData.confirmPassword} onChange={handleChange} />
                  </div>
                </div>

                <button onClick={handleNextStep} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  {isLoading ? 'Memeriksa...' : (
                    <>Lanjut Pilih Paket <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Pilih Paket */}
          {step === 2 && (
            <div className="animate-fade">
              <button onClick={() => setStep(1)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', marginBottom: 20, padding: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Kembali
              </button>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>Pilih Paket Reseller</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 24 }}>
                Setelah daftar, admin akan memverifikasi dan menyetujui akunmu.
              </p>

              {error && (
                <div style={{
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10,
                  padding: '11px 14px', marginBottom: 18, fontSize: '0.83rem', color: 'var(--danger)'
                }}>{error}</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {PAKET_LIST.map(paket => (
                  <div
                    key={paket.id}
                    onClick={() => setSelectedPaket(paket.id)}
                    style={{
                      border: `2px solid ${selectedPaket === paket.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: selectedPaket === paket.id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      borderRadius: 14, padding: 16, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{paket.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{paket.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{paket.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleSubmit} disabled={isLoading} className="btn btn-primary" style={{ width: '100%' }}>
                {isLoading ? <div className="spinner" /> : 'Selesaikan Pendaftaran'}
              </button>
            </div>
          )}

          {/* STEP 3: Berhasil */}
          {step === 3 && (
            <div className="animate-fade" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Pendaftaran Berhasil!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 32 }}>
                Terima kasih, <b>{formData.nama}</b>. Akun reseller Anda telah dibuat dan sedang menunggu persetujuan Admin.<br/><br/>
                Admin kami akan menghubungi Anda melalui WhatsApp di nomor <b>{formData.wa}</b> secepatnya.
              </p>
              <button onClick={() => router.push('/wim/login')} className="btn btn-primary" style={{ width: '100%' }}>
                Kembali ke Halaman Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
