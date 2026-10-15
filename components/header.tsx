"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CartButton } from './shop/cart-provider';
import { BrandLogo } from './brand-logo';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronDown, X } from 'lucide-react';
import { brandMenu, vehicleMenu, limitedStock } from '@/lib/shop-navigation';
import styles from './header-menus.module.css';
import { MenuCards, MenuLogo } from './shop-menu-cards';
import { VehicleMenu } from './vehicle-menu';

type ShopMenu = 'brands' | 'vehicles';
const menus = [{ key: 'brands' as const, label: 'Shop by brand', intro: 'The names behind the details.', items: brandMenu }, { key: 'vehicles' as const, label: 'Shop by vehicle', intro: 'Find the parts for your car.', items: vehicleMenu }];
const links = [{ name: 'Home', href: '/' }, { name: 'Shop all parts', href: '/shop' }, { name: 'Expertise', href: '/#expertise' }, { name: 'Programmes', href: '/programmes' }, { name: 'Our partners', href: '/partners' }, { name: 'Our world', href: '/about' }, { name: 'Let’s talk', href: '/contact' }];
function BrandMenu({ close }: { close: () => void }) {
  return <><MenuCards items={brandMenu} close={close}/><div className={styles.limitedStock}><span className={styles.stockLabel}>From our stock</span><Link href={limitedStock.href} onClick={close}><MenuLogo item={limitedStock}/><span>{limitedStock.name}<small>{limitedStock.note}</small></span><ArrowUpRight size={16}/></Link></div></>;
}
export function Header() {
  const [open, setOpen] = useState(false);
  const [shopMenu, setShopMenu] = useState<ShopMenu | null>(null);
  const [mobileSection, setMobileSection] = useState<ShopMenu | null>(null);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);
  const shopGlass = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Partial<Record<ShopMenu, HTMLButtonElement | null>>>({});
  const activeMenu = menus.find(menu => menu.key === shopMenu);
  const close = () => { setOpen(false); setShopMenu(null); };
  useEffect(() => {
    let frame = 0;
    const update = () => { frame = 0; const progress = Math.min(1, Math.max(0, window.scrollY / 160)); header.current?.style.setProperty('--glass-progress', String(progress)); header.current?.classList.toggle('is-scrolled', window.scrollY > 32); const hero = pathname === '/' ? document.querySelector('#main section[aria-label="Luxury Performance automotive film"]') : null; const heroBottom = hero?.getBoundingClientRect().bottom ?? 0; const headerHeight = header.current?.offsetHeight ?? 112; header.current?.classList.toggle('is-past-hero', !hero || heroBottom <= headerHeight); const heroFade = Math.min(1, Math.max(0, (heroBottom - headerHeight) / 180)); header.current?.style.setProperty('--hero-fade-opacity', String(heroFade)); header.current?.style.setProperty('--hero-glass-progress', String(1 - heroFade)); };
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
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShopMenu(null); triggerRefs.current[shopMenu]?.focus(); } };
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
      <button ref={toggle} className={`menu-toggle ${styles.burger}`} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="full-navigation" onClick={() => { setOpen(!open); setShopMenu(null); setMobileSection(null); }}><span aria-hidden="true"><i/><i/></span></button>
      <nav aria-label="Main navigation" inert={open} className={`desktop-nav ${styles.desktop}`}>
        {menus.map(menu => <div key={menu.key} className={styles.menuGroup}><button ref={el => { triggerRefs.current[menu.key] = el; }} className={styles.trigger} aria-expanded={shopMenu === menu.key} aria-controls={`shop-menu-${menu.key}`} onClick={() => setShopMenu(shopMenu === menu.key ? null : menu.key)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setShopMenu(menu.key); requestAnimationFrame(() => dropdown.current?.querySelector<HTMLElement>('a,button:not([aria-label^="Close"])')?.focus()); } }}>{menu.label}<ChevronDown size={12}/></button>
        {shopMenu === menu.key && activeMenu && <div className={styles.dropdown} id={`shop-menu-${menu.key}`} ref={dropdown}>
          <div className={styles.menuHeading}><div><span className="tiny-label">{menu.key === 'brands' ? 'Our partners' : 'Your next specification'}</span><h2>{menu.intro}</h2></div><button className={styles.close} aria-label={`Close ${menu.label.toLowerCase()}`} onClick={() => { setShopMenu(null); triggerRefs.current[menu.key]?.focus(); }}><X size={19}/></button></div>
          {menu.key === 'brands' ? <BrandMenu close={close}/> : <VehicleMenu close={close}/>}
          <div className={styles.menuFooter}><Link href={menu.key === 'brands' ? '/partners' : '/shop'} onClick={close}>{menu.key === 'brands' ? 'Explore all partners' : 'Explore all vehicles & parts'}<ArrowUpRight size={15}/></Link><Link href="/contact" onClick={close}>Need help with fitment?</Link></div>
        </div>}</div>)}
        <Link href="/shop" onClick={close} aria-current={pathname === '/shop' ? 'page' : undefined}>Shop all</Link>
      </nav>
      <Link inert={open} className="brand" href="/" onClick={close} aria-label="Luxury Performance home"><BrandLogo priority wordmark={false}/></Link>
      <div inert={open} className={`header-shop-actions ${styles.actions}`}><Link className={styles.secondary} href="/programmes" onClick={close}>Programmes</Link><Link className={styles.secondary} href="/about" onClick={close}>Our world</Link><span onClick={close}><CartButton/></span><Link className="header-contact" href="/contact" onClick={close}>Let’s talk <ArrowUpRight size={16}/></Link></div>
    </header>
    {shopMenu && <div ref={shopGlass} className="navigation-glass-surface navigation-shop-glass" aria-hidden="true" />}
    {open && <div className="navigation-glass-surface" aria-hidden="true" />}
    {open && <div ref={panel} className={`mobile-menu ${styles.mobile}`} id="full-navigation"><nav aria-label="Full navigation"><div className={styles.mobileLinks}><span className={styles.sectionLabel}>Explore Luxury Performance</span>{links.map(link => <Link key={link.name} href={link.href} onClick={close} aria-current={pathname === link.href ? 'page' : undefined}>{link.name}<ArrowUpRight size={20}/></Link>)}</div><div className={styles.fullShop}><span className={styles.sectionLabel}>Find your next detail</span>
      {menus.map(menu => <div key={menu.key} className={styles.mobileGroup}><button className={styles.mobileTrigger} aria-expanded={mobileSection === menu.key} aria-controls={`mobile-shop-${menu.key}`} onClick={() => setMobileSection(mobileSection === menu.key ? null : menu.key)}>{menu.label}<ChevronDown size={19}/></button><div id={`mobile-shop-${menu.key}`} hidden={mobileSection !== menu.key}>{mobileSection === menu.key && (menu.key === 'brands' ? <BrandMenu close={close}/> : <VehicleMenu close={close}/>)}<Link className={styles.mobileAll} href={menu.key === 'brands' ? '/partners' : '/shop'} onClick={close}>{menu.key === 'brands' ? 'Explore all partners' : 'All vehicles & parts'}<ArrowUpRight size={14}/></Link></div></div>)}
      </div>
    </nav><div className="mobile-menu-foot">Independent spirit. Exceptional performance.<br/><span>Dubai, United Arab Emirates</span></div></div>}
  </>;
}
