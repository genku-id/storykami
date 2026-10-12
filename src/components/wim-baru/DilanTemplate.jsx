'use client';
import React, { useEffect, useState } from 'react';

export default function DilanTemplate({ data = {}, slug = 'demo', guestName = '', isDemo = false }) {
  const [iframeSrc, setIframeSrc] = useState('/templates/dilan/index.html');

  useEffect(() => {
    let name = guestName;
    if (!name && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      name = sp.get('to') || sp.get('u') || sp.get('nama') || sp.get('guest') || '';
    }

    const params = new URLSearchParams();
    if (name) params.set('to', name);
    if (slug) params.set('slug', slug);
    if (isDemo) params.set('demo', '1');

    setIframeSrc(`/templates/dilan/index.html?${params.toString()}`);
  }, [guestName, slug, isDemo]);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100svh', 
        zIndex: 1000, 
        background: '#20241f', 
        margin: 0, 
        padding: 0, 
        overflow: 'hidden' 
      }}
    >
      <iframe
        src={iframeSrc}
        title="The Wedding of Dilan & Millea"
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none', 
          display: 'block',
          margin: 0,
          padding: 0
        }}
        allow="autoplay; clipboard-write"
      />
    </div>
  );
}
