import 'server-only';
import { getProduct } from './storefront';
import { installationHandle, installationHandles, installationFor, installationGroup, parentQuantity } from './installation';
import type { Product, Variant, InstallationService, Cart } from './types';

export async function getInstallation(product: Product, variant: Variant, fresh = false): Promise<InstallationService | null> {
  const handle = installationHandle(product, variant);
  if (!handle) return null;
  const service = await getProduct(handle, fresh);
  const option = service?.variants.nodes.find(v => v.availableForSale && !v.requiresShipping);
  return service && option ? { handle, title: service.title, variantId: option.id, price: option.price } : null;
}
export async function productInstallations(product: Product) {
  const handles = [...new Set(product.variants.nodes.map(v => installationHandle(product, v)).filter(Boolean))];
  const services = await Promise.all(handles.map(handle => getInstallation(product, product.variants.nodes.find(v => installationHandle(product, v) === handle)!)));
  return Object.fromEntries(product.variants.nodes.flatMap(v => {
    const service = services.find(s => s?.handle === installationHandle(product, v));
    return service ? [[v.id, service]] : [];
  }));
}
export async function cartWithInstallations(cart: Cart | null) {
  if (!cart) return null;
  const seen = new Set<string>();
  const nodes = await Promise.all(cart.lines.nodes.map(async line => {
    const group = installationGroup(line);
    if (installationFor(line) || installationHandles.includes(line.merchandise.product.handle) || seen.has(group)) return line;
    seen.add(group);
    const product = await getProduct(line.merchandise.product.handle);
    const variant = product?.variants.nodes.find(v => v.id === line.merchandise.id);
    const service = product && variant ? await getInstallation(product, variant) : null;
    return service ? { ...line, installation: { ...service, quantity: parentQuantity(cart.lines.nodes, group), included: cart.lines.nodes.some(l => installationFor(l) === group) } } : line;
  }));
  return { ...cart, lines: { ...cart.lines, nodes } };
}
