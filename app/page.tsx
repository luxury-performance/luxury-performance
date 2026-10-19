import Image from 'next/image';
import { F8Stills } from '@/components/f8-stills/f8-stills';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Eyebrow, ArrowLink } from '@/components/ui';
import { PurosangueFilm } from '@/components/purosangue/film';
import { Expertise } from '@/components/expertise';
import { Reveal } from '@/components/reveal';
import { ProgrammeCard } from '@/components/programme-card';
import { Closing } from '@/components/closing';
import { programmes } from '@/lib/content';

export default function Home() {
  return <>
    <F8Stills car="mix" bare />
    <section className="intro section-pad"><Reveal><Eyebrow number="01">A different kind of drive</Eyebrow><div className="intro-grid"><div className="intro-side"><span className="large-plus">+</span><p>Not just what you drive.<br />How it makes you feel.</p></div><div><h2>Exceptional comes<br />as standard.<br /><span className="text-muted">Individual is up to you.</span></h2><div className="intro-copy"><p>Performance exhausts, carbon fibre upgrades and forged wheels, selected by Luxury Performance in Dubai. Discover exceptional parts from our partner brands, with expert fitment advice and installation support for your car.</p><ArrowLink href="/about">Meet Luxury Performance</ArrowLink></div></div></div></Reveal></section>
    <PurosangueFilm />
    <Expertise />
    <section className="programmes-section section-pad"><Reveal><div className="section-heading horizontal"><div><Eyebrow number="03">Selected programmes</Eyebrow><h2>Extraordinary,<br /><span className="text-muted">from every angle.</span></h2></div><ArrowLink href="/programmes">Explore all programmes</ArrowLink></div><div className="programme-grid home-programmes">{programmes.slice(0, 2).map((programme, index) => <ProgrammeCard key={programme.slug} programme={programme} index={index} />)}</div></Reveal></section>
    <section className="partners-strip section-pad"><span className="tiny-label">Exceptional names. A shared obsession.</span><div className="partners-logos" aria-label="Brands: NOVITEC, TECHART, FI Exhaust and Valvetronic"><Link href="/partners/novitec" className="partner-novitec">NOVITEC</Link><Link href="/partners/techart" className="partner-techart">TECHART</Link><Link href="/partners/fi-exhaust" className="partner-fi">Fi<span>EXHAUST</span></Link><Link href="/partners/valvetronic" className="partner-valvetronic">VALVETRONIC<small>DESIGNS</small></Link></div></section>
    <section className="world-section"><div className="world-image"><Image src="/images/workshop.webp" fill sizes="(max-width: 800px) 100vw, 55vw" alt="Porsche in a specialist performance workshop" /></div><div className="world-copy"><Reveal><Eyebrow dark number="04">The Luxury Performance approach</Eyebrow><h2>Good parts.<br />Great judgement.</h2><p>The difference is knowing what works together. We connect you with genuine components, informed advice and installation support — from the first idea to the finer details.</p><div className="world-principles"><span>01 / Listen first</span><span>02 / Specify with purpose</span><span>03 / Support every detail</span></div><ArrowLink href="/about" light>Discover our world</ArrowLink></Reveal></div></section>
    <section className="location-section section-pad"><Reveal><div className="location-heading"><Eyebrow>Rooted in Dubai. Connected worldwide.</Eyebrow><p>Part of The Luxury Group.<br />One shared passion for exceptional automobiles.</p></div><Link href="/about#dubai" className="location-banner"><Image src="/images/headquarters.webp" fill sizes="90vw" alt="The Luxury Group headquarters with a lineup of supercars in Dubai" /><div className="location-overlay" /><div className="location-caption"><span>Our home.<br /><strong>Your next chapter.</strong></span><span className="location-arrow"><ArrowUpRight size={35} strokeWidth={1} /></span></div><span className="location-address">AL QUOZ, DUBAI / THE LUXURY GROUP</span></Link></Reveal></section>
    <Closing />
  </>;
}
