'use client';
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import '@/app/wim/floral1.css';
import { defaultInvitationData } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';

export default function Floral1Template({ data = defaultInvitationData, slug = 'test-slug', isVisible: isVisibleProp }) {
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
    <div className={`wim-template-floral1 ${isLocked ? 'locked' : ''}`} style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#fdfbfb', overflow: isLocked ? 'hidden' : 'auto' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

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
              <h3 className="guest-name text-serif">Nama Tamu</h3>
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
                {acara?.akad?.tanggal ? new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </p>
              <div className="countdown-container mb-4" data-animate="fade-up">
                <div className="countdown-item"><span>{String(timeLeft.hari).padStart(2, '0')}</span><p>Hari</p></div>
                <div className="countdown-item"><span>{String(timeLeft.jam).padStart(2, '0')}</span><p>Jam</p></div>
                <div className="countdown-item"><span>{String(timeLeft.menit).padStart(2, '0')}</span><p>Menit</p></div>
                <div className="countdown-item"><span>{String(timeLeft.detik).padStart(2, '0')}</span><p>Detik</p></div>
              </div>
              <a href={acara?.akad?.linkMap || '#'} target="_blank" rel="noreferrer" className="btn-secondary mt-4" style={{ textDecoration: 'none', transitionDelay: '0.4s' }} data-animate="fade-up">
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
              {/* Akad */}
              <div className="event-card-pill bg-dark-blue" data-animate="zoom-in">
                <div className="card-floral card-floral-tl"></div><div className="card-floral card-floral-mr"></div><div className="card-floral card-floral-bl"></div>
                <h2 className="event-title text-white">Akad Nikah</h2>
                <p className="event-date">{acara?.akad?.tanggal ? new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                <p className="event-time">Pukul {acara?.akad?.waktuMulai} - {acara?.akad?.waktuSelesai} {acara?.akad?.zonaWaktu}</p>
                <div className="event-location-icon mt-4"><i className="fa-solid fa-map-location-dot fa-2x"></i></div>
                <p className="event-location-name mt-2">{acara?.akad?.lokasi}</p>
                <p className="event-address">{acara?.akad?.alamatLengkap}</p>
                <a href={acara?.akad?.linkMap} target="_blank" rel="noreferrer" className="btn btn-maps mt-4"><i className="fa-solid fa-location-dot"></i> Google Maps</a>
              </div>
              {/* Resepsi */}
              <div className="event-card-pill bg-dark-blue mt-4" data-animate="zoom-in">
                <div className="card-floral card-floral-tl"></div><div className="card-floral card-floral-mr"></div><div className="card-floral card-floral-bl"></div>
                <h2 className="event-title text-white">Resepsi</h2>
                <p className="event-date">{acara?.resepsi?.tanggal ? new Date(acara.resepsi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                <p className="event-time">Pukul {acara?.resepsi?.waktuMulai} - {acara?.resepsi?.waktuSelesai} {acara?.resepsi?.zonaWaktu}</p>
                <div className="event-location-icon mt-4"><i className="fa-solid fa-map-location-dot fa-2x"></i></div>
                <p className="event-location-name mt-2">{acara?.resepsi?.lokasi}</p>
                <p className="event-address">{acara?.resepsi?.alamatLengkap}</p>
                <a href={acara?.resepsi?.linkMap} target="_blank" rel="noreferrer" className="btn btn-maps mt-4"><i className="fa-solid fa-location-dot"></i> Google Maps</a>
              </div>
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
                <div className="bank-card mb-4" key={idx}>
                  <div className="card-top-row">
                    <h3 className="bank-card-title">Transfer</h3>
                    <div className="bank-logo-container">
                      <h4 style={{ margin: 0, fontWeight: 'bold' }}>{acc.name}</h4>
                      <hr className="bank-divider" />
                    </div>
                  </div>
                  <div className="card-body-row">
                    <div className="card-left">
                      <i className="fa-solid fa-credit-card card-icon"></i>
                      <div className="card-buttons">
                        <button className="btn-bank btn-copy" onClick={() => navigator.clipboard.writeText(acc.number)}>
                          <i className="fa-regular fa-copy"></i> Salin NO
                        </button>
                      </div>
                    </div>
                    <div className="card-right">
                      <div className="bank-details-wrapper">
                        <p className="bank-label">No. Rekening / HP</p>
                        <p className="bank-number" style={{ userSelect: 'all' }}>{acc.number}</p>
                        <p className="bank-label mt-2">Atas Nama</p>
                        <p className="bank-name">{acc.owner}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Physical Gift */}
              {data.hadiahDigital?.physicalAddress && (
                <div className="bank-card mt-2">
                  <div className="card-top-row">
                    <h3 className="bank-card-title">Kirim Kado</h3>
                  </div>
                  <div className="card-body-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Alamat Penerima:</p>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{data.hadiahDigital.physicalAddress}</p>
                    <p className="mt-2" style={{ fontSize: '0.9rem' }}><strong>Penerima:</strong> {data.hadiahDigital.receiver}</p>
                    <p style={{ fontSize: '0.9rem' }}><strong>No HP:</strong> {data.hadiahDigital.physicalWhatsapp}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Guestbook Section */}
        {isVisible('guestbook') && (
          <section id="guestbook" className="section guestbook-section bg-dark-blue">
            <div className="cloud cloud-1"></div><div className="cloud cloud-2"></div><div className="cloud cloud-3"></div>
            <div className="guestbook-header text-center mb-3" data-animate="fade-up">
              <h2 className="section-title mb-1" style={{ color: 'black !important', fontSize: '1.8rem' }}>Ucapan &amp; Doa</h2>
              <p className="subtitle" style={{ color: 'black !important', fontSize: '0.85rem' }}>Berikan ucapan harapan dan doa kepada kedua mempelai</p>
            </div>
            <div className="guestbook-container" data-animate="zoom-in">
              <form className="guestbook-form" onSubmit={handleKirimUcapan}>
                <input type="text" className="form-control" placeholder="Nama Tamu" required value={namaTamu} onChange={e => setNamaTamu(e.target.value)} />
                <textarea className="form-control mt-2" rows="2" placeholder="Tulis ucapan" maxLength="300" required value={ucapan} onChange={e => setUcapan(e.target.value)}></textarea>
                <div className="text-end mt-2">
                  <button type="submit" className="btn btn-primary px-4 py-2" style={{ fontSize: '0.9rem', borderRadius: '20px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
                  </button>
                </div>
              </form>
              <div className="comments-wrapper mt-4">
                <p className="comments-count text-dark mb-3" style={{ fontWeight: 600, fontSize: '0.95rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>
                  <i className="fa-solid fa-comments"></i> {comments.length} Ucapan
                </p>
                <div className="comments-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {comments.map((msg, i) => (
                    <div className="comment-item" key={msg.id || i}>
                      <img src="/assets/images/logo.png" className="comment-avatar-img" alt="Logo" />
                      <div className="comment-bubble">
                        <h4 className="comment-name">{msg.nama} <i className="fa-solid fa-certificate text-gold"></i></h4>
                        <p className="comment-text">{msg.ucapan}</p>
                        <small className="time text-muted">{new Date(msg.created_at).toLocaleDateString('id-ID')}</small>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>Belum ada ucapan.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Closing Section */}
        {isVisible('closing') && (
          <section id="closing" className="section closing-section text-center">
            <div className="closing-gradient-overlay">
              <h1 className="title-names" data-animate="fade-up" style={{ fontSize: '3.5rem', color: 'black !important' }}>Terima Kasih</h1>
              <div className="mt-2" data-animate="fade-up" style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-dark)', maxWidth: '320px', margin: '0 auto', fontWeight: 500 }}>
                <p>Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.</p>
                <p className="mt-3">Wassalamu'alaikum Wr. Wb.</p>
              </div>
              <h1 id="closing-couple-names" className="title-names mt-4" data-animate="fade-up" style={{ animationDelay: '0.2s' }}>
                {mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}
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

