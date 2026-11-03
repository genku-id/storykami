import { redirect } from 'next/navigation';

export default async function SnapshotRedirectPage({ params }) {
  const { slug } = await params;
  redirect(`/${slug}/albumkami`);
}
