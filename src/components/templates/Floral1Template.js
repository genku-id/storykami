'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';


export default function Floral1Template({ data }) {
  const [showCover, setShowCover] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Lock scroll on mount
    document.body.classList.add('locked');

    // Animasi Scroll (memunculkan elemen text & foto yang hidden oleh data-animate)
    const animateElements = document.querySelectorAll('[data-animate]');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, observerOptions);

    animateElements.forEach(el => observer.observe(el));

    return () => {
      document.body.classList.remove('locked');
      observer.disconnect();
    };
  }, []);

  const parseYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = parseYoutubeId(data.hal1_youtubeLink);

  const handleOpenInvitation = () => {
    setShowCover(false);
    document.body.classList.remove('locked');
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      window.scrollTo({ top: mainContent.offsetTop, behavior: 'smooth' });
    }

    // Play YouTube Audio if exists
    if (ytId && window.player && typeof window.player.playVideo === 'function') {
      window.player.playVideo();
      setIsPlaying(true);
    }
  };

  const toggleAudio = () => {
    if (!window.player) return;
    if (isPlaying) {
      window.player.pauseVideo();
      setIsPlaying(false);
    } else {
      window.player.playVideo();
      setIsPlaying(true);
    }
  };

  // Safe arrays
  const acaraList = Array.isArray(data.hal5_acara) ? data.hal5_acara : [];
  const ceritaList = Array.isArray(data.hal6_cerita) ? data.hal6_cerita : [];
  const bankList = Array.isArray(data.hal7_bank) ? data.hal7_bank : [];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&family=Great+Vibes&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link rel="stylesheet" href="/demo/template-floral1/assets/css/style.css?v=72" />

      <div className="floral-theme-wrapper">
        
        {/* YOUTUBE IFRAME API (Invisible) */}
        {ytId && (
          <div style={{ display: 'none' }}>
            <div id="youtube-audio-player"></div>
            <Script
              id="youtube-api"
              src="https://www.youtube.com/iframe_api"
              onReady={() => {
                window.onYouTubeIframeAPIReady = () => {
                  window.player = new YT.Player('youtube-audio-player', {
                    height: '0',
                    width: '0',
                    videoId: ytId,
                    playerVars: {
                      autoplay: 0,
                      controls: 0,
                      showinfo: 0,
                      modestbranding: 1,
                      loop: 1,
                      fs: 0,
                      cc_load_policy: 0,
                      iv_load_policy: 3,
                      autohide: 0
                    }
                  });
                };
                if (window.YT && window.YT.Player) window.onYouTubeIframeAPIReady();
              }}
            />
          </div>
        )}

        {/* ================= HALAMAN 1 (COVER) ================= */}
        {data.show_hal1 !== false && (
          <div id="cover-page" className={`cover-page ${!showCover ? 'slide-up' : ''}`}>
            <div className="cover-content text-center">
              <h4 className="text-sage mb-2" data-animate="fade-up">THE WEDDING OF</h4>
              <h1 className="title-names-cursive text-dark-gold mt-3 mb-4" data-animate="zoom-in" style={{ fontSize: '3.5rem' }}>
                {data.hal1_namaPasangan || "Nama Pasangan"}
              </h1>
              <div className="guest-info mt-5" data-animate="fade-up" style={{ transitionDelay: '0.2s' }}>
                <p className="text-dark mb-2">Kepada Yth. Bapak/Ibu/Saudara/i</p>
                <div className="guest-name-box">
                  <h3 className="guest-name text-sage">Tamu Undangan</h3>
                </div>
                <p className="text-muted small mt-2">Mohon maaf apabila ada kesalahan penulisan nama/gelar</p>
              </div>
              <button id="btn-open" className="btn-open-invitation mt-5" onClick={handleOpenInvitation} data-animate="bounce">
                <i className="fa-solid fa-envelope-open-text me-2"></i> Buka Undangan
              </button>
            </div>
          </div>
        )}

        <div id="main-content" className="main-content">
          
          {/* ================= HALAMAN 2 (HERO) ================= */}
          {data.show_hal2 !== false && (
            <section id="hero" className="section hero-section bg-cream">
              <div className="floral-corner floral-pattern-1 floral-top-left"></div>
              <div className="floral-corner floral-pattern-1 floral-bottom-right"></div>
              <div className="hero-content text-center">
                <div className="hero-image-container mb-4" data-animate="zoom-in">
                  <img src={data.hal2_fotoCouple || "/demo/template-floral1/assets/images/couple.png"} alt="Couple" className="hero-couple-img" style={{ objectFit: 'cover' }} />
                </div>
                <h1 className="title-names text-sage mb-3 mt-4" data-animate="slide-right">{data.hal1_namaPasangan || "Nama Pasangan"}</h1>
                <p className="date-highlight mb-4" data-animate="slide-left">{data.hal2_tanggalAcara || "Tanggal Acara"}</p>
              </div>
            </section>
          )}

          {/* ================= HALAMAN 3 (PROFIL) ================= */}
          {data.show_hal3 !== false && (
            <section id="profiles" className="section profiles-section bg-white text-center">
            <div className="floral-corner floral-pattern-1 floral-top-right"></div>
            <div className="floral-corner floral-pattern-1 floral-bottom-left"></div>
            <div className="profiles-content" data-animate="fade-up">
              <p className="greeting text-dark mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.6', fontStyle: 'italic', color: '#000', marginBottom: '30px', whiteSpace: 'pre-line' }}>
                {data.hal3_kataPengantar || "Kata Pengantar..."}
              </p>

              {/* Bride */}
              <div className="profile-card mb-5">
                <div data-animate="slide-long-right">
                  <div className="profile-avatar-wrapper">
                    <div className="avatar-circle">
                      <img src={data.hal3_fotoWanita || "/demo/template-floral1/assets/images/bride.png"} alt="Bride" style={{ objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
                <h2 className="title-names mt-3" data-animate="fade-up">{data.hal3_namaWanita || "Nama Wanita"}</h2>
                <p className="parents" data-animate="fade-up">Putri dari<br/>{data.hal3_ortuWanita || "Orang Tua"}</p>
                {data.hal3_igWanita && <a href={`https://instagram.com/${data.hal3_igWanita.replace('@','')}`} target="_blank" className="ig-link text-sage mt-2 d-inline-block" data-animate="fade-up"><i className="fa-brands fa-instagram"></i> {data.hal3_igWanita}</a>}
              </div>

              <div className="ampersand text-center" data-animate="zoom-in">&</div>

              {/* Groom */}
              <div className="profile-card mt-5">
                <div data-animate="slide-long-left">
                  <div className="profile-avatar-wrapper">
                    <div className="avatar-circle">
                      <img src={data.hal3_fotoPria || "/demo/template-floral1/assets/images/groom.png"} alt="Groom" style={{ objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
                <h2 className="title-names mt-3" data-animate="fade-up">{data.hal3_namaPria || "Nama Pria"}</h2>
                <p className="parents" data-animate="fade-up">Putra dari<br/>{data.hal3_ortuPria || "Orang Tua"}</p>
                {data.hal3_igPria && <a href={`https://instagram.com/${data.hal3_igPria.replace('@','')}`} target="_blank" className="ig-link text-sage mt-2 d-inline-block" data-animate="fade-up"><i className="fa-brands fa-instagram"></i> {data.hal3_igPria}</a>}
              </div>
              </div>
            </section>
          )}

          {/* ================= HALAMAN 4 (DESKRIPSI/QUOTE) ================= */}
          {data.show_hal4 !== false && data.hal4_deskripsi && (
            <section id="quote" className="section quote-section bg-dark-blue">
              <div className="floral-corner floral-pattern-1 floral-middle-right"></div>
              <div className="floral-corner floral-pattern-1 floral-bottom-left-large"></div>
              <div className="quote-content" data-animate="fade-up">
                <div className="quote-image-card">
                  <img src={data.hal2_fotoCouple || "/demo/template-floral1/assets/images/couple.png"} alt="Quote" className="quote-main-image" style={{ objectFit: 'cover' }} />
                </div>
                <div className="quote-text text-white mt-4">
                  <p className="arabic-text mt-3" style={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: '1.8' }}>
                    {data.hal4_deskripsi}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ================= HALAMAN 5 (ACARA) ================= */}
          {data.show_hal5 !== false && acaraList.length > 0 && (
            <section id="events" className="section events-section bg-cream">
              <div className="floral-corner floral-pattern-1 floral-top-right"></div>
              <div className="container">
                <div className="section-header text-center mb-5" data-animate="fade-up">
                  <h2 className="title-section text-sage">Rangkaian Acara</h2>
                </div>
                <div className="events-wrapper">
                  {acaraList.map((acara, idx) => (
                    <div key={idx} className="event-card mb-4" data-animate="zoom-in" style={{ transitionDelay: `${idx * 0.2}s` }}>
                      <div className="event-card-inner bg-white p-4 text-center">
                        <h3 className="event-title text-dark-gold mb-3">{acara.nama}</h3>
                        <div className="event-detail mb-2"><i className="fa-regular fa-calendar text-sage me-2"></i> {acara.tanggal}</div>
                        <div className="event-detail mb-2"><i className="fa-regular fa-clock text-sage me-2"></i> {acara.jam}</div>
                        <div className="event-detail mb-4"><i className="fa-solid fa-location-dot text-sage me-2"></i> {acara.alamat}</div>
                        {acara.maps && (
                          <a href={acara.maps} target="_blank" className="btn-maps"><i className="fa-solid fa-map-location-dot me-2"></i> Buka Google Maps</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ================= HALAMAN 6 (CERITA) ================= */}
          {data.show_hal6 !== false && ceritaList.length > 0 && (
            <section id="lovestory" className="section lovestory-section bg-dark-blue">
              <div className="container">
                <div className="section-header text-center mb-5" data-animate="fade-up">
                  <h2 className="title-section text-white">Love Story</h2>
                </div>
                <div className="timeline">
                  {ceritaList.map((cerita, idx) => (
                    <div key={idx} className={`timeline-item ${idx % 2 !== 0 ? 'right' : 'left'}`} data-animate={idx % 2 !== 0 ? 'slide-left' : 'slide-right'}>
                      <div className="timeline-content">
                        <h4 className="text-dark-gold">{cerita.judul}</h4>
                        <span className="timeline-date">{cerita.tanggal}</span>
                        <p className="mt-2 text-white-50">{cerita.deskripsi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ================= HALAMAN 7 (HADIAH) ================= */}
          {data.show_hal7 !== false && (bankList.length > 0 || data.hal7_alamatKado) && (
            <section id="gift" className="section gift-section bg-cream text-center">
              <div className="container">
                <div className="section-header text-center mb-4" data-animate="fade-up">
                  <h2 className="title-section text-sage">Wedding Gift</h2>
                  <p className="text-muted small mt-2">Tanpa mengurangi rasa hormat, bagi Anda yang ingin memberikan tanda kasih untuk kami, dapat melalui:</p>
                </div>
                
                <div className="gift-container mt-4">
                  {bankList.map((bank, idx) => (
                    <div key={idx} className="gift-card bg-white mb-3 p-4" data-animate="zoom-in">
                      <h4 className="text-dark mb-3">{bank.namaBank}</h4>
                      <p className="rek-number fs-4 text-sage fw-bold mb-1">{bank.rekening}</p>
                      <p className="text-muted small mb-3">a.n {bank.atasNama}</p>
                      <div className="d-flex gap-2 justify-content-center">
                        <button className="btn-copy btn-copy-rek" onClick={() => navigator.clipboard.writeText(bank.rekening)}>
                          <i className="fa-regular fa-copy"></i> Salin
                        </button>
                        {bank.wa && (
                          <a href={`https://wa.me/${bank.wa.replace(/\D/g,'')}`} target="_blank" className="btn-copy" style={{ background: '#25D366', color: 'white', border: 'none' }}>
                            <i className="fa-brands fa-whatsapp"></i> Konfirmasi
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {data.hal7_alamatKado && (
                    <div className="gift-card bg-white mb-3 p-4" data-animate="zoom-in">
                      <h4 className="text-dark mb-3"><i className="fa-solid fa-gift me-2 text-sage"></i>Kirim Kado</h4>
                      <p className="text-muted small mb-3">{data.hal7_alamatKado}</p>
                      {data.hal7_waKado && (
                        <a href={`https://wa.me/${data.hal7_waKado.replace(/\D/g,'')}`} target="_blank" className="btn-copy mx-auto" style={{ background: '#25D366', color: 'white', border: 'none' }}>
                          <i className="fa-brands fa-whatsapp"></i> Konfirmasi Resi
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================= HALAMAN 8 (FOOTER) ================= */}
          {data.show_hal8 !== false && (
            <section id="closing" className="section closing-section bg-dark-blue text-center">
              <div className="floral-corner floral-pattern-1 floral-bottom-right"></div>
              <div className="floral-corner floral-pattern-1 floral-top-left-small"></div>
              <div className="closing-content" data-animate="zoom-in">
                <p className="text-white-50 mb-4" style={{ whiteSpace: 'pre-line' }}>{data.hal8_deskripsi}</p>
                <h2 className="title-names-cursive text-dark-gold mb-5" style={{ fontSize: '2.5rem' }}>{data.hal1_namaPasangan || "Nama Pasangan"}</h2>
                
                <div className="footer-credits mt-5 pt-4 border-top border-secondary">
                  <p className="text-white-50 small mb-0">Made with ❤️ by</p>
                  <h5 className="text-sage mt-1">{data.hal8_footer || "StoryKami"}</h5>
                </div>
              </div>
            </section>
          )}

        </div>
        
        {/* Audio Toggle Button */}
        {ytId && (
          <button id="btn-audio" className={`btn-audio ${isPlaying ? 'playing' : ''}`} onClick={toggleAudio}>
            {isPlaying ? <i className="fa-solid fa-music"></i> : <i className="fa-solid fa-volume-xmark"></i>}
          </button>
        )}
      </div>

      {/* Script Animation Observer */}
      <Script
        id="animation-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                  }
                });
              }, { threshold: 0.1 });
              document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
            }, 100);
          `
        }}
      />
    </>
  );
}
