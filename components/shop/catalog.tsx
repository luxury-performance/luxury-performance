/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { partnerForSupplier } from '@/lib/partners';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { CatalogFilters } from './catalog-filters';
import type { CatalogProduct } from '@/lib/shop/types';
import { money } from '@/lib/shop/types';
import { suppliers, supplierOf, categoryOf, tagsFor, filterProducts, filterUrl, fitOptions, type Filters } from '@/lib/shop/taxonomy';
export function Catalog({ products, filters, title, description, basePath = '/shop' }: { products: CatalogProduct[]; filters: Filters; title?: string; description?: string; basePath?: string }) {
  const selected = suppliers.find(s => s.slug === filters.brand);
  const scope = products.filter(p => !filters.brand || supplierOf(p) === filters.brand);
  const makes = [...new Set(scope.flatMap(p => tagsFor(p, 'make')))].sort();
  const vehicleScope = scope.filter(p => !filters.make || tagsFor(p, 'make').includes(filters.make));
  const models = [...new Set(vehicleScope.flatMap(p => tagsFor(p, 'model')))].sort();
  const fits = fitOptions(scope, filters);
  const departmentScope = filterProducts(scope, { ...filters, category: undefined });
  const categories = [...new Set(scope.map(categoryOf))].sort().map(name => ({ name, count: departmentScope.filter(p => categoryOf(p) === name).length }));
  const matches = filterProducts(products, filters);
  const pages = Math.max(1, Math.ceil(matches.length / 24));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(filters.page)) || 1));
  const shown = matches.slice((page - 1) * 24, page * 24);
  const href = (changes: Filters) => filterUrl(basePath, { ...filters, ...changes });
  return <div className="shop-page">
    <div className="shop-topline"><Link href="/">Luxury Performance</Link><span>/</span><Link href="/shop">The collection</Link>{selected && <><span>/</span><span>{selected.name}</span></>}</div>
    <section className={`shop-intro ${selected || title ? 'shop-intro-small' : ''}`}>
      <div><span className="tiny-label">The parts. The possibilities.</span><h1>{title || (selected ? selected.name : <>Built around<br />your car.</>)}</h1></div>
      <div className="shop-intro-aside"><p>{description || selected?.description || 'Exceptional components from the names that know your car. Find your programme. Make it yours.'}</p><a href="#catalogue">Explore the collection <ArrowRight size={18} /></a>{selected && partnerForSupplier(selected.slug) && <Link href={`/partners/${selected.slug}`}>Discover {selected.name} <ArrowUpRight size={18}/></Link>}</div>
    </section>
    {!selected && !title && <section className="supplier-grid" aria-label="Shop by supplier">{suppliers.slice(0,3).map((s,i) => <Link className="supplier-card" key={s.slug} href={`/partners/${s.slug}`}><img src={`/images/${s.image}.webp`} alt="" /><div className="supplier-card-shade" /><span className="supplier-index">0{i+1} / THE PROGRAMMES</span><div className="supplier-caption"><div><h2>{s.name}</h2><p>{s.line}</p></div><ArrowUpRight /></div></Link>)}</section>}
    <nav className="supplier-tabs" aria-label="Suppliers"><Link href={basePath} aria-current={!filters.brand ? 'page' : undefined}>All parts <sup>{products.length}</sup></Link>{suppliers.filter(s=>products.some(p=>supplierOf(p)===s.slug)).map(s=><Link href={`${basePath}?brand=${s.slug}`} aria-current={filters.brand===s.slug?'page':undefined} key={s.slug}>{s.name} <sup>{products.filter(p=>supplierOf(p)===s.slug).length}</sup></Link>)}</nav>
    <div className="shop-catalogue" id="catalogue">
      <aside className="shop-filter-panel"><CatalogFilters filters={filters} basePath={basePath} makes={makes} models={models} fits={fits} categories={categories} total={departmentScope.length} /><div className="shop-fitment-help"><span className="tiny-label">A considered specification</span><p>Need help choosing the right parts for your car?</p><Link href="/contact">Speak to our team <ArrowUpRight size={14}/></Link></div></aside>
      <section className="shop-results" aria-label="Products"><div className="shop-results-head"><p role="status">{matches.length} {matches.length===1?'part':'parts'}{selected?` from ${selected.name}`:''}</p><span className="tiny-label">Selected for the extraordinary</span></div>
        {shown.length ? <div className="shop-product-grid">{shown.map(p=><Link className="shop-product-card" key={p.id} href={`/products/${p.handle}`}><div className="shop-product-image">{p.featuredImage?<img src={`${p.featuredImage.url}${p.featuredImage.url.includes('?')?'&':'?'}width=700`} alt={p.featuredImage.altText||p.title} loading="lazy"/>:<span>{p.vendor}</span>}<span className="shop-product-arrow"><ArrowUpRight size={18}/></span>{p.tags.includes('condition_used') && <span className="shop-used">Used</span>}</div><div className="shop-card-meta"><span>{p.vendor}</span><span>{categoryOf(p)}</span></div><h3>{p.title.replace(/^(NOVITEC|TECHART|Valvetronic Designs)\s*[-–]\s*/i,'')}</h3><p className="shop-price">From {money(p.priceRange.minVariantPrice)}</p></Link>)}</div>:<div className="shop-empty"><h2>No matching parts.</h2><p>Try another vehicle or department, or ask our team about your car.</p><Link href={filterUrl(basePath, { brand: filters.brand })} scroll={false}>Clear filters →</Link></div>}
        {pages>1 && <nav className="shop-pagination" aria-label="Pagination">{page>1?<Link href={href({page:String(page-1)})}>← Previous</Link>:<span/>}<span>Page {page} of {pages}</span>{page<pages?<Link href={href({page:String(page+1)})}>Next →</Link>:<span/>}</nav>}
      </section>
    </div>
  </div>;
}
