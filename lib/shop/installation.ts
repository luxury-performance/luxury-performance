import type { Product, Variant, CartLine } from './types';

export const installationHandles = [
  'catback-installation-service', 'catback-free-flow-installation-service',
  'catback-catted-downpipes-installation-service', 'midpipe-installation-service',
  'axleback-rear-section-installation-service', 'exhaust-headers-installation-service',
  'exhaust-front-test-pipes-headers-installation-service', 'rear-section-over-axle-pipes-installation-service',
];
// Keep the existing Shopify theme's configuration mapping in sync.
export function installationHandle(product: Pick<Product, 'title' | 'tags'>, variant: Pick<Variant, 'selectedOptions'>) {
  const title = product.title.toLowerCase();
  if (!product.tags.includes('brand_valvetronic') || !product.tags.includes('category_exhaust') || /universal|muffler kit|motorcycle|controller|replacement|harness|adapter|exhaust tips|simulator|brace|valve motors|control wire/.test(title)) return null;
  let configuration = '', headers = false;
  for (const option of variant.selectedOptions) {
    const value = option.value.toLowerCase().replaceAll('free flow', 'free-flow').replaceAll('over axle', 'over-axle');
    if (['configuration', 'system type', 'system design'].includes(option.name.toLowerCase())) configuration = value;
    if (value.includes('headers') && !value.includes('without headers')) headers = true;
  }
  configuration ||= title;
  if (headers) return /front pipes|test pipes/.test(configuration) ? installationHandles[6] : installationHandles[5];
  if (configuration.includes('over-axle')) return installationHandles[7];
  if (configuration.includes('pipes only')) return null;
  if (configuration.includes('midpipe') && /axleback|catback/.test(configuration)) return /catted|cats/.test(configuration) ? installationHandles[2] : installationHandles[1];
  if (configuration.includes('midpipe')) return installationHandles[3];
  if (/catted|catalytic converters|euro 6 cats/.test(configuration)) return installationHandles[2];
  if (configuration.includes('free-flow')) return installationHandles[1];
  if (/axleback|rear section/.test(configuration)) return installationHandles[4];
  return installationHandles[0];
}
export function installationFor(line: CartLine) { return line.attributes.find(a => a.key === '_installation_for')?.value; }
export function installationGroup(line: CartLine) { return line.attributes.find(a => a.key === '_lxp_installation_group')?.value || line.id; }
export function parentQuantity(lines: CartLine[], group: string) { return lines.filter(l => !installationFor(l) && installationGroup(l) === group).reduce((sum, l) => sum + l.quantity, 0); }
export function linkedInstallationUpdates(lines: CartLine[], parent: CartLine, quantity: number) {
  if (installationFor(parent)) return [];
  const group = installationGroup(parent);
  const remaining = parentQuantity(lines, group) - parent.quantity + quantity;
  return lines.filter(l => installationFor(l) === group).map(l => ({ id: l.id, quantity: remaining }));
}
