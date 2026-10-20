import bodyFitment from './techart-body-fitment.json';
import type { CatalogProduct } from './types';

export const bodyStyles = [{ key: 'coupe', name: 'Coupé' }, { key: 'cabriolet', name: 'Cabriolet' }, { key: 'targa', name: 'Targa' }] as const;
export type BodyStyle = typeof bodyStyles[number]['key'];
export const generations = ['991.1', '991.2', '992.1', '992.2'];
export const vehicleNames: Record<string, string> = {
  carrera: 'Carrera', carrera_4: 'Carrera 4', carrera_t: 'Carrera T', carrera_s: 'Carrera S', carrera_4s: 'Carrera 4S', carrera_gts: 'Carrera GTS',
  carrera_4_gts: 'Carrera 4 GTS', carrera_targa_gts: 'Targa GTS', turbo: 'Turbo', turbo_s: 'Turbo S', gt3_gt3_touring: 'GT3 / GT3 Touring',
  gt3_with_wing: 'GT3 with rear wing', gt3_rs: 'GT3 RS', gt3_rs_st: 'GT3 RS / 911 S/T', dakar: 'Dakar',
};
const families = [
  { key: 'carrera', name: 'Carrera', trims: ['carrera', 'carrera_4', 'carrera_t', 'carrera_s', 'carrera_4s'] },
  { key: 'gts', name: 'GTS', trims: ['carrera_gts', 'carrera_4_gts', 'carrera_targa_gts'] },
  { key: 'turbo', name: 'Turbo / Turbo S', trims: ['turbo', 'turbo_s'] },
  { key: 'gt3', name: 'GT3 / GT3 Touring', trims: ['gt3_gt3_touring', 'gt3_with_wing'] },
  { key: 'gt3-rs', name: 'GT3 RS / S/T', trims: ['gt3_rs', 'gt3_rs_st'] },
  { key: 'dakar', name: 'Dakar', trims: ['dakar'] },
];
type BodyRecord = { allowed: string[]; excluded: string[] };
const records: Record<string, Record<string, BodyRecord>> = bodyFitment;

export function isBodyStyle(value?: string): value is BodyStyle { return bodyStyles.some(body => body.key === value); }
export function is911Fit(fit?: string): fit is string { return !!fit && /^99[12]_[12]_/.test(fit) && !!vehicleNames[fit.slice(6)]; }
export function supportsBody(trim: string, body: BodyStyle) {
  if (/^gt3|^dakar$/.test(trim)) return body === 'coupe';
  if (trim === 'carrera_targa_gts') return body === 'targa';
  return body !== 'targa' || ['carrera_4', 'carrera_4s', 'carrera_4_gts'].includes(trim);
}
export function bodyMatch(product: Pick<CatalogProduct, 'handle'>, fit: string, body: BodyStyle) {
  const record = records[product.handle]?.[`fit_${fit}`];
  return record?.allowed.includes(body) ? 'allowed' : record?.excluded.includes(body) ? 'excluded' : 'review';
}
export function filterBodyProducts<T extends Pick<CatalogProduct, 'handle'>>(products: T[], fit?: string, body?: string): T[] {
  return is911Fit(fit) && isBodyStyle(body) ? products.filter(product => bodyMatch(product, fit, body) === 'allowed') : products;
}
export function vehicleImage(fit: string, body: BodyStyle = 'coupe') {
  const trim = fit.slice(6);
  const family = /^turbo/.test(trim) ? 'turbo' : /^gt3/.test(trim) ? 'gt3' : /gts/.test(trim) ? 'gts' : 'carrera';
  const image = body === 'coupe' ? family : `${family === 'turbo' ? 'turbo' : family === 'gts' ? 'gts' : 'carrera'}-${body}`;
  return `/vehicle-selector/vehicle-selector-${image}.png`;
}
export function vehicleName(fit: string, body?: BodyStyle) {
  return `911 ${fit.slice(0, 5).replace('_', '.')} ${vehicleNames[fit.slice(6)] || ''}${body ? ` · ${bodyStyles.find(item => item.key === body)!.name}` : ''}`.trim();
}
export type VehicleChoice = { fit: string; name: string; count: number };
export type VehicleBody = { key: BodyStyle; name: string; choices: VehicleChoice[] };
export type VehicleFamily = { key: string; name: string; bodies: VehicleBody[] };
export type VehicleGeneration = { name: string; families: VehicleFamily[] };

export function vehicleOptions(products: Pick<CatalogProduct, 'handle' | 'tags'>[]): VehicleGeneration[] {
  return generations.map(generation => {
    const prefix = `${generation.replace('.', '_')}_`;
    return { name: generation, families: families.flatMap(family => {
      const trims = family.trims.map(trim => ({ trim, fit: prefix + trim, products: products.filter(product => product.tags.includes(`fit_${prefix}${trim}`)) })).filter(item => item.products.length);
      if (!trims.length) return [];
      return [{ key: family.key, name: family.name, bodies: bodyStyles.flatMap(body => {
        const choices = trims.filter(item => supportsBody(item.trim, body.key)).map(item => ({ fit: item.fit, name: vehicleNames[item.trim], count: item.products.filter(product => bodyMatch(product, item.fit, body.key) === 'allowed').length }));
        return choices.length ? [{ ...body, choices }] : [];
      }) }];
    }) };
  });
}
