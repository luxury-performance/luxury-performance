/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { partnerForSupplier } from '@/lib/partners';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { CatalogSearch, CatalogFilterPanel, CatalogAppliedFilters, CatalogMobileProvider } from './catalog-mobile-controls';
import type { CatalogProduct } from '@/lib/shop/types';
import { money } from '@/lib/shop/types';
import { isUsedPart, wheelGroupSize, wheelGroupUnit } from '@/lib/shop/used-parts';
import { suppliers, supplierOf, categoryOf, tagsFor, filterProducts, filterUrl, fitOptions, type Filters } from '@/lib/shop/taxonomy';
import { bodyStyles, bodyMatch, filterBodyProducts, is911Fit, isBodyStyle, supportsBody } from '@/lib/shop/techart-fitment';
import { SelectedVehicle } from './vehicle-selector';
import { f8Bodies, f8BodyMatch, isF8Body, isF8Selection } from '@/lib/shop/novitec-f8-fitment';
import vehicleStyles from './vehicle-selector.module.css';
export function Catalog({ products, filters, title, description, basePath = '/shop', productBasePath = '/products', preview = false }: { products: CatalogProduct[]; filters: Filters; title?: string; description?: string; basePath?: string; productBasePath?: string; preview?: boolean }) {
  const inStock = basePath === '/collections/in-stock';
  const selected = suppliers.find(s => s.slug === filters.brand);
  const scope = products.filter(p => !filters.brand || supplierOf(p) === filters.brand);
  const makes = [...new Set(scope.flatMap(p => tagsFor(p, 'make')))].sort();
  const vehicleScope = scope.filter(p => !filters.make || tagsFor(p, 'make').includes(filters.make));
  const models = [...new Set(vehicleScope.flatMap(p => tagsFor(p, 'model')))].sort();
  const fits = fitOptions(scope, filters);
  const vehicleFit = filters.brand === 'techart' && filters.model === '911' && is911Fit(filters.fit) ? filters.fit : undefined;
  const vehicleBody = vehicleFit && isBodyStyle(filters.body) ? filters.body : undefined;
  const f8Selection = isF8Selection(filters);
  const f8Body = f8Selection && isF8Body(filters.body) ? filters.body : undefined;
  const bodies = vehicleFit ? bodyStyles.filter(body => supportsBody(vehicleFit.slice(6), body.key)) : f8Selection ? [...f8Bodies] : [];
  const departmentScope = filterBodyProducts(filterProducts(scope, { ...filters, category: undefined }), vehicleFit, vehicleBody);
  const categories = [...new Set(scope.map(categoryOf))].sort().map(name => ({ name, count: departmentScope.filter(p => categoryOf(p) === name).length }));
  const candidates = filterProducts(products, filters);
  const matches = filterBodyProducts(candidates, vehicleFit, vehicleBody);
  const review = vehicleFit && vehicleBody ? candidates.filter(product => bodyMatch(product, vehicleFit, vehicleBody) === 'review') : f8Body ? filterProducts(products, { ...filters, body: undefined }).filter(product => f8BodyMatch(product, f8Body) === 'review') : [];
  const pages = Math.max(1, Math.ceil(matches.length / 24));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(filters.page)) || 1));
  const shown = matches.slice((page - 1) * 24, page * 24);
  const href = (changes: Filters) => filterUrl(basePath, { ...filters, ...changes });
  return <CatalogMobileProvider><div className="shop-page">
    <div className="shop-topline"><Link href="/">Luxury Performance</Link><span>/</span><Link href={preview ? basePath : "/shop"}>{preview ? "Used parts preview" : "The collection"}</Link>{selected && <><span>/</span><span>{selected.name}</span></>}</div>
    <section className={`shop-intro ${selected || title ? 'shop-intro-small' : ''} ${vehicleFit ? vehicleStyles.catalogIntro : ''}`}>
      <div><span className="tiny-label">The parts. The possibilities.</span><h1>{title || (selected ? selected.name : <><span className="shop-intro-desktop-title">Built around<br />your car.</span><span className="shop-intro-mobile-title">Shop parts</span></>)}</h1></div>
      <div className={`shop-intro-aside ${vehicleFit ? vehicleStyles.catalogVehicle : ''}`}>{vehicleFit ? <SelectedVehicle fit={vehicleFit} body={vehicleBody} /> : <><p>{description || selected?.description || 'Exceptional components from the names that know your car. Find your programme. Make it yours.'}</p><a href="#catalogue">Explore the collection <ArrowRight size={18} /></a>{selected && partnerForSupplier(selected.slug) && <Link href={`/partners/${selected.slug}`}>Discover {selected.name} <ArrowUpRight size={18}/></Link>}</>}</div>
      <CatalogSearch filters={filters} basePath={basePath} />
    </section>
    {!preview && <nav className="supplier-tabs" aria-label="Suppliers"><Link href={inStock ? "/shop" : basePath} aria-current={!inStock && !filters.brand ? 'page' : undefined}>All parts {!inStock && <sup>{products.length}</sup>}</Link><Link href="/collections/in-stock" aria-current={inStock && !filters.brand ? 'page' : undefined}>All in stock {inStock && <sup>{products.length}</sup>}</Link>{suppliers.filter(s=>products.some(p=>supplierOf(p)===s.slug)).map(s=><Link href={`${basePath}?brand=${s.slug}`} aria-current={filters.brand===s.slug?'page':undefined} key={s.slug}>{s.name} <sup>{products.filter(p=>supplierOf(p)===s.slug).length}</sup></Link>)}</nav>}
    <div className="shop-catalogue" id="catalogue">
      <CatalogFilterPanel filters={filters} basePath={basePath} makes={makes} models={models} fits={fits} bodies={bodies} categories={categories} total={departmentScope.length} resultCount={matches.length}><div className="shop-fitment-help"><span className="tiny-label">A considered specification</span><p>Need help choosing the right parts for your car?</p><Link href="/contact">Speak to our team <ArrowUpRight size={14}/></Link></div></CatalogFilterPanel>
      <section className="shop-results" aria-label="Products"><CatalogAppliedFilters filters={filters} basePath={basePath} /><div className="shop-results-head"><p role="status">{matches.length} {matches.length===1?'part':'parts'}{selected?` from ${selected.name}`:''}</p><span className="tiny-label">Selected for the extraordinary</span></div>
        {shown.length ? <div className="shop-product-grid">{shown.map(p=><Link className="shop-product-card" key={p.id} href={`${productBasePath}/${p.handle}`}><div className="shop-product-image">{p.featuredImage?<img src={`${p.featuredImage.url}${p.featuredImage.url.includes('?')?'&':'?'}width=700`} alt={p.featuredImage.altText||p.title} loading="lazy"/>:<span>{p.vendor}</span>}<span className="shop-product-arrow"><ArrowUpRight size={18}/></span>{isUsedPart(p) && <span className="shop-used">Used</span>}</div><div className="shop-card-meta"><span>{p.vendor}</span><span>{categoryOf(p)}</span></div><h3>{p.title.replace(/^TECHART\s*[-–]\s*/i,'')}</h3><p className="shop-price">{preview && Number(p.priceRange.minVariantPrice.amount) === 0 ? 'Price pending' : wheelGroupSize(p) ? `${money(p.priceRange.minVariantPrice)} / ${wheelGroupUnit(wheelGroupSize(p)!)}` : `From ${money(p.priceRange.minVariantPrice)}`}</p></Link>)}</div>:<div className="shop-empty"><h2>No matching parts.</h2><p>Try another vehicle or department, or ask our team about your car.</p><Link href={filterUrl(basePath, { brand: filters.brand })} scroll={false}>Clear filters →</Link></div>}
        {pages>1 && <nav className="shop-pagination" aria-label="Pagination">{page>1?<Link href={href({page:String(page-1)})}>← Previous</Link>:<span/>}<span>Page {page} of {pages}</span>{page<pages?<Link href={href({page:String(page+1)})}>Next →</Link>:<span/>}</nav>}
        {!!review.length && <details className={vehicleStyles.review}><summary>{review.length} more parts need body-style confirmation</summary><p>{f8Body ? 'These listings do not clearly specify a standard F8 version, or are for N-Largo. Confirm compatibility with our team before ordering.' : 'These parts match your generation and trim. Confirm body-style compatibility with our team before ordering.'}</p><ul>{review.map(product => <li key={product.id}><Link href={`/products/${product.handle}`}>{product.title}</Link></li>)}</ul></details>}
      </section>
    </div>
  </div></CatalogMobileProvider>;
}
