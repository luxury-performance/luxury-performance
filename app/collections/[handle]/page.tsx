import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCollection } from '@/lib/shop/storefront';
import type { Filters } from '@/lib/shop/taxonomy';
import { Catalog } from '@/components/shop/catalog';
import { catalogSeo } from '@/lib/shop/catalog-seo';
type Props={params:Promise<{handle:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { handle } = await params;
  const [collection, filters] = await Promise.all([getCollection(handle), searchParams]);
  if (!collection) notFound();
  const products = handle === 'in-stock' ? collection.products.filter(product => product.availableForSale) : collection.products;
  const { page, ...seo } = catalogSeo(`/collections/${handle}`, filters, products, process.env.SHOP_SEO_LIVE === 'true');
  const title = collection.seo.title || collection.title;
  return { title: page > 1 ? `${title} — Page ${page}` : title, description: collection.seo.description || collection.description, ...seo };
}
export default async function Collection({params,searchParams}:Props){const {handle}=await params;const c=await getCollection(handle);if(!c)notFound();const raw=await searchParams;const f=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])) as Filters;return <Catalog products={handle==='in-stock'?c.products.filter(product=>product.availableForSale):c.products} filters={f} title={handle==='in-stock'?'All in stock':handle==='lxp-used'?'Used parts':c.title.replace(/^Brand - /,'')} description={handle==='in-stock'?'Available from our stock in Dubai. Find your next upgrade across the collection.':handle==='lxp-used'?'Previously owned original parts, available from our stock in Dubai. Review each listing for condition, included components and vehicle compatibility.':c.description} basePath={`/collections/${handle}`}/>;}
