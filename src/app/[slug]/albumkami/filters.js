export const CAMERA_FILTERS = [
  { id: 'original', name: 'Original', desc: 'Warna asli natural tanpa filter', css: 'none' },
  { id: 'mono', name: 'Mono', desc: 'Hitam & putih monokrom klasik elegan', css: 'grayscale(1) contrast(1.08)' },
  { id: 'warm', name: 'Warm', desc: 'Nuansa hangat, intim, dan bersahabat', css: 'sepia(.16) saturate(1.12) contrast(1.03) brightness(1.02)' },
  { id: 'film', name: 'Film', desc: 'Karakter rol film analog vintage 90-an', css: 'contrast(1.08) saturate(.86) sepia(.10)' },
  { id: 'dreamy', name: 'Dreamy', desc: 'Sentuhan lembut, cerah, dan sinematik', css: 'brightness(1.07) saturate(.82) contrast(.93)' },
  { id: 'faded', name: 'Faded', desc: 'Efek pudar bernuansa nostalgia', css: 'brightness(1.06) contrast(.88) saturate(.78)' },
  { id: 'golden', name: 'Golden', desc: 'Kilau cahaya keemasan golden hour', css: 'sepia(.12) saturate(1.18) hue-rotate(-5deg) brightness(1.03)' },
];

export const DEFAULT_ENABLED_FILTERS = ['original', 'mono', 'warm', 'film', 'dreamy'];
