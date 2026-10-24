/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type { CatalogProduct } from '@/lib/shop/types';
import { isBodyStyle, vehicleImage, vehicleName, vehicleOptions } from '@/lib/shop/techart-fitment';
import { VehiclePicker } from './vehicle-picker';
import styles from './vehicle-selector.module.css';

export function VehicleSelector({ products, fit, shopPath = '/shop' }: { products: CatalogProduct[]; fit?: string; shopPath?: string }) {
  return <VehiclePicker options={vehicleOptions(products)} initialFit={fit} shopPath={shopPath} />;
}

export function SelectedVehicle({ fit, body }: { fit: string; body?: string }) {
  const style = isBodyStyle(body) ? body : undefined;
  const query = new URLSearchParams({ fit, ...(style ? { body: style } : {}) });
  return <div className={styles.selected}>
    <img src={vehicleImage(fit, style)} alt="" width={500} height={180} />
    <p>{vehicleName(fit, style)}</p>
    <Link className={styles.change} href={`/partners/techart?${query}#vehicles`}>Change car</Link>
  </div>;
}
