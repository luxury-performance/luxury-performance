'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Search, X } from 'lucide-react';
import { BrandLogo } from './brand-logo';
import { money, type Money, type Photo } from '@/lib/shop/types';
import styles from './header-search.module.css';

type SearchProduct = { id: string; title: string; handle: string; vendor: string; image: Photo | null; price: Money };
type SearchReply = { products: SearchProduct[]; total: number };
const suggestions = [
  { name: 'NOVITEC', href: '/shop?brand=novitec' },
  { name: 'Valvetronic Designs', href: '/shop?brand=valvetronic' },
  { name: 'TECHART', href: '/shop?brand=techart' },
  { name: 'All in stock', href: '/collections/in-stock' },
];

export function HeaderSearch({ onOpen }: { onOpen: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState<SearchReply | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const term = query.trim();
  const resultsUrl = `/shop?q=${encodeURIComponent(term)}`;

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    const opener = trigger.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal?.showModal();
    input.current?.focus({ preventScroll: true });
    return () => { modal?.close(); document.body.style.overflow = previous; opener?.focus({ preventScroll: true }); };
  }, [open]);

  useEffect(() => {
    if (!open || term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search unavailable');
        const data: SearchReply = await response.json();
        if (!controller.signal.aborted) { setReply(data); setPending(false); }
      } catch {
        if (!controller.signal.aborted) { setError('Search is temporarily unavailable. Try again in a moment.'); setPending(false); }
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, term]);

  function changeQuery(value: string) {
    setQuery(value);
    if (value.trim() === term) return;
    setReply(null); setError(''); setPending(value.trim().length >= 2);
  }
  function close() { setOpen(false); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!term) return;
    close(); router.push(resultsUrl);
  }

  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-label="Search the store" aria-haspopup="dialog" onClick={() => { onOpen(); changeQuery(''); setOpen(true); }}><Search size={19} strokeWidth={1.5} aria-hidden="true" /></button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="global-search-title" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } }} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === dialog.current) close(); }}>
      <div className={styles.content}>
        <div className={styles.top}><Link href="/" onClick={close} aria-label="Luxury Performance home"><BrandLogo wordmark={false}/></Link><button type="button" className={styles.close} onClick={close} aria-label="Close search"><X size={24} strokeWidth={1.2}/></button></div>
        <h2 id="global-search-title" className={styles.eyebrow}>Find your next detail.</h2>
        <form action="/shop" role="search" onSubmit={submit} className={styles.form}>
          <label htmlFor="global-search-input" className="sr-only">Search parts, brands or vehicles</label>
          <Search size={25} strokeWidth={1.3} aria-hidden="true"/>
          <input ref={input} id="global-search-input" name="q" type="search" maxLength={100} value={query} onChange={event => changeQuery(event.target.value)} placeholder="Parts, brands or vehicles" autoComplete="off" spellCheck={false}/>
          <button type="submit" aria-label="View all search results" disabled={!term}><ArrowRight size={25} strokeWidth={1.3}/></button>
        </form>
        {term.length < 2 ? <div className={styles.discover}><p className={styles.eyebrow}>Explore the collection</p><nav aria-label="Search suggestions">{suggestions.map(item => <Link key={item.name} href={item.href} onClick={close}>{item.name}<ArrowUpRight size={18} strokeWidth={1.3}/></Link>)}</nav></div> : <div className={styles.results} aria-busy={pending}>
          <p className={styles.status} role="status">{pending ? 'Finding your parts…' : error || (reply ? `${reply.total} ${reply.total === 1 ? 'result' : 'results'} for “${term}”` : '')}</p>
          {!!reply?.products.length && <div className={styles.grid}>{reply.products.map(product => <Link className={styles.product} key={product.id} href={`/products/${product.handle}`} onClick={close}>
            <span className={styles.image}>{product.image ? <img src={`${product.image.url}${product.image.url.includes('?') ? '&' : '?'}width=240`} alt=""/> : <Search size={22} strokeWidth={1}/>}</span>
            <span className={styles.productCopy}><small>{product.vendor}</small><strong>{product.title}</strong><span>From {money(product.price)}</span></span><ArrowUpRight size={16} strokeWidth={1.2}/>
          </Link>)}</div>}
          {reply?.total === 0 && <p className={styles.empty}>Try another part name, brand or vehicle.</p>}
          {!!reply?.total && <Link className={styles.allResults} href={resultsUrl} onClick={close}>View all {reply.total} results <ArrowRight size={18} strokeWidth={1.3}/></Link>}
          {!!error && <button type="button" className={styles.allResults} onClick={() => { changeQuery(''); input.current?.focus(); }}>Start a new search <ArrowRight size={18}/></button>}
        </div>}
      </div>
    </dialog>
  </>;
}
