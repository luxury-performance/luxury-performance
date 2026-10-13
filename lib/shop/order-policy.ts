export function allocateOrder(stock: number, quantity: number, inCart: number) {
  const stocked = Math.min(quantity, Math.max(0, stock - inCart));
  return { stock, inCart, stocked, special: quantity - stocked };
}
export function isSpecial(attributes: { key: string; value: string }[]) {
  return attributes.some(a=>a.key==='_lxp_fulfillment'&&a.value==='special_order');
}
