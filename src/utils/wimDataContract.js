/**
 * wimDataContract.js
 * 
 * Skema data tunggal (Single Source of Truth) untuk WIM (WebSK Invitation Maker).
 * Seluruh komponen Template dan Form Builder WAJIB menggunakan struktur ini.
 */

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
      fotoUtama: "https://images.unsplash.com/photo-1550096141-7263640ae4ce?w=400&q=80"
    },
    wanita: {
      namaLengkap: "Aulia Rahma",
      namaPanggilan: "Aulia",
      namaAyah: "Bpk. Ahmad Wijaya",
      namaIbu: "Ibu Dewi Lestari",
      urutanAnak: "Putri kedua",
      instagram: "@auliarahma",
      fotoUtama: "https://images.unsplash.com/photo-1549417229-aa67d3263c09?w=400&q=80"
    }
  },

  // Detail Acara
  acara: {
    akad: {
      tanggal: "2026-10-12",
      waktuMulai: "08:00",
      waktuSelesai: "10:00",
      zonaWaktu: "WIB",
      lokasi: "Masjid Agung Jakarta",
      alamatLengkap: "Jl. Merdeka No.1, Jakarta Pusat",
      linkMap: "https://maps.app.goo.gl/dummy"
    },
    resepsi: {
      tanggal: "2026-10-12",
      waktuMulai: "11:00",
      waktuSelesai: "14:00",
      zonaWaktu: "WIB",
      lokasi: "Gedung Serbaguna A",
      alamatLengkap: "Jl. Sudirman No. 10, Jakarta",
      linkMap: "https://maps.app.goo.gl/dummy2"
    }
  },

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
  }
};
