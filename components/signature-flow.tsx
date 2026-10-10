'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Pause, Play } from 'lucide-react';
import { Reveal } from './reveal';

export function SignatureFlow() {
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<Awaited<ReturnType<typeof import('./flow-scene').createFlowScene>> | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const host = stage.current;
    if (!host) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 901px) and (pointer: fine)');
    let disposed = false, loading = false, version = 0;
    const load = async () => {
      if (disposed || loading || scene.current || motion.matches || !desktop.matches) return;
      loading = true;
      const request = ++version;
      try {
        const { createFlowScene } = await import('./flow-scene');
        if (disposed || request !== version) return;
        const next = await createFlowScene(host);
        if (disposed || request !== version || motion.matches || !desktop.matches) { next.dispose(); return; }
        scene.current = next; setReady(true);
      } catch { /* The SVG artwork remains visible if WebGL is unavailable. */ }
      finally { loading = false; }
    };
    let near = false;
    const observer = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; if (near) void load(); }, { rootMargin: '350px' });
    observer.observe(host);
    const preference = () => {
      if (motion.matches || !desktop.matches) { version++; scene.current?.dispose(); scene.current = null; setReady(false); setPaused(false); }
      else if (near) void load();
    };
    motion.addEventListener('change', preference); desktop.addEventListener('change', preference);
    return () => { disposed = true; version++; observer.disconnect(); scene.current?.dispose(); scene.current = null; motion.removeEventListener('change', preference); desktop.removeEventListener('change', preference); };
  }, []);
  return <section className="signature-flow" aria-labelledby="flow-title">
    <Reveal className="flow-heading"><div className="tiny-label"><span className="flow-dot" /> Form meets force</div><h2 id="flow-title">Shaped by air.<br /><span>Defined by purpose.</span></h2></Reveal>
    <div ref={stage} className={`flow-stage ${ready ? 'flow-ready' : ''}`} aria-hidden="true"><div className="flow-fallback" /></div>
    <div className="flow-bottom"><p>Sculpted for movement.<br /><span>Precision in every surface.</span></p><a href="#expertise" className="flow-next">Explore our expertise <ArrowDown size={17} /></a>{ready && <button className="flow-pause" aria-label={paused ? 'Play artwork animation' : 'Pause artwork animation'} aria-pressed={paused} onClick={() => { scene.current?.pause(!paused); setPaused(!paused); }}>{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? 'Play motion' : 'Pause motion'}</span></button>}</div>
  </section>;
}
