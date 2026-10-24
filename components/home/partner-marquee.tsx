'use client';

import { BrandArtwork } from '../brand-artwork';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import styles from './partner-marquee.module.css';

type PartnerLogo = { name: string; slug: string; href?: string; label?: string };

// Use the same transparent brand artwork as the hero wherever available.
const partners: PartnerLogo[] = [
  { name: 'NOVITEC', slug: 'novitec' },
  { name: 'Valvetronic Designs', slug: 'valvetronic' },
  { name: 'TECHART', slug: 'techart' },
  { name: 'FI Exhaust', slug: 'fi-exhaust' },
  { name: 'Gintani', slug: 'gintani', href: '/contact?programme=Gintani', label: 'Enquire about Gintani' },
  { name: 'Liberty Walk', slug: 'liberty-walk', href: '/contact?programme=Liberty%20Walk', label: 'Enquire about Liberty Walk' },
  { name: 'Voltrix', slug: 'voltrix', href: '/contact?programme=Voltrix', label: 'Enquire about Voltrix' },
];

export function PartnerMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const group = groupRef.current;
    const track = trackRef.current;
    if (!group || !track) return;

    // Keep a calm, constant speed across phone, desktop and ultrawide layouts.
    const updateSpeed = () => {
      track.style.setProperty('--partner-duration', `${group.getBoundingClientRect().width / 28}s`);
    };
    updateSpeed();
    const observer = new ResizeObserver(updateSpeed);
    observer.observe(group);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="brands" aria-label="Authorised partners">
      <div className={styles.heading}>
        <p>Authorised partners</p>
      </div>
      <div className={styles.viewport} id="partner-logos">
        <div className={styles.track} ref={trackRef}>
          {[false, true].map(duplicate => (
            <div key={String(duplicate)} ref={duplicate ? undefined : groupRef} className={styles.group} aria-hidden={duplicate || undefined}>
              {partners.map(partner => (
                <Link
                  key={partner.slug}
                  href={partner.href ?? `/partners/${partner.slug}`}
                  prefetch={false}
                  tabIndex={duplicate ? -1 : undefined}
                  aria-label={duplicate ? undefined : partner.label ?? `Explore ${partner.name}`}
                  className={styles.logo}
                  data-brand={partner.slug}
                >
                  <BrandArtwork brand={partner.slug} labelled={!duplicate} />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
