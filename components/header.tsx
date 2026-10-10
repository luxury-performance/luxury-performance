'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from './brand-logo';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const links = [{ name: 'Expertise', href: '/#expertise' }, { name: 'Programmes', href: '/programmes' }, { name: 'Our world', href: '/about' }, { name: 'Shop', href: 'https://lxpforged.com' }];
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => header.current?.classList.toggle('is-scrolled', window.scrollY > 32);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (event.key === 'Tab') {
        const elements = [toggle.current, ...(panel.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])].filter(Boolean) as HTMLElement[];
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    const mq = window.matchMedia('(min-width: 901px)');
    const closeOnDesktop = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener('change', closeOnDesktop);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); mq.removeEventListener('change', closeOnDesktop); };
  }, [open]);
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header ref={header} className={`site-header ${open ? 'menu-is-open' : ''}`}>
      <nav aria-label="Main navigation" className="desktop-nav">{links.map(link => <Link key={link.name} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} {...(link.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{link.name}</Link>)}</nav>
      <button ref={toggle} className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <Link className="brand" href="/" onClick={() => setOpen(false)} aria-label="Luxury Performance home"><BrandLogo priority wordmark={false} /></Link>
      <Link className="header-contact" href="/contact">Let’s talk <ArrowUpRight size={16} /></Link>
    </header>
    {open && <div ref={panel} className="mobile-menu" id="mobile-navigation"><nav aria-label="Mobile navigation">{[...links, { name: 'Let’s talk', href: '/contact' }].map((link, index) => <Link key={link.name} href={link.href} onClick={() => setOpen(false)} {...(link.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><small>0{index + 1}</small>{link.name}<ArrowUpRight /></Link>)}</nav><div className="mobile-menu-foot">Independent spirit. Exceptional performance.<br /><span>Dubai, United Arab Emirates</span></div></div>}
  </>;
}
