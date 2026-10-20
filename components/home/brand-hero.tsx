'use client';

import { Children, type ReactNode, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import styles from './brand-hero.module.css';

type Brand = { slug: string; name: string };

export function BrandHero({ brands, children }: { brands: Brand[]; children: ReactNode }) {
  const slides = Children.toArray(children);
  const root = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focusHeld, setFocusHeld] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Begin each full reading interval after the intro, and suspend it off screen.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inView = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const schedule = () => {
      clearTimeout(timer);
      if (paused || focusHeld || hovered || soundPlaying || reduced.matches || document.hidden || !inView || document.documentElement.dataset.lxpIntro) return;
      timer = setTimeout(() => setActive(value => (value + 1) % brands.length), 8000);
    };
    const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; schedule(); }, { threshold: .2 });
    if (root.current) visibility.observe(root.current);
    const intro = new MutationObserver(schedule);
    intro.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lxp-intro'] });
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    return () => {
      clearTimeout(timer);
      visibility.disconnect();
      intro.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', schedule);
    };
  }, [active, paused, focusHeld, hovered, soundPlaying, brands.length]);

  function select(index: number) {
    setActive(index);
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
      if (Math.abs(dx) > 50 && Math.abs(point.clientY - start.y) < Math.abs(dx) * .6) select((active + (dx < 0 ? 1 : brands.length - 1)) % brands.length);
    }}>
    <h1 className={styles.context}>Performance parts in Dubai <span aria-hidden="true">/</span> UAE &amp; GCC</h1>
    <div className={styles.stage}>
      {slides.map((slide, index) => <div key={brands[index].slug} className={styles.layer} data-active={active === index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${brands.length}: ${brands[index].name}`} aria-hidden={active !== index} inert={active !== index}>{slide}</div>)}
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
