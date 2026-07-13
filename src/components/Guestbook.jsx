"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function Guestbook({ slug }) {
  const [wishes, setWishes] = useState([]);
  const [formData, setFormData] = useState({
    nama: '',
    kehadiran: 'Hadir',
    ucapan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load existing wishes
  useEffect(() => {
    if (slug) {
      fetchWishes();
    }
  }, [slug]);

  const fetchWishes = async () => {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_slug', slug)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching wishes:", error);
      } else {
        setWishes(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.ucapan) {
      setErrorMsg("Nama dan Ucapan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('guestbook')
        .insert([
          {
            invitation_slug: slug,
            nama: formData.nama,
            kehadiran: formData.kehadiran,
            ucapan: formData.ucapan
          }
        ]);

      if (error) {
        setErrorMsg("Gagal mengirim ucapan: " + error.message);
      } else {
        setSuccessMsg("Terima kasih atas ucapan dan doa restunya!");
        setFormData({ nama: '', kehadiran: 'Hadir', ucapan: '' });
        fetchWishes(); // Reload wishes
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="guestbook-container">
      <div className="guestbook-form-card">
        <h3 className="guestbook-title">Kirim Ucapan & Doa</h3>
        
        {successMsg && <div className="alert-success" style={{ background: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '0.9rem' }}>{successMsg}</div>}
        {errorMsg && <div className="alert-error" style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '0.9rem' }}>{errorMsg}</div>}
        
        <form onSubmit={handleSubmit} className="guestbook-form">
          <div className="form-group mb-3">
            <input 
              type="text" 
              name="nama"
              placeholder="Nama Anda" 
              value={formData.nama}
              onChange={handleChange}
              className="guestbook-input"
              required
            />
          </div>
          <div className="form-group mb-3">
            <select 
              name="kehadiran" 
              value={formData.kehadiran}
              onChange={handleChange}
              className="guestbook-input"
            >
              <option value="Hadir">Hadir</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
              <option value="Masih Ragu">Masih Ragu</option>
            </select>
          </div>
          <div className="form-group mb-3">
            <textarea 
              name="ucapan"
              placeholder="Berikan ucapan dan doa restu..." 
              value={formData.ucapan}
              onChange={handleChange}
              className="guestbook-textarea"
              rows="4"
              required
            ></textarea>
          </div>
          <button type="submit" className="btn-guestbook" disabled={isSubmitting}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
          </button>
        </form>
      </div>

      <div className="guestbook-list mt-5">
        <h4 className="guestbook-list-title mb-4">{wishes.length} Ucapan</h4>
        <div className="wishes-scroll-container">
          {wishes.length === 0 ? (
            <p className="no-wishes">Belum ada ucapan. Jadilah yang pertama!</p>
          ) : (
            wishes.map((wish) => (
              <div key={wish.id} className="wish-card">
                <div className="wish-header">
                  <strong>{wish.nama}</strong>
                  <span className={`badge-kehadiran ${wish.kehadiran === 'Hadir' ? 'badge-hadir' : wish.kehadiran === 'Tidak Hadir' ? 'badge-tidak' : 'badge-ragu'}`}>
                    {wish.kehadiran}
                  </span>
                </div>
                <div className="wish-date">
                  {new Date(wish.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="wish-message">{wish.ucapan}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .guestbook-container {
          max-width: 500px;
          margin: 0 auto;
          width: 100%;
        }
        .guestbook-form-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .guestbook-title {
          font-family: 'Playfair Display', serif;
          color: #333;
          margin-bottom: 20px;
          font-size: 1.5rem;
          text-align: center;
        }
        .guestbook-input, .guestbook-textarea {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          background: #fdfdfd;
          transition: border-color 0.3s;
        }
        .guestbook-input:focus, .guestbook-textarea:focus {
          outline: none;
          border-color: #8da4a6;
        }
        .btn-guestbook {
          width: 100%;
          padding: 12px;
          background: #8da4a6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-guestbook:hover {
          background: #73898b;
        }
        .btn-guestbook:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .guestbook-list-title {
          font-family: 'Playfair Display', serif;
          color: #fff;
          text-align: center;
        }
        
        .wishes-scroll-container {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
        }
        
        /* Scrollbar styling */
        .wishes-scroll-container::-webkit-scrollbar {
          width: 6px;
        }
        .wishes-scroll-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .wishes-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.5);
          border-radius: 10px;
        }
        
        .no-wishes {
          text-align: center;
          color: rgba(255,255,255,0.7);
          font-style: italic;
        }
        
        .wish-card {
          background: rgba(255,255,255,0.95);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
          text-align: left;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .wish-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .wish-header strong {
          color: #333;
          font-size: 1.05rem;
        }
        .badge-kehadiran {
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: 10px;
          font-weight: 600;
        }
        .badge-hadir {
          background: #d1fae5;
          color: #065f46;
        }
        .badge-tidak {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-ragu {
          background: #fef3c7;
          color: #92400e;
        }
        .wish-date {
          font-size: 0.75rem;
          color: #888;
          margin-bottom: 10px;
        }
        .wish-message {
          color: #444;
          font-size: 0.95rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
