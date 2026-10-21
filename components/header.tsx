"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CartButton } from './shop/cart-provider';
import { BrandLogo } from './brand-logo';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, X } from 'lucide-react';
import { brandMenu, limitedStock, usedParts } from '@/lib/shop-navigation';
import styles from './header-menus.module.css';
import { MenuCards, MenuLogo } from './shop-menu-cards';
import { VehicleMenu } from './vehicle-menu';

type ShopMenu = 'brands' | 'vehicles';
const menus = [{ key: 'brands' as const, label: 'By brand' }, { key: 'vehicles' as const, label: 'By vehicle' }];
const links = [{ name: 'Home', href: '/' }, { name: 'Expertise', href: '/#expertise' }, { name: 'Programmes', href: '/programmes' }, { name: 'Our partners', href: '/partners' }, { name: 'Our world', href: '/about' }, { name: 'Let’s talk', href: '/contact' }];
function BrandMenu({ close }: { close: () => void }) {
  return <>
    <MenuCards items={brandMenu} close={close} logoOnly />
    <div className={styles.stockArea}>
      <span className={styles.stockLabel}>From our stock</span>
      <div className={styles.stockChoices}>{[usedParts, limitedStock].map(item => <Link key={item.name} href={item.href} onClick={close} className={styles.stockLink}>
        <span className={styles.stockMark}><MenuLogo item={item}/></span>
        <span>{item.name}<small>{item.note}</small></span><ArrowUpRight size={16}/>
      </Link>)}</div>
    </div>
  </>;
}
function ShopContents({ selected, select, prefix, close, dismiss }: { selected: ShopMenu; select: (value: ShopMenu) => void; prefix: string; close: () => void; dismiss?: () => void }) {
  return <>
    <div className={styles.shopToolbar}>
      <div className={styles.shopTabs} role="tablist" aria-label="Browse parts">
        {menus.map((menu, index) => <button key={menu.key} className={styles.shopTab} role="tab" id={`${prefix}-tab-${menu.key}`} aria-controls={`${prefix}-panel-${menu.key}`} aria-selected={selected === menu.key} tabIndex={selected === menu.key ? 0 : -1} onClick={() => select(menu.key)} onKeyDown={event => {
          let next = index;
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = 1 - index;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = menus.length - 1;
          else return;
          event.preventDefault(); select(menus[next].key);
          document.getElementById(`${prefix}-tab-${menus[next].key}`)?.focus();
        }}>{menu.label}</button>)}
      </div>
      <div className={styles.shopActions}><Link className={styles.shopAll} href="/shop" onClick={close}>View all parts <ArrowUpRight size={16}/></Link>{dismiss && <button className={styles.close} aria-label="Close shop" onClick={dismiss}><X size={19}/></button>}</div>
    </div>
    {menus.map(menu => <div key={menu.key} id={`${prefix}-panel-${menu.key}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${menu.key}`} hidden={selected !== menu.key} data-shop-category={menu.key}>
      {selected === menu.key && (menu.key === 'brands' ? <BrandMenu close={close}/> : <VehicleMenu close={close}/>)}
    </div>)}
  </>;
}
export function Header() {
  const [open, setOpen] = useState(false);
  const [shopMenu, setShopMenu] = useState<ShopMenu | null>(null);
  const [mobileSection, setMobileSection] = useState<ShopMenu>('brands');
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);
  const shopGlass = useRef<HTMLDivElement>(null);
  const shopTrigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); setShopMenu(null); };
  useEffect(() => {
    let frame = 0;
    const update = () => { frame = 0; const progress = Math.min(1, Math.max(0, window.scrollY / 160)); header.current?.style.setProperty('--glass-progress', String(progress)); header.current?.classList.toggle('is-scrolled', window.scrollY > 32); const hero = pathname === '/' ? document.querySelector('[data-home-hero], #main section[aria-label="Luxury Performance automotive film"]') : null; const heroBottom = hero?.getBoundingClientRect().bottom ?? 0; const headerHeight = header.current?.offsetHeight ?? 112; header.current?.classList.toggle('is-past-hero', !hero || heroBottom <= headerHeight); const heroFade = Math.min(1, Math.max(0, (heroBottom - headerHeight) / 180)); header.current?.style.setProperty('--hero-fade-opacity', String(heroFade)); header.current?.style.setProperty('--hero-glass-progress', String(1 - heroFade)); };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, [pathname]);
  useEffect(() => {
    const nav = header.current;
    const content = dropdown.current;
    if (!shopMenu || !nav || !content) return;
    const measure = () => {
      if (shopGlass.current) shopGlass.current.style.height = `${nav.offsetHeight + content.offsetHeight}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [shopMenu]);
  useEffect(() => {
    if (!shopMenu) return;
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setShopMenu(null); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShopMenu(null); shopTrigger.current?.focus(); } };
    const focus = (event: FocusEvent) => { if (!header.current?.contains(event.target as Node)) setShopMenu(null); };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', key); document.addEventListener('focusin', focus);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); document.removeEventListener('focusin', focus); };
  }, [shopMenu]);
  useEffect(() => {
    const mq = matchMedia('(min-width: 1101px)');
    const change = () => { setOpen(false); setShopMenu(null); };
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const background = Array.from(document.querySelectorAll<HTMLElement>('#main, footer'));
    const previousInert = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    panel.current?.querySelector<HTMLElement>('a,button')?.focus({ preventScroll: true });
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus({ preventScroll: true }); }
      if (event.key === 'Tab') {
        const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('a,button') ?? []).filter(el => el.getClientRects().length);
        const elements = [toggle.current, ...controls].filter(Boolean) as HTMLElement[];
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; background.forEach((element, index) => { element.inert = previousInert[index]; }); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header ref={header} className={`site-header ${pathname === '/' ? 'hero-header' : ''} ${styles.header} ${open || shopMenu ? 'menu-is-open' : ''} ${open ? 'full-menu-is-open' : shopMenu ? 'shop-menu-is-open' : ''}`}>
      <button ref={toggle} className={`menu-toggle ${styles.burger}`} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="full-navigation" onClick={() => { setOpen(!open); setShopMenu(null); setMobileSection('brands'); }}><span aria-hidden="true"><i/><i/></span></button>
      <nav aria-label="Main navigation" inert={open} className={`desktop-nav ${styles.desktop}`}>
        <div className={styles.menuGroup}>
          <button ref={shopTrigger} className={styles.trigger} aria-expanded={Boolean(shopMenu)} aria-controls="shop-menu" onClick={() => setShopMenu(shopMenu ? null : 'brands')} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setShopMenu(shopMenu ?? 'brands'); requestAnimationFrame(() => dropdown.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus()); } }}>Shop<ChevronDown size={12}/></button>
          {shopMenu && <div className={styles.dropdown} id="shop-menu" ref={dropdown}>
            <ShopContents selected={shopMenu} select={setShopMenu} prefix="desktop-shop" close={close} dismiss={() => { setShopMenu(null); shopTrigger.current?.focus(); }}/>
            <div className={styles.menuFooter}><Link href="/partners" onClick={close}>Explore all partners<ArrowUpRight size={15}/></Link><Link href="/contact" onClick={close}>Need help with fitment?</Link></div>
          </div>}
        </div>
      </nav>
      <Link inert={open} className="brand" href="/" onClick={close} aria-label="Luxury Performance home"><BrandLogo priority wordmark={false}/></Link>
      <div inert={open} className={`header-shop-actions ${styles.actions}`}><Link className={styles.secondary} href="/programmes" onClick={close}>Programmes</Link><Link className={styles.secondary} href="/about" onClick={close}>Our world</Link><span onClick={close}><CartButton/></span><Link className="header-contact" href="/contact" onClick={close}>Let’s talk <ArrowUpRight size={16}/></Link></div>
    </header>
    {shopMenu && <div ref={shopGlass} className="navigation-glass-surface navigation-shop-glass" aria-hidden="true" />}
    {open && <div className="navigation-glass-surface" aria-hidden="true" />}
    {open && <div ref={panel} className={`mobile-menu ${styles.mobile}`} id="full-navigation"><nav aria-label="Full navigation"><div className={styles.fullShop}><span className={styles.sectionLabel}>Shop</span>
      <ShopContents selected={mobileSection} select={setMobileSection} prefix="full-shop" close={close}/>
      </div><div className={styles.mobileLinks}><span className={styles.sectionLabel}>Explore Luxury Performance</span>{links.map(link => <Link key={link.name} href={link.href} onClick={close} aria-current={pathname === link.href ? 'page' : undefined}>{link.name}<ArrowUpRight size={20}/></Link>)}</div>
    </nav><div className="mobile-menu-foot">Independent spirit. Exceptional performance.<br/><span>Dubai, United Arab Emirates</span></div></div>}
  </>;
}
