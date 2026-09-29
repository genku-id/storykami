/**
 * wimDataContract.js
 * 
 * Skema data tunggal (Single Source of Truth) untuk WIM (WebSK Invitation Maker).
 * Seluruh komponen Template dan Form Builder WAJIB menggunakan struktur ini.
 */

export const defaultAcaraList = [
  {
    id: "akad",
    nama: "Akad Nikah",
    tanggal: "22/11/2026",
    waktuMulai: "08:00",
    waktuSelesai: "10:00",
    zonaWaktu: "WIB",
    lokasi: "Masjid Agung Jakarta",
    alamatLengkap: "Jl. Merdeka No.1, Jakarta Pusat",
    linkMap: "https://maps.app.goo.gl/dummy"
  },
  {
    id: "resepsi",
    nama: "Resepsi Pernikahan",
    tanggal: "22/11/2026",
    waktuMulai: "11:00",
    waktuSelesai: "14:00",
    zonaWaktu: "WIB",
    lokasi: "Gedung Serbaguna A",
    alamatLengkap: "Jl. Sudirman No. 10, Jakarta",
    linkMap: "https://maps.app.goo.gl/dummy2"
  }
];

/**
 * Normalisasi data acara agar selalu berupa Array of Event objects,
 * mendukung baik struktur lama (object dengan key akad/resepsi) maupun baru (array).
 */
export function normalizeAcara(acara) {
  if (Array.isArray(acara) && acara.length > 0) {
    return acara.map((item, idx) => ({
      id: item.id || `acara-${idx + 1}`,
      nama: item.nama || `Acara #${idx + 1}`,
      tanggal: item.tanggal || '',
      waktuMulai: item.waktuMulai || '08:00',
      waktuSelesai: item.waktuSelesai || 'Selesai',
      zonaWaktu: item.zonaWaktu || 'WIB',
      lokasi: item.lokasi || '',
      alamatLengkap: item.alamatLengkap || '',
      linkMap: item.linkMap || ''
    }));
  }

  if (!acara || typeof acara !== 'object') {
    return defaultAcaraList;
  }

  const list = [];
  if (acara.akad) {
    list.push({
      id: 'akad',
      nama: acara.akad.nama || 'Akad Nikah',
      tanggal: acara.akad.tanggal || '',
      waktuMulai: acara.akad.waktuMulai || '08:00',
      waktuSelesai: acara.akad.waktuSelesai || '10:00',
      zonaWaktu: acara.akad.zonaWaktu || 'WIB',
      lokasi: acara.akad.lokasi || '',
      alamatLengkap: acara.akad.alamatLengkap || '',
      linkMap: acara.akad.linkMap || ''
    });
  }
  if (acara.resepsi) {
    list.push({
      id: 'resepsi',
      nama: acara.resepsi.nama || 'Resepsi Pernikahan',
      tanggal: acara.resepsi.tanggal || '',
      waktuMulai: acara.resepsi.waktuMulai || '11:00',
      waktuSelesai: acara.resepsi.waktuSelesai || '14:00',
      zonaWaktu: acara.resepsi.zonaWaktu || 'WIB',
      lokasi: acara.resepsi.lokasi || '',
      alamatLengkap: acara.resepsi.alamatLengkap || '',
      linkMap: acara.resepsi.linkMap || ''
    });
  }

  Object.keys(acara).forEach(key => {
    if (key !== 'akad' && key !== 'resepsi' && acara[key] && typeof acara[key] === 'object') {
      list.push({
        id: key,
        nama: acara[key].nama || key,
        tanggal: acara[key].tanggal || '',
        waktuMulai: acara[key].waktuMulai || '09:00',
        waktuSelesai: acara[key].waktuSelesai || 'Selesai',
        zonaWaktu: acara[key].zonaWaktu || 'WIB',
        lokasi: acara[key].lokasi || '',
        alamatLengkap: acara[key].alamatLengkap || '',
        linkMap: acara[key].linkMap || ''
      });
    }
  });

  return list.length > 0 ? list : defaultAcaraList;
}

export const defaultInvitationData = {
  pageVisibility: {
    cover: true, hero: true, profiles: true, quote: true, 
    events: true, loveStory: true, gift: true, guestbook: true, closing: true
  },
  slug: "mempelai-pria-wanita",
  tema: "floral-elegance",
  
  // Data Mempelai
  mempelai: {
    pria: {
      namaLengkap: "Rizky Pratama",
      namaPanggilan: "Rizky",
      namaAyah: "Bpk. Budi Santoso",
      namaIbu: "Ibu Siti Aminah",
      urutanAnak: "Putra pertama",
      instagram: "@rizkypratama",
      fotoUtama: ""
    },
    wanita: {
      namaLengkap: "Aulia Rahma",
      namaPanggilan: "Aulia",
      namaAyah: "Bpk. Ahmad Wijaya",
      namaIbu: "Ibu Dewi Lestari",
      urutanAnak: "Putri kedua",
      instagram: "@auliarahma",
      fotoUtama: ""
    }
  },

  // Detail Acara (Dinamis: Array of events)
  acara: defaultAcaraList,

  // Kutipan / Ayat (Opsional)
  kutipan: {
    teks: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri...",
    sumber: "QS. Ar-Rum: 21"
  },

  // Galeri & Media
  galeri: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80"
  ],
  videoUrl: "", 
  musikUrl: "",
  musikStart: 0,
  thumbnailJudul: "",
  thumbnailDeskripsi: "",
  thumbnailFoto: "",

  // Informasi Tambahan
  ceritaCinta: [
    {
      tanggal: "14 Februari 2024",
      judul: "Pertama Bertemu",
      cerita: "Kami bertemu di sebuah acara kampus dan mulai berkenalan."
    },
    {
      tanggal: "12 Oktober 2025",
      judul: "Lamaran",
      cerita: "Dengan restu kedua orang tua, kami melangsungkan lamaran."
    }
  ],
  
  // Hadiah / Amplop Digital
  hadiahDigital: {
    accounts: [
      {
        name: "BCA",
        number: "1234567890",
        owner: "Rizky Pratama",
        whatsapp: "6281234567890"
      }
    ],
    physicalAddress: "Jl. Merdeka No.1, Jakarta Pusat",
    receiver: "Rizky Pratama",
    physicalWhatsapp: "6281234567890"
  },

  // Penutup Undangan
  penutupJudul: "Terima Kasih",
  penutup: "Merupakan suatu kebahagiaan dan kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i, berkenan hadir dan memberikan doa restu kepada kami.\n\nWassalamu'alaikum Wr. Wb.",
  penutupMempelai: "",
  penutupFoto: ""
};
