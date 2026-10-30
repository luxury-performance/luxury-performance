import type { Metadata } from 'next';
import Image from 'next/image';
import { HomeHero } from '@/components/home/homepage';
import { PartnerMarquee } from '@/components/home/partner-marquee';
import './home-tokens.css';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Eyebrow, ArrowLink } from '@/components/ui';
import { PurosangueFilm } from '@/components/purosangue/film';
import { NovitecModels } from '@/components/home/novitec-models';
import { NovitecFeatureFilm } from '@/components/home/novitec-feature-film';
import { ValvetronicVehicles } from '@/components/home/valvetronic-vehicles';
import { Expertise } from '@/components/expertise';
import { Reveal } from '@/components/reveal';
import { Closing } from '@/components/closing';

export const metadata: Metadata = {
  title: { absolute: 'Performance Parts Dubai, UAE & GCC | Luxury Performance' },
  description: 'Shop NOVITEC, TECHART and Valvetronic Designs performance parts for the UAE & GCC. Exhausts, carbon fibre, forged wheels and fitment support from Dubai.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Performance Parts in Dubai, UAE & GCC',
    description: 'Discover NOVITEC, TECHART and Valvetronic Designs with Luxury Performance. Performance parts and vehicle fitment advice from Dubai for the UAE & GCC.',
    images: [{ url: '/images/home/novitec-12cilindri-desktop.jpg', width: 3840, height: 1700, alt: 'NOVITEC Ferrari 12Cilindri Spider with Luxury Performance' }],
  },
};

export default function Home() {
  return <>
    <HomeHero />
    <PartnerMarquee />
    <section className="intro intro-dark section-pad" aria-labelledby="home-welcome-title">
      <Reveal>
        <Eyebrow dark number="01">Welcome to Luxury Performance</Eyebrow>
        <div className="intro-grid">
          <div className="intro-side"><span className="large-plus" aria-hidden="true">+</span><p>Based in Dubai.<br />Serving the UAE &amp; GCC.</p></div>
          <div>
            <h2 id="home-welcome-title">Performance.<br /><span className="text-muted">Without compromise.</span></h2>
            <div className="intro-copy">
              <div className="intro-body">
                <p>Discover genuine performance parts for supercars and luxury vehicles, from NOVITEC, TECHART, Valvetronic Designs and other specialist brands.</p>
                <p>Based in Dubai, we help drivers across the UAE and GCC select exhaust systems, carbon fibre aerodynamics, forged wheels and suspension upgrades, with guidance on fitment and installation.</p>
              </div>
              <ArrowLink href="/about" light>Our story</ArrowLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
    <NovitecModels />
    <PurosangueFilm />
    <NovitecFeatureFilm />
    <ValvetronicVehicles />
    <Expertise />

    <section className="world-section"><div className="world-image"><Image src="/images/workshop.webp" fill sizes="(max-width: 800px) 100vw, 55vw" alt="Porsche in a specialist performance workshop" /></div><div className="world-copy"><Reveal><Eyebrow dark number="03">The Luxury Performance approach</Eyebrow><h2>Good parts.<br />Great judgement.</h2><p>The difference is knowing what works together. We connect you with genuine components, informed advice and installation support — from the first idea to the finer details.</p><div className="world-principles"><span>01 / Listen first</span><span>02 / Specify with purpose</span><span>03 / Support every detail</span></div><ArrowLink href="/about" light>Discover our world</ArrowLink></Reveal></div></section>
    <section className="location-section section-pad"><Reveal><div className="location-heading"><Eyebrow>Rooted in Dubai. Connected worldwide.</Eyebrow><p>Part of The Luxury Group.<br />One shared passion for exceptional automobiles.</p></div><Link href="/about#dubai" className="location-banner"><Image src="/images/headquarters.webp" fill sizes="90vw" alt="The Luxury Group headquarters with a lineup of supercars in Dubai" /><div className="location-overlay" /><div className="location-caption"><span>Our home.<br /><strong>Your next chapter.</strong></span><span className="location-arrow"><ArrowUpRight size={35} strokeWidth={1} /></span></div><span className="location-address">AL QUOZ, DUBAI / THE LUXURY GROUP</span></Link></Reveal></section>
    <Closing />
  </>;
}
