import type { CatalogProduct } from './types';
export const suppliers = [
  { slug: 'novitec', name: 'NOVITEC', image: 'ferrari', line: 'Individuality, without compromise.', description: 'Explore by vehicle, then discover the exhaust, aerodynamic, wheel and suspension programme.', categories: ['Aerodynamics', 'Exhaust', 'Wheels', 'Suspension', 'Performance'] },
  { slug: 'techart', name: 'TECHART', image: 'porsche', line: 'Your Porsche. Your signature.', description: 'Start with your Porsche model and exact fitment group. Build a specification across exterior, interior and performance.', categories: ['Aerodynamics', 'Wheels', 'Exhaust', 'Suspension', 'Performance', 'Interior', 'Accessories'] },
  { slug: 'valvetronic', name: 'Valvetronic Designs', image: 'lamborghini', line: 'A voice of its own.', description: 'Find your vehicle, then explore valved systems, downpipes and exhaust components.', categories: ['Valved exhaust systems', 'Downpipes', 'Front pipes', 'Exhaust components'] },
  { slug: 'urban', name: 'URBAN Automotive', image: 'wheel', line: 'Distinctive details.', description: 'Selected used URBAN components, limited to the stock available.', categories: ['Wheels', 'Aerodynamics', 'Accessories', 'Other parts'] },
  { slug: 'oem', name: 'Genuine OEM', image: 'sf90', line: 'Original engineering.', description: 'Selected original components. Review the individual listing for condition, included parts and vehicle compatibility.', categories: ['Exhaust', 'Aerodynamics', 'Performance', 'Other parts'] },
  { slug: 'collectibles', name: 'Collectibles', image: 'mclaren', line: 'Performance, in another form.', description: 'Scale models and automotive pieces for your collection.', categories: ['Collectibles'] },
];
export function supplierOf(p: CatalogProduct) {
  const v = p.vendor.toLowerCase();
  if (v.includes('novitec')) return 'novitec'; if (v.includes('techart')) return 'techart'; if (v.includes('valvetronic')) return 'valvetronic';
  if (v.includes('urban')) return 'urban';
  if (v.includes('collectible')) return 'collectibles'; return 'oem';
}
const exact: Record<string, string> = { bmw: 'BMW', amg: 'AMG', mclaren: 'McLaren', rolls_royce: 'Rolls-Royce', mercedes: 'Mercedes-Benz', mercedes_benz: 'Mercedes-Benz', porsche: 'Porsche', audi: 'Audi', f12: 'F12', f8: 'F8', sf90: 'SF90', '812_gts': '812 GTS', '812_superfast': '812 Superfast', '12cilindri': '12Cilindri', '911': '911', gt3: 'GT3', g63: 'G63', m3: 'M3', m4: 'M4', m5: 'M5', x5: 'X5', x6: 'X6' };
export function label(value: string) { return exact[value] || value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
export function tagsFor(p: CatalogProduct, type: 'make' | 'model' | 'fit') {
  const prefixes = type === 'make' ? ['car_make_', 'make_', 'car_'] : type === 'model' ? ['car_model_', 'model_'] : ['fit_'];
  const result = p.tags.flatMap(t => { const prefix = prefixes.find(pre => t.startsWith(pre)); return prefix ? [t.slice(prefix.length)] : []; });
  const junk = /^(model_|make_|sports$|waitlist$|exclusivecarbon$|muffler$|nsactive$|standar$|tecnic$|technica$|sports$|truck$|v8$|vtec$|n55$|fa20$|lp$|vw$)/;
  return [...new Set(result.filter(v => !junk.test(v)))];
}
export function fitLabel(v: string) { return label(v.replace(/^(99[12]|e3)_([12])(?=_|$)/, '$1.$2')).replace(/Turbo S/gi, 'Turbo S').replace(/Gt3/gi, 'GT3').replace(/Gts/gi, 'GTS'); }
export function categoryOf(p: CatalogProduct) {
  const type = p.productType.toLowerCase(), tags = p.tags.join(' '), title = p.title.toLowerCase();
  if (supplierOf(p) === 'collectibles') return 'Collectibles';
  if (supplierOf(p) === 'valvetronic') {
    const name = title.replace(/[–—-]/g, ' ');
    // Accessories can mention an exhaust system without being a system themselves.
    if (/\b(?:replacement|controller|control box|control kit|harness|antenna|exhaust tips|valve motors?)\b/.test(name)) return 'Exhaust components';
    if (/\bdown\s*pipes?\b/.test(name)) return 'Downpipes';
    if (/\bfront pipes?\b/.test(name) && !/\bexhaust system\b/.test(name)) return 'Front pipes';
    // Some genuine system names end at “Valved Sport Exhaust”, including the E46 M3.
    if (/\b(?:valved (?:sport |axleback )?exhaust|exhaust (?:system|package))\b/.test(name)) return 'Valved exhaust systems';
    return 'Exhaust components';
  }
  if (/category_(aero|aerodynamic)/.test(tags) || /aero|spoiler|bumper|splitter|diffuser/.test(type)) return 'Aerodynamics';
  if (/category_exhaust/.test(tags) || /exhaust/.test(type)) return 'Exhaust';
  if (/category_wheels/.test(tags) || /wheel/.test(type)) return 'Wheels';
  if (/category_suspension/.test(tags) || /suspension|spring|lift/.test(type)) return 'Suspension';
  if (/category_interior/.test(tags) || /interior|seat|door sill/.test(type)) return 'Interior';
  if (/category_(performance|engine)/.test(tags) || /performance|turbo|engine/.test(type)) return 'Performance';
  return /accessor/.test(type) ? 'Accessories' : 'Other parts';
}
export type Filters = { brand?: string; make?: string; model?: string; fit?: string; body?: string; category?: string; q?: string; sort?: string; page?: string };
export function filterProducts(products: CatalogProduct[], f: Filters) {
  const result = products.filter(p => (!f.brand || supplierOf(p) === f.brand) && (!f.make || tagsFor(p, 'make').includes(f.make)) && (!f.model || tagsFor(p, 'model').includes(f.model)) && (!f.fit || tagsFor(p, 'fit').includes(f.fit)) && (!f.category || categoryOf(p) === f.category) && (!f.q || `${p.title} ${p.vendor} ${p.productType}`.toLowerCase().includes(f.q.toLowerCase())));
  if (f.sort === 'price-up') result.sort((a,b) => Number(a.priceRange.minVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount));
  if (f.sort === 'price-down') result.sort((a,b) => Number(b.priceRange.minVariantPrice.amount) - Number(a.priceRange.minVariantPrice.amount));
  if (f.sort === 'name') result.sort((a,b) => a.title.localeCompare(b.title));
  return result;
}

// Vehicle selections form a hierarchy; never carry a previous car's fitment forward.
export function updateFilters(current: Filters, changes: Partial<Filters>): Filters {
  const next = { ...current, ...changes, page: undefined };
  if ('brand' in changes) return { brand: changes.brand };
  if ('make' in changes) { next.model = undefined; next.fit = undefined; next.body = undefined; }
  if ('model' in changes) { next.fit = undefined; next.body = undefined; }
  if ('fit' in changes) next.body = undefined;
  return next;
}
export function filterUrl(basePath: string, filters: Filters) {
  const params = new URLSearchParams();
  for (const key of ['brand', 'make', 'model', 'fit', 'body', 'category', 'q', 'sort', 'page'] as const) {
    const value = filters[key]?.trim();
    if (value) params.set(key, value);
  }
  return params.size ? `${basePath}?${params}` : basePath;
}

export function fitOptions(products: CatalogProduct[], filters: Filters) {
  const scope = filterProducts(products, { brand: filters.brand, make: filters.make, model: filters.model });
  // Shared parts can have tags for both Porsche families. Only show the chosen family's generations.
  const family = filters.brand === 'techart'
    ? filters.model === 'cayenne' ? /^e3_/ : filters.model === '911' ? /^99[12]_/ : null
    : null;
  return [...new Set(scope.flatMap(p => tagsFor(p, 'fit')))].filter(fit => !family || family.test(fit)).sort();
}
