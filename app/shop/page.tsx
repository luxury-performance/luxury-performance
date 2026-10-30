import type { Metadata } from 'next';
import { getCatalog } from '@/lib/shop/storefront';
import { suppliers, type Filters } from '@/lib/shop/taxonomy';
import { Catalog } from '@/components/shop/catalog';
import { catalogSeo } from '@/lib/shop/catalog-seo';
type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [filters, products] = await Promise.all([searchParams, getCatalog()]);
  const brandValue = Array.isArray(filters.brand) ? filters.brand[0] : filters.brand;
  const brand = suppliers.find(item => item.slug === brandValue);
  const { page, ...seo } = catalogSeo('/shop', filters, products, process.env.SHOP_SEO_LIVE === 'true');
  const title = brand ? `${brand.name} Parts` : 'Shop Performance Parts';
  return { title: page > 1 ? `${title} — Page ${page}` : title, description: brand?.description || 'Explore NOVITEC, TECHART, Valvetronic Designs and genuine OEM parts from Luxury Performance, Dubai.', ...seo };
}
export default async function Shop({searchParams}:Props){const raw=await searchParams;const filters=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])) as Filters;return <Catalog products={await getCatalog()} filters={filters}/>;}
