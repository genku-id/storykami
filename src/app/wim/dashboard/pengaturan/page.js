'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function PengaturanPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  
  // Admin WA Settings state
  const [adminSettings, setAdminSettings] = useState({
    adminName: '',
    adminWa: '',
    waTemplate: 'Halo! Berikut adalah link undangan digital pernikahan kalian yang sudah siap:\n\n[LINK]\n\nTerima kasih telah mempercayakan StoryKami, [NAMA_ADMIN]!',
  });
  
  // Profile DB state
  const [profileData, setProfileData] = useState({
    nama: '',
    email: '',
    wa: '',
    password: '',
    foto: '',
    status: 'active',
    paket: 'Starter',
    joinDate: new Date().toISOString()
  });
  
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  const [isEditingWa, setIsEditingWa] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [savedWa, setSavedWa] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    const sStr = localStorage.getItem('wim_session');
    if (!sStr) { router.replace('/wim/login'); return; }
    const s = JSON.parse(sStr);
    setSession(s);
    
    const stored = localStorage.getItem(`wim_settings_${s.email}`);
    if (stored) setAdminSettings(JSON.parse(stored));
    
    const fetchProfile = async () => {
      const slugKey = s.isAdmin ? '_wim_admin_settings' : `_reseller_${s.email.toLowerCase()}`;
      const { data, error } = await supabase.from('invitations').select('data').eq('slug', slugKey).single();
      if (data && data.data) {
        setProfileData({
          nama: data.data.nama || data.data.adminName || s.nama,
          email: data.data.email || s.email,
          wa: data.data.wa || s.wa || '',
          password: data.data.password || '',
          foto: data.data.foto || s.foto || '',
          status: data.data.status || s.status || 'active',
          paket: data.data.paket || s.paket || 'Starter',
          joinDate: data.data.joinDate || s.joinDate || new Date().toISOString()
        });
      } else {
        setProfileData(prev => ({ ...prev, nama: s.nama || '', email: s.email || '' }));
      }
    };
    fetchProfile();
  }, [router]);

  const handleSaveWa = () => {
    localStorage.setItem(`wim_settings_${session.email}`, JSON.stringify(adminSettings));
    setIsEditingWa(false);
    setSavedWa(true);
    setTimeout(() => setSavedWa(false), 2500);
  };

  const handleSaveProfile = async () => {
    setIsLoadingProfile(true);
    try {
      let newFotoUrl = profileData.foto;
      
      if (profilePhotoFile) {
        const fileExt = profilePhotoFile.name.split('.').pop();
        const fileName = `profile-${session.email.split('@')[0]}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('wim-assets').upload(fileName, profilePhotoFile);
        
        if (!uploadError) {
          const { data: pubData } = supabase.storage.from('wim-assets').getPublicUrl(fileName);
          newFotoUrl = pubData.publicUrl;
        }
      }

      const slugKey = session.isAdmin ? '_wim_admin_settings' : `_reseller_${session.email.toLowerCase()}`;
      const { data: existingRow } = await supabase.from('invitations').select('data').eq('slug', slugKey).single();
      const existingData = existingRow?.data || {};

      const updatedData = {
        ...existingData,
        nama: profileData.nama,
        password: profileData.password,
        foto: newFotoUrl,
      };

      await supabase.from('invitations').update({ data: updatedData }).eq('slug', slugKey);
      
      setProfileData(prev => ({ ...prev, foto: newFotoUrl }));
      setProfilePhotoFile(null);
      setIsEditingProfile(false);
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2500);
      
      const updatedSession = { ...session, nama: profileData.nama, foto: newFotoUrl };
      localStorage.setItem('wim_session', JSON.stringify(updatedSession));
      setSession(updatedSession);
      
      // Dispatch custom event to let layout know session updated
      window.dispatchEvent(new Event('wim_session_updated'));
      
    } catch (err) {
      console.error(err);
    }
    setIsLoadingProfile(false);
  };

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  if (!session) return null;

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      {(savedWa || savedProfile) && (
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profil
          </h2>
          {!isEditingProfile ? (
            <button onClick={() => setIsEditingProfile(true)} className="btn btn-secondary btn-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                setIsEditingProfile(false);
                setProfilePhotoFile(null);
                setProfilePhotoPreview(null);
              }} className="btn btn-secondary btn-sm" disabled={isLoadingProfile}>Batal</button>
              <button onClick={handleSaveProfile} className="btn btn-primary btn-sm" disabled={isLoadingProfile}>
                {isLoadingProfile ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          )}
        </div>

        {/* View Mode */}
        {!isEditingProfile && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Foto */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--border)', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--bg-card)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              {profileData.foto ? (
                <img src={profileData.foto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.875rem', minWidth: 280 }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Nama</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{profileData.nama}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Email</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{profileData.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Status</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  <span className={`badge badge-${profileData.status}`}>{profileData.status === 'active' ? 'Aktif' : profileData.status}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Paket</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{profileData.paket}</div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditingProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Foto Upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--border)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {(profilePhotoPreview || profileData.foto) ? (
                  <img src={profilePhotoPreview || profileData.foto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </div>
              <div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Unggah Foto
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Format JPG/PNG. Maksimal 1MB.</div>
              </div>
            </div>

            <div className="form-group">
              <label className="wim-label">Nama Lengkap</label>
              <input
                className="wim-input"
                value={profileData.nama}
                onChange={e => setProfileData(p => ({ ...p, nama: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label className="wim-label">Email</label>
              <input
                className="wim-input"
                value={profileData.email}
                readOnly
                style={{ opacity: 0.7, backgroundColor: 'var(--bg-card)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="wim-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="wim-input"
                  value={profileData.password}
                  onChange={e => setProfileData(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pengaturan WA */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Pesan WhatsApp
          </h2>
          {!isEditingWa ? (
            <button onClick={() => setIsEditingWa(true)} className="btn btn-secondary btn-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsEditingWa(false)} className="btn btn-secondary btn-sm">Batal</button>
              <button onClick={handleSaveWa} className="btn btn-primary btn-sm">Simpan</button>
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
              disabled={!isEditingWa}
            />
          </div>
          <div className="form-group">
            <label className="wim-label">No. WA Admin</label>
            <input
              className="wim-input"
              placeholder="628xxx"
              value={adminSettings.adminWa}
              onChange={e => setAdminSettings(p => ({ ...p, adminWa: e.target.value }))}
              disabled={!isEditingWa}
            />
          </div>
          <div className="form-group">
            <label className="wim-label">Template Pesan WA</label>
            <textarea
              className="wim-input"
              rows={5}
              value={adminSettings.waTemplate}
              onChange={e => setAdminSettings(p => ({ ...p, waTemplate: e.target.value }))}
              disabled={!isEditingWa}
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
