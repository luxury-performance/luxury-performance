import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { filterUrl } from '@/lib/shop/taxonomy';
import styles from '../../[make]/models.module.css';

export const metadata: Metadata = {
  title: 'NOVITEC Ferrari F8 Tributo and Spider',
  description: 'Choose your Ferrari F8 Tributo or Spider and explore NOVITEC parts for your car.',
  alternates: { canonical: '/partners/novitec/ferrari/f8' },
  robots: { index: process.env.SHOP_SEO_LIVE === 'true', follow: true },
};

const versions = [
  { key: 'tributo', name: 'F8 Tributo', image: 'f8-tributo.jpg' },
  { key: 'spider', name: 'F8 Spider', image: 'f8-spider.jpg' },
] as const;

export default function NovitecF8() {
  return <div className={styles.page}><div className={styles.inner}>
    <Link href="/partners/novitec/ferrari" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> All Ferrari models</Link>
    <header className={styles.heading}><div><p className={styles.eyebrow}>NOVITEC / Ferrari / F8</p><h1>Choose your F8.</h1><p>Select your version to explore NOVITEC parts listed for your car.</p></div>
      <Link href={filterUrl('/shop', { brand: 'novitec', make: 'ferrari', model: 'f8' })} className={styles.all}>Shop all F8 parts <ArrowUpRight size={17} aria-hidden="true" /></Link>
    </header>
    <ul className={styles.grid} aria-label="Ferrari F8 versions">{versions.map(version => <li key={version.key}>
      <Link className={styles.card} href={filterUrl('/shop', { brand: 'novitec', make: 'ferrari', model: 'f8', body: version.key })}>
        <span className={styles.picture}><Image src={`/images/novitec-models/official-covers/${version.image}`} alt="" fill sizes="(max-width: 700px) 45vw, (max-width: 1100px) 45vw, 30vw" quality={90} className={styles.image} /></span>
        <span className={styles.cardLabel}><span><small>Ferrari</small><strong>{version.name}</strong></span><ArrowUpRight size={20} aria-hidden="true" /></span>
      </Link>
    </li>)}</ul>
  </div></div>;
}
