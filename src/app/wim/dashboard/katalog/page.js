'use client';
import { useRouter } from 'next/navigation';

const TEMPLATES = [
  {
    id: 'floral1',
    name: 'Floral Elegance 1',
    description: 'Desain elegan dengan ornamen bunga untuk pernikahan romantis.',
    image: '/floral1-preview.jpg', // Placeholder image
  },
  {
    id: 'template-daerahJawa',
    name: 'Jawa Klasik',
    description: 'Tema tradisional bernuansa adat Jawa yang sakral dan klasik.',
    image: '/jawa-preview.jpg', // Placeholder image
  }
];

export default function KatalogTemaPage() {
  const router = useRouter();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Katalog Tema</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Pilih tema yang sesuai untuk undangan Anda, lalu buat undangan baru.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {TEMPLATES.map((tpl) => (
          <div key={tpl.id} style={{ 
            background: 'var(--bg-card)', 
            borderRadius: '12px', 
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ height: '200px', background: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              {/* If real images exist, use <img src={tpl.image} /> instead */}
              <span>Preview {tpl.name}</span>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{tpl.name}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flex: 1 }}>{tpl.description}</p>
              <button 
                onClick={() => router.push(`/wim/dashboard/baru?template=${tpl.id}`)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--accent, #000)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Gunakan Tema Ini
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
