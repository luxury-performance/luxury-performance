export type ShopMenuItem = { name: string; href: string; logo?: string; wordmark?: string; logoClass?: string; artwork?: string; note?: string };
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
  { name: 'Ferrari', href: '/shop?make=ferrari', wordmark: 'ferrari.svg', logoClass: 'ferrariWordmark' },
  { name: 'Lamborghini', href: '/shop?make=lamborghini', wordmark: 'lamborghini.svg', logoClass: 'lamborghiniWordmark' },
  { name: 'Porsche', href: '/shop?make=porsche', wordmark: 'porsche.svg', logoClass: 'porscheWordmark' },
  { name: 'McLaren', href: '/shop?make=mclaren', wordmark: 'mclaren.svg', logoClass: 'mclarenWordmark' },
  { name: 'Rolls-Royce', href: '/shop?make=rolls_royce', wordmark: 'rolls-royce.svg', logoClass: 'rollsWordmark' },
  { name: 'Mercedes-Benz', href: '/shop?make=mercedes', wordmark: 'mercedes.svg', logoClass: 'mercedesWordmark' },
  { name: 'BMW', href: '/shop?make=bmw', logo: 'wordmarks/bmw.svg', logoClass: 'bmwMark' },
  { name: 'Audi', href: '/shop?make=audi', wordmark: 'audi.svg', logoClass: 'audiWordmark' },
];

export const limitedStock: ShopMenuItem = { name: 'URBAN Automotive', href: '/partners/urban#top', artwork: 'urban', note: 'Limited stock · 2 kits' };
export type VehicleModels = Record<string, { slug: string; name: string }[]>;
