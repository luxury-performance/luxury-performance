"use client";
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ShopMenuItem } from '@/lib/shop-navigation';
import styles from './header-menus.module.css';
export function MenuLogo({ item }: { item: ShopMenuItem }) {
  return <span className={styles.logoFrame}>{item.logo && <img src={`/brand/navigation/${item.logo}`} alt="" className={item.logoClass ? styles[item.logoClass] : undefined}/>}</span>;
}
export function MenuCards({ items, close }: { items: ShopMenuItem[]; close: () => void }) {
  return <div className={styles.cards}>{items.map(item => <Link className={styles.card} key={item.name} href={item.href} onClick={close} prefetch={false}><MenuLogo item={item}/><span className={styles.cardName}>{item.name}<ArrowUpRight size={12}/></span>{item.note && <small>{item.note}</small>}</Link>)}</div>;
}
