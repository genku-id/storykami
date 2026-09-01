'use client';
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import '@/app/wim/jawa.css';
import { defaultInvitationData } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';

export default function JawaTemplate({ data = defaultInvitationData, slug = 'test-slug', isVisible: isVisibleProp }) {
  const { mempelai, acara, kutipan, pageVisibility = {} } = data;
  
  // Gunakan state untuk comments (ucapan)
  const [comments, setComments] = useState([]);
  const [namaTamu, setNamaTamu] = useState('');
  const [ucapan, setUcapan] = useState('');
  const [kehadiran, setKehadiran] = useState('Hadir');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Cover Lock dan Audio
  const [isLocked, setIsLocked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, menit: 0, detik: 0 });

  useEffect(() => {
    const tanggalAcara = acara?.resepsi?.tanggal || acara?.akad?.tanggal;
    const waktuAcara = acara?.resepsi?.waktuMulai || acara?.akad?.waktuMulai || '00:00';
    
    if (!tanggalAcara) return;

    const targetDate = new Date(`${tanggalAcara}T${waktuAcara}:00`).getTime();
    
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
    // Fetch comments from Supabase guestbook
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
  }, [slug]);

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

  const handleKirimUcapan = async (e) => {
    e.preventDefault();
    if (!namaTamu || !ucapan) return;
    setIsSubmitting(true);
    
    const newComment = {
      invitation_slug: slug,
      nama: namaTamu,
      ucapan: ucapan,
      kehadiran: kehadiran
    };
    
    const { data: inserted, error } = await supabase
      .from('guestbook')
      .insert([newComment])
      .select();
      
    if (!error && inserted) {
      setComments(prev => [inserted[0], ...prev]);
      setNamaTamu('');
      setUcapan('');
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
    <div className={`wim-template-jawa ${isLocked ? 'locked' : ''}`} style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#2c2c2c', overflow: isLocked ? 'hidden' : 'auto' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{`
        @keyframes pulseFrame { 0%, 100% { transform: scale(1.2); } 50% { transform: scale(1.25); } }
        @keyframes pulseCloudLeft { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes pulseCloudRight { 0%, 100% { transform: scale(-1, 1); } 50% { transform: scale(-1.15, 1.15); } }
      `}</style>

      {/* Hidden Audio Player */}
      {data.musikUrl && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', zIndex: -1 }}>
          <ReactPlayer 
            url={data.musikUrl} 
            playing={isPlaying} 
            loop={true} 
            volume={0.5} 
            width="10px" height="10px"
            config={{
              youtube: {
                playerVars: { autoplay: 1, controls: 0 }
              }
            }}
          />
        </div>
      )}

      {/* Cover Section */}
      {isVisible('cover') && (
        <section id="cover-page" className="section cover-page text-center">
            <div className="jawa-top-border"></div>
            
            <div className="jawa-gunungan-container">
                <img src="/assets/images/cloud_jawa.webp" className="jawa-cloud left" alt="cloud" />
                <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan left" alt="gunungan" />
                
                <div className="hero-arch-frame">
                    <img src={data.galeri?.[0] || "/assets/images/couple.png"} alt="Couple" className="hero-couple-img" />
                </div>
                
                <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan right" alt="gunungan" />
                <img src="/assets/images/cloud_jawa.webp" className="jawa-cloud right" alt="cloud" />
            </div>

            <div className="cover-content">
                <div className="wedding-text cover-fade-up-1" style={{ marginTop: 0 }}>
                    <p className="subtitle text-serif" style={{ fontSize: '0.9rem', color: '#2a2a2a', marginBottom: '2px' }}>The Wedding Of</p>
                    <h2 className="title-names-cursive" style={{ fontFamily: '"Oleo Script", cursive', color: '#2a2a2a', marginBottom: '15px', fontSize: '3rem' }}>
                      {mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}
                    </h2>
                </div>
                
                <div className="guest-info cover-fade-up-2 mt-4" style={{ color: '#2a2a2a' }}>
                    <p className="kepada-yth text-serif" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '5px' }}>Kepada Yth:</p>
                    <h3 className="guest-name text-serif" style={{ fontSize: '1.2rem', marginBottom: '5px', fontWeight: 500 }}>Nama Tamu</h3>
                    <p className="text-serif" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ditempat</p>
                </div>
                
                <button type="button" id="btn-open" className="btn-cover cover-fade-up-3" onClick={handleBukaUndangan} style={{ marginTop: '30px', backgroundColor: '#4e342e', border: '1px solid #4e342e', color: '#fdf5e6', borderRadius: '30px', padding: '6px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s' }}>
                    <i className="fa-solid fa-envelope"></i> BUKA UNDANGAN
                </button>
            </div>

            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
        </section>
      )}

      <main id="main-content" style={{ display: isLocked ? 'none' : 'block' }}>
        
        {/* Hero Section */}
        {isVisible('hero') && (
          <section id="hero" className="section hero-section">
            <div className="jawa-top-border"></div>
            
            <div className="jawa-gunungan-container" style={{ marginTop: '-15px' }}>
                <img src="/assets/images/cloud_jawa.webp" className="jawa-cloud left" alt="cloud" />
                <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan left" alt="gunungan" />
                
                <div className="hero-arch-frame">
                    <img src={data.galeri?.[0] || "/assets/images/couple.png"} alt="Couple" className="hero-couple-img" />
                </div>
                
                <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan right" alt="gunungan" />
                <img src="/assets/images/cloud_jawa.webp" className="jawa-cloud right" alt="cloud" />
            </div>
            
            <button id="btn-audio" className={`btn-audio visible ${isPlaying ? 'playing' : ''}`} onClick={() => setIsPlaying(!isPlaying)}>
              <i className={`fa-solid ${isPlaying ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
            </button>

            <div className="hero-content text-center">
                <div className="wedding-text" data-animate="fade-up" style={{ marginTop: '5px', width: '100%' }}>
                    <p className="subtitle text-serif" style={{ fontSize: '0.85rem', color: '#2a2a2a', marginBottom: '2px' }}>The Wedding Of</p>
                    <h2 className="title-names-cursive" style={{ fontFamily: '"Oleo Script", cursive', color: '#2a2a2a', marginBottom: '12px', fontSize: '3rem' }}>
                      {mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}
                    </h2>
                    <p className="intro-text text-serif" style={{ fontSize: '0.85rem', color: '#2a2a2a', maxWidth: '360px', margin: '5px auto 20px auto', lineHeight: '1.5', fontWeight: 500 }}>
                        Dengan segala kerendahan hati kami berharap kehadiran Bapak/Ibu/Saudara/i dalam acara pernikahan kami yang akan diselenggarakan pada :
                    </p>
                </div>
                <p className="date-highlight mb-4" style={{ color: '#2a2a2a', fontWeight: 600, textAlign: 'center', width: '100%', display: 'block', margin: '25px auto 0 auto', fontSize: '1rem', fontFamily: '"Playfair Display", serif' }}>
                  {acara?.akad?.tanggal ? new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
                
                <div className="countdown-container" data-animate="fade-up" style={{ transitionDelay: '0.2s', display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px', marginTop: '5px' }}>
                    <div className="countdown-item style-dark">
                        <span>{String(timeLeft.hari).padStart(2, '0')}</span><p>Hari</p>
                    </div>
                    <div className="countdown-item style-dark">
                        <span>{String(timeLeft.jam).padStart(2, '0')}</span><p>Jam</p>
                    </div>
                    <div className="countdown-item style-dark">
                        <span>{String(timeLeft.menit).padStart(2, '0')}</span><p>Menit</p>
                    </div>
                    <div className="countdown-item style-dark">
                        <span>{String(timeLeft.detik).padStart(2, '0')}</span><p>Detik</p>
                    </div>
                </div>
                
                <a href={acara?.akad?.linkMap || '#'} target="_blank" rel="noreferrer" className="btn-cover" style={{ margin: '0 auto', display: 'block', width: 'fit-content', backgroundColor: '#4e342e', border: '1px solid #4e342e', color: '#fdf5e6', borderRadius: '30px', padding: '6px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s', textDecoration: 'none' }}>
                    <i className="fa-regular fa-calendar-check"></i> SIMPAN DI KALENDER
                </a>
            </div>
            
            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
          </section>
        )}

        {/* Quote Section */}
        {isVisible('quote') && (
          <section id="quote" className="section quote-section">
            <div className="jawa-top-border"></div>
            <div className="quote-content-wrapper">
                <div className="quote-text text-center" data-animate="fade-up">
                    <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#2a2a2a', marginBottom: '15px', fontWeight: 600, textAlign: 'center' }}>{kutipan?.sumber}</h3>
                    <p className="translation" style={{ fontSize: '0.85rem', color: '#2a2a2a', fontWeight: 500, fontFamily: '"Lora", serif', lineHeight: '1.6', textAlign: 'center' }}>"{kutipan?.teks}"</p>
                </div>
            </div>
            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
          </section>
        )}

        {/* Profiles Section */}
        {isVisible('profiles') && (
          <section id="profiles" className="section profiles-section">
            <div className="jawa-top-border"></div>
            <div className="profiles-content-wrapper">
                <p className="greeting text-dark" style={{ fontSize: '0.85rem', lineHeight: '1.6', fontStyle: 'italic', color: '#000', textAlign: 'center', marginBottom: '10px', marginTop: 0 }}>
                    <strong>Assalamu'alaikum Warahmatullahi Wabarakatuh</strong><br/><br/>
                    Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu menyertai pernikahan putra-putri kami:
                </p>

                {/* Bride */}
                <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div data-animate="slide-long-right">
                        <div className="jawa-gunungan-container" style={{ marginTop: '80px', marginBottom: 0, transformOrigin: 'center', animation: 'pulseFrame 4s infinite ease-in-out' }}>
                            <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan left" alt="gunungan" />
                            <div className="hero-arch-frame">
                                <img src={mempelai?.wanita?.fotoUtama || "/assets/images/bride.png"} alt="Wanita" className="hero-couple-img" />
                            </div>
                            <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan right" alt="gunungan" />
                        </div>
                    </div>
                    <h2 className="title-names" data-animate="fade-up" style={{ transitionDelay: '0.2s', marginTop: '5px', marginBottom: '2px', fontFamily: '"Oleo Script", cursive', color: '#2a2a2a', fontSize: '3rem' }}>{mempelai?.wanita?.namaPanggilan}</h2>
                    <a href={`https://instagram.com/${(mempelai?.wanita?.instagram || '').replace('@','')}`} target="_blank" rel="noreferrer" className="social-link" data-animate="fade-up" style={{ transitionDelay: '0.3s', display: 'inline-block', backgroundColor: '#4a2c16', color: '#ffffff', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, marginBottom: '5px', position: 'relative', zIndex: 10 }}><i className="fa-brands fa-instagram"></i> {mempelai?.wanita?.instagram}</a>
                    <p className="parents" data-animate="fade-up" style={{ transitionDelay: '0.4s', marginBottom: '30px', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '0.95rem' }}>{mempelai?.wanita?.urutanAnak} dari<br/>{mempelai?.wanita?.namaAyah} &amp; {mempelai?.wanita?.namaIbu}</p>
                </div>

                <div className="ampersand text-center" data-animate="zoom-in" style={{ margin: '0px auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '95%', gap: '15px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(74, 44, 22, 0.3)', position: 'relative' }}>
                        <img src="/assets/images/cloud_jawa.webp" alt="awan" style={{ position: 'absolute', left: '0px', top: '4px', width: '100px', animation: 'pulseCloudLeft 3s infinite ease-in-out' }} />
                    </div>
                    <span style={{ fontFamily: '"Oleo Script", cursive', color: '#4a2c16', position: 'relative', zIndex: 2, fontSize: '3rem' }}>&amp;</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(74, 44, 22, 0.3)', position: 'relative' }}>
                        <img src="/assets/images/cloud_jawa.webp" alt="awan" style={{ position: 'absolute', right: '0px', bottom: '4px', width: '100px', transform: 'scale(-1, 1)', animation: 'pulseCloudRight 3s infinite ease-in-out' }} />
                    </div>
                </div>

                {/* Groom */}
                <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div data-animate="slide-long-left">
                        <div className="jawa-gunungan-container" style={{ marginTop: '90px', marginBottom: 0, transformOrigin: 'center', animation: 'pulseFrame 4s infinite ease-in-out' }}>
                            <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan left" alt="gunungan" />
                            <div className="hero-arch-frame">
                                <img src={mempelai?.pria?.fotoUtama || "/assets/images/groom.png"} alt="Pria" className="hero-couple-img" />
                            </div>
                            <img src="/assets/images/gunungan_jawa.webp" className="jawa-gunungan right" alt="gunungan" />
                        </div>
                    </div>
                    <h2 className="title-names" data-animate="fade-up" style={{ transitionDelay: '0.2s', marginTop: '5px', marginBottom: '2px', fontFamily: '"Oleo Script", cursive', color: '#2a2a2a', fontSize: '3rem' }}>{mempelai?.pria?.namaPanggilan}</h2>
                    <a href={`https://instagram.com/${(mempelai?.pria?.instagram || '').replace('@','')}`} target="_blank" rel="noreferrer" className="social-link" data-animate="fade-up" style={{ transitionDelay: '0.3s', display: 'inline-block', backgroundColor: '#4a2c16', color: '#ffffff', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, marginBottom: '5px', position: 'relative', zIndex: 10 }}><i className="fa-brands fa-instagram"></i> {mempelai?.pria?.instagram}</a>
                    <p className="parents" data-animate="fade-up" style={{ transitionDelay: '0.4s', marginBottom: '100px', fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '0.95rem' }}>{mempelai?.pria?.urutanAnak} dari<br/>{mempelai?.pria?.namaAyah} &amp; {mempelai?.pria?.namaIbu}</p>
                </div>
            </div>
            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
          </section>
        )}

        {/* Event Details Section */}
        {isVisible('events') && (
          <section id="events" className="section events-section" style={{ background: 'radial-gradient(circle, #b8a18a 0%, #9e816a 100%)', position: 'relative', overflow: 'hidden', paddingBottom: '90px' }}>
            <div className="jawa-top-border"></div>
            <div className="events-content" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '45px', marginBottom: '100px' }}>
                
                {/* Akad Nikah */}
                <div className="profile-container text-center" data-animate="zoom-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'radial-gradient(circle, #dfcfb9 0%, #b8a18a 100%)', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '20px', padding: '25px 15px', maxWidth: '580px', margin: '0 auto', width: 'calc(100% - 50px)', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
                    <i className="fa-solid fa-ring" style={{ fontSize: '1.8rem', color: '#2a2a2a', marginBottom: '10px' }}></i>
                    <h2 className="title-names-serif" style={{ fontFamily: '"Oleo Script", cursive', color: '#2a2a2a', marginBottom: '15px', fontSize: '3rem' }}>Akad Nikah</h2>
                    <div className="event-date-grid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '15px', fontFamily: '"Playfair Display", serif' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2a2a2a' }}>
                          {acara?.akad?.tanggal ? new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }) : ''}
                        </span>
                        <div style={{ width: '1px', height: '45px', backgroundColor: '#2a2a2a' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2a2a2a', lineHeight: 1 }}>
                              {acara?.akad?.tanggal ? new Date(acara.akad.tanggal).getDate() : ''}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2a2a2a', marginTop: '3px' }}>
                              {acara?.akad?.tanggal ? new Date(acara.akad.tanggal).getFullYear() : ''}
                            </span>
                        </div>
                        <div style={{ width: '1px', height: '45px', backgroundColor: '#2a2a2a' }}></div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2a2a2a' }}>
                          {acara?.akad?.tanggal ? new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { month: 'long' }) : ''}
                        </span>
                    </div>
                    <p className="event-time" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.1rem', color: '#2a2a2a', marginBottom: '10px' }}>
                      Pukul {acara?.akad?.waktuMulai} - {acara?.akad?.waktuSelesai} {acara?.akad?.zonaWaktu}
                    </p>
                    <div className="event-location-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                        <img src="/assets/images/cloud_jawa.webp" alt="awan" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '80px', opacity: 0.9, zIndex: 0 }} />
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 700, color: '#2a2a2a', marginBottom: '2px' }}>Lokasi</p>
                            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: 700, color: '#2a2a2a', marginBottom: 0 }}>{acara?.akad?.lokasi}</p>
                        </div>
                    </div>
                    <p className="event-address" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: '#2a2a2a', lineHeight: '1.5', marginBottom: '20px', marginTop: 0, padding: '0 10px', textAlign: 'center' }}>{acara?.akad?.alamatLengkap}</p>
                    <a href={acara?.akad?.linkMap} target="_blank" rel="noreferrer" className="btn btn-maps" style={{ display: 'inline-block', backgroundColor: '#4a2c16', color: '#ffffff', padding: '8px 22px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}><i className="fa-solid fa-location-dot"></i> Google Maps</a>
                </div>

                {/* Resepsi */}
                <div className="profile-container text-center" data-animate="zoom-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'radial-gradient(circle, #dfcfb9 0%, #b8a18a 100%)', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '20px', padding: '25px 15px', maxWidth: '580px', margin: '0 auto', width: 'calc(100% - 50px)', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
                    <i className="fa-solid fa-rose" style={{ fontSize: '1.8rem', color: '#2a2a2a', marginBottom: '10px' }}></i>
                    <h2 className="title-names-serif" style={{ fontFamily: '"Oleo Script", cursive', color: '#2a2a2a', marginBottom: '15px', fontSize: '3rem' }}>Resepsi</h2>
                    <div className="event-date-grid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '15px', fontFamily: '"Playfair Display", serif' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2a2a2a' }}>
                          {acara?.resepsi?.tanggal ? new Date(acara.resepsi.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }) : ''}
                        </span>
                        <div style={{ width: '1px', height: '45px', backgroundColor: '#2a2a2a' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2a2a2a', lineHeight: 1 }}>
                              {acara?.resepsi?.tanggal ? new Date(acara.resepsi.tanggal).getDate() : ''}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2a2a2a', marginTop: '3px' }}>
                              {acara?.resepsi?.tanggal ? new Date(acara.resepsi.tanggal).getFullYear() : ''}
                            </span>
                        </div>
                        <div style={{ width: '1px', height: '45px', backgroundColor: '#2a2a2a' }}></div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2a2a2a' }}>
                          {acara?.resepsi?.tanggal ? new Date(acara.resepsi.tanggal).toLocaleDateString('id-ID', { month: 'long' }) : ''}
                        </span>
                    </div>
                    <p className="event-time" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.1rem', color: '#2a2a2a', marginBottom: '10px' }}>
                      Pukul {acara?.resepsi?.waktuMulai} - {acara?.resepsi?.waktuSelesai} {acara?.resepsi?.zonaWaktu}
                    </p>
                    <div className="event-location-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                        <img src="/assets/images/cloud_jawa.webp" alt="awan" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '80px', opacity: 0.9, zIndex: 0 }} />
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 700, color: '#2a2a2a', marginBottom: '2px' }}>Lokasi</p>
                            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: 700, color: '#2a2a2a', marginBottom: 0 }}>{acara?.resepsi?.lokasi}</p>
                        </div>
                    </div>
                    <p className="event-address" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: '#2a2a2a', lineHeight: '1.5', marginBottom: '20px', marginTop: 0, padding: '0 10px', textAlign: 'center' }}>{acara?.resepsi?.alamatLengkap}</p>
                    <a href={acara?.resepsi?.linkMap} target="_blank" rel="noreferrer" className="btn btn-maps" style={{ display: 'inline-block', backgroundColor: '#4a2c16', color: '#ffffff', padding: '8px 22px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}><i className="fa-solid fa-location-dot"></i> Google Maps</a>
                </div>
            </div>
            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
          </section>
        )}

        {/* Love Story Section */}
        {isVisible('loveStory') && data.ceritaCinta && data.ceritaCinta.length > 0 && (
          <section id="lovestory" className="section lovestory-section">
            <div className="jawa-top-border"></div>
            <div className="lovestory-content-wrapper">
                <h2 className="title-names-serif" data-animate="fade-up" style={{ fontFamily: '"Oleo Script", cursive', color: '#4a2c16', marginBottom: '25px', marginTop: '10px', textAlign: 'center', fontSize: '3rem' }}>Love Story</h2>
                
                {data.ceritaCinta.map((cerita, idx) => (
                  <React.Fragment key={idx}>
                    <div className="story-item" data-animate="fade-up" style={{ transitionDelay: `${idx * 0.2}s`, marginBottom: 0, textAlign: idx % 2 === 0 ? 'left' : 'right' }}>
                        <h3 style={{ fontFamily: '"Lora", serif', color: '#111111', fontSize: '1.4rem', marginBottom: '2px', fontWeight: 500 }}>{cerita.judul}</h3>
                        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.85rem', color: '#111111', marginBottom: '8px' }}>{cerita.tanggal}</p>
                        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.85rem', color: '#111111', lineHeight: '1.5', margin: 0 }}>{cerita.cerita}</p>
                    </div>
                    {idx < data.ceritaCinta.length - 1 && (
                      <div className="story-divider" data-animate="zoom-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '30px 0' }}>
                          <div style={{ flex: 1, height: '1px', backgroundColor: '#555' }}></div>
                          <i className="fa-solid fa-heart" style={{ color: '#333333', margin: '0 15px', fontSize: '1.2rem' }}></i>
                          <div style={{ flex: 1, height: '1px', backgroundColor: '#555' }}></div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
            </div>
            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
          </section>
        )}

        {/* Gift Section */}
        {isVisible('gift') && (
          <section id="gift" className="section gift-section" style={{ position: 'relative', width: '100%', background: 'radial-gradient(circle, #b8a18a 0%, #9e816a 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden', zIndex: 10, paddingTop: '50px', paddingBottom: '90px' }}>
            <div className="jawa-top-border"></div>
            <div className="gift-content-wrapper" style={{ position: 'relative', zIndex: 3, width: 'calc(100% - 50px)', maxWidth: '580px', background: 'radial-gradient(circle, #dfcfb9 0%, #b8a18a 100%)', padding: '30px 15px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255, 255, 255, 0.4)', margin: '0 auto 120px auto' }}>
                
                <div className="gift-section-header" data-animate="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                    <i className="fa-solid fa-gift fa-3x" style={{ color: '#4a2c16', marginBottom: '10px' }}></i>
                    <h2 className="title-names-serif" style={{ fontFamily: '"Oleo Script", cursive', color: '#4a2c16', marginBottom: '15px', fontSize: '3rem' }}>Wedding Gift</h2>
                    <p className="mt-3 gift-description" style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6', color: '#2a2a2a', textAlign: 'center' }}>Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless.</p>
                </div>

                <div className="gift-container" data-animate="zoom-in">
                    {/* Accounts */}
                    {data.hadiahDigital?.accounts?.map((acc, idx) => (
                      <div key={idx} className="bank-card" style={{ backgroundColor: '#fdf5e6', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#2a2a2a', marginBottom: '15px', fontWeight: 600 }}>Transfer</h3>
                                  <i className="fa-solid fa-credit-card" style={{ fontSize: '4rem', color: '#111', marginBottom: '25px' }}></i>
                                  <button onClick={() => navigator.clipboard.writeText(acc.number)} style={{ backgroundColor: '#111', border: 'none', padding: '8px 20px', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontSize: '0.85rem', fontWeight: 500, fontFamily: '"Inter", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px', width: '100%' }}>
                                      <i className="fa-regular fa-copy"></i> Salin
                                  </button>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{acc.name}</h4>
                                  <hr style={{ borderTop: '2px solid #111', width: '100%', margin: '10px 0 25px 0' }} />
                                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: '#2a2a2a', margin: '0 0 5px 0' }}>No. Rekening</p>
                                  <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#2a2a2a', margin: '0 0 20px 0' }}>{acc.number}</p>
                                  <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: '#2a2a2a', margin: '0 0 5px 0' }}>Atas Nama</p>
                                  <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#2a2a2a', margin: 0, textTransform: 'uppercase' }}>{acc.owner}</p>
                              </div>
                          </div>
                      </div>
                    ))}

                    {/* Physical Gift */}
                    {data.hadiahDigital?.physicalAddress && (
                      <div className="bank-card mt-4 address-card text-center" style={{ backgroundColor: '#fdf5e6', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '30px' }}>
                          <h3 className="bank-card-title text-center mb-3" style={{ color: '#2a2a2a', fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.4rem' }}>Kirim Kado Fisik</h3>
                          <i className="fa-solid fa-gift card-icon-address" style={{ fontSize: '4rem', color: '#111', margin: '15px 0' }}></i>
                          
                          <div className="address-details mt-3 mb-4" style={{ color: '#2a2a2a' }}>
                              <p className="mb-2" style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', fontWeight: 500 }}>Alamat : {data.hadiahDigital.physicalAddress}</p>
                              <p className="mb-0" style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', fontWeight: 500 }}>Penerima: {data.hadiahDigital.receiver}</p>
                              <p className="mb-0" style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', fontWeight: 500 }}>No HP: {data.hadiahDigital.physicalWhatsapp}</p>
                          </div>
                          
                          <div className="address-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                              <button onClick={() => navigator.clipboard.writeText(data.hadiahDigital.physicalAddress)} style={{ backgroundColor: '#111', border: 'none', padding: '8px 20px', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontSize: '0.85rem', fontWeight: 500, fontFamily: '"Inter", sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="fa-regular fa-copy"></i> Salin Alamat
                              </button>
                          </div>
                      </div>
                    )}
                </div>
            </div>
            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
          </section>
        )}

        {/* Guestbook Section */}
        {isVisible('guestbook') && (
          <section id="guestbook" className="section guestbook-section" style={{ position: 'relative', width: '100%', background: 'radial-gradient(circle, #b8a18a 0%, #9e816a 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden', zIndex: 10, paddingTop: '50px', paddingBottom: '90px' }}>
            <div className="jawa-top-border"></div>
            <div className="guestbook-content-wrapper" style={{ position: 'relative', zIndex: 3, width: 'calc(100% - 50px)', maxWidth: '580px', background: 'radial-gradient(circle, #dfcfb9 0%, #b8a18a 100%)', padding: '30px 15px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255, 255, 255, 0.4)', margin: '0 auto 120px auto' }}>
                
                <div className="guestbook-header" data-animate="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                    <i className="fa-solid fa-envelope-open-text fa-3x mb-3" style={{ color: '#4a2c16' }}></i>
                    <h2 className="title-names-serif" style={{ fontFamily: '"Oleo Script", cursive', color: '#4a2c16', marginBottom: '5px', fontSize: '3rem' }}>Ucapan &amp; Doa</h2>
                    <p className="subtitle" style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.85rem', color: '#2a2a2a' }}>Berikan ucapan harapan dan doa kepada kedua mempelai</p>
                </div>

                <div className="guestbook-container" data-animate="zoom-in">
                    <form className="guestbook-form" onSubmit={handleKirimUcapan} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="text" className="form-control" placeholder="Nama Tamu" required value={namaTamu} onChange={e => setNamaTamu(e.target.value)} style={{ padding: '12px 15px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: '"Inter", sans-serif', fontSize: '0.9rem' }} />
                        <textarea className="form-control" rows="3" placeholder="Tulis ucapan dan doa..." maxLength="300" required value={ucapan} onChange={e => setUcapan(e.target.value)} style={{ padding: '12px 15px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', resize: 'vertical' }}></textarea>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ backgroundColor: '#4a2c16', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
                            {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
                        </button>
                    </form>

                    <div className="comments-wrapper mt-4">
                        <p className="comments-count text-dark mb-3" style={{ fontWeight: 600, fontSize: '0.95rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>
                            <i className="fa-solid fa-comments"></i> {comments.length} Ucapan
                        </p>
                        <div className="comments-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {comments.map((msg, i) => (
                                <div className="comment-item" key={msg.id || i} style={{ display: 'flex', gap: '15px', marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                                    <img src="/assets/images/logo.png" className="comment-avatar-img" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div className="comment-bubble" style={{ flex: 1 }}>
                                        <h4 className="comment-name" style={{ margin: '0 0 5px 0', fontSize: '0.95rem', color: '#2a2a2a', fontWeight: 600 }}>{msg.nama}</h4>
                                        <p className="comment-text" style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#444', lineHeight: '1.4' }}>{msg.ucapan}</p>
                                        <small className="time text-muted" style={{ fontSize: '0.75rem', color: '#777' }}>{new Date(msg.created_at).toLocaleDateString('id-ID')}</small>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>Belum ada ucapan.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="jawa-bottom-container">
                <div className="wayang-wrapper">
                    <img src="/assets/images/wayang.webp" className="jawa-wayang center" alt="wayang" />
                </div>
                <div className="jawa-bottom-border"></div>
            </div>
          </section>
        )}

        {/* Closing Section */}
        {isVisible('closing') && (
          <section id="closing" className="section closing-section text-center" style={{ backgroundColor: '#2c2c2c', color: '#dfcfb9', padding: '60px 20px' }}>
            <h1 className="title-names" data-animate="fade-up" style={{ fontSize: '3rem', fontFamily: '"Oleo Script", cursive' }}>Terima Kasih</h1>
            <div className="mt-2" data-animate="fade-up" style={{ fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '320px', margin: '0 auto' }}>
              <p>Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.</p>
              <p className="mt-3">Wassalamu'alaikum Wr. Wb.</p>
            </div>
            <h1 className="title-names mt-4" data-animate="fade-up" style={{ fontFamily: '"Oleo Script", cursive', marginTop: '20px', fontSize: '2.5rem' }}>
              {mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}
            </h1>
          </section>
        )}

      </main>
    </div>
  );
}
