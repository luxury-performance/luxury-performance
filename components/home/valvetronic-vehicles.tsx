import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import styles from './valvetronic-vehicles.module.css';
import { ValvetronicFeatureFilm } from './valvetronic-feature-film';

type VehicleBrand = { name: string; mark: string; logo: string; make?: string; search?: string; monochrome?: boolean };

// Available vehicle ranges checked against LXP Forged's Valvetronic collection.
// Title searches also cover the three ranges whose products lack make tags.
const vehicles: readonly VehicleBrand[] = [
  { name: 'Ferrari', mark: 'ferrari', logo: '/brand/navigation/wordmarks/ferrari.svg', make: 'ferrari', monochrome: true },
  { name: 'Lamborghini', mark: 'lamborghini', logo: '/brand/navigation/wordmarks/lamborghini.svg', make: 'lamborghini', monochrome: true },
  { name: 'Porsche', mark: 'porsche', logo: '/brand/navigation/wordmarks/porsche.svg', make: 'porsche', monochrome: true },
  { name: 'BMW', mark: 'bmw', logo: '/brand/navigation/wordmarks/bmw.svg', make: 'bmw' },
  { name: 'Mercedes-AMG', mark: 'mercedes-amg', logo: '/brand/valvetronic-vehicles/mercedes-amg-clean.svg', make: 'mercedes' },
  { name: 'McLaren', mark: 'mclaren', logo: '/brand/navigation/wordmarks/mclaren.svg', make: 'mclaren' },
  { name: 'Audi', mark: 'audi', logo: '/brand/navigation/wordmarks/audi.svg', make: 'audi', monochrome: true },
  { name: 'Maserati', mark: 'maserati', logo: '/brand/valvetronic-vehicles/maserati-clean.svg', make: 'maserati' },
  { name: 'Aston Martin', mark: 'aston-martin', logo: '/brand/valvetronic-vehicles/aston-martin-clean.svg', make: 'aston_martin' },
  { name: 'Lotus', mark: 'lotus', logo: '/brand/valvetronic-vehicles/lotus-clean.svg', search: 'Lotus' },
  { name: 'Nissan', mark: 'nissan', logo: '/brand/valvetronic-vehicles/nissan-clean.svg', make: 'nissan' },
  { name: 'Chevrolet Corvette', mark: 'chevrolet-corvette', logo: '/brand/valvetronic-vehicles/chevrolet-corvette-clean.png', make: 'chevrolet' },
  { name: 'Toyota', mark: 'toyota', logo: '/brand/valvetronic-vehicles/toyota-clean.svg', make: 'toyota' },
  { name: 'Ford', mark: 'ford', logo: '/brand/valvetronic-vehicles/ford-clean.svg', make: 'ford' },
  { name: 'Dodge', mark: 'dodge', logo: '/brand/valvetronic-vehicles/dodge-clean.svg', make: 'dodge' },
  { name: 'Range Rover', mark: 'range-rover', logo: '/brand/valvetronic-vehicles/range-rover-clean.svg', search: 'Range Rover' },
  { name: 'Lexus', mark: 'lexus', logo: '/brand/valvetronic-vehicles/lexus-clean.svg', make: 'lexus' },
  { name: 'Honda', mark: 'honda', logo: '/brand/valvetronic-vehicles/honda-clean.svg', make: 'honda' },
  { name: 'Subaru', mark: 'subaru', logo: '/brand/valvetronic-vehicles/subaru-clean.svg', search: 'Subaru' },
  { name: 'Volkswagen', mark: 'volkswagen', logo: '/brand/valvetronic-vehicles/volkswagen-clean.svg', make: 'volkswagen' },
];

export function ValvetronicVehicles() {
  return <section id="valvetronic" className={styles.section} aria-labelledby="valvetronic-vehicles-title">
    <div className={styles.inner}>
      <header className={styles.heading}>
        <div>
          <h2 id="valvetronic-vehicles-title"><Image src="/brand/valvetronic.png" alt="Valvetronic Designs" width={1200} height={304} unoptimized /></h2>
          <p>Choose your vehicle brand. Find your sound.</p>
        </div>
        <Link href="/shop?brand=valvetronic" className={styles.all}>Shop all Valvetronic <ArrowUpRight size={17} strokeWidth={1.5} aria-hidden="true" /></Link>
      </header>
      <ul className={styles.grid} aria-label="Shop Valvetronic by vehicle brand">
        {vehicles.map(vehicle => {
          const params = new URLSearchParams({ brand: 'valvetronic', ...(vehicle.make ? { make: vehicle.make } : { q: vehicle.search! }) });
          return <li key={vehicle.mark}>
            <Link href={`/shop?${params}`} prefetch={false} className={styles.brand} data-mark={vehicle.mark} aria-label={`Shop Valvetronic Designs for ${vehicle.name}`}>
              <Image src={vehicle.logo} alt="" width={200} height={64} className={`${styles.mark} ${vehicle.monochrome ? styles.monochrome : ''}`} />
            </Link>
          </li>;
        })}
      </ul>
      <ValvetronicFeatureFilm />
    </div>
  </section>;
}
