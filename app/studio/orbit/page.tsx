import type { Metadata } from 'next';
import { F8Stills } from '@/components/f8-stills/f8-stills';
export const metadata: Metadata = { title: 'Automotive — Stills in motion', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const params = await searchParams;
  const car = params.car === 'mix' ? 'mix' : params.car === 'porsche' ? 'porsche' : params.car === 'revuelto' ? 'revuelto' : 'f8';
  return <F8Stills key={car} car={car}/>;
}
