import type { Metadata } from 'next';
import { getCatalog } from '@/lib/shop/storefront';
import { suppliers, type Filters } from '@/lib/shop/taxonomy';
import { Catalog } from '@/components/shop/catalog';
type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> };
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{const f=await searchParams;const brand=suppliers.find(b=>b.slug===f.brand);return {title:brand?`${brand.name} Parts`:'Shop Performance Parts',description:brand?.description||'Explore NOVITEC, TECHART, Valvetronic Designs and genuine OEM parts from Luxury Performance, Dubai.',alternates:{canonical:'/shop'},robots:{index:process.env.SHOP_SEO_LIVE==='true'&&!Object.keys(f).length,follow:true}};}
export default async function Shop({searchParams}:Props){const raw=await searchParams;const filters=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])) as Filters;return <Catalog products={await getCatalog()} filters={filters}/>;}
