'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { contact } from '@/lib/content';
import { buildOfferMessage } from '@/lib/shop/offer';
import { money, type Product, type Variant } from '@/lib/shop/types';
import styles from './product-offer.module.css';

export function ProductOffer({ product, variant, quantity, setSize }: {
  product: Product; variant: Variant; quantity: number; setSize?: number;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const amountInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [invalid, setInvalid] = useState(false);
  const message = buildOfferMessage({
    productTitle: product.title, sku: variant.sku, configuration: variant.title,
    quantity, setSize, listedPrice: variant.price.amount, currency: variant.price.currencyCode,
    amount, name, note,
  });
  const groupName = setSize === 2 ? 'pair' : setSize === 3 ? 'lot' : 'set';
  const unit = setSize ? quantity + ' ' + groupName + (quantity === 1 ? '' : 's') + ' · ' + quantity * setSize + ' wheels' : quantity + (quantity === 1 ? ' unit' : ' units');

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    const opener = trigger.current;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    modal?.showModal();
    amountInput.current?.focus({ preventScroll: true });
    return () => {
      modal?.close();
      root.style.overflow = previous;
      opener?.focus({ preventScroll: true });
    };
  }, [open]);

  return <div className={styles.offer}>
    <button ref={trigger} type="button" className={styles.trigger} aria-haspopup="dialog" disabled={!variant.availableForSale} onClick={() => setOpen(true)}>
      Make an offer <ArrowUpRight size={18} aria-hidden="true" />
    </button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={id + '-title'} onCancel={event => { event.preventDefault(); setOpen(false); }} onClick={event => {
      if (event.target !== dialog.current) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false);
    }}>
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>Luxury Performance</span><h2 id={id + '-title'}>Make an offer.</h2></div>
        <button type="button" className={styles.close} aria-label="Close offer" onClick={() => setOpen(false)}><X size={22} aria-hidden="true" /></button>
      </header>
      <div className={styles.product}>
        <h3>{product.title}</h3>
        {variant.title !== 'Default Title' && <p>{variant.title}</p>}
        <div className={styles.summary}><span>{unit}</span><span>{Number(variant.price.amount) > 0 ? 'Listed ' + money({ ...variant.price, amount: String(Number(variant.price.amount) * quantity) }) : 'Asking price pending'}</span></div>
      </div>
      <form action={contact.whatsapp} method="get" target="_blank" rel="noopener noreferrer" className={styles.form} onSubmit={event => {
        if (!message || !variant.availableForSale) { event.preventDefault(); setInvalid(true); amountInput.current?.focus(); }
      }}>
        <input type="hidden" name="text" value={message || ''} />
        <label className={styles.field} htmlFor={id + '-amount'}>
          <span>Your total offer <small>for {unit}</small></span>
          <div className={styles.amount}><span>{variant.price.currencyCode}</span><input ref={amountInput} id={id + '-amount'} type="number" inputMode="decimal" min="0.01" max="99999999.99" step="0.01" required value={amount} onChange={event => { setAmount(event.target.value); setInvalid(false); }} placeholder="Enter your price" aria-invalid={invalid || undefined} aria-describedby={invalid ? id + '-error' : undefined} /></div>
        </label>
        {invalid && <p id={id + '-error'} role="alert" className={styles.error}>Enter a price greater than zero, with up to two decimal places.</p>}
        <label className={styles.field}><span>Your name <small>optional</small></span><input autoComplete="name" maxLength={80} value={name} onChange={event => setName(event.target.value)} /></label>
        <label className={styles.field}><span>Message <small>optional</small></span><textarea rows={2} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} placeholder="Anything you’d like us to know?" /></label>
        <button type="submit" className={styles.submit}>Continue on WhatsApp <ArrowUpRight size={18} aria-hidden="true" /></button>
        <p className={styles.note}>Review and send your offer to our team in WhatsApp. We’ll reply there to agree a price. Your offer does not reserve the item.</p>
      </form>
    </dialog>
  </div>;
}

