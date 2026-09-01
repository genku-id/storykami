import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

// Import Templates
import Floral1Template from '@/components/wim-baru/Floral1Template';
import JawaTemplate from '@/components/wim-baru/JawaTemplate';

export const revalidate = 60; // ISR cache tiap 60 detik

export default async function InvitationPage({ params }) {
  const { slug } = await params;

  // Inisialisasi Supabase Server Client
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Ambil data undangan dari database
  const { data: inv, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !inv) {
    return (
      <div style={{ fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: '#4a7c7e', marginBottom: '8px' }}>Undangan Tidak Ditemukan</h1>
          <p style={{ color: '#666' }}>Link undangan <strong>{slug}</strong> belum dibuat atau sudah tidak aktif.</p>
        </div>
      </div>
    );
  }

  const template = inv.template_name || inv.template;
  const data = inv.data || {};

  // Render berdasarkan template yang menggunakan Framework (React)
  if (template === 'floral1') {
    return <Floral1Template data={data} slug={slug} isVisible={() => true} />;
  }
  
  if (template === 'template-daerahJawa') {
    return <JawaTemplate data={data} slug={slug} isVisible={() => true} />;
  }

  // Jika menggunakan template lama yang belum berbasis React, arahkan ke rute legacy
  redirect(`/legacy/${slug}`);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: inv } = await supabase.from('invitations').select('data').eq('slug', slug).single();
  const data = inv?.data || {};

  const namaPasangan = data.coverName || data.coupleName || 
    `${data.mempelai?.wanita?.namaPanggilan || data.brideName || ''} & ${data.mempelai?.pria?.namaPanggilan || data.groomName || ''}`.trim() || 'Pasangan';
    
  const title = (data.thumbnailJudul || `Undangan Pernikahan ${namaPasangan} | StoryKami`).replace(/\[NAMA\]/gi, namaPasangan);
  const description = (data.thumbnailDeskripsi || `Hadiri Pernikahan ${namaPasangan}`).replace(/\[NAMA\]/gi, namaPasangan);
  const image = data.thumbnailFoto || data.coupleImage || data.hal2_fotoCouple || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    }
  };
}
