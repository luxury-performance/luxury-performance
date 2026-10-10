'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { createStudio, View } from './scene';
import styles from './studio.module.css';

const parts = [
  { name: 'ESTESO widebody', detail: 'Painted arch extensions. Four corners, one wider stance.', code: 'F6 666 00', slug: 'novitec-esteso-widebody-kit-pu-rim-primed-for-painting-purosangue' },
  { name: 'Rear side-panel inserts', detail: 'Visible carbon accents along the lower rear body.', code: 'F6 666 86', slug: 'novitec-esteso-side-panel-inserts-rear-visible-carbon-factory-carbon-side-panels-purosangue' },
  { name: 'Roof spoiler RACE', detail: 'Visible carbon. A continuation of the roofline.', code: 'F6 666 82', slug: 'novitec-esteso-roofspoiler-race-visible-carbon-not-with-electric-inside-rear-mirror-purosangue' },
  { name: 'Rear spoiler lip', detail: 'Three pieces following the edge of the tailgate.', code: 'F6 666 28', slug: 'novitec-rearspoiler-visible-carbon-purosangue' },
  { name: 'NF10 forged wheels', detail: '22-inch front / 23-inch rear. Centre-lock look.', code: 'NF10', slug: 'novitec-nf10-wheel-set-purosangue' },
  { name: 'Twin tailpipe assemblies', detail: 'Two assemblies. Four outlets. Black finish.', code: 'F1 666 17 / 18', slug: 'novitec-tailpipes-black-2pcs-purosangue' },
];

export function PurosangueStudio() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createStudio> | null>(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(false);
  const [progress, setProgress] = useState(1), [playing, setPlaying] = useState(false);
  const [view, setView] = useState<View>('Perspective');
  useEffect(() => {
    let cancelled = false;
    import('./scene').then(({ createStudio }) => {
      if (cancelled || !host.current) return;
      scene.current = createStudio(host.current, setProgress, () => setPlaying(false)); setReady(true);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; scene.current?.dispose(); scene.current = null; };
  }, []);
  const active = Math.min(5, Math.floor(progress * 6));
  const part = parts[active];
  function seek(value: number) { setPlaying(false); scene.current?.setProgress(value); }
  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>Luxury Performance / Design studies / 01</p><h1>Purosangue<span>by NOVITEC.</span></h1></div>
      <p className={styles.note}>An interactive assembly study.<br />Custom geometry · proportions and fitment under review.</p>
    </div>
    <section className={styles.stage} aria-label="Interactive Purosangue 3D prototype">
      <div ref={host} className={styles.canvas} aria-label="Drag to rotate the car. Use camera buttons for alternate views." />
      {!ready && <div className={styles.loading}>{error ? '3D could not start on this device. Try a browser with WebGL enabled.' : 'Preparing the studio…'}</div>}
      <div className={styles.stageLabel}><span>PUROSANGUE / ESTESO</span><span>01 — VISUAL PROTOTYPE</span></div>
      <div className={styles.viewButtons} aria-label="Camera views">{(['Perspective', 'Front', 'Side', 'Rear', 'Top'] as View[]).map(v => <button key={v} disabled={!ready} aria-pressed={view === v} onClick={() => { setView(v); scene.current?.setView(v); }}>{v}</button>)}</div>
      <p className={styles.hint}>Drag to orbit · Pinch or scroll to zoom</p>
    </section>
    <section className={styles.controls} aria-label="Assembly controls">
      <div className={styles.transport}><button disabled={!ready} className={styles.play} onClick={() => { if (playing) scene.current?.pause(); else scene.current?.play(); setPlaying(!playing); }}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause' : 'Play assembly'}</button><button disabled={!ready} className={styles.reset} onClick={() => seek(0)} aria-label="Reset to exploded view"><RotateCcw size={17} /></button></div>
      <div className={styles.timeline}><div><button disabled={!ready} onClick={() => seek(0)}>Exploded</button><span>{Math.round(progress * 100)}%</span><button disabled={!ready} onClick={() => seek(1)}>Installed</button></div><input disabled={!ready} type="range" min="0" max="1000" value={Math.round(progress * 1000)} aria-label="Assembly progress" onChange={e => seek(Number(e.target.value) / 1000)} /></div>
    </section>
    <div className={styles.details}>
      <nav className={styles.parts} aria-label="Assembly components">{parts.map((p, i) => <button key={p.name} disabled={!ready} aria-current={active === i ? 'step' : undefined} onClick={() => seek((i + .5) / 6)}><span>0{i + 1}</span>{p.name}</button>)}</nav>
      <article className={styles.detail}><p className={styles.eyebrow}>The component / {part.code}</p><h2>{part.name}</h2><p>{part.detail}</p><a href={`https://lxpforged.com/products/${part.slug}`} target="_blank" rel="noreferrer">Explore the actual product <ArrowUpRight size={16} /></a></article>
    </div>
    <p className={styles.footnote}>This is an approximate 3D design study, not an official Ferrari or NOVITEC model. Product photographs remain the reference for the actual parts. <a href="/prototypes/purosangue-reference.png" target="_blank" rel="noreferrer">View generated concept sheet ↗</a></p>
  </div>;
}
