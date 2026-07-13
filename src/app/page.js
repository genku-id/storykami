import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.brandContainer}>
          <Image src="/logo.png" alt="StoryKami Logo" width={70} height={70} style={{objectFit: 'contain'}} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>StoryKami</span>
            <span className={styles.brandSub}>digital invitation</span>
          </div>
        </div>
        <div className={styles.navLinks}>
          <a href="#katalog">Katalog</a>
          <a href="#harga">Harga</a>
          <a href="#reseller">Reseller</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Undangan Digital Elegan untuk Momen Tak Terlupakan</h1>
          <p className={styles.heroSubtitle}>
            Buat undangan pernikahan digital impianmu dengan desain premium, loading super cepat, dan harga yang bersahabat.
          </p>
          <div className={styles.heroActions}>
            <a href="#katalog" className="btn btn-primary">Lihat Katalog</a>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="btn btn-outline">Hubungi Kami</a>
          </div>
        </div>
      </header>

      {/* Katalog Section */}
      <section id="katalog" className="section">
        <div className="container">
          <h2 className="section-title">Katalog Template</h2>
          <div className={styles.catalogGrid}>
            
            {/* Card 1 */}
            <div className={styles.card}>
              <div className={styles.cardImageWrapper}>
                <Image 
                  src="/images/floral1_preview.png" 
                  alt="Floral Elegance 1 Preview" 
                  fill 
                  style={{objectFit: 'cover', objectPosition: 'top'}} 
                />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>Floral Elegance 1</h3>
                <p style={{color: 'var(--text-light)', marginBottom: '1.5rem'}}>Minimalis & Romantis</p>
                {/* Asumsikan template dihosting di /template/template-floral1/index.html */}
                <a href="/demo/template-floral1/index.html?to=Tamu+Demo" target="_blank" rel="noreferrer" className="btn btn-primary" style={{width: '100%'}}>Lihat Demo</a>
              </div>
            </div>

            {/* Card 2 */}
            <div className={styles.card}>
              <div className={styles.cardImageWrapper}>
                <Image 
                  src="/images/floral2_preview.png" 
                  alt="Floral Elegance 2 Preview" 
                  fill 
                  style={{objectFit: 'cover', objectPosition: 'top'}} 
                />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>Floral Elegance 2</h3>
                <p style={{color: 'var(--text-light)', marginBottom: '1.5rem'}}>Vintage & Estetik</p>
                <a href="/demo/template-floral2/index.html?to=Tamu+Demo" target="_blank" rel="noreferrer" className="btn btn-primary" style={{width: '100%'}}>Lihat Demo</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="section" style={{backgroundColor: '#fcfdfc'}}>
        <div className="container">
          <h2 className="section-title">Pilih Paket Mu</h2>
          <div className={styles.pricingGrid}>
            
            {/* Basic Package */}
            <div className={styles.priceCard}>
              <h3 className={styles.priceTitle}>Paket Basic</h3>
              <div className={styles.priceAmount}>Rp 50.000</div>
              <ul className={styles.priceFeatures}>
                <li>✓ Desain Template Premium</li>
                <li>✓ Detail Acara & Navigasi Peta</li>
                <li>✓ Buku Tamu & Ucapan</li>
                <li>✓ Fitur Amplop Digital</li>
                <li>✗ Galeri Foto (Pre-wedding)</li>
              </ul>
              <a href="https://wa.me/6281234567890?text=Halo%20StoryKami,%20saya%20mau%20pesan%20Paket%20Basic" target="_blank" rel="noreferrer" className="btn btn-outline" style={{width: '100%'}}>Pesan Sekarang</a>
            </div>

            {/* Premium Package */}
            <div className={`${styles.priceCard} ${styles.popular}`}>
              <h3 className={styles.priceTitle}>Paket Premium</h3>
              <div className={styles.priceAmount}>Rp 75.000</div>
              <ul className={styles.priceFeatures}>
                <li>✓ Semua Fitur Basic</li>
                <li>✓ Galeri Foto (Pre-wedding)</li>
                <li>✓ Background Musik (Auto-play)</li>
                <li>✓ Revisi Teks Sepuasnya</li>
                <li>✓ Prioritas Pengerjaan (1x24 Jam)</li>
              </ul>
              <a href="https://wa.me/6281234567890?text=Halo%20StoryKami,%20saya%20mau%20pesan%20Paket%20Premium" target="_blank" rel="noreferrer" className="btn btn-primary" style={{width: '100%'}}>Pesan Sekarang</a>
            </div>

          </div>
        </div>
      </section>

      {/* Reseller Section */}
      <section id="reseller" className="section">
        <div className="container">
          <div className={styles.reseller}>
            <div className={styles.resellerContent}>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
              <h2 style={{fontSize: '2.5rem', marginBottom: '1rem'}}>Gabung Menjadi Reseller StoryKami</h2>
              <p style={{fontSize: '1.2rem', opacity: '0.9', maxWidth: '600px', margin: '0 auto 2rem'}}>
                Dapatkan penghasilan tambahan jutaan rupiah dengan menawarkan undangan digital premium kepada relasi Anda. Pendaftaran akan segera dibuka!
              </p>
              <button className="btn btn-outline" style={{borderColor: 'white', color: 'white'}} disabled>Daftar Waiting List</button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WA Button */}
      <a 
        href="https://wa.me/6281234567890?text=Halo%20StoryKami,%20saya%20tertarik%20dengan%20undangan%20digitalnya" 
        target="_blank" 
        rel="noreferrer" 
        className={styles.floatingWa}
        aria-label="Chat WhatsApp"
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.22 5.22 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </a>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.brandContainer} style={{marginBottom: '1rem', justifyContent: 'center', flexDirection: 'column', gap: '0.2rem'}}>
            <Image src="/logo.png" alt="StoryKami Logo" width={100} height={100} style={{objectFit: 'contain'}} />
            <div className={styles.brandText} style={{textAlign: 'center'}}>
              <span className={styles.brandName}>StoryKami</span>
              <span className={styles.brandSub}>digital invitation</span>
            </div>
          </div>
          <p>© {new Date().getFullYear()} StoryKami. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
