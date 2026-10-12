'use client';
import React, { useState, useEffect } from 'react';
import BackgroundMusic from './BackgroundMusic';
import '@/app/wim/dilan.css';
import { defaultInvitationData, normalizeAcara } from '@/utils/wimDataContract';
import { supabase } from '@/utils/supabase';
import { getGoogleCalendarUrl } from '@/utils/calendarHelper';
import { parseDate, formatIndonesianDate } from '@/utils/dateHelper';
import WeddingGiftCard from './WeddingGiftCard';
import WeddingPhysicalGiftCard from './WeddingPhysicalGiftCard';

export default function DilanTemplate({ data = defaultInvitationData, slug = 'test-slug', isVisible: isVisibleProp, guestName = '', isDemo: isDemoProp }) {
  const isDemo = Boolean(isDemoProp) || slug === 'demo' || slug === 'preview' || (typeof slug === 'string' && (slug.startsWith('demo') || slug.includes('demo'))) || (typeof window !== 'undefined' && window.location.pathname.startsWith('/demo'));
  const demoStorageKey = `storykami_demo_guestbook_${slug || 'demo'}`;
  
  const { mempelai, acara, kutipan, pageVisibility = {}, cerita, turutMengundang } = data;
  const acaraList = normalizeAcara(acara);
  const mainEvent = acaraList.find(e => /resepsi/i.test(e.nama) && e.tanggal) || acaraList.find(e => e.tanggal) || acaraList[0];

  // Tamu name
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

  // State Cover & Audio
  const [isLocked, setIsLocked] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Realtime Countdown State
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
  }, [mainEvent]);

  // Supabase guestbook fetch
  useEffect(() => {
    if (isDemo) {
      try {
        if (typeof window !== 'undefined') {
          const localData = localStorage.getItem(demoStorageKey);
          setComments(localData ? JSON.parse(localData) : []);
        }
      } catch (err) {
        console.error('Guestbook demo error:', err);
      }
      return;
    }

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
  }, [slug, isDemo, demoStorageKey]);

  // Scroll animations observer
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

  // Section visibility helper
  const isVisible = (pageKey) => {
    if (isVisibleProp && typeof isVisibleProp === 'function') {
      return isVisibleProp(pageKey);
    }
    return pageVisibility[pageKey] !== false;
  };

  const handleOpenInvitation = () => {
    setIsLocked(false);
    setIsPlaying(true);
  };

  const handleKirimUcapan = async (e) => {
    e.preventDefault();
    if (!namaTamu.trim() || !ucapan.trim()) {
      alert('Mohon isi nama dan ucapan Anda.');
      return;
    }

    setIsSubmitting(true);
    const newComment = {
      invitation_slug: slug,
      nama: namaTamu.trim(),
      ucapan: ucapan.trim(),
      kehadiran: kehadiran,
      created_at: new Date().toISOString()
    };

    if (isDemo) {
      try {
        const currentList = JSON.parse(localStorage.getItem(demoStorageKey) || '[]');
        const updated = [{ id: `demo-${Date.now()}`, ...newComment }, ...currentList];
        localStorage.setItem(demoStorageKey, JSON.stringify(updated));
        setComments(updated);
        setUcapan('');
        alert('Terima kasih atas ucapan dan konfirmasi Anda!');
      } catch (err) {
        console.error('Demo error:', err);
      }
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: inserted, error } = await supabase
        .from('guestbook')
        .insert([newComment])
        .select();

      if (error) throw error;
      if (inserted && inserted[0]) {
        setComments(prev => [inserted[0], ...prev]);
        setUcapan('');
        alert('Terima kasih atas ucapan dan doa restu Anda!');
      }
    } catch (err) {
      console.error('Error insert ucapan:', err);
      alert('Gagal mengirim ucapan, silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default timeline story if not in data
  const stories = (cerita && cerita.length > 0) ? cerita : [
    {
      tanggal: '4 Februari 2019',
      judul: 'Awal Pertemuan',
      deskripsi: 'Takdir mempertemukan kami di sebuah acara kampus. Awalnya hanya sebatas perkenalan biasa, namun tawa dan obrolan ringan malam itu menyisakan kesan yang tak biasa.'
    },
    {
      tanggal: '10 Maret 2019',
      judul: 'Langkah Pertama',
      deskripsi: 'Setelah beberapa kali saling bertukar cerita, sebuah ajakan sederhana untuk makan siang berdua menjadi langkah awal dari kisah kami bersama.'
    },
    {
      tanggal: '7 November 2021',
      judul: 'Ujian Waktu',
      deskripsi: 'Hubungan kami belajar tentang kesabaran, pengertian, dan komitmen. Setiap rindu dan doa menjadi bukti bahwa cinta ini layak diperjuangkan.'
    },
    {
      tanggal: '12 Mei 2025',
      judul: 'Menuju Selamanya',
      deskripsi: 'Hari itu, sebuah lamaran manis terucap. Kami tahu, ini bukan akhir cerita—melainkan awal baru untuk perjalanan seumur hidup.'
    }
  ];

  const wanitaNama = mempelai?.wanita?.namaPanggilan || 'Millea';
  const priaNama = mempelai?.pria?.namaPanggilan || 'Dilan';

  return (
    <div className={`wim-template-dilan ${isLocked ? 'locked' : ''}`}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Background Music Player */}
      <BackgroundMusic 
        url={data?.musikUrl || 'https://www.youtube.com/watch?v=1xK79u87J1k'} 
        isPlaying={isPlaying} 
        start={data?.musikStart || 0}
      />

      {/* Floating Audio Play/Pause Button */}
      {!isLocked && (
        <button 
          className={`dilan-audio-btn ${isPlaying ? 'playing' : ''}`}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
        >
          <i className={`fa-solid ${isPlaying ? 'fa-music' : 'fa-play'}`}></i>
        </button>
      )}

      {/* ==========================================================
          1. COVER SECTION (LOCK SCREEN)
          ========================================================== */}
      {isVisible('cover') && (
        <section id="cover-page" className={`cover-page ${!isLocked ? 'slide-up' : ''}`}>
          <div className="cover-top">
            <p className="cover-tagline">The Wedding Of</p>
            <img src="/assets/templates/dilan/asset_2.webp" alt="Ornament" className="cover-ornament" />
          </div>

          <div className="cover-center">
            <h1 className="cover-names">
              {priaNama}
              <span className="cover-ampersand">&amp;</span>
              {wanitaNama}
            </h1>
          </div>

          <div className="cover-bottom">
            <div className="cover-guest-card">
              <p className="cover-guest-title">Kepada Yth. Bapak/Ibu/Saudara/i:</p>
              <h3 className="cover-guest-name">{tamuName}</h3>
            </div>

            <button className="btn-open-invitation" onClick={handleOpenInvitation}>
              <i className="fa-solid fa-envelope-open"></i> BUKA UNDANGAN
            </button>
          </div>
        </section>
      )}

      {/* ==========================================================
          MAIN INVITATION CONTENT
          ========================================================== */}
      <main id="main-content" style={{ display: isLocked ? 'none' : 'block' }}>

        {/* ==========================================================
            2. HERO SECTION
            ========================================================== */}
        {isVisible('hero') && (
          <section id="hero-section" className="dilan-hero">
            <img src="/assets/templates/dilan/asset_2.webp" alt="Divider" className="section-divider" />
            <p className="section-subtitle">Our Special Day</p>
            <h1 className="hero-names">{priaNama} &amp; {wanitaNama}</h1>
            <p className="hero-date">
              {formatIndonesianDate(mainEvent?.tanggal, { withDay: true })}
            </p>

            <div className="countdown-grid">
              <div className="countdown-box">
                <div className="countdown-num">{String(timeLeft.hari).padStart(2, '0')}</div>
                <div className="countdown-label">Hari</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-num">{String(timeLeft.jam).padStart(2, '0')}</div>
                <div className="countdown-label">Jam</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-num">{String(timeLeft.menit).padStart(2, '0')}</div>
                <div className="countdown-label">Menit</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-num">{String(timeLeft.detik).padStart(2, '0')}</div>
                <div className="countdown-label">Detik</div>
              </div>
            </div>

            <a 
              href={getGoogleCalendarUrl(data, slug, 'main')} 
              target="_blank" 
              rel="noreferrer" 
              className="btn-calendar"
            >
              <i className="fa-regular fa-calendar-check"></i> Simpan di Kalender
            </a>
          </section>
        )}

        {/* ==========================================================
            3. PROFILES SECTION
            ========================================================== */}
        {isVisible('profiles') && (
          <section id="profiles-section" className="dilan-section">
            <div className="section-title-wrap">
              <p className="section-subtitle">Mempelai</p>
              <h2 className="section-title">Kedua Mempelai</h2>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--dilan-text-muted)', lineHeight: '1.7', marginBottom: '35px' }}>
              Assalamu`alaikum Warahmatullaahi Wabarakaatuh.<br />
              Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu senantiasa tercurah mengiringi pernikahan kami:
            </p>

            {/* Mempelai Wanita */}
            <div className="profile-card">
              <div className="profile-avatar-wrap">
                <img 
                  src={mempelai?.wanita?.foto || '/assets/templates/dilan/asset_13.webp'} 
                  alt={mempelai?.wanita?.namaLengkap || 'Mempelai Wanita'} 
                  className="profile-avatar"
                />
              </div>
              <h3 className="profile-name">{mempelai?.wanita?.namaLengkap || 'Milea Pratiwi'}</h3>
              <p className="profile-parents">
                Putri dari Bapak {mempelai?.wanita?.namaAyah || 'Lorem'} &amp; Ibu {mempelai?.wanita?.namaIbu || 'Ipsum'}
              </p>
            </div>

            <div className="ampersand-divider">&amp;</div>

            {/* Mempelai Pria */}
            <div className="profile-card">
              <div className="profile-avatar-wrap">
                <img 
                  src={mempelai?.pria?.foto || '/assets/templates/dilan/asset_10.webp'} 
                  alt={mempelai?.pria?.namaLengkap || 'Mempelai Pria'} 
                  className="profile-avatar"
                />
              </div>
              <h3 className="profile-name">{mempelai?.pria?.namaLengkap || 'Dilan Pratama'}</h3>
              <p className="profile-parents">
                Putra dari Bapak {mempelai?.pria?.namaAyah || 'Lorem'} &amp; Ibu {mempelai?.pria?.namaIbu || 'Ipsum'}
              </p>
            </div>
          </section>
        )}

        {/* ==========================================================
            4. QUOTE SECTION
            ========================================================== */}
        {isVisible('quote') && (
          <section id="quote-section" className="dilan-section" style={{ paddingTop: '20px', paddingBottom: '30px' }}>
            <div className="quote-box">
              <p className="quote-arabic">
                وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً
              </p>
              <p className="quote-text">
                "{kutipan?.teks || 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.'}"
              </p>
              <p className="quote-source">
                {kutipan?.sumber || 'QS. Ar-Rum: 21'}
              </p>
            </div>
          </section>
        )}

        {/* ==========================================================
            5. EVENTS SECTION
            ========================================================== */}
        {isVisible('events') && (
          <section id="events-section" className="dilan-section">
            <div className="section-title-wrap">
              <p className="section-subtitle">Agenda Acara</p>
              <h2 className="section-title">Waktu &amp; Tempat</h2>
            </div>

            {acaraList.map((item, idx) => (
              <div key={idx} className="event-card">
                <span className="event-badge">{item.nama || `Acara ${idx + 1}`}</span>
                <h3 className="event-title">{item.nama}</h3>

                <div className="event-date-box">
                  <div className="event-date-text">
                    {formatIndonesianDate(item.tanggal, { withDay: true })}
                  </div>
                  <div className="event-time-text">
                    {item.waktuMulai ? `Pukul ${item.waktuMulai} ${item.waktuSelesai ? `- ${item.waktuSelesai}` : 'WIB'}` : 'Waktu menyusul'}
                  </div>
                </div>

                <div className="event-location-name">{item.tempat || 'Lokasi Acara'}</div>
                <div className="event-location-addr">{item.alamat || 'Alamat lengkap lokasi acara pernikahan'}</div>

                {item.mapsUrl && (
                  <a href={item.mapsUrl} target="_blank" rel="noreferrer" className="btn-maps">
                    <i className="fa-solid fa-map-location-dot"></i> Buka Google Maps
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ==========================================================
            6. LOVE STORY / TURUT MENGUNDANG SECTION
            ========================================================== */}
        {isVisible('story') && (
          <section id="story-section" className="dilan-section">
            <div className="section-title-wrap">
              <p className="section-subtitle">Kisah Kami</p>
              <h2 className="section-title">Love Story</h2>
            </div>

            <div className="timeline-wrap">
              {stories.map((st, sIdx) => (
                <div key={sIdx} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-card">
                    <div className="timeline-date">{st.tanggal}</div>
                    <h4 className="timeline-title">{st.judul}</h4>
                    <p className="timeline-desc">{st.deskripsi}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Turut Mengundang Box */}
            <div className="invitee-box" style={{ marginTop: '35px' }}>
              <h4 className="invitee-title">Turut Mengundang</h4>
              <p className="invitee-list">
                <strong>Keluarga Mempelai Pria:</strong><br />
                {turutMengundang?.pria || 'Keluarga Besar Bapak Lorem & Ibu Ipsum'}<br /><br />
                <strong>Keluarga Mempelai Wanita:</strong><br />
                {turutMengundang?.wanita || 'Keluarga Besar Bapak Lorem & Ibu Ipsum'}
              </p>
            </div>
          </section>
        )}

        {/* ==========================================================
            7. WEDDING GIFT SECTION
            ========================================================== */}
        {isVisible('gift') && (
          <section id="gift-section" className="dilan-section">
            <div className="section-title-wrap">
              <p className="section-subtitle">Tanda Kasih</p>
              <h2 className="section-title">Wedding Gift</h2>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--dilan-text-muted)', lineHeight: '1.6', marginBottom: '30px' }}>
              Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless:
            </p>

            {data?.rekening && data.rekening.length > 0 ? (
              data.rekening.map((rek, rIdx) => (
                <WeddingGiftCard key={rIdx} gift={rek} />
              ))
            ) : (
              <div className="gift-card">
                <p className="gift-bank-title">Bank Central Asia (BCA)</p>
                <div className="gift-rekening-number">1234567890</div>
                <p className="gift-owner">a.n. Dilan Pratama</p>
                <button 
                  className="btn-copy-gift"
                  onClick={() => {
                    navigator.clipboard.writeText('1234567890');
                    alert('Nomor rekening berhasil disalin!');
                  }}
                >
                  <i className="fa-regular fa-copy"></i> Salin Rekening
                </button>
              </div>
            )}

            {/* Kado Fisik */}
            {data?.kadoFisik?.alamat && (
              <div style={{ marginTop: '20px' }}>
                <WeddingPhysicalGiftCard kadoFisik={data.kadoFisik} />
              </div>
            )}
          </section>
        )}

        {/* ==========================================================
            8. GUESTBOOK SECTION (UCAPAN & DOA)
            ========================================================== */}
        {isVisible('guestbook') && (
          <section id="guestbook-section" className="dilan-section">
            <div className="section-title-wrap">
              <p className="section-subtitle">Buku Tamu</p>
              <h2 className="section-title">Ucapan &amp; Doa</h2>
            </div>

            <form className="guestbook-form" onSubmit={handleKirimUcapan}>
              <input 
                type="text" 
                className="guestbook-input" 
                placeholder="Nama Anda"
                value={namaTamu}
                onChange={e => setNamaTamu(e.target.value)}
                required
              />

              <select 
                className="guestbook-select"
                value={kehadiran}
                onChange={e => setKehadiran(e.target.value)}
              >
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
                <option value="Ragu-ragu">Masih Ragu</option>
              </select>

              <textarea 
                className="guestbook-textarea" 
                rows="4" 
                placeholder="Tuliskan ucapan dan doa terbaik Anda..."
                value={ucapan}
                onChange={e => setUcapan(e.target.value)}
                required
              ></textarea>

              <button type="submit" className="btn-submit-guestbook" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
              </button>
            </form>

            {/* Comments List */}
            <div className="comment-list">
              {comments.length > 0 ? (
                comments.map((c, cIdx) => (
                  <div key={c.id || cIdx} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">{c.nama}</span>
                      <span className="comment-badge">{c.kehadiran || 'Hadir'}</span>
                    </div>
                    <p className="comment-text">{c.ucapan}</p>
                    <div className="comment-time">
                      {new Date(c.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--dilan-text-muted)' }}>
                  Belum ada ucapan. Jadilah yang pertama memberikan doa restu!
                </p>
              )}
            </div>
          </section>
        )}

        {/* ==========================================================
            9. CLOSING SECTION
            ========================================================== */}
        {isVisible('closing') && (
          <section id="closing-section" className="dilan-closing">
            <img src="/assets/templates/dilan/asset_2.webp" alt="Ornament" className="section-divider" />
            <p className="closing-text">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.<br /><br />
              Atas kehadiran dan doa restu dari Bapak/Ibu/Saudara/i sekalian, kami mengucapkan terima kasih.<br /><br />
              <em>Wassalamu`alaikum Warahmatullaahi Wabarakaatuh</em>
            </p>
            <h2 className="closing-names">{priaNama} &amp; {wanitaNama}</h2>
            <p className="closing-date">{formatIndonesianDate(mainEvent?.tanggal, { withDay: false })}</p>
          </section>
        )}

        {/* ==========================================================
            10. FOOTER SECTION
            ========================================================== */}
        {isVisible('footer') && (
          <footer id="footer-section" className="dilan-footer">
            <div className="footer-brand">StoryKami</div>
            <p className="footer-sub">Platform Undangan Digital Modern &amp; Elegan</p>
          </footer>
        )}

      </main>
    </div>
  );
}
