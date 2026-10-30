import { permanentRedirect } from 'next/navigation';

const destinations = new Map([
  ['novitec-ferrari', '/partners/novitec'],
  ['novitec-mclaren', '/partners/novitec'],
  ['techart-porsche', '/partners/techart'],
  ['fi-exhaust-lamborghini', '/partners/fi-exhaust'],
]);

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = destinations.get(slug);
  if (!destination) return new Response('Not found', { status: 404 });
  permanentRedirect(destination);
}
