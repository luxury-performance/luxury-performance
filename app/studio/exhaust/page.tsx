import type { Metadata } from 'next';
import { ValvetronicExhaustShowcase } from '@/components/home/valvetronic-exhaust-showcase';

export const metadata: Metadata = { title: 'Huracán exhaust study', robots: { index: false, follow: false } };
export default function Page() {
  return <div style={{ background: '#101112', padding: '40px 5vw 64px', minHeight: '100svh' }}>
    <h1 className="sr-only">Valvetronic Huracán exhaust route study</h1>
    <ValvetronicExhaustShowcase initialRouteColors />
  </div>;
}
