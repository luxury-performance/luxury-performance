import type { Metadata } from 'next';
import { PurosangueFilm } from '@/components/purosangue/film';

export const metadata: Metadata = {
  title: 'Purosangue — The Transformation',
  description: 'Explore the Ferrari Purosangue NOVITEC programme through a cinematic transformation and interactive before-and-after visualisation.',
  robots: { index: false, follow: false },
};
export default function Page() { return <PurosangueFilm />; }
