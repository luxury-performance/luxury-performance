import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { getCatalog } from '@/lib/shop/storefront';
import { filterUrl, label, supplierOf, tagsFor } from '@/lib/shop/taxonomy';
import styles from './models.module.css';

const makes: Record<string, { tag: string; name: string }> = {
  ferrari: { tag: 'ferrari', name: 'Ferrari' },
  lamborghini: { tag: 'lamborghini', name: 'Lamborghini' },
  mclaren: { tag: 'mclaren', name: 'McLaren' },
  'rolls-royce': { tag: 'rolls_royce', name: 'Rolls-Royce' },
};

const covers: Record<string, string> = {
  purosangue: 'official-covers/purosangue.jpg',
  revuelto: 'official-covers/revuelto.jpg',
  urus: 'official-covers/urus.jpg',
  urus_performante: 'official-covers/urus-performante.jpg',
  urus_s: 'official-covers/urus-s.jpg',
  sf90: 'official-covers/sf90.jpg',
  '12cilindri': 'official-covers/12cilindri.jpg',
  f8: 'official-covers/f8.jpg',
  '812': 'official-covers/812-superfast.jpg',
  '812_superfast': 'official-covers/812-superfast.jpg',
  '812_gts': 'official-covers/812-gts.jpg',
  '750s': 'official-covers/750s.jpg',
  senna: 'official-covers/senna.jpg',
  cullinan: 'official-covers/cullinan.jpg',
  cullinan_series_ii: 'official-covers/cullinan-series-ii.jpg',
  spectre: 'official-covers/spectre.jpg',
};

function modelLabel(model: string) {
  if (model === '750s') return '750S';
  if (model === 'cullinan_series_ii') return 'Cullinan Series II';
  return label(model);
}

type Props = { params: Promise<{ make: string }> };
export function generateStaticParams() { return Object.keys(makes).map(make => ({ make })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make } = await params;
  const brand = makes[make];
  if (!brand) return {};
  return { title: `NOVITEC for ${brand.name}`, description: `Explore NOVITEC parts for your ${brand.name}. Choose your model to find the available upgrades.`, alternates: { canonical: `/partners/novitec/${make}` }, robots: { index: process.env.SHOP_SEO_LIVE === 'true', follow: true } };
}

export default async function NovitecModelsForMake({ params }: Props) {
  const { make } = await params;
  const brand = makes[make];
  if (!brand) notFound();
  const products = (await getCatalog()).filter(product => supplierOf(product) === 'novitec' && tagsFor(product, 'make').includes(brand.tag));
  const models = [...new Set(products.flatMap(product => tagsFor(product, 'model')))].sort((a, b) => modelLabel(a).localeCompare(modelLabel(b), 'en', { numeric: true }));
  return <div className={styles.page}>
    <div className={styles.inner}>
      <Link href="/partners/novitec#vehicles" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> All marques</Link>
      <header className={styles.heading}>
        <div><p className={styles.eyebrow}>NOVITEC / {brand.name}</p><h1>Choose your {brand.name}.</h1><p>Select your model to explore the NOVITEC parts available for your car.</p></div>
        <Link href={filterUrl('/shop', { brand: 'novitec', make: brand.tag })} className={styles.all}>Shop all {brand.name} parts <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </header>
      {models.length ? <ul className={styles.grid} aria-label={`${brand.name} models`}>
        {models.map(model => <li key={model}><Link className={styles.card} href={filterUrl('/shop', { brand: 'novitec', make: brand.tag, model })}>
          <span className={styles.picture}>{covers[model] ? <Image src={`/images/novitec-models/${covers[model]}`} alt="" fill sizes="(max-width: 700px) 45vw, (max-width: 1100px) 45vw, 30vw" quality={90} className={styles.image} /> : <Image src="/brand/novitec.svg" alt="" width={160} height={32} className={styles.placeholder} />}</span>
          <span className={styles.cardLabel}><span><small>{brand.name}</small><strong>{modelLabel(model)}</strong></span><ArrowUpRight size={20} aria-hidden="true" /></span>
        </Link></li>)}
      </ul> : <p className={styles.empty}>No models are listed online yet. <Link href={filterUrl('/shop', { brand: 'novitec', make: brand.tag })}>Explore available {brand.name} parts</Link> or <Link href="/contact">ask our team</Link>.</p>}
    </div>
  </div>;
}
