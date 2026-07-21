'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const TEMPLATES = [
  {
    id: 'template-floral1',
    title: 'Floral Elegance 1',
    demo: '/demo/template-floral1/index.html?to=Tamu+Demo',
    preview: '/images/floral1_preview.png',
  },
  {
    id: 'template-floral2',
    title: 'Floral Elegance 2',
    demo: '/demo/template-floral2/index.html?to=Tamu+Demo',
    preview: '/images/floral2_preview.png',
  },
  {
    id: 'template-daerahJawa',
    title: 'Jawa Klasik',
    demo: '/demo/template-daerahJawa/index.html?to=Tamu+Demo',
    preview: '/images/jawa_preview.png',
  }
];

export default function KatalogPage() {
  const router = useRouter();

  const handlePilih = (templateId) => {
    router.push(`/wim/dashboard/buat?template=${templateId}`);
  };

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>Katalog Tema</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Pilih desain undangan digital terbaik untuk klien Anda.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '16px'
      }}>
        {TEMPLATES.map(tpl => (
          <div key={tpl.id} style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: '#f0f0f0' }}>
              <Image 
                src={tpl.preview} 
                alt={`${tpl.title} Preview`}
                fill
                style={{ objectFit: 'cover', objectPosition: 'top' }}
              />
            </div>
            <div style={{ padding: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', lineHeight: 1.2, textAlign: 'center' }}>{tpl.title}</h3>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <a 
                  href={tpl.demo}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#000',
                    border: '1px solid #000',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Previu
                </a>
                <button 
                  onClick={() => handlePilih(tpl.id)}
                  style={{
                    flex: 1,
                    background: '#000',
                    color: '#fff',
                    border: '1px solid #000',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Gunakan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
