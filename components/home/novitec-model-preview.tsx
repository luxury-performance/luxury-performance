'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './novitec-models.module.css';

export type ModelPreviewImage = { image: string; label: string; alt: string };

const imageSizes = '(max-width:700px) 76vw, (max-width:1100px) 42vw, 25vw';

export function DeferredModelImage({ enabled, src, alt, fallback = false }: { enabled: boolean; src: string; alt: string; fallback?: boolean }) {
  const props = { src, alt, fill: true, quality: 90, sizes: imageSizes, draggable: false } as const;
  return <>
    {enabled && <Image {...props} alt={alt} loading="eager"/>}
    {/* Keep the cover available when scripting is disabled, without starting hidden gallery requests. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {fallback && <noscript><img {...getImageProps(props).props} alt={alt}/></noscript>}
  </>;
}

type Props = { href: string; name: string; make: string; images: readonly ModelPreviewImage[]; effect?: 'slide' | 'fade'; mediaReady: boolean; onMediaIntent: () => void };

export function ModelPreviewCard({ href, name, make, images, effect = 'slide', mediaReady, onMediaIntent }: Props) {
  const hintId = useId();
  const card = useRef<HTMLElement>(null);
  const [preview, setPreview] = useState({ active: 0, previous: 0, hover: 1 });
  const [requested, setRequested] = useState(0);
  const requestedPhoto = useRef(0);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const { active } = preview;
  const slideDuration = preview.previous !== 0 ? '450ms' : '0ms';
  const [announcement, setAnnouncement] = useState('');
  const mouseDown = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  function warmHover() {
    onMediaIntent();
    setHoverEnabled(true);
  }

  function request(index: number) {
    onMediaIntent();
    if (index !== 0) setHoverEnabled(true);
    requestedPhoto.current = index;
    setRequested(index);
  }

  useEffect(() => {
    if (requested === active) return;
    const image = card.current?.querySelector<HTMLImageElement>(`[data-preview-photo="${requested}"] img`);
    if (!image) return;
    let cancelled = false;
    const reveal = () => {
      if (!image.naturalWidth) return;
      const decoded = typeof image.decode === 'function' ? image.decode().catch(() => undefined) : Promise.resolve();
      void decoded.then(() => {
        if (!cancelled && requestedPhoto.current === requested) setPreview(previous => previous.active === requested ? previous : { active: requested, previous: previous.active, hover: requested || previous.hover });
      });
    };
    image.addEventListener('load', reveal);
    if (image.complete) reveal();
    return () => { cancelled = true; image.removeEventListener('load', reveal); };
  }, [requested, active, mediaReady, hoverEnabled]);

  function show(index: number, announce = false) {
    const next = (index + images.length) % images.length;
    request(next);
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
    request(index);
  }

  function previewKey(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(requested + (event.key === 'ArrowRight' ? 1 : -1), true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      show(0, true);
    }
  }

  return <article
    ref={card}
    className={styles.card}
    aria-label={`${name} photo preview`}
    data-preview-index={active}
    data-preview-effect={effect}
    onPointerEnter={event => { if (event.pointerType === 'mouse') warmHover(); }}
    onFocusCapture={warmHover}
    onPointerMove={previewAt}
    onPointerLeave={event => { if (event.pointerType === 'mouse') { mouseDown.current = null; request(0); } }}
    onPointerDown={event => { dragged.current = false; mouseDown.current = event.pointerType === 'mouse' ? { x: event.clientX, y: event.clientY } : null; }}
    onPointerUp={() => { mouseDown.current = null; }}
    onPointerCancel={() => { mouseDown.current = null; dragged.current = false; }}
    onClickCapture={event => { if (dragged.current) { event.preventDefault(); dragged.current = false; } }}
    onDragStart={event => event.preventDefault()}
  >
    <div className={`${styles.image} ${styles.previewImage}`}>
      <Link href={href} className={styles.previewLink} aria-label={`Shop NOVITEC for ${make} ${name}`} aria-describedby={hintId} onKeyDown={previewKey}>
        {effect === 'fade' ? images.map((photo, index) => <span key={photo.image} className={styles.previewFadeFrame} data-preview-photo={index} data-active={active === index} aria-hidden={active !== index}>
          <DeferredModelImage enabled={index === 0 ? mediaReady || hoverEnabled : hoverEnabled} src={`/images/novitec-models/${photo.image}`} alt={photo.alt} fallback={index === 0}/>
        </span>) : <>
          <span className={styles.previewTrack} style={{ transform: `translateX(${-(preview.hover - 1) * 100}%)`, transitionDuration: slideDuration }}>
            {images.slice(1).map((photo, index) => <span key={photo.image} className={styles.previewFrame} data-preview-photo={index + 1} aria-hidden={active !== index + 1}>
              <DeferredModelImage enabled={hoverEnabled} src={`/images/novitec-models/${photo.image}`} alt={photo.alt}/>
            </span>)}
          </span>
          <span className={styles.previewCover} data-preview-photo={0} data-active={active === 0} aria-hidden={active !== 0}>
            <DeferredModelImage enabled={mediaReady || hoverEnabled} src={`/images/novitec-models/${images[0].image}`} alt={images[0].alt} fallback/>
          </span>
        </>}
      </Link>
      <button type="button" className={`${styles.previewControl} ${styles.previewPrevious}`} aria-label={`Previous ${name} photo`} onClick={() => show(requested - 1, true)}><ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true"/></button>
      <button type="button" className={`${styles.previewControl} ${styles.previewNext}`} aria-label={`Next ${name} photo`} onClick={() => show(requested + 1, true)}><ArrowRight size={18} strokeWidth={1.5} aria-hidden="true"/></button>
    </div>
    <p id={hintId} className="sr-only">Move left or right across the card to preview photos. With the photo link focused, use the left and right arrow keys; Escape returns to the first photo.</p>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    <Link href={href} className={styles.caption} tabIndex={-1}><div><h3>{name}</h3><p>{make}</p></div><ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true"/></Link>
  </article>;
}
