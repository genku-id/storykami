'use client';
import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import Guestbook from '@/components/Guestbook';

const getBankLogo = (bankName) => {
  if (!bankName) return null;
  const name = (bankName || '').toUpperCase().trim();
  const banks = ["BCA", "BLU", "BNI", "BRI", "BSI", "CIMB", "DANA", "GOPAY", "JAGO", "JENIUS", "LINKAJA", "MANDIRI", "NEO", "OVO", "PERMATA", "SEABANK", "SHOPEEPAY"];
  for (const b of banks) {
    if (name.includes(b)) return `/banks/${b}.webp`;
  }
  return null;
};

const formatBankName = (bankName) => {
  const name = (bankName || '').toUpperCase().trim();
  const eWallets = ['GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA'];
  if (eWallets.includes(name) || name.includes('BANK')) return name;
  return `BANK ${name}`;
};

export default function Floral2Template({ data: rawData }) {
  // Normalize data field names since the dashboard updated them
  // Normalisasi: editor & engine menggunakan field standar (coverName, weddingDate,
  // audioUrl, brideName, events[], stories[], gift{}). Komponen ini menggunakan
  // konvensi hal1_*..hal9_*. Kita petakan keduanya agar kompatibel ke belakang & depan.
  const events = rawData.events || [];
  const stories = rawData.stories || [];
  const gift = rawData.gift || {};
  const giftAccounts = Array.isArray(gift.accounts) && gift.accounts.length
    ? gift.accounts
    : [gift.bank1, gift.bank2].filter(Boolean);

  const coupleName = rawData.coverName || rawData.coupleName || `${rawData.brideName || ''} & ${rawData.groomName || ''}`.trim();
  const weddingDateText = rawData.weddingDateText || rawData.weddingDate || '';

  const data = {
    ...rawData,
    hal1_namaPasangan: coupleName || rawData.hal1_namaPasangan,
    hal1_youtubeLink: rawData.audioUrl || rawData.hal1_youtubeLink,
    hal2_tanggalAcara: weddingDateText || rawData.hal2_tanggalAcara,
    hal2_fotoCouple: rawData.coupleImage || rawData.hal2_fotoCouple,
    hal3_namaWanita: rawData.brideName || rawData.hal3_namaWanita,
    hal3_ortuWanita: rawData.brideParents || rawData.hal3_ortuWanita,
    hal3_igWanita: rawData.brideInstagram || rawData.hal3_igWanita,
    hal3_fotoWanita: rawData.brideImage || rawData.hal3_fotoWanita,
    hal3_namaPria: rawData.groomName || rawData.hal3_namaPria,
    hal3_ortuPria: rawData.groomParents || rawData.hal3_ortuPria,
    hal3_igPria: rawData.groomInstagram || rawData.hal3_igPria,
    hal3_fotoPria: rawData.groomImage || rawData.hal3_fotoPria,
    hal3_kataPengantar: rawData.openingText || rawData.hal3_kataPengantar,
    hal4_deskripsi: rawData.quoteText || rawData.quote || rawData.hal4_deskripsi,
    hal5_acara: events.map(e => ({
      nama: e.title,
      tanggal: e.dateText || (e.date ? e.date : ''),
      jam: e.timeText || (e.startTime ? `Pukul ${e.startTime.replace(':','.')} WIB` : ''),
      alamat: [e.locationName, e.address].filter(Boolean).join(' '),
      maps: e.mapsUrl
    })),
    hal6_cerita: stories.map(s => ({ judul: s.title, deskripsi: s.text, tanggal: s.date })),
    hal7_bank: giftAccounts.map(b => ({
      namaBank: b.name,
      rekening: b.number,
      atasNama: b.owner,
      wa: b.whatsapp
    })),
    hal7_alamatKado: gift.physicalAddress || (gift.receiver ? `${gift.physicalAddress} - ${gift.receiver}` : ''),
    hal7_waKado: gift.physicalWhatsapp || gift.whatsappNumber,
    hal8_deskripsi: rawData.closingText || rawData.hal8_deskripsi,
    slug: rawData.slug
  };

  // Petakan toggle sections (engine) -> show_hal* (komponen)
  const sections = rawData.sections || {};
  const sectionMap = {
    cover: 'show_hal1',
    hero: 'show_hal2',
    profiles: 'show_hal3',
    quote: 'show_hal4',
    events: 'show_hal5',
    loveStory: 'show_hal6',
    gift: 'show_hal7',
    guestbook: 'show_hal9',
    closing: 'show_hal8'
  };
  Object.keys(sectionMap).forEach(key => {
    if (sections[key] === false) data[sectionMap[key]] = false;
  });
  const [showCover, setShowCover] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hari: '00', jam: '00', menit: '00', detik: '00' });

  const parseIndonesianDate = (dateString) => {
    if (!dateString) return null;
    const months = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
        'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
    };
    
    const stdDate = new Date(dateString);
    if (!isNaN(stdDate.getTime())) return stdDate;

    let cleanStr = dateString.replace(/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu)[,\s]+/i, '').trim();
    const match = cleanStr.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (match) {
        const day = parseInt(match[1], 10);
        const monthStr = match[2].toLowerCase();
        const year = parseInt(match[3], 10);
        const month = months[monthStr];
        if (month !== undefined) {
            return new Date(year, month, day, 0, 0, 0);
        }
    }
    return null;
  };

  const getCalendarLink = () => {
    const eventDate = parseIndonesianDate(data.hal2_tanggalAcara);
    if (!eventDate) return "#";
    
    const year = eventDate.getFullYear();
    const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
    const day = eventDate.getDate().toString().padStart(2, '0');
    
    const nextDayDate = new Date(eventDate);
    nextDayDate.setDate(nextDayDate.getDate() + 1);
    const nextYear = nextDayDate.getFullYear();
    const nextMonth = (nextDayDate.getMonth() + 1).toString().padStart(2, '0');
    const nextDay = nextDayDate.getDate().toString().padStart(2, '0');

    const start = `${year}${month}${day}`;
    const end = `${nextYear}${nextMonth}${nextDay}`;
    const title = encodeURIComponent(`Undangan Pernikahan ${data.hal1_namaPasangan || ''}`.trim());
    const details = encodeURIComponent(`Turut mengundang ke acara pernikahan kami pada ${data.hal2_tanggalAcara}`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  const renderPengantar = (text) => {
    if (!text) return "Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan...";
    return text.split('\n').map((line, i) => {
      const isSalam = line.toLowerCase().includes('assalamu');
      return (
        <React.Fragment key={i}>
          {isSalam ? <strong>{line}</strong> : line}
          {i !== text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  useEffect(() => {
    const eventDate = parseIndonesianDate(data.hal2_tanggalAcara);
    if (!eventDate) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = eventDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ hari: '00', jam: '00', menit: '00', detik: '00' });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        hari: days.toString().padStart(2, '0'),
        jam: hours.toString().padStart(2, '0'),
        menit: minutes.toString().padStart(2, '0'),
        detik: seconds.toString().padStart(2, '0')
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data.hal2_tanggalAcara]);

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
      <link rel="stylesheet" href="/demo/template-floral2/assets/css/style.css?v=73" />

      <div className="floral-theme-wrapper">
        
        {/* YOUTUBE IFRAME API (Invisible) */}
        {ytId && (
          <div style={{ display: 'none' }}>
            <div id="youtube-audio-player"></div>
            <Script
              id="youtube-api"
              src="https://www.youtube.com/iframe_api"
              strategy="afterInteractive"
              onLoad={() => {
                const initPlayer = () => {
                  window.player = new window.YT.Player('youtube-audio-player', {
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
                      autohide: 0,
                      start: data.audioTimestamp || 0
                    }
                  });
                };

                if (window.YT && window.YT.Player) {
                  initPlayer();
                } else {
                  window.onYouTubeIframeAPIReady = initPlayer;
                }
              }}
            />
          </div>
        )}

        {/* ================= HALAMAN 1 (COVER) ================= */}
        {data.show_hal1 !== false && (
          <div id="cover-page" className={`cover-page ${!showCover ? 'slide-up' : ''}`}>
            {/* Animated Clouds Background */}
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>
            <div className="floral-bottom-cover"></div>

            <div className="cover-content">
              <div className="monogram-large">
                <span className="mono-m"><span className="cover-slide-in-left">{data.hal1_namaPasangan ? data.hal1_namaPasangan.charAt(0).toUpperCase() : "M"}</span></span>
                <span className="mono-d"><span className="cover-slide-in-right">{data.hal1_namaPasangan ? data.hal1_namaPasangan.split('&')[1]?.trim().charAt(0).toUpperCase() || "D" : "D"}</span></span>
              </div>
              
              <div className="wedding-text cover-fade-up-1">
                <p className="subtitle text-serif">The Wedding Of</p>
                <h2 className="title-names-cursive">{data.hal1_namaPasangan || "Dilan & Milea"}</h2>
              </div>
              
              <div className="guest-info cover-fade-up-2">
                <p className="kepada-yth text-serif">Kepada Yth:</p>
                <h3 className="guest-name text-serif">Tamu Undangan</h3>
              </div>
              
              <button id="btn-open" className="btn-cover cover-fade-up-3" onClick={handleOpenInvitation}>
                <i className="fa-solid fa-envelope"></i> BUKA UNDANGAN
              </button>
            </div>
          </div>
        )}

        <div id="main-content" className="main-content">
          
          {/* ================= HALAMAN 2 (HERO) ================= */}
          {data.show_hal2 !== false && (
            <section id="hero" className="section hero-section">
              {/* Animated Clouds Background */}
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              <div className="cloud cloud-3"></div>

              <div className="hero-content text-center">
                <div className="hero-image-container mb-4" data-animate="zoom-in">
                  <img src={data.hal2_fotoCouple || "/demo/template-floral2/assets/images/couple.png"} alt="Couple" className="hero-couple-img" style={{ objectFit: 'cover' }} />
                </div>
                <h1 className="title-names text-sage mb-3 mt-4" data-animate="slide-right">{data.hal1_namaPasangan || "Nama Pasangan"}</h1>
                <p className="date-highlight mb-4" data-animate="slide-left">{data.hal2_tanggalAcara || "Tanggal Acara"}</p>
                
                <div className="countdown-container" data-animate="fade-up" style={{ transitionDelay: '0.2s' }}>
                    <div className="countdown-item"><span>{timeLeft.hari}</span><p>Hari</p></div>
                    <div className="countdown-item"><span>{timeLeft.jam}</span><p>Jam</p></div>
                    <div className="countdown-item"><span>{timeLeft.menit}</span><p>Menit</p></div>
                    <div className="countdown-item"><span>{timeLeft.detik}</span><p>Detik</p></div>
                </div>
                
                <a href={getCalendarLink()} target="_blank" className="btn-secondary mt-4" style={{ textDecoration: 'none', transitionDelay: '0.4s' }} data-animate="fade-up">
                    <i className="fa-regular fa-calendar-check"></i> Simpan di Kalender
                </a>
              </div>
              <div className="floral-bottom-hero"></div>
            </section>
          )}

          {/* ================= HALAMAN 3 (PROFIL) ================= */}
          {data.show_hal3 !== false && (
            <section id="profiles" className="section profiles-section">
              {/* Animated Clouds Background */}
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              <div className="cloud cloud-3"></div>
              <div className="cloud cloud-4"></div>
              
              <div className="floral-top-profiles"></div>
              
              <div className="profiles-content" data-animate="fade-up">
                <p className="greeting text-dark mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.6', fontStyle: 'italic', color: '#000', marginBottom: '30px' }}>
                  {renderPengantar(data.hal3_kataPengantar)}
                </p>

                {/* Bride */}
                <div className="profile-card">
                  <div data-animate="slide-long-right">
                    <div className="profile-avatar-wrapper">
                      <div className="avatar-circle">
                        <img src={data.hal3_fotoWanita || "/demo/template-floral2/assets/images/bride.png"} alt="Bride" style={{ objectFit: 'cover' }} />
                      </div>
                    </div>
                  </div>
                  <h2 className="title-names mt-3" data-animate="fade-up" style={{ transitionDelay: '0.2s' }}>{data.hal3_namaWanita || "Nama Wanita"}</h2>
                  <p className="parents" data-animate="fade-up" style={{ transitionDelay: '0.4s', whiteSpace: 'pre-line' }}>{data.hal3_ortuWanita || "Putri dari Bapak & Ibu"}</p>
                  {data.hal3_igWanita && <a href={`https://instagram.com/${data.hal3_igWanita.replace('@','')}`} target="_blank" className="social-link" data-animate="fade-up" style={{ transitionDelay: '0.6s' }}><i className="fa-brands fa-instagram"></i> {data.hal3_igWanita}</a>}
                </div>

                <div className="ampersand text-center" data-animate="zoom-in">&</div>

                {/* Groom */}
                <div className="profile-card">
                  <div data-animate="slide-long-left">
                    <div className="profile-avatar-wrapper">
                      <div className="avatar-circle">
                        <img src={data.hal3_fotoPria || "/demo/template-floral2/assets/images/groom.png"} alt="Groom" style={{ objectFit: 'cover' }} />
                      </div>
                    </div>
                  </div>
                  <h2 className="title-names mt-3" data-animate="fade-up" style={{ transitionDelay: '0.2s' }}>{data.hal3_namaPria || "Nama Pria"}</h2>
                  <p className="parents" data-animate="fade-up" style={{ transitionDelay: '0.4s', whiteSpace: 'pre-line' }}>{data.hal3_ortuPria || "Putra dari Bapak & Ibu"}</p>
                  {data.hal3_igPria && <a href={`https://instagram.com/${data.hal3_igPria.replace('@','')}`} target="_blank" className="social-link" data-animate="fade-up" style={{ transitionDelay: '0.6s' }}><i className="fa-brands fa-instagram"></i> {data.hal3_igPria}</a>}
                </div>
              </div>
              
              <div className="floral-bottom-profiles"></div>
            </section>
          )}

          {/* ================= HALAMAN 4 (DESKRIPSI/QUOTE) ================= */}
          {data.show_hal4 !== false && data.hal4_deskripsi && (
            <section id="quote" className="section quote-section bg-red-dark">
                <div className="floral-corner floral-pattern-1 floral-middle-right"></div>
                <div className="floral-corner floral-pattern-1 floral-bottom-left-large"></div>
                
                <div className="quote-content" data-animate="fade-up">
                    <div className="quote-image-card">
                        <img src={data.hal2_fotoCouple || "/demo/template-floral2/assets/images/couple.png"} 
alt="Quote" className="quote-main-image" style={{ objectFit: 'cover' }} />
                    </div>
                    <div className="quote-text text-white mt-4">
                        <p className="arabic-text mt-3" style={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: 
'1.8' }}>
                            {data.hal4_deskripsi}
                        </p>
                    </div>
                </div>
            </section>
          )}

          {/* ================= HALAMAN 5 (ACARA) ================= */}
          {data.show_hal5 !== false && acaraList.length > 0 && (
            <section id="events" className="section events-section">
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-3"></div>
              
              <div className="floral-top-profiles"></div>
              
              <div className="events-content">
                  {acaraList.map((acara, idx) => (
                    <div key={idx} className="event-card-pill bg-red-dark" data-animate="zoom-in" style={{ transitionDelay: `${idx * 0.2}s` }}>
                        <div className="card-floral card-floral-tl"></div>
                        <div className="card-floral card-floral-mr"></div>
                        <div className="card-floral card-floral-bl"></div>

                        <h2 className="event-title text-white">{acara.nama}</h2>
                        
                        <p className="event-date">{acara.tanggal}</p>
                        <p className="event-time">Pukul {acara.jam}</p>
                        
                        <div className="event-location-icon mt-4">
                            <i className="fa-solid fa-map-location-dot fa-2x"></i>
                        </div>
                        <p className="event-address mt-3">{acara.alamat}</p>
                        
                        {acara.maps && (
                          <a href={acara.maps} target="_blank" className="btn btn-maps mt-4">
                              <i className="fa-solid fa-location-dot"></i> Google Maps
                          </a>
                        )}
                    </div>
                  ))}
              </div>
              
              <div className="floral-bottom-profiles"></div>
            </section>
          )}

          {/* ================= HALAMAN 6 (CERITA) ================= */}
          {data.show_hal6 !== false && ceritaList.length > 0 && (
            <section id="lovestory" className="section lovestory-section bg-red-dark">
                <h2 className="section-title text-white text-center mb-5" data-animate="fade-up">Love Story</h2>
                
                <div className="story-frame" data-animate="zoom-in">
                  {ceritaList.map((cerita, idx) => (
                    <React.Fragment key={idx}>
                      <div className={`story-item ${idx % 2 === 0 ? 'story-left' : 'story-right'}`}>
                          <h3 className="story-title">{cerita.judul || `Cerita ${idx+1}`}</h3>
                          <p className="story-date">{`Bagian ${idx+1}`}</p>
                          <p className="story-text">{cerita.deskripsi}</p>
                      </div>
                      
                      {idx < ceritaList.length - 1 && (
                        <div className="story-divider"><i className="fa-solid fa-heart"></i></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
            </section>
          )}

          {/* ================= HALAMAN 7 (HADIAH) ================= */}
          {data.show_hal7 !== false && (bankList.length > 0 || data.hal7_alamatKado) && (
            <section id="gift" className="section gift-section bg-red-dark">
              <div className="gift-section-header text-center text-white mb-4" data-animate="fade-up" style={{ marginTop: '-30px' }}>
                  <i className="fa-solid fa-gift fa-3x mb-2"></i>
                  <h2 className="section-title text-white" style={{ color: 'white', fontSize: '1.5rem' }}>Wedding Gift</h2>
                  <p className="mt-3 gift-description" style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                    Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless.
                  </p>
              </div>
              
              <div className="gift-container" data-animate="zoom-in">
                  {bankList.map((bank, idx) => (
                    <div key={idx} className="bank-card mt-4">
                        <div className="card-top-row">
                            <h3 className="bank-card-title">Wedding Gift</h3>
                            <div className="bank-logo-container" style={{ margin: '0 0 10px 0', textAlign: 'right' }}>
                                <img 
                                    src={getBankLogo(bank.namaBank)} 
                                    alt={bank.namaBank} 
                                    style={{ height: '85px', objectFit: 'contain', maxWidth: '200px', marginBottom: '-22px', marginTop: '-20px' }} 
                                    onError={(e) => { 
                                        e.target.style.display = 'none'; 
                                        if(e.target.nextSibling) e.target.nextSibling.style.display = 'inline-block'; 
                                    }} 
                                />
                                <div style={{
                                  fontSize: '0.65rem',
                                  fontWeight: '700',
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px',
                                  position: 'relative',
                                  zIndex: 2,
                                  marginBottom: '-2px'
                                }}>
                                  {formatBankName(bank.namaBank)}
                                </div>
                                <hr className="bank-divider" style={{ marginTop: '5px' }} />
                            </div>
                        </div>
                        
                        <div className="card-body-row">
                            <div className="card-left">
                                <i className="fa-solid fa-credit-card card-icon"></i>
                                <div className="card-buttons">
                                    <button className="btn-bank btn-copy" onClick={() => navigator.clipboard.writeText(bank.rekening)}>
                                        <i className="fa-regular fa-copy"></i> Salin NO
                                    </button>
                                    {bank.wa && (
                                      <a href={`https://wa.me/${bank.wa.replace(/\D/g,'')}`} target="_blank" className="btn-bank btn-wa mt-2" style={{ background: '#25D366', color: 'white', border: 'none', padding: '5px 10px', fontSize: '0.8rem', borderRadius: '5px', textDecoration: 'none' }}>
                                        <i className="fa-brands fa-whatsapp"></i> Konfirmasi
                                      </a>
                                    )}
                                </div>
                            </div>
                            
                            <div className="card-right">
                                <div className="bank-details-wrapper">
                                    <p className="bank-label">No. Rekening</p>
                                    <p className="bank-number">{bank.rekening}</p>
                                    
                                    <p className="bank-label mt-2">Atas Nama</p>
                                    <p className="bank-name">{bank.atasNama}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                  ))}

                  {data.hal7_alamatKado && (
                    <div className="bank-card mt-4 address-card text-center" style={{ alignItems: 'center', paddingTop: '30px' }}>
                        <h3 className="bank-card-title text-center mb-3">Wedding Gift</h3>
                        <i className="fa-solid fa-gift card-icon-address" style={{ fontSize: '5rem', color: '#8da4a6', margin: '15px 0' }}></i>
                        
                        <div className="address-details mt-3 mb-4 text-dark" style={{ color: 'var(--text-dark)' }}>
                            <p className="mb-1" style={{ fontFamily: "'Quicksand', 'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.5px' }}>Alamat : {data.hal7_alamatKado}</p>
                        </div>
                        
                        <div className="address-buttons d-flex flex-column align-items-center w-100">
                            <button className="btn-bank btn-copy mb-2 px-4 py-2" onClick={() => navigator.clipboard.writeText(data.hal7_alamatKado)}>
                                <i className="fa-regular fa-copy"></i> Salin Alamat
                            </button>
                            {data.hal7_waKado && (
                              <a href={`https://wa.me/${data.hal7_waKado.replace(/\D/g,'')}`} target="_blank" className="btn-bank btn-wa" style={{ background: '#25D366', color: 'white', border: 'none', padding: '5px 10px', fontSize: '0.8rem', borderRadius: '5px', textDecoration: 'none' }}>
                                <i className="fa-brands fa-whatsapp"></i> Konfirmasi Resi
                              </a>
                            )}
                        </div>
                    </div>
                  )}
              </div>
            </section>
          )}

          {/* ================= HALAMAN 9 (UCAPAN & RSVP) ================= */}
          {data.show_hal9 !== false && (
            <section id="guestbook" className="section guestbook-section" style={{ padding: '40px 15px' }}>
                <div data-animate="fade-up">
                    <Guestbook slug={data.slug} />
                </div>
            </section>
          )}

          {/* ================= HALAMAN 8 (FOOTER) ================= */}
          {data.show_hal8 !== false && (
            <section id="closing" className="section closing-section text-center" style={{ backgroundImage: `url(${data.hal2_fotoCouple || '/demo/template-floral2/assets/images/couple.png'})` }}>
                <div className="closing-gradient-overlay">
                    <h1 className="title-names" data-animate="fade-up" style={{ fontSize: '3.5rem', color: 'black' }}>Terima Kasih</h1>
                    <div className="mt-2" data-animate="fade-up" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-dark)', maxWidth: '320px', margin: '0 auto', fontWeight: 500 }}>
                        <p>{data.hal8_deskripsi || "Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami."}</p>
                        <p className="mt-3">Wassalamu&apos;alaikum Wr. Wb.</p>
                    </div>
                    
                    <h1 id="closing-couple-names" className="title-names mt-4" data-animate="fade-up" style={{ animationDelay: '0.2s' }}>{data.hal1_namaPasangan || "Nama Pasangan"}</h1>
                </div>
            </section>
          )}

          {/* Absolute Footer */}
          <footer className="footer bg-sage-dark text-white text-center">
              <img src="/demo/template-floral2/assets/images/logo.png" alt="StoryKami" className="footer-logo" />
              <h3>STORYKAMI</h3>
              <p className="subtitle">UNDANGAN DIGITAL</p>
              
              <p className="made-with mt-4">Made with <i className="fa-solid fa-heart text-red"></i> by StoryKami</p>
              
              <div className="social-icons mt-3">
                  <a href="#"><i className="fa-brands fa-instagram"></i></a>
                  <a href="#"><i className="fa-brands fa-whatsapp"></i></a>
              </div>
          </footer>
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

