import type { Metadata } from 'next';
import { PurosangueStudio } from '@/components/purosangue/studio';

export const metadata: Metadata = {
  title: 'Purosangue Design Study',
  description: 'An interactive, approximate 3D assembly study of the Ferrari Purosangue with NOVITEC components.',
  robots: { index: false, follow: false },
};
export default function Page() { return <PurosangueStudio />; }
