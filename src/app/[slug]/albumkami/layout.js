import './albumkami.css';

export const metadata = {
  title: 'Album Kami • Nocturne Noir Wedding Capture',
  description: 'Galeri album pernikahan bersama para tamu undangan.',
};

export default function AlbumKamiLayout({ children }) {
  return (
    <div className="albumkami-root min-h-screen bg-[#070709] text-[#f4f4f5] font-sans antialiased selection:bg-[#d4af37] selection:text-black">
      {children}
    </div>
  );
}
