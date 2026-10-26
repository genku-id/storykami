import React from 'react';
import { notFound } from 'next/navigation';
import { defaultInvitationData } from '@/utils/wimDataContract';

import Floral1Template from '@/components/wim-baru/Floral1Template';
import JawaTemplate from '@/components/wim-baru/JawaTemplate';
import DilanTemplate from '@/components/wim-baru/DilanTemplate';
import VintageJawa03Template from '@/components/wim-baru/VintageJawa03Template';
import MovementTemplate from '@/components/wim-baru/MovementTemplate';

export default async function DemoPage({ params }) {
  const { template } = await params;

  // Render berdasarkan template
  if (template === 'floral1') {
    return <Floral1Template data={defaultInvitationData} slug="demo-floral1" isDemo={true} />;
  }
  
  if (template === 'template-daerahJawa') {
    return <JawaTemplate data={defaultInvitationData} slug="demo-jawa" isDemo={true} />;
  }

  if (template === 'template-dilan' || template === 'dilan') {
    return <DilanTemplate data={defaultInvitationData} slug="demo-dilan" isDemo={true} />;
  }

  if (template === 'vintage-jawa-03' || template === 'template-vintage-jawa-03') {
    return <VintageJawa03Template data={defaultInvitationData} slug="demo-vintage-jawa-03" isDemo={true} />;
  }

  if (template === 'movement' || template === 'template-movement') {
    return <MovementTemplate data={defaultInvitationData} slug="demo-movement" isDemo={true} />;
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
