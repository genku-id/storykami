/**
 * dateHelper.js
 * Utility terpadu untuk penanganan dan formatting tanggal format Indonesia (DD/MM/YYYY).
 */

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Normalisasi string tanggal ke objek komponen { year, month, day }
 * Menerima format:
 * - DD/MM/YYYY atau DD-MM-YYYY
 * - YYYY-MM-DD atau YYYY/MM/DD
 * - ISO string
 */
export function parseDateComponents(val) {
  if (!val) return null;
  const s = String(val).trim();

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
      return { day, month, year };
    }
  }

  // Format YYYY-MM-DD atau YYYY/MM/DD
  const ymdMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
      return { day, month, year };
    }
  }

  // Fallback: coba via Date parser
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear()
    };
  }

  return null;
}

/**
 * Format tanggal ke format standar Indonesia: DD/MM/YYYY
 * contoh: "2026-11-22" -> "22/11/2026"
 *         "22/11/2026" -> "22/11/2026"
 */
export function toDDMMYYYY(val) {
  const comp = parseDateComponents(val);
  if (!comp) return val || '';
  const d = String(comp.day).padStart(2, '0');
  const m = String(comp.month).padStart(2, '0');
  return `${d}/${m}/${comp.year}`;
}

/**
 * Format tanggal ke format standar ISO: YYYY-MM-DD (berguna untuk input type="date" atau Google Calendar)
 * contoh: "22/11/2026" -> "2026-11-22"
 *         "2026-11-22" -> "2026-11-22"
 */
export function toYYYYMMDD(val) {
  const comp = parseDateComponents(val);
  if (!comp) return val || '';
  const d = String(comp.day).padStart(2, '0');
  const m = String(comp.month).padStart(2, '0');
  return `${comp.year}-${m}-${d}`;
}

/**
 * Membuat JS Date object lokal dengan aman tanpa UTC midnight shift
 */
export function parseDate(val, timeStr = '00:00') {
  const comp = parseDateComponents(val);
  if (!comp) return null;

  let hours = 0;
  let minutes = 0;
  if (timeStr) {
    const cleanTime = String(timeStr).replace('.', ':');
    const [h, m] = cleanTime.split(':');
    hours = parseInt(h, 10) || 0;
    minutes = parseInt(m, 10) || 0;
  }

  return new Date(comp.year, comp.month - 1, comp.day, hours, minutes, 0);
}

/**
 * Format tanggal ke teks bahasa Indonesia
 * contoh: "22/11/2026" -> "Minggu, 22 November 2026"
 */
export function formatIndonesianDate(val, options = { withDay: true, fullMonth: true }) {
  const comp = parseDateComponents(val);
  if (!comp) return val || '';

  const dateObj = new Date(comp.year, comp.month - 1, comp.day);
  const dayName = NAMA_HARI[dateObj.getDay()] || '';
  const monthName = NAMA_BULAN[comp.month - 1] || '';

  if (options && options.withDay) {
    return `${dayName}, ${comp.day} ${monthName} ${comp.year}`;
  }
  return `${comp.day} ${monthName} ${comp.year}`;
}

/**
 * Dapatkan bagian-bagian tanggal lengkap untuk template (seperti Template Jawa)
 */
export function getDateParts(val) {
  const comp = parseDateComponents(val);
  if (!comp) {
    return { day: '', dayPad: '', month: '', monthPad: '', year: '', dayName: '', monthName: '', fullIndo: '' };
  }
  const dateObj = new Date(comp.year, comp.month - 1, comp.day);
  const dayName = NAMA_HARI[dateObj.getDay()] || '';
  const monthName = NAMA_BULAN[comp.month - 1] || '';

  return {
    day: comp.day,
    dayPad: String(comp.day).padStart(2, '0'),
    month: comp.month,
    monthPad: String(comp.month).padStart(2, '0'),
    year: comp.year,
    dayName,
    monthName,
    fullIndo: `${dayName}, ${comp.day} ${monthName} ${comp.year}`
  };
}
