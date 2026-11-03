'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import '../albumkami.css';

export default function PrintQrPage() {
  const params = useParams();
  const slug = params?.slug || '';

  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const albumUrl = origin ? `${origin}/${slug}/albumkami` : `https://storykami.my.id/${slug}/albumkami`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=${encodeURIComponent(albumUrl)}`;

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-[#2b2722] flex flex-col items-center justify-center p-6 print:p-0 print:bg-white">
      {/* Floating Action Bar (Hidden saat Print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 print:hidden bg-white/90 backdrop-blur border border-neutral-300 p-2 rounded-2xl shadow-lg">
        <Link
          href={`/${slug}/albumkami`}
          className="text-xs font-mono text-neutral-600 hover:text-black px-3 py-2"
        >
          ← Kembali
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-colors"
        >
          🖨️ Cetak Kartu Meja (Print)
        </button>
      </div>

      {/* KARTU MEJA / TABLE TENT BANNER (UKURAN STANDAR MEJA RESEPSI) */}
      <div className="w-full max-w-sm bg-white border-2 border-[#e0dacf] rounded-3xl p-8 text-center shadow-xl print:shadow-none print:border-none print:max-w-none print:w-full print:h-screen print:flex print:flex-col print:justify-center">
        {/* Ornamen Header */}
        <div className="flex items-center justify-center space-x-2 mb-3">
          <span className="text-xl">🎞️</span>
        </div>

        <span className="text-[10px] font-mono tracking-widest uppercase text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full inline-block mb-3">
          Kamera Sekali Pakai
        </span>

        <h1 className="text-2xl font-serif font-bold text-[#1a1714] mb-2 leading-tight">
          Bantu Kami Menangkap Momen Indah Ini!
        </h1>

        <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
          Pindai kode QR dengan kamera ponselmu untuk membuka kamera saku analog digital tanpa perlu mengunduh aplikasi.
        </p>

        {/* QR CODE DISPLAY */}
        <div className="w-56 h-56 mx-auto bg-[#faf8f5] p-3 rounded-2xl border-2 border-neutral-200 shadow-inner flex items-center justify-center mb-6">
          <img
            src={qrImageUrl}
            alt={`QR Code ${slug}`}
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <div className="bg-[#fcfaf7] border border-neutral-200 rounded-xl p-3 mb-4">
          <p className="text-[11px] font-mono text-neutral-500 mb-0.5">Atau kunjungi langsung via browser:</p>
          <p className="text-xs font-mono font-bold text-amber-800 truncate">{albumUrl}</p>
        </div>

        {/* Petunjuk Singkat Tamu */}
        <div className="text-[10px] font-mono text-neutral-500 space-y-1">
          <p>1. Scan QR & masukkan nama Anda</p>
          <p>2. Dapatkan 10 jepretan foto bernuansa film vintage</p>
          <p>3. Semua foto akan tersimpan di album bersama</p>
        </div>
      </div>
    </div>
  );
}
