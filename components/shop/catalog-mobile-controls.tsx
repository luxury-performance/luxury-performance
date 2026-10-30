"use client";

import { createContext, useCallback, useContext, useEffect, useId, useOptimistic, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { filterUrl, fitLabel, label, updateFilters, type Filters } from '@/lib/shop/taxonomy';
import { CatalogFilters, type CatalogFilterProps } from './catalog-filters';

const MobileNavigation = createContext<ReturnType<typeof useTransition> | null>(null);

export function CatalogMobileProvider({ children }: { children: ReactNode }) {
  const navigation = useTransition();
  return <MobileNavigation.Provider value={navigation}>{children}</MobileNavigation.Provider>;
}

function useMobileNavigation() {
  const navigation = useContext(MobileNavigation);
  if (!navigation) throw new Error('Mobile catalogue controls require CatalogMobileProvider.');
  return navigation;
}

type ScopeProps = { filters: Filters; basePath: string };

export function CatalogSearch({ filters, basePath }: ScopeProps) {
  const router = useRouter();
  const [pending, startTransition] = useMobileNavigation();
  return <form className="shop-mobile-search" role="search" aria-label="Search parts" action={basePath} aria-busy={pending} onSubmit={event => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get('q') || '').trim();
    startTransition(() => router.push(filterUrl(basePath, updateFilters(filters, { q })), { scroll: false }));
  }}>
    {Object.entries(filters).filter(([key, value]) => key !== 'q' && key !== 'page' && value).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
    <Search size={17} aria-hidden="true" />
    <input key={(filters.brand || '') + ':' + (filters.q || '')} type="search" name="q" aria-label="Part name or vehicle" placeholder="Part name or vehicle" defaultValue={filters.q || ''} />
    <button type="submit" aria-label="Search parts" disabled={pending}><ArrowRight size={19} aria-hidden="true" /></button>
    <span className="sr-only" role="status">{pending ? 'Searching parts…' : ''}</span>
  </form>;
}

type PanelProps = Omit<CatalogFilterProps, 'compact' | 'onDone' | 'resultCount' | 'navigation'> & { resultCount: number; children?: ReactNode };

export function CatalogFilterPanel({ children, resultCount, ...props }: PanelProps) {
  const navigation = useMobileNavigation();
  const [pending] = navigation;
  const modal = useRef<HTMLDialogElement>(null);
  const scrollLock = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  const unlock = useCallback(() => {
    if (scrollLock.current === null) return;
    document.documentElement.style.overflow = scrollLock.current;
    scrollLock.current = null;
  }, []);
  useEffect(() => {
    const dialog = modal.current;
    const desktop = matchMedia('(min-width: 701px)');
    const resize = () => { if (desktop.matches) dialog?.close(); };
    desktop.addEventListener('change', resize);
    return () => { desktop.removeEventListener('change', resize); dialog?.close(); unlock(); };
  }, [unlock]);
  function show() {
    if (pending || !modal.current || modal.current.open) return;
    scrollLock.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    modal.current.showModal();
    setOpen(true);
  }
  function done() {
    modal.current?.close();
    document.getElementById('catalogue')?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <aside className="shop-filter-panel">
    <div className="shop-desktop-filters"><CatalogFilters {...props} />{children}</div>
    <div className="shop-mobile-toolbar"><p role="status">{resultCount} {resultCount === 1 ? 'part' : 'parts'}</p><button type="button" onClick={show} disabled={pending} aria-haspopup="dialog" aria-expanded={open} aria-controls={id}><SlidersHorizontal size={16} aria-hidden="true" />Filter &amp; sort</button></div>
    <dialog ref={modal} id={id} className="shop-filter-sheet" aria-labelledby={id + '-title'} onClose={() => { setOpen(false); unlock(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
    }}>
      <header className="shop-filter-sheet-header"><h2 id={id + '-title'}>Filter &amp; sort</h2><button type="button" aria-label="Close filters" onClick={() => modal.current?.close()}><X size={20} aria-hidden="true" /></button></header>
      {open && <CatalogFilters {...props} compact navigation={navigation} resultCount={resultCount} onDone={done} />}
    </dialog>
  </aside>;
}

const chipNames: Partial<Record<keyof Filters, string>> = { q: 'search', make: 'vehicle make', model: 'vehicle model', fit: 'fitment', body: 'body style', category: 'department', sort: 'sort order' };
const sortNames: Record<string, string> = { 'price-up': 'Price: low to high', 'price-down': 'Price: high to low', name: 'Name: A–Z' };

export function CatalogAppliedFilters({ filters, basePath }: ScopeProps) {
  const router = useRouter();
  const [selection, setSelection] = useOptimistic(filters);
  const [pending, startTransition] = useMobileNavigation();
  const active = (['q', 'make', 'model', 'fit', 'body', 'category', 'sort'] as const).filter(key => selection[key]);
  function remove(key?: keyof Filters) {
    const next = key ? updateFilters(selection, { [key]: undefined }) : { brand: selection.brand };
    startTransition(() => { setSelection(next); router.push(filterUrl(basePath, next), { scroll: false }); });
  }
  if (!active.length) return null;
  return <div className="shop-applied-filters" role="group" aria-label="Selected filters" aria-busy={pending}>
    {active.map(key => {
      const value = selection[key]!;
      const text = key === 'q' ? 'Search: ' + value : key === 'fit' ? fitLabel(value) : key === 'sort' ? sortNames[value] || value : key === 'category' ? value : label(value);
      return <button type="button" className="shop-applied-filter" key={key} disabled={pending} onClick={() => remove(key)} aria-label={'Remove ' + chipNames[key] + ': ' + text}><span>{text}</span><X size={12} aria-hidden="true" /></button>;
    })}
    <button type="button" className="shop-filter-clear" disabled={pending} onClick={() => remove()}>Clear all</button>
  </div>;
}
