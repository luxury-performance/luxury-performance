import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { filterUrl } from '@/lib/shop/taxonomy';
import styles from '../../[make]/models.module.css';

export const metadata: Metadata = {
  title: 'NOVITEC Ferrari 812 Superfast and GTS',
  description: 'Choose your Ferrari 812 Superfast or GTS and explore NOVITEC parts for your car.',
  alternates: { canonical: '/partners/novitec/ferrari/812' },
  robots: { index: process.env.SHOP_SEO_LIVE === 'true', follow: true },
};

const versions = [
  { key: '812_superfast', name: '812 Superfast', image: '812-superfast.jpg' },
  { key: '812_gts', name: '812 GTS', image: '812-gts.jpg' },
] as const;

export default function Novitec812() {
  return <div className={styles.page}><div className={styles.inner}>
    <Link href="/partners/novitec/ferrari" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> All Ferrari models</Link>
    <header className={styles.heading}><div><p className={styles.eyebrow}>NOVITEC / Ferrari / 812</p><h1>Choose your 812.</h1><p>Select your version to explore NOVITEC parts listed for your car.</p></div>

    </header>
    <ul className={styles.grid} aria-label="Ferrari 812 versions">{versions.map(version => <li key={version.key}>
      <Link className={styles.card} href={filterUrl('/shop', { brand: 'novitec', make: 'ferrari', model: version.key })}>
        <span className={styles.picture}><Image src={`/images/novitec-models/official-covers/${version.image}`} alt="" fill sizes="(max-width: 700px) 45vw, (max-width: 1100px) 45vw, 30vw" quality={90} className={styles.image} /></span>
        <span className={styles.cardLabel}><span><small>Ferrari</small><strong>{version.name}</strong></span><ArrowUpRight size={20} aria-hidden="true" /></span>
      </Link>
    </li>)}</ul>
  </div></div>;
}
