import React from 'react';

export const PHOTO_FRAMES = [
  {
    id: 'none',
    name: 'Tanpa',
    desc: 'Foto bersih original tanpa bingkai',
    color: '#8e8e93',
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    desc: 'Format instan klasik dengan border putih dan dagu lebar di bawah',
    color: '#f5f5f7',
  },
  {
    id: 'film',
    name: 'Film',
    desc: 'Strip klise film analog 35mm dengan sproket dan kode frame',
    color: '#d4af37',
  },
  {
    id: 'damask',
    name: 'Damask',
    desc: 'Ornamen ukiran damask baroque royal emas mewah di setiap sudut',
    color: '#e5c05d',
  },
  {
    id: 'floral',
    name: 'Bunga',
    desc: 'Sentuhan ornamen sudut bunga mekar estetik yang romantis',
    color: '#f3c68f',
  },
  {
    id: 'deco',
    name: 'Deco',
    desc: 'Garis ganda simetris Art-Deco sudut geometris khas arsitektur klasik',
    color: '#c5a059',
  },
  {
    id: 'botanical',
    name: 'Botani',
    desc: 'Ranting dedaunan botani minimalis yang anggun dan natural',
    color: '#a3b899',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    desc: 'Border ganda antik bertekstur dengan aksen sudut era nostalgia',
    color: '#d6a374',
  },
];

/**
 * Komponen ornamen overlay bingkai untuk foto galeri, lightbox, dan kamera.
 */
export function PhotoFrameDecoration({ frameId }) {
  if (!frameId || frameId === 'none') return null;

  if (frameId === 'polaroid') {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2 pb-6 sm:p-3 sm:pb-8 border-[6px] sm:border-[8px] border-white/90 bg-transparent shadow-inner">
        <div className="w-full flex justify-between items-start opacity-70">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-300/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-stone-300/60" />
        </div>
        <div className="w-full flex justify-center items-center">
          <span className="font-serif italic text-[10px] text-stone-400/90 tracking-widest uppercase">
            StoryKami • Instant
          </span>
        </div>
      </div>
    );
  }

  if (frameId === 'film') {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between border-y-[14px] sm:border-y-[18px] border-x-2 border-black/95">
        {/* Top Sprocket Perforations */}
        <div className="absolute -top-[13px] sm:-top-[17px] inset-x-0 h-3 sm:h-3.5 flex items-center justify-around px-1 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div key={`st-${i}`} className="w-2 sm:w-2.5 h-1.5 sm:h-2 rounded-[2px] bg-white/70 shadow-sm" />
          ))}
        </div>

        {/* Film metadata stamps */}
        <div className="w-full flex justify-between items-center px-2 py-0.5 text-[8px] sm:text-[9px] font-mono text-amber-400/80 tracking-widest uppercase">
          <span>KODAK 400</span>
          <span>▶ 24A</span>
        </div>

        {/* Bottom Sprocket Perforations */}
        <div className="absolute -bottom-[13px] sm:-bottom-[17px] inset-x-0 h-3 sm:h-3.5 flex items-center justify-around px-1 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div key={`sb-${i}`} className="w-2 sm:w-2.5 h-1.5 sm:h-2 rounded-[2px] bg-white/70 shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (frameId === 'damask') {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 p-2 sm:p-2.5">
        {/* Inset Border Line */}
        <div className="w-full h-full border border-amber-300/40 relative">
          {/* Top-Left Damask Accent */}
          <svg className="absolute -top-1.5 -left-1.5 w-6 h-6 text-amber-300/90 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C12 2 10.5 5 8 5C5.5 5 4 3 4 3C4 3 4.5 6 3 8C1.5 10 0 10 0 10C0 10 3 11.5 4 14C5 16.5 3 19 3 19C3 19 6 18 8 20C10 22 10.5 24 10.5 24C10.5 24 11 21 13 19C15 17 18 18 18 18C18 18 16.5 15.5 18 13C19.5 10.5 22 10 22 10C22 10 19.5 9.5 18 7C16.5 4.5 18 2 18 2C18 2 15 3.5 13 2.5C11 1.5 12 2 12 2Z" opacity="0.9" />
          </svg>
          {/* Top-Right Damask Accent */}
          <svg className="absolute -top-1.5 -right-1.5 w-6 h-6 text-amber-300/90 drop-shadow scale-x-[-1]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C12 2 10.5 5 8 5C5.5 5 4 3 4 3C4 3 4.5 6 3 8C1.5 10 0 10 0 10C0 10 3 11.5 4 14C5 16.5 3 19 3 19C3 19 6 18 8 20C10 22 10.5 24 10.5 24C10.5 24 11 21 13 19C15 17 18 18 18 18C18 18 16.5 15.5 18 13C19.5 10.5 22 10 22 10C22 10 19.5 9.5 18 7C16.5 4.5 18 2 18 2C18 2 15 3.5 13 2.5C11 1.5 12 2 12 2Z" opacity="0.9" />
          </svg>
          {/* Bottom-Left Damask Accent */}
          <svg className="absolute -bottom-1.5 -left-1.5 w-6 h-6 text-amber-300/90 drop-shadow scale-y-[-1]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C12 2 10.5 5 8 5C5.5 5 4 3 4 3C4 3 4.5 6 3 8C1.5 10 0 10 0 10C0 10 3 11.5 4 14C5 16.5 3 19 3 19C3 19 6 18 8 20C10 22 10.5 24 10.5 24C10.5 24 11 21 13 19C15 17 18 18 18 18C18 18 16.5 15.5 18 13C19.5 10.5 22 10 22 10C22 10 19.5 9.5 18 7C16.5 4.5 18 2 18 2C18 2 15 3.5 13 2.5C11 1.5 12 2 12 2Z" opacity="0.9" />
          </svg>
          {/* Bottom-Right Damask Accent */}
          <svg className="absolute -bottom-1.5 -right-1.5 w-6 h-6 text-amber-300/90 drop-shadow scale-[-1]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C12 2 10.5 5 8 5C5.5 5 4 3 4 3C4 3 4.5 6 3 8C1.5 10 0 10 0 10C0 10 3 11.5 4 14C5 16.5 3 19 3 19C3 19 6 18 8 20C10 22 10.5 24 10.5 24C10.5 24 11 21 13 19C15 17 18 18 18 18C18 18 16.5 15.5 18 13C19.5 10.5 22 10 22 10C22 10 19.5 9.5 18 7C16.5 4.5 18 2 18 2C18 2 15 3.5 13 2.5C11 1.5 12 2 12 2Z" opacity="0.9" />
          </svg>
        </div>
      </div>
    );
  }

  if (frameId === 'floral') {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 p-2 sm:p-2.5">
        <div className="w-full h-full border border-rose-200/35 relative">
          {/* Top-Left Floral Spray */}
          <svg className="absolute -top-1 -left-1 w-7 h-7 text-rose-200/90 drop-shadow" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 2 C8 6, 14 6, 20 2 M2 2 C6 8, 6 14, 2 20" strokeLinecap="round" />
            <circle cx="9" cy="9" r="2.5" fill="currentColor" fillOpacity="0.4" />
            <circle cx="15" cy="5" r="1.5" fill="currentColor" />
            <circle cx="5" cy="15" r="1.5" fill="currentColor" />
          </svg>
          {/* Top-Right Floral Spray */}
          <svg className="absolute -top-1 -right-1 w-7 h-7 text-rose-200/90 drop-shadow scale-x-[-1]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 2 C8 6, 14 6, 20 2 M2 2 C6 8, 6 14, 2 20" strokeLinecap="round" />
            <circle cx="9" cy="9" r="2.5" fill="currentColor" fillOpacity="0.4" />
            <circle cx="15" cy="5" r="1.5" fill="currentColor" />
            <circle cx="5" cy="15" r="1.5" fill="currentColor" />
          </svg>
          {/* Bottom-Left Floral Spray */}
          <svg className="absolute -bottom-1 -left-1 w-7 h-7 text-rose-200/90 drop-shadow scale-y-[-1]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 2 C8 6, 14 6, 20 2 M2 2 C6 8, 6 14, 2 20" strokeLinecap="round" />
            <circle cx="9" cy="9" r="2.5" fill="currentColor" fillOpacity="0.4" />
            <circle cx="15" cy="5" r="1.5" fill="currentColor" />
            <circle cx="5" cy="15" r="1.5" fill="currentColor" />
          </svg>
          {/* Bottom-Right Floral Spray */}
          <svg className="absolute -bottom-1 -right-1 w-7 h-7 text-rose-200/90 drop-shadow scale-[-1]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 2 C8 6, 14 6, 20 2 M2 2 C6 8, 6 14, 2 20" strokeLinecap="round" />
            <circle cx="9" cy="9" r="2.5" fill="currentColor" fillOpacity="0.4" />
            <circle cx="15" cy="5" r="1.5" fill="currentColor" />
            <circle cx="5" cy="15" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  }

  if (frameId === 'deco') {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 p-2 sm:p-2.5">
        <div className="w-full h-full border-2 border-amber-400/50 relative p-1">
          <div className="w-full h-full border border-amber-300/30 relative">
            {/* 4 Art-Deco Corner Diamonds */}
            <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-amber-300 rotate-45 shadow-sm" />
            <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-amber-300 rotate-45 shadow-sm" />
            <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-amber-300 rotate-45 shadow-sm" />
            <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-amber-300 rotate-45 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (frameId === 'botanical') {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 p-2 sm:p-3">
        <div className="w-full h-full border border-emerald-200/30 relative">
          {/* Botanical Olive Branches */}
          <svg className="absolute -top-2 -left-2 w-8 h-8 text-emerald-300/80 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 21 C8 15, 14 9, 21 3" strokeLinecap="round" />
            <path d="M9 13 C9 10, 6 9, 6 9 C6 9, 7 12, 9 13" fill="currentColor" />
            <path d="M13 9 C13 6, 10 5, 10 5 C10 5, 11 8, 13 9" fill="currentColor" />
            <path d="M17 5 C17 2, 14 1, 14 1 C14 1, 15 4, 17 5" fill="currentColor" />
          </svg>
          <svg className="absolute -bottom-2 -right-2 w-8 h-8 text-emerald-300/80 drop-shadow scale-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 21 C8 15, 14 9, 21 3" strokeLinecap="round" />
            <path d="M9 13 C9 10, 6 9, 6 9 C6 9, 7 12, 9 13" fill="currentColor" />
            <path d="M13 9 C13 6, 10 5, 10 5 C10 5, 11 8, 13 9" fill="currentColor" />
            <path d="M17 5 C17 2, 14 1, 14 1 C14 1, 15 4, 17 5" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  }

  if (frameId === 'vintage') {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 p-2 sm:p-2.5">
        <div className="w-full h-full border-2 border-stone-300/40 border-dashed relative p-1">
          <div className="w-full h-full border border-stone-300/25 relative flex flex-col justify-between p-1">
            <div className="flex justify-between items-center text-[7px] font-serif text-stone-300/60 tracking-wider">
              <span>EST.</span>
              <span>MEMORIES</span>
            </div>
            <div className="flex justify-between items-center text-[7px] font-mono text-stone-300/60 tracking-widest">
              <span>✦</span>
              <span>✦</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
