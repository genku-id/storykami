'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import '../albumkami.css';

export default function PrintQrPage() {
  const params = useParams();
  const slug = params?.slug || '';

  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const albumUrl = origin ? `${origin}/${slug}/albumkami` : `https://www.storykami.my.id/${slug}/albumkami`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&margin=10&data=${encodeURIComponent(albumUrl)}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(albumUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200 flex flex-col items-center justify-between p-4 sm:p-6 print:p-0 print:bg-white select-none relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 print:hidden" style={{
        background: 'radial-gradient(circle at 50% 15%, rgba(212, 175, 55, 0.08) 0%, rgba(10, 10, 13, 0) 70%)'
      }} />

      {/* Top Floating Navigation & Print Bar (Hidden saat Print) */}
      <header className="relative z-20 w-full max-w-[430px] pt-4 pb-4 flex items-center justify-between border-b border-white/[0.08] bg-[#0c0d10]/80 backdrop-blur-md rounded-2xl px-4 print:hidden shadow-lg mb-4">
        {/* Back Link */}
        <Link
          href={`/${slug}/albumkami`}
          className="inline-flex items-center gap-1.5 text-xs tracking-wider text-neutral-400 hover:text-amber-200 transition-colors py-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Kembali</span>
        </Link>

        {/* Action Button: Print Table Card */}
        <button
          onClick={() => window.print()}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-transparent border border-amber-400/40 text-amber-200 text-xs font-semibold tracking-wide hover:border-amber-400 hover:text-white transition-all duration-200 active:scale-95 shadow-sm"
        >
          <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Cetak Kartu Meja (Print)</span>
        </button>
      </header>

      {/* MAIN KARTU MEJA / WEDDING CAMERA PRINT CARD */}
      <main className="relative z-10 w-full max-w-[430px] flex-1 flex flex-col items-center justify-center my-auto print:max-w-none print:w-full print:h-screen print:my-0">
        <div className="w-full bg-[#fcfbfa] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative text-neutral-900 print:shadow-none print:border-none print:rounded-none">
          {/* Luxury Corner Ornaments */}
          <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37]/70 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-[#d4af37]/70 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-[#d4af37]/70 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37]/70 rounded-br-sm pointer-events-none" />

          {/* Header Pill Badge & Camera Icon */}
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center mb-2.5 text-[#8c6b1f] shadow-sm">
              <svg className="w-4 h-4 text-[#8c6b1f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <div className="inline-block px-3.5 py-1 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 mb-3.5">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#7a5b10] font-semibold">
                Kamera Sekali Pakai
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-2xl sm:text-[26px] leading-tight text-neutral-900 font-semibold mb-2 px-1">
              Bantu Kami Menangkap Momen Indah Ini!
            </h1>

            {/* Subtitle */}
            <p className="text-xs text-neutral-600 font-normal leading-relaxed max-w-[290px] mb-4">
              Pindai kode QR dengan kamera ponselmu untuk membuka albumkami tanpa unduh aplikasi.
            </p>
          </div>

          {/* QR Code Container with Gold Reticle Accents */}
          <div className="w-full flex justify-center my-2">
            <div className="relative p-3.5 bg-white rounded-2xl shadow-md border border-neutral-200 max-w-[210px] w-full aspect-square flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37]" />
              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#d4af37]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#d4af37]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37]" />

              <img
                src={qrImageUrl}
                alt="QR Code Album"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Direct URL Fallback */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-neutral-500 mb-1 font-light">
              Atau kunjungi langsung via browser:
            </p>
            <div
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 max-w-full px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-300 hover:border-[#d4af37] transition-colors cursor-pointer"
            >
              <span className="text-[11px] text-[#8c6b1f] font-mono tracking-tight truncate max-w-[240px]">
                {albumUrl}
              </span>
              <svg className="w-3.5 h-3.5 text-[#8c6b1f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </div>
            {copied && (
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                ✓ Tautan berhasil disalin!
              </p>
            )}
          </div>

          {/* Divider with gold diamond */}
          <div className="flex items-center justify-center my-4 opacity-70">
            <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent w-full" />
            <div className="w-1.5 h-1.5 rotate-45 border border-[#d4af37] bg-[#fcfbfa] mx-2 flex-shrink-0" />
            <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent w-full" />
          </div>

          {/* Instructions List */}
          <ol className="space-y-2 text-[11px] sm:text-xs text-neutral-800">
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#d4af37]/15 text-[#8c6b1f] font-serif text-[10px] flex items-center justify-center border border-[#d4af37]/40 font-bold">1</span>
              <span className="leading-snug">Scan QR &amp; masukkan nama Anda</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#d4af37]/15 text-[#8c6b1f] font-serif text-[10px] flex items-center justify-center border border-[#d4af37]/40 font-bold">2</span>
              <span className="leading-snug">Potret momen bahagia &amp; hangat resepsi</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#d4af37]/15 text-[#8c6b1f] font-serif text-[10px] flex items-center justify-center border border-[#d4af37]/40 font-bold">3</span>
              <span className="leading-snug">Semua foto akan otomatis tersimpan di album bersama</span>
            </li>
          </ol>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-3 text-center print:hidden">
        <p className="text-[10px] tracking-widest uppercase font-serif text-neutral-500">
          StoryKami • Digital Wedding Moments
        </p>
      </footer>
    </div>
  );
}
