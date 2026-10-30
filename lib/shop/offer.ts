export type OfferDetails = {
  productTitle: string;
  sku: string | null;
  configuration: string;
  quantity: number;
  setSize?: number;
  listedPrice: string;
  currency: string;
  amount: string;
  name?: string;
  note?: string;
};

export function offerAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{1,8}(?:\.\d{0,2})?$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : null;
}

export function buildOfferMessage(details: OfferDetails): string | null {
  const amount = offerAmount(details.amount);
  if (!amount || !Number.isInteger(details.quantity) || details.quantity < 1 || details.quantity > 99) return null;
  const groupName = details.setSize === 2 ? 'pair' : details.setSize === 3 ? 'lot' : 'set';
  const quantity = details.setSize
    ? details.quantity + ' ' + groupName + (details.quantity === 1 ? '' : 's') + ' (' + details.setSize * details.quantity + ' wheels total)'
    : details.quantity + ' ' + (details.quantity === 1 ? 'unit' : 'units');
  const listed = Number(details.listedPrice) * details.quantity;
  return [
    'Hello Luxury Performance, I would like to make an offer.',
    details.name?.trim() ? 'Name: ' + details.name.trim() : '',
    'Product: ' + details.productTitle,
    details.configuration !== 'Default Title' ? 'Option: ' + details.configuration : '',
    details.sku ? 'SKU: ' + details.sku : '',
    'Quantity: ' + quantity,
    listed > 0 ? 'Listed total: ' + details.currency + ' ' + listed.toFixed(2) : '',
    'My offer: ' + details.currency + ' ' + amount + ' total for the above.',
    details.note?.trim() ? 'Message: ' + details.note.trim() : '',
    'Please let me know if you can accept this offer.'
  ].filter(Boolean).join('\n\n');
}

