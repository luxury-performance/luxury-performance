export type ShopMenuItem = { name: string; href: string; logo?: string; logoClass?: string; note?: string };
export const brandMenu: ShopMenuItem[] = [
  { name: 'NOVITEC', href: '/partners/novitec#top', logo: 'novitec.png', logoClass: 'novitec' },
  { name: 'Valvetronic Designs', href: '/partners/valvetronic#top', logo: 'valvetronic-logo.png', logoClass: 'valvetronic' },
  { name: 'TECHART', href: '/partners/techart#top', logo: 'techart.webp', logoClass: 'techart' },
  { name: 'FI Exhaust', href: '/partners/fi-exhaust#top', logo: 'fi-exhaust.jpg', logoClass: 'fi' },
];
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

export const limitedStock: ShopMenuItem = { name: 'URBAN Automotive', href: '/partners/urban#top', logo: 'urban.png', logoClass: 'urban', note: 'Limited stock · 2 kits' };
export type VehicleModels = Record<string, { slug: string; name: string }[]>;
