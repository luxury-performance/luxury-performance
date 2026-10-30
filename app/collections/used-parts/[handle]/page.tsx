import { notFound, permanentRedirect } from 'next/navigation';
import { getCatalog } from '@/lib/shop/storefront';
export default async function LegacyUsedProduct({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = (await getCatalog()).find(p => p.handle === handle || p.id.split('/').pop() === handle);
  if (!product) notFound();
  permanentRedirect('/products/' + product.handle);
}
