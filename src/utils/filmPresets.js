/**
 * Presets Film Analog yang Di-reverse Engineer 1:1 dari satualbum.id
 */

export const FILM_PRESETS = {
  'portra': {
    id: 'portra',
    name: 'Kodak Portra 400',
    film: 'Kodak Portra 400',
    tagline: 'Legendary skin tones & dreamy highlights',
    description: 'Warna kulit lembut, pastel, dan highlight dreamy untuk album yang timeless.',
    badgeColor: '#e2a07a',
    cssFilter: 'saturate(0.9) contrast(0.88) brightness(1.1) sepia(0.1) hue-rotate(-8deg)',
    applyCanvas: (ctx, width, height) => {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 235, 210, 0.08)';
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  },

  'funsaver': {
    id: 'funsaver',
    name: 'Kodak FunSaver',
    film: 'Kodak Gold 800',
    tagline: 'Warm disposable charm',
    description: 'Tone hangat seperti kamera sekali pakai klasik, cocok untuk pesta sore dan suasana santai.',
    badgeColor: '#f1c40f',
    cssFilter: 'sepia(0.22) saturate(1.25) contrast(1.15) brightness(1.06)',
    applyCanvas: (ctx, width, height) => {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 210, 0, 0.09)';
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  },

  'quicksnap': {
    id: 'quicksnap',
    name: 'Fujifilm QuickSnap',
    film: 'Fujicolor Superia',
    tagline: 'Clean, cool tones & sharp greens',
    description: 'Warna cerah, segar, dan sedikit dingin untuk acara outdoor yang penuh energi.',
    badgeColor: '#2ecc71',
    cssFilter: 'saturate(1.3) brightness(1.05) contrast(1.08) hue-rotate(5deg)',
    applyCanvas: (ctx, width, height) => {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 230, 180, 0.05)';
      ctx.globalCompositeOperation = 'color';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  },

  'ektar': {
    id: 'ektar',
    name: 'Kodak Ektar 100',
    film: 'Kodak Ektar 100',
    tagline: 'Punchy vivid colors that pop',
    description: 'Warna hidup dan detail tajam untuk dekorasi yang penuh warna.',
    badgeColor: '#e67e22',
    cssFilter: 'saturate(1.6) contrast(1.18) brightness(0.98) hue-rotate(-3deg)',
    applyCanvas: (ctx, width, height) => {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 120, 40, 0.06)';
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  },

  'cinestill': {
    id: 'cinestill',
    name: 'CineStill 800T',
    film: 'CineStill 800T',
    tagline: 'Cinematic halation & tungsten warmth',
    description: 'Nuansa sinematik malam hari dengan bayangan moody dan lampu hangat.',
    badgeColor: '#e74c3c',
    cssFilter: 'saturate(0.78) contrast(1.18) brightness(0.93) hue-rotate(15deg) sepia(0.12)',
    applyCanvas: (ctx, width, height) => {
      ctx.save();
      ctx.fillStyle = 'rgba(20, 60, 110, 0.12)';
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 90, 40, 0.08)';
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  },

  'hp5': {
    id: 'hp5',
    name: 'Ilford HP5 Plus',
    film: 'Ilford HP5 Plus 400',
    tagline: 'Deep shadows & dramatic monochrome',
    description: 'Hitam putih kontras dengan grain kuat untuk momen emosional dan dokumenter.',
    badgeColor: '#95a5a6',
    cssFilter: 'grayscale(1) contrast(1.4) brightness(0.88)',
    applyCanvas: (ctx, width, height) => {
      ctx.save();
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 128));
        data[i] = contrasted;
        data[i + 1] = contrasted;
        data[i + 2] = contrasted;
      }
      ctx.putImageData(imgData, 0, 0);
      ctx.restore();
    }
  },

  'original': {
    id: 'original',
    name: 'Original',
    film: 'No filter',
    tagline: 'Unprocessed lens look',
    description: 'Tanpa filter warna tambahan — sesuai tangkapan asli kamera HP.',
    badgeColor: '#ffffff',
    cssFilter: 'none',
    applyCanvas: () => {}
  }
};

/**
 * Menambahkan efek Film Grain (noise analog halus) pada Canvas
 */
export function addFilmGrain(ctx, width, height, intensity = 0.07) {
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 256;
  grainCanvas.height = 256;
  const gCtx = grainCanvas.getContext('2d');
  const gImgData = gCtx.createImageData(256, 256);
  const buffer32 = new Uint32Array(gImgData.data.buffer);
  const len = buffer32.length;

  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.5) {
      buffer32[i] = 0xff000000 | (Math.floor(Math.random() * 255) << 16) | (Math.floor(Math.random() * 255) << 8) | Math.floor(Math.random() * 255);
    }
  }
  gCtx.putImageData(gImgData, 0, 0);

  ctx.save();
  ctx.globalAlpha = intensity;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainCanvas, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

/**
 * Menambahkan Cap Tanggal Retro Oranye Khas Kamera Sekali Pakai
 */
export function addRetroDateStamp(ctx, width, height, customDate = null) {
  const date = customDate ? new Date(customDate) : new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const text = `'${yy} ${mm} ${dd}`;

  ctx.save();
  const fontSize = Math.max(18, Math.round(width * 0.036));
  ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  const marginX = width * 0.045;
  const marginY = height * 0.035;
  const x = width - marginX;
  const y = height - marginY;

  ctx.shadowColor = 'rgba(226, 160, 122, 0.9)';
  ctx.shadowBlur = Math.round(fontSize * 0.4);

  ctx.fillStyle = '#ff7b00';
  ctx.fillText(text, x, y);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffe0b2';
  ctx.fillText(text, x, y);

  ctx.restore();
}
