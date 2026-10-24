import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCollection } from '@/lib/shop/storefront';
import type { Filters } from '@/lib/shop/taxonomy';
import { Catalog } from '@/components/shop/catalog';
type Props={params:Promise<{handle:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {handle}=await params;const c=await getCollection(handle);return {title:c?.seo.title||c?.title||'Collection',description:c?.seo.description||c?.description,alternates:{canonical:`/collections/${handle}`},robots:{index:process.env.SHOP_SEO_LIVE==='true',follow:true}};}
export default async function Collection({params,searchParams}:Props){const {handle}=await params;const c=await getCollection(handle);if(!c)notFound();const raw=await searchParams;const f=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])) as Filters;return <Catalog products={c.products} filters={f} title={handle==='lxp-used'?'Used parts':c.title.replace(/^Brand - /,'')} description={handle==='lxp-used'?'Previously owned original parts, available from our stock in Dubai. Review each listing for condition, included components and vehicle compatibility.':c.description} basePath={`/collections/${handle}`}/>;}
