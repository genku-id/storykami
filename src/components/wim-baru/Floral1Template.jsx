'use client';
import React, { useState, useEffect } from 'react';
import BackgroundMusic from './BackgroundMusic';
import '@/app/wim/floral1.css';
import { defaultInvitationData, normalizeAcara } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';
import { getGoogleCalendarUrl } from '@/utils/calendarHelper';
import { parseDate, formatIndonesianDate } from '@/utils/dateHelper';
import WeddingGiftCard from './WeddingGiftCard';
import WeddingPhysicalGiftCard from './WeddingPhysicalGiftCard';

export default function Floral1Template({ data = defaultInvitationData, slug = 'test-slug', isVisible: isVisibleProp, guestName = '', isDemo: isDemoProp }) {
  const isDemo = Boolean(isDemoProp) || slug === 'demo' || slug === 'preview' || (typeof slug === 'string' && (slug.startsWith('demo') || slug.includes('demo'))) || (typeof window !== 'undefined' && window.location.pathname.startsWith('/demo'));
  const demoStorageKey = `storykami_demo_guestbook_${slug || 'demo'}`;
  const { mempelai, acara, kutipan, pageVisibility = {} } = data;
  const acaraList = normalizeAcara(acara);
  const mainEvent = acaraList.find(e => /resepsi/i.test(e.nama) && e.tanggal) || acaraList.find(e => e.tanggal) || acaraList[0];
  
  // Ambil nama tamu dari props atau URL (?to=... / ?u=... / ?nama=...)
  const [tamuName, setTamuName] = useState(guestName || 'Nama Tamu');
  const [comments, setComments] = useState([]);
  const [namaTamu, setNamaTamu] = useState(guestName || '');
  const [ucapan, setUcapan] = useState('');
  const [kehadiran, setKehadiran] = useState('Hadir');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (guestName) {
      setTamuName(guestName);
      setNamaTamu(guestName);
      return;
    }
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlGuest = sp.get('to') || sp.get('u') || sp.get('nama') || sp.get('guest');
      if (urlGuest && urlGuest.trim()) {
        const decoded = urlGuest.trim();
        setTamuName(decoded);
        setNamaTamu(decoded);
      } else {
        setTamuName('Nama Tamu');
      }
    }
  }, [guestName]);

  // State untuk Cover Lock dan Audio
  const [isLocked, setIsLocked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, menit: 0, detik: 0 });

  useEffect(() => {
    const tanggalAcara = mainEvent?.tanggal;
    const waktuAcara = mainEvent?.waktuMulai || '00:00';
    
    if (!tanggalAcara) return;

    const parsedTarget = parseDate(tanggalAcara, waktuAcara);
    if (!parsedTarget) return;

    const targetDate = parsedTarget.getTime();
    if (isNaN(targetDate)) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hari: 0, jam: 0, menit: 0, detik: 0 });
      } else {
        setTimeLeft({
          hari: Math.floor(distance / (1000 * 60 * 60 * 24)),
          jam: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          menit: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          detik: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [acara]);

  useEffect(() => {
    if (isDemo) {
      // Mode Demo: Ambil data ucapan khusus dari localStorage perangkat ini saja
      try {
        if (typeof window !== 'undefined') {
          const localData = localStorage.getItem(demoStorageKey);
          if (localData) {
            setComments(JSON.parse(localData));
          } else {
            setComments([]);
          }
        }
      } catch (err) {
        console.error('Gagal memuat guestbook demo:', err);
      }
      return;
    }

    // Fetch comments from Supabase guestbook untuk undangan live asli
    const fetchComments = async () => {
      if (!slug) return;
      const { data: dbComments } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_slug', slug)
        .order('created_at', { ascending: false });
      
      if (dbComments) {
        setComments(dbComments);
      }
    };
    fetchComments();
  }, [slug, isDemo, demoStorageKey]);

  // Observer untuk efek animasi saat scroll (data-animate)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [pageVisibility, data, isLocked]);

  const handleKonfirmasiHadir = async () => {
    if (!namaTamu || !namaTamu.trim()) {
      alert('Silakan masukkan nama Anda terlebih dahulu.');
      return;
    }
    setIsSubmitting(true);
    
    const newComment = {
      id: isDemo ? `demo-${Date.now()}` : undefined,
      invitation_slug: slug,
      nama: namaTamu.trim(),
      ucapan: ucapan ? ucapan.trim() : '',
      kehadiran: 'Hadir',
      created_at: new Date().toISOString()
    };

    if (isDemo) {
      try {
        if (typeof window !== 'undefined') {
          const currentList = JSON.parse(localStorage.getItem(demoStorageKey) || '[]');
          const updated = [newComment, ...currentList];
          localStorage.setItem(demoStorageKey, JSON.stringify(updated));
        }
        if (newComment.ucapan) {
          setComments(prev => [newComment, ...prev]);
          alert('Terima kasih! Konfirmasi kehadiran dan ucapan Anda berhasil dikirim (Mode Demo: Tersimpan di HP Anda).');
        } else {
          setComments(prev => [newComment, ...prev]);
          alert('Terima kasih! Konfirmasi kehadiran Anda berhasil disimpan (Mode Demo: Tersimpan di HP Anda).');
        }
        setUcapan('');
      } catch (e) {
        console.error('Error saving demo guestbook:', e);
      }
      setIsSubmitting(false);
      return;
    }
    
    const { data: inserted, error } = await supabase
      .from('guestbook')
      .insert([newComment])
      .select();
      
    if (!error && inserted && inserted.length > 0) {
      if (newComment.ucapan) {
        setComments(prev => [inserted[0], ...prev]);
        alert('Terima kasih! Konfirmasi kehadiran dan ucapan Anda berhasil dikirim.');
      } else {
        alert('Terima kasih! Konfirmasi kehadiran Anda berhasil disimpan.');
      }
      setUcapan('');
    } else {
      alert('Gagal mengirim konfirmasi kehadiran. Silakan coba lagi.');
    }
    setIsSubmitting(false);
  };

  const handleKirimUcapan = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!namaTamu || !namaTamu.trim()) {
      alert('Silakan masukkan nama Anda terlebih dahulu.');
      return;
    }
    if (!ucapan || !ucapan.trim()) {
      alert('Silakan tulis ucapan dan doa restu Anda terlebih dahulu.');
      return;
    }
    setIsSubmitting(true);
    
    const newComment = {
      id: isDemo ? `demo-${Date.now()}` : undefined,
      invitation_slug: slug,
      nama: namaTamu.trim(),
      ucapan: ucapan.trim(),
      kehadiran: 'Hadir',
      created_at: new Date().toISOString()
    };

    if (isDemo) {
      try {
        if (typeof window !== 'undefined') {
          const currentList = JSON.parse(localStorage.getItem(demoStorageKey) || '[]');
          const updated = [newComment, ...currentList];
          localStorage.setItem(demoStorageKey, JSON.stringify(updated));
        }
        setComments(prev => [newComment, ...prev]);
        alert('Terima kasih atas ucapan dan doa restunya! (Mode Demo: Tersimpan di HP Anda)');
        setUcapan('');
      } catch (e) {
        console.error('Error saving demo guestbook:', e);
      }
      setIsSubmitting(false);
      return;
    }
    
    const { data: inserted, error } = await supabase
      .from('guestbook')
      .insert([newComment])
      .select();
      
    if (!error && inserted && inserted.length > 0) {
      setComments(prev => [inserted[0], ...prev]);
      alert('Terima kasih atas ucapan dan doa restunya!');
      setUcapan('');
    } else {
      alert('Gagal mengirim ucapan. Silakan coba lagi.');
    }
    setIsSubmitting(false);
  };

  const isVisible = (key) => {
    if (isVisibleProp) return isVisibleProp(key);
    return pageVisibility[key] ?? true;
  };

  const handleBukaUndangan = () => {
    setIsLocked(false);
    setIsPlaying(true);
  };

  return (
    <div className={`wim-template-floral1 ${isLocked ? 'locked' : ''}`} style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#fdfbfb', overflow: isLocked ? 'hidden' : 'auto' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Background Music Player */}
      <BackgroundMusic url={data.musikUrl} isPlaying={isPlaying} start={data.musikStart} />

      {/* Cover Section */}
      {isVisible('cover') && (
        <section id="cover-page" className={`section cover-page text-center ${!isLocked ? 'slide-up' : ''}`}>
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
          <div className="floral-bottom-cover"></div>
          
          <div className="cover-content">
            <div className="monogram-large">
              <span className="mono-m"><span className="cover-slide-in-left">{mempelai?.wanita?.namaPanggilan?.charAt(0)}</span></span>
              <span className="mono-d"><span className="cover-slide-in-right">{mempelai?.pria?.namaPanggilan?.charAt(0)}</span></span>
            </div>
            <div className="wedding-text cover-fade-up-1">
              <p className="subtitle text-serif">The Wedding Of</p>
              <h2 className="title-names-cursive">{mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}</h2>
            </div>
            <div className="guest-info cover-fade-up-2">
              <p className="kepada-yth text-serif">Kepada Yth:</p>
              <h3 className="guest-name text-serif">{tamuName}</h3>
            </div>
            <button type="button" id="btn-open" className="btn-cover cover-fade-up-3" onClick={handleBukaUndangan}>
              <i className="fa-solid fa-envelope"></i> BUKA UNDANGAN
            </button>
          </div>
        </section>
      )}

      <main id="main-content" style={{ display: isLocked ? 'none' : 'block' }}>
        
        {/* Hero Section */}
        {isVisible('hero') && (
          <section id="hero" className="section hero-section">
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>
            <button id="btn-audio" className={`btn-audio ${isPlaying ? 'playing' : ''}`} onClick={() => setIsPlaying(!isPlaying)}>
              <i className={`fa-solid ${isPlaying ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
            </button>
            <div className="hero-content text-center">
              <div className="hero-image-container mb-4" data-animate="zoom-in">
                <img src="/assets/images/couple.png" alt="Couple" className="hero-couple-img" />
              </div>
              <h1 className="title-names text-sage mb-3 mt-4" data-animate="slide-right">
                {mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}
              </h1>
              <p className="date-highlight mb-4" data-animate="slide-left">
                {formatIndonesianDate(mainEvent?.tanggal, { withDay: false })}
              </p>
              <div className="countdown-container mb-4" data-animate="fade-up">
                <div className="countdown-item"><span>{String(timeLeft.hari).padStart(2, '0')}</span><p>Hari</p></div>
                <div className="countdown-item"><span>{String(timeLeft.jam).padStart(2, '0')}</span><p>Jam</p></div>
                <div className="countdown-item"><span>{String(timeLeft.menit).padStart(2, '0')}</span><p>Menit</p></div>
                <div className="countdown-item"><span>{String(timeLeft.detik).padStart(2, '0')}</span><p>Detik</p></div>
              </div>
              <a href={getGoogleCalendarUrl(data, slug, 'main')} target="_blank" rel="noreferrer" className="btn-secondary mt-4" style={{ textDecoration: 'none', transitionDelay: '0.4s' }} data-animate="fade-up">
                <i className="fa-regular fa-calendar-check"></i> Simpan di Kalender
              </a>
            </div>
            <div className="floral-bottom-hero"></div>
          </section>
        )}

        {/* Profiles Section */}
        {isVisible('profiles') && (
          <section id="profiles" className="section profiles-section">
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="floral-top-profiles"></div>
            <div className="profiles-content" data-animate="fade-up">
              <p className="greeting text-dark mb-4" style={{ fontSize: '0.85rem', lineHeight: 1.6, fontStyle: 'italic', color: '#000', marginBottom: 30 }}>
                <strong>Assalamu'alaikum Warahmatullahi Wabarakatuh</strong><br/><br/>
                Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu menyertai pernikahan putra-putri kami:
              </p>
              <div className="profile-card">
                <div data-animate="slide-long-right">
                  <div className="profile-avatar-wrapper">
                    <div className="avatar-circle">
                      <img src={mempelai?.wanita?.fotoUtama || "/assets/images/bride.png"} alt="Wanita" />
                    </div>
                  </div>
                </div>
                <h2 className="title-names mt-3" data-animate="fade-up">{mempelai?.wanita?.namaLengkap}</h2>
                <p className="parents" data-animate="fade-up">{mempelai?.wanita?.urutanAnak} dari<br/>{mempelai?.wanita?.namaAyah} &amp; {mempelai?.wanita?.namaIbu}</p>
                <a href={`https://instagram.com/${(mempelai?.wanita?.instagram || '').replace('@','')}`} target="_blank" rel="noreferrer" className="social-link" data-animate="fade-up">
                  <i className="fa-brands fa-instagram"></i> {mempelai?.wanita?.instagram}
                </a>
              </div>
              <div className="ampersand text-center" data-animate="zoom-in">&amp;</div>
              <div className="profile-card">
                <div data-animate="slide-long-left">
                  <div className="profile-avatar-wrapper">
                    <div className="avatar-circle">
                      <img src={mempelai?.pria?.fotoUtama || "/assets/images/groom.png"} alt="Pria" />
                    </div>
                  </div>
                </div>
                <h2 className="title-names mt-3" data-animate="fade-up">{mempelai?.pria?.namaLengkap}</h2>
                <p className="parents" data-animate="fade-up">{mempelai?.pria?.urutanAnak} dari<br/>{mempelai?.pria?.namaAyah} &amp; {mempelai?.pria?.namaIbu}</p>
                <a href={`https://instagram.com/${(mempelai?.pria?.instagram || '').replace('@','')}`} target="_blank" rel="noreferrer" className="social-link" data-animate="fade-up">
                  <i className="fa-brands fa-instagram"></i> {mempelai?.pria?.instagram}
                </a>
              </div>
            </div>
            <div className="floral-bottom-profiles"></div>
          </section>
        )}

        {/* Quote Section */}
        {isVisible('quote') && (
          <section id="quote" className="section quote-section bg-dark-blue">
            <div className="floral-corner floral-pattern-1 floral-middle-right"></div>
            <div className="floral-corner floral-pattern-1 floral-bottom-left-large"></div>
            <div className="quote-content" data-animate="fade-up">
              <div className="quote-image-card">
                <img src="/assets/images/couple.png" alt="Pasangan" className="quote-main-image" />
              </div>
              <div className="quote-text text-white mt-4">
                <h3>{kutipan?.sumber}</h3>
                <p className="translation mt-3">"{kutipan?.teks}"</p>
              </div>
            </div>
          </section>
        )}

        {/* Events Section */}
        {isVisible('events') && (
          <section id="events" className="section events-section">
            <div className="cloud cloud-1"></div>
            <div className="floral-top-profiles"></div>
            <div className="events-content">
              {acaraList.map((item, idx) => (
                <div key={item.id || idx} className={`event-card-pill bg-dark-blue ${idx > 0 ? 'mt-4' : ''}`} data-animate="zoom-in">
                  <div className="card-floral card-floral-tl"></div>
                  <div className="card-floral card-floral-mr"></div>
                  <div className="card-floral card-floral-bl"></div>
                  <h2 className="event-title text-white">{item.nama || `Acara #${idx + 1}`}</h2>
                  <p className="event-date">{formatIndonesianDate(item.tanggal, { withDay: true })}</p>
                  <p className="event-time">Pukul {item.waktuMulai} - {item.waktuSelesai} {item.zonaWaktu || 'WIB'}</p>
                  <div className="event-location-icon mt-4"><i className="fa-solid fa-map-location-dot fa-2x"></i></div>
                  <p className="event-location-name mt-2">{item.lokasi}</p>
                  <p className="event-address">{item.alamatLengkap}</p>
                  {item.linkMap && (
                    <a href={item.linkMap} target="_blank" rel="noreferrer" className="btn btn-maps mt-4">
                      <i className="fa-solid fa-location-dot"></i> Google Maps
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="floral-bottom-profiles"></div>
          </section>
        )}

        {/* Love Story Section */}
        {isVisible('loveStory') && data.ceritaCinta && data.ceritaCinta.length > 0 && (
          <section id="lovestory" className="section lovestory-section bg-dark-blue">
            <h2 className="section-title text-white text-center mb-5" data-animate="fade-up">Love Story</h2>
            <div className="story-frame" data-animate="zoom-in">
              {data.ceritaCinta.map((cerita, idx) => (
                <React.Fragment key={idx}>
                  <div className={`story-item ${idx % 2 === 0 ? 'story-left' : 'story-right'}`}>
                    <h3 className="story-title">{cerita.judul}</h3>
                    <p className="story-date">{cerita.tanggal}</p>
                    <p className="story-text">{cerita.cerita}</p>
                  </div>
                  {idx < data.ceritaCinta.length - 1 && (
                    <div className="story-divider"><i className="fa-solid fa-heart"></i></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {/* Gift Section */}
        {isVisible('gift') && (
          <section id="gift" className="section gift-section bg-dark-blue">
            <div className="gift-section-header text-center text-white mb-4" data-animate="fade-up" style={{ marginTop: '-30px' }}>
              <i className="fa-solid fa-gift fa-3x mb-2"></i>
              <h2 className="section-title text-white" style={{ color: 'white !important', fontSize: '1.5rem' }}>Wedding Gift</h2>
              <p className="mt-3 gift-description" style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless.</p>
            </div>
            
            <div className="gift-container" data-animate="zoom-in">
              {/* E-Wallet / Bank Accounts */}
              {data.hadiahDigital?.accounts?.map((acc, idx) => (
                <WeddingGiftCard
                  key={idx}
                  account={acc}
                  mempelai={mempelai}
                  fallbackWa={data.clientWa || data.hadiahDigital?.physicalWhatsapp}
                />
              ))}

              {/* Physical Gift */}
              {data.hadiahDigital?.physicalAddress && (
                <WeddingPhysicalGiftCard
                  hadiahDigital={data.hadiahDigital}
                  mempelai={mempelai}
                  fallbackWa={data.clientWa}
                />
              )}
            </div>
          </section>
        )}

        {/* Guestbook Section */}
        {isVisible('guestbook') && (
          <section id="guestbook" className="section guestbook-section bg-dark-blue">
            <div className="cloud cloud-1"></div><div className="cloud cloud-2"></div><div className="cloud cloud-3"></div>
            <div className="guestbook-header text-center mb-3" data-animate="fade-up">
              <h2 className="section-title mb-1" style={{ fontSize: '1.8rem', color: '#1a1a1a' }}>Ucapan &amp; Doa</h2>
              <p className="subtitle" style={{ fontSize: '0.85rem', color: '#1a1a1a', opacity: 0.9 }}>Berikan ucapan harapan dan doa kepada kedua mempelai</p>
            </div>
            <div className="guestbook-container" data-animate="zoom-in">
              <form className="guestbook-form" onSubmit={handleKirimUcapan}>
                <input type="text" className="form-control" placeholder="Nama Tamu" required value={namaTamu} onChange={e => setNamaTamu(e.target.value)} />
                <textarea className="form-control mt-2" rows="2" placeholder="Tulis ucapan dan doa restu..." maxLength="300" value={ucapan} onChange={e => setUcapan(e.target.value)}></textarea>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleKonfirmasiHadir}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#7c9b9f',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="fa-solid fa-circle-check"></i> Konfirmasi Hadir
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#2b5278',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <i className="fa-solid fa-paper-plane"></i> {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
                  </button>
                </div>
              </form>
              <div className="comments-wrapper mt-4">
                {(() => {
                  const visibleComments = comments.filter(c => c && c.ucapan && c.ucapan.trim() !== '');
                  return (
                    <>
                      <p className="comments-count text-dark mb-3" style={{ fontWeight: 600, fontSize: '0.95rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>
                        <i className="fa-solid fa-comments"></i> {visibleComments.length} Ucapan
                      </p>
                      <div className="comments-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {visibleComments.map((msg, i) => (
                          <div className="comment-item" key={msg.id || i}>
                            <img src="/assets/images/logo.png" className="comment-avatar-img" alt="Logo" />
                            <div className="comment-bubble">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <h4 className="comment-name" style={{ margin: 0 }}>
                                  {msg.nama} <i className="fa-solid fa-certificate text-gold"></i>
                                </h4>
                                {msg.kehadiran && (
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      backgroundColor: '#e6f4ea',
                                      color: '#137333',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <i className="fa-solid fa-circle-check"></i> {msg.kehadiran}
                                  </span>
                                )}
                              </div>
                              <p className="comment-text">{msg.ucapan}</p>
                              <small className="time text-muted">{new Date(msg.created_at).toLocaleDateString('id-ID')}</small>
                            </div>
                          </div>
                        ))}
                        {visibleComments.length === 0 && (
                          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>Belum ada ucapan.</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* Closing Section */}
        {isVisible('closing') && (
          <section 
            id="closing" 
            className="section closing-section text-center"
            style={{
              backgroundImage: `url(${data.penutupFoto || data.closingFoto || '/assets/images/couple.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top'
            }}
          >
            <div className="closing-gradient-overlay">
              <h1 
                className="title-names mb-2" 
                data-animate="fade-up" 
                style={{ fontSize: '3.5rem', color: '#1a1a1a', fontWeight: 700 }}
              >
                {data.penutupJudul || 'Terima Kasih'}
              </h1>
              <div 
                className="mt-2" 
                data-animate="fade-up" 
                style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#1a1a1a', maxWidth: '360px', margin: '0 auto', fontWeight: 500, whiteSpace: 'pre-line' }}
              >
                {data.penutup || (
                  <>
                    <p>Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.</p>
                    <p className="mt-3">Wassalamu'alaikum Wr. Wb.</p>
                  </>
                )}
              </div>
              <h1 
                id="closing-couple-names" 
                className="title-names mt-4" 
                data-animate="fade-up" 
                style={{ animationDelay: '0.2s', fontSize: '2.5rem', color: '#1a1a1a', fontWeight: 700 }}
              >
                {data.penutupMempelai || ((mempelai?.wanita?.namaPanggilan && mempelai?.pria?.namaPanggilan) ? `${mempelai.wanita.namaPanggilan} & ${mempelai.pria.namaPanggilan}` : 'Mempelai')}
              </h1>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="footer bg-sage-dark text-white text-center">
          <img src="/assets/images/logo.png" alt="StoryKami" className="footer-logo" />
          <h3>STORYKAMI</h3>
          <p className="subtitle">UNDANGAN DIGITAL</p>
          <p className="made-with mt-4">Made with <i className="fa-solid fa-heart text-red"></i> by StoryKami</p>
        </footer>

      </main>
    </div>
  );
}

