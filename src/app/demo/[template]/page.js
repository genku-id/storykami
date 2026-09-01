import React from 'react';
import { notFound } from 'next/navigation';
import { defaultInvitationData } from '@/utils/wimDataContract';

import Floral1Template from '@/components/wim-baru/Floral1Template';
import JawaTemplate from '@/components/wim-baru/JawaTemplate';

export default async function DemoPage({ params }) {
  const { template } = await params;

  // Render berdasarkan template
  if (template === 'floral1') {
    return <Floral1Template data={defaultInvitationData} slug="demo" isVisible={() => true} />;
  }
  
  if (template === 'template-daerahJawa') {
    return <JawaTemplate data={defaultInvitationData} slug="demo" isVisible={() => true} />;
  }

  // Jika tidak ditemukan
  notFound();
}

export function generateMetadata({ params }) {
  return {
    title: `Demo Template | StoryKami`,
    description: `Lihat preview template undangan pernikahan digital StoryKami.`,
  };
}
