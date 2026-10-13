import type { MetadataRoute } from 'next';
import { partners } from '@/lib/partners';
import { getCatalog, getCollections } from '@/lib/shop/storefront';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const origin=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3002';const routes=['','/about','/contact','/programmes'];if(process.env.SHOP_SEO_LIVE==='true'){const [products,collections]=await Promise.all([getCatalog(),getCollections()]);routes.push('/partners',...partners.map(p=>`/partners/${p.slug}`),'/shop',...products.map(p=>`/products/${p.handle}`),...collections.map(c=>`/collections/${c.handle}`));}return routes.map(path=>({url:`${origin}${path}`}));}
