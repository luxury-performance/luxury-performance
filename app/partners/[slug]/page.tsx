/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { partners } from '@/lib/partners';
import { programmes } from '@/lib/content';
import { getCatalog } from '@/lib/shop/storefront';
import { categoryOf, filterUrl, label, supplierOf, tagsFor, suppliers } from '@/lib/shop/taxonomy';
import { money } from '@/lib/shop/types';
import { ArrowLink, Eyebrow } from '@/components/ui';
import { ProgrammeCard } from '@/components/programme-card';
import styles from '../partners.module.css';
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return partners.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = partners.find(p => p.slug === slug);
  if (!p) return { title: 'Partner not found' };
  return { title: `${p.name} in Dubai`, description: p.intro + ' ' + p.detail, alternates: { canonical: `/partners/${p.slug}` }, robots: { index: process.env.SHOP_SEO_LIVE === 'true', follow: true }, openGraph: { title: `${p.name} | Luxury Performance`, description: p.intro, images: [{ url: p.image, alt: p.imageAlt }] } };
}
export default async function PartnerPage({ params }: Props) {
  const { slug } = await params;
  const p = partners.find(p => p.slug === slug);
  if (!p) notFound();
  const products = p.supplier ? (await getCatalog()).filter(item => supplierOf(item) === p.supplier) : [];
  const shop = filterUrl('/shop', { brand: p.supplier });
  const enquiry = `/contact?programme=${encodeURIComponent(p.name)}`;
  const vehicleType = p.slug === 'techart' ? 'model' : 'make';
  const vehicles = [...new Set(products.flatMap(item => tagsFor(item, vehicleType)))].sort();
  const categories = [...new Set(products.map(categoryOf))].sort((a, b) => {
    const order = suppliers.find(s => s.slug === p.supplier)?.categories || [];
    return (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b));
  });
  const selections = [...categories.flatMap(c => products.find(item => categoryOf(item) === c) || []), ...products];
  const featured = [...new Map(selections.map(item => [item.id, item])).values()].slice(0, 4);
  const related = programmes.filter(item => item.brand.toLowerCase() === p.name.toLowerCase());
  const heroProduct = p.slug === 'valvetronic' ? products.find(item => /urus/i.test(item.title) && item.featuredImage) : undefined;
  const heroImage = heroProduct?.featuredImage?.url || p.image;
  return <div className={styles.page}>
    <section className={styles.hero} aria-labelledby="partner-title">
      <img className={styles.heroImage} src={heroImage} alt={heroProduct?.title || p.imageAlt} fetchPriority="high"/>
      <div className={styles.heroShade}/>
      <div className={styles.heroContent}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href={p.stockOnly ? "/shop" : "/partners"}>{p.stockOnly ? "The collection" : "Our partners"}</Link><span>/</span><span>{p.name}</span></nav>
        <div className={styles.heroBody}><span className="tiny-label">{p.label}</span><h1 id="partner-title">{p.name}</h1><p>{p.headline}</p><ArrowLink href={products.length ? shop : enquiry} light>{products.length ? `Shop ${p.stockOnly ? 'URBAN kits' : p.name}` : p.slug === 'fi-exhaust' ? 'Discuss your exhaust' : 'Ask about availability'}</ArrowLink></div>
        <div className={styles.heroFoot}><span>{p.focus}</span><a href="#discover">Discover {p.name} <ArrowDown size={17}/></a></div>
      </div>
    </section>
    <nav className={styles.jumpLinks} aria-label={`${p.name} page sections`}><a href="#discover">The approach</a>{vehicles.length > 0 && <a href="#vehicles">Your vehicle</a>}{categories.length > 0 && <a href="#departments">The collection</a>}{featured.length > 0 && <a href="#selected">Selected parts</a>}<Link href="/partners">All partners <ArrowUpRight size={14}/></Link></nav>
    <section id="discover" className={styles.introduction}><Eyebrow number="01">{p.stockOnly ? 'From our stock' : `The ${p.name} approach`}</Eyebrow><div><h2>{p.intro}</h2><p>{p.detail}</p>{p.stockOnly && <span className={styles.conditionNote}>Limited stock · 2 kits</span>}{p.supplier && !products.length && <p>No parts are currently listed online. <Link href={enquiry}>Ask our team about current availability.</Link></p>}</div></section>
    {vehicles.length > 0 && <section id="vehicles" className={styles.vehicles}><header><Eyebrow number="02">Your starting point</Eyebrow><h2>{p.vehicleHeading}</h2><p>{p.slug === 'techart' ? 'Choose your model, then refine by generation and fitment.' : 'Choose a marque to explore the parts available for your vehicle.'}</p></header><div className={styles.vehicleLinks}>{vehicles.map(vehicle => <Link key={vehicle} href={filterUrl('/shop', { brand: p.supplier, [vehicleType]: vehicle })}><span>{label(vehicle)}</span><ArrowUpRight size={19}/></Link>)}</div></section>}
    {categories.length > 0 && <section id="departments" className={styles.departments}><div className={styles.sectionHeading}><div><Eyebrow>The collection</Eyebrow><h2>Details that define it.</h2></div><ArrowLink href={shop}>View all parts</ArrowLink></div><div className={styles.categoryGrid}>{categories.map((category, i) => { const items = products.filter(item => categoryOf(item) === category); const image = items.find(item => item.featuredImage)?.featuredImage; return <Link key={category} className={styles.categoryCard} href={filterUrl('/shop', { brand: p.supplier, category })}><div className={styles.categoryImage}>{image && <img src={`${image.url}${image.url.includes('?') ? '&' : '?'}width=700`} alt={image.altText || `${p.name} ${category}`} loading="lazy"/>}<span>{String(i + 1).padStart(2, '0')}</span></div><div><h3>{category}</h3><ArrowUpRight size={20}/></div><p>{items.length} {items.length === 1 ? 'part' : 'parts'}{p.stockOnly ? ' · limited stock' : ''}</p></Link>; })}</div></section>}
    {featured.length > 0 && <section id="selected" className={styles.selected}><div className={styles.sectionHeading}><div><Eyebrow>A closer look</Eyebrow><h2>Explore the range.</h2></div><ArrowLink href={shop}>Shop the collection</ArrowLink></div><div className={styles.productGrid}>{featured.map(item => <Link className="shop-product-card" key={item.id} href={`/products/${item.handle}`}><div className="shop-product-image">{item.featuredImage && <img src={`${item.featuredImage.url}${item.featuredImage.url.includes('?') ? '&' : '?'}width=700`} alt={item.featuredImage.altText || item.title} loading="lazy"/>}<span className="shop-product-arrow"><ArrowUpRight size={18}/></span>{item.tags.includes('condition_used') && <span className="shop-used">Used</span>}</div><div className="shop-card-meta"><span>{p.name}</span><span>{categoryOf(item)}</span></div><h3>{item.title.replace(/^(NOVITEC|TECHART|Valvetronic Designs)\s*[-–]\s*/i, '')}</h3><p className="shop-price">From {money(item.priceRange.minVariantPrice)}</p></Link>)}</div></section>}
    {related.length > 0 && <section className={styles.programmes}><div className={styles.sectionHeading}><div><Eyebrow>The bigger picture</Eyebrow><h2>Beyond a single part.</h2></div></div><div className="programme-grid">{related.map((item, i) => <ProgrammeCard key={item.slug} programme={item} index={i}/>)}</div></section>}
    <section className={styles.support}><div><Eyebrow dark>Luxury Performance / Dubai</Eyebrow><h2>Your car.<br/>Your next chapter.</h2></div><div><p>{p.stockOnly ? 'Need a closer look at one of the kits? Ask us about its condition, included parts and fitment.' : 'From the first component to a complete specification, our team can help with compatibility, product choices and installation.'}</p><ArrowLink href={enquiry} light>Discuss your {p.slug === 'fi-exhaust' ? 'exhaust' : 'specification'}</ArrowLink></div></section>
    <nav className={styles.otherPartners} aria-label="Explore other partners"><span className="tiny-label">Another perspective</span>{partners.filter(item => item.slug !== p.slug && !item.stockOnly).map(item => <Link key={item.slug} href={`/partners/${item.slug}#top`}>{item.name}<ArrowUpRight size={15}/></Link>)}</nav>
  </div>;
}
