import type { Metadata } from 'next';
import { SoundEffectsPreview } from '@/components/home/sound-effects-preview';
import '@/app/home-tokens.css';

export const metadata: Metadata = { title: 'Valvetronic sound styles', robots: { index: false, follow: false } };
export default function Page() { return <SoundEffectsPreview />; }
