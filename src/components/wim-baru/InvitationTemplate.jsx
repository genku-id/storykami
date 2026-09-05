'use client';
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { defaultInvitationData } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';

/**
 * InvitationTemplate — Base component untuk semua template undangan.
 * 
 * Logic yang di-share:
 *   - Cover lock + audio player
 *   - Countdown timer
 *   - Guestbook (fetch + insert)
 *   - Scroll animation (IntersectionObserver)
 *   - Section visibility (pageVisibility)
 * 
 * Props:
 *   - data        : object data undangan (wimDataContract)
 *   - slug        : string slug undangan
 *   - isVisible   : function(key) => boolean
 *   - cssFile     : string path CSS file (dynamic import)
 *   - rootClass   : string CSS class di root element
 *   - children    : render functions untuk override section
 *     - renderCover({ data, handleBukaUndangan })
 *     - renderHero({ data, timeLeft, isPlaying, setIsPlaying })
 *     - renderProfiles({ data })
 *     - renderQuote({ data })
 *     - renderEvents({ data })
 *     - renderLoveStory({ data })
 *     - renderGift({ data })
 *     - renderGuestbook({ data, comments, namaTamu, setNamaTamu, ucapan, setUcapan, handleKirimUcapan, isSubmitting })
 *     - renderClosing({ data })
 *     - renderFooter()
 */
export default function InvitationTemplate({
  data = defaultInvitationData,
  slug = 'test-slug',
  isVisible: isVisibleProp,
  rootClass = 'wim-template',
  // Render props — override section per theme
  renderCover,
  renderHero,
  renderProfiles,
  renderQuote,
  renderEvents,
  renderLoveStory,
  renderGift,
  renderGuestbook,
  renderClosing,
  renderFooter,
}) {
  const { mempelai, acara, kutipan, pageVisibility = {} } = data;

  // === Shared State ===
  const [comments, setComments] = useState([]);
  const [namaTamu, setNamaTamu] = useState('');
  const [ucapan, setUcapan] = useState('');
  const [kehadiran, setKehadiran] = useState('Hadir');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hari: 0, jam: 0, menit: 0, detik: 0 });

  // === Countdown ===
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

  // === Guestbook Fetch ===
  useEffect(() => {
    const fetchComments = async () => {
      if (!slug) return;
      const { data: dbComments } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_slug', slug)
        .order('created_at', { ascending: false });
      if (dbComments) setComments(dbComments);
    };
    fetchComments();
  }, [slug]);

  // === Scroll Animation ===
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.1 });
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [pageVisibility, data, isLocked]);

  // === Handlers ===
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

  const handleBukaUndangan = () => {
    setIsLocked(false);
    setIsPlaying(true);
  };

  const isVisible = (key) => {
    if (isVisibleProp) return isVisibleProp(key);
    return pageVisibility[key] ?? true;
  };

  // === Shared context untuk render props ===
  const ctx = {
    data,
    slug,
    mempelai,
    acara,
    kutipan,
    timeLeft,
    isLocked,
    isPlaying,
    setIsPlaying,
    isSubmitting,
    comments,
    namaTamu, setNamaTamu,
    ucapan, setUcapan,
    kehadiran, setKehadiran,
    handleKirimUcapan,
    handleBukaUndangan,
    isVisible,
  };

  // === Default section renderers (base structure) ===
  const defaultCover = () => (
    <section id="cover-page" className="section cover-page text-center">
      <div className="cover-content">
        <div className="wedding-text">
          <p className="subtitle">The Wedding Of</p>
          <h2 className="title-names-cursive">{mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}</h2>
        </div>
        <div className="guest-info">
          <p className="kepada-yth">Kepada Yth:</p>
          <h3 className="guest-name">Nama Tamu</h3>
        </div>
        <button type="button" id="btn-open" className="btn-cover" onClick={handleBukaUndangan}>
          <i className="fa-solid fa-envelope"></i> BUKA UNDANGAN
        </button>
      </div>
    </section>
  );

  const defaultHero = () => (
    <section id="hero" className="section hero-section">
      <button id="btn-audio" className={`btn-audio ${isPlaying ? 'playing' : ''}`} onClick={() => setIsPlaying(!isPlaying)}>
        <i className={`fa-solid ${isPlaying ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
      </button>
      <div className="hero-content text-center">
        <h1 className="title-names">{mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}</h1>
        <p className="date-highlight">
          {acara?.akad?.tanggal ? new Date(acara.akad.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        </p>
        <div className="countdown-container">
          <div className="countdown-item"><span>{String(timeLeft.hari).padStart(2, '0')}</span><p>Hari</p></div>
          <div className="countdown-item"><span>{String(timeLeft.jam).padStart(2, '0')}</span><p>Jam</p></div>
          <div className="countdown-item"><span>{String(timeLeft.menit).padStart(2, '0')}</span><p>Menit</p></div>
          <div className="countdown-item"><span>{String(timeLeft.detik).padStart(2, '0')}</span><p>Detik</p></div>
        </div>
        <a href={acara?.akad?.linkMap || '#'} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <i className="fa-regular fa-calendar-check"></i> Simpan di Kalender
        </a>
      </div>
    </section>
  );

  const defaultProfiles = () => (
    <section id="profiles" className="section profiles-section">
      <div className="profiles-content">
        <p className="greeting">
          <strong>Assalamu'alaikum Warahmatullahi Wabarakatuh</strong><br/><br/>
          Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.
        </p>
        <div className="profile-card">
          <img src={mempelai?.wanita?.fotoUtama || "/assets/images/bride.png"} alt="Wanita" />
          <h2 className="title-names">{mempelai?.wanita?.namaLengkap}</h2>
          <p className="parents">{mempelai?.wanita?.urutanAnak} dari<br/>{mempelai?.wanita?.namaAyah} &amp; {mempelai?.wanita?.namaIbu}</p>
        </div>
        <div className="ampersand">&amp;</div>
        <div className="profile-card">
          <img src={mempelai?.pria?.fotoUtama || "/assets/images/groom.png"} alt="Pria" />
          <h2 className="title-names">{mempelai?.pria?.namaLengkap}</h2>
          <p className="parents">{mempelai?.pria?.urutanAnak} dari<br/>{mempelai?.pria?.namaAyah} &amp; {mempelai?.pria?.namaIbu}</p>
        </div>
      </div>
    </section>
  );

  const defaultQuote = () => (
    <section id="quote" className="section quote-section">
      <div className="quote-content">
        <h3>{kutipan?.sumber}</h3>
        <p>"{kutipan?.teks}"</p>
      </div>
    </section>
  );

  const defaultEvents = () => (
    <section id="events" className="section events-section">
      <div className="events-content">
        {['akad', 'resepsi'].map(tipe => (
          <div className="event-card" key={tipe}>
            <h2>{tipe === 'akad' ? 'Akad Nikah' : 'Resepsi'}</h2>
            <p>{acara?.[tipe]?.tanggal ? new Date(acara[tipe].tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
            <p>Pukul {acara?.[tipe]?.waktuMulai} - {acara?.[tipe]?.waktuSelesai} {acara?.[tipe]?.zonaWaktu}</p>
            <p>{acara?.[tipe]?.lokasi}</p>
            <p>{acara?.[tipe]?.alamatLengkap}</p>
            <a href={acara?.[tipe]?.linkMap} target="_blank" rel="noreferrer" className="btn-maps"><i className="fa-solid fa-location-dot"></i> Google Maps</a>
          </div>
        ))}
      </div>
    </section>
  );

  const defaultLoveStory = () => (
    <section id="lovestory" className="section lovestory-section">
      <h2 className="section-title">Love Story</h2>
      <div className="story-frame">
        {data.ceritaCinta?.map((cerita, idx) => (
          <React.Fragment key={idx}>
            <div className="story-item">
              <h3>{cerita.judul}</h3>
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
  );

  const defaultGift = () => (
    <section id="gift" className="section gift-section">
      <div className="gift-section-header">
        <i className="fa-solid fa-gift fa-3x"></i>
        <h2 className="section-title">Wedding Gift</h2>
        <p>Doa Restu Anda merupakan karunia yang sangat berarti bagi kami.</p>
      </div>
      <div className="gift-container">
        {data.hadiahDigital?.accounts?.map((acc, idx) => (
          <div className="bank-card" key={idx}>
            <h3>Transfer</h3>
            <h4>{acc.name}</h4>
            <p>{acc.number}</p>
            <p>{acc.owner}</p>
            <button onClick={() => navigator.clipboard.writeText(acc.number)}><i className="fa-regular fa-copy"></i> Salin</button>
          </div>
        ))}
        {data.hadiahDigital?.physicalAddress && (
          <div className="bank-card">
            <h3>Kirim Kado</h3>
            <p>{data.hadiahDigital.physicalAddress}</p>
            <p>Penerima: {data.hadiahDigital.receiver}</p>
          </div>
        )}
      </div>
    </section>
  );

  const defaultGuestbook = () => (
    <section id="guestbook" className="section guestbook-section">
      <div className="guestbook-header">
        <h2 className="section-title">Ucapan &amp; Doa</h2>
        <p>Berikan ucapan harapan dan doa kepada kedua mempelai</p>
      </div>
      <div className="guestbook-container">
        <form className="guestbook-form" onSubmit={handleKirimUcapan}>
          <input type="text" placeholder="Nama Tamu" required value={namaTamu} onChange={e => setNamaTamu(e.target.value)} />
          <textarea rows="2" placeholder="Tulis ucapan" maxLength="300" required value={ucapan} onChange={e => setUcapan(e.target.value)}></textarea>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
          </button>
        </form>
        <div className="comments-wrapper">
          <p className="comments-count"><i className="fa-solid fa-comments"></i> {comments.length} Ucapan</p>
          <div className="comments-list">
            {comments.map((msg, i) => (
              <div className="comment-item" key={msg.id || i}>
                <img src="/assets/images/logo.png" className="comment-avatar-img" alt="Logo" />
                <div className="comment-bubble">
                  <h4 className="comment-name">{msg.nama}</h4>
                  <p className="comment-text">{msg.ucapan}</p>
                  <small className="time">{new Date(msg.created_at).toLocaleDateString('id-ID')}</small>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p>Belum ada ucapan.</p>}
          </div>
        </div>
      </div>
    </section>
  );

  const defaultClosing = () => (
    <section id="closing" className="section closing-section text-center">
      <h1 className="title-names">Terima Kasih</h1>
      <div className="mt-2">
        <p>Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.</p>
        <p className="mt-3">Wassalamu'alaikum Wr. Wb.</p>
      </div>
      <h1 className="title-names mt-4">{mempelai?.wanita?.namaPanggilan} &amp; {mempelai?.pria?.namaPanggilan}</h1>
    </section>
  );

  const defaultFooter = () => (
    <footer className="footer text-center">
      <img src="/assets/images/logo.png" alt="StoryKami" className="footer-logo" />
      <h3>STORYKAMI</h3>
      <p className="subtitle">UNDANGAN DIGITAL</p>
      <p className="made-with mt-4">Made with <i className="fa-solid fa-heart text-red"></i> by StoryKami</p>
    </footer>
  );

  return (
    <div className={`${rootClass} ${isLocked ? 'locked' : ''}`} style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: isLocked ? 'hidden' : 'auto' }}>
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
            config={{ youtube: { playerVars: { autoplay: 1, controls: 0 } } }}
          />
        </div>
      )}

      {/* Cover Section */}
      {isVisible('cover') && (renderCover ? renderCover(ctx) : defaultCover())}

      <main id="main-content" style={{ display: isLocked ? 'none' : 'block' }}>
        {/* Hero */}
        {isVisible('hero') && (renderHero ? renderHero(ctx) : defaultHero())}
        {/* Profiles */}
        {isVisible('profiles') && (renderProfiles ? renderProfiles(ctx) : defaultProfiles())}
        {/* Quote */}
        {isVisible('quote') && (renderQuote ? renderQuote(ctx) : defaultQuote())}
        {/* Events */}
        {isVisible('events') && (renderEvents ? renderEvents(ctx) : defaultEvents())}
        {/* Love Story */}
        {isVisible('loveStory') && data.ceritaCinta && data.ceritaCinta.length > 0 && (renderLoveStory ? renderLoveStory(ctx) : defaultLoveStory())}
        {/* Gift */}
        {isVisible('gift') && (renderGift ? renderGift(ctx) : defaultGift())}
        {/* Guestbook */}
        {isVisible('guestbook') && (renderGuestbook ? renderGuestbook(ctx) : defaultGuestbook())}
        {/* Closing */}
        {isVisible('closing') && (renderClosing ? renderClosing(ctx) : defaultClosing())}
        {/* Footer */}
        {renderFooter ? renderFooter(ctx) : defaultFooter()}
      </main>
    </div>
  );
}
