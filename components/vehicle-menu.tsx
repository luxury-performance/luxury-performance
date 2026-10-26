"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { vehicleMenu, type ShopMenuItem, type VehicleModels } from '@/lib/shop-navigation';
import { MenuLogo } from './shop-menu-cards';
import styles from './header-menus.module.css';
export function VehicleMenu({ close }: { close: () => void }) {
  const [selected, setSelected] = useState<ShopMenuItem | null>(null);
  const [models, setModels] = useState<VehicleModels | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/shop-navigation', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Could not load models');
      return response.json() as Promise<VehicleModels>;
    }).then(setModels).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  function choose(item: ShopMenuItem) { setSelected(item); requestAnimationFrame(() => heading.current?.focus({ preventScroll: true })); }
  function back() { const previous = selected; setSelected(null); requestAnimationFrame(() => { if (previous) buttons.current[previous.name]?.focus({ preventScroll: true }); }); }
  if (!selected) return <div className={`${styles.cards} ${styles.vehicleCards}`}>{vehicleMenu.map(item => <button ref={el => { buttons.current[item.name] = el; }} type="button" className={`${styles.card} ${styles.brandTile} ${styles.vehicleTile}`} key={item.name} onClick={() => choose(item)} aria-label={`Choose ${item.name} model`}><MenuLogo item={item}/></button>)}</div>;
  const make = new URLSearchParams(selected.href.split('?')[1]).get('make')!;
  const available = models?.[make] || [];
  return <section className={styles.modelPanel} aria-label={`${selected.name} models`}>
    <button type="button" className={styles.backToMakes} onClick={back}><ArrowLeft size={15}/>All vehicle brands</button>
    <div className={styles.modelHeading}><div className={styles.modelIdentity}><span className="tiny-label">Choose your model</span><h3 ref={heading} tabIndex={-1} aria-label={selected.name}><MenuLogo item={selected}/></h3></div><Link className={styles.allModels} href={selected.href} onClick={close} prefetch={false}>All {selected.name} parts<ArrowUpRight size={15}/></Link></div>
    {error ? <div className={styles.modelStatus} role="status">Models couldn’t load. <button type="button" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Try again</button></div> : !models ? <p className={styles.modelStatus} role="status">Loading models…</p> : available.length ? <div className={styles.modelLinks}>{available.map(model => <Link key={model.slug} href={`${selected.href}&model=${encodeURIComponent(model.slug)}`} onClick={close} prefetch={false}>{model.name}<ArrowUpRight size={14}/></Link>)}</div> : <p className={styles.modelStatus}>Browse all {selected.name} parts or ask our team about your model.</p>}
  </section>;
}
