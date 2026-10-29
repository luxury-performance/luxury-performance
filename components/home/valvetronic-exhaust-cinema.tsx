'use client';
// @refresh reset

import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ExhaustScene, ExhaustFinish } from './valvetronic-exhaust-scene';
import { exhaustScrollPose } from './valvetronic-exhaust-motion';
import styles from './valvetronic-exhaust-cinema.module.css';

export function ValvetronicExhaustCinema() {
  const revision='broll-mobile-budget-15';
  const section=useRef<HTMLElement>(null);
  const pin=useRef<HTMLDivElement>(null);
  const mount=useRef<HTMLDivElement>(null);
  const scene=useRef<ExhaustScene|null>(null);
  const selectedFinish=useRef<ExhaustFinish>('titanium');
  const [finish,setFinish]=useState<ExhaustFinish>('titanium');
  const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');

  useEffect(() => {
    let disposed=false,started=false,failed=false,frame=0,generation=0;
    const mobile=matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
    const preloadDistance=mobile?1600:2400;
    // Fetch the module ahead of the section; build the scene only when approaching it.
    const sceneModule=import('./valvetronic-exhaust-scene');
    void sceneModule.catch(()=>{});
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      frame=0;
      if(!section.current || !pin.current) return;
      // The final hold and the cover each have their own scroll space.
      const bounds=section.current.getBoundingClientRect();
      if(mobile && started && (bounds.bottom<-window.innerHeight*2 || bounds.top>window.innerHeight+preloadDistance*2)) release();
      if(!started && approaching(bounds)) start();
      const hold=Number(getComputedStyle(section.current).getPropertyValue('--cinema-final-hold'));
      const length=section.current.offsetHeight-pin.current.offsetHeight*(2+hold);
      const progress=motion.matches ? 1 : Math.max(0,Math.min(1,-bounds.top/Math.max(1,length)));
      const pose=exhaustScrollPose(progress);
      pin.current.style.setProperty('--type-opacity',String(pose.typeOpacity));
      pin.current.style.setProperty('--detail-opacity',String(pose.detailOpacity));
      pin.current.style.setProperty('--hint-opacity',String(pose.hintOpacity));
      section.current.dataset.progress=progress.toFixed(3);
      scene.current?.progress(progress);
    }
    function queue() { if(!frame) frame=requestAnimationFrame(update); }
    function approaching(bounds:DOMRect) {
      return bounds.top<window.innerHeight+preloadDistance && bounds.bottom>-(mobile?window.innerHeight:preloadDistance);
    }
    function release() {
      if(!started) return;
      generation++;started=false;failed=false;
      scene.current?.dispose();scene.current=null;setStatus('loading');
      if(section.current) observer.observe(section.current);
    }
    function start() {
      if(disposed || started || document.hidden || !mount.current || !section.current || !approaching(section.current.getBoundingClientRect())) return;
      const run=++generation;
      started=true; observer.disconnect();setStatus('loading');
      sceneModule.then(async ({createExhaustScene}) => {
        if(disposed || run!==generation || !mount.current) return;
        const next=createExhaustScene(mount.current,{
          cinematic:true,reducedMotion:motion.matches,
          onInteract:()=>{}, onError:()=>{if(disposed || run!==generation) return;failed=true;setStatus('unavailable');},
        });
        scene.current=next;
        next.finish(selectedFinish.current);
        update();
        await next.prepare();
        if(disposed || run!==generation || failed || scene.current!==next) return;
        update();
        if(!disposed && run===generation && !failed && scene.current===next) setStatus('ready');
      }).catch(()=>{
        if(disposed || run!==generation) return;
        failed=true;scene.current?.dispose();scene.current=null;setStatus('unavailable');
      });
    }
    const observer=new IntersectionObserver(entries => {
      if(entries.some(entry=>entry.isIntersecting)) start();
    },{rootMargin:`${preloadDistance}px 0px`});
    const resize=new ResizeObserver(queue);
    if(section.current) {observer.observe(section.current);resize.observe(section.current);}
    if(pin.current) resize.observe(pin.current);
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue);
    motion.addEventListener('change',queue);
    const pageVisibility=()=>{if(mobile && document.hidden) release();else queue();};
    document.addEventListener('visibilitychange',pageVisibility);
    update();
    return () => {
      disposed=true;generation++; observer.disconnect(); resize.disconnect();cancelAnimationFrame(frame);
      window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);
      motion.removeEventListener('change',queue);
      document.removeEventListener('visibilitychange',pageVisibility);
      scene.current?.dispose();scene.current=null;
    };
  },[revision]);

  function chooseFinish(value: ExhaustFinish) { selectedFinish.current=value;setFinish(value);scene.current?.finish(value); }

  return <section ref={section} id="valvetronic-exhaust" className={styles.section} aria-labelledby="exhaust-cinema-title" data-cinema-revision={revision} data-scene-status={status}>
    <div ref={pin} className={styles.pin}>
      <div className={styles.topline}><span>Valvetronic Designs / True F1</span><span>Lamborghini Huracán</span></div>
      <h3 id="exhaust-cinema-title" className="sr-only">Valvetronic Designs — Huracán valved exhaust system</h3>
      <svg className={styles.wordmark} viewBox="0 0 893 208" aria-hidden="true" focusable="false"><image href="/brand/valvetronic-wordmark.svg" width="893" height="208"/></svg>
      <div ref={mount} className={`${styles.canvas} ${status==='ready'?styles.ready:''}`} aria-hidden={status!=='ready'}/>
      {status==='loading' && <p role="status" className={styles.loading}><i aria-hidden="true"/>Loading the details</p>}
      {status==='unavailable' && <p role="status" className={styles.loading}>Explore the Huracán system below.</p>}
      <div className={styles.bottom}>
        <div className={styles.caption}><p>Every curve. One unmistakable sound.</p><Link href="/partners/valvetronic">Explore Valvetronic Designs <ArrowUpRight size={17} strokeWidth={1.4}/></Link></div>
        <span className={styles.scrollHint}>Scroll to reveal <ArrowDown size={15} strokeWidth={1.2} aria-hidden="true"/></span>
        <fieldset className={styles.finishes} disabled={status!=='ready'}><legend className="sr-only">Exhaust finish</legend>
          <button type="button" aria-pressed={finish==='titanium'} onClick={()=>chooseFinish('titanium')}><i className={styles.titanium} aria-hidden="true"/>Titanium</button>
          <button type="button" aria-pressed={finish==='stainless'} onClick={()=>chooseFinish('stainless')}><i className={styles.stainless} aria-hidden="true"/>Stainless</button>
        </fieldset>
      </div>
    </div>
  </section>;
}
