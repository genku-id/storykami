import { notFound } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Floral1Template from '@/components/templates/Floral1Template';

export const revalidate = 60; // Regenerate cache setiap 60 detik (ISR)

export async function generateMetadata({ params }) {
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!invitation) {
    return { title: 'Undangan Tidak Ditemukan' };
  }

  const data = invitation.data;
  return {
    title: `Undangan Pernikahan ${data.coupleName} | StoryKami`,
    description: `Undangan Pernikahan Digital ${data.coupleName}`,
  };
}

export default async function InvitationPage({ params }) {
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !invitation) {
    return notFound();
  }

  const { template_name, data } = invitation;

  if (template_name === 'template-floral1') {
    return <Floral1Template data={data} />;
  }

  // Jika template belum dibuat / tidak ada
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Template {template_name} sedang dalam pengembangan.</h1>
    </div>
  );
}
