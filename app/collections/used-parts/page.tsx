import type { Metadata } from 'next';
import { Catalog } from '@/components/shop/catalog';
import { getCatalog } from '@/lib/shop/storefront';
import { isUsedPart } from '@/lib/shop/used-parts';
import { catalogSeo } from '@/lib/shop/catalog-seo';
import type { Filters } from '@/lib/shop/taxonomy';
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const products = (await getCatalog()).filter(isUsedPart);
  const { page, ...seo } = catalogSeo('/collections/used-parts', await searchParams, products, process.env.SHOP_SEO_LIVE === 'true');
  return { title: page > 1 ? `Used parts — Page ${page}` : 'Used parts', description: 'Pre-owned wheels and parts from our stock in Dubai. View photos, prices and make an offer.', ...seo };
}
export default async function UsedParts({ searchParams }: Props) {
  const query = await searchParams;
  const filters = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])) as Filters;
  return <Catalog products={(await getCatalog()).filter(isUsedPart)} filters={filters} title="Pre-owned parts." description="Wheels, exhausts, bodywork and more from our stock in Dubai. View the photographs, included parts and prices—or make us an offer." basePath="/collections/used-parts" />;
}
