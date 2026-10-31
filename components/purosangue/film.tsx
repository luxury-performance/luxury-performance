'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, MoveHorizontal, Pause, Play, RotateCcw, X } from 'lucide-react';
import { clamp, completeAt, filmChapters, filmFrame, filmTiming, type FilmGeometry } from './motion';
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
  const [loaded, setLoaded] = useState({ stock: false, novitec: false, spoilers: false, roof: false });
  const [mediaNear, setMediaNear] = useState(false);
  const titleId = useId();
  const imageReady = loaded.stock && loaded.novitec && loaded.spoilers && loaded.roof;
  const current = filmChapters[chapter];
  const complete = chapter === filmChapters.length - 1;

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    let frame = 0;
    let disposed = false;
    let ready = false;
    let observer: IntersectionObserver | null = null;
    const schedule = () => { if (!disposed && !ready && !frame) frame = requestAnimationFrame(prepare); };
    const stopWatching = () => {
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
    function prepare() {
      frame = 0;
      if (disposed || ready) return;
      const bounds = section!.getBoundingClientRect();
      if (bounds.top > window.innerHeight + 1000 || bounds.bottom < -1000) return;
      // Clipped upgrade layers cannot rely on native lazy visibility to become ready.
      ready = true;
      setMediaNear(true);
      stopWatching();
    }
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) schedule(); }, { rootMargin: '1000px 0px' });
      observer.observe(section);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => { disposed = true; cancelAnimationFrame(frame); stopWatching(); };
  }, []);

  useEffect(() => {
    const section = root.current;
    const frameEl = stage.current;
    if (!section || !frameEl) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 700px)');
    let raf = 0, playRaf = 0, seekRaf = 0, seeking = false, disposed = false, isComparing = false;
    type CameraPose = { scale: number; x: number; y: number };
    let cameraPose: CameraPose = { scale: 1, x: 0, y: 0 };
    let target = 0, progress = 0, selected = -1, start = 0, distance = 1;
    let headerHeight = 112;
    let viewportWidth = window.innerWidth;
    // Keep Safari's expanding browser controls out of the scroll timeline geometry.
    function captureViewport() {
      viewportWidth = window.innerWidth;
      section!.style.setProperty('--film-viewport-height', `${window.innerHeight}px`);
      section!.dataset.compact = String(mobile.matches && window.innerHeight <= 690);
    }
    captureViewport();
    let geometry: FilmGeometry = { width: 1, height: 1, rigWidth: 1, rigHeight: 1, rigX: 0, rigY: 0, small: false };

    const painted = new Map<string, string>();
    let leaderPath = '';
    const data = (name: string, value: string) => {
      if (frameEl!.dataset[name] !== value) frameEl!.dataset[name] = value;
    };
    const property = (name: string, value: string) => {
      if (painted.get(name) === value) return;
      painted.set(name, value);
      frameEl!.style.setProperty(name, value);
    };

    function paint(value: number, instant = false, mix = 1, fromPose: CameraPose = { scale: 1, x: 0, y: 0 }) {
      progress = clamp(value);
      const f = filmFrame(progress, geometry, isComparing);
      if (mix < 1) {
        f.scale = fromPose.scale + (f.scale - fromPose.scale) * mix;
        f.x = fromPose.x + (f.x - fromPose.x) * mix;
        f.y = fromPose.y + (f.y - fromPose.y) * mix;
        f.pin = null;
      }
      cameraPose = { scale: f.scale, x: f.x, y: f.y };
      const simple = preference.matches || mobile.matches || isComparing;
      property('--camera-scale', String(f.scale));
      property('--camera-x', `${f.x}px`);
      property('--camera-y', `${f.y}px`);
      data('detail', String((Boolean(f.pin) || Math.abs(f.scale - 1) > .01) && !isComparing));
      if (!f.pin) property('--pin-visible', '0');
      if (f.pin) {
        const { x, y } = f.pin;
        // Labels stay readable while the point stays attached to the photographed part.
        const labelX = clamp(x + (geometry.small ? 38 : 85), 8, geometry.width - (geometry.small ? 168 : 190));
        const labelY = clamp(y + (geometry.small ? 46 : 70), 24, geometry.height - 35);
        property('--pin-x', `${x}px`);
        property('--pin-y', `${y}px`);
        property('--label-x', `${labelX}px`);
        property('--label-y', `${labelY}px`);
        const visible = x > 6 && x < geometry.width - 6 && y > 8 && y < geometry.height - 10;
        property('--pin-visible', visible ? '1' : '0');
        const path = `M ${x} ${y} L ${labelX - 12} ${labelY + 7} L ${labelX - 3} ${labelY + 7}`;
        if (path !== leaderPath) { leaderPath = path; leader.current?.setAttribute('d', path); }
      }
      property('--upgrade-cut', `${(1 - f.reveal) * 100}%`);
      property('--reveal-position', `${f.reveal * 100}%`);
      property('--scan-opacity', f.reveal > .01 && f.reveal < .99 ? '.65' : '0');
      property('--light-x', `${-120 + f.light * 290}%`);
      property('--car-light', String(simple ? 1 : f.brightness));
      property('--word-opacity', String(simple ? .20 : f.word * .20));
      property('--film-progress', String(progress));
      data('chapter', String(f.chapter));
      data('instant', String(instant || preference.matches));
      if (selected !== f.chapter) { selected = f.chapter; setChapter(f.chapter); }
    }

    function render() {
      raf = 0;
      if (disposed || isComparing || seeking) return;
      const delta = target - progress;
      paint(preference.matches || mobile.matches || Math.abs(delta) < .0006 ? target : progress + delta * .14);
      if (Math.abs(target - progress) >= .0006) raf = requestAnimationFrame(render);
    }

    function stop() {
      cancelAnimationFrame(playRaf); playRaf = 0;
      cancelAnimationFrame(seekRaf); seekRaf = 0; seeking = false;
      delete frameEl!.dataset.transition;
      setPlaying(false);
    }

    function measure() {
      headerHeight = document.querySelector<HTMLElement>('.site-header')?.getBoundingClientRect().height ?? 112;
      section!.style.setProperty('--film-header', `${headerHeight}px`);
      start = section!.getBoundingClientRect().top + window.scrollY - headerHeight;
      distance = Math.max(1, section!.offsetHeight - frameEl!.offsetHeight);
      const area = composition.current;
      const car = rig.current;
      if (area && car) geometry = { width: area.clientWidth, height: area.clientHeight, rigWidth: car.offsetWidth, rigHeight: car.offsetHeight, rigX: car.offsetLeft, rigY: car.offsetTop, small: mobile.matches };
      if (mobile.matches && !preference.matches && !isComparing && !seeking) {
        target = clamp((window.scrollY - start) / distance);
        paint(target);
      } else {
        paint(progress, preference.matches, seeking ? 0 : 1, cameraPose);
        onScroll();
      }
    }

    function onResize() {
      if (mobile.matches && Math.abs(window.innerWidth - viewportWidth) < 2) return;
      captureViewport();
      measure();
    }

    function onScroll() {
      if (preference.matches || isComparing || seeking) return;
      target = clamp((window.scrollY - start) / distance);
      if (!raf) raf = requestAnimationFrame(render);
    }

    function seek(value: number) {
      stop();
      isComparing = false; setComparing(false);
      target = clamp(value);
      if (preference.matches) { paint(target, true); return; }
      const from = progress;
      const originalAt = filmChapters[0].at;
      const revealEnd = filmTiming.reveal[1];
      const fromOriginal = from < revealEnd;
      const toOriginal = target < filmTiming.widebodyZoom[0];
      if (!fromOriginal || !toOriginal) {
        cancelAnimationFrame(raf); raf = 0;
        seeking = true;
        window.scrollTo({ top: start + target * distance, behavior: 'instant' });
        type Step = { from: number; to: number; fromMix: number; toMix: number; duration: number; name: string; cameraFrom?: CameraPose };
        const steps: Step[] = [];
        if (!fromOriginal && !toOriginal) {
          steps.push({ from: target, to: target, fromMix: 0, toMix: 1, cameraFrom: cameraPose, duration: 450, name: 'direct-detail' });
        } else if (toOriginal) {
          if (Math.abs(cameraPose.scale - 1) > .01) {
            steps.push({ from: revealEnd, to: revealEnd, fromMix: 0, toMix: 1, cameraFrom: cameraPose, duration: 320, name: 'overview' });
          }
          steps.push({ from: revealEnd, to: target, fromMix: 0, toMix: 0, duration: 950, name: 'restore-original' });
        } else {
          steps.push({ from: Math.max(originalAt, from), to: revealEnd, fromMix: 0, toMix: 0, duration: 950, name: 'transform' });
          if (Math.abs(filmFrame(target, geometry).scale - 1) > .01) {
            steps.push({ from: target, to: target, fromMix: 0, toMix: 1, duration: 380, name: 'detail' });
          }
        }
        let index = 0;
        let began: number | null = null;
        const tick = (now: number) => {
          if (disposed || !seeking) return;
          if (began === null) began = now;
          const step = steps[index];
          const t = clamp((now - began) / step.duration);
          const eased = t * t * (3 - 2 * t);
          frameEl!.dataset.transition = step.name;
          paint(step.from + (step.to - step.from) * eased, false, step.fromMix + (step.toMix - step.fromMix) * eased, step.cameraFrom);
          if (t >= 1) { index++; began = now; }
          if (index < steps.length) seekRaf = requestAnimationFrame(tick);
          else {
            seekRaf = 0; seeking = false;
            delete frameEl!.dataset.transition;
            paint(target);
          }
        };
        seekRaf = requestAnimationFrame(tick);
        return;
      }
      window.scrollTo({ top: start + target * distance, behavior: 'instant' });
      if (!raf) raf = requestAnimationFrame(render);
    }

    function play() {
      if (playRaf) { stop(); return; }
      if (seeking) stop();
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
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    document.addEventListener('keydown', onKey);
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    preference.addEventListener('change', onPreference);
    return () => {
      disposed = true; cancelAnimationFrame(raf); cancelAnimationFrame(playRaf); cancelAnimationFrame(seekRaf); resize.disconnect();
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize);
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
            <Image className={`${styles.carImage} ${styles.original}`} style={comparing ? { clipPath: `inset(0 0 0 ${split}%)` } : undefined} src="/images/purosangue-film/stock.png" alt="Original red Ferrari Purosangue, shown from the rear left" width={1672} height={941} sizes="(max-width: 700px) 260vw, 180vw" quality={90} loading={mediaNear ? 'eager' : 'lazy'} draggable={false} onLoad={() => setLoaded(s => ({ ...s, stock: true }))} />
            <div className={styles.upgraded} style={comparing ? { clipPath: `inset(0 ${100 - split}% 0 0)` } : undefined}>
              <Image className={`${styles.carImage} ${styles.retainedBody}`} src="/images/purosangue-film/stock.png" alt="" aria-hidden="true" width={1672} height={941} sizes="(max-width: 700px) 260vw, 180vw" quality={90} loading={mediaNear ? 'eager' : 'lazy'} draggable={false} />
              <Image className={`${styles.carImage} ${styles.upgradeParts}`} src="/images/purosangue-film/novitec.png" alt="Illustrative NOVITEC ESTESO build with painted widebody arches, NF10 wheels, carbon details and black tailpipes" width={1672} height={941} sizes="(max-width: 700px) 260vw, 180vw" quality={90} loading={mediaNear ? 'eager' : 'lazy'} draggable={false} onLoad={() => setLoaded(s => ({ ...s, novitec: true }))} />
              <Image className={`${styles.carImage} ${styles.roofParts}`} src="/images/purosangue-film/roof-user-selected.png" alt="" aria-hidden="true" width={1672} height={941} sizes="(max-width: 700px) 260vw, 180vw" quality={90} loading={mediaNear ? 'eager' : 'lazy'} draggable={false} onLoad={() => setLoaded(s => ({ ...s, roof: true }))} />
              <Image className={`${styles.carImage} ${styles.spoilerParts}`} src="/images/purosangue-film/rear-lip-fitted.png" alt="" aria-hidden="true" width={1672} height={941} sizes="(max-width: 700px) 260vw, 180vw" quality={90} loading={mediaNear ? 'eager' : 'lazy'} draggable={false} onLoad={() => setLoaded(s => ({ ...s, spoilers: true }))} />
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

      <div className={styles.controls} data-film-controls>
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
        <div className={styles.footline}><span>Illustrative visualisation. Final specification confirmed with our team.</span><Link href="/partners/novitec">Explore NOVITEC <ArrowUpRight size={12} /></Link></div>
      </div>
    </div>
  </section>;
}
