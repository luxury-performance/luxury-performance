'use client';

import { Children, type ReactNode, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import styles from './brand-hero.module.css';

type Brand = { slug: string; name: string };

function afterImageReady(image: HTMLImageElement, onReady: (loaded: boolean) => void) {
  let cancelled = false;
  const ready = () => {
    image.removeEventListener('load', ready);
    image.removeEventListener('error', ready);
    void image.decode().catch(() => {}).then(() => { if (!cancelled) onReady(image.naturalWidth > 0); });
  };
  if (image.complete) ready();
  else {
    image.addEventListener('load', ready);
    image.addEventListener('error', ready);
  }
  return () => {
    cancelled = true;
    image.removeEventListener('load', ready);
    image.removeEventListener('error', ready);
  };
}

export function BrandHero({ brands, children }: { brands: Brand[]; children: ReactNode }) {
  const slides = Children.toArray(children);
  const root = useRef<HTMLElement>(null);
  const context = useRef<HTMLHeadingElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [requested, setRequested] = useState<number | null>(null);
  const [mounted, setMounted] = useState([0]);
  const [paused, setPaused] = useState(false);
  const [focusHeld, setFocusHeld] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Let NOVITEC finish before hidden photographs compete for the connection.
  useEffect(() => {
    const first = root.current?.querySelector<HTMLImageElement>('picture img');
    if (!first) return;
    let imageReady = false;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mount = () => {
      idle = undefined;
      timer = undefined;
      if (!document.documentElement.dataset.lxpIntro) setMounted(Array.from({ length: brands.length }, (_, index) => index));
    };
    const schedule = () => {
      if (!imageReady || document.documentElement.dataset.lxpIntro || idle !== undefined || timer !== undefined) return;
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(mount, { timeout: 1500 });
      else timer = setTimeout(mount, 150);
    };
    const cancel = afterImageReady(first, () => { imageReady = true; schedule(); });
    const intro = new MutationObserver(schedule);
    intro.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lxp-intro'] });
    return () => {
      cancel();
      intro.disconnect();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, [brands.length]);

  // Keep the current photograph visible until an on-demand slide is decoded.
  useEffect(() => {
    if (requested === null || requested === active) return;
    const image = root.current?.querySelector<HTMLImageElement>(`[data-hero-slide="${requested}"] picture img`);
    if (!image) return;
    image.loading = 'eager';
    return afterImageReady(image, loaded => {
      if (loaded) setActive(requested);
      else setAnnouncement(`Unable to load the ${brands[requested].name} photograph. ${brands[active].name} remains visible.`);
      setRequested(null);
    });
  }, [requested, active, brands]);

  // Keep the location line clear of the fixed navigation as the hero scrolls away.
  useEffect(() => {
    const hero = root.current;
    const heading = context.current;
    const header = document.querySelector<HTMLElement>('.site-header');
    if (!hero || !heading || !header) return;
    let frame = 0;
    let headingTop = 0;
    let headerHeight = 0;
    let fadeDistance = 1;
    let painted = '';
    const update = () => {
      frame = 0;
      const opacity = Math.min(1, Math.max(0, (headingTop - window.scrollY - headerHeight - 8) / fadeDistance)).toFixed(3);
      if (opacity !== painted) { heading.style.opacity = opacity; painted = opacity; }
    };
    const measure = () => {
      headerHeight = header.offsetHeight;
      headingTop = hero.getBoundingClientRect().top + window.scrollY + heading.offsetTop;
      fadeDistance = Math.max(1, Math.min(32, heading.offsetTop - headerHeight - 8));
      update();
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure); };
  }, []);

  // Begin each full reading interval after the intro, and suspend it off screen.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelImage: (() => void) | undefined;
    let inView = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const eligible = () => !(paused || focusHeld || hovered || soundPlaying || reduced.matches || document.hidden || !inView || document.documentElement.dataset.lxpIntro);
    const schedule = () => {
      clearTimeout(timer);
      cancelImage?.();
      if (!eligible()) return;
      timer = setTimeout(() => {
        const next = (active + 1) % brands.length;
        const image = root.current?.querySelector<HTMLImageElement>(`[data-hero-slide="${next}"] picture img`);
        if (!image) return;
        image.loading = 'eager';
        cancelImage = afterImageReady(image, loaded => { if (loaded && eligible()) setActive(next); });
      }, 8000);
    };
    const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; schedule(); }, { threshold: .2 });
    if (root.current) visibility.observe(root.current);
    const intro = new MutationObserver(schedule);
    intro.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lxp-intro'] });
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    return () => {
      clearTimeout(timer);
      cancelImage?.();
      visibility.disconnect();
      intro.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', schedule);
    };
  }, [active, paused, focusHeld, hovered, soundPlaying, brands.length, mounted.length]);

  function select(index: number) {
    setMounted(indices => indices.includes(index) ? indices : [...indices, index]);
    setRequested(index === active ? null : index);
    setPaused(true);
    setAnnouncement(`${brands[index].name}, slide ${index + 1} of ${brands.length}`);
  }

  return <section ref={root} className={styles.hero} data-home-hero aria-roledescription="carousel" aria-label="Featured performance brands"
    onPlayCapture={event => { if (event.target instanceof HTMLAudioElement) setSoundPlaying(true); }}
    onPauseCapture={event => { if (event.target instanceof HTMLAudioElement) setSoundPlaying(false); }}
    onEndedCapture={event => { if (event.target instanceof HTMLAudioElement) setSoundPlaying(false); }}
    onErrorCapture={event => { if (event.target instanceof HTMLAudioElement) setSoundPlaying(false); }}
    onFocusCapture={event => { if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) setFocusHeld(true); }}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onTouchStart={event => { const point = event.touches[0]; touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null; }}
    onTouchEnd={event => {
      const start = touch.current;
      touch.current = null;
      if (!start) return;
      const point = event.changedTouches[0];
      const dx = point.clientX - start.x;
      if (Math.abs(dx) > 50 && Math.abs(point.clientY - start.y) < Math.abs(dx) * .6) select(((requested ?? active) + (dx < 0 ? 1 : brands.length - 1)) % brands.length);
    }}>
    <h1 ref={context} className={styles.context}>Performance parts in Dubai <span aria-hidden="true">/</span> UAE &amp; GCC</h1>
    <div className={styles.stage}>
      {slides.map((slide, index) => <div key={brands[index].slug} className={styles.layer} data-hero-slide={index} data-active={active === index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${brands.length}: ${brands[index].name}`} aria-hidden={active !== index} inert={active !== index}>{mounted.includes(index) ? slide : null}</div>)}
    </div>
    <div className={styles.controls}>
      <nav className={styles.brandNav} aria-label="Choose a featured brand">
        {brands.map((brand, index) => <button key={brand.slug} type="button" aria-pressed={active === index} aria-label={`Show ${brand.name}`} onClick={() => select(index)}><span className={styles.number} aria-hidden="true">0{index + 1}</span><span>{brand.name}</span></button>)}
      </nav>
      <button className={styles.playback} type="button" aria-label={paused || focusHeld ? 'Start automatic slides' : 'Pause automatic slides'} onClick={() => { setPaused(!(paused || focusHeld)); setFocusHeld(false); }}>
        {paused || focusHeld ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
      </button>
    </div>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
  </section>;
}
