/**
 * calendarHelper.js
 * Utility untuk membuat tautan Google Calendar otomatis berdasarkan data undangan.
 */

import { toYYYYMMDD } from '@/utils/dateHelper';

export function getGoogleCalendarUrl(data = {}, slug = '', eventType = 'main') {
  const { mempelai = {}, acara = {} } = data;

  // Nama pasangan untuk judul acara
  const namaWanita = mempelai?.wanita?.namaPanggilan || 'Mempelai Wanita';
  const namaPria = mempelai?.pria?.namaPanggilan || 'Mempelai Pria';
  
  // Tentukan acara mana yang dipakai (akad / resepsi / main)
  let event = null;
  let eventName = 'Pernikahan';

  if (eventType === 'akad') {
    event = acara?.akad;
    eventName = 'Akad Nikah';
  } else if (eventType === 'resepsi') {
    event = acara?.resepsi;
    eventName = 'Resepsi Pernikahan';
  } else {
    // 'main': prioritaskan acara resepsi jika ada tanggalnya, jika tidak ada gunakan akad
    if (acara?.resepsi?.tanggal) {
      event = acara.resepsi;
      eventName = 'Resepsi Pernikahan';
    } else {
      event = acara?.akad;
      eventName = 'Akad Nikah';
    }
  }

  // Judul acara di Google Calendar
  const title = `The Wedding of ${namaWanita} & ${namaPria}`;

  const tanggal = event?.tanggal || acara?.resepsi?.tanggal || acara?.akad?.tanggal;
  if (!tanggal) {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}`;
  }

  // Format tanggal YYYYMMDD secara aman dari DD/MM/YYYY ataupun YYYY-MM-DD
  const isoFormatted = toYYYYMMDD(tanggal);
  const cleanDate = isoFormatted.replace(/-/g, '');

  // Parse waktu mulai
  const rawMulai = String(event?.waktuMulai || acara?.akad?.waktuMulai || '08:00').replace('.', ':');
  const [startH = '08', startM = '00'] = rawMulai.split(':');
  const padStartH = String(parseInt(startH, 10) || 8).padStart(2, '0');
  const padStartM = String(parseInt(startM, 10) || 0).padStart(2, '0');
  const startTimeStr = `${padStartH}${padStartM}00`;

  // Parse waktu selesai
  let endTimeStr = '';
  const rawSelesai = String(event?.waktuSelesai || acara?.akad?.waktuSelesai || '').replace('.', ':');
  if (rawSelesai && rawSelesai.includes(':')) {
    const [endH, endM] = rawSelesai.split(':');
    const parsedEndH = parseInt(endH, 10);
    const parsedEndM = parseInt(endM, 10) || 0;
    if (!isNaN(parsedEndH)) {
      endTimeStr = `${String(parsedEndH).padStart(2, '0')}${String(parsedEndM).padStart(2, '0')}00`;
    }
  }

  // Jika waktu selesai tidak berupa jam (misal "Selesai"), default +3 jam dari waktu mulai
  if (!endTimeStr) {
    const autoEndH = (parseInt(padStartH, 10) + 3) % 24;
    endTimeStr = `${String(autoEndH).padStart(2, '0')}${padStartM}00`;
  }

  const datesParam = `${cleanDate}T${startTimeStr}/${cleanDate}T${endTimeStr}`;

  // Zona Waktu (WIB: Asia/Jakarta, WITA: Asia/Makassar, WIT: Asia/Jayapura)
  const tzRaw = (event?.zonaWaktu || acara?.akad?.zonaWaktu || 'WIB').toUpperCase();
  let timeZone = 'Asia/Jakarta';
  if (tzRaw === 'WITA') timeZone = 'Asia/Makassar';
  if (tzRaw === 'WIT') timeZone = 'Asia/Jayapura';

  // Lokasi & Alamat Lengkap
  const lokasi = [event?.lokasi, event?.alamatLengkap].filter(Boolean).join(', ');

  // Deskripsi Undangan
  const invitationUrl = slug ? `https://storykami.my.id/${slug}` : 'https://storykami.my.id';
  const details = `Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kedua mempelai.\n\nUndangan Online: ${invitationUrl}`;

  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: details,
    location: lokasi,
    ctz: timeZone
  });

  return `https://calendar.google.com/calendar/render?${queryParams.toString()}`;
}
