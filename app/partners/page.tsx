import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { partners } from '@/lib/partners';
import { Eyebrow } from '@/components/ui';
import styles from './partners.module.css';
export const metadata: Metadata = { title: 'Our Partners', description: 'Discover NOVITEC, TECHART, Valvetronic Designs, FI Exhaust with Luxury Performance, Dubai.', alternates: { canonical: '/partners' }, robots: { index: process.env.SHOP_SEO_LIVE === 'true', follow: true } };
export default function Partners() {
  return <div className={styles.directory}><header className={styles.directoryIntro}><Eyebrow>Our partners</Eyebrow><h1>Exceptional names.<br/><span>A shared obsession.</span></h1><p>Different approaches. The same attention to detail. Discover the people behind the parts, then find your next specification.</p></header><section className={styles.partnerGrid} aria-label="Our partner brands">{partners.filter(p => !p.stockOnly).map((p, i) => <Link key={p.slug} href={`/partners/${p.slug}`} className={styles.partnerCard}><div className={styles.partnerImage}><Image src={p.image} alt={p.imageAlt} fill sizes="(max-width: 700px) 90vw, 45vw" /><span>{String(i + 1).padStart(2, '0')} / {p.stockOnly ? 'LIMITED STOCK' : 'THE PARTNERS'}</span></div><div className={styles.partnerCaption}><div><h2>{p.name}</h2><p>{p.label}</p></div><ArrowUpRight size={25}/></div></Link>)}</section></div>;
}
