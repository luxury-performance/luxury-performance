import type { Metadata } from 'next';
import Link from 'next/link';
import { Eyebrow } from '@/components/ui';
import { ProgrammeFilter } from '@/components/programme-filter';
import { Closing } from '@/components/closing';
export const metadata: Metadata = { title: 'Brand Programmes', description: 'Explore selected NOVITEC, TECHART and FI Exhaust programmes for Ferrari, Porsche, Lamborghini and McLaren with Luxury Performance Dubai.' };
export default function Programmes() {
  return <><section className="page-intro"><Eyebrow>Selected brand programmes</Eyebrow><h1>Extraordinary.<br /><span>In your own way.</span></h1><div className="page-intro-bottom"><span className="tiny-label">Considered programmes.<br />Exceptional automotive brands.</span><p>A starting point for your next specification. Explore a selection of the brands and marques we work with, then make it your own.</p></div></section><section className="programmes-body" aria-label="Explore brand programmes"><ProgrammeFilter /><p className="programme-note">These are selected programmes, not the limit of what we offer. For other marques, Valvetronic systems, OEM parts or a specific component, <Link href="/contact">speak with our team</Link>.</p></section><Closing /></>;
}
