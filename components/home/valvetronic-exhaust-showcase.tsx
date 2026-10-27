'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Move, Pause, Plus, Minus, RotateCcw, Rotate3D, ArrowUpRight, Play } from 'lucide-react';
import type { ExhaustFinish, ExhaustScene, ExhaustView } from './valvetronic-exhaust-scene';
import { EXHAUST_ROUTE_LEGEND } from './valvetronic-exhaust-palette';
import styles from './valvetronic-exhaust-showcase.module.css';

const views: Array<{ key: ExhaustView; label: string; number: string; detail: string }> = [
  { key: 'overview', label: 'Photo angle', number: '01', detail: 'A comparison view based on the reference photo.' },
  { key: 'welds', label: 'Rear return', number: '02', detail: 'Inspect the C-shaped return and its two shared joins.' },
  { key: 'front', label: 'Front view', number: '03', detail: 'Compare the front loop openings and the two inner turns.' },
  { key: 'reverse', label: 'Rear view', number: '04', detail: 'A different perspective on the complete assembly.' },
  { key: 'entry', label: 'Entry bend', number: '05', detail: 'Close-up of the upward turn into the blue entry.' },
];

const homeViews: typeof views = [
  {key:'overview',label:'The full system',number:'01',detail:'Sculptural form. Every curve on display.'},
  {key:'entry',label:'The finer details',number:'02',detail:'Explore the welds, hardware and finish up close.'},
  {key:'reverse',label:'Another perspective',number:'03',detail:'A different angle on the same obsession.'},
];

export function ValvetronicExhaustShowcase({ initialIsolated = false, initialRouteColors = false, cinematic = false }: { initialIsolated?: boolean; initialRouteColors?: boolean; cinematic?: boolean } = {}) {
  const section = useRef<HTMLElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<ExhaustScene | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [view, setView] = useState<ExhaustView>('overview');
  const [finish, setFinish] = useState<ExhaustFinish>('titanium');
  const [rotating, setRotating] = useState(cinematic);
  const [entered, setEntered] = useState(false);
  const [photography, setPhotography] = useState(false);
  const [isolated, setIsolated] = useState(initialIsolated);
  const [routeColors, setRouteColors] = useState(initialRouteColors);

  const preferences = useRef({ isolated, routeColors, finish, view, rotating });
  useEffect(() => { preferences.current = { isolated, routeColors, finish, view, rotating }; }, [isolated, routeColors, finish, view, rotating]);

  useEffect(() => {
    let disposed = false;
    let started = false;
    const observer = new IntersectionObserver(entries => {
      if (started || !entries[0].isIntersecting || !mount.current) return;
      started = true; observer.disconnect();
      import('./valvetronic-exhaust-scene').then(({ createExhaustScene }) => {
        if (disposed || !mount.current) return;
        scene.current = createExhaustScene(mount.current, {
          cinematic,
          initialMotion: preferences.current.rotating,
          onReveal: () => { if(!disposed) setEntered(true); },
          initialIsolated: preferences.current.isolated,
          initialRouteColors: preferences.current.routeColors,
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
          onInteract: () => { if (!disposed) setRotating(false); },
          onError: () => { if (!disposed) { setStatus('unavailable'); setPhotography(true); setEntered(true); } },
        });
        // Fast Refresh can rebuild the renderer while keeping React state.
        // Reapply the selected material so its button and the 3D agree.
        scene.current.finish(preferences.current.finish);
        if (preferences.current.view !== 'overview') scene.current.view(preferences.current.view);
        if(cinematic && preferences.current.view==='overview') scene.current.reveal();
        else scene.current.rotate(preferences.current.rotating);
        if(cinematic && matchMedia('(prefers-reduced-motion: reduce)').matches) setRotating(false);
        setStatus('ready');
      }).catch(() => { if (!disposed) { setStatus('unavailable'); setPhotography(true); setEntered(true); } });
    }, { rootMargin: '350px' });
    if (section.current) observer.observe(section.current);
    return () => { disposed = true; observer.disconnect(); scene.current?.dispose(); scene.current = null; };
  }, [initialIsolated, initialRouteColors, cinematic]);

  function replay() {
    setView('overview'); setPhotography(false); setIsolated(false);
    setRotating(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    scene.current?.reveal();
  }
  function chooseView(value: ExhaustView) {
    if (value === 'entry') { setIsolated(false); setPhotography(false); scene.current?.isolate(false); }
    setView(value); setRotating(false); scene.current?.view(value);
  }
  function chooseFinish(value: ExhaustFinish) { setFinish(value); setRouteColors(false); scene.current?.routeColors(false); scene.current?.finish(value); }
  function chooseIsolation(value: boolean) {
    setIsolated(value); setPhotography(false); setRotating(false);
    scene.current?.isolate(value); scene.current?.rotate(false); chooseView('overview');
  }
  function choosePhotography(value: boolean) {
    setPhotography(value); setRotating(false); scene.current?.rotate(false);
  }

  return <section ref={section} id="valvetronic-exhaust" data-routing-revision="owner-finished-28-inward-clamps" data-surface-revision="approved-model-cinematic-01" data-entered={entered} className={`${styles.section} ${cinematic ? styles.cinematic : ''}`} aria-labelledby="valvetronic-exhaust-title">
    <div className={styles.topline}><span>Valvetronic Designs / Special Ops</span><span>{cinematic ? 'The art of being heard' : 'Interactive design study'}</span></div>
    <div className={styles.layout}>
      <div className={styles.copy}>
        {cinematic ? <>
          <p className={styles.productEyebrow}>Lamborghini Huracán / True F1</p>
          <h3 id="valvetronic-exhaust-title" className={styles.productTitle}>Sound,<br /><em>sculpted.</em></h3>
          <p className={styles.productIntro}>The Valvetronic Designs Special Ops system.<br />Every curve. Every weld. Every detail.</p>
        </> : <h3 id="valvetronic-exhaust-title" className="sr-only">Exhaust route colours</h3>}
        {!cinematic && routeColors && !photography && <details className={styles.routeKey}>
          <summary>Section colours</summary>
          <ol className={styles.routeLegend} aria-label="Pipe route colours">
            {EXHAUST_ROUTE_LEGEND.map(item => <li key={item.label}>
              <i style={{ background: item.color }} aria-hidden="true" /><span>{item.number}</span>{item.label}
            </li>)}
          </ol>
        </details>}
        <fieldset className={styles.finishes} disabled={status !== 'ready' || photography}>
          <legend>Explore the finish</legend>
          <button type="button" aria-pressed={!routeColors && finish === 'titanium'} onClick={() => chooseFinish('titanium')}><span className={styles.titanium} aria-hidden="true" />Titanium</button>
          <button type="button" aria-pressed={!routeColors && finish === 'stainless'} onClick={() => chooseFinish('stainless')}><span className={styles.stainless} aria-hidden="true" />Stainless</button>
        </fieldset>
        {!cinematic && <button type="button" className={styles.routeToggle} aria-pressed={routeColors} disabled={status !== 'ready' || photography} onClick={() => { setRouteColors(!routeColors); scene.current?.routeColors(!routeColors); }}><span aria-hidden="true" />Route colours</button>}
        {cinematic && <Link href="/shop?brand=valvetronic&make=lamborghini&q=Huracan" className={styles.productLink}>Explore the system <ArrowUpRight size={18} strokeWidth={1.4} aria-hidden="true" /></Link>}

      </div>
      <div className={styles.visual}>
        {cinematic ? <div className={styles.liveLabel}><span aria-hidden="true" /> Explore in 3D</div> : <div className={styles.mode} aria-label="Choose product view">
          <button type="button" aria-pressed={!photography && !isolated} disabled={status !== 'ready'} onClick={() => { chooseIsolation(false); choosePhotography(false); }}>3D</button>
          <button type="button" aria-pressed={isolated && !photography} disabled={status !== 'ready'} onClick={() => chooseIsolation(true)}>Left tube</button>
          <button type="button" aria-pressed={photography} onClick={() => choosePhotography(true)}>Photo</button>
        </div>}
        <div className={styles.stage}>
          <div ref={mount} inert={photography || status !== 'ready'} aria-hidden={photography || status !== 'ready'} className={`${styles.canvas} ${status === 'ready' && !photography ? styles.visible : ''}`} />
          <div aria-hidden={!photography && status === 'ready'} className={`${styles.photography} ${photography || status !== 'ready' ? styles.visible : ''}`}>
            <Image src="/images/home/valvetronic-huracan-exhaust-reference.webp" alt="Valvetronic Designs Huracán exhaust with mirrored pipe routing, welds and a Special Ops centre plate" fill sizes="(max-width: 700px) 100vw, 65vw" />
          </div>
        </div>
        {!photography && status === 'ready' && <div className={styles.stageFooter}>
          <span id="valvetronic-exhaust-help" className={styles.drag}><Move size={15} strokeWidth={1.25} aria-hidden="true" />Drag freely · pinch to zoom</span>
          <div className={styles.tools}>
            <button type="button" aria-label="Zoom out exhaust" onClick={() => scene.current?.zoom(1)}><Minus size={16} aria-hidden="true" /></button>
            <button type="button" aria-label="Zoom in exhaust" onClick={() => scene.current?.zoom(-1)}><Plus size={16} aria-hidden="true" /></button>
            <button type="button" aria-label={cinematic ? rotating ? 'Pause motion' : 'Resume motion' : rotating ? 'Pause exhaust rotation' : 'Rotate exhaust automatically'} aria-pressed={rotating} onClick={() => { scene.current?.rotate(!rotating); setRotating(!rotating); }}>{rotating ? <Pause size={16} aria-hidden="true" /> : cinematic ? <Play size={16} aria-hidden="true" /> : <Rotate3D size={17} aria-hidden="true" />}</button>
            <button type="button" aria-label={cinematic ? 'Replay the reveal' : 'Reset exhaust view'} onClick={() => cinematic ? replay() : chooseView('overview')}><RotateCcw size={16} aria-hidden="true" /></button>
          </div>
        </div>}
      </div>
    </div>

    <div className={styles.bottom}>
      <div className={styles.views} aria-label="Explore exhaust details">
        {(cinematic ? homeViews : views).map(item => <button key={item.key} type="button" disabled={status !== 'ready' || photography} aria-pressed={view === item.key} onClick={() => chooseView(item.key)}><span>{item.number}</span>{item.label}</button>)}
      </div>
      <p className={styles.detail} aria-live="polite">{photography ? 'Original product photography.' : isolated ? 'Left tube with its connected C-shaped return.' : (cinematic ? homeViews : views).find(item => item.key === view)?.detail}</p>
    </div>
  </section>;
}
