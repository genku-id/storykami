'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const TEMPLATES = [
  {
    id: 'template-floral1',
    title: 'Floral Elegance 1',
    desc: 'Elegan & Romantis',
    preview: '/images/floral1_preview.png',
  },
  {
    id: 'template-floral2',
    title: 'Floral Elegance 2',
    desc: 'Klasik & Mewah',
    preview: '/images/floral2_preview.png',
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {TEMPLATES.map(tpl => (
          <div key={tpl.id} style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
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
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{tpl.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 20px 0' }}>{tpl.desc}</p>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handlePilih(tpl.id)}
                  style={{
                    flex: 1,
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-outfit)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Gunakan Tema
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
