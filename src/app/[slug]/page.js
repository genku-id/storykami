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
  
  const defaultTitle = `Undangan Pernikahan ${data.hal1_namaPasangan || data.coupleName} | StoryKami`;
  const title = data.thumbnailJudul || defaultTitle;
  const description = `Undangan Pernikahan Digital ${data.hal1_namaPasangan || data.coupleName}`;
  const ogImage = data.thumbnailFoto || 'https://storykami.my.id/default-og.jpg'; // fallback image if needed

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage],
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
