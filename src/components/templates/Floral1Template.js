'use client';
import { useEffect } from 'react';
import Script from 'next/script';

export default function Floral1Template({ data }) {
  useEffect(() => {
    // Memaksa background scroll lock di awal
    document.body.classList.add('locked');
    return () => {
      document.body.classList.remove('locked');
    };
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&family=Great+Vibes&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link rel="stylesheet" href="/demo/template-floral1/assets/css/style.css?v=71" />

      {/* Cover Section */}
      <section id="cover-page" className="section cover-page text-center">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
        
        <div className="floral-bottom-cover"></div>
        <div className="cover-content">
          <div className="monogram-large">
            <span className="mono-m"><span className="cover-slide-in-left">{data.groomName?.[0]}</span></span>
            <span className="mono-d"><span className="cover-slide-in-right">{data.brideName?.[0]}</span></span>
          </div>
          
          <div className="wedding-text cover-fade-up-1">
            <p className="subtitle text-serif">The Wedding Of</p>
            <h2 className="title-names-cursive">{data.coupleName}</h2>
          </div>
          
          <div className="guest-info cover-fade-up-2">
            <p className="kepada-yth text-serif">Kepada Yth:</p>
            <h3 className="guest-name text-serif">Nama Tamu</h3>
          </div>
          
          <button id="btn-open" className="btn-cover cover-fade-up-3">
            <i className="fa-solid fa-envelope"></i> BUKA UNDANGAN
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section id="hero" className="section hero-section">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
          
          <button id="btn-audio" className="btn-audio">
            <i className="fa-solid fa-volume-xmark"></i>
          </button>
      
          <div className="hero-content text-center">
            <div className="hero-image-container mb-4" data-animate="zoom-in">
              <img src={data.heroImage || "/demo/template-floral1/assets/images/couple.png"} alt="Couple" className="hero-couple-img" style={{ objectFit: 'cover' }} />
            </div>
            <h1 className="title-names text-sage mb-3 mt-4" data-animate="slide-right">{data.coupleName}</h1>
            <p className="date-highlight mb-4" data-animate="slide-left">{data.weddingDate || "12 Desember 2026"}</p>
            
            <div className="countdown-container" data-animate="fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="countdown-item">
                <span id="days">00</span>
                <p>Hari</p>
              </div>
              <div className="countdown-item">
                <span id="hours">00</span>
                <p>Jam</p>
              </div>
              <div className="countdown-item">
                <span id="minutes">00</span>
                <p>Menit</p>
              </div>
              <div className="countdown-item">
                <span id="seconds">00</span>
                <p>Detik</p>
              </div>
            </div>
          </div>
          <div className="floral-bottom-hero"></div>
        </section>

        {/* Profiles Section */}
        <section id="profiles" className="section profiles-section">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
          <div className="cloud cloud-4"></div>
          
          <div className="floral-top-profiles"></div>
          
          <div className="profiles-content" data-animate="fade-up">
            <p className="greeting text-dark mb-4" style={{ fontSize: '0.85rem', lineHeight: '1.6', fontStyle: 'italic', color: '#000', marginBottom: '30px' }}>
              <strong>{data.greetingTitle || "Assalamu'alaikum Warahmatullahi Wabarakatuh"}</strong><br/><br/>
              {data.greetingText || "Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu menyertai pernikahan putra-putri kami:"}
            </p>

            {/* Bride */}
            <div className="profile-card">
              <div data-animate="slide-long-right">
                <div className="profile-avatar-wrapper">
                  <div className="avatar-circle">
                    <img src={data.brideImage || "/demo/template-floral1/assets/images/bride.png"} alt={data.brideName} style={{ objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
              <h2 className="title-names mt-3" data-animate="fade-up" style={{ transitionDelay: '0.2s' }}>{data.brideName}</h2>
              <p className="parents" data-animate="fade-up" style={{ transitionDelay: '0.4s' }}>Putri dari<br/>{data.brideParents || "Bapak Lorem Dan Ibu Ipsum"}</p>
            </div>

            <div className="ampersand text-center" data-animate="zoom-in">&</div>

            {/* Groom */}
            <div className="profile-card">
              <div data-animate="slide-long-left">
                <div className="profile-avatar-wrapper">
                  <div className="avatar-circle">
                    <img src={data.groomImage || "/demo/template-floral1/assets/images/groom.png"} alt={data.groomName} style={{ objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
              <h2 className="title-names mt-3" data-animate="fade-up" style={{ transitionDelay: '0.2s' }}>{data.groomName}</h2>
              <p className="parents" data-animate="fade-up" style={{ transitionDelay: '0.4s' }}>Putra dari<br/>{data.groomParents || "Bapak Lorem Dan Ibu Ipsum"}</p>
            </div>
          </div>
          
          <div className="floral-bottom-profiles"></div>
        </section>

        {/* Quote */}
        {data.showQuote !== false && (
          <section id="quote" className="section quote-section bg-dark-blue">
            <div className="floral-corner floral-pattern-1 floral-middle-right"></div>
            <div className="floral-corner floral-pattern-1 floral-bottom-left-large"></div>
            
            <div className="quote-content" data-animate="fade-up">
              <div className="quote-image-card">
                <img src={data.quoteImage || data.heroImage || "/demo/template-floral1/assets/images/couple.png"} alt="Pasangan" className="quote-main-image" style={{ objectFit: 'cover' }} />
              </div>
              <div className="quote-text text-white mt-4">
                <h3>{data.quoteTitle || "QS. Ar-Rum Ayat 21"}</h3>
                <p className="arabic-text mt-3">{data.quoteText || "وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً ۗاِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ"}</p>
              </div>
            </div>
          </section>
        )}

        {data.showLoveStory !== false && (
          <section id="lovestory" className="section lovestory-section bg-dark-blue">
            <h2 className="section-title text-white text-center mb-5" data-animate="fade-up">Love Story</h2>
            
            <div className="story-frame" data-animate="zoom-in">
              <div className="story-item story-left">
                <h3 className="story-title">Awal Pertemuan</h3>
                <p className="story-date">4 Februari 2019</p>
                <p className="story-text">Takdir mempertemukan kami.</p>
              </div>
            </div>
          </section>
        )}

        {/* Closing Section */}
        <section id="closing" className="section closing-section text-center">
          <div className="closing-gradient-overlay">
            <h1 className="title-names" data-animate="fade-up" style={{ fontSize: '3.5rem', color: 'black' }}>Terima Kasih</h1>
            <div className="mt-2" data-animate="fade-up" style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-dark)', maxWidth: '320px', margin: '0 auto', fontWeight: 500 }}>
              <p>Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.</p>
            </div>
            
            <h1 id="closing-couple-names" className="title-names mt-4" data-animate="fade-up" style={{ animationDelay: '0.2s' }}>{data.coupleName}</h1>
          </div>
        </section>
      </main>

      <Script src="/demo/template-floral1/assets/js/script.js?v=68" strategy="afterInteractive" />
    </>
  );
}
