"use client";
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { BrandArtwork } from './brand-artwork';
import { ArrowUpRight } from 'lucide-react';
import type { ShopMenuItem } from '@/lib/shop-navigation';
import styles from './header-menus.module.css';
export function MenuLogo({ item }: { item: ShopMenuItem }) {
  if (item.artwork) return <BrandArtwork brand={item.artwork} labelled={false} />;
  if (item.wordmark) return <span className={`${styles.logoFrame} ${styles.vehicleWordmark}`}><img src={`/brand/navigation/wordmarks/${item.wordmark}`} alt="" className={item.logoClass ? styles[item.logoClass] : undefined}/></span>;
  return <span className={styles.logoFrame}>{item.logo && <img src={`/brand/navigation/${item.logo}`} alt="" className={item.logoClass ? styles[item.logoClass] : undefined}/>}</span>;
}
export function MenuCards({ items, close, logoOnly = false }: { items: ShopMenuItem[]; close: () => void; logoOnly?: boolean }) {
  return <div className={`${styles.cards} ${logoOnly ? styles.brandCards : ''}`}>{items.map(item => <Link className={`${styles.card} ${logoOnly ? styles.brandTile : ''}`} aria-label={logoOnly ? item.name : undefined} key={item.name} href={item.href} onClick={close} prefetch={false}><MenuLogo item={item}/>{!logoOnly && <span className={styles.cardName}>{item.name}<ArrowUpRight size={12}/></span>}{item.note && <small>{item.note}</small>}</Link>)}</div>;
}
