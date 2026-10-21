export type ShopMenuItem = { name: string; href: string; logo?: string; logoClass?: string; artwork?: string; note?: string };
export const brandMenu: ShopMenuItem[] = [
  { name: 'NOVITEC', href: '/partners/novitec#top', artwork: 'novitec' },
  { name: 'Valvetronic Designs', href: '/partners/valvetronic#top', artwork: 'valvetronic' },
  { name: 'TECHART', href: '/partners/techart#top', artwork: 'techart' },
  { name: 'FI Exhaust', href: '/partners/fi-exhaust#top', artwork: 'fi-exhaust' },
  { name: 'Gintani', href: '/contact?programme=Gintani', artwork: 'gintani' },
  { name: 'Liberty Walk', href: '/contact?programme=Liberty%20Walk', artwork: 'liberty-walk' },
  { name: 'Voltrix', href: '/contact?programme=Voltrix', artwork: 'voltrix' },
];
export const usedParts: ShopMenuItem = { name: 'Used parts', href: '/collections/lxp-used', artwork: 'lxp', note: 'Previously owned components' };
export const vehicleMenu: ShopMenuItem[] = [
  { name: 'Ferrari', href: '/shop?make=ferrari', logo: 'ferrari.png', logoClass: 'ferrari' },
  { name: 'Lamborghini', href: '/shop?make=lamborghini', logo: 'lamborghini.png', logoClass: 'lamborghini' },
  { name: 'Porsche', href: '/shop?make=porsche', logo: 'porsche.png' },
  { name: 'McLaren', href: '/shop?make=mclaren', logo: 'mclaren.png', logoClass: 'mclaren' },
  { name: 'Rolls-Royce', href: '/shop?make=rolls_royce', logo: 'rolls-royce.png', logoClass: 'rolls' },
  { name: 'Mercedes-Benz', href: '/shop?make=mercedes', logo: 'mercedes.png' },
  { name: 'BMW', href: '/shop?make=bmw', logo: 'bmw.png', logoClass: 'bmw' },
  { name: 'Audi', href: '/shop?make=audi', logo: 'audi.svg' },
];

export const limitedStock: ShopMenuItem = { name: 'URBAN Automotive', href: '/partners/urban#top', artwork: 'urban', note: 'Limited stock · 2 kits' };
export type VehicleModels = Record<string, { slug: string; name: string }[]>;
