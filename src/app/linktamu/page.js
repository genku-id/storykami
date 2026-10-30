'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const PRESET_TEMPLATES = {
  muslim: `Assalamualaikum Warahmatullahi Wabarakatuh

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i {{nama_tamu}} untuk menghadiri acara kami.

Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi:

{{link_undangan}}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.

Terima kasih banyak atas perhatiannya. Alhamdulillah Jazakumullohu Khoiro

Salam Hormat,
(Nama Mempelai)`,

  formal: `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i {{nama_tamu}} untuk menghadiri acara pernikahan kami.

Berikut tautan undangan kami, untuk informasi lengkap acara dapat mengunjungi:

{{link_undangan}}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu kepada kami.

Terima kasih atas perhatian dan doa restunya.

Hormat kami,
(Nama Mempelai)`,

  casual: `Halo {{nama_tamu}}!

Kabar bahagia untuk kita semua. Kami mengundang kamu untuk hadir dan merayakan momen bahagia pernikahan kami.

Detail acara dan undangan digital bisa kamu lihat di sini ya:
{{link_undangan}}

Kehadiran dan doa restumu sangat berarti bagi kami. Sampai jumpa di hari bahagia kami!

Salam hangat,
(Nama Mempelai)`
};

function LinkTamuContent() {
  const searchParams = useSearchParams();
  const slugParam = searchParams.get('slug') || '';
  const urlParam = searchParams.get('url') || '';

  const [baseUrl, setBaseUrl] = useState('');
  const [guestListText, setGuestListText] = useState('');
  const [templateType, setTemplateType] = useState('muslim');
  const [customTemplate, setCustomTemplate] = useState(PRESET_TEMPLATES.muslim);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [generatedGuests, setGeneratedGuests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Inisialisasi Base URL dari search parameters atau default domain StoryKami
  useEffect(() => {
    if (urlParam) {
      setBaseUrl(urlParam);
    } else if (slugParam) {
      setBaseUrl(`https://storykami.my.id/${slugParam}`);
    } else if (typeof window !== 'undefined' && !baseUrl) {
      setBaseUrl(`${window.location.origin}/contoh-undangan`);
    }
  }, [slugParam, urlParam]);

  // Handler toast
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 2800);
  };

  // Salin ke Clipboard
  const copyToClipboard = async (text, successNotice) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast(successNotice);
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Gagal menyalin otomatis');
    }
  };

  // Generate Guest Links
  const handleGenerate = (e) => {
    e.preventDefault();
    const rawUrl = baseUrl.trim();
    if (!rawUrl) {
      alert('Silakan masukkan Link Undangan terlebih dahulu!');
      return;
    }
    if (!guestListText.trim()) {
      alert('Silakan masukkan minimal 1 nama tamu!');
      return;
    }

    // Format URL dasar
    let cleanUrl = rawUrl.replace(/^https?:\/\//i, '');
    cleanUrl = 'https://' + cleanUrl.replace(/\/+$/, '');

    const lines = guestListText.split('\n');
    const result = [];
    let counter = 1;

    lines.forEach(line => {
      const name = line.trim();
      if (!name) return;

      const safeName = name.replace(/&/g, 'dan');
      const encodedParam = encodeURIComponent(safeName);
      const uniqueLink = `${cleanUrl}?to=${encodedParam}`;

      const finalMsg = customTemplate
        .replace(/\{\{nama_tamu\}\}/g, safeName)
        .replace(/\{\{link_undangan\}\}/g, uniqueLink);

      const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(finalMsg)}`;

      result.push({
        id: counter++,
        name: safeName,
        link: uniqueLink,
        message: finalMsg,
        waLink
      });
    });

    setGeneratedGuests(result);
    showToast(`Berhasil men-generate ${result.length} link tamu!`);

    // Auto scroll ke hasil
    setTimeout(() => {
      const el = document.getElementById('hasil-generate');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Salin Semua Link Sekaligus
  const handleCopyAllLinks = () => {
    if (generatedGuests.length === 0) return;
    const allText = generatedGuests.map((g, i) => `${i + 1}. ${g.name}\n${g.link}`).join('\n\n');
    copyToClipboard(allText, 'Semua link tamu berhasil disalin!');
  };

  // Filter Search
  const filteredGuests = generatedGuests.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2rem 1rem 5rem' }}>
      
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          padding: '12px 24px',
          borderRadius: '50px',
          background: '#0f172a',
          color: '#ffffff',
          fontSize: '0.9rem',
          fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <span>✅</span>
          <span>{toastMsg}</span>
        </div>
      )}

      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <span>👥 StoryKami Guest Link Generator</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>
            Generator Link Tamu
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: '540px', margin: '0 auto' }}>
            Buat link undangan personal dan pesan WhatsApp otomatis untuk setiap tamu undangan Anda dalam hitungan detik.
          </p>
        </div>

        {/* Input Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '2rem' }}>
          
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>1️⃣</span> Pengaturan Undangan
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Link Undangan (Base URL)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="contoh: storykami.my.id/dika-riyan"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Format link tamu akan menjadi: {baseUrl || '...' }?to=Nama+Tamu
              </span>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                ⚙️ Atur Format Pesan WhatsApp
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '2rem 0 1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>2️⃣</span> Daftar Nama Tamu
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Masukkan Nama Tamu (Satu nama per baris)
            </label>
            <textarea
              rows={8}
              value={guestListText}
              onChange={e => setGuestListText(e.target.value)}
              placeholder={"Budi Santoso&#10;Keluarga Bapak Rahmat&#10;Andi & Istri&#10;Siti Nurhaliza"}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.92rem', fontFamily: 'monospace', background: '#f8fafc', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
              Tips: Anda bisa langsung copy-paste kolom daftar nama dari Excel / Google Sheets ke sini.
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            style={{ width: '100%', padding: '12px 24px', borderRadius: '8px', background: '#0f172a', color: '#ffffff', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.15)', transition: 'all 0.2s' }}
          >
            ⚡ Generate Link Tamu Sekarang
          </button>
        </div>

        {/* Output Section */}
        {generatedGuests.length > 0 && (
          <div id="hasil-generate" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  Hasil Generate ({generatedGuests.length} Tamu)
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Klik tombol WA untuk langsung mengirim, atau salin link/pesan secara instan.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyAllLinks}
                  style={{ padding: '7px 14px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  📋 Salin Semua Link
                </button>
              </div>
            </div>

            {/* Live Search */}
            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="🔍 Cari nama tamu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', width: '40px', color: '#64748b', fontWeight: 600 }}>No</th>
                    <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Nama Tamu</th>
                    <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada tamu yang cocok dengan pencarian "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest, idx) => (
                      <tr key={guest.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                          <div>{guest.name}</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', wordBreak: 'break-all', marginTop: '2px' }}>
                            {guest.link}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <a
                              href={guest.waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', background: '#25D366', color: '#ffffff', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, boxShadow: '0 2px 4px rgba(37,211,102,0.2)' }}
                            >
                              <span>💬</span> Kirim WA
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(guest.link, `Link untuk ${guest.name} disalin!`)}
                              title="Salin Link Undangan Saja"
                              style={{ padding: '6px 10px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              🔗 Link
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(guest.message, `Pesan WA untuk ${guest.name} disalin!`)}
                              title="Salin Pesan Teks Lengkap"
                              style={{ padding: '6px 10px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              📋 Teks WA
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* Modal Pengaturan Template Pesan */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Atur Format Pesan WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                &times;
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Pilih Preset Format Pesan
              </label>
              <select
                value={templateType}
                onChange={e => {
                  const val = e.target.value;
                  setTemplateType(val);
                  if (PRESET_TEMPLATES[val]) {
                    setCustomTemplate(PRESET_TEMPLATES[val]);
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
              >
                <option value="muslim">Muslim (Islami: Assalamualaikum & Jazakumullohu Khoiro)</option>
                <option value="formal">Formal (Umum & Resmi)</option>
                <option value="casual">Santai / Casual</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Isi Teks Pesan (Dapat Disesuaikan)
              </label>
              <textarea
                rows={11}
                value={customTemplate}
                onChange={e => setCustomTemplate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', lineHeight: '1.5', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Gunakan tag <b>{`{{nama_tamu}}`}</b> dan <b>{`{{link_undangan}}`}</b> agar nama dan link tamu otomatis terisi.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                style={{ padding: '9px 18px', borderRadius: '6px', background: '#0f172a', color: '#ffffff', border: 'none', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Selesai & Gunakan Template Ini
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LinkTamuPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontFamily: 'sans-serif' }}>
        Memuat Generator Link Tamu...
      </div>
    }>
      <LinkTamuContent />
    </Suspense>
  );
}
