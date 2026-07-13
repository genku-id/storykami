import { notFound } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Floral1Template from '@/components/templates/Floral1Template';
import Floral2Template from '@/components/templates/Floral2Template';
export const revalidate = 0; // Disable cache agar update dari WIM langsung terlihat

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!invitation) {
    return { title: 'Undangan Tidak Ditemukan' };
  }

  const data = invitation.data;
  
  const namaPasangan = data.hal1_namaPasangan || data.coupleName || '';
  const defaultTitle = namaPasangan ? `Undangan Pernikahan ${namaPasangan} | StoryKami` : 'Undangan Pernikahan Digital | StoryKami';
  
  let title = data.thumbnailJudul || defaultTitle;
  title = title.replace(/\[NAMA\]/gi, namaPasangan);

  const defaultDesc = namaPasangan ? `Hadiri Pernikahan ${namaPasangan} yaa` : 'Undangan Pernikahan Digital';
  let description = data.thumbnailDeskripsi || defaultDesc;
  description = description.replace(/\[NAMA\]/gi, namaPasangan);
  
  // Gunakan thumbnailFoto, jika tidak ada gunakan hal2_fotoCouple (Hero image) sebagai fallback
  const ogImage = data.thumbnailFoto || data.hal2_fotoCouple || null;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function InvitationPage({ params }) {
  const resolvedParams = await params;
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (error || !invitation) {
    return notFound();
  }

  const { template_name, data } = invitation;

  if (template_name === 'template-floral1') {
    return <Floral1Template data={data} />;
  }

  if (template_name === 'template-floral2') {
    return <Floral2Template data={data} />;
  }

  // Jika template belum dibuat / tidak ada
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Template {template_name} sedang dalam pengembangan.</h1>
    </div>
  );
}
