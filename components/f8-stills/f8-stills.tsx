'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import styles from './f8-stills.module.css';

const compositions = [
  { name: 'First impression', view: 'Low front three-quarter', image: '01-front-three-quarter', duration: 3800, origin: '50% 55%', from: [0, 0, 1], to: [0, -0.3, 1.035] },
  { name: 'Form meets function', view: 'Rear wheel & body', image: '02-rear-wheel', duration: 2600, origin: '60% 50%', from: [-0.7, 0, 1.035], to: [0.7, 0, 1.035] },
  { name: 'A different perspective', view: 'Direct overhead', image: '03-overhead', duration: 3800, origin: '50% 50%', from: [0, 0.6, 1.02], to: [0, -0.6, 1.035] },
  { name: 'A lasting impression', view: 'Low rear three-quarter', image: '04-rear-three-quarter', duration: 3500, origin: '45% 55%', from: [0, 0, 1], to: [0, 0, 1.035] },
  { name: 'Every detail matters', view: 'Front corner', image: '05-front-corner', duration: 2600, origin: '50% 50%', from: [-0.5, 0.3, 1.025], to: [0.5, -0.3, 1.04] },
  { name: 'The silhouette', view: 'Side profile', image: '06-side-profile', duration: 3800, origin: '50% 50%', from: [-0.65, 0, 1.02], to: [0.65, 0, 1.02] },
  { name: 'The finishing touch', view: 'Exhaust & diffuser', image: '07-exhaust', duration: 2600, origin: '50% 50%', from: [0.6, 0, 1.03], to: [-0.6, 0, 1.03] },
  { name: 'Sculpted for motion', view: 'Elevated front three-quarter', image: '08-elevated-front', duration: 3500, origin: '50% 50%', from: [0, 0, 1.035], to: [0, 0, 1] },
  { name: 'Carbon, in focus', view: 'Upper rear detail', image: '09-upper-rear', duration: 2600, origin: '50% 50%', from: [-0.6, 0, 1.03], to: [0.6, 0, 1.03] },
  { name: 'Pure expression', view: 'Straight front', image: '10-straight-front', duration: 3500, origin: '50% 50%', from: [0, 0, 1], to: [0, 0, 1.04] },
] as const;
const cars = {
  f8: { assetRoot: '/images/f8-montage-v1', name: 'Ferrari F8 Tributo', short: 'F8', make: 'ferrari', supplier: 'novitec', supplierName: 'NOVITEC', brand: 'Ferrari', edition: 'F8 TRIBUTO / N-LARGO', city: 'MARANELLO / ITALY', description: 'Red Ferrari F8 Tributo with NOVITEC N-LARGO bodywork' },
  revuelto: { assetRoot: '/images/revuelto-montage-v1', name: 'Lamborghini Revuelto', short: 'Revuelto', make: 'lamborghini', supplier: 'novitec', supplierName: 'NOVITEC', brand: 'Lamborghini', edition: 'REVUELTO / NOVITEC', city: 'SANT’AGATA / ITALY', description: 'Orange Lamborghini Revuelto with NOVITEC carbon aero and Valvetronic exhaust' },
  porsche: { assetRoot: '/images/porsche-montage-v1', name: 'Porsche 911 Turbo S', short: '992.2', make: 'porsche', supplier: 'techart', supplierName: 'TECHART', brand: 'Porsche', edition: '992.2 TURBO S / TECHART', city: 'STUTTGART / GERMANY', description: 'Pearl-white Porsche 911 Turbo S 992.2 with TECHART carbon aero and black Formula IX wheels' },
} as const;
type Car = keyof typeof cars;
const carOrder: Car[] = ['f8', 'porsche', 'revuelto'];
const mixedSequence = compositions.flatMap(shot => carOrder.map(car => ({ ...shot, duration: shot.duration, car })));
const singleSequences = Object.fromEntries(carOrder.map(car => [car, compositions.map(shot => ({ ...shot, car }))])) as Record<Car, typeof mixedSequence>;
const imageName = (car: Car, name: string) => {
  if (car === 'porsche' && name === '03-overhead') return name + '-neutral-v7';
  if (car === 'f8' && ['07-exhaust', '09-upper-rear'].includes(name)) return name + '-lettering-v1';
  if (car === 'f8' && name === '04-rear-three-quarter') return name + '-lettering-v1';
  const nlargo = ['01-front-three-quarter', '02-rear-wheel', '03-overhead', '04-rear-three-quarter', '06-side-profile', '08-elevated-front', '09-upper-rear'];
  if (car === 'porsche' && name === '07-exhaust') return name + '-approved-v4';
  if (car === 'porsche' && name === '02-rear-wheel') return name + '-matched-v2';
  if (car === 'porsche' && ['03-overhead', '08-elevated-front', '09-upper-rear', '10-straight-front'].includes(name)) return name + '-corrected-v5';
  if (car === 'revuelto' && name === '05-front-corner') return name + '-f8-angle-v2';
  if (car === 'f8' && nlargo.includes(name)) return name + '-nlargo-v3';
  if (car === 'f8' && name === '07-exhaust') return name + '-reference-v3';
  if ((car === 'f8' && ['04-rear-three-quarter', '09-upper-rear'].includes(name)) || (car === 'revuelto' && ['04-rear-three-quarter', '09-upper-rear'].includes(name))) return name + '-lxp-plate';
  return name;
};
const imageSource = (car: Car, name: string, thumbnail = false) => cars[car].assetRoot + '/' + imageName(car, name) + (thumbnail ? '-thumb' : '') + '.webp';
const portraitImageSource = (car: Car, name: string) => `/images/${car}-montage-portrait-v1/${name}-height-v2.webp`;
const number = (value: number) => String(value).padStart(2, '0');

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getHidden = () => document.hidden;
const getServerSnapshot = () => false;

export function F8Stills({ car = 'f8', bare = false }: { car?: Car | 'mix'; bare?: boolean }) {
  const shots = car === 'mix' ? mixedSequence : singleSequences[car];
  const starts = useMemo(() => shots.map((_, index) => shots.slice(0, index).reduce((total, shot) => total + shot.duration, 0)), [shots]);
  const cycleMs = shots.reduce((total, shot) => total + shot.duration, 0);
  const root = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);
  const current = useRef(0);
  const loaded = useRef(new Set<string>());
  const [active, setActive] = useState(0);
  const vehicle = cars[shots[active].car];
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const reduced = useSyncExternalStore(subscribeMotion, getReducedMotion, getServerSnapshot);
  const hidden = useSyncExternalStore(subscribeVisibility, getHidden, getServerSnapshot);
  const running = playing && ready && !reduced && !hidden && inView;

  const draw = useCallback((time: number) => {
    const cycleTime = time % cycleMs;
    const index = shots.findIndex((shot, i) => cycleTime < starts[i] + shot.duration);
    const shot = shots[index];
    const segmentProgress = (cycleTime - starts[index]) / shot.duration;
    // The camera continues across all three cars; only reset at the next viewpoint.
    const p = car === 'mix' ? (index % carOrder.length + segmentProgress) / carOrder.length : segmentProgress;
    // One uniform scale for the entire photograph. No morphing or independent axes.
    const values = shot.from.map((value, axis) => value + (shot.to[axis] - value) * p);
    // More visible travel while preserving the slower car holds.
    values[0] *= 3;
    values[1] *= 3;
    values[2] = 1 + (values[2] - 1) * 2.5;
    if (shot.car === 'porsche' && shot.image === '07-exhaust') {
      // Preserve the approved tight crop and spoiler margin; glide without zoom.
      values[0] = 0.8 - p * 1.6;
      values[1] = 0;
      values[2] = 1;
    }
    layers.current.forEach((layer, i) => {
      if (!layer) return;
      layer.style.opacity = i === index ? '1' : '0';
      if (i === index) layer.style.transform = `translate3d(${values[0]}%, ${values[1]}%, 0) scale(${values[2]})`;
    });
    if (progress.current) progress.current.style.transform = `scaleX(${p})`;
    if (current.current !== index) {
      current.current = index;
      setActive(index);
    }
  }, [car, shots, cycleMs, starts]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    draw(elapsed.current);
    if (!running) return;
    let raf = 0;
    let previous: number | null = null;
    const tick = (now: number) => {
      if (previous !== null) elapsed.current += Math.min(now - previous, 250);
      previous = now;
      draw(elapsed.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, draw]);

  function selectShot(index: number) {
    elapsed.current = starts[index];
    draw(elapsed.current);
  }

  function imageReady(name: string) {
    loaded.current.add(name);
    if (loaded.current.size === shots.length) setReady(true);
  }

  if (bare) return <section ref={root} className={styles.broll} aria-label="Luxury Performance automotive film" data-active-shot={active + 1} data-active-car={shots[active].car} data-playing={running}>
    <h1 className="sr-only">Luxury Performance</h1>
    <div className={styles.brollViewport}>
      {shots.map((shot, index) => <div key={`${shot.car}-${shot.image}-${index}`} ref={node => { layers.current[index] = node; }} className={`${styles.layer} ${shot.image === '03-overhead' ? styles.overhead : ''}`}
        style={{ opacity: index === 0 ? 1 : 0, transformOrigin: shot.origin }} aria-hidden={index !== active}>
        <picture>
          <source media="(max-width: 700px)" srcSet={portraitImageSource(shot.car, shot.image)} />
          <Image src={imageSource(shot.car, shot.image)} alt={`${cars[shot.car].description}: ${shot.view}`} fill unoptimized loading="eager" sizes="100vw"
          onLoad={() => imageReady(`${shot.car}-${shot.image}`)} onError={() => setFailed(true)} className={styles.photo} />
        </picture>
      </div>)}
    </div>
  </section>;

  return <div className={styles.study}>
    <nav className={styles.carSelector} aria-label="Choose montage vehicle">
      <span>Stills in motion</span>
      <Link href="/studio/orbit?car=mix" scroll={false} aria-current={car === 'mix' ? 'page' : undefined}>Three-car montage</Link>
      <Link href="/studio/orbit?car=f8" scroll={false} aria-current={car === 'f8' ? 'page' : undefined}>Ferrari F8</Link>
      <Link href="/studio/orbit?car=revuelto" scroll={false} aria-current={car === 'revuelto' ? 'page' : undefined}>Lamborghini Revuelto</Link>
      <Link href="/studio/orbit?car=porsche" scroll={false} aria-current={car === 'porsche' ? 'page' : undefined}>Porsche 992.2</Link>
    </nav>
    <section ref={root} className={styles.hero} aria-labelledby="f8-stills-title" data-active-shot={active + 1} data-active-car={shots[active].car} data-camera-shot={car === 'mix' ? Math.floor(active / 3) + 1 : active + 1} data-playing={running}>
      <div className={styles.viewport}>
        {shots.map((shot, index) => <div key={`${shot.car}-${shot.image}-${index}`} ref={node => { layers.current[index] = node; }} className={`${styles.layer} ${shot.image === '03-overhead' ? styles.overhead : ''}`}
          style={{ opacity: index === 0 ? 1 : 0, transformOrigin: shot.origin }} aria-hidden={index !== active}>
          <Image src={imageSource(shot.car, shot.image)} alt={`${cars[shot.car].description}: ${shot.view}`} fill unoptimized loading="eager" sizes="100vw"
            onLoad={() => imageReady(`${shot.car}-${shot.image}`)} onError={() => setFailed(true)} className={styles.photo} />
        </div>)}
      </div>
      <div className={styles.shade} />
      <div className={styles.heading}>
        <p className={styles.eyebrow}><span />The art of automotive expression</p>
        <h1 id="f8-stills-title">Pure<br /><span>expression.</span></h1>
        <Link href={`/shop?brand=${vehicle.supplier}&make=${vehicle.make}`} className={styles.explore}>Explore {vehicle.brand} <ArrowUpRight size={16} strokeWidth={1.4} /></Link>
      </div>
      <div className={styles.edition}><span>{vehicle.edition}</span><span>{vehicle.city}</span></div>
      <div className={styles.bottom}>
        <div className={styles.caption}><span>{vehicle.name} · {vehicle.supplierName}</span><p>{shots[active].name}</p></div>
        <div className={styles.transport}>
          <div className={styles.meter}><span className={styles.count}>{number(car === 'mix' ? Math.floor(active / 3) + 1 : active + 1)}<i>/ {number(car === 'mix' ? compositions.length : shots.length)}</i></span><span className={styles.track}><span ref={progress} /></span></div>
          <button type="button" aria-label={playing && !reduced ? 'Pause cinematic motion' : 'Play cinematic motion'}
            disabled={!ready || reduced} onClick={() => setPlaying(value => !value)}>
            {playing && !reduced ? <Pause size={15} /> : <Play size={15} />}
          </button>
        </div>
      </div>
      {!ready && !failed && <p className={styles.error} role="status">Loading photographs…</p>}
      {failed && <p className={styles.error} role="alert">A photograph could not load. Refresh to try again.</p>}
    </section>
    <section className={styles.reel} aria-label="Choose a camera composition">
      <div className={styles.reelHeading}><p>{car === 'mix' ? 'F8 · 992.2 · Revuelto' : vehicle.short} / The montage</p><span>{reduced ? 'Motion paused to match your device preference' : 'Take a moment. Look a little closer.'}</span></div>
      <div className={styles.shots}>{shots.map((shot, index) => <button type="button" key={`${shot.car}-${shot.image}-${index}`} onClick={() => selectShot(index)} aria-pressed={active === index} aria-label={`View ${car === 'mix' ? cars[shot.car].name + ': ' : ''}${shot.view}`}>
        <div className={styles.thumbnail}><Image src={imageSource(shot.car, shot.image, true)} alt="" fill unoptimized sizes="(max-width: 600px) 45vw, 23vw"
          style={{ transformOrigin: shot.origin, transform: `scale(${shot.car === 'porsche' && shot.image === '07-exhaust' ? 1 : shot.from[2]})` }} /></div>
        <span className={styles.shotLabel}><small>{number(index + 1)}</small><span>{car === 'mix' ? cars[shot.car].short + ' · ' : ''}{shot.view}</span><ArrowUpRight size={14} /></span>
      </button>)}</div>
      <div className={styles.studyFoot}><span>{car === 'mix' ? 'Three cars. Thirty photographs. Ten viewpoints.' : `Ten photographs. Ten viewpoints. One ${vehicle.short}.`}</span><Link href="/studio/orbit-frames">Previous motion study <ArrowUpRight size={12} /></Link></div>
    </section>
  </div>;
}
