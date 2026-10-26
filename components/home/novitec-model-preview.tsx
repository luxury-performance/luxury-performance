'use client';

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './novitec-models.module.css';

export type ModelPreviewImage = { image: string; label: string; alt: string };

type Props = { href: string; name: string; make: string; images: readonly ModelPreviewImage[]; effect?: 'slide' | 'fade' };

export function ModelPreviewCard({ href, name, make, images, effect = 'slide' }: Props) {
  const hintId = useId();
  const [preview, setPreview] = useState({ active: 0, previous: 0, hover: 1 });
  const { active } = preview;
  const slideDuration = preview.previous !== 0 ? '450ms' : '0ms';
  const [announcement, setAnnouncement] = useState('');
  const mouseDown = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  function select(index: number) {
    setPreview(previous => previous.active === index ? previous : { active: index, previous: previous.active, hover: index || previous.hover });
  }

  function show(index: number, announce = false) {
    const next = (index + images.length) % images.length;
    select(next);
    if (announce) setAnnouncement(`${images[next].label}, image ${next + 1} of ${images.length}.`);
  }

  function previewAt(event: PointerEvent<HTMLElement>) {
    // Touch gestures stay available to the surrounding model carousel.
    if (event.pointerType !== 'mouse' || (event.target instanceof Element && event.target.closest('button'))) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    if (mouseDown.current && Math.hypot(event.clientX - mouseDown.current.x, event.clientY - mouseDown.current.y) > 6) dragged.current = true;
    const hoverCount = images.length - 1;
    const index = 1 + Math.max(0, Math.min(hoverCount - 1, Math.floor((event.clientX - bounds.left) / bounds.width * hoverCount)));
    select(index);
  }

  function previewKey(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(active + (event.key === 'ArrowRight' ? 1 : -1), true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      show(0, true);
    }
  }

  return <article
    className={styles.card}
    aria-label={`${name} photo preview`}
    data-preview-index={active}
    data-preview-effect={effect}
    onPointerMove={previewAt}
    onPointerLeave={event => { if (event.pointerType === 'mouse') { mouseDown.current = null; select(0); } }}
    onPointerDown={event => { dragged.current = false; mouseDown.current = event.pointerType === 'mouse' ? { x: event.clientX, y: event.clientY } : null; }}
    onPointerUp={() => { mouseDown.current = null; }}
    onPointerCancel={() => { mouseDown.current = null; dragged.current = false; }}
    onClickCapture={event => { if (dragged.current) { event.preventDefault(); dragged.current = false; } }}
    onDragStart={event => event.preventDefault()}
  >
    <div className={`${styles.image} ${styles.previewImage}`}>
      <Link href={href} className={styles.previewLink} aria-label={`Shop NOVITEC for ${make} ${name}`} aria-describedby={hintId} onKeyDown={previewKey}>
        {effect === 'fade' ? images.map((photo, index) => <span key={photo.image} className={styles.previewFadeFrame} data-active={active === index} aria-hidden={active !== index}>
          <Image src={`/images/novitec-models/${photo.image}`} alt={photo.alt} fill quality={90} sizes="(max-width:700px) 76vw, (max-width:1100px) 42vw, 25vw" draggable={false}/>
        </span>) : <>
          <span className={styles.previewTrack} style={{ transform: `translateX(${-(preview.hover - 1) * 100}%)`, transitionDuration: slideDuration }}>
            {images.slice(1).map((photo, index) => <span key={photo.image} className={styles.previewFrame} aria-hidden={active !== index + 1}>
              <Image src={`/images/novitec-models/${photo.image}`} alt={photo.alt} fill quality={90} sizes="(max-width:700px) 76vw, (max-width:1100px) 42vw, 25vw" draggable={false}/>
            </span>)}
          </span>
          <span className={styles.previewCover} data-active={active === 0} aria-hidden={active !== 0}>
            <Image src={`/images/novitec-models/${images[0].image}`} alt={images[0].alt} fill quality={90} sizes="(max-width:700px) 76vw, (max-width:1100px) 42vw, 25vw" draggable={false}/>
          </span>
        </>}
      </Link>
      <button type="button" className={`${styles.previewControl} ${styles.previewPrevious}`} aria-label={`Previous ${name} photo`} onClick={() => show(active - 1, true)}><ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true"/></button>
      <button type="button" className={`${styles.previewControl} ${styles.previewNext}`} aria-label={`Next ${name} photo`} onClick={() => show(active + 1, true)}><ArrowRight size={18} strokeWidth={1.5} aria-hidden="true"/></button>
    </div>
    <p id={hintId} className="sr-only">Move left or right across the card to preview photos. With the photo link focused, use the left and right arrow keys; Escape returns to the first photo.</p>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    <Link href={href} className={styles.caption} tabIndex={-1}><div><h3>{name}</h3><p>{make}</p></div><ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true"/></Link>
  </article>;
}
