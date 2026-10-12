'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, MoveHorizontal, Pause, Play, RotateCcw, X } from 'lucide-react';
import { clamp, completeAt, filmChapters, filmFrame, type FilmGeometry } from './motion';
import styles from './film.module.css';

type FilmControl = { seek: (value: number) => void; play: () => void; stop: () => void; compare: (value: boolean) => void };

export function PurosangueFilm() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const composition = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGPathElement>(null);
  const control = useRef<FilmControl | null>(null);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [split, setSplit] = useState(50);
  const [reduced, setReduced] = useState(false);
  const [loaded, setLoaded] = useState({ stock: false, novitec: false });
  const titleId = useId();
  const imageReady = loaded.stock && loaded.novitec;
  const current = filmChapters[chapter];
  const complete = chapter === filmChapters.length - 1;

  useEffect(() => {
    const section = root.current;
    const frameEl = stage.current;
    if (!section || !frameEl) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 700px)');
    let raf = 0, playRaf = 0, disposed = false, isComparing = false;
    let target = 0, progress = 0, selected = -1, start = 0, distance = 1;
    let headerHeight = 112;
    let geometry: FilmGeometry = { width: 1, height: 1, rigWidth: 1, rigHeight: 1, rigX: 0, rigY: 0, small: false };

    function paint(value: number, instant = false) {
      progress = clamp(value);
      const f = filmFrame(progress, geometry, isComparing);
      const simple = preference.matches || isComparing;
      frameEl!.style.setProperty('--camera-scale', String(f.scale));
      frameEl!.style.setProperty('--camera-x', `${f.x}px`);
      frameEl!.style.setProperty('--camera-y', `${f.y}px`);
      frameEl!.dataset.detail = String(Boolean(f.pin) && !isComparing);
      if (f.pin) {
        const { x, y } = f.pin;
        // Labels stay readable while the point stays attached to the photographed part.
        const labelX = clamp(x + (geometry.small ? 38 : 85), 8, geometry.width - (geometry.small ? 168 : 190));
        const labelY = clamp(y + (geometry.small ? 46 : 70), 24, geometry.height - 35);
        frameEl!.style.setProperty('--pin-x', `${x}px`);
        frameEl!.style.setProperty('--pin-y', `${y}px`);
        frameEl!.style.setProperty('--label-x', `${labelX}px`);
        frameEl!.style.setProperty('--label-y', `${labelY}px`);
        const visible = x > 6 && x < geometry.width - 6 && y > 8 && y < geometry.height - 10;
        frameEl!.style.setProperty('--pin-visible', visible ? '1' : '0');
        leader.current?.setAttribute('d', `M ${x} ${y} L ${labelX - 12} ${labelY + 7} L ${labelX - 3} ${labelY + 7}`);
      }
      frameEl!.style.setProperty('--upgrade-cut', `${(1 - f.reveal) * 100}%`);
      frameEl!.style.setProperty('--reveal-position', `${f.reveal * 100}%`);
      frameEl!.style.setProperty('--scan-opacity', f.reveal > .01 && f.reveal < .99 ? '.65' : '0');
      frameEl!.style.setProperty('--light-x', `${-120 + f.light * 290}%`);
      frameEl!.style.setProperty('--car-light', String(simple ? 1 : f.brightness));
      frameEl!.style.setProperty('--word-opacity', String(simple ? .20 : f.word * .20));
      frameEl!.style.setProperty('--film-progress', String(progress));
      frameEl!.dataset.chapter = String(f.chapter);
      frameEl!.dataset.instant = String(instant || preference.matches);
      if (selected !== f.chapter) { selected = f.chapter; setChapter(f.chapter); }
    }

    function render() {
      raf = 0;
      if (disposed || isComparing) return;
      const delta = target - progress;
      paint(preference.matches || Math.abs(delta) < .0006 ? target : progress + delta * .14);
      if (Math.abs(target - progress) >= .0006) raf = requestAnimationFrame(render);
    }

    function stop() {
      cancelAnimationFrame(playRaf); playRaf = 0; setPlaying(false);
    }

    function measure() {
      headerHeight = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().height ?? 112;
      section!.style.setProperty('--film-header', `${headerHeight}px`);
      start = section!.getBoundingClientRect().top + window.scrollY - headerHeight;
      distance = Math.max(1, section!.offsetHeight - frameEl!.offsetHeight);
      const area = composition.current;
      const car = rig.current;
      if (area && car) geometry = { width: area.clientWidth, height: area.clientHeight, rigWidth: car.offsetWidth, rigHeight: car.offsetHeight, rigX: car.offsetLeft, rigY: car.offsetTop, small: mobile.matches };
      paint(progress, preference.matches);
      onScroll();
    }

    function onScroll() {
      if (preference.matches || isComparing) return;
      target = clamp((window.scrollY - start) / distance);
      if (!raf) raf = requestAnimationFrame(render);
    }

    function seek(value: number) {
      stop();
      isComparing = false; setComparing(false);
      target = clamp(value);
      if (preference.matches) { paint(target, true); return; }
      window.scrollTo({ top: start + target * distance, behavior: 'instant' });
      if (!raf) raf = requestAnimationFrame(render);
    }

    function play() {
      if (playRaf) { stop(); return; }
      if (preference.matches) return;
      isComparing = false; setComparing(false);
      const from = progress >= .90 ? 0 : progress;
      const started = performance.now();
      const duration = (1 - from) * 32000;
      setPlaying(true);
      const tick = (now: number) => {
        if (disposed) return;
        const value = from + (1 - from) * clamp((now - started) / duration);
        target = value;
        window.scrollTo({ top: start + distance * value, behavior: 'instant' });
        if (!raf) raf = requestAnimationFrame(render);
        if (value < 1) playRaf = requestAnimationFrame(tick);
        else { playRaf = 0; setPlaying(false); }
      };
      playRaf = requestAnimationFrame(tick);
    }

    function compare(value: boolean) {
      stop();
      isComparing = value; setComparing(value); target = completeAt;
      cancelAnimationFrame(raf); raf = 0;
      if (!preference.matches) window.scrollTo({ top: start + distance * completeAt, behavior: 'instant' });
      paint(completeAt, true);
    }

    function onPreference() {
      stop(); setReduced(preference.matches);
      section!.dataset.motion = preference.matches ? 'reduced' : 'full';
      measure();
      if (preference.matches) { target = completeAt; paint(target, true); }
    }
    function onKey(event: KeyboardEvent) {
      const interactive = event.target instanceof HTMLElement && event.target.closest('button, input, a, textarea, select');
      if (!interactive && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stop();
      if (event.key === 'Escape' && isComparing) compare(false);
    }
    control.current = { seek, play, stop, compare };
    onPreference();
    const resize = new ResizeObserver(measure);
    resize.observe(section); resize.observe(frameEl);
    if (composition.current) resize.observe(composition.current);
    if (rig.current) resize.observe(rig.current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    document.addEventListener('keydown', onKey);
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    preference.addEventListener('change', onPreference);
    return () => {
      disposed = true; cancelAnimationFrame(raf); cancelAnimationFrame(playRaf); resize.disconnect();
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure);
      window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop);
      document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVisibility);
      preference.removeEventListener('change', onPreference); control.current = null;
    };
  }, []);

  const seek = (index: number) => control.current?.seek(filmChapters[index].at);

  return <section ref={root} className={styles.film} id="purosangue" aria-labelledby={titleId}>
    <div ref={stage} className={`${styles.stage} ${comparing ? styles.comparing : ''}`} data-chapter="0">
      <div className={styles.topline}>
        <a className={styles.edition} href="#purosangue"><span />The transformation series <i>/ 001</i></a>
        <span className={styles.signature}>FERRARI <span>×</span> NOVITEC</span>
        <button className={styles.compareButton} disabled={!imageReady} aria-pressed={comparing} onClick={() => control.current?.compare(!comparing)}>{comparing ? <X size={14} /> : <MoveHorizontal size={15} />}<span>{comparing ? 'Close comparison' : 'Before / after'}</span></button>
      </div>

      <div ref={composition} className={styles.composition}>
        <div className={styles.word} aria-hidden="true">PUROSANGUE</div>
        <div className={styles.copy} key={chapter}>
          <p className={styles.kicker}>{comparing ? 'Two expressions. One extraordinary car.' : current.kicker}</p>
          <h2 id={titleId}>{comparing ? <>See the<br />difference.</> : current.title.split('\n').map((line, i) => <span key={line} className={i === 1 ? styles.muted : ''}>{line}</span>)}</h2>
          <p className={styles.description}>{comparing ? 'Drag to explore the original car and the NOVITEC expression.' : current.description}</p>
        </div>

        <div className={styles.floor} aria-hidden="true"><span /><span /></div>
        <div ref={rig} className={styles.carRig}>
          <div className={styles.camera}>
            <div className={styles.carShadow} aria-hidden="true" />
            <Image className={styles.carImage} src="/images/purosangue-film/stock.png" alt="Original red Ferrari Purosangue, shown from the rear left" width={1672} height={941} sizes="(max-width: 700px) 260vw, 180vw" quality={90} loading="eager" draggable={false} onLoad={() => setLoaded(s => ({ ...s, stock: true }))} />
            <div className={styles.upgraded} style={comparing ? { clipPath: `inset(0 ${100 - split}% 0 0)` } : undefined}>
              <Image className={styles.carImage} src="/images/purosangue-film/novitec-refined.png" alt="Illustrative NOVITEC ESTESO build with painted widebody arches, NF10 wheels, carbon details and black tailpipes" width={1672} height={941} sizes="(max-width: 700px) 260vw, 180vw" quality={90} loading="eager" draggable={false} onLoad={() => setLoaded(s => ({ ...s, novitec: true }))} />
            </div>
            <div className={styles.lightMask} aria-hidden="true"><span /></div>
            <span className={styles.revealLine} aria-hidden="true" />
            {comparing && <input className={styles.dragCompare} type="range" min="0" max="100" value={split} aria-label="Drag image comparison" aria-valuetext={`${split}% NOVITEC, ${100 - split}% original`} onChange={event => setSplit(Number(event.target.value))} /> }
            {comparing && <div className={styles.compareLine} style={{ left: `${split}%` }} aria-hidden="true"><span><MoveHorizontal size={17} /></span></div>}
          </div>
        </div>

        <div className={styles.annotation} aria-hidden="true">
          <svg className={styles.leader}><path ref={leader} /></svg>
          <span className={styles.pin} />
          <span className={styles.callout}>{current.detail}</span>
        </div>
        <div className={styles.sceneIndex} aria-hidden="true"><span>0{chapter + 1}</span><i>/ 0{filmChapters.length}</i></div>
        <span className={styles.sceneCaption}>{chapter === 0 ? 'ORIGINAL CONFIGURATION' : 'NOVITEC / DESIGN VISUALISATION'}</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlTop}>
          {comparing ? <label className={styles.compareControl}><span>Original</span><input type="range" min="0" max="100" value={split} aria-label="Reveal NOVITEC build" aria-valuetext={`${split}% NOVITEC, ${100 - split}% original`} onChange={event => setSplit(Number(event.target.value))} /><span>NOVITEC</span></label> : <div className={styles.transport}>
            {complete && !playing ? <button className={styles.play} disabled={!imageReady} onClick={() => control.current?.compare(true)}><MoveHorizontal size={15} /><span>Compare before / after</span></button> : !reduced && <button className={styles.play} disabled={!imageReady} onClick={() => control.current?.play()} aria-label={playing ? 'Pause transformation film' : 'Play transformation film'}>{playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}<span>{playing ? 'Pause film' : imageReady ? 'Play film' : 'Preparing images'}</span></button>}
            <button className={styles.replay} aria-label="Return to original car" onClick={() => seek(0)}><RotateCcw size={14} /></button>
            <span className={styles.scrollHint}>{complete ? 'Explore both builds' : reduced ? 'Choose a chapter to explore' : 'Scroll to transform'}{!reduced && !complete && <ArrowDown size={12} />}</span>
          </div>}
          <Link className={styles.enquire} href="/contact?interest=A%20complete%20programme&programme=NOVITEC%20Purosangue&vehicle=Ferrari%20Purosangue">Make it yours <ArrowUpRight size={17} /></Link>
        </div>
        <nav className={styles.chapters} aria-label="Transformation chapters">
          {filmChapters.map((item, index) => <button type="button" key={item.name} aria-current={chapter === index ? 'step' : undefined} onClick={() => seek(index)}><span className={styles.chapterNumber}>0{index + 1}</span><span>{item.name}</span><span className={styles.chapterDot} /></button>)}
        </nav>
        <div className={styles.footline}><span>Illustrative visualisation. Final specification confirmed with our team.</span><Link href="/programmes/novitec-ferrari">Explore the NOVITEC programme <ArrowUpRight size={12} /></Link></div>
      </div>
    </div>
  </section>;
}
