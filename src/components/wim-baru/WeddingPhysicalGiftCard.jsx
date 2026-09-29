'use client';
import React, { useState } from 'react';

export default function WeddingPhysicalGiftCard({
  hadiahDigital = {},
  mempelai = {},
  fallbackWa = ''
}) {
  const [copied, setCopied] = useState(false);

  const address = hadiahDigital.physicalAddress || '';
  const receiver = hadiahDigital.receiver || '';
  const phone = hadiahDigital.physicalWhatsapp || '';

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp link configuration
  const targetWa = phone || fallbackWa || '';
  let cleanWa = targetWa ? String(targetWa).replace(/\D/g, '') : '';
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.slice(1);
  } else if (cleanWa.startsWith('8')) {
    cleanWa = '62' + cleanWa;
  }

  const namaPenerima = receiver || 'Bapak/Ibu';
  const namaWanita = mempelai?.wanita?.namaPanggilan || '';
  const namaPria = mempelai?.pria?.namaPanggilan || '';
  const pasanganInfo = (namaWanita && namaPria) ? `${namaWanita} & ${namaPria}` : 'kedua mempelai';
  const waMessage = `Halo Kak ${namaPenerima}, saya ingin konfirmasi pengiriman kado fisik untuk ${pasanganInfo} ke alamat: ${address}. Terima kasih.`;
  const waUrl = cleanWa 
    ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(waMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;

  const cardBg = '#edf0f2';
  const primaryColor = '#7588a1';

  return (
    <div
      className="wedding-physical-gift-card-box"
      style={{
        backgroundColor: cardBg,
        borderRadius: '28px',
        padding: '30px 24px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
        maxWidth: '430px',
        width: '100%',
        margin: '0 auto 24px auto',
        boxSizing: 'border-box',
        border: '1px solid rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Title */}
      <h3
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#1a1a1a',
          margin: '0 0 20px 0',
          textAlign: 'center',
          letterSpacing: '-0.3px'
        }}
      >
        Wedding Gift
      </h3>

      {/* Gift Icon Graphic matching reference */}
      <svg
        width="110"
        height="105"
        viewBox="0 0 120 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', margin: '0 auto' }}
      >
        {/* Bow ribbon loops with hollow centers */}
        <path
          d="M 60 36 C 45 10, 18 12, 26 26 C 32 37, 52 36, 60 36"
          fill="none"
          stroke={primaryColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 60 36 C 75 10, 102 12, 94 26 C 88 37, 68 36, 60 36"
          fill="none"
          stroke={primaryColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Box Lid */}
        <rect x="8" y="36" width="104" height="22" rx="7" fill={primaryColor} />
        {/* Box Left Block */}
        <rect x="13" y="64" width="42" height="44" rx="7" fill={primaryColor} />
        {/* Box Right Block */}
        <rect x="65" y="64" width="42" height="44" rx="7" fill={primaryColor} />
      </svg>

      {/* Address & Receiver Details */}
      <div style={{ margin: '22px 0 24px 0', textAlign: 'center', width: '100%' }}>
        <p
          style={{
            margin: '0 0 8px 0',
            fontFamily: '"Inter", sans-serif',
            fontSize: '1rem',
            color: '#1a1a1a',
            lineHeight: 1.5,
            wordBreak: 'break-word'
          }}
        >
          Alamat : {address || '-'}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: '"Inter", sans-serif',
            fontSize: '1rem',
            color: '#1a1a1a',
            lineHeight: 1.5,
            wordBreak: 'break-word'
          }}
        >
          Penerima: {receiver || '-'}
        </p>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '100%'
        }}
      >
        {/* Button: Salin Alamat */}
        <button
          type="button"
          onClick={handleCopy}
          style={{
            backgroundColor: copied ? '#15803d' : primaryColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '9px 24px',
            fontSize: '0.82rem',
            fontWeight: 500,
            fontFamily: '"Inter", sans-serif',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
          }}
          title="Salin Alamat Pengiriman"
        >
          {copied ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Alamat Tersalin!</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Salin Alamat</span>
            </>
          )}
        </button>

        {/* Button: Konfirmasi WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: primaryColor,
            color: '#ffffff',
            borderRadius: '12px',
            padding: '9px 22px',
            fontSize: '0.82rem',
            fontWeight: 500,
            fontFamily: '"Inter", sans-serif',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
          }}
          title="Konfirmasi via WhatsApp"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.529 1.771.813 2.796.813h.005c3.179 0 5.767-2.587 5.768-5.766 0-1.54-.6-2.988-1.688-4.077-1.09-1.088-2.54-1.623-4.085-1.623zm8.391 5.765c-.002 4.62-3.76 8.376-8.387 8.376-.002 0-.005 0-.007 0-1.42 0-2.812-.361-4.041-1.045l-4.486 1.176 1.197-4.373c-.767-1.28-1.173-2.753-1.175-4.254.002-4.62 3.76-8.376 8.388-8.376 2.24 0 4.347.872 5.932 2.457 1.584 1.584 2.477 3.691 2.479 5.933zm-4.371 3.518c-.24-.12-.142-.71-.24-.83-.098-.12-.34-.18-.46-.18s-.26.06-.38.18-.46.57-.56.69-.2.14-.34.07c-.14-.07-.59-.22-1.12-.69-.41-.36-.69-.81-.77-.95-.08-.14-.01-.22.06-.29.06-.06.14-.16.21-.24.07-.08.1-.14.15-.24.05-.1.02-.19-.01-.26-.03-.07-.34-.82-.47-1.12-.12-.3-.25-.26-.34-.26h-.29c-.1 0-.26.04-.4.19s-.53.52-.53 1.27.54 1.48.62 1.58c.08.1 1.06 1.62 2.57 2.27.36.16.64.25.86.32.36.11.69.1.95.06.29-.04.89-.36 1.02-.71.13-.35.13-.65.09-.71-.04-.06-.14-.1-.38-.22z"/>
          </svg>
          <span>Konfirmasi WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
