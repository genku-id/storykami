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
    desc: 'Format instan klasik dengan border putih dan dagu bawah lebar',
    color: '#fdfcf9',
    bg: '#fdfcf9',
    cutout: { left: 7.2, right: 7.2, top: 7.2, height: 66.8 },
  },
  {
    id: 'film',
    name: 'Film',
    desc: 'Strip klise film analog 35mm dengan lubang sproket dan stempel kode',
    color: '#0e0e0e',
    bg: '#0e0e0e',
    cutout: { left: 7, right: 7, top: 7, height: 65 },
  },
  {
    id: 'damask',
    name: 'Damask',
    desc: 'Bingkai seni ornamen ukiran damask baroque royal mewah',
    color: '#e5c05d',
    art: '/images/frames/damask.webp',
    bg: '#fbf9f4',
    cutout: { left: 12.12, right: 12.12, top: 9.09, height: 69.29 },
  },
  {
    id: 'floral',
    name: 'Bunga',
    desc: 'Bingkai seni bunga mekar nan anggun dan romantis',
    color: '#5b1f26',
    art: '/images/frames/floral.webp',
    bg: '#5b1f26',
    cutout: { left: 12.12, right: 12.12, top: 9.09, height: 69.29 },
  },
  {
    id: 'deco',
    name: 'Deco',
    desc: 'Bingkai seni garis geometris ganda Art-Deco klasik elegan',
    color: '#f7f2e7',
    art: '/images/frames/deco.webp',
    bg: '#f7f2e7',
    cutout: { left: 12.12, right: 12.12, top: 9.09, height: 69.29 },
  },
  {
    id: 'botanical',
    name: 'Botani',
    desc: 'Bingkai seni dedaunan botani alami yang segar dan estetik',
    color: '#fbfaf6',
    art: '/images/frames/botanical.webp',
    bg: '#fbfaf6',
    cutout: { left: 12.12, right: 12.12, top: 9.09, height: 69.29 },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    desc: 'Bingkai border ganda antik nuansa nostalgia kertas klasik',
    color: '#f3e9d2',
    bg: '#f3e9d2',
    cutout: { left: 9.5, right: 9.5, top: 9.5, height: 60.5 },
  },
];

export const FRAME_MAP = PHOTO_FRAMES.reduce((acc, f) => {
  acc[f.id] = f;
  return acc;
}, {});

/**
 * Komponen FramedPhoto:
 * Meletakkan foto persis di area bolong / cutout bingkai,
 * dengan gambar PNG/WebP bingkai transparan menutupi tepi di atasnya.
 */
export function FramedPhoto({
  frameId = 'none',
  photoUrl,
  alt = 'Foto',
  className = '',
  imgClassName = '',
  onLoad,
  onError,
}) {
  if (!frameId || frameId === 'none') {
    return (
      <img
        src={photoUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        className={`w-full h-full object-cover ${imgClassName} ${className}`}
      />
    );
  }

  const frame = FRAME_MAP[frameId] || FRAME_MAP.polaroid;
  const cutout = frame.cutout || { left: 7.2, right: 7.2, top: 7.2, height: 66.8 };

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ backgroundColor: frame.bg || '#000000' }}
    >
      {/* 1. AREA BOLONG (Cutout) Tempat Foto Ditempatkan */}
      <div
        className="absolute overflow-hidden z-0"
        style={{
          left: `${cutout.left}%`,
          right: `${cutout.right}%`,
          top: `${cutout.top}%`,
          height: `${cutout.height}%`,
        }}
      >
        <img
          src={photoUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      </div>

      {/* 2. OVERLAY FRAME TRANSPARAN DARI SATUALBUM (Damask, Floral, Deco, Botanical) */}
      {frame.art && (
        <img
          src={frame.art}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 select-none"
        />
      )}

      {/* 3. DEKORASI BINGKAI KHUSUS (Polaroid, Film, Vintage) */}
      {frameId === 'polaroid' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2 pb-3.5 border border-black/5 shadow-inner">
          <div className="w-full flex justify-between items-start opacity-40">
            <div className="w-1 h-1 rounded-full bg-stone-400" />
            <div className="w-1 h-1 rounded-full bg-stone-400" />
          </div>
          <div className="w-full flex justify-center items-center pb-0.5">
            <span className="font-serif italic text-[9px] text-[#2b2b2b]/60 tracking-widest uppercase">
              StoryKami
            </span>
          </div>
        </div>
      )}

      {frameId === 'film' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between border-y-2 border-black/40">
          {/* Top Sprocket Perforations */}
          <div className="absolute top-0.5 inset-x-0 h-2 flex items-center justify-around px-1 overflow-hidden opacity-85">
            {[...Array(10)].map((_, i) => (
              <div key={`st-${i}`} className="w-1.5 h-1 rounded-[1px] bg-white/70 shadow-sm" />
            ))}
          </div>

          {/* Bottom Film Stamps */}
          <div className="absolute bottom-1 inset-x-0 flex justify-between items-center px-2 text-[8px] font-mono text-amber-400/90 tracking-widest uppercase">
            <span>KODAK 400</span>
            <span>▶ 24A</span>
          </div>

          {/* Bottom Sprocket Perforations */}
          <div className="absolute bottom-0 inset-x-0 h-2 flex items-center justify-around px-1 overflow-hidden opacity-85">
            {[...Array(10)].map((_, i) => (
              <div key={`sb-${i}`} className="w-1.5 h-1 rounded-[1px] bg-white/70 shadow-sm" />
            ))}
          </div>
        </div>
      )}

      {frameId === 'vintage' && (
        <div className="pointer-events-none absolute inset-0 z-10 p-1.5">
          <div className="w-full h-full border border-[#5b4a32]/35 border-dashed relative flex flex-col justify-between p-1">
            <div className="flex justify-between items-center text-[7px] font-serif text-[#5b4a32]/60 tracking-wider">
              <span>✦</span>
              <span>✦</span>
            </div>
            <div className="flex justify-between items-center text-[7px] font-serif text-[#5b4a32]/70 tracking-widest">
              <span>MEMORIES</span>
              <span>EST.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Preview swatch kecil untuk modal pengaturan bingkai
 */
export function FramePreviewSwatch({ frameId }) {
  const frame = FRAME_MAP[frameId] || FRAME_MAP.none;
  if (!frameId || frameId === 'none') {
    return (
      <div className="w-full h-full bg-[#18181c] flex items-center justify-center text-zinc-500 font-sans text-xs">
        Tanpa
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: frame.bg || '#000' }}
    >
      <div
        className="absolute bg-neutral-700/60"
        style={{
          left: `${frame.cutout?.left || 10}%`,
          right: `${frame.cutout?.right || 10}%`,
          top: `${frame.cutout?.top || 10}%`,
          height: `${frame.cutout?.height || 70}%`,
        }}
      >
        <img
          src="/images/satualbum_cover.webp"
          alt=""
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>
      {frame.art && (
        <img
          src={frame.art}
          alt=""
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        />
      )}
      {frameId === 'polaroid' && (
        <div className="absolute bottom-0 inset-x-0 h-2 bg-[#fdfcf9] flex items-center justify-center">
          <span className="text-[6px] text-[#2b2b2b]/60 font-serif italic">instax</span>
        </div>
      )}
      {frameId === 'film' && (
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#0e0e0e] flex items-center justify-between px-1 text-[5px] text-amber-400 font-mono">
          <span>FILM</span>
        </div>
      )}
    </div>
  );
}
