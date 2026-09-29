'use client';
import React, { useState } from 'react';

/**
 * Mendapatkan path logo bank / e-wallet jika tersedia di folder public/banks/
 */
export function getBankLogoPath(name = '') {
  if (!name) return null;
  const clean = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const bankFiles = {
    BCA: '/banks/BCA.webp',
    BNI: '/banks/BNI.webp',
    BRI: '/banks/BRI.webp',
    BSI: '/banks/BSI.webp',
    CIMB: '/banks/CIMB.webp',
    DANA: '/banks/DANA.webp',
    GOPAY: '/banks/GOPAY.webp',
    JAGO: '/banks/JAGO.webp',
    JENIUS: '/banks/JENIUS.webp',
    LINKAJA: '/banks/LINKAJA.webp',
    MANDIRI: '/banks/MANDIRI.webp',
    NEO: '/banks/NEO.webp',
    OVO: '/banks/OVO.webp',
    PERMATA: '/banks/PERMATA.webp',
    SEABANK: '/banks/SEABANK.webp',
    SHOPEEPAY: '/banks/SHOPEEPAY.webp',
    BLU: '/banks/BLU.webp'
  };
  return bankFiles[clean] || null;
}

export default function WeddingGiftCard({
  account = {},
  mempelai = {},
  fallbackWa = '',
  primaryColor = '#7c9b9f'
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!account.number) return;
    navigator.clipboard.writeText(account.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const logoUrl = getBankLogoPath(account.name);

  // Link konfirmasi WhatsApp
  const targetWa = account.whatsapp || fallbackWa || '';
  let cleanWa = targetWa ? String(targetWa).replace(/\D/g, '') : '';
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.slice(1);
  } else if (cleanWa.startsWith('8')) {
    cleanWa = '62' + cleanWa;
  }

  const namaPemilik = account.owner || 'Bapak/Ibu';
  const namaWanita = mempelai?.wanita?.namaPanggilan || '';
  const namaPria = mempelai?.pria?.namaPanggilan || '';
  const pasanganInfo = (namaWanita && namaPria) ? `${namaWanita} & ${namaPria}` : 'kedua mempelai';
  const waMessage = `Halo Kak ${namaPemilik}, saya ingin konfirmasi transfer hadiah pernikahan untuk ${pasanganInfo} ke rekening ${account.name || 'Bank'} (${account.number || ''}). Terima kasih.`;
  const waUrl = cleanWa 
    ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(waMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;

  const cardBg = '#edf0f2';
  const activePrimaryColor = primaryColor || '#7c9b9f';

  return (
    <div
      className="wedding-gift-card-box"
      style={{
        backgroundColor: cardBg,
        borderRadius: '28px',
        padding: '26px 24px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
        maxWidth: '430px',
        width: '100%',
        margin: '0 auto 24px auto',
        boxSizing: 'border-box',
        border: '1px solid rgba(0,0,0,0.03)'
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}
      >
        {/* Left: Wedding Gift Title */}
        <div
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '1.75rem',
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#1a1a1a',
            letterSpacing: '-0.3px',
            textAlign: 'left'
          }}
        >
          Wedding<br />Gift
        </div>

        {/* Right: Bank Logo + Underline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            minHeight: '46px',
            justifyContent: 'flex-start'
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={account.name}
              style={{
                height: '36px',
                maxWidth: '120px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          ) : (
            <h4
              style={{
                margin: 0,
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#1a1a1a',
                letterSpacing: '1px'
              }}
            >
              {account.name || 'BANK'}
            </h4>
          )}
          {/* Solid line underneath bank logo */}
          <div
            style={{
              height: '2.5px',
              backgroundColor: '#1a1a1a',
              width: '100px',
              marginTop: '6px'
            }}
          />
        </div>
      </div>

      {/* Main Body Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '14px',
          marginTop: '6px'
        }}
      >
        {/* Left Column: Card Graphic & Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          {/* Card Graphic Silhouette matching screenshot */}
          <svg
            width="106"
            height="72"
            viewBox="0 0 106 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', marginBottom: '14px' }}
          >
            <rect width="106" height="72" rx="16" fill={activePrimaryColor} />
            {/* Top Stripe cutout showing card background */}
            <rect y="20" width="106" height="5" fill={cardBg} />
            {/* Circle dot on lower left */}
            <circle cx="24" cy="49" r="6" fill={cardBg} />
          </svg>

          {/* Button: Salin NO */}
          <button
            type="button"
            onClick={handleCopy}
            style={{
              backgroundColor: copied ? '#15803d' : activePrimaryColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '7px 16px',
              fontSize: '0.82rem',
              fontWeight: 500,
              fontFamily: '"Inter", sans-serif',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
            }}
            title="Salin Nomor Rekening"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Salin NO</span>
              </>
            )}
          </button>

          {/* Button: Konfirmasi WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: activePrimaryColor,
              color: '#ffffff',
              borderRadius: '12px',
              padding: '7px 14px',
              fontSize: '0.8rem',
              fontWeight: 500,
              fontFamily: '"Inter", sans-serif',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
            }}
            title="Konfirmasi via WhatsApp"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.529 1.771.813 2.796.813h.005c3.179 0 5.767-2.587 5.768-5.766 0-1.54-.6-2.988-1.688-4.077-1.09-1.088-2.54-1.623-4.085-1.623zm8.391 5.765c-.002 4.62-3.76 8.376-8.387 8.376-.002 0-.005 0-.007 0-1.42 0-2.812-.361-4.041-1.045l-4.486 1.176 1.197-4.373c-.767-1.28-1.173-2.753-1.175-4.254.002-4.62 3.76-8.376 8.388-8.376 2.24 0 4.347.872 5.932 2.457 1.584 1.584 2.477 3.691 2.479 5.933zm-4.371 3.518c-.24-.12-.142-.71-.24-.83-.098-.12-.34-.18-.46-.18s-.26.06-.38.18-.46.57-.56.69-.2.14-.34.07c-.14-.07-.59-.22-1.12-.69-.41-.36-.69-.81-.77-.95-.08-.14-.01-.22.06-.29.06-.06.14-.16.21-.24.07-.08.1-.14.15-.24.05-.1.02-.19-.01-.26-.03-.07-.34-.82-.47-1.12-.12-.3-.25-.26-.34-.26h-.29c-.1 0-.26.04-.4.19s-.53.52-.53 1.27.54 1.48.62 1.58c.08.1 1.06 1.62 2.57 2.27.36.16.64.25.86.32.36.11.69.1.95.06.29-.04.89-.36 1.02-.71.13-.35.13-.65.09-.71-.04-.06-.14-.1-.38-.22z"/>
            </svg>
            <span>Konfirmasi WhatsApp</span>
          </a>
        </div>

        {/* Right Column: Account Info (Right aligned) */}
        <div
          style={{
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: '2px',
            minWidth: 0,
            flex: 1
          }}
        >
          {/* Label No. Rekening */}
          <p
            style={{
              margin: '0 0 4px 0',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1rem',
              color: '#2a2a2a',
              letterSpacing: '0.2px'
            }}
          >
            No. Rekening
          </p>

          {/* Value No. Rekening */}
          <p
            style={{
              margin: '0 0 16px 0',
              fontFamily: '"Inter", sans-serif',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '0.5px',
              wordBreak: 'break-all',
              userSelect: 'all'
            }}
          >
            {account.number || '-'}
          </p>

          {/* Label Atas Nama */}
          <p
            style={{
              margin: '0 0 4px 0',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1rem',
              color: '#2a2a2a',
              letterSpacing: '0.2px'
            }}
          >
            Atas Nama
          </p>

          {/* Value Atas Nama */}
          <p
            style={{
              margin: 0,
              fontFamily: '"Inter", sans-serif',
              fontSize: '1.08rem',
              fontWeight: 800,
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              wordBreak: 'break-word'
            }}
          >
            {account.owner || '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
