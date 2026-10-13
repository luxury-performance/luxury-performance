"use client";

import Link from 'next/link';
import { useOptimistic, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import { label, fitLabel, filterUrl, updateFilters, type Filters } from '@/lib/shop/taxonomy';

type Props = {
  filters: Filters;
  basePath: string;
  makes: string[];
  models: string[];
  fits: string[];
  categories: { name: string; count: number }[];
  total: number;
};

export function CatalogFilters({ filters, basePath, makes, models, fits, categories, total }: Props) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [selection, setSelection] = useOptimistic(filters);

  function apply(changes: Partial<Filters>) {
    const q = String(new FormData(form.current!).get('q') || '').trim();
    const next = updateFilters(selection, { q, ...changes });
    startTransition(() => {
      setSelection(next);
      router.push(filterUrl(basePath, next), { scroll: false });
    });
  }

  return <form ref={form} action={basePath} aria-busy={pending} onSubmit={event => { event.preventDefault(); apply({}); }}>
    {selection.brand && <input type="hidden" name="brand" value={selection.brand} />}
    <div className="shop-filter-heading"><h2>Find your part</h2><Link href={filterUrl(basePath, { brand: filters.brand })} scroll={false}>Reset</Link></div>
    <label className="shop-search"><span className="sr-only">Search parts</span><Search size={17}/><input key={`${filters.brand || ''}:${filters.q || ''}`} type="search" name="q" placeholder="Part name or vehicle" defaultValue={filters.q || ''} /></label>
    <button className="shop-button" type="submit" disabled={pending}>Search parts <ArrowRight size={16}/></button>
    <p className="shop-filter-status" role="status">{pending ? 'Updating parts…' : 'Filters update automatically.'}</p>
    {makes.length > 1 && <label className="shop-field"><span>Vehicle make</span><select name="make" value={selection.make || ''} onChange={event => apply({ make: event.target.value })}><option value="">All makes</option>{makes.map(v => <option key={v} value={v}>{label(v)}</option>)}</select></label>}
    {makes.length === 1 && <div className="shop-fixed-make">{label(makes[0])}</div>}
    {!!models.length && <label className="shop-field"><span>{filters.brand === 'techart' ? 'Porsche model' : 'Vehicle model'}</span><select name="model" value={selection.model || ''} onChange={event => apply({ model: event.target.value })}><option value="">All models</option>{models.map(v => <option key={v} value={v}>{label(v)}</option>)}</select></label>}
    {filters.brand === 'techart' && !!fits.length && <label className="shop-field"><span>Generation / fitment</span><select name="fit" value={selection.fit || ''} onChange={event => apply({ fit: event.target.value })}><option value="">All fitments</option>{fits.map(v => <option key={v} value={v}>{fitLabel(v)}</option>)}</select></label>}
    <fieldset className="shop-category-list"><legend>{filters.brand === 'valvetronic' ? 'Exhaust type' : 'Department'}</legend><label><input type="radio" name="category" value="" checked={!selection.category} onChange={() => apply({ category: '' })}/><span>All parts</span><small>{total}</small></label>{categories.map(c => <label key={c.name}><input type="radio" name="category" value={c.name} checked={selection.category === c.name} disabled={!c.count && selection.category !== c.name} onChange={() => apply({ category: c.name })}/><span>{c.name}</span><small>{c.count}</small></label>)}</fieldset>
    <label className="shop-field"><span>Sort by</span><select name="sort" value={selection.sort || ''} onChange={event => apply({ sort: event.target.value })}><option value="">Featured</option><option value="price-up">Price: low to high</option><option value="price-down">Price: high to low</option><option value="name">Name: A–Z</option></select></label>
  </form>;
}
