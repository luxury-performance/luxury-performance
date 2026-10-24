/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { getCatalog } from '@/lib/shop/storefront';
import { money } from '@/lib/shop/types';
import styles from './homepage.module.css';

const featuredHandles = [
  'novitec-rearspoiler-visible-carbon-purosangue',
  'novitec-esteso-roofspoiler-race-visible-carbon-not-with-electric-inside-rear-mirror-purosangue',
  'novitec-nf10-wheel-set-purosangue',
  'novitec-tailpipes-black-2pcs-purosangue',
];

export async function HomeProducts() {
  const products = await getCatalog().catch(() => null);
  const featured = featuredHandles.flatMap(handle => {
    const product = products?.find(item => item.handle === handle);
    return product?.featuredImage && Number(product.priceRange.minVariantPrice.amount) > 0 ? [product] : [];
  });
  if (!featured.length) return <div className={styles.productFallback}><p>Explore NOVITEC components for the Ferrari Purosangue.</p><Link className={styles.textLink} href="/shop?brand=novitec&make=ferrari&model=purosangue">Browse the collection</Link></div>;
  return <div className={styles.productGrid}>
    {featured.map(product => <Link className={styles.productCard} key={product.id} href={`/products/${product.handle}`} title={product.title}>
      <div className={styles.productImage}><img src={`${product.featuredImage!.url}${product.featuredImage!.url.includes('?') ? '&' : '?'}width=700`} alt={product.featuredImage!.altText || product.title} loading="lazy" width="700" height="700" /></div>
      <h3>{product.title.replace(/^NOVITEC\s*[-–]\s*/i, '').split(/\s+for\s+/i)[0]}</h3>
      <p>From {money(product.priceRange.minVariantPrice)}</p>
    </Link>)}
  </div>;
}
