import { getCatalog } from '@/lib/shop/storefront';
import { label, tagsFor } from '@/lib/shop/taxonomy';
import { vehicleMenu } from '@/lib/shop-navigation';
export async function GET() {
  try {
    const products = await getCatalog();
    const models = Object.fromEntries(vehicleMenu.map(item => {
      const make = new URLSearchParams(item.href.split('?')[1]).get('make')!;
      const scope = products.filter(product => tagsFor(product, 'make').includes(make));
      return [make, [...new Set(scope.flatMap(product => tagsFor(product, 'model')))].sort().map(slug => ({ slug, name: label(slug).replace(/\bGt(\d+)rs\b/gi, 'GT$1 RS').replace(/\bGt(\d+)\b/gi, 'GT$1').replace(/\bGts\b/gi, 'GTS') }))];
    }));
    return Response.json(models, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } });
  } catch {
    return Response.json({ error: 'Could not load vehicle models' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
